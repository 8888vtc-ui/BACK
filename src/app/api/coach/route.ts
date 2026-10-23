/**
 * Route Handler Next.js App Router — Explication de coach & Synthèse Post-Match en streaming SSE (< 275 lignes, 0 any).
 *
 * Endpoint : POST /api/coach
 * Comportement :
 * 1. Valide le rate limit et le schéma Zod (ou le mode `post-match-synthesis`).
 * 2. Appelle le fournisseur LLM (Gemini / OpenAI-compatible) avec timeout strict de 3 s.
 * 3. En l'absence de clé ou en cas de timeout / erreur HTTP, streame immédiatement
 *    l'explication déterministe sans bloquer le client.
 */

import { NextRequest } from 'next/server';
import {
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    type CoachPromptParams,
} from '../../../features/coach/prompts';
import {
    getGameReviewSystemPrompt,
    buildPostMatchSummaryUserPrompt,
} from '../../../features/coach/gameReviewPrompts';
import {
    buildRuleBasedSynthesis,
    type MatchSummaryPayload,
} from '../../../components/summary/postMatchReportHelpers';
import { buildMatchContext } from '../../../features/coach/matchContext';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { CoachRequestSchema, validateJsonBody } from '../../../lib/security/schemas';
import { verifyCoachApiQuotaGuard } from '../../../actions/coach';

export const dynamic = 'force-dynamic';

const UPSTREAM_LLM_TIMEOUT_MS = 3000;

const SSE_HEADERS: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
};

export async function GET() {
    return Response.json({ status: 'online', service: 'coach-sse' });
}

function formatSseEvent(data: Record<string, unknown> | string): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return `data: ${payload}\n\n`;
}

function createJsonFallbackStream(payloadObj: unknown, encoder: TextEncoder): Response {
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
            const fallbackSynthesis = buildRuleBasedSynthesis(summary, lang);
            const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';
            if (!apiKey) {
                return createJsonFallbackStream(fallbackSynthesis, encoder);
            }
            const baseUrl = (
                process.env.OPENAI_BASE_URL ||
                process.env.GEMINI_BASE_URL ||
                process.env.LLM_BASE_URL ||
                'https://generativelanguage.googleapis.com/v1beta/openai/'
            ).replace(/\/+$/, '');
            const model =
                process.env.COACH_MODEL ||
                process.env.OPENAI_MODEL ||
                process.env.GEMINI_MODEL ||
                process.env.LLM_MODEL ||
                'gemini-2.5-flash';

            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), UPSTREAM_LLM_TIMEOUT_MS);
            try {
                const resp = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model,
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
    } catch {
        // Corps non-JSON ou standard : délégué à validateJsonBody ci-dessous
    }

    const validation = await validateJsonBody(req, CoachRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    try {
        const body = validation.data;

        const normalizedVerdict: CoachPromptParams['verdict'] =
            body.verdict === 'blunder' ? 'blunder' : 'doubtful';
        const normalizedPlayerLevel: CoachPromptParams['playerLevel'] =
            body.playerLevel === 'grandmaster' ? 'expert' : body.playerLevel;

        const params: CoachPromptParams = {
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
            language: body.language,
        };

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
        let model =
            process.env.COACH_MODEL ||
            process.env.OPENAI_MODEL ||
            process.env.GEMINI_MODEL ||
            process.env.LLM_MODEL ||
            'gemini-2.5-flash';

        if (!apiKey) {
            return createJsonFallbackStream(generateRuleBasedExplanation(params), encoder);
        }

        const userPrompt = buildCoachUserPrompt(params);
        const requestPayload: Record<string, unknown> = {
            model,
            messages: [
                { role: 'system', content: getCoachSystemPrompt(params.language) },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            stream: true,
            response_format: { type: 'json_object' },
        };

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
                model = 'gemini-3.8-flash';
                requestPayload.model = model;
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
            console.warn('[Coach API] Timeout (3s) ou erreur réseau LLM, repli heuristique :', fetchErr);
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
                    controller.enqueue(encoder.encode(formatSseEvent({ done: true })));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
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
