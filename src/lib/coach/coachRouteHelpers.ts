/**
 * @file src/lib/coach/coachRouteHelpers.ts
 * @description Helpers SSE, configuration LLM et garde anti-hallucination Neuro-Symbolique
 * pour la route API `POST /api/coach`.
 */

import {
    getGameReviewSystemPrompt,
    buildPostMatchSummaryUserPrompt,
} from '../../features/coach/gameReviewPrompts';
import {
    buildRuleBasedSynthesis,
    type MatchSummaryPayload,
} from '../../components/summary/postMatchReportHelpers';
import { buildMatchContext } from '../../features/coach/matchContext';
import type { CoachPromptParams } from '../../features/coach/prompts';
import type { Locale } from '../i18n/types';
import {
    buildNeuroSymbolicAudit,
    enforceSymbolicAuditAntiHallucination,
    type NeuroSymbolicCoachAudit,
} from './symbolicAudit';
import { evaluateAiMarginGuardrail } from '../subscription/retentionEngine';

export const UPSTREAM_LLM_TIMEOUT_MS = 14000;

export const SSE_HEADERS: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
};

export interface LlmEndpointConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    deepModel: string;
    marginGuardrailBreached?: boolean;
}

export function resolveLlmEndpointConfig(marginContext?: {
    readonly periodInferenceCostUsd?: number;
    readonly monthlyRevenueUsd?: number;
    readonly useDeepModel?: boolean;
}): LlmEndpointConfig {
    const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.LLM_API_KEY ||
        '';
    const rawBaseUrl =
        process.env.OPENAI_BASE_URL ||
        process.env.GEMINI_BASE_URL ||
        process.env.LLM_BASE_URL ||
        'https://generativelanguage.googleapis.com/v1beta/openai/';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const fastModel =
        process.env.COACH_FAST_MODEL ||
        process.env.COACH_MODEL ||
        process.env.OPENAI_MODEL ||
        process.env.GEMINI_MODEL ||
        process.env.LLM_MODEL ||
        'gemini-3.5-flash-lite';
    const deepModel =
        process.env.COACH_DEEP_MODEL ||
        'gemini-3.8-flash';
    let model = marginContext?.useDeepModel ? deepModel : fastModel;

    let marginGuardrailBreached = false;
    if (
        marginContext &&
        typeof marginContext.periodInferenceCostUsd === 'number' &&
        typeof marginContext.monthlyRevenueUsd === 'number' &&
        marginContext.monthlyRevenueUsd > 0
    ) {
        const evalResult = evaluateAiMarginGuardrail({
            periodInferenceCostUsd: marginContext.periodInferenceCostUsd,
            monthlyRevenueUsd: marginContext.monthlyRevenueUsd,
        });
        if (evalResult.guardrailBreached) {
            model = evalResult.routedModel;
            marginGuardrailBreached = true;
        }
    }

    return { apiKey, baseUrl, model, deepModel, marginGuardrailBreached };
}

export function resolveRequestLocale(rawLanguage: string | undefined, acceptLanguageHeader: string | null): Locale {
    if (rawLanguage && ['fr', 'en', 'es', 'pt', 'de', 'ar', 'ja'].includes(rawLanguage)) {
        return rawLanguage as Locale;
    }
    const acceptLang = (acceptLanguageHeader ?? '').toLowerCase();
    if (acceptLang.includes('es')) return 'es';
    if (acceptLang.includes('pt')) return 'pt';
    if (acceptLang.includes('de')) return 'de';
    if (acceptLang.includes('ar')) return 'ar';
    if (acceptLang.includes('ja')) return 'ja';
    if (acceptLang.includes('en')) return 'en';
    return 'fr';
}

export function buildCoachPromptParams(
    body: {
        verdict: 'blunder' | 'doubtful' | 'inaccuracy' | 'good' | 'optimal' | 'acceptable';
        equityLoss: number;
        playedMove: string;
        optimalMove: string;
        features?: unknown;
        matchContext?: {
            matchLength: number;
            scoreX: number;
            scoreO: number;
            crawford: boolean;
            cubeValue: number;
        };
        playerLevel: 'beginner' | 'intermediate' | 'expert' | 'grandmaster';
        language: 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja';
    },
    acceptLanguageHeader: string | null,
): CoachPromptParams {
    const normalizedVerdict: CoachPromptParams['verdict'] =
        body.verdict === 'blunder' ? 'blunder' : 'doubtful';
    const normalizedPlayerLevel: CoachPromptParams['playerLevel'] =
        body.playerLevel === 'grandmaster' ? 'expert' : body.playerLevel;

    return {
        verdict: normalizedVerdict,
        equityLoss: body.equityLoss,
        playedMove: body.playedMove,
        optimalMove: body.optimalMove,
        features: (body.features as unknown as CoachPromptParams['features']) ?? {
            player: 'X',
            pipCountDiff: { player: 167, opponent: 167, leader: 'tie', diff: 0 },
            blotsAndShots: { user: [], best: [] },
            boardStructure: {
                innerBoardPoints: 0,
                advancedAnchor: false,
                goldenPoint: false,
                barPoint: false,
                longestPrime: 0,
            },
            contactStatus: 'contact',
        },
        matchContext: body.matchContext
            ? buildMatchContext({
                  matchLength: body.matchContext.matchLength,
                  scoreX: body.matchContext.scoreX,
                  scoreO: body.matchContext.scoreO,
                  crawford: body.matchContext.crawford,
                  cubeValue: body.matchContext.cubeValue,
              })
            : undefined,
        playerLevel: normalizedPlayerLevel,
        language: resolveRequestLocale(body.language, acceptLanguageHeader),
    };
}

