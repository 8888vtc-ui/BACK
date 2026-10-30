/**
 * Route Handler Next.js App Router — Explication de coach & Synthèse Post-Match en streaming SSE (< 230 lignes, 0 any).
 *
 * Endpoint : POST /api/coach
 * Comportement :
 * 1. Valide le rate limit et le schéma Zod (ou le mode `post-match-synthesis`).
 * 2. Appelle le fournisseur LLM (Gemini / OpenAI-compatible) avec timeout strict.
 * 3. En l'absence de clé ou en cas de timeout / erreur HTTP, streame immédiatement
 *    l'explication déterministe avec `symbolic_audit` et `pedagogical_explanation` sans bloquer le client.
 * 4. Verrou anti-hallucination : valide l'audit symbolique accumulé en fin de flux SSE.
 */

import { NextRequest } from 'next/server';
import {
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
} from '../../../features/coach/prompts';
import type { MatchSummaryPayload } from '../../../components/summary/postMatchReportHelpers';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { CoachRequestSchema, validateJsonBody } from '../../../lib/security/schemas';
import { verifyCoachApiQuotaGuard } from '../../../actions/coach';
import { computeExplanationCacheKey } from '../../../features/coach/explanationCache';
import { getSharedCoachExplanation, saveCoachExplanationRecord } from '../../../lib/supabase/db';
import {
    SSE_HEADERS,
    UPSTREAM_LLM_TIMEOUT_MS,
    buildCoachPromptParams,
    buildGroundTruthNeuroSymbolicAudit,
    createCachedExplanationStream,
    createJsonFallbackStream,
    formatSseEvent,
    handlePostMatchSynthesisStream,
    resolveLlmEndpointConfig,
    verifyAccumulatedLlmAudit,
} from '../../../lib/coach/coachRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({ status: 'online', service: 'coach-sse' });
}

