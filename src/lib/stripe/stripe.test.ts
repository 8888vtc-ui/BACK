/**
 * Tests unitaires de l'infrastructure Stripe Billing & Webhooks :
 * - Catalogue des offres (`price_coach_monthly` à 9,99 €, `price_coach_yearly` à 79,99 € avec 7j d'essai)
 * - Route API `/api/stripe/checkout` (session `subscription`, URLs de retour `/lobby?subscription=success` et `/pricing?canceled=true`, `user_id` en metadata et `client_reference_id`)
 * - Route API `/api/stripe/webhook` (validation stricte HMAC-SHA256 `stripe.webhooks.constructEvent`, synchronisation Supabase `profiles` pour `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    stripe,
    STRIPE_PLANS,
    STRIPE_PRICE_IDS,
    generateStripeWebhookSignature,
    StripeSignatureVerificationError,
} from './stripeClient';
import { POST as checkoutPOST } from '../../app/api/stripe/checkout/route';
import { POST as webhookPOST } from '../../app/api/stripe/webhook/route';
import { supabase } from '../supabase/client';

describe('Stripe Billing, Checkout & Webhooks', () => {
    const testSecret = 'whsec_test_backgammon_secret_key_2026';

    beforeEach(() => {
        process.env.STRIPE_WEBHOOK_SECRET = testSecret;
        vi.restoreAllMocks();
    });

    it('expose le catalogue officiel : Mensuel 9,99 € TTC et Annuel 79,99 € TTC (-33 %, 7j d’essai)', () => {
        expect(STRIPE_PLANS.coach_monthly.priceId).toBe('price_coach_monthly');
        expect(STRIPE_PLANS.coach_monthly.priceEur).toBe(9.99);
        expect(STRIPE_PLANS.coach_monthly.trialPeriodDays).toBe(0);

        expect(STRIPE_PLANS.coach_yearly.priceId).toBe('price_coach_yearly');
        expect(STRIPE_PLANS.coach_yearly.priceEur).toBe(79.99);
        expect(STRIPE_PLANS.coach_yearly.trialPeriodDays).toBe(7);
        expect(STRIPE_PLANS.coach_yearly.badgeFr).toBe('Économisez 33 % — 6,67 € / mois');
    });

    it('POST /api/stripe/checkout crée une session subscription avec trial_period_days=7 et user_id en metadata', async () => {
        const req = new Request('http://localhost:3000/api/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Origin: 'https://backgammontour.app',
            },
            body: JSON.stringify({
                priceId: STRIPE_PRICE_IDS.YEARLY,
                userId: 'user-uuid-42',
                email: 'player@backgammontour.app',
            }),
        });

        const res = await checkoutPOST(req);
        expect(res.status).toBe(200);

        const data = (await res.json()) as {
            sessionId: string;
            url: string;
            tier: string;
            priceId: string;
            trialPeriodDays: number;
            successUrl: string;
            cancelUrl: string;
        };

        expect(data.tier).toBe('coach_yearly');
        expect(data.priceId).toBe('price_coach_yearly');
        expect(data.trialPeriodDays).toBe(7);
        expect(data.successUrl).toBe('https://backgammontour.app/lobby?subscription=success');
        expect(data.cancelUrl).toBe('https://backgammontour.app/pricing?canceled=true');
        expect(data.url).toContain('/lobby?subscription=success');
    });

    it('stripe.webhooks.constructEvent valide une signature HMAC-SHA256 authentique et rejette une signature falsifiée', () => {
        const payload = JSON.stringify({
            id: 'evt_test_1',
            object: 'event',
            type: 'checkout.session.completed',
            data: { object: { id: 'cs_test_1' } },
        });

        const validSig = generateStripeWebhookSignature(payload, testSecret);
        const event = stripe.webhooks.constructEvent(payload, validSig, testSecret);
        expect(event.id).toBe('evt_test_1');
        expect(event.type).toBe('checkout.session.completed');

        expect(() =>
            stripe.webhooks.constructEvent(payload, 't=1700000000,v1=deadbeef', testSecret),
        ).toThrow(StripeSignatureVerificationError);
    });

    it('POST /api/stripe/webhook traite checkout.session.completed et synchronise profiles dans Supabase', async () => {
        const eqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });
        vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateSpy,
        } as unknown as ReturnType<typeof supabase.from>);

        const payload = JSON.stringify({
            id: 'evt_checkout_1',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_yearly_1',
                    object: 'checkout.session',
                    mode: 'subscription',
                    client_reference_id: 'user-vip-99',
                    customer: 'cus_stripe_99',
                    subscription: 'sub_stripe_99',
                    metadata: {
                        user_id: 'user-vip-99',
                        subscription_tier: 'coach_yearly',
                        price_id: 'price_coach_yearly',
                    },
                },
            },
        });

        const signature = generateStripeWebhookSignature(payload, testSecret);
        const req = new Request('http://localhost:3000/api/stripe/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature,
            },
            body: payload,
        });

        const res = await webhookPOST(req);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            received: boolean;
            subscription_tier: string;
            subscription_status: string;
            stripe_customer_id: string;
            stripe_subscription_id: string;
        };

        expect(body.received).toBe(true);
        expect(body.subscription_tier).toBe('coach_yearly');
        expect(body.subscription_status).toBe('active');
        expect(body.stripe_customer_id).toBe('cus_stripe_99');
        expect(body.stripe_subscription_id).toBe('sub_stripe_99');

        expect(updateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                subscription_tier: 'coach_yearly',
                subscription_status: 'active',
                stripe_customer_id: 'cus_stripe_99',
                stripe_subscription_id: 'sub_stripe_99',
            }),
        );
        expect(eqSpy).toHaveBeenCalledWith('id', 'user-vip-99');
    });

    it('POST /api/stripe/webhook traite customer.subscription.deleted et repasse le statut à canceled', async () => {
        const eqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });
        vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateSpy,
        } as unknown as ReturnType<typeof supabase.from>);

        const payload = JSON.stringify({
            id: 'evt_sub_del_1',
            object: 'event',
            type: 'customer.subscription.deleted',
            data: {
                object: {
                    id: 'sub_stripe_99',
                    customer: 'cus_stripe_99',
                    status: 'canceled',
                    metadata: {
                        user_id: 'user-vip-99',
                    },
                },
            },
        });

        const signature = generateStripeWebhookSignature(payload, testSecret);
        const req = new Request('http://localhost:3000/api/stripe/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': signature,
            },
            body: payload,
        });

        const res = await webhookPOST(req);
        expect(res.status).toBe(200);

        const body = (await res.json()) as {
            received: boolean;
            subscription_tier: string;
            subscription_status: string;
        };
        expect(body.received).toBe(true);
        expect(body.subscription_tier).toBe('free');
        expect(body.subscription_status).toBe('canceled');
    });
});
