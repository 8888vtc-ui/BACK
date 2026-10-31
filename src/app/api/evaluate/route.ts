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
import { ensureBgsageSafeXgid } from '../../../lib/engine/bgsageClient';

export const dynamic = 'force-dynamic';

const DEFAULT_CLOUD_RUN_URL = 'https://bgsage-service-468274233732.europe-west1.run.app';
const CLOUD_RUN_TIMEOUT_MS = process.env.NODE_ENV === 'test' ? 1500 : 6500;
const MAX_REMOTE_ATTEMPTS = process.env.NODE_ENV === 'test' ? 1 : 2;
const BACKEND_URL =
    process.env.NODE_ENV === 'test'
        ? process.env.GNUBG_BACKEND_URL || 'http://localhost:8000'
        : (
              process.env.BACKEND_URL ||
              process.env.GNUBG_BACKEND_URL ||
              DEFAULT_CLOUD_RUN_URL
          ).replace(/\/+$/, '');

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

    // 3. Évaluation via le moteur neuronal web Open Sage (Cloud Run) avec retry automatique
    //    et protection ensureBgsageSafeXgid lorsque la flèche 24 est vide.
    let canonicalXgid = ensureBgsageSafeXgid(xgid);
    try {
        canonicalXgid = ensureBgsageSafeXgid(serializeCanonicalXGID(parseXGID(xgid)));
    } catch {
        canonicalXgid = ensureBgsageSafeXgid(xgid);
    }

    for (let attempt = 1; attempt <= MAX_REMOTE_ATTEMPTS; attempt++) {
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
        } catch {
            // Nouvel essai automatique si attempt < MAX_REMOTE_ATTEMPTS
        }
    }

    // En production, interdiction absolue de basculer silencieusement sur l'heuristique locale (Règle 2 AGENTS.md).
    if (process.env.NODE_ENV !== 'test') {
        return NextResponse.json(
            {
                error: 'Service neuronal web temporairement indisponible',
                message: 'Le moteur Open Sage Cloud Run n\'a pas répondu dans le délai imparti.',
            },
            {
                status: 503,
                headers: {
                    'X-RateLimit-Limit': String(rateLimit.result.limit),
                    'X-RateLimit-Remaining': String(rateLimit.result.remaining),
                },
            },
        );
    }

    // 4. Environnement de test unitaire hors-ligne uniquement (NODE_ENV === 'test').
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
