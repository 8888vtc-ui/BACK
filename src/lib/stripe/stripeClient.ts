/**
 * Client Stripe Billing & Catalogue des Offres Coach Illimité (`src/lib/stripe/stripeClient.ts`).
 *
 * Modèle éthique ("Zero Ads, Zero Coins, Pure Skill") :
 * - Plan Mensuel : 9,99 € TTC / mois (`price_coach_monthly`)
 * - Plan Annuel (Recommandé / -33 %) : 79,99 € TTC / an (soit 6,67 € / mois, `price_coach_yearly`)
 *   avec 7 jours d'essai gratuit (`trial_period_days: 7`).
 *
 * Implémente :
 * - Création de sessions Stripe Checkout en mode `subscription` (`stripe.checkout.sessions.create`)
 * - Vérification cryptographique HMAC-SHA256 stricte des webhooks (`stripe.webhooks.constructEvent`)
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SubscriptionStatus, SubscriptionTier } from '../supabase/types';

export const STRIPE_PRICE_IDS = {
    MONTHLY: 'price_coach_monthly',
    YEARLY: 'price_coach_yearly',
} as const;

export type StripePriceId = (typeof STRIPE_PRICE_IDS)[keyof typeof STRIPE_PRICE_IDS];

export interface StripePlanConfig {
    readonly tier: 'coach_monthly' | 'coach_yearly';
    readonly priceId: StripePriceId;
    readonly titleFr: string;
    readonly titleEn: string;
    readonly priceEur: number;
    readonly priceCents: number;
    readonly priceFormattedFr: string;
    readonly priceFormattedEn: string;
    readonly monthlyEquivalentFr: string;
    readonly monthlyEquivalentEn: string;
    readonly interval: 'month' | 'year';
    readonly trialPeriodDays: number;
    readonly discountPercent: number;
    readonly badgeFr?: string;
    readonly badgeEn?: string;
    readonly recommended: boolean;
}

export const STRIPE_PLANS: Record<'coach_monthly' | 'coach_yearly', StripePlanConfig> = {
    coach_monthly: {
        tier: 'coach_monthly',
        priceId: STRIPE_PRICE_IDS.MONTHLY,
        titleFr: 'Mensuel',
        titleEn: 'Monthly',
        priceEur: 9.99,
        priceCents: 999,
        priceFormattedFr: '9,99 € TTC / mois',
        priceFormattedEn: '€9.99 / month',
        monthlyEquivalentFr: '9,99 € / mois',
        monthlyEquivalentEn: '€9.99 / month',
        interval: 'month',
        trialPeriodDays: 0,
        discountPercent: 0,
        recommended: false,
    },
    coach_yearly: {
        tier: 'coach_yearly',
        priceId: STRIPE_PRICE_IDS.YEARLY,
        titleFr: 'Annuel',
        titleEn: 'Annual',
        priceEur: 79.99,
        priceCents: 7999,
        priceFormattedFr: '79,99 € TTC / an',
        priceFormattedEn: '€79.99 / year',
        monthlyEquivalentFr: '6,67 € / mois',
        monthlyEquivalentEn: '€6.67 / month',
        interval: 'year',
        trialPeriodDays: 7,
        discountPercent: 33,
        badgeFr: 'Économisez 33 % — 6,67 € / mois',
        badgeEn: 'Save 33% — €6.67 / month',
        recommended: true,
    },
};

export const EXCLUSIVE_COACH_BENEFITS_FR = [
    '⚜ Analyses et explications du Coach IA illimitées.',
    '⚜ Bibliothèque de révision des gaffes avec répétition espacée.',
    '⚜ Puzzles tactiques quotidiens illimités.',
    '⚜ Zéro pub, Zéro distraction, Soutien à une plateforme 100 % indépendante.',
] as const;

export const EXCLUSIVE_COACH_BENEFITS_EN = [
    '⚜ Unlimited AI Coach match reviews and explanations.',
    '⚜ Blunder review library with spaced repetition (FSRS).',
    '⚜ Unlimited daily tactical puzzles.',
    '⚜ Zero ads, Zero distractions, Support a 100% independent platform.',
] as const;

export interface StripeCheckoutSessionCreateParams {
    readonly mode: 'subscription';
    readonly line_items: ReadonlyArray<{
        readonly price: string;
        readonly quantity: number;
    }>;
    readonly success_url: string;
    readonly cancel_url: string;
    readonly client_reference_id?: string;
    readonly customer_email?: string;
    readonly metadata?: Readonly<Record<string, string>>;
    readonly subscription_data?: {
        readonly trial_period_days?: number;
        readonly metadata?: Readonly<Record<string, string>>;
    };
}

export interface StripeCheckoutSession {
    readonly id: string;
    readonly object: 'checkout.session';
    readonly mode: 'subscription';
    readonly url: string;
    readonly client_reference_id: string | null;
    readonly customer: string | { id: string } | null;
    readonly subscription: string | { id: string } | null;
    readonly metadata: Record<string, string>;
    readonly status: 'open' | 'complete' | 'expired';
}

export interface StripeSubscriptionObject {
    readonly id: string;
    readonly object?: 'subscription';
    readonly customer: string | { id: string };
    readonly status:
        | 'active'
        | 'trialing'
        | 'past_due'
        | 'canceled'
        | 'unpaid'
        | 'incomplete'
        | 'incomplete_expired'
        | 'paused';
    readonly metadata?: Record<string, string>;
    readonly items?: {
        readonly data?: ReadonlyArray<{
            readonly price?: {
                readonly id?: string;
            };
        }>;
    };
}

export interface StripeWebhookEvent<T = unknown> {
    readonly id: string;
    readonly object: 'event';
    readonly type:
        | 'checkout.session.completed'
        | 'customer.subscription.updated'
        | 'customer.subscription.deleted'
        | string;
    readonly created?: number;
    readonly data: {
        readonly object: T;
    };
}

export class StripeSignatureVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StripeSignatureVerificationError';
    }
}

/**
 * Résout le tier d'abonnement (`coach_monthly` ou `coach_yearly`) à partir d'un identifiant de prix Stripe.
 */
