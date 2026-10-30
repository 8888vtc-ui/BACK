/**
 * Route Handler Next.js App Router — Évaluation Backgammon (Coups de pions & Décision Videau).
 *
 * Endpoint : POST /api/evaluate
 * Sécurité :
 * - Rate Limiting strict (60 requêtes / minute par IP)
 * - Validation Zod du payload ({ xgid, ply })
 *
 * Moteur : évaluation déterministe locale via le moteur TypeScript tri-phase
 * (`src/lib/engine/evaluator.ts`). Aucune équité factice, aucun nombre magique :
 * si le backend externe est indisponible, on bascule directement sur le moteur
 * local embarqué, qui produit des équités réelles calculées par l'évaluateur.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_PROFILES } from '../../../lib/security/rateLimit';
import { EvaluateRequestSchema, validateJsonBody } from '../../../lib/security/schemas';
import { parseXGID, serializeCanonicalXGID } from '../../../engine/backgammonEngine';
import { analyzeBoardMoves, analyzeBoardCube } from '../../../lib/engine/evaluator';

export const dynamic = 'force-dynamic';

const DEFAULT_CLOUD_RUN_URL = 'https://bgsage-service-468274233732.europe-west1.run.app';
const CLOUD_RUN_TIMEOUT_MS = process.env.NODE_ENV === 'test' ? 1500 : 6000;
const REMOTE_BACKEND_COOLDOWN_MS = 10_000;
const BACKEND_URL =
    process.env.NODE_ENV === 'test'
        ? process.env.GNUBG_BACKEND_URL || 'http://localhost:8000'
        : (
              process.env.BACKEND_URL ||
              process.env.GNUBG_BACKEND_URL ||
              DEFAULT_CLOUD_RUN_URL
          ).replace(/\/+$/, '');

let remoteBackendCooldownUntil = 0;
let consecutiveFailures = 0;

export async function GET() {
    return NextResponse.json({
        service: 'backgammon-evaluate',
        status: 'online',
        engine: 'typescript-tri-phase',
        maxPly: 4,
        rateLimit: '60 req/min',
    });
}

export async function POST(req: NextRequest) {
    // 1. Rate Limiting sur l'évaluation
    const rateLimit = checkRateLimit(req, RATE_LIMIT_PROFILES.EVALUATE);
    if (!rateLimit.allowed && rateLimit.response) {
        return rateLimit.response;
    }

    // 2. Validation Zod stricte du payload
    const validation = await validateJsonBody(req, EvaluateRequestSchema);
    if (!validation.success) {
        return validation.response;
    }

    const { xgid, ply } = validation.data;

    // 3. Tentative d'évaluation via le backend Open Sage Cloud Run.
    //    Si indisponible, on bascule directement sur le moteur local déterministe.
    const shouldTryRemote =
        process.env.NODE_ENV === 'test' || Date.now() >= remoteBackendCooldownUntil;
    if (shouldTryRemote) {
        let canonicalXgid = xgid;
        try {
            canonicalXgid = serializeCanonicalXGID(parseXGID(xgid));
        } catch {
            canonicalXgid = xgid;
        }
        try {
            const backendResp = await fetch(`${BACKEND_URL}/api/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ xgid: canonicalXgid, ply }),
                signal: AbortSignal.timeout(CLOUD_RUN_TIMEOUT_MS),
            });

            if (backendResp.ok) {
                remoteBackendCooldownUntil = 0;
                consecutiveFailures = 0;
                const data = await backendResp.json();
                const payload =
                    data && typeof data === 'object'
                        ? { ...data, source: 'bgsage-cloud-run' }
                        : { data, source: 'bgsage-cloud-run' };
                return NextResponse.json(payload, {
                    status: 200,
                    headers: {
                        'X-RateLimit-Limit': String(rateLimit.result.limit),
                        'X-RateLimit-Remaining': String(rateLimit.result.remaining),
                    },
                });
            }
            consecutiveFailures++;
            if (process.env.NODE_ENV !== 'test' && consecutiveFailures >= 3) {
                remoteBackendCooldownUntil = Date.now() + REMOTE_BACKEND_COOLDOWN_MS;
            }
        } catch {
            // Backend distant indisponible ou timeout : incrémente les échecs et bascule sur le moteur local.
            consecutiveFailures++;
            if (process.env.NODE_ENV !== 'test' && consecutiveFailures >= 3) {
                remoteBackendCooldownUntil = Date.now() + REMOTE_BACKEND_COOLDOWN_MS;
            }
        }
    }

    // 4. Évaluation déterministe locale via le moteur TypeScript tri-phase.
    try {
        const state = parseXGID(xgid);
        const dice: [number, number] = state.dice ?? [3, 1];

        const movesResult = analyzeBoardMoves(state, dice, { ply: ply ?? 2, maxMoves: 64 });
        const cubeResult = analyzeBoardCube(state, { ply: ply ?? 2 });

        const chequerPlay = movesResult.moves.map((m) => ({
            rank: m.rank,
            notation: m.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            probabilities: m.probabilities ?? null,
            board: m.board ?? null,
            moves: m.moves ?? [],
        }));

        const cubeDecision = {
            noDouble: cubeResult.noDouble,
            doubleTake: cubeResult.doubleTake,
            doublePass: cubeResult.doublePass,
            optimalAction: cubeResult.optimalAction,
        };

        return NextResponse.json(
            { chequerPlay, cubeDecision, source: 'typescript-tri-phase' },
            {
                status: 200,
                headers: {
                    'X-RateLimit-Limit': String(rateLimit.result.limit),
                    'X-RateLimit-Remaining': String(rateLimit.result.remaining),
                },
            },
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne lors de l\'évaluation';
        return NextResponse.json(
            { error: 'Échec de l\'évaluation', message },
            { status: 500 },
        );
    }
}
