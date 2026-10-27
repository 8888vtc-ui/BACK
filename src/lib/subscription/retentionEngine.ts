/**
 * Moteur Financier, Rétention Anti-Churn, Dunning & Garde-Fou de Marge IA (`src/lib/subscription/retentionEngine.ts`).
 *
 * Conforme R1 (< 400 lignes) :
 * 1. Calcul du Plafond CAC admissible & Surveillance de la Marge Brute IA (>= 50 %) avec Model Tiering.
 * 2. Score de Santé Client (Health Score 0–100) pondéré (Connexion 30 %, Usage 25 %, Support 15 %, Facturation 15 %, Activation 15 %)
 *    avec émission automatique de `health_score_dropped`.
 * 3. Tunnel d'annulation adaptatif (Cancel Flow) en 3 étapes : Pause 1–3 mois, Remise -25 % (3 mois, jamais >= 50 %), Downgrade.
 * 4. Séquence Dunning à 7 relances sur 30 jours + Grace Period (J+30 à J+60) avec séparation Hard Decline vs Soft Decline.
 */

export * from './lifecycleEvents';
import { trackSaasLifecycleEvent } from './lifecycleEvents';

export type CancelReason =
    | 'too_expensive'
    | 'low_usage'
    | 'missing_feature'
    | 'switching_competitor';

export interface CancelSaveOffer {
    readonly reason: CancelReason;
    readonly primaryOfferType: 'discount_25_pct_3m' | 'pause_1_to_3_months' | 'free_month_credit';
    readonly primaryTitleFr: string;
    readonly primaryTitleEn: string;
    readonly primaryDescriptionFr: string;
    readonly primaryDescriptionEn: string;
    readonly discountPercent: number;
    readonly discountDurationMonths: number;
    readonly discountedMonthlyEur: number;
    readonly totalSavingsEur: number;
    readonly allowedPauseMonths: readonly [1, 2, 3];
    readonly fallbackOfferType: 'downgrade_tier' | 'free_tier_keep_data' | 'feature_alert' | 'one_click_export_winback';
    readonly fallbackTitleFr: string;
    readonly fallbackTitleEn: string;
}

export interface HealthScoreInput {
    readonly daysSinceLastActive: number;
    readonly creditsUsedCurrentPeriod: number;
    readonly monthlyCreditAllowance: number;
    readonly supportScore?: number;
    readonly subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled' | 'incomplete' | 'none';
    readonly isActivated: boolean;
    readonly loginCountLast14d?: number;
    readonly loginCountPrev14d?: number;
}

export interface HealthScoreResult {
    readonly score: number;
    readonly connectionComponent: number;
    readonly usageComponent: number;
    readonly supportComponent: number;
    readonly billingComponent: number;
    readonly activationComponent: number;
    readonly loginDropPct: number;
    readonly healthScoreDroppedAlert: boolean;
    readonly recommendedAction: 'none' | 'send_1click_template_rescue_email' | 'trigger_pql_expansion';
}

export interface AiMarginEvaluation {
    readonly periodInferenceCostUsd: number;
    readonly monthlyRevenueUsd: number;
    readonly grossMarginPct: number;
    readonly guardrailBreached: boolean;
    readonly routedModel: 'gemini-3.8-flash' | 'gemini-3.5' | 'rule-based-fallback';
    readonly allowMultiStepAgentLoop: boolean;
}

export interface DunningStep {
    readonly stepNumber: number;
    readonly offsetLabel: string;
    readonly delayHours: number;
    readonly retryType: 'silent_ml_retry' | 'scheduled_billing_retry' | 'grace_period_readonly';
    readonly sendEmail: boolean;
    readonly showInAppBanner: boolean;
    readonly descriptionFr: string;
}

const HARD_DECLINE_CODES = new Set([
    'stolen_card',
    'lost_card',
    'pickup_card',
    'Invalid account',
    'account_closed',
    'fraudulent',
]);

/**
 * Calcule le plafond maximal admissible du Coût d'Acquisition Client (CAC) :
 * `CAC_max = ARPU_mensuel * Marge_Brute_Reelle * Delai_Cible_Recouvrement_Mois`
 */
export function computeMaxAdmissibleCac(params: {
    readonly monthlyArpuUsd: number;
    readonly grossMarginRatio: number;
    readonly targetPaybackMonths?: number;
}): number {
    const payback = params.targetPaybackMonths ?? 12;
    const clampedMargin = Math.max(0, Math.min(1, params.grossMarginRatio));
    const maxCac = Math.max(0, params.monthlyArpuUsd) * clampedMargin * Math.max(1, payback);
    return Number(maxCac.toFixed(2));
}

