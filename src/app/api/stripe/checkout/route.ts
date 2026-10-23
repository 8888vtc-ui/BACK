/**
 * Route API Next.js App Router — Création d'une session Stripe Checkout (`/api/stripe/checkout`).
 *
 * Spécifications :
 * - Plan Mensuel : 9,99 € TTC / mois (`price_coach_monthly`)
 * - Plan Annuel (Recommandé / -33 %) : 79,99 € TTC / an (`price_coach_yearly`) avec 7 jours d'essai gratuit (`trial_period_days: 7`)
 * - Mode : `subscription`
 * - Redirection succès : `/lobby?subscription=success`
 * - Redirection annulation : `/pricing?canceled=true`
 * - Transmet `user_id` dans `metadata` et `client_reference_id`.
 */

import { NextRequest } from 'next/server';
import {
    stripe,
    STRIPE_PLANS,
    STRIPE_PRICE_IDS,
    resolveTierFromPriceId,
} from '../../../../lib/stripe/stripeClient';

export const dynamic = 'force-dynamic';

interface CheckoutRequestBody {
    readonly priceId?: string;
    readonly plan?: 'coach_monthly' | 'coach_yearly';
    readonly userId?: string;
    readonly email?: string;
}

function resolveOrigin(req: NextRequest | Request): string {
    const headerOrigin = req.headers.get('origin');
    if (headerOrigin && headerOrigin.startsWith('http')) {
        return headerOrigin.replace(/\/+$/, '');
    }
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '');
    }
    try {
        const url = new URL(req.url);
        return url.origin;
    } catch {
        return 'http://localhost:3000';
    }
}

export async function POST(req: NextRequest | Request): Promise<Response> {
    try {
        const body = (await req.json()) as CheckoutRequestBody | null;

        if (!body || typeof body !== 'object') {
            return Response.json(
                { error: 'Requête Checkout invalide : corps JSON requis.' },
                { status: 400 },
            );
        }

        const rawPriceId = body.priceId?.trim();
        const rawPlan = body.plan;

        if (
            rawPriceId &&
            rawPriceId !== STRIPE_PRICE_IDS.MONTHLY &&
            rawPriceId !== STRIPE_PRICE_IDS.YEARLY &&
            rawPriceId !== process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY &&
            rawPriceId !== process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY
        ) {
            return Response.json(
                {
                    error: `Identifiant de tarif Stripe non reconnu : ${rawPriceId}`,
                },
                { status: 400 },
            );
        }

        const tier: 'coach_monthly' | 'coach_yearly' =
            rawPlan === 'coach_monthly' || rawPlan === 'coach_yearly'
                ? rawPlan
                : resolveTierFromPriceId(rawPriceId ?? STRIPE_PRICE_IDS.YEARLY);

        const planConfig = STRIPE_PLANS[tier];
        const priceId = rawPriceId || planConfig.priceId;
        const userId = body.userId?.trim() || 'guest';
        const origin = resolveOrigin(req);

        const successUrl = `${origin}/lobby?subscription=success`;
        const cancelUrl = `${origin}/pricing?canceled=true`;

        const metadata: Record<string, string> = {
            user_id: userId,
            subscription_tier: tier,
            price_id: priceId,
        };

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
            customer_email: body.email?.trim() || undefined,
            metadata,
            subscription_data:
                planConfig.trialPeriodDays > 0
                    ? {
                          trial_period_days: planConfig.trialPeriodDays,
                          metadata,
                      }
                    : {
                          metadata,
                      },
        });

        return Response.json(
            {
                sessionId: session.id,
                url: session.url,
                tier,
                priceId,
                trialPeriodDays: planConfig.trialPeriodDays,
                successUrl,
                cancelUrl,
            },
            { status: 200 },
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json(
            {
                error: 'Erreur lors de la création de la session Stripe Checkout',
                details: message,
            },
            { status: 500 },
        );
    }
}
