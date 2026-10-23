/**
 * Route API Next.js App Router — Réception et Synchronisation des Webhooks Stripe (`/api/stripe/webhook`).
 *
 * Événements traités :
 * 1. `checkout.session.completed` :
 *    Met à jour la table Supabase `profiles` avec :
 *      - `subscription_tier = 'coach_yearly' | 'coach_monthly'`
 *      - `subscription_status = 'active'`
 *      - `stripe_customer_id`
 *      - `stripe_subscription_id`
 * 2. `customer.subscription.updated` & `customer.subscription.deleted` :
 *    Met à jour le statut (`active`, `past_due`, `canceled`) et synchronise le tier dans `profiles`.
 *
 * Sécurité :
 *    Validation stricte de la signature cryptographique via `stripe.webhooks.constructEvent`.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    stripe,
    resolveTierFromPriceId,
    mapStripeSubscriptionStatus,
    StripeSignatureVerificationError,
    type StripeCheckoutSession,
    type StripeSubscriptionObject,
} from '../../../../lib/stripe/stripeClient';
import { supabase } from '../../../../lib/supabase/client';
import type { Database, SubscriptionStatus, SubscriptionTier } from '../../../../lib/supabase/types';

export const dynamic = 'force-dynamic';

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

    const dbClient = getAdminSupabaseClient();
    const nowIso = new Date().toISOString();

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as StripeCheckoutSession;
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
            const tier: 'coach_monthly' | 'coach_yearly' =
                rawTier === 'coach_monthly' || rawTier === 'coach_yearly'
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
            const resolvedTier: SubscriptionTier =
                mappedStatus === 'canceled'
                    ? 'free'
                    : subscription.metadata?.subscription_tier === 'coach_monthly' ||
                        subscription.metadata?.subscription_tier === 'coach_yearly'
                      ? subscription.metadata.subscription_tier
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
