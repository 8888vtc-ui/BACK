/**
 * Moteur de calcul du double indice public : Classement Elo Méritocratique + PR Moyen Public
 * avec Courbe Dégressive d'Elo (+30 pts max), Plafond Dynamique indexé sur le PR Moyen Public
 * et Garde-fous Anti-Collusion Humain-Humain.
 * Loi 1 : En navigateur (`typeof window !== 'undefined'`), aucune lecture/écriture `localStorage`
 * d'Elo ou de PR n'est effectuée tant que le joueur est Invité (`!checkIsPlayerRegistered()`).
 * Strictement <= 330 lignes, 0 any.
 */

import type { Player } from '../../engine/backgammonEngine';
import type { EloCalculationResult } from './types';
import { checkIsPlayerRegistered } from '../../hooks/useAuthenticPlayerStats';

export const DEFAULT_INITIAL_ELO = 1500;
export const MIN_ELO_RATING = 100;
export const DEFAULT_INITIAL_PUBLIC_PR = 8.5;
export const MIN_PUBLIC_AVERAGE_PR = 0.6;
export const PR_IMPROVEMENT_PER_FIRST_TRY_QUIZ = 0.15;
export const MAX_QUIZ_CRYSTALLIZATION_STACK = 5;
export const MIN_RANKED_DECISIONS_QUORUM = 6;
export const ESCROW_UNLOCK_STREAK_REQUIRED = 2;

const STORAGE_KEY_PUBLIC_PR = 'bg_public_average_pr_v1';
const STORAGE_KEY_FIRST_TRY_COUNT = 'bg_first_try_quiz_count_v1';
const STORAGE_KEY_FIRST_TRY_STREAK = 'bg_first_try_quiz_streak_v1';
const STORAGE_KEY_CRYSTALLIZATION_USED = 'bg_quiz_crystallization_used_v1';
const STORAGE_KEY_ESCROW_ELO = 'bg_escrow_elo_points_v1';
const STORAGE_KEY_LOCAL_ELO = 'bg_player_elo';

let inMemoryPublicPr = DEFAULT_INITIAL_PUBLIC_PR;
let inMemoryFirstTryCount = 0;
let inMemoryFirstTryStreak = 0;
let inMemoryCrystallizationUsed = 0;
let inMemoryEscrowElo = 0;
let inMemoryLocalElo = DEFAULT_INITIAL_ELO;

function canPersistInBrowser(): boolean {
    if (typeof window === 'undefined') return false;
    return checkIsPlayerRegistered();
}

export function readLocalPlayerElo(): number {
    if (!canPersistInBrowser()) return inMemoryLocalElo;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ELO);
        if (!raw) return inMemoryLocalElo;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < MIN_ELO_RATING) return DEFAULT_INITIAL_ELO;
        inMemoryLocalElo = Math.round(parsed);
        return inMemoryLocalElo;
    } catch { return inMemoryLocalElo; }
}

export function saveLocalPlayerElo(rating: number): number {
    const safeRating = Math.max(MIN_ELO_RATING, Math.round(rating));
    inMemoryLocalElo = safeRating;
    if (canPersistInBrowser()) {
        try { localStorage.setItem(STORAGE_KEY_LOCAL_ELO, String(safeRating)); } catch { /* ignore */ }
    }
    return safeRating;
}

export function resetPublicPrForTests(): void {
    inMemoryPublicPr = DEFAULT_INITIAL_PUBLIC_PR;
    inMemoryFirstTryCount = 0;
    inMemoryFirstTryStreak = 0;
    inMemoryCrystallizationUsed = 0;
    inMemoryEscrowElo = 0;
    inMemoryLocalElo = DEFAULT_INITIAL_ELO;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(STORAGE_KEY_PUBLIC_PR);
            localStorage.removeItem(STORAGE_KEY_FIRST_TRY_COUNT);
            localStorage.removeItem(STORAGE_KEY_FIRST_TRY_STREAK);
            localStorage.removeItem(STORAGE_KEY_CRYSTALLIZATION_USED);
            localStorage.removeItem(STORAGE_KEY_ESCROW_ELO);
            localStorage.removeItem(STORAGE_KEY_LOCAL_ELO);
        } catch { /* ignore */ }
    }
}

