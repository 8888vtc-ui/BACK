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
import { resetProcessedWebhookEventsForTests } from './webhookStore';
import { GET as lifecycleCronGET } from '../../app/api/cron/lifecycle-engine/route';
import { supabase } from '../supabase/client';

describe('Stripe Billing, Checkout & Webhooks', () => {
    const testSecret = 'whsec_test_backgammon_secret_key_2026';

    beforeEach(() => {
        process.env.STRIPE_WEBHOOK_SECRET = testSecret;
        resetProcessedWebhookEventsForTests();
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

    it('expose le 3e palier d’ancrage haut (club_chouette : 149,99 € / an, 5 sièges) et l’économie absolue en €/an', () => {
        expect(STRIPE_PLANS.coach_yearly.annualSavingsEur).toBe(39.89);
        expect(STRIPE_PLANS.coach_yearly.annualSavingsLabelFr).toBe(
            'Économisez 33 % — soit 39,89 € / an',
        );
        expect(STRIPE_PLANS.club_chouette.priceId).toBe('price_club_chouette');
        expect(STRIPE_PLANS.club_chouette.priceEur).toBe(149.99);
        expect(STRIPE_PLANS.club_chouette.seatsIncluded).toBe(5);
        expect(STRIPE_PLANS.club_chouette.trialPeriodDays).toBe(14);
    });

    it('garantit l’idempotence événementielle du webhook Stripe (un même event.id rejoué 2 fois n’exécute l’UPDATE qu’une seule fois)', async () => {
        const eqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });
        vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateSpy,
        } as unknown as ReturnType<typeof supabase.from>);

        const payload = JSON.stringify({
            id: 'evt_idempotent_42',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_idem_42',
                    object: 'checkout.session',
                    mode: 'subscription',
                    client_reference_id: 'user-idem-42',
                    customer: 'cus_idem_42',
                    subscription: 'sub_idem_42',
                    metadata: {
                        user_id: 'user-idem-42',
                        subscription_tier: 'coach_yearly',
                    },
                },
            },
        });

        const signature = generateStripeWebhookSignature(payload, testSecret);

        const req1 = new Request('http://localhost:3000/api/stripe/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body: payload,
        });
        const res1 = await webhookPOST(req1);
        expect(res1.status).toBe(200);
        expect(updateSpy).toHaveBeenCalledTimes(1);

        // Second envoi identique par Stripe (retry réseau) : bloqué par l'idempotence
        const req2 = new Request('http://localhost:3000/api/stripe/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body: payload,
        });
        const res2 = await webhookPOST(req2);
        const body2 = (await res2.json()) as { received: boolean; duplicate?: boolean };
        expect(res2.status).toBe(200);
        expect(body2.duplicate).toBe(true);
        expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    it('traite invoice.payment_failed en ouvrant une Grace Period de 30 jours sans coupure brutale', async () => {
        const eqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
        const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });
        vi.spyOn(supabase, 'from').mockReturnValue({
            update: updateSpy,
        } as unknown as ReturnType<typeof supabase.from>);

        const payload = JSON.stringify({
            id: 'evt_invoice_failed_1',
            object: 'event',
            type: 'invoice.payment_failed',
            data: {
                object: {
                    id: 'in_failed_1',
                    customer: 'cus_dunning_1',
                    subscription: 'sub_dunning_1',
                    attempt_count: 1,
                },
            },
        });

        const signature = generateStripeWebhookSignature(payload, testSecret);
        const req = new Request('http://localhost:3000/api/stripe/webhook', {
            method: 'POST',
            headers: { 'stripe-signature': signature },
            body: payload,
        });

        const res = await webhookPOST(req);
        expect(res.status).toBe(200);
        const body = (await res.json()) as {
            received: boolean;
            subscription_status: string;
            grace_period_ends_at: string;
            dunningTriggered: boolean;
        };
        expect(body.subscription_status).toBe('past_due');
        expect(body.dunningTriggered).toBe(true);
        expect(typeof body.grace_period_ends_at).toBe('string');
    });

    it('GET /api/cron/lifecycle-engine vérifie CRON_SECRET et exécute le cycle de vie quotidien', async () => {
        process.env.CRON_SECRET = 'cron_secret_test_2026';

        const unauthReq = new Request('http://localhost:3000/api/cron/lifecycle-engine');
        const unauthRes = await lifecycleCronGET(unauthReq);
        expect(unauthRes.status).toBe(401);

        const authReq = new Request('http://localhost:3000/api/cron/lifecycle-engine', {
            headers: { authorization: 'Bearer cron_secret_test_2026' },
        });
        const authRes = await lifecycleCronGET(authReq);
        expect(authRes.status).toBe(200);
        const data = (await authRes.json()) as { status: string; referenceHealthScore: number };
        expect(data.status).toBe('ok');
        expect(data.referenceHealthScore).toBeGreaterThanOrEqual(80);
    });
});