export function resolveTierFromPriceId(
    priceId?: string | null,
): 'coach_monthly' | 'coach_yearly' {
    if (!priceId) return 'coach_yearly';
    const normalized = priceId.trim().toLowerCase();
    if (
        normalized === STRIPE_PRICE_IDS.MONTHLY ||
        normalized === process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY?.toLowerCase() ||
        normalized.includes('monthly') ||
        normalized.includes('month')
    ) {
        return 'coach_monthly';
    }
    return 'coach_yearly';
}

/**
 * Convertit un statut d'abonnement Stripe en statut normalisé Supabase `profiles.subscription_status`.
 */
export function mapStripeSubscriptionStatus(
    stripeStatus?: string | null,
): SubscriptionStatus {
    switch (stripeStatus) {
        case 'active':
        case 'trialing':
            return 'active';
        case 'past_due':
        case 'unpaid':
            return 'past_due';
        case 'canceled':
        case 'incomplete_expired':
            return 'canceled';
        case 'incomplete':
            return 'incomplete';
        default:
            return 'none';
    }
}

/**
 * Génère un en-tête `Stripe-Signature` valide (`t=...,v1=...`) pour un payload et un secret donnés.
 */
export function generateStripeWebhookSignature(
    payload: string,
    secret: string,
    timestampSeconds: number = Math.floor(Date.now() / 1000),
): string {
    const signedPayload = `${timestampSeconds}.${payload}`;
    const signature = createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
    return `t=${timestampSeconds},v1=${signature}`;
}

/**
 * Encode les paramètres d'une session Stripe Checkout au format `application/x-www-form-urlencoded`.
 */
function encodeStripeCheckoutForm(params: StripeCheckoutSessionCreateParams): URLSearchParams {
    const form = new URLSearchParams();
    form.set('mode', params.mode);
    form.set('success_url', params.success_url);
    form.set('cancel_url', params.cancel_url);

    params.line_items.forEach((item, index) => {
        form.set(`line_items[${index}][price]`, item.price);
        form.set(`line_items[${index}][quantity]`, String(item.quantity));
    });

    if (params.client_reference_id) {
        form.set('client_reference_id', params.client_reference_id);
    }
    if (params.customer_email) {
        form.set('customer_email', params.customer_email);
    }
    if (params.metadata) {
        for (const [k, v] of Object.entries(params.metadata)) {
            form.set(`metadata[${k}]`, v);
        }
    }
    if (params.subscription_data) {
        if (
            params.subscription_data.trial_period_days !== undefined &&
            params.subscription_data.trial_period_days > 0
        ) {
            form.set(
                'subscription_data[trial_period_days]',
                String(params.subscription_data.trial_period_days),
            );
        }
        if (params.subscription_data.metadata) {
            for (const [k, v] of Object.entries(params.subscription_data.metadata)) {
                form.set(`subscription_data[metadata][${k}]`, v);
            }
        }
    }

    return form;
}

/**
 * Instance du client Stripe unifié (Sessions Checkout + Validation stricte des Webhooks).
 */
