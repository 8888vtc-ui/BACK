/**
 * Action Serveur & Garde de Sécurité Coach IA (`src/actions/coach.ts`).
 *
 * Responsabilités :
 * 1. Vérifier strictement le quota d'analyses (3 analyses offertes / 24h pour `tier === 'free'`,
 *    illimité pour `coach_monthly` et `coach_yearly`) AVANT tout appel au LLM Google Gemini.
 * 2. Empêcher tout abus d'API lorsque le quota quotidien est atteint, tout en préservant
 *    la gratuité totale des métriques de base Open Sage (Score, Performance Rating PR, Chance aux dés)
 *    et en générant le teaser dopaminergique de Soft Paywall.
 */

import type { Profile, SubscriptionStatus, SubscriptionTier } from '../lib/supabase/types';
import type { CompleteGameAnalysis } from '../features/rating/types';
import {
    buildOpenSageTeaser,
    computeQuotaState,
    consumeAnalysisQuota,
    getQuotaForUser,
    type CoachQuotaState,
    type OpenSageTeaser,
    type QuotaStorageLike,
} from '../lib/subscription/quotaService';
import {
    getGameReviewSystemPrompt,
    buildPostMatchSummaryUserPrompt,
} from '../features/coach/gameReviewPrompts';
import {
    buildRuleBasedSynthesis,
    type AiSynthesis,
    type MatchSummaryPayload,
} from '../components/summary/postMatchReportHelpers';

const UPSTREAM_GEMINI_TIMEOUT_MS = 6000;

export interface CoachQuotaGuardInput {
    readonly userId?: string | null;
    readonly profile?: Partial<Profile> | null;
    readonly tier?: SubscriptionTier | string | null;
    readonly subscriptionStatus?: SubscriptionStatus | string | null;
    readonly dailyAnalysesCount?: number | null;
    readonly lastAnalysisResetAt?: string | null;
    readonly gameId?: string;
    readonly consume?: boolean;
    readonly now?: Date;
    readonly storage?: QuotaStorageLike | null;
}

export interface CoachQuotaGuardResult {
    readonly allowed: boolean;
    readonly quotaReached: boolean;
    readonly state: CoachQuotaState;
}

export interface ProtectedCoachSynthesisInput extends CoachQuotaGuardInput {
    readonly summary: MatchSummaryPayload;
    readonly analysis?: CompleteGameAnalysis | null;
    readonly language?: 'fr' | 'en';
}

export interface ProtectedCoachSynthesisResult {
    readonly allowed: boolean;
    readonly quotaReached: boolean;
    readonly state: CoachQuotaState;
    readonly synthesis: AiSynthesis | null;
    readonly teaser: OpenSageTeaser;
    readonly source: 'llm' | 'rule-based' | 'quota-blocked';
}

/**
 * Vérifie (et consomme optionnellement) le quota journalier du joueur avant tout appel LLM Gemini.
 */
export async function verifyAndConsumeCoachQuotaAction(
    input?: CoachQuotaGuardInput,
): Promise<CoachQuotaGuardResult> {
    const now = input?.now ?? new Date();
    const shouldConsume = input?.consume ?? true;

    const syntheticProfile: Partial<Profile> | null =
        input?.profile ??
        (input?.tier !== undefined ||
        input?.dailyAnalysesCount !== undefined ||
        input?.lastAnalysisResetAt !== undefined
            ? {
                  id: input?.userId ?? 'anonymous',
                  subscription_tier: (input?.tier as SubscriptionTier | undefined) ?? 'free',
                  subscription_status:
                      (input?.subscriptionStatus as SubscriptionStatus | undefined) ?? null,
                  daily_analyses_count: input?.dailyAnalysesCount ?? 0,
                  last_analysis_reset_at: input?.lastAnalysisResetAt ?? now.toISOString(),
              }
            : null);

    if (shouldConsume) {
        const consumed = await consumeAnalysisQuota({
            userId: input?.userId,
            profile: syntheticProfile,
            gameId: input?.gameId,
            now,
            storage: input?.storage,
        });

        return {
            allowed: consumed.allowed,
            quotaReached: !consumed.allowed,
            state: consumed.state,
        };
    }

    const state = await getQuotaForUser({
        userId: input?.userId,
        profile: syntheticProfile,
        now,
        storage: input?.storage,
    });

    return {
        allowed: state.canAnalyze,
        quotaReached: state.isQuotaReached,
        state,
    };
}

/**
 * Garde synchrone / rapide pour l'API `/api/coach` à partir du corps JSON ou des en-têtes HTTP.
 * Bloque l'appel Gemini si le payload ou le profil signale que le quota de 3 analyses / 24h est atteint.
 */
