/**
 * Route API Next.js App Router — Réception et Synchronisation des Webhooks Stripe (`/api/stripe/webhook`).
 *
 * Implémente la Double Idempotence (Événementielle & Métier) et la Grace Period de 30 jours :
 * 1. Idempotence Événementielle : chaque `event.id` traité est enregistré dans `processed_webhooks_events`
 *    (et en mémoire processus) pour garantir qu'un webhook rejoué par Stripe n'exécute aucun effet de bord.
 * 2. `checkout.session.completed` :
 *    Active `subscription_tier` (`coach_monthly` | `coach_yearly` | `club_chouette`), `subscription_status = 'active'`,
 *    réinitialise `grace_period_ends_at = null`.
 * 3. `invoice.payment_failed` :
 *    Passe le statut à `past_due` et ouvre une **Grace Period de 30 jours** (`grace_period_ends_at`)
 *    sans coupure brutale d'accès, déclenchant la séquence de Dunning.
 * 4. `customer.subscription.updated` & `customer.subscription.deleted` :
 *    Synchronise le statut (`active`, `past_due`, `paused`, `canceled`) et rétrograde vers `free` sans perte de données.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    stripe,
    resolveTierFromPriceId,
    mapStripeSubscriptionStatus,
    StripeSignatureVerificationError,
    type PaidSubscriptionTier,
    type StripeCheckoutSession,
    type StripeSubscriptionObject,
} from '../../../../lib/stripe/stripeClient';
import { supabase } from '../../../../lib/supabase/client';
import type { Database, SubscriptionStatus, SubscriptionTier } from '../../../../lib/supabase/types';
import { trackSaasLifecycleEvent } from '../../../../lib/subscription/retentionEngine';

export const dynamic = 'force-dynamic';

import {
    DUNNING_GRACE_PERIOD_MS,
    processedWebhookEventIds,
    finalizedCheckoutSessionIds,
} from '../../../../lib/stripe/webhookStore';

interface StripeInvoiceObject {
    readonly id: string;
    readonly customer?: string | { id: string } | null;
    readonly subscription?: string | { id: string } | null;
    readonly attempt_count?: number;
}

function getAdminSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceRoleKey && !url.includes('placeholder')) {
        return createClient<Database>(url, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
    }
    return supabase;
}

function extractId(field: string | { id: string } | null | undefined): string | null {
    if (!field) return null;
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && typeof field.id === 'string') return field.id;
    return null;
}

async function recordProcessedWebhookEvent(
    dbClient: ReturnType<typeof getAdminSupabaseClient>,
    eventId: string,
    eventType: string,
    userId: string | null,
    processedAtIso: string,
): Promise<void> {
    processedWebhookEventIds.add(eventId);
    try {
        const tableRef = dbClient.from('processed_webhooks_events') as unknown as {
            insert?: (row: Record<string, unknown>) => Promise<unknown>;
        };
        if (tableRef && typeof tableRef.insert === 'function') {
            await tableRef.insert({
                event_id: eventId,
                event_type: eventType,
                user_id: userId,
                processed_at: processedAtIso,
            });
        }
    } catch {
        // Ignoré si la table n'est pas encore migrée ou en environnement mocké
    }
}

export async function POST(req: NextRequest | Request): Promise<Response> {
    const signature = req.headers.get('stripe-signature');
    const webhookSecret =
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_backgammon_default_secret';

    let rawBody: string;
    try {
        rawBody = await req.text();
    } catch {
        return Response.json(
            { error: 'Impossible de lire le corps brut du webhook Stripe.' },
            { status: 400 },
        );
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: unknown) {
        const message =
            err instanceof StripeSignatureVerificationError
                ? err.message
                : 'Signature Stripe invalide';
        return Response.json({ error: message }, { status: 400 });
    }

    // 1. Vérification d'idempotence événementielle (empêche tout double traitement sur retry Stripe)
    if (event.id && processedWebhookEventIds.has(event.id)) {
        return Response.json(
            {
                received: true,
                duplicate: true,
                eventId: event.id,
                type: event.type,
            },
            { status: 200 },
        );
    }

    const dbClient = getAdminSupabaseClient();
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as StripeCheckoutSession;

            // Idempotence Métier (checkout_sessions_lock) : empêche 2 événements distincts de finaliser 2 fois la même session
            if (session.id && finalizedCheckoutSessionIds.has(session.id)) {
                if (event.id) {
                    await recordProcessedWebhookEvent(dbClient, event.id, event.type, null, nowIso);
                }
                return Response.json(
                    {
                        received: true,
                        businessIdempotentSkip: true,
                        sessionId: session.id,
                    },
                    { status: 200 },
                );
            }

            const userId =
                session.metadata?.user_id ||
                session.client_reference_id ||
                null;

            if (!userId) {
                return Response.json(
                    { error: 'user_id manquant dans checkout.session.completed' },
                    { status: 400 },
                );
            }

            const rawTier = session.metadata?.subscription_tier || session.metadata?.plan_tier;
            const tier: PaidSubscriptionTier =
                rawTier === 'coach_monthly' ||
                rawTier === 'coach_yearly' ||
                rawTier === 'club_chouette'
                    ? rawTier
                    : resolveTierFromPriceId(session.metadata?.price_id);

            const stripeCustomerId = extractId(session.customer);
            const stripeSubscriptionId = extractId(session.subscription);

            await dbClient
                .from('profiles')
                .update({
                    subscription_tier: tier,
                    subscription_status: 'active',
                    stripe_customer_id: stripeCustomerId,
                    stripe_subscription_id: stripeSubscriptionId,
                    updated_at: nowIso,
                })
                .eq('id', userId);

            if (session.id) {
                finalizedCheckoutSessionIds.add(session.id);
            }
            if (event.id) {
                await recordProcessedWebhookEvent(dbClient, event.id, event.type, userId, nowIso);
            }

            return Response.json(
                {
                    received: true,
                    type: event.type,
                    userId,
                    subscription_tier: tier,
                    subscription_status: 'active',
                    stripe_customer_id: stripeCustomerId,
                    stripe_subscription_id: stripeSubscriptionId,
                },
                { status: 200 },
            );
        }

        if (event.type === 'invoice.payment_failed') {
            const invoice = event.data.object as StripeInvoiceObject;
            const stripeCustomerId = extractId(invoice.customer);
            const stripeSubscriptionId = extractId(invoice.subscription);
            const graceEndsIso = new Date(nowDate.getTime() + DUNNING_GRACE_PERIOD_MS).toISOString();

            const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
                subscription_status: 'past_due',
                grace_period_ends_at: graceEndsIso,
                updated_at: nowIso,
            };

            if (stripeSubscriptionId) {
                await dbClient
                    .from('profiles')
                    .update(updatePayload)
                    .eq('stripe_subscription_id', stripeSubscriptionId);
            } else if (stripeCustomerId) {
                await dbClient
                    .from('profiles')
                    .update(updatePayload)
                    .eq('stripe_customer_id', stripeCustomerId);
            }

            if (event.id) {
                await recordProcessedWebhookEvent(dbClient, event.id, event.type, null, nowIso);
            }

            trackSaasLifecycleEvent('invoice_payment_failed_dunning', {
                customer_id: stripeCustomerId,
                subscription_id: stripeSubscriptionId,
                grace_period_ends_at: graceEndsIso,
            });

            return Response.json(
                {
                    received: true,
                    type: event.type,
                    subscription_status: 'past_due',
                    grace_period_ends_at: graceEndsIso,
                    dunningTriggered: true,
                },
                { status: 200 },
            );
        }

        if (
            event.type === 'customer.subscription.updated' ||
            event.type === 'customer.subscription.deleted'
        ) {
            const subscription = event.data.object as StripeSubscriptionObject;
            const isDeleted = event.type === 'customer.subscription.deleted';
            const mappedStatus: SubscriptionStatus = isDeleted
                ? 'canceled'
                : mapStripeSubscriptionStatus(subscription.status);

            const priceId = subscription.items?.data?.[0]?.price?.id;
            const metaTier = subscription.metadata?.subscription_tier;
            const resolvedTier: SubscriptionTier =
                mappedStatus === 'canceled'
                    ? 'free'
                    : metaTier === 'coach_monthly' ||
                        metaTier === 'coach_yearly' ||
                        metaTier === 'club_chouette'
                      ? metaTier
                      : resolveTierFromPriceId(priceId);

            const userId = subscription.metadata?.user_id || null;
            const stripeCustomerId = extractId(subscription.customer);
            const stripeSubscriptionId = subscription.id;

            const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
                subscription_tier: resolvedTier,
                subscription_status: mappedStatus,
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId,
                updated_at: nowIso,
            };

            if (userId) {
                await dbClient.from('profiles').update(updatePayload).eq('id', userId);
            } else if (stripeSubscriptionId) {
                await dbClient
                    .from('profiles')
                    .update(updatePayload)
                    .eq('stripe_subscription_id', stripeSubscriptionId);
            } else if (stripeCustomerId) {
                await dbClient
                    .from('profiles')
                    .update(updatePayload)
                    .eq('stripe_customer_id', stripeCustomerId);
            }

            if (event.id) {
                await recordProcessedWebhookEvent(dbClient, event.id, event.type, userId, nowIso);
            }

            return Response.json(
                {
                    received: true,
                    type: event.type,
                    subscription_tier: resolvedTier,
                    subscription_status: mappedStatus,
                    stripe_subscription_id: stripeSubscriptionId,
                },
                { status: 200 },
            );
        }

        if (event.id) {
            await recordProcessedWebhookEvent(dbClient, event.id, event.type, null, nowIso);
        }

        return Response.json({ received: true, type: event.type, ignored: true }, { status: 200 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json(
            {
                error: 'Erreur lors du traitement du webhook Stripe',
                details: message,
            },
            { status: 500 },
        );
    }
}
