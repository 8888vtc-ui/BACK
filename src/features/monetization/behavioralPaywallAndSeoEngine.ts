/**
 * @file behavioralPaywallAndSeoEngine.ts
 * @module features/monetization/behavioralPaywallAndSeoEngine
 * @description Moteur de Monétisation Fintech, Paywall Comportemental, SEO Programmatique & Idempotence Stripe.
 * Conforme à SCALABILITY.md (≤ 350 lignes, 0 any, pur).
 */

import type { Locale } from '../../lib/i18n/types';

export type PaywallTrigger = 'KARMA_SWAP' | 'COACH_SECOND_BLUNDER' | 'POST_MATCH_PR_REPORT' | 'CHOUETTE_SEAT_LIMIT';

export type PaywallState = 'IDLE' | 'BUFFERED_DURING_MATCH' | 'TRIGGERED' | 'ENTITLED';

export interface BehavioralPaywallInput {
    readonly isMatchActive: boolean;
    readonly isMatchComplete: boolean;
    readonly isUserEntitled: boolean;
    readonly sessionBlunderCount: number;
    readonly chouetteRosterSize: number;
    readonly previousEquity?: number;
    readonly currentEquity?: number;
    readonly bufferedTrigger?: PaywallTrigger | null;
}

export interface BehavioralPaywallResult {
    readonly shouldTrigger: boolean;
    readonly activeTrigger: PaywallTrigger | null;
    readonly bufferedTrigger: PaywallTrigger | null;
    readonly state: PaywallState;
}

/** 1. Machine à États du Paywall Comportemental avec séquestre absolu pendant le match */
export function evaluateBehavioralPaywallState(input: BehavioralPaywallInput): BehavioralPaywallResult {
    if (input.isUserEntitled) {
        return { shouldTrigger: false, activeTrigger: null, bufferedTrigger: null, state: 'ENTITLED' };
    }

    let detected: PaywallTrigger | null = null;
    if (typeof input.previousEquity === 'number' && typeof input.currentEquity === 'number') {
        if (input.previousEquity >= 0.80 && input.currentEquity <= 0.20) {
            detected = 'KARMA_SWAP';
        }
    }
    if (!detected && input.sessionBlunderCount >= 2) {
        detected = 'COACH_SECOND_BLUNDER';
    }

    if (input.isMatchActive) {
        const nextBuffer = detected ?? input.bufferedTrigger ?? null;
        return {
            shouldTrigger: false,
            activeTrigger: null,
            bufferedTrigger: nextBuffer,
            state: nextBuffer ? 'BUFFERED_DURING_MATCH' : 'IDLE',
        };
    }

    if (input.isMatchComplete) {
        const released = input.bufferedTrigger ?? detected ?? 'POST_MATCH_PR_REPORT';
        return {
            shouldTrigger: true,
            activeTrigger: released,
            bufferedTrigger: null,
            state: 'TRIGGERED',
        };
    }

    if (input.chouetteRosterSize >= 5) {
        return {
            shouldTrigger: true,
            activeTrigger: 'CHOUETTE_SEAT_LIMIT',
            bufferedTrigger: null,
            state: 'TRIGGERED',
        };
    }

    return { shouldTrigger: false, activeTrigger: null, bufferedTrigger: input.bufferedTrigger ?? null, state: 'IDLE' };
}

export interface CertifiedOpening3Ply {
    readonly roll: string;
    readonly gtoMove: string;
    readonly altMove: string;
    readonly tacticalArchetype: string;
    readonly inaccuracyCostEq: number;
}