export async function verifyCoachApiQuotaGuard(
    rawBody?: Record<string, unknown> | null,
    headers?: Headers,
): Promise<CoachQuotaGuardResult> {
    const headerTier = headers?.get('x-subscription-tier');
    const headerCount = headers?.get('x-daily-analyses-count');
    const headerReset = headers?.get('x-last-analysis-reset-at');
    const headerUserId = headers?.get('x-user-id');

    const bodyTier =
        typeof rawBody?.subscriptionTier === 'string'
            ? rawBody.subscriptionTier
            : headerTier;
    const bodyStatus =
        typeof rawBody?.subscriptionStatus === 'string'
            ? rawBody.subscriptionStatus
            : null;
    const bodyCount =
        typeof rawBody?.dailyAnalysesCount === 'number'
            ? rawBody.dailyAnalysesCount
            : headerCount !== null && headerCount !== undefined && headerCount !== ''
              ? Number(headerCount)
              : undefined;
    const bodyReset =
        typeof rawBody?.lastAnalysisResetAt === 'string'
            ? rawBody.lastAnalysisResetAt
            : headerReset;
    const bodyUserId =
        typeof rawBody?.userId === 'string' ? rawBody.userId : headerUserId;

    // Si des métadonnées de quota explicites sont transmises, les évaluer immédiatement
    if (bodyCount !== undefined && Number.isFinite(bodyCount)) {
        const state = computeQuotaState({
            tier: bodyTier,
            subscriptionStatus: bodyStatus,
            dailyAnalysesCount: bodyCount,
            lastAnalysisResetAt: bodyReset ?? new Date().toISOString(),
        });
        return {
            allowed: state.canAnalyze,
            quotaReached: state.isQuotaReached,
            state,
        };
    }

    // Si un userId explicite est fourni avec Supabase configuré, vérifier en base
    if (bodyUserId) {
        return verifyAndConsumeCoachQuotaAction({
            userId: bodyUserId,
            tier: bodyTier,
            subscriptionStatus: bodyStatus,
            consume: false,
        });
    }

    // Par défaut (requête standard sous quota), autoriser
    const defaultState = computeQuotaState({
        tier: bodyTier ?? 'free',
        subscriptionStatus: bodyStatus,
        dailyAnalysesCount: 0,
    });
    return {
        allowed: true,
        quotaReached: false,
        state: defaultState,
    };
}

/**
 * Exécute une synthèse complète du Coach IA Gemini après vérification stricte du quota.
 * Si le quota de 3 analyses / 24h est atteint pour un joueur non-abonné, aucun appel Gemini n'est déclenché.
 */
export async function generateProtectedCoachSynthesisAction(
    input: ProtectedCoachSynthesisInput,
): Promise<ProtectedCoachSynthesisResult> {
    const lang = input.language === 'en' ? 'en' : 'fr';
    const teaser = buildOpenSageTeaser(input.analysis, lang);

    // 1. Vérification de sécurité du quota AVANT l'appel LLM Gemini
    const quotaGuard = await verifyAndConsumeCoachQuotaAction({
        userId: input.userId,
        profile: input.profile,
        tier: input.tier,
        subscriptionStatus: input.subscriptionStatus,
        dailyAnalysesCount: input.dailyAnalysesCount,
        lastAnalysisResetAt: input.lastAnalysisResetAt,
        gameId: input.gameId,
        consume: input.consume ?? true,
        now: input.now,
        storage: input.storage,
    });

    if (!quotaGuard.allowed) {
        return {
            allowed: false,
            quotaReached: true,
            state: quotaGuard.state,
            synthesis: null,
            teaser,
            source: 'quota-blocked',
        };
    }

    // 2. Appel LLM Gemini autorisé (avec repli déterministe si hors-ligne ou sans clé)
    const fallbackSynthesis = buildRuleBasedSynthesis(input.summary, lang);
    const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.LLM_API_KEY ||
        '';

    if (!apiKey) {
        return {
            allowed: true,
            quotaReached: false,
            state: quotaGuard.state,
            synthesis: fallbackSynthesis,
            teaser,
            source: 'rule-based',
        };
    }

    const baseUrl = (
        process.env.OPENAI_BASE_URL ||
        process.env.GEMINI_BASE_URL ||
        process.env.LLM_BASE_URL ||
        'https://generativelanguage.googleapis.com/v1beta/openai/'
    ).replace(/\/+$/, '');

    const model =
        process.env.COACH_DEEP_MODEL ||
        process.env.COACH_MODEL ||
        process.env.OPENAI_MODEL ||
        process.env.GEMINI_MODEL ||
        process.env.LLM_MODEL ||
        'gemini-3.8-flash';

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), UPSTREAM_GEMINI_TIMEOUT_MS);

    try {
        const reqBody: Record<string, unknown> = {
            model,
            messages: [
                { role: 'system', content: getGameReviewSystemPrompt(lang) },
                { role: 'user', content: buildPostMatchSummaryUserPrompt(input.summary, lang) },
            ],
            temperature: 0.3,
            stream: false,
            response_format: { type: 'json_object' },
        };
        if (model.includes('gemini-3.8') || model.includes('gemini-3.7')) {
            reqBody.reasoning_effort = 'low';
        }
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(reqBody),
            signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
            const data = (await resp.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
            };
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content) as Partial<AiSynthesis>;
                return {
                    allowed: true,
                    quotaReached: false,
                    state: quotaGuard.state,
                    synthesis: {
                        ...fallbackSynthesis,
                        ...parsed,
                        strengths: parsed.strengths ?? fallbackSynthesis.strengths,
                        weaknesses: parsed.weaknesses ?? fallbackSynthesis.weaknesses,
                        trainingPlan: parsed.trainingPlan ?? fallbackSynthesis.trainingPlan,
                    },
                    teaser,
                    source: 'llm',
                };
            }
        }
    } catch {
        clearTimeout(timeoutId);
    }

    return {
        allowed: true,
        quotaReached: false,
        state: quotaGuard.state,
        synthesis: fallbackSynthesis,
        teaser,
        source: 'rule-based',
    };
}