export interface MatchEloPrOptions {
    readonly prX?: number | null;
    readonly prO?: number | null;
    readonly publicPrX?: number | null;
    readonly publicPrO?: number | null;
    readonly decisionsCount?: number;
    readonly isPrivateRoom?: boolean;
}

export function getKFactor(rating: number): number {
    if (rating >= 2400) return 16;
    if (rating >= 2100) return 24;
    return 32;
}

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
    const diff = (ratingB - ratingA) / 400;
    return 1 / (1 + Math.pow(10, diff));
}

export function getMaxTargetEloForPublicPr(publicPr: number): number {
    const clampedPr = Math.max(MIN_PUBLIC_AVERAGE_PR, Math.min(20, publicPr));
    return Math.round(2250 - clampedPr * 65);
}

export function computeDegressiveEloGain(winnerRating: number, loserRating: number, winnerPublicPr?: number | null): number {
    const ratingGap = winnerRating - loserRating;
    let baseGain: number;
    if (ratingGap >= 500) baseGain = 1;
    else if (ratingGap <= -500) baseGain = 30;
    else if (ratingGap >= 0) baseGain = Math.max(1, Math.round(16 * Math.pow(1 - ratingGap / 500, 1.35)));
    else baseGain = Math.min(30, Math.round(16 + 14 * Math.pow(Math.abs(ratingGap) / 500, 0.9)));

    if (typeof winnerPublicPr === 'number' && Number.isFinite(winnerPublicPr) && baseGain > 1) {
        const targetMaxElo = getMaxTargetEloForPublicPr(winnerPublicPr);
        const distanceAboveCeiling = winnerRating - targetMaxElo;
        if (distanceAboveCeiling >= 120) return 1;
        if (distanceAboveCeiling > -100) {
            const progress = (distanceAboveCeiling + 100) / 220;
            const damping = Math.max(0.1, 1 - progress * 0.88);
            baseGain = Math.max(1, Math.round(baseGain * damping));
        }
    }
    return baseGain;
}

export function storeEscrowEloPoints(points: number): number {
    const safePoints = Math.max(0, Math.round(points));
    inMemoryEscrowElo = safePoints;
    if (canPersistInBrowser()) {
        try { localStorage.setItem(STORAGE_KEY_ESCROW_ELO, String(safePoints)); } catch { /* ignore */ }
    }
    return inMemoryEscrowElo;
}

export function readEscrowEloPoints(): number {
    if (!canPersistInBrowser()) return inMemoryEscrowElo;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ESCROW_ELO);
        if (!raw) return inMemoryEscrowElo;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        inMemoryEscrowElo = Math.round(parsed);
        return inMemoryEscrowElo;
    } catch { return inMemoryEscrowElo; }
}

