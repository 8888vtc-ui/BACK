/**
 * Route Handler Next.js App Router — Explication de coach Backgammon en streaming SSE (< 275 lignes, 0 any).
 *
 * Endpoint : POST /api/coach
 * Comportement :
 * 1. Valide le rate limit et le schéma Zod.
 * 2. Appelle le fournisseur LLM avec timeout strict de 3 s (AbortController).
 * 3. En l'absence de clé ou en cas de timeout / erreur HTTP, streame immédiatement
 *    l'explication déterministe `generateRuleBasedExplanation` sans bloquer le client.
 */

import { NextRequest } from 'next/server';
import {
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    type CoachPromptParams,
} from '../../../features/coach/prompts';
import { buildMatchContext } from '../../../features/coach/matchContext';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { CoachRequestSchema, validateJsonBody } from '../../../lib/security/schemas';

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

function createRuleBasedStreamResponse(params: CoachPromptParams, encoder: TextEncoder): Response {
    const stream = new ReadableStream({
        start(controller) {
            const explanation = generateRuleBasedExplanation(params);
            const fullJson = JSON.stringify(explanation, null, 2);
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
                        controller.enqueue(encoder.encode(formatSseEvent({ done: true, full: explanation })));
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

        const encoder = new TextEncoder();

        if (!apiKey) {
            return createRuleBasedStreamResponse(params, encoder);
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

            // Repli automatique si le modèle est obsolète / déprécié (ex: gemini-2.5-flash -> gemini-3.8-flash)
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
            return createRuleBasedStreamResponse(params, encoder);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!llmResponse.ok || !llmResponse.body) {
            console.warn(`[Coach API] Statut HTTP ${llmResponse.status}, bascule repli heuristique`);
            return createRuleBasedStreamResponse(params, encoder);
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
