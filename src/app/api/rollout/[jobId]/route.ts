/**
 * Route Handler Next.js App Router — Polling du statut et du résultat d'un job de rollout.
 *
 * Endpoint : GET /api/rollout/[jobId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulatedRolloutManager } from '../../../../lib/engine/rolloutSimulation';

const BACKEND_URL = process.env.GNUBG_BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ jobId: string }> }
) {
    const { jobId } = await context.params;

    // 1. Essai backend Python
    try {
        const resp = await fetch(`${BACKEND_URL}/api/jobs/${encodeURIComponent(jobId)}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(1000),
        });
        if (resp.ok) {
            const data = await resp.json();
            return NextResponse.json(data);
        }
    } catch {
        // Fallback local
    }

    // 2. Recherche dans le gestionnaire local
    const simJob = simulatedRolloutManager.getJob(jobId);
    if (!simJob) {
        return NextResponse.json({ error: `Job ${jobId} introuvable` }, { status: 404 });
    }

    return NextResponse.json(simJob);
}
