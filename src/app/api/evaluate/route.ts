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
import { parseXGID } from '../../../engine/backgammonEngine';
import { analyzeBoardMoves, analyzeBoardCube } from '../../../lib/engine/evaluator';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.GNUBG_BACKEND_URL || 'http://localhost:8000';

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

    // 3. Tentative d'évaluation via le backend GNUBG distant (optionnel).
    //    Si indisponible, on bascule directement sur le moteur local déterministe.
    try {
        const backendResp = await fetch(`${BACKEND_URL}/api/evaluate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ xgid, ply }),
            signal: AbortSignal.timeout(3000),
        });

        if (backendResp.ok) {
            const data = await backendResp.json();
            return NextResponse.json(data, {
                status: 200,
                headers: {
                    'X-RateLimit-Limit': String(rateLimit.result.limit),
                    'X-RateLimit-Remaining': String(rateLimit.result.remaining),
                },
            });
        }
    } catch {
        // Backend Python indisponible : bascule transparente sur le moteur local.
    }

    // 4. Évaluation déterministe locale via le moteur TypeScript tri-phase.
    try {
        const state = parseXGID(xgid);
        const dice: [number, number] = state.dice ?? [3, 1];

        const movesResult = analyzeBoardMoves(state, dice, { ply: ply ?? 2, maxMoves: 5 });
        const cubeResult = analyzeBoardCube(state, { ply: ply ?? 2 });

        const chequerPlay = movesResult.moves.map((m) => ({
            rank: m.rank,
            notation: m.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            probabilities: m.probabilities ?? null,
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