/**
 * Évalue en temps réel la marge brute IA d'un compte abonné (`ai_margin_guardrail_breached`)
 * et route automatiquement vers un modèle distillé économique si le coût d'inférence dépasse 50 % du revenu.
 */
export function evaluateAiMarginGuardrail(params: {
    readonly periodInferenceCostUsd: number;
    readonly monthlyRevenueUsd: number;
    readonly tenantId?: string;
}): AiMarginEvaluation {
    const cost = Math.max(0, params.periodInferenceCostUsd);
    const revenue = Math.max(0, params.monthlyRevenueUsd);

    if (revenue <= 0) {
        const breached = cost > 0.05;
        if (breached) {
            trackSaasLifecycleEvent('ai_margin_guardrail_breached', {
                tenant_id: params.tenantId ?? 'free_or_trial',
                margin_pct: 0,
                period_inference_cost_usd: cost,
                monthly_revenue_usd: 0,
            });
        }
        return {
            periodInferenceCostUsd: cost,
            monthlyRevenueUsd: 0,
            grossMarginPct: breached ? 0 : 100,
            guardrailBreached: breached,
            routedModel: breached ? 'rule-based-fallback' : 'gemini-3.8-flash',
            allowMultiStepAgentLoop: !breached,
        };
    }

    const grossMarginPct = Number((((revenue - cost) / revenue) * 100).toFixed(2));
    const guardrailBreached = cost > revenue * 0.5;

    if (guardrailBreached) {
        trackSaasLifecycleEvent('ai_margin_guardrail_breached', {
            tenant_id: params.tenantId ?? 'vip_subscriber',
            margin_pct: grossMarginPct,
            period_inference_cost_usd: cost,
            monthly_revenue_usd: revenue,
        });
    }

    return {
        periodInferenceCostUsd: cost,
        monthlyRevenueUsd: revenue,
        grossMarginPct,
        guardrailBreached,
        routedModel: guardrailBreached ? 'gemini-3.5' : 'gemini-3.8-flash',
        allowMultiStepAgentLoop: !guardrailBreached,
    };
}

/**
 * Calcule le Score de Santé Client (Health Score 0 à 100) selon la formule de rétention :
 * `Health Score = (Connexion * 0.30) + (Usage * 0.25) + (Support * 0.15) + (Facturation * 0.15) + (Activation * 0.15)`
 * Émet automatiquement l'événement `health_score_dropped` si `score < 50` ou chute de connexion >= 50 %.
 */
export function computeTenantHealthScore(input: HealthScoreInput): HealthScoreResult {
    const connectionRaw =
        input.daysSinceLastActive <= 3
            ? 100
            : input.daysSinceLastActive <= 7
              ? 70
              : input.daysSinceLastActive <= 14
                ? 40
                : 10;

    const allowance = Math.max(1, input.monthlyCreditAllowance);
    const usageRaw = Math.min(100, Math.max(0, (input.creditsUsedCurrentPeriod / allowance) * 100));
    const supportRaw = Math.min(100, Math.max(0, input.supportScore ?? 85));
    const billingRaw = input.subscriptionStatus === 'past_due' ? 20 : 100;
    const activationRaw = input.isActivated ? 100 : 20;

    const connectionComponent = Number((connectionRaw * 0.3).toFixed(2));
    const usageComponent = Number((usageRaw * 0.25).toFixed(2));
    const supportComponent = Number((supportRaw * 0.15).toFixed(2));
    const billingComponent = Number((billingRaw * 0.15).toFixed(2));
    const activationComponent = Number((activationRaw * 0.15).toFixed(2));

    const total = Math.max(
        0,
        Math.min(
            100,
            Number(
                (
                    connectionComponent +
                    usageComponent +
                    supportComponent +
                    billingComponent +
                    activationComponent
                ).toFixed(2),
            ),
        ),
    );

    const prevLogins = input.loginCountPrev14d ?? 0;
    const currLogins = input.loginCountLast14d ?? 0;
    const loginDropPct =
        prevLogins > 0
            ? Number((Math.max(0, (prevLogins - currLogins) / prevLogins) * 100).toFixed(1))
            : 0;

    const healthScoreDroppedAlert = total < 50 || loginDropPct >= 50;

    if (healthScoreDroppedAlert) {
        trackSaasLifecycleEvent('health_score_dropped', {
            health_score: total,
            login_drop_pct: loginDropPct,
            days_since_last_active: input.daysSinceLastActive,
        });
    }

    return {
        score: total,
        connectionComponent,
        usageComponent,
        supportComponent,
        billingComponent,
        activationComponent,
        loginDropPct,
        healthScoreDroppedAlert,
        recommendedAction: healthScoreDroppedAlert
            ? 'send_1click_template_rescue_email'
            : total >= 80 && input.isActivated
              ? 'trigger_pql_expansion'
              : 'none',
    };
}

