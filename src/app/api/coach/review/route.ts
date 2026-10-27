/**
 * Route Handler Next.js App Router — Cours explicatif de fin de partie en streaming SSE (< 265 lignes, 0 any).
 *
 * Endpoint : POST /api/coach/review
 */

import { NextRequest } from 'next/server';
import {
    getGameReviewSystemPrompt,
    buildGameReviewUserPrompt,
    generateRuleBasedGameReview,
    type GameReviewCourseParams,
} from '../../../../features/coach/gameReviewPrompts';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../../lib/security/rateLimit';
import { GameReviewRequestSchema, validateJsonBody } from '../../../../lib/security/schemas';

export const dynamic = 'force-dynamic';

const UPSTREAM_LLM_TIMEOUT_MS = 6000;

const SSE_HEADERS: Record<string, string> = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
};

export async function GET() {
    return Response.json({ status: 'online', service: 'coach-review-sse' });
}

function formatSseEvent(data: Record<string, unknown> | string): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return `data: ${payload}\n\n`;
}

function createRuleBasedReviewStreamResponse(params: GameReviewCourseParams, encoder: TextEncoder): Response {
    const stream = new ReadableStream({
        start(controller) {
            const course = generateRuleBasedGameReview(params);
            const fullJson = JSON.stringify(course, null, 2);
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
                        controller.enqueue(encoder.encode(formatSseEvent({ done: true, full: course })));
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

    const validation = await validateJsonBody(req, GameReviewRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    try {
        const body = validation.data;

        const params: GameReviewCourseParams = {
            analysis: body.analysis as GameReviewCourseParams['analysis'],
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
            'gemini-3.8-flash';

        const encoder = new TextEncoder();

        if (!apiKey) {
            return createRuleBasedReviewStreamResponse(params, encoder);
        }

        const userPrompt = buildGameReviewUserPrompt(params);
        const requestPayload: Record<string, unknown> = {
            model,
            messages: [
                { role: 'system', content: getGameReviewSystemPrompt(params.language) },
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

            // Repli automatique vers gemini-3.8-flash si l'identifiant du modèle retourne 404
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
            console.warn('[Coach Review API] Timeout (3s) ou erreur réseau LLM, repli heuristique :', fetchErr);
            return createRuleBasedReviewStreamResponse(params, encoder);
        } finally {
            clearTimeout(timeoutId);
        }

        if (!llmResponse.ok || !llmResponse.body) {
            console.warn(`[Coach Review API] Statut HTTP ${llmResponse.status}, bascule repli heuristique`);
            return createRuleBasedReviewStreamResponse(params, encoder);
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
                    console.error('[Coach Review API] Erreur pendant la lecture du flux LLM :', streamErr);
                } finally {
                    controller.enqueue(encoder.encode(formatSseEvent({ done: true })));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            },
        });

        return new Response(stream, { headers: SSE_HEADERS });
    } catch (err: unknown) {
        console.error('[Coach Review API] Erreur non gérée :', err);
        return new Response(
            JSON.stringify({
                error: 'Erreur lors du traitement de la demande de cours',
                details: err instanceof Error ? err.message : String(err),
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
}
