/**
 * @file src/features/drills/blunderBank.ts
 * @description Façade de compatibilité unifiée vers `personalBlunderStore.ts` (`bg_personal_blunders_v1`).
 * 100 % des lectures et écritures sont redirigées vers le store unique `personalBlunderStore.ts`.
 * Strictement <= 300 lignes, 0 any.
 */

import type { PlayerBlunderRecord, BlunderBankStats, DrillTier } from './types';
import { BENCHMARK_BLUNDERS } from './benchmarkBlunders';
import {
    PERSONAL_BLUNDERS_STORAGE_KEY,
    getPersonalBlunders,
    recordPersonalMatchBlunder,
    markPersonalBlunderAttempt,
    clearPersonalBlunders,
    type PersonalBlunderRecord,
    type PersonalBlunderCandidate,
} from '../../lib/blunders/personalBlunderStore';

export const BLUNDER_BANK_STORAGE_KEY = PERSONAL_BLUNDERS_STORAGE_KEY;

const benchmarkProgressMap = new Map<string, { timesReviewed: number; timesSolved: number; isMastered: boolean; lastAttemptDate?: string }>();
const dynamicFactoryQuizzes: PlayerBlunderRecord[] = [];
const dynamicFactoryIds = new Set<string>();

export function registerFactoryQuizzes(quizzes: PlayerBlunderRecord[]): void {
    const existingIds = new Set(BENCHMARK_BLUNDERS.map((b) => b.id));
    for (const q of quizzes) {
        if (!existingIds.has(q.id) && !dynamicFactoryIds.has(q.id)) {
            dynamicFactoryIds.add(q.id);
            dynamicFactoryQuizzes.push(q);
        }
    }
}

export function clearRegisteredFactoryQuizzes(): void {
    dynamicFactoryQuizzes.length = 0;
    dynamicFactoryIds.clear();
}

export function personalBlunderToPlayerBlunder(rec: PersonalBlunderRecord): PlayerBlunderRecord {
    const choices = rec.candidatesTop4.map((c) => c.notation);
    return {
        id: rec.id,
        createdAt: rec.createdAtIso,
        board: [...rec.board],
        dice: [rec.dice[0], rec.dice[1]],
        player: rec.player,
        playedMove: rec.playerPlayedMove,
        optimalMove: rec.optimalMove,
        acceptableMoves: rec.candidatesTop4.filter((c) => Math.abs(c.lossEmg) <= 0.02).map((c) => c.notation),
        equityLoss: Math.abs(rec.deltaEmg),
        verdict: Math.abs(rec.deltaEmg) >= 0.15 ? 'howler' : Math.abs(rec.deltaEmg) >= 0.08 ? 'blunder' : 'doubtful',
        conceptId: rec.conceptId,
        conceptName: rec.conceptNameFr,
        explanation: rec.solutionExplanationFr,
        whyFailed: rec.mistakeExplanationFr,
        quizChoices: choices.length > 0 ? choices : [rec.optimalMove, rec.playerPlayedMove],
        tier: 3,
        timesReviewed: rec.attemptsCount,
        timesSolved: rec.status === 'RESOLVED' ? 1 : 0,
        isMastered: rec.status === 'RESOLVED',
        lastAttemptDate: rec.resolvedAtIso,
        matchContext: {
            matchLength: rec.matchLength,
            scoreX: rec.scoreBeforeMove.player,
            scoreO: rec.scoreBeforeMove.opponent,
            cubeValue: rec.cubeValue,
            cubeOwner: rec.cubeOwner,
            crawford: rec.isCrawford,
        },
    };
}

export function createDefaultBenchmarkBlunders(): PlayerBlunderRecord[] {
    return BENCHMARK_BLUNDERS.map((b) => {
        const prog = benchmarkProgressMap.get(b.id);
        return {
            ...b,
            board: [...b.board],
            dice: [b.dice[0], b.dice[1]],
            timesReviewed: prog?.timesReviewed ?? b.timesReviewed,
            timesSolved: prog?.timesSolved ?? b.timesSolved,
            isMastered: prog?.isMastered ?? b.isMastered,
            lastAttemptDate: prog?.lastAttemptDate ?? b.lastAttemptDate,
        };
    });
}

