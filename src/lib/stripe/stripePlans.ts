/**
 * Catalogue des Offres et Types Stripe Partagés (Client & Serveur).
 * Zéro dépendance Node.js (100 % compatible Browser & App Router Client Components).
 *
 * Implémente l'architecture à 3 paliers payants avec Effet Leurre (Decoy Pricing) :
 * - Palier 1 (Starter / Leurre) : `coach_monthly` — 9,99 € TTC / mois (1 siège, 9,99 € / siège)
 * - Palier 2 (Cible / "Le Plus Populaire") : `coach_yearly` — 79,99 € TTC / an (6,67 € / mois, -33 % soit 39,89 € / an d'économie, 7j d'essai)
 * - Palier 3 (Ancrage Haut / Club & Chouette) : `club_chouette` — 149,99 € TTC / an (5 sièges, soit 2,50 € / mois / joueur, 14j d'essai)
 */

import type { SubscriptionStatus, SubscriptionTier } from '../supabase/types';

export const STRIPE_PRICE_IDS = {
    MONTHLY: 'price_coach_monthly',
    YEARLY: 'price_coach_yearly',
    CLUB_CHOUETTE: 'price_club_chouette',
} as const;

export type StripePriceId = (typeof STRIPE_PRICE_IDS)[keyof typeof STRIPE_PRICE_IDS];

export type PaidSubscriptionTier = 'coach_monthly' | 'coach_yearly' | 'club_chouette';

/** Garantie Satisfait ou Remboursé 30 jours sans condition (+34 % de conversion selon ConversionXL). */
export const MONEY_BACK_GUARANTEE_DAYS = 30;

export interface StripePlanConfig {
    readonly tier: PaidSubscriptionTier;
    readonly role: 'decoy' | 'target_popular' | 'high_anchor';
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
    readonly annualSavingsEur: number;
    readonly annualSavingsLabelFr?: string;
    readonly annualSavingsLabelEn?: string;
    readonly seatsIncluded: number;
    readonly unitCostPerSeatMonthlyFr: string;
    readonly unitCostPerSeatMonthlyEn: string;
    readonly badgeFr?: string;
    readonly badgeEn?: string;
    readonly recommended: boolean;
}

export const STRIPE_PLANS: Record<PaidSubscriptionTier, StripePlanConfig> = {
    coach_monthly: {
        tier: 'coach_monthly',
        role: 'decoy',
        priceId: STRIPE_PRICE_IDS.MONTHLY,
        titleFr: 'Mensuel',
        titleEn: 'Monthly',
        priceEur: 14.99,
        priceCents: 1499,
        priceFormattedFr: '14,99 € TTC / mois',
        priceFormattedEn: '€14.99 / month',
        monthlyEquivalentFr: '14,99 € / mois',
        monthlyEquivalentEn: '€14.99 / month',
        interval: 'month',
        trialPeriodDays: 0,
        discountPercent: 0,
        annualSavingsEur: 0,
        seatsIncluded: 1,
        unitCostPerSeatMonthlyFr: '14,99 € / mois (1 joueur)',
        unitCostPerSeatMonthlyEn: '€14.99 / mo (1 player)',
        recommended: false,
    },
    coach_yearly: {
        tier: 'coach_yearly',
        role: 'target_popular',
        priceId: STRIPE_PRICE_IDS.YEARLY,
        titleFr: 'Annuel',
        titleEn: 'Yearly',
        priceEur: 99.0,
        priceCents: 9900,
        priceFormattedFr: '99,00 € TTC / an',
        priceFormattedEn: '€99.00 / year',
        monthlyEquivalentFr: '8,25 € / mois',
        monthlyEquivalentEn: '€8.25 / month',
        interval: 'year',
        trialPeriodDays: 7,
        discountPercent: 45,
        annualSavingsEur: 80.88,
        annualSavingsLabelFr: 'Économisez 45 % — soit 80,88 € / an',
        annualSavingsLabelEn: 'Save 45% — €80.88 / year',
        seatsIncluded: 1,
        unitCostPerSeatMonthlyFr: '8,25 € / mois (1 joueur)',
        unitCostPerSeatMonthlyEn: '€8.25 / mo (1 player)',
        badgeFr: 'Économisez 45 % — 8,25 € / mois',
        badgeEn: 'Save 45% — €8.25 / month',
        recommended: true,
    },
    club_chouette: {
        tier: 'club_chouette',
        role: 'high_anchor',
        priceId: STRIPE_PRICE_IDS.CLUB_CHOUETTE,
        titleFr: 'Pack Club & Chouette (5 Comptes)',
        titleEn: 'Club & Chouette Pack (5 Seats)',
        priceEur: 149.99,
        priceCents: 14999,
        priceFormattedFr: '149,99 € TTC / an',
        priceFormattedEn: '€149.99 / year',
        monthlyEquivalentFr: '12,50 € / mois (2,50 € / joueur)',
        monthlyEquivalentEn: '€12.50 / mo (€2.50 / player)',
        interval: 'year',
        trialPeriodDays: 14,
        discountPercent: 75,
        annualSavingsEur: 449.41,
        annualSavingsLabelFr: 'Économisez 75 % par siège — soit 449,41 € / an',
        annualSavingsLabelEn: 'Save 75% per seat — €449.41 / year',
        seatsIncluded: 5,
        unitCostPerSeatMonthlyFr: '2,50 € / mois par joueur (5 sièges)',
        unitCostPerSeatMonthlyEn: '€2.50 / mo per player (5 seats)',
        badgeFr: 'Ancrage Club — 5 Comptes VIP (2,50 € / mois / joueur)',
        badgeEn: 'Club Anchor — 5 VIP Seats (€2.50 / mo / player)',
        recommended: false,
    },
};