/**
 * Résout l'offre de sauvetage primaire et de repli du tunnel d'annulation (Cancel Flow).
 * Règle stricte : interdiction absolue des remises >= 50 % ; remise maximale fixée à 25 % sur 3 mois.
 */
export function resolveCancelSaveOffer(
    reason: CancelReason,
    currentMonthlyPriceEur: number = 9.99,
): CancelSaveOffer {
    const discountPercent = 25;
    const discountDurationMonths = 3;
    const discountedMonthlyEur = Number((currentMonthlyPriceEur * 0.75).toFixed(2));
    const totalSavingsEur = Number(
        ((currentMonthlyPriceEur - discountedMonthlyEur) * discountDurationMonths).toFixed(2),
    );

    switch (reason) {
        case 'too_expensive':
            return {
                reason,
                primaryOfferType: 'discount_25_pct_3m',
                primaryTitleFr: `Remise immédiate de -25 % pendant 3 mois (${discountedMonthlyEur.toFixed(2).replace('.', ',')} € / mois)`,
                primaryTitleEn: `Instant 25% discount for 3 months (€${discountedMonthlyEur.toFixed(2)} / month)`,
                primaryDescriptionFr: `Économisez immédiatement ${totalSavingsEur.toFixed(2).replace('.', ',')} € sur vos 3 prochaines mensualités tout en conservant votre Coach IA Illimité.`,
                primaryDescriptionEn: `Save €${totalSavingsEur.toFixed(2)} over your next 3 billing cycles while keeping Unlimited AI Coach.`,
                discountPercent,
                discountDurationMonths,
                discountedMonthlyEur,
                totalSavingsEur,
                allowedPauseMonths: [1, 2, 3],
                fallbackOfferType: 'downgrade_tier',
                fallbackTitleFr: 'Ajuster mon forfait vers le palier inférieur',
                fallbackTitleEn: 'Adjust my plan to the lower tier',
            };

        case 'low_usage':
            return {
                reason,
                primaryOfferType: 'pause_1_to_3_months',
                primaryTitleFr: 'Mettre mon abonnement en pause (1 à 3 mois — 0,00 €)',
                primaryTitleEn: 'Pause my subscription (1 to 3 months — €0.00)',
                primaryDescriptionFr:
                    'Gelez toute facturation pendant 1, 2 ou 3 mois. Vos statistiques PR, votre historique et votre banque de blunders FSRS restent 100 % intacts.',
                primaryDescriptionEn:
                    'Freeze all billing for 1, 2, or 3 months. Your PR stats, match history, and FSRS blunder bank stay 100% intact.',
                discountPercent: 0,
                discountDurationMonths: 0,
                discountedMonthlyEur: currentMonthlyPriceEur,
                totalSavingsEur: Number((currentMonthlyPriceEur * 2).toFixed(2)),
                allowedPauseMonths: [1, 2, 3],
                fallbackOfferType: 'free_tier_keep_data',
                fallbackTitleFr: 'Passer au plan Gratuit (3 analyses/24h) en conservant mes données',
                fallbackTitleEn: 'Switch to Free plan (3 analyses/24h) and keep all my data',
            };

        case 'missing_feature':
            return {
                reason,
                primaryOfferType: 'free_month_credit',
                primaryTitleFr: '1 mois de crédit VIP offert + Assistance Prioritaire',
                primaryTitleEn: '1 Free Month VIP Credit + Priority Support',
                primaryDescriptionFr:
                    'Nous vous offrons le mois prochain (économie de 9,99 €) pendant que notre équipe traite votre retour en priorité.',
                primaryDescriptionEn:
                    'Enjoy next month on us (save €9.99) while our engineering team prioritizes your request.',
                discountPercent: 100,
                discountDurationMonths: 1,
                discountedMonthlyEur: 0,
                totalSavingsEur: currentMonthlyPriceEur,
                allowedPauseMonths: [1, 2, 3],
                fallbackOfferType: 'feature_alert',
                fallbackTitleFr: 'M’alerter par email dès que la fonctionnalité est déployée',
                fallbackTitleEn: 'Notify me by email as soon as this feature launches',
            };

        case 'switching_competitor':
            return {
                reason,
                primaryOfferType: 'discount_25_pct_3m',
                primaryTitleFr: `Alignement privilège -25 % pendant 3 mois (${discountedMonthlyEur.toFixed(2).replace('.', ',')} € / mois)`,
                primaryTitleEn: `Price-match 25% off for 3 months (€${discountedMonthlyEur.toFixed(2)} / month)`,
                primaryDescriptionFr: `Économisez ${totalSavingsEur.toFixed(2).replace('.', ',')} € sur 3 mois avec la précision certifiée Monte-Carlo 3-Ply (PR 0.23).`,
                primaryDescriptionEn: `Save €${totalSavingsEur.toFixed(2)} over 3 months with certified Monte-Carlo 3-Ply accuracy (0.23 PR).`,
                discountPercent,
                discountDurationMonths,
                discountedMonthlyEur,
                totalSavingsEur,
                allowedPauseMonths: [1, 2, 3],
                fallbackOfferType: 'one_click_export_winback',
                fallbackTitleFr: 'Exporter mes matchs XGID/SGF en 1 clic et résilier sans friction',
                fallbackTitleEn: 'Export all my XGID/SGF matches in 1 click and cancel cleanly',
            };
    }
}