export function getAllBlunders(): PlayerBlunderRecord[] {
    const personal = getPersonalBlunders().map(personalBlunderToPlayerBlunder);
    const benchmarks = createDefaultBenchmarkBlunders();
    return [...personal, ...benchmarks, ...dynamicFactoryQuizzes];
}

export function saveAllBlunders(blunders: PlayerBlunderRecord[]): void {
    for (const b of blunders) {
        if (!BENCHMARK_BLUNDERS.some((bench) => bench.id === b.id)) {
            recordBlunder(b);
        }
    }
}

export function recordBlunder(
    data: Omit<PlayerBlunderRecord, 'id' | 'createdAt' | 'timesReviewed' | 'timesSolved' | 'isMastered'> &
        Partial<Pick<PlayerBlunderRecord, 'id' | 'createdAt' | 'timesReviewed' | 'timesSolved' | 'isMastered'>>,
): PlayerBlunderRecord {
    const absLoss = Math.abs(data.equityLoss);
    const choices = data.quizChoices && data.quizChoices.length >= 2 ? data.quizChoices : [data.optimalMove, data.playedMove];
    const top4: PersonalBlunderCandidate[] = choices.slice(0, 4).map((not, idx) => ({
        rank: idx + 1,
        notation: not,
        winProbPct: not === data.optimalMove ? 55.0 : Math.max(10, 55 - absLoss * 74),
        gammonProbPct: 15.0,
        equityEmg: not === data.optimalMove ? 0.35 : 0.35 - absLoss,
        lossEmg: not === data.optimalMove ? 0 : -absLoss,
        isPlayerPlayedMove: not === data.playedMove,
        isOptimalMove: not === data.optimalMove,
    }));

    const matchCtx = data.matchContext;
    const rec = recordPersonalMatchBlunder({
        id: data.id,
        userId: 'connected_member',
        createdAtIso: data.createdAt ?? new Date().toISOString(),
        opponentName: 'Adversaire',
        opponentElo: 1500,
        matchFormatLabel: (matchCtx?.matchLength ?? 5) > 0 ? `Match en ${matchCtx?.matchLength ?? 5} pts` : 'Money Game',
        matchLength: matchCtx?.matchLength ?? 5,
        scoreBeforeMove: { player: matchCtx?.scoreX ?? 0, opponent: matchCtx?.scoreO ?? 0 },
        isCrawford: matchCtx?.crawford ?? false,
        turnNumber: 1,
        decisionType: 'CHECKER_PLAY',
        board: [...data.board],
        player: data.player,
        xgid: '',
        dice: [data.dice[0], data.dice[1]],
        cubeValue: matchCtx?.cubeValue ?? 1,
        cubeOwner: matchCtx?.cubeOwner ?? null,
        pipCount: { player: 150, opponent: 150 },
        conceptId: data.conceptId,
        conceptNameFr: data.conceptName,
        conceptNameEn: data.conceptName,
        playerPlayedMove: data.playedMove,
        playerWinProbPct: 45.0,
        optimalMove: data.optimalMove,
        optimalWinProbPct: 55.0,
        winProbLossPct: 10.0,
        deltaEmg: -absLoss,
        erPenaltyPoints: Number(Math.min(0.5, Math.max(0.2, absLoss * 4.2)).toFixed(1)),
        candidatesTop4: top4,
        mistakeExplanationFr: data.whyFailed || data.explanation,
        mistakeExplanationEn: data.explanation,
        solutionExplanationFr: data.explanation,
        solutionExplanationEn: data.explanation,
        status: data.isMastered ? 'RESOLVED' : 'PENDING',
        resolvedAtIso: undefined,
        attemptsCount: data.timesReviewed ?? 0,
    });

    if (rec) {
        return personalBlunderToPlayerBlunder(rec);
    }

    return {
        id: data.id ?? `blunder_${Date.now()}`,
        createdAt: data.createdAt ?? new Date().toISOString(),
        board: [...data.board],
        dice: [data.dice[0], data.dice[1]],
        player: data.player,
        playedMove: data.playedMove,
        optimalMove: data.optimalMove,
        acceptableMoves: data.acceptableMoves ? [...data.acceptableMoves] : [],
        equityLoss: data.equityLoss,
        verdict: data.verdict,
        conceptId: data.conceptId,
        conceptName: data.conceptName,
        explanation: data.explanation,
        whyFailed: data.whyFailed,
        quizChoices: choices,
        timesReviewed: data.timesReviewed ?? 0,
        timesSolved: data.timesSolved ?? 0,
        isMastered: data.isMastered ?? false,
    };
}

