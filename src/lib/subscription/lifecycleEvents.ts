/**
 * Matrice des 9 Événements Analytiques Critiques (Jour 1) & Signaux PQL (`src/lib/subscription/lifecycleEvents.ts`).
 *
 * Implémente la Section 6.3 du Blueprint SaaS 2025–2026 (< 220 lignes, conforme R1).
 */

export type SaasLifecycleEventName =
    | 'pseo_tool_interacted'
    | 'user_activated_first_value'
    | 'reverse_trial_pro_feature_used'
    | 'credit_quota_threshold_reached'
    | 'ai_margin_guardrail_breached'
    | 'pql_expansion_signal_detected'
    | 'health_score_dropped'
    | 'invoice_payment_failed_dunning'
    | 'cancel_flow_initiated'
    | 'blunder_shared';

export interface SaasLifecycleEventRecord {
    readonly event: SaasLifecycleEventName;
    readonly properties: Readonly<Record<string, unknown>>;
    readonly automatedAction: string;
    readonly timestamp: string;
}

const lifecycleEventsMemoryLog: SaasLifecycleEventRecord[] = [];

export function getRecordedLifecycleEvents(): ReadonlyArray<SaasLifecycleEventRecord> {
    return lifecycleEventsMemoryLog;
}

export function clearRecordedLifecycleEventsForTests(): void {
    lifecycleEventsMemoryLog.length = 0;
}

/**
 * Enregistre un événement analytique du cycle de vie SaaS (Section 6.3), persiste en sessionStorage
 * pour `pseo_tool_interacted` et retourne la règle d'automatisation déclenchée.
 */
export function trackSaasLifecycleEvent(
    event: SaasLifecycleEventName,
    properties: Readonly<Record<string, unknown>>,
): SaasLifecycleEventRecord {
    let automatedAction = 'logged';

    switch (event) {
        case 'pseo_tool_interacted': {
            const isChatGpt = String(properties.referrer_source ?? '')
                .toLowerCase()
                .includes('chatgpt');
            automatedAction = isChatGpt
                ? 'save_session_storage_and_open_1click_sso_chatgpt_6x'
                : 'save_session_storage_and_open_1click_sso';
            if (typeof window !== 'undefined' && window.sessionStorage) {
                try {
                    window.sessionStorage.setItem(
                        'backgammon.pseo_tool_result',
                        JSON.stringify({ ...properties, savedAt: new Date().toISOString() }),
                    );
                } catch {
                    // Ignoré en navigation privée restreinte
                }
            }
            break;
        }
        case 'user_activated_first_value': {
            const ttfv = Number(properties.ttfv_seconds ?? 0);
            automatedAction =
                ttfv > 120
                    ? 'trigger_contextual_ai_assistant_prefill'
                    : 'activated_under_60s_target_m12_retention_80pct';
            break;
        }
        case 'reverse_trial_pro_feature_used': {
            const count = Number(properties.artifacts_count ?? 1);
            automatedAction = `schedule_j7_j13_banner_keep_${count}_pro_artifacts`;
            break;
        }
        case 'credit_quota_threshold_reached': {
            const remaining = Number(properties.credits_remaining ?? 0);
            automatedAction =
                remaining <= 0
                    ? 'trigger_metered_paywall_tier2_decoy'
                    : 'show_80pct_non_blocking_topup_notification';
            break;
        }
        case 'ai_margin_guardrail_breached':
            automatedAction = 'switch_query_router_to_distilled_model_and_cap_agents';
            break;
        case 'pql_expansion_signal_detected':
            automatedAction = 'trigger_month1_annual_or_seats_upsell_with_30d_guarantee';
            break;
        case 'health_score_dropped':
            automatedAction = 'suspend_upsells_and_send_1click_rescue_template_email';
            break;
        case 'invoice_payment_failed_dunning':
            automatedAction = 'start_7_step_30d_dunning_with_1click_portal_link';
            break;
        case 'cancel_flow_initiated': {
            const reason = String(properties.cancel_reason ?? 'low_usage');
            automatedAction =
                reason === 'low_usage'
                    ? 'offer_pause_1_to_3_months'
                    : 'offer_25pct_discount_3_months_or_downgrade';
            break;
        }
    }

    const record: SaasLifecycleEventRecord = {
        event,
        properties,
        automatedAction,
        timestamp: new Date().toISOString(),
    };
    lifecycleEventsMemoryLog.push(record);
    return record;
}

/**
 * Évalue le signal d'expansion PQL au Mois 1 ou Mois 12 (Section 4 & 6.3) :
 * `login_count_7d >= 5 && checklist_completed === true && colleagues_invited >= 1`
 */
export function evaluatePqlExpansionSignal(params: {
    readonly loginCount7d: number;
    readonly checklistCompleted: boolean;
    readonly colleaguesInvited: number;
    readonly accountAgeDays?: number;
}): {
    readonly isPqlQualified: boolean;
    readonly inPrimaryExpansionWindow: boolean;
    readonly offerBannerFr: string | null;
} {
    const ageDays = params.accountAgeDays ?? 14;
    // Fenêtres décisives ChartMogul 2026 : Mois 1 (<= 31j) et Mois 12 (330j à 365j)
    const inPrimaryExpansionWindow = ageDays <= 31 || (ageDays >= 330 && ageDays <= 365);
    const isPqlQualified =
        params.loginCount7d >= 5 &&
        params.checklistCompleted === true &&
        params.colleaguesInvited >= 1;

    if (!isPqlQualified) {
        return {
            isPqlQualified: false,
            inPrimaryExpansionWindow,
            offerBannerFr: null,
        };
    }

    trackSaasLifecycleEvent('pql_expansion_signal_detected', {
        login_count_7d: params.loginCount7d,
        checklist_completed: params.checklistCompleted,
        colleagues_invited: params.colleaguesInvited,
        account_age_days: ageDays,
    });

    return {
        isPqlQualified: true,
        inPrimaryExpansionWindow,
        offerBannerFr:
            'Passez au Pack Club & Chouette (5 sièges) ou au Plan Annuel (-33 %, soit 39,89 €/an) avec Garantie 30 jours sans condition.',
    };
}