export function formatSseEvent(data: Record<string, unknown> | string): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return `data: ${payload}\n\n`;
}

export function createJsonFallbackStream(payloadObj: unknown, encoder: TextEncoder): Response {
    const stream = new ReadableStream({
        start(controller) {
            const fullJson = JSON.stringify(payloadObj, null, 2);
            const chunkSize = 24;
            let offset = 0;

            const interval = setInterval(() => {
                try {
                    if (offset < fullJson.length) {
                        const chunk = fullJson.slice(offset, offset + chunkSize);
                        offset += chunkSize;
                        controller.enqueue(
                            encoder.encode(
                                formatSseEvent({
                                    token: chunk,
                                    content: chunk,
                                    source: 'rule-based-fallback',
                                }),
                            ),
                        );
                    } else {
                        clearInterval(interval);
                        controller.enqueue(encoder.encode(formatSseEvent({ done: true, full: payloadObj })));
                        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                        controller.close();
                    }
                } catch {
                    clearInterval(interval);
                }
            }, 12);
        },
    });
    return new Response(stream, { headers: SSE_HEADERS });
}

/**
 * Streame immédiatement en 0 ms une explication issue du cache partagé L2 Supabase.
 */
export function createCachedExplanationStream(
    cached: {
        summary?: string | null;
        explanation?: string | null;
        key_concept?: string | null;
        advice?: string | null;
        played_move?: string | null;
        optimal_move?: string | null;
        verdict?: string | null;
        equity_loss?: number | null;
        [key: string]: unknown;
    },
    encoder: TextEncoder,
): Response {
    const payload = {
        summary: cached.summary ?? '',
        explanation: cached.explanation ?? '',
        key_concept: cached.key_concept ?? '',
        advice: cached.advice ?? '',
        playedMove: cached.played_move ?? '',
        optimalMove: cached.optimal_move ?? '',
        verdict: cached.verdict ?? '',
        equityLoss: cached.equity_loss ?? 0,
        source: 'cache' as const,
    };
    const fullJson = JSON.stringify(payload);
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(
                encoder.encode(
                    formatSseEvent({
                        token: fullJson,
                        content: fullJson,
                        source: 'cache',
                    }),
                ),
            );
            controller.enqueue(
                encoder.encode(
                    formatSseEvent({
                        done: true,
                        source: 'cache',
                        full: payload,
                    }),
                ),
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
        },
    });
    return new Response(stream, { headers: SSE_HEADERS });
}

/**
 * Construit la vérité terrain (`symbolic_audit` + `pedagogical_explanation`)
 * à partir des `CoachPromptParams` vérifiés par le moteur.
 */
export function buildGroundTruthNeuroSymbolicAudit(params: CoachPromptParams): NeuroSymbolicCoachAudit {
    const diff = params.features?.pipCountDiff ?? { player: 167, opponent: 167, leader: 'tie', diff: 0 };
    const userBlots = params.features?.blotsAndShots?.user ?? [];
    const bestBlots = params.features?.blotsAndShots?.best ?? [];
    const userDirectShots = Math.min(36, userBlots.reduce((acc, b) => acc + b.directShots, 0));
    const bestDirectShots = Math.min(36, bestBlots.reduce((acc, b) => acc + b.directShots, 0));
    const board = params.features?.boardStructure;

    return buildNeuroSymbolicAudit({
        playerPipCount: diff.player,
        opponentPipCount: diff.opponent,
        directShotsBefore: bestDirectShots,
        directShotsAfter: userDirectShots,
        equityLoss: Math.abs(params.equityLoss),
        bestMoveNotation: params.optimalMove,
        playedMoveNotation: params.playedMove,
        archetype: params.features?.bgsage?.playerGamePlan,
        gamePhase: params.features?.contactStatus === 'pureRace' ? 'race' : 'contact',
        primeLength: board?.longestPrime,
        homeBoardPointsMade: board?.innerBoardPoints,
        blotsLeft: userBlots.length,
        locale: params.language === 'en' ? 'en' : 'fr',
    });
}

/**
 * Applique le verrou anti-hallucination sur la réponse complète accumulée depuis le flux LLM.
 */
export function verifyAccumulatedLlmAudit(
    accumulatedJson: string,
    groundTruth: NeuroSymbolicCoachAudit
): NeuroSymbolicCoachAudit {
    try {
        const parsed = JSON.parse(accumulatedJson) as Partial<NeuroSymbolicCoachAudit>;
        return enforceSymbolicAuditAntiHallucination(parsed, groundTruth);
    } catch {
        return groundTruth;
    }
}

export async function handlePostMatchSynthesisStream(
    summary: MatchSummaryPayload,
    lang: 'fr' | 'en',
    encoder: TextEncoder
): Promise<Response> {
    const fallbackSynthesis = buildRuleBasedSynthesis(summary, lang);
    const { apiKey, baseUrl, deepModel: model } = resolveLlmEndpointConfig({ useDeepModel: true });
    if (!apiKey) {
        return createJsonFallbackStream(fallbackSynthesis, encoder);
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), UPSTREAM_LLM_TIMEOUT_MS);
    try {
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                reasoning_effort: 'low',
                messages: [
                    { role: 'system', content: getGameReviewSystemPrompt(lang) },
                    { role: 'user', content: buildPostMatchSummaryUserPrompt(summary, lang) },
                ],
                temperature: 0.3,
                stream: false,
                response_format: { type: 'json_object' },
            }),
            signal: abortController.signal,
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
            const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
            const content = data.choices?.[0]?.message?.content;
            if (content) {
                return createJsonFallbackStream(JSON.parse(content), encoder);
            }
        }
    } catch {
        clearTimeout(timeoutId);
    }
    return createJsonFallbackStream(fallbackSynthesis, encoder);
}
