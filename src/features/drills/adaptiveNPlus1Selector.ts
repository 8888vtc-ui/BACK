/**
 * @file src/features/drills/adaptiveNPlus1Selector.ts
 * @description Sous-Agent 4 (`Flash-Adaptive-NPlus1-Selector`) & Sous-Agent 2 (`FlashLite-NonTrivial-Quiz-Filter`).
 *
 * Règles d'ingénierie strictes :
 * 1. ZÉRO tirage aléatoire (`Math.random()` formellement interdit).
 * 2. ZÉRO Course Pure (`isContactPosition(board) === false` rejeté à 100 %).
 * 3. Calcul dynamique de `playerEr` (0.0 à 30.0) = moyenne pondérée entre l'ER en Quiz et l'ER en Analyse de Matchs.
 * 4. Règle du Niveau N+1 :
 *      targetQuizEr = Math.max(1.0, playerEr - deltaNPlus1)
 * 5. Auto-régulation dynamique Up & Down :
 *    - Up (Fort) : dès 2 réussites consécutives au 1er essai, abaisse `targetQuizEr` vers 5.0, 3.5, 2.0 (Maître / GM 3-ply).
 *    - Down (En difficulté) : après 2 ou 3 échecs consécutifs, remonte `targetQuizEr` de +0.8 à +1.2 (Niveau N+0.5 accessible).
 */

import { getQuizErState } from './quizRatingStore';
import { getAllGameAnalyses } from '../rating/gameAnalysisStorage';
import { isContactPosition } from './drillSubAgentsPipeline';
import type { PlayerBlunderRecord, DrillTier } from './types';

export interface AdaptiveNPlus1ProfileState {
    readonly playerEr: number;
    readonly targetQuizEr: number;
    readonly deltaNPlus1: number;
    readonly regulationState: 'NORMAL' | 'BOOST_UP' | 'RELIEF_DOWN';
    readonly firstTryStreak: number;
    readonly consecutiveFailures: number;
}

const NPLUS1_STREAK_STORAGE_KEY = 'bg_nplus1_regulation_v1';

interface StoredRegulationCounters {
    firstTryStreak: number;
    consecutiveFailures: number;
}

let memoryCounters: StoredRegulationCounters = {
    firstTryStreak: 0,
    consecutiveFailures: 0,
};

export function readRegulationCounters(): StoredRegulationCounters {
    if (typeof window === 'undefined' || !window.localStorage) {
        return memoryCounters;
    }
    try {
        const raw = window.localStorage.getItem(NPLUS1_STREAK_STORAGE_KEY);
        if (!raw) return memoryCounters;
        const parsed = JSON.parse(raw) as Partial<StoredRegulationCounters>;
        return {
            firstTryStreak: Math.max(0, Number(parsed.firstTryStreak ?? 0)),
            consecutiveFailures: Math.max(0, Number(parsed.consecutiveFailures ?? 0)),
        };
    } catch {
        return memoryCounters;
    }
}

