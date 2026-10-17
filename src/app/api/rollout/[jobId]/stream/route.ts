/**
 * Route Handler Next.js App Router — Diffusion en continu de la progression d'un rollout via SSE.
 *
 * Endpoint : GET /api/rollout/[jobId]/stream
 * Content-Type: text/event-stream
 */

import { NextRequest } from 'next/server';
import { simulatedRolloutManager } from '../../../../../lib/engine/rolloutSimulation';

const BACKEND_URL = process.env.GNUBG_BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

function formatSseEvent(data: Record<string, any>): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await context.params;
    const encoder = new TextEncoder();

    // 1. Tenter d'ouvrir le stream SSE vers le backend distant Python
    try {
        const backendResp = await fetch(`${BACKEND_URL}/api/jobs/${encodeURIComponent(jobId)}/stream`, {
            headers: { 'Accept': 'text/event-stream' },
            cache: 'no-store',
            signal: AbortSignal.timeout(1500),
        });

        if (backendResp.ok && backendResp.body) {
            return new Response(backendResp.body, {
                headers: {
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                },
            });
        }
    } catch {
        // Moteur distant indisponible, bascule sur le gestionnaire local
    }

    // 2. Diffusion locale via ReadableStream
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
        start(controller) {
            unsubscribe = simulatedRolloutManager.subscribe(jobId, (data) => {
                try {
                    controller.enqueue(encoder.encode(formatSseEvent(data)));
                    if (
                        data.status === 'completed' ||
                        data.status === 'cancelled' ||
                        data.status === 'failed'
                    ) {
                        setTimeout(() => {
                            try {
                                controller.close();
                            } catch {}
                        }, 20);
                    }
                } catch {
                    // Controller peut être fermé si le client s'est déconnecté
                }
            });
        },
        cancel() {
            if (unsubscribe) {
                unsubscribe();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