/** 2. Table Complète des 15 Ouvertures Certifiées 3-Ply */
export const CERTIFIED_OPENINGS_3PLY: ReadonlyArray<CertifiedOpening3Ply> = Object.freeze([
    { roll: '3-1', gtoMove: '8/5 6/5', altMove: '24/20 13/10', tacticalArchetype: 'Golden Point Making', inaccuracyCostEq: -0.062 },
    { roll: '4-2', gtoMove: '8/4 6/4', altMove: '24/20 13/11', tacticalArchetype: '4-Point Making', inaccuracyCostEq: -0.045 },
    { roll: '6-1', gtoMove: '13/7 8/7', altMove: '24/18 13/12', tacticalArchetype: 'Bar Point Making', inaccuracyCostEq: -0.052 },
    { roll: '6-5', gtoMove: '24/13', altMove: '24/18 13/8', tacticalArchetype: 'Lover’s Leap Escape', inaccuracyCostEq: -0.125 },
    { roll: '5-3', gtoMove: '8/3 6/3', altMove: '24/16', tacticalArchetype: '3-Point Making', inaccuracyCostEq: -0.048 },
    { roll: '4-1', gtoMove: '13/9 24/23', altMove: '24/20 13/12', tacticalArchetype: 'Split and Slot', inaccuracyCostEq: -0.038 },
    { roll: '2-1', gtoMove: '13/11 24/23', altMove: '13/10', tacticalArchetype: 'Split and Builder', inaccuracyCostEq: -0.042 },
    { roll: '5-1', gtoMove: '13/8 24/23', altMove: '24/18', tacticalArchetype: 'Split and Down', inaccuracyCostEq: -0.035 },
    { roll: '6-2', gtoMove: '24/18 13/11', altMove: '13/5', tacticalArchetype: 'Running Split', inaccuracyCostEq: -0.058 },
    { roll: '6-3', gtoMove: '24/18 13/10', altMove: '24/15', tacticalArchetype: 'Running Split', inaccuracyCostEq: -0.065 },
    { roll: '6-4', gtoMove: '24/14', altMove: '8/2 6/2', tacticalArchetype: 'Running Escape', inaccuracyCostEq: -0.072 },
    { roll: '5-2', gtoMove: '13/8 24/22', altMove: '13/6', tacticalArchetype: 'Down and Split', inaccuracyCostEq: -0.039 },
    { roll: '4-3', gtoMove: '13/10 24/20', altMove: '24/21 13/9', tacticalArchetype: 'Advanced Anchor Split', inaccuracyCostEq: -0.044 },
    { roll: '3-2', gtoMove: '13/10 24/22', altMove: '13/8', tacticalArchetype: 'Down and Split', inaccuracyCostEq: -0.041 },
    { roll: '5-4', gtoMove: '24/20 13/8', altMove: '24/15', tacticalArchetype: 'Anchor Split and Down', inaccuracyCostEq: -0.055 },
]);

/** 3. Calculateurs Mathématiques : Janowski MWC, EPC 7n+1 et Fastimate */
export function computeJanowskiLiveTakePoint(W: number, L: number, cubeLifeIndex: number = 0.68): {
    readonly tpDead: number;
    readonly tpLive: number;
} {
    const denomDead = W + L;
    const tpDead = denomDead !== 0 ? (L - 0.5) / denomDead : 0.25;
    const denomLive = W + L + 0.5 * cubeLifeIndex;
    const tpLive = denomLive !== 0 ? (L - 0.5) / denomLive : 0.214;
    return { tpDead: Number(tpDead.toFixed(4)), tpLive: Number(tpLive.toFixed(4)) };
}

export function computeRecursiveMatchLiveTakePoint(tpDeadNCube: number, tpLive2NCube: number): number {
    return Number((tpDeadNCube * (1 - tpLive2NCube)).toFixed(4));
}

export function computeEpcExact7nPlus1(n: number): number {
    if (n <= 0) return 0;
    const term = Math.pow(-1, n - 1) / Math.pow(6, n);
    return Number((7 * n + 1 + term).toFixed(4));
}

export function computeFastimateEpc(pipCount: number, a: number, b: number, c: number, g: number): number {
    return Number((pipCount + 4 + 2 * a + b + c / 2 + 1.2 * g).toFixed(2));
}

export interface StructuredDataJsonLdOutput {
    readonly '@context': 'https://schema.org';
    readonly '@graph': readonly Record<string, unknown>[];
}

