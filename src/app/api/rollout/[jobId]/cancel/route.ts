/**
 * Route Handler Next.js App Router — Annulation coopérative d'un job de rollout en cours.
 *
 * Endpoint : POST /api/rollout/[jobId]/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulatedRolloutManager } from '../../../../../lib/engine/rolloutSimulation';

const BACKEND_URL = process.env.GNUBG_BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function POST(
    _req: NextRequest,
    context: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await context.params;

    // 1. Essai backend Python
    try {
        const resp = await fetch(`${BACKEND_URL}/api/jobs/${encodeURIComponent(jobId)}/cancel`, {
            method: 'POST',
            signal: AbortSignal.timeout(1000),
        });
        if (resp.ok) {
            const data = await resp.json();
            return NextResponse.json({
                ...data,
                cancelled: data.cancelled ?? (data.status === 'cancelled'),
            });
        }
    } catch {
        // Fallback local
    }

    // 2. Annulation dans le gestionnaire local
    const cancelled = simulatedRolloutManager.cancelJob(jobId);
    return NextResponse.json({
        jobId,
        cancelled,
        status: cancelled ? 'cancelled' : 'not_found_or_finished',
    });
}