/**
 * Frise chronologique visuelle de l'essai (Adapty 2026 Trial-Format Timeline Screen : +64,5 % en A/B test).
 */
export interface TrialTimelineStep {
    readonly dayLabelFr: string;
    readonly dayLabelEn: string;
    readonly titleFr: string;
    readonly titleEn: string;
    readonly descFr: string;
    readonly descEn: string;
}

export const TRIAL_TIMELINE_STEPS: ReadonlyArray<TrialTimelineStep> = [
    {
        dayLabelFr: 'Aujourd’hui (Jour 0)',
        dayLabelEn: 'Today (Day 0)',
        titleFr: 'Accès VIP Immédiat — 0,00 € débité',
        titleEn: 'Instant VIP Access — €0.00 charged',
        descFr: 'Déblocage instantané du Coach IA illimité, de la banque FSRS et des puzzles 3-Ply.',
        descEn: 'Instant unlock of unlimited AI Coach, FSRS blunder bank, and 3-Ply puzzles.',
    },
    {
        dayLabelFr: 'Jour 5',
        dayLabelEn: 'Day 5',
        titleFr: 'Rappel de transparence par email',
        titleEn: 'Transparency email reminder',
        descFr: 'Notification automatique 48h avant la fin de votre essai gratuit.',
        descEn: 'Automatic notification 48h before your free trial ends.',
    },
    {
        dayLabelFr: 'Jour 7 (+ 30j Garantie)',
        dayLabelEn: 'Day 7 (+ 30d Guarantee)',
        titleFr: 'Activation annuelle ou résiliation 1-clic',
        titleEn: 'Annual activation or 1-click cancel',
        descFr: 'Facturation couverte par notre garantie Satisfait ou Remboursé pendant 30 jours sans condition.',
        descEn: 'Billing covered by our unconditional 30-day money-back guarantee.',
    },
] as const;

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
 * Résout le tier d'abonnement payant (`coach_monthly`, `coach_yearly` ou `club_chouette`) à partir d'un identifiant de prix Stripe.
 */
export function resolveTierFromPriceId(
    priceId?: string | null,
): PaidSubscriptionTier {
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
    if (
        normalized === STRIPE_PRICE_IDS.CLUB_CHOUETTE ||
        normalized === process.env.NEXT_PUBLIC_STRIPE_PRICE_CLUB_CHOUETTE?.toLowerCase() ||
        normalized.includes('club') ||
        normalized.includes('chouette')
    ) {
        return 'club_chouette';
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
        case 'paused':
            return 'paused';
        case 'canceled':
        case 'incomplete_expired':
            return 'canceled';
        case 'incomplete':
            return 'incomplete';
        default:
            return 'none';
    }
}

export type { SubscriptionTier };
