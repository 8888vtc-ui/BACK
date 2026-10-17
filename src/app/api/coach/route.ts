/**
 * Route Handler Next.js App Router — Explication de coach Backgammon en streaming SSE.
 *
 * Endpoint : POST /api/coach
 * Payload : { verdict, equityLoss, playedMove, optimalMove, features, matchContext, playerLevel }
 *
 * Comportement :
 * 1. Reçoit le diagnostic du classificateur, les concepts extraits et le contexte de match.
 * 2. Formate le prompt avec BACKGAMMON_COACH_SYSTEM_PROMPT et règle anti-hallucination.
 * 3. Appelle un fournisseur LLM OpenAI-compatible (via OPENAI_API_KEY / OPENAI_BASE_URL / OPENAI_MODEL).
 * 4. Streame la réponse mot à mot au client via Server-Sent Events (SSE).
 * 5. Repli gracieux : si aucune clé n'est configurée ou si le LLM est indisponible,
 *    streame l'explication heuristique locale basée sur les règles sans planter.
 */

import { NextRequest } from 'next/server';
import {
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    getCoachSystemPrompt,
    buildCoachUserPrompt,
    generateRuleBasedExplanation,
    CoachPromptParams,
} from '../../../features/coach/prompts';
import { buildMatchContext, MatchContext } from '../../../features/coach/matchContext';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { CoachRequestSchema, validateJsonBody } from '../../../lib/security/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
    return Response.json({ status: 'online', service: 'coach-sse' });
}

function formatSseEvent(data: Record<string, any> | string): string {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return `data: ${payload}\n\n`;
}

/**
 * Streame une explication basée sur les règles (repli local / mode dégradé).
 */
function streamRuleBasedFallback(
    params: CoachPromptParams,
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
): void {
    const explanation = generateRuleBasedExplanation(params);
    const fullJson = JSON.stringify(explanation, null, 2);

    // Découpage en petits morceaux pour simuler un streaming naturel et fluide
    const chunkSize = 20;
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
    }, 15);
}

export async function POST(req: NextRequest | Request): Promise<Response> {
    // 1. Rate limiting strict sur le point d'entrée coach
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.COACH);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    // 2. Validation Zod du payload de la requête
    const validation = await validateJsonBody(req, CoachRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    try {
        const body = validation.data;

        const params: CoachPromptParams = {
            verdict: body.verdict,
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
            playerLevel: body.playerLevel,
            language: body.language,
        };

        const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';
        const rawBaseUrl = process.env.OPENAI_BASE_URL || process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '');
        const model = process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o-mini';

        const encoder = new TextEncoder();

        // 1. Si aucune clé LLM n'est configurée : repli instantané sur le streaming local
        if (!apiKey) {
            const stream = new ReadableStream({
                start(controller) {
                    streamRuleBasedFallback(params, controller, encoder);
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    Connection: 'keep-alive',
                },
            });
        }

        // 2. Appel au LLM OpenAI-compatible avec streaming
        const userPrompt = buildCoachUserPrompt(params);

        let llmResponse: Response;
        try {
            llmResponse = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: getCoachSystemPrompt(params.language) },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.2,
                    stream: true,
                }),
            });
        } catch (fetchErr) {
            console.warn('[Coach API] Erreur réseau lors de l\'appel LLM, repli heuristique :', fetchErr);
            const stream = new ReadableStream({
                start(controller) {
                    streamRuleBasedFallback(params, controller, encoder);
                },
            });
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    Connection: 'keep-alive',
                },
            });
        }

        if (!llmResponse.ok || !llmResponse.body) {
            console.warn(
                `[Coach API] Le LLM a retourné le statut HTTP ${llmResponse.status}, bascule sur le repli heuristique`,
            );
            const stream = new ReadableStream({
                start(controller) {
                    streamRuleBasedFallback(params, controller, encoder);
                },
            });
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    Connection: 'keep-alive',
                },
            });
        }

        // 3. Transformation du stream upstream en Server-Sent Events pour le client
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
                                const parsed = JSON.parse(dataStr);
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
                                // Ligne JSON partielle, ignorée
                            }
                        }
                    }
                } catch (streamErr) {
                    console.error('[Coach API] Erreur pendant la lecture du flux LLM :', streamErr);
                } finally {
                    controller.enqueue(encoder.encode(formatSseEvent({ done: true })));
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
            },
        });
    } catch (err: any) {
        console.error('[Coach API] Erreur non gérée :', err);
        return new Response(
            JSON.stringify({
                error: 'Erreur lors du traitement de la demande de coach',
                details: err instanceof Error ? err.message : String(err),
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
}