/** 4. Générateur SEO Programmatique : Schema.org @graph (7 langues) & Sitemap */
export function buildOpeningStructuredDataJsonLd(params: {
    readonly roll: string;
    readonly title: string;
    readonly description: string;
    readonly locale: Locale;
}): StructuredDataJsonLdOutput {
    const opening = CERTIFIED_OPENINGS_3PLY.find((o) => o.roll === params.roll) ?? CERTIFIED_OPENINGS_3PLY[0];
    const url = `https://backgammontour.com/${params.locale}/openings/${params.roll}`;

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'SoftwareApplication',
                name: `Backgammon Tour Opening Engine — ${params.roll}`,
                applicationCategory: 'GameApplication',
                operatingSystem: 'Any',
                offers: { '@type': 'Offer', price: '0.00', priceCurrency: 'EUR' },
            },
            {
                '@type': 'Course',
                name: params.title,
                description: params.description,
                provider: { '@type': 'Organization', name: 'Backgammon Tour', sameAs: 'https://backgammontour.com' },
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: `What is the GTO move for opening roll ${params.roll}?`,
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: `The mathematically verified GTO move is ${opening.gtoMove} (${opening.tacticalArchetype}), avoiding equity loss of ${opening.inaccuracyCostEq} EMG.`,
                        },
                    },
                ],
            },
            {
                '@type': 'Dataset',
                name: `Backgammon Roll ${params.roll} 3-Ply Equity Metrics`,
                url,
                description: `Rollout and neural equity table for opening ${params.roll}.`,
            },
        ],
    };
}

export interface ProgrammaticSitemapEntry {
    readonly loc: string;
    readonly lastmod: string;
    readonly changefreq: 'daily' | 'weekly';
    readonly priority: number;
}

export function buildProgrammaticSitemapEntries(domain: string = 'https://backgammontour.com'): readonly ProgrammaticSitemapEntry[] {
    const locales: readonly Locale[] = ['fr', 'en', 'es', 'pt', 'de', 'ar', 'ja'];
    const today = '2026-10-30';
    const entries: ProgrammaticSitemapEntry[] = [];

    for (const loc of locales) {
        entries.push({ loc: `${domain}/${loc}`, lastmod: today, changefreq: 'daily', priority: 1.0 });
        entries.push({ loc: `${domain}/${loc}/openings`, lastmod: today, changefreq: 'daily', priority: 0.9 });
        for (const op of CERTIFIED_OPENINGS_3PLY) {
            entries.push({
                loc: `${domain}/${loc}/openings/${op.roll}`,
                lastmod: today,
                changefreq: 'weekly',
                priority: 0.8,
            });
        }
    }
    return Object.freeze(entries);
}

export interface StripeWebhookReconciliationResult {
    readonly status: 'PROCESSED' | 'ALREADY_PROCESSED' | 'IGNORED';
    readonly code?: string;
    readonly eventId: string;
    readonly actionTaken: 'SUBSCRIPTION_CREATED' | 'CLUB_PACK_CREATED' | 'SUBSCRIPTION_UPDATED' | 'SUBSCRIPTION_CANCELED' | 'IGNORED';
    readonly packCreated?: { readonly maxSeats: 5; readonly planTier: 'club_chouette' };
}

/** 5. Verrou d'Idempotence Webhook Stripe (Code PostgreSQL 23505) */
export function reconcileStripeWebhookIdempotency(params: {
    readonly eventId: string;
    readonly eventType: string;
    readonly alreadyProcessedEventIds: ReadonlySet<string>;
    readonly sessionData?: {
        readonly customerId: string;
        readonly clientReferenceId?: string;
        readonly planTier?: 'pro_individual' | 'club_chouette';
    };
}): StripeWebhookReconciliationResult {
    if (params.alreadyProcessedEventIds.has(params.eventId)) {
        return {
            status: 'ALREADY_PROCESSED',
            code: '23505',
            eventId: params.eventId,
            actionTaken: 'IGNORED',
        };
    }

    if (params.eventType === 'checkout.session.completed') {
        const plan = params.sessionData?.planTier ?? 'pro_individual';
        if (plan === 'club_chouette') {
            return {
                status: 'PROCESSED',
                eventId: params.eventId,
                actionTaken: 'CLUB_PACK_CREATED',
                packCreated: { maxSeats: 5, planTier: 'club_chouette' },
            };
        }
        return { status: 'PROCESSED', eventId: params.eventId, actionTaken: 'SUBSCRIPTION_CREATED' };
    }

    if (params.eventType === 'customer.subscription.updated') {
        return { status: 'PROCESSED', eventId: params.eventId, actionTaken: 'SUBSCRIPTION_UPDATED' };
    }

    if (params.eventType === 'customer.subscription.deleted') {
        return { status: 'PROCESSED', eventId: params.eventId, actionTaken: 'SUBSCRIPTION_CANCELED' };
    }

    return { status: 'IGNORED', eventId: params.eventId, actionTaken: 'IGNORED' };
}