export function calculateMatchElo(
    playerXRating: number, playerORating: number, winner: Player, customK?: number, prOptions?: MatchEloPrOptions,
): EloCalculationResult {
    const safeX = Math.max(MIN_ELO_RATING, Math.round(playerXRating));
    const safeO = Math.max(MIN_ELO_RATING, Math.round(playerORating));
    const expectedScoreX = calculateExpectedScore(safeX, safeO);
    const expectedScoreO = 1 - expectedScoreX;

    const isPrivate = prOptions?.isPrivateRoom === true;
    const belowDecisionQuorum = typeof prOptions?.decisionsCount === 'number' && prOptions.decisionsCount < MIN_RANKED_DECISIONS_QUORUM;

    if (isPrivate || belowDecisionQuorum) {
        return {
            playerXNewRating: safeX, playerONewRating: safeO, deltaX: 0, deltaO: 0,
            expectedScoreX: Math.round(expectedScoreX * 1000) / 1000, expectedScoreO: Math.round(expectedScoreO * 1000) / 1000,
            prBlockedGain: false, prShieldActivated: false, escrowEloPoints: 0, antiCollusionLimited: true,
        };
    }

    let deltaX = 0; let deltaO = 0; let prBlockedGain = false; let prShieldActivated = false; let escrowEloPoints = 0;
    const hasValidPrs = typeof prOptions?.prX === 'number' && Number.isFinite(prOptions.prX) && typeof prOptions?.prO === 'number' && Number.isFinite(prOptions.prO);
    const prX = hasValidPrs ? (prOptions!.prX as number) : null;
    const prO = hasValidPrs ? (prOptions!.prO as number) : null;

    if (winner === 'X') {
        const degressiveGainX = customK !== undefined ? Math.round(customK * (1 - expectedScoreX)) : computeDegressiveEloGain(safeX, safeO, prOptions?.publicPrX);
        if (prX !== null && prO !== null && prX > prO) {
            escrowEloPoints = Math.max(1, Math.round(degressiveGainX * 0.5));
            storeEscrowEloPoints(escrowEloPoints); prBlockedGain = true; prShieldActivated = true;
        } else {
            deltaX = degressiveGainX; deltaO = -degressiveGainX;
        }
    } else {
        const degressiveGainO = customK !== undefined ? Math.round(customK * (1 - expectedScoreO)) : computeDegressiveEloGain(safeO, safeX, prOptions?.publicPrO);
        if (prX !== null && prO !== null && prO > prX) {
            escrowEloPoints = Math.max(1, Math.round(degressiveGainO * 0.5));
            storeEscrowEloPoints(escrowEloPoints); prBlockedGain = true; prShieldActivated = true;
        } else {
            deltaO = degressiveGainO; deltaX = -degressiveGainO;
        }
    }

    return {
        playerXNewRating: Math.max(MIN_ELO_RATING, safeX + deltaX), playerONewRating: Math.max(MIN_ELO_RATING, safeO + deltaO),
        deltaX, deltaO, expectedScoreX: Math.round(expectedScoreX * 1000) / 1000, expectedScoreO: Math.round(expectedScoreO * 1000) / 1000,
        prBlockedGain, prShieldActivated, escrowEloPoints,
    };
}

export function readPublicAveragePr(): number {
    if (!canPersistInBrowser()) return inMemoryPublicPr;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PUBLIC_PR);
        if (!raw) return inMemoryPublicPr;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < MIN_PUBLIC_AVERAGE_PR || parsed > 25) return DEFAULT_INITIAL_PUBLIC_PR;
        inMemoryPublicPr = Number(parsed.toFixed(2));
        return inMemoryPublicPr;
    } catch { return inMemoryPublicPr; }
}

export function getTargetQuizTierFromPublicPr(publicPr: number = readPublicAveragePr()): 1 | 2 | 3 | 4 {
    if (publicPr < 3.0) return 4;
    if (publicPr <= 5.5) return 3;
    if (publicPr <= 9.0) return 2;
    return 1;
}

export function readQuizAddictionState() {
    return {
        firstTryStreak: inMemoryFirstTryStreak,
        crystallizationUsed: inMemoryCrystallizationUsed,
        crystallizationMax: MAX_QUIZ_CRYSTALLIZATION_STACK,
        escrowEloPoints: readEscrowEloPoints(),
    };
}

export function breakFirstTryQuizStreak(): void {
    inMemoryFirstTryStreak = 0;
    if (canPersistInBrowser()) {
        try { localStorage.setItem(STORAGE_KEY_FIRST_TRY_STREAK, '0'); } catch { /* ignore */ }
    }
}

export function getStreakPrReduction(streak: number): number {
    if (streak >= 5) return 0.35;
    if (streak >= 3) return 0.25;
    return PR_IMPROVEMENT_PER_FIRST_TRY_QUIZ;
}

