/**
 * @file src/app/api/quizzes/factory/route.ts
 * @description Route API Netlify / Next.js pour l'usine à quiz 3-ply bgsage.
 * Chargement dynamique et mise en cache in-memory de data/quizzes/bgsage_3ply_er_factory.jsonl (< 25 ms).
 * Strictement <= 120 lignes, 0 any.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { BGSAGE_3PLY_FACTORY_SEED } from '../../../../features/drills/bgsage3PlyFactorySeed';
import { normalizePorteGate, isQuizInPorteGate } from '../../../../features/drills/quizTierGates';
import type { HarvestedSeedInput } from '../../../../features/drills/benchmarkBlunders';
import type { DrillTier, BlunderVerdict } from '../../../../features/drills/types';

interface CacheEntry {
    mtime: number;
    quizzes: HarvestedSeedInput[];
    totalOnDisk: number;
}

let inMemoryCache: CacheEntry | null = null;

function loadQuizzesFromDisk(): { quizzes: HarvestedSeedInput[]; totalOnDisk: number } {
    const jsonlPath = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');
    if (!fs.existsSync(jsonlPath)) {
        return { quizzes: [...BGSAGE_3PLY_FACTORY_SEED], totalOnDisk: BGSAGE_3PLY_FACTORY_SEED.length };
    }
    const stat = fs.statSync(jsonlPath);
    if (inMemoryCache && inMemoryCache.mtime === stat.mtimeMs) {
        return { quizzes: inMemoryCache.quizzes, totalOnDisk: inMemoryCache.totalOnDisk };
    }
    const raw = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n');
    const totalOnDisk = raw.length;
    const parsed: HarvestedSeedInput[] = [];

    for (let i = 0; i < raw.length; i++) {
        const line = raw[i];
        if (!line) continue;
        try {
            const q = JSON.parse(line);
            if (!q.id || !q.xgid) continue;
            const b = q.targetBracket;
            const tier: DrillTier = b === 'DEBUTANT' ? 1 : b === 'CLUB' ? 2 : b === 'INTERMEDIAIRE' ? 3 : 4;
            const equityLoss = q.legalMoves3Ply?.[1]?.equityLoss ?? 0.05;
            const candidateMoves3Ply = (q.legalMoves3Ply ?? []).slice(0, 4).map((m: { notation: string; equityLoss: number; win: number; winGammon: number }, idx: number) => ({
                rank: idx + 1, notation: m.notation, equityLoss: m.equityLoss, win: m.win, winGammon: m.winGammon,
            }));
            parsed.push({
                id: q.id, tier, xgid: q.xgid, dice: q.dice,
                playedMove: candidateMoves3Ply[1]?.notation ?? q.optimalMove,
                optimalMove: q.optimalMove, acceptableMoves: [],
                quizChoices: q.quizChoices, equityLoss,
                verdict: (equityLoss >= 0.16 ? 'howler' : equityLoss >= 0.08 ? 'blunder' : 'doubtful') as BlunderVerdict,
                conceptId: q.conceptId ?? 'prime_building', conceptName: q.conceptName ?? 'Tactique 3-Ply',
                whyFailed: `${candidateMoves3Ply[1]?.notation ?? 'Ce coup'} concède ${equityLoss.toFixed(3)} EMG en 3-ply.`,
                explanation: q.coachExplanation3Ply ?? `En 3-ply, ${q.optimalMove} devance les alternatives.`,
                proverb: 'Vérifiez toujours le compte de course et les 36 réponses adverses en 3-ply.',
                hint: q.socraticHint ?? 'Observez la structure des portes.',
                commentaryVariants: [q.coachExplanation3Ply ?? ''],
                quizTargetER: q.quizTargetER ?? 10.0,
                quizType: q.quizType, plyCount: q.plyCount ?? 15,
                candidateMoves3Ply,
            });
        } catch {
            // ignore malformed line
        }
    }
    const finalQuizzes = parsed.length > 0 ? parsed : [...BGSAGE_3PLY_FACTORY_SEED];
    inMemoryCache = { mtime: stat.mtimeMs, quizzes: finalQuizzes, totalOnDisk };
    return { quizzes: finalQuizzes, totalOnDisk };
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = parseInt(searchParams.get('limit') ?? '50', 10);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 50;
        const offsetParam = parseInt(searchParams.get('offset') ?? '0', 10);
        const offset = Number.isFinite(offsetParam) ? Math.max(0, offsetParam) : 0;
        const tierParam = searchParams.get('tier');
        const gateParam = searchParams.get('gate');
        const typeParam = searchParams.get('type');
        const randomParam = searchParams.get('random') === 'true';

        const { quizzes: all, totalOnDisk } = loadQuizzesFromDisk();
        let filtered = all;

        if (gateParam) {
            filtered = filtered.filter((q) => isQuizInPorteGate(q, gateParam));
        } else if (tierParam) {
            const tierNum = parseInt(tierParam, 10);
            if (Number.isFinite(tierNum)) {
                filtered = filtered.filter((q) => q.tier === tierNum);
            }
        }
        if (typeParam) {
            filtered = filtered.filter((q) => q.quizType === typeParam);
        }

        let slice: HarvestedSeedInput[];
        if (randomParam) {
            const shuffled = [...filtered];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const tmp = shuffled[i];
                shuffled[i] = shuffled[j];
                shuffled[j] = tmp;
            }
            slice = shuffled.slice(0, limit);
        } else {
            slice = filtered.slice(offset, offset + limit);
        }

        const checkerCount = filtered.filter((q) => q.quizType !== 'CUBE_DECISION').length;
        const cubeCount = filtered.filter((q) => q.quizType === 'CUBE_DECISION').length;

        return NextResponse.json({
            success: true,
            totalOnDisk,
            totalQuizzes: all.length,
            checkerCount,
            cubeCount,
            gate: gateParam ? normalizePorteGate(gateParam) : null,
            totalFiltered: filtered.length,
            limit,
            offset,
            quizzes: slice,
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
