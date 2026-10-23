/**
 * Catalogue des Offres et Types Stripe Partagés (Client & Serveur).
 * Zéro dépendance Node.js (100 % compatible Browser & App Router Client Components).
 */

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
        titleEn: 'Yearly',
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
    '⚜ Blunder review library with spaced repetition.',
    '⚜ Unlimited daily tactical puzzles.',
    '⚜ Zero ads, Zero distractions, Support a 100% independent platform.',
] as const;

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