export async function POST(req: NextRequest | Request): Promise<Response> {
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.COACH);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    const encoder = new TextEncoder();

    // Détection non destructive du mode `post-match-synthesis` et du garde de quota
    try {
        const cloned = req.clone();
        const rawBody = (await cloned.json()) as Record<string, unknown>;
        const quotaGuard = await verifyCoachApiQuotaGuard(rawBody, req.headers);
        if (!quotaGuard.allowed) {
            return Response.json(
                {
                    error: 'DAILY_COACH_QUOTA_REACHED',
                    quotaReached: true,
                    state: quotaGuard.state,
                },
                { status: 402 },
            );
        }
        if (rawBody && rawBody.mode === 'post-match-synthesis' && rawBody.summary && typeof rawBody.summary === 'object') {
            const summary = rawBody.summary as MatchSummaryPayload;
            const lang = rawBody.language === 'en' ? 'en' : 'fr';
            return handlePostMatchSynthesisStream(summary, lang, encoder);
        }
    } catch {
        // Corps non-JSON ou standard : délégué à validateJsonBody ci-dessous
    }

    const validation = await validateJsonBody(req, CoachRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    try {
        const body = validation.data;

        const params = buildCoachPromptParams(body, req.headers.get('accept-language'));

        const isDeepGrandmaster = body.playerLevel === 'grandmaster';
        const { apiKey, baseUrl, model: initialModel } = resolveLlmEndpointConfig({
            useDeepModel: isDeepGrandmaster,
        });
        let model = initialModel;

        const cacheKey = computeExplanationCacheKey({
            positionKey: body.positionKey,
            xgid: body.xgid,
            board: body.board,
            dice: body.dice,
            playedMove: body.playedMove,
            optimalMove: body.optimalMove,
            verdict: params.verdict,
            matchLength: body.matchContext?.matchLength,
            scoreX: body.matchContext?.scoreX,
            scoreO: body.matchContext?.scoreO,
            cubeValue: body.matchContext?.cubeValue,
            cubeOwner: (body.matchContext as { cubeOwner?: 'X' | 'O' | null })?.cubeOwner,
            crawford: body.matchContext?.crawford,
        });

        // 1. Vérification du cache partagé L2 Supabase (0 ms)
        try {
            const sharedHit = await getSharedCoachExplanation(cacheKey);
            if (sharedHit && (sharedHit.explanation || sharedHit.summary)) {
                return createCachedExplanationStream(sharedHit, encoder);
            }
        } catch (cacheErr) {
            console.warn('[Coach API] Erreur lecture cache L2 coach_explanations :', cacheErr);
        }

        if (!apiKey) {
            return createJsonFallbackStream(generateRuleBasedExplanation(params), encoder);
        }

        const groundTruthAudit = buildGroundTruthNeuroSymbolicAudit(params);
        const userPrompt = buildCoachUserPrompt(params);
        const requestPayload: Record<string, unknown> = {
            model,
            messages: [
                { role: 'system', content: getCoachSystemPrompt(params.language) },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.25,
            stream: true,
            response_format: { type: 'json_object' },
        };
        if (model.includes('gemini-3.8') || model.includes('gemini-3.7')) {
            requestPayload.reasoning_effort = 'low';
        }

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), UPSTREAM_LLM_TIMEOUT_MS);

        let llmResponse: Response;
        try {
            llmResponse = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestPayload),
                signal: abortController.signal,
            });

            if (llmResponse.status === 404 && model.includes('gemini')) {
                model = model === 'gemini-3.5-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite';
                requestPayload.model = model;
                if (model.includes('gemini-3.8')) {
                    requestPayload.reasoning_effort = 'low';
                } else {
                    delete requestPayload.reasoning_effort;
                }
                const retryResp = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify(requestPayload),
                    signal: abortController.signal,
                });
                if (retryResp.ok) {
                    llmResponse = retryResp;
                }
            }
        } catch (fetchErr: unknown) {
            clearTimeout(timeoutId);
            console.warn('[Coach API] Timeout ou erreur réseau LLM, repli heuristique :', fetchErr);
            return createJsonFallbackStream(generateRuleBasedExplanation(params), encoder);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!llmResponse.ok || !llmResponse.body) {
            console.warn(`[Coach API] Statut HTTP ${llmResponse.status}, bascule repli heuristique`);
            return createJsonFallbackStream(generateRuleBasedExplanation(params), encoder);
        }

        const upstreamReader = llmResponse.body.getReader();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                let buffer = '';
                let accumulatedJson = '';
                try {
                    while (true) {
                        const { done, value } = await upstreamReader.read();
                        if (done) break;

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() ?? '';

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith('data:')) continue;
                            const dataStr = trimmed.replace(/^data:\s*/, '');
                            if (dataStr === '[DONE]') {
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                continue;
                            }
                            try {
                                const parsed = JSON.parse(dataStr) as {
                                    choices?: Array<{ delta?: { content?: string } }>;
                                };
                                const token = parsed.choices?.[0]?.delta?.content ?? '';
                                if (token) {
                                    accumulatedJson += token;
                                    controller.enqueue(
                                        encoder.encode(
                                            formatSseEvent({
                                                token,
                                                content: token,
                                                source: 'llm',
                                            }),
                                        ),
                                    );
                                }
                            } catch {
                                // Fragment JSON partiel ignoré
                            }
                        }
                    }
                } catch (streamErr: unknown) {
                    console.error('[Coach API] Erreur pendant la lecture du flux LLM :', streamErr);
                } finally {
                    const verifiedAudit = verifyAccumulatedLlmAudit(accumulatedJson, groundTruthAudit);
                    controller.enqueue(
                        encoder.encode(formatSseEvent({ done: true, verifiedAudit })),
                    );
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();

                    if (accumulatedJson.trim()) {
                        let parsedLlmTopLevel: {
                            summary?: string;
                            explanation?: string;
                            keyConcept?: string;
                            key_concept?: string;
                            advice?: string;
                        } = {};
                        try {
                            parsedLlmTopLevel = JSON.parse(accumulatedJson) as typeof parsedLlmTopLevel;
                        } catch {
                            // Repli sur verifiedAudit
                        }
                        void Promise.resolve(
                            saveCoachExplanationRecord({
                                position_key: cacheKey,
                                played_move: body.playedMove,
                                optimal_move: body.optimalMove,
                                verdict: params.verdict,
                                equity_loss: body.equityLoss,
                                summary: parsedLlmTopLevel.summary || verifiedAudit.pedagogical_explanation.headline,
                                explanation: parsedLlmTopLevel.explanation || verifiedAudit.pedagogical_explanation.tactical_rationale,
                                key_concept: parsedLlmTopLevel.keyConcept || parsedLlmTopLevel.key_concept || verifiedAudit.symbolic_audit.dominant_theme,
                                advice: parsedLlmTopLevel.advice || verifiedAudit.pedagogical_explanation.zare_luck_vs_skill,
                                source: 'llm',
                            }),
                        ).catch((err) => {
                            console.warn('[Coach API] Erreur sauvegarde L2 cache coach_explanations :', err);
                        });
                    }
                }
            },
        });

        return new Response(stream, { headers: SSE_HEADERS });
    } catch (err: unknown) {
        console.error('[Coach API] Erreur non gérée :', err);
        return new Response(
            JSON.stringify({
                error: 'Erreur lors du traitement de la demande de coach',
                details: err instanceof Error ? err.message : String(err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