export const stripe = {
    checkout: {
        sessions: {
            async create(
                params: StripeCheckoutSessionCreateParams,
            ): Promise<StripeCheckoutSession> {
                const secretKey = process.env.STRIPE_SECRET_KEY || '';
                const primaryPrice = params.line_items[0]?.price ?? STRIPE_PRICE_IDS.YEARLY;
                const tier: SubscriptionTier = resolveTierFromPriceId(primaryPrice);

                // Si une clé secrète Stripe réelle est configurée, appelle l'API officielle Stripe v1
                if (secretKey && secretKey.startsWith('sk_live_')) {
                    const formBody = encodeStripeCheckoutForm(params);
                    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${secretKey}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: formBody.toString(),
                    });

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(
                            `[Stripe Checkout] Échec création session (${response.status}): ${errText}`,
                        );
                    }

                    const data = (await response.json()) as StripeCheckoutSession;
                    return data;
                }

                // Mode Sandbox / Test déterministe
                const sessionId = `cs_test_${tier}_${Date.now()}`;
                const checkoutUrl = `${params.success_url}${
                    params.success_url.includes('?') ? '&' : '?'
                }session_id=${sessionId}&plan=${tier}`;

                return {
                    id: sessionId,
                    object: 'checkout.session',
                    mode: 'subscription',
                    url: checkoutUrl,
                    client_reference_id: params.client_reference_id ?? null,
                    customer: `cus_test_${params.client_reference_id ?? 'guest'}`,
                    subscription: `sub_test_${tier}`,
                    metadata: { ...(params.metadata ?? {}) },
                    status: 'open',
                };
            },
        },
    },
    webhooks: {
        /**
         * Vérifie strictement la signature `Stripe-Signature` (`t=...,v1=...`) en HMAC-SHA256
         * et retourne l'événement Stripe typé.
         */
        constructEvent<T = unknown>(
            payload: string | Buffer,
            header: string | null | undefined,
            secret: string | null | undefined,
            toleranceSeconds: number = 300,
        ): StripeWebhookEvent<T> {
            if (!header || typeof header !== 'string' || !header.trim()) {
                throw new StripeSignatureVerificationError(
                    'En-tête Stripe-Signature manquant ou vide.',
                );
            }
            if (!secret || typeof secret !== 'string' || !secret.trim()) {
                throw new StripeSignatureVerificationError(
                    'Secret de webhook Stripe (STRIPE_WEBHOOK_SECRET) non configuré.',
                );
            }

            const rawPayload =
                typeof payload === 'string' ? payload : payload.toString('utf8');

            const parts = header.split(',').map((p) => p.trim());
            let timestampStr: string | null = null;
            const signaturesV1: string[] = [];

            for (const part of parts) {
                const [key, value] = part.split('=');
                if (key === 't' && value) {
                    timestampStr = value;
                } else if (key === 'v1' && value) {
                    signaturesV1.push(value);
                }
            }

            if (!timestampStr || signaturesV1.length === 0) {
                throw new StripeSignatureVerificationError(
                    'Format de signature Stripe-Signature invalide (t ou v1 manquant).',
                );
            }

            const timestamp = Number(timestampStr);
            if (!Number.isFinite(timestamp) || timestamp <= 0) {
                throw new StripeSignatureVerificationError(
                    'Horodatage Stripe-Signature invalide.',
                );
            }

            const nowSeconds = Math.floor(Date.now() / 1000);
            if (toleranceSeconds > 0 && Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
                throw new StripeSignatureVerificationError(
                    'Horodatage du webhook Stripe hors de la fenêtre de tolérance.',
                );
            }

            const expectedSignature = createHmac('sha256', secret)
                .update(`${timestamp}.${rawPayload}`, 'utf8')
                .digest('hex');
            const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

            const isValid = signaturesV1.some((candidate) => {
                const candidateBuffer = Buffer.from(candidate, 'utf8');
                if (candidateBuffer.length !== expectedBuffer.length) {
                    return false;
                }
                return timingSafeEqual(candidateBuffer, expectedBuffer);
            });

            if (!isValid) {
                throw new StripeSignatureVerificationError(
                    'La signature HMAC-SHA256 du webhook Stripe ne correspond pas.',
                );
            }

            try {
                const parsed = JSON.parse(rawPayload) as StripeWebhookEvent<T>;
                if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
                    throw new Error('Payload JSON invalide');
                }
                return parsed;
            } catch {
                throw new StripeSignatureVerificationError(
                    'Impossible de parser le corps JSON du webhook Stripe.',
                );
            }
        },
    },
};

export default stripe;