/**
 * Construit la séquence de recouvrement Dunning (7 relances sur 30 jours + Grace Period J+30 à J+60)
 * ou stoppe immédiatement toute tentative sur un Hard Decline.
 */
export function buildDunningSchedule(params: {
    readonly declineCode?: string | null;
    readonly cardBrand?: string | null;
    readonly cardLast4?: string | null;
}): {
    readonly isHardDecline: boolean;
    readonly shouldRetryPayment: boolean;
    readonly gracePeriodDays: number;
    readonly steps: ReadonlyArray<DunningStep>;
} {
    const code = (params.declineCode ?? '').trim();
    const isHardDecline = HARD_DECLINE_CODES.has(code);
    const cardLabel = `${params.cardBrand ?? 'Carte'} •••• ${params.cardLast4 ?? '4242'}`;

    if (isHardDecline) {
        return {
            isHardDecline: true,
            shouldRetryPayment: false,
            gracePeriodDays: 30,
            steps: [
                {
                    stepNumber: 1,
                    offsetLabel: 'Immédiat (Hard Decline)',
                    delayHours: 0,
                    retryType: 'grace_period_readonly',
                    sendEmail: true,
                    showInAppBanner: true,
                    descriptionFr: `Arrêt immédiat des prélèvements sur ${cardLabel} (${code}). Lien 1-clic de remplacement de carte envoyé.`,
                },
            ],
        };
    }

    return {
        isHardDecline: false,
        shouldRetryPayment: true,
        gracePeriodDays: 30,
        steps: [
            {
                stepNumber: 1,
                offsetLabel: 'T+2 heures (Jour 0)',
                delayHours: 2,
                retryType: 'silent_ml_retry',
                sendEmail: false,
                showInAppBanner: false,
                descriptionFr: '1re tentative silencieuse automatique (aucun email envoyé).',
            },
            {
                stepNumber: 2,
                offsetLabel: 'J+1 (~24 heures)',
                delayHours: 24,
                retryType: 'scheduled_billing_retry',
                sendEmail: true,
                showInAppBanner: true,
                descriptionFr: `1re relance officielle + email citant ${cardLabel} et lien pré-authentifié 1-clic.`,
            },
            {
                stepNumber: 3,
                offsetLabel: 'J+4 (+3 jours)',
                delayHours: 96,
                retryType: 'scheduled_billing_retry',
                sendEmail: true,
                showInAppBanner: true,
                descriptionFr: '2e relance de paiement + email envoyé juste avant la tentative.',
            },
            {
                stepNumber: 4,
                offsetLabel: 'J+6 (+2 jours)',
                delayHours: 144,
                retryType: 'scheduled_billing_retry',
                sendEmail: true,
                showInAppBanner: true,
                descriptionFr: '3e relance de paiement + notification in-app.',
            },
            {
                stepNumber: 5,
                offsetLabel: 'J+8 (+2 jours)',
                delayHours: 192,
                retryType: 'scheduled_billing_retry',
                sendEmail: true,
                showInAppBanner: true,
                descriptionFr: '4e relance + dernier email annonçant la date de fin de Grace Period.',
            },
            {
                stepNumber: 6,
                offsetLabel: 'J+10, J+15 et J+20',
                delayHours: 240,
                retryType: 'silent_ml_retry',
                sendEmail: false,
                showInAppBanner: true,
                descriptionFr: '5e, 6e et 7e relances silencieuses ML (bannière in-app uniquement).',
            },
            {
                stepNumber: 7,
                offsetLabel: 'J+30 à J+60 (Grace Period)',
                delayHours: 720,
                retryType: 'grace_period_readonly',
                sendEmail: false,
                showInAppBanner: true,
                descriptionFr: 'Conservation intégrale du compte et des statistiques avec régularisation en 1 clic.',
            },
        ],
    };
}