export function rewardFirstTryQuizOnPublicPr() {
    const previousPr = readPublicAveragePr();
    inMemoryFirstTryStreak += 1;
    inMemoryFirstTryCount += 1;

    const crystallizationCapped = inMemoryCrystallizationUsed >= MAX_QUIZ_CRYSTALLIZATION_STACK;
    const reduction = crystallizationCapped ? 0 : getStreakPrReduction(inMemoryFirstTryStreak);
    if (!crystallizationCapped) inMemoryCrystallizationUsed += 1;

    const newPr = Number(Math.max(MIN_PUBLIC_AVERAGE_PR, previousPr - reduction).toFixed(2));
    const deltaPr = Number((newPr - previousPr).toFixed(2));
    inMemoryPublicPr = newPr;

    let unlockedEscrowElo = 0;
    const currentEscrow = readEscrowEloPoints();
    if (currentEscrow > 0 && inMemoryFirstTryStreak >= ESCROW_UNLOCK_STREAK_REQUIRED) {
        unlockedEscrowElo = currentEscrow;
        storeEscrowEloPoints(0);
        saveLocalPlayerElo(readLocalPlayerElo() + unlockedEscrowElo);
    }

    let totalFirstTrySolved = inMemoryFirstTryCount;
    if (canPersistInBrowser()) {
        try {
            localStorage.setItem(STORAGE_KEY_PUBLIC_PR, String(newPr));
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_STREAK, String(inMemoryFirstTryStreak));
            localStorage.setItem(STORAGE_KEY_CRYSTALLIZATION_USED, String(inMemoryCrystallizationUsed));
            const prevCount = Number(localStorage.getItem(STORAGE_KEY_FIRST_TRY_COUNT) || '0');
            totalFirstTrySolved = (Number.isFinite(prevCount) ? prevCount : 0) + 1;
            inMemoryFirstTryCount = totalFirstTrySolved;
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_COUNT, String(totalFirstTrySolved));
        } catch { /* ignore */ }
    }

    return {
        previousPr, newPr, deltaPr, totalFirstTrySolved,
        firstTryStreak: inMemoryFirstTryStreak, crystallizationUsed: inMemoryCrystallizationUsed,
        crystallizationCapped, unlockedEscrowElo,
    };
}

export function recordMatchIntoPublicAveragePr(matchPr: number): number {
    inMemoryCrystallizationUsed = 0;
    if (canPersistInBrowser()) {
        try { localStorage.setItem(STORAGE_KEY_CRYSTALLIZATION_USED, '0'); } catch { /* ignore */ }
    }
    if (!Number.isFinite(matchPr) || matchPr < 0) return readPublicAveragePr();
    const current = readPublicAveragePr();
    const blended = Number(Math.max(MIN_PUBLIC_AVERAGE_PR, Math.min(25, current * 0.85 + matchPr * 0.15)).toFixed(2));
    inMemoryPublicPr = blended;
    if (canPersistInBrowser()) {
        try { localStorage.setItem(STORAGE_KEY_PUBLIC_PR, String(blended)); } catch { /* ignore */ }
    }
    return blended;
}

export interface EloTierInfo {
    title: string; badge: string; colorClass: string; minRating: number;
}

export const ELO_TIERS: EloTierInfo[] = [
    { title: 'Légende', badge: '👑', colorClass: 'text-amber-400', minRating: 2100 },
    { title: 'Grand-Maître', badge: '💎', colorClass: 'text-purple-400', minRating: 1900 },
    { title: 'Maître', badge: '⚔️', colorClass: 'text-rose-400', minRating: 1700 },
    { title: 'Compétiteur', badge: '🎯', colorClass: 'text-blue-400', minRating: 1500 },
    { title: 'Initié', badge: '🛡️', colorClass: 'text-emerald-400', minRating: 1300 },
    { title: 'Apprenti', badge: '🌱', colorClass: 'text-slate-400', minRating: 0 },
];

export function getEloTier(rating: number): EloTierInfo {
    const safeRating = Math.max(0, rating);
    for (const tier of ELO_TIERS) {
        if (safeRating >= tier.minRating) return tier;
    }
    return ELO_TIERS[ELO_TIERS.length - 1];
}
