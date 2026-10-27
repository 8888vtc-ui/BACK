/**
 * Route Handler Next.js App Router — Soumission de rollouts et statistiques du pool de workers GNUBG.
 *
 * Endpoints :
 * - POST /api/rollout : Soumet une tâche de rollout (trials: 324/1296/2592, candidateMoves)
 *   Retourne HTTP 202 Accepted avec { jobId, status: 'queued' }
 * - GET /api/rollout?stats=true : Renvoie les métriques temps réel du pool (poolSize, busy, queue, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { simulatedRolloutManager } from '../../../lib/engine/rolloutSimulation';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { RolloutRequestSchema, validateJsonBody } from '../../../lib/security/schemas';

const BACKEND_URL = process.env.GNUBG_BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // 1. Demande de statistiques du pool de workers
    if (searchParams.get('stats') === 'true') {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/pool/stats`, {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.timeout(1000),
            });
            if (resp.ok) {
                const stats = await resp.json();
                return NextResponse.json(stats);
            }
        } catch {
            // Repli sur le pool de workers simulé
        }
        return NextResponse.json(simulatedRolloutManager.getStats());
    }

    return NextResponse.json({ status: 'ok', service: 'montecarlo-rollout-pool' });
}

export async function POST(req: NextRequest) {
    // 1. Rate limiting sur la soumission de rollouts
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.ROLLOUT);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    // 2. Validation Zod du payload
    const validation = await validateJsonBody(req, RolloutRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    try {
        const { xgid, trials, ply, candidateMoves } = validation.data;

        // 1. Tentative de transmission au backend Python GNUBG si disponible
        try {
            const backendResp = await fetch(`${BACKEND_URL}/api/rollout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ xgid, trials, ply, candidateMoves }),
                signal: AbortSignal.timeout(1500),
            });

            if (backendResp.ok) {
                const job = await backendResp.json();
                return NextResponse.json(job, { status: 202 });
            }
        } catch {
            // Moteur distant non démarré : bascule transparente sur le gestionnaire local
        }

        // 2. Repli gracieux : exécution simulée asynchrone
        const simJob = simulatedRolloutManager.createJob({
            xgid,
            trials,
            ply,
            candidateMoves,
        });

        return NextResponse.json(
            {
                jobId: simJob.jobId,
                status: simJob.status,
                progress: simJob.progress,
            },
            { status: 202 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || 'Erreur interne lors de la soumission du rollout' },
            { status: 500 }
        );
    }
}