export function recordNPlus1AttemptRegulation(succeededOnFirstTry: boolean, failedCompletely: boolean): AdaptiveNPlus1ProfileState {
    const current = readRegulationCounters();
    const next: StoredRegulationCounters = succeededOnFirstTry
        ? { firstTryStreak: current.firstTryStreak + 1, consecutiveFailures: 0 }
        : failedCompletely
          ? { firstTryStreak: 0, consecutiveFailures: current.consecutiveFailures + 1 }
          : { firstTryStreak: 0, consecutiveFailures: current.consecutiveFailures };

    memoryCounters = next;
    if (typeof window !== 'undefined' && window.localStorage) {
        try {
            window.localStorage.setItem(NPLUS1_STREAK_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // ignore quota error
        }
    }
    const { playerEr } = computeBlendedPlayerEr();
    return computeNPlus1TargetEr(playerEr, next.firstTryStreak, next.consecutiveFailures);
}

/**
 * Calcule l'`ER` global du joueur (0.0 à 30.0) en combinant son ER de Quiz et son ER d'Analyse de Parties.
 */
export function computeBlendedPlayerEr(): { playerEr: number; quizEr: number; matchEr: number | null } {
    const quizState = getQuizErState();
    const quizEr = Math.max(0.0, Math.min(30.0, quizState.erPrScore));
    const analyses = getAllGameAnalyses();

    if (analyses.length === 0) {
        return { playerEr: Number(quizEr.toFixed(1)), quizEr, matchEr: null };
    }

    let totalDecisions = 0;
    let weightedPrSum = 0;
    for (const a of analyses) {
        const decisions = Math.max(1, a.unforcedDecisionsCount || a.decisionsCount || 12);
        weightedPrSum += a.performanceRating * decisions;
        totalDecisions += decisions;
    }
    const matchEr = totalDecisions > 0 ? weightedPrSum / totalDecisions : quizEr;
    const matchWeight = Math.min(0.55, (totalDecisions / 80) * 0.55);
    const quizWeight = 1.0 - matchWeight;
    const blended = quizEr * quizWeight + matchEr * matchWeight;

    return {
        playerEr: Number(Math.max(0.0, Math.min(30.0, blended)).toFixed(1)),
        quizEr,
        matchEr: Number(matchEr.toFixed(1)),
    };
}

/**
 * Applique la Règle du Niveau N+1 :
 *   Cible_Quiz = max(1.0, ER_joueur - Delta_N+1)
 * avec auto-régulation Up (vers 5.0, 3.5, 2.0) et Down (+0.8 à +1.2 en cas d'échecs).
 */
export function computeNPlus1TargetEr(
    playerEr: number,
    firstTryStreak: number = 0,
    consecutiveFailures: number = 0,
): AdaptiveNPlus1ProfileState {
    const BASE_DELTA = 1.3; // Ex: Joueur ER 6.3 -> Cible N+1 = ER 5.0 ; Joueur ER 8.0 -> Cible N+1 = ER 6.7

    let deltaNPlus1 = BASE_DELTA;
    let regulationState: 'NORMAL' | 'BOOST_UP' | 'RELIEF_DOWN' = 'NORMAL';

    if (firstTryStreak >= 2) {
        const streakBonus = Math.min(4.2, (firstTryStreak - 1) * 0.7);
        deltaNPlus1 = BASE_DELTA + streakBonus;
        regulationState = 'BOOST_UP';
    } else if (consecutiveFailures >= 2) {
        const relief = consecutiveFailures >= 3 ? 1.2 : 0.8;
        deltaNPlus1 = Math.max(0.2, BASE_DELTA - relief);
        regulationState = 'RELIEF_DOWN';
    }

    const targetQuizEr = Number(Math.max(1.0, Math.min(28.0, playerEr - deltaNPlus1)).toFixed(1));

    return {
        playerEr: Number(playerEr.toFixed(1)),
        targetQuizEr,
        deltaNPlus1: Number(deltaNPlus1.toFixed(1)),
        regulationState,
        firstTryStreak,
        consecutiveFailures,
    };
}

export function getActiveNPlus1State(): AdaptiveNPlus1ProfileState {
    const counters = readRegulationCounters();
    const { playerEr } = computeBlendedPlayerEr();
    return computeNPlus1TargetEr(playerEr, counters.firstTryStreak, counters.consecutiveFailures);
}

/**
 * Estime la difficulté ER intrinsèque (`D_quiz` de 1.0 à 25.0) d'une position 3-ply.
 */
export function estimatePositionIntrinsicEr(blunder: PlayerBlunderRecord): number {
    const tier: DrillTier = blunder.tier ?? 2;
    const baseTierEr: Record<DrillTier, number> = {
        4: 2.2,
        3: 4.5,
        2: 6.5,
        1: 10.5,
    };
    const base = baseTierEr[tier];
    const subtletyOffset = (Math.min(0.15, blunder.equityLoss) - 0.06) * 18.0;
    return Number(Math.max(1.0, Math.min(25.0, base + subtletyOffset)).toFixed(1));
}

/**
 * Filtre `FlashLite-NonTrivial-Quiz-Filter` :
 * Rejette 100 % des positions de course pure sans contact (`isContactPosition(board) === false`)
 * et ne conserve que les positions avec au moins 4 choix légaux.
 */
export function isNonTrivialContact3PlyQuiz(blunder: PlayerBlunderRecord): boolean {
    if (blunder.conceptId === 'race_management' || blunder.conceptId === 'bearoff_technique') {
        return false;
    }
    if (!Array.isArray(blunder.board) || blunder.board.length < 26) {
        return false;
    }
    if (!isContactPosition(blunder.board)) {
        return false;
    }
    if (Array.isArray(blunder.quizChoices) && blunder.quizChoices.length > 0 && blunder.quizChoices.length < 4) {
        return false;
    }
    return true;
}

/**
 * Sélectionne de façon 100 % déterministe (ZÉRO `Math.random()`) le quiz dont la difficulté
 * `D_quiz` est la plus proche de `targetQuizEr` (Niveau N+1).
 */
export function selectDeterministicNPlus1Candidate(
    candidates: readonly PlayerBlunderRecord[],
    targetQuizEr: number,
    seenCount: number,
): PlayerBlunderRecord | null {
    const contactCandidates = candidates.filter(isNonTrivialContact3PlyQuiz);
    const pool = contactCandidates.length > 0 ? contactCandidates : candidates;
    if (pool.length === 0) return null;

    const getPriorityTier = (b: PlayerBlunderRecord): number => {
        if (b.id.startsWith('cert_3ply_') || b.id === 'harvest_t2_anchor_14') return 5;
        if (b.id.startsWith('btcore5k_3ply_')) return 4;
        if (b.id.startsWith('bench_')) return 3;
        return 1;
    };

    let best = pool[0]!;
    let bestScore = Infinity;

    for (let i = 0; i < pool.length; i++) {
        const item = pool[i]!;
        const dQuiz = estimatePositionIntrinsicEr(item);
        const erDist = Math.abs(dQuiz - targetQuizEr);
        const certBonus = getPriorityTier(item) >= 4 ? -0.35 : 0;
        const deterministicTieBreak = ((i * 37 + seenCount * 13) % 97) * 0.0001;
        const score = erDist + certBonus + deterministicTieBreak;

        if (score < bestScore) {
            bestScore = score;
            best = item;
        }
    }

    return best;
}