export function getBlunderById(id: string): PlayerBlunderRecord | null {
    return getAllBlunders().find((b) => b.id === id) ?? null;
}

export function getBlundersToReview(conceptId?: string, tier?: DrillTier): PlayerBlunderRecord[] {
    const all = getAllBlunders();
    let filtered = conceptId && conceptId !== 'all' ? all.filter((b) => b.conceptId === conceptId) : all;
    if (tier) {
        filtered = filtered.filter((b) => (b.tier ?? 1) === tier);
    }
    const unmastered = filtered.filter((b) => !b.isMastered);
    if (unmastered.length > 0) {
        return unmastered.sort((a, b) => b.equityLoss - a.equityLoss);
    }
    return [...filtered].sort((a, b) => b.equityLoss - a.equityLoss);
}

export function markBlunderAttempt(id: string, isCorrect: boolean): PlayerBlunderRecord | null {
    const benchmark = BENCHMARK_BLUNDERS.find((b) => b.id === id);
    if (benchmark) {
        const prev = benchmarkProgressMap.get(id) ?? {
            timesReviewed: benchmark.timesReviewed,
            timesSolved: benchmark.timesSolved,
            isMastered: benchmark.isMastered,
        };
        const updated = {
            timesReviewed: prev.timesReviewed + 1,
            timesSolved: isCorrect ? prev.timesSolved + 1 : prev.timesSolved,
            isMastered: isCorrect || prev.isMastered,
            lastAttemptDate: new Date().toISOString(),
        };
        benchmarkProgressMap.set(id, updated);
        return {
            ...benchmark,
            ...updated,
            board: [...benchmark.board],
            dice: [benchmark.dice[0], benchmark.dice[1]],
        };
    }

    const updated = markPersonalBlunderAttempt(id, isCorrect);
    if (updated) {
        return personalBlunderToPlayerBlunder(updated);
    }
    return null;
}

export function resetBlunderMastery(id: string): void {
    if (benchmarkProgressMap.has(id)) {
        const prev = benchmarkProgressMap.get(id)!;
        benchmarkProgressMap.set(id, { ...prev, isMastered: false });
    }
    markPersonalBlunderAttempt(id, false);
}

export function resetAllBlunderMastery(): void {
    for (const [id, prev] of benchmarkProgressMap.entries()) {
        benchmarkProgressMap.set(id, { ...prev, isMastered: false });
    }
    const list = getPersonalBlunders();
    for (const item of list) {
        markPersonalBlunderAttempt(item.id, false);
    }
}

export function getBlunderBankStats(): BlunderBankStats {
    const blunders = getAllBlunders();
    const totalBlunders = blunders.length;
    const masteredCount = blunders.filter((b) => b.isMastered).length;
    const remainingToReview = totalBlunders - masteredCount;
    const masteryRate = totalBlunders > 0 ? Math.round((masteredCount / totalBlunders) * 100) : 0;

    let totalAttempts = 0;
    let totalSolved = 0;
    for (const b of blunders) {
        totalAttempts += b.timesReviewed || 0;
        totalSolved += b.timesSolved || 0;
    }
    const accuracyRate = totalAttempts > 0 ? Math.round((totalSolved / totalAttempts) * 100) : 0;

    return {
        totalBlunders,
        masteredCount,
        remainingToReview,
        masteryRate,
        accuracyRate,
        totalAttempts,
    };
}

export function clearBlunderBank(): void {
    benchmarkProgressMap.clear();
    clearPersonalBlunders();
}
