/**
 * Moteur de calcul du double indice public : Classement Elo Méritocratique + PR Moyen Public.
 *
 * Règles d'Or BackgammonTour :
 * 1. Verrou Méritocratique par le PR : Le vainqueur ne gagne AUCUN point Elo (`delta = 0`)
 *    si le PR de son adversaire (ou du bot) dans la partie est meilleur (plus bas) que le sien (`winnerPr > loserPr`).
 * 2. Plafond d'Écart Elo (Anti-Farming) : Si un joueur beaucoup plus fort (ex: 2000 Elo) bat un joueur
 *    beaucoup plus faible (ex: 1400 Elo, écart >= 500), il ne gagne que `+1 Elo`.
 * 3. Prime d'Exploit Méritocratique : Si un outsider (ex: 1400 Elo vs 2000 Elo, écart >= 500) gagne
 *    ET réalise un meilleur PR que le favori (`winnerPr <= loserPr`), il remporte `+30 Elo`.
 * 4. Amélioration du PR Moyen Public par les Quizz : Chaque Quizz réussi au 1er essai améliore
 *    (diminue) le PR moyen public visible par tous aux côtés de l'Elo.
 */

import type { Player } from '../../engine/backgammonEngine';
import type { EloCalculationResult } from './types';

export const DEFAULT_INITIAL_ELO = 1500;
export const MIN_ELO_RATING = 100;

export const DEFAULT_INITIAL_PUBLIC_PR = 8.5;
export const MIN_PUBLIC_AVERAGE_PR = 0.6;
export const PR_IMPROVEMENT_PER_FIRST_TRY_QUIZ = 0.15;

const STORAGE_KEY_PUBLIC_PR = 'bg_public_average_pr_v1';
const STORAGE_KEY_FIRST_TRY_COUNT = 'bg_first_try_quiz_count_v1';

let inMemoryPublicPr = DEFAULT_INITIAL_PUBLIC_PR;
let inMemoryFirstTryCount = 0;

export function resetPublicPrForTests(): void {
    inMemoryPublicPr = DEFAULT_INITIAL_PUBLIC_PR;
    inMemoryFirstTryCount = 0;
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(STORAGE_KEY_PUBLIC_PR);
            localStorage.removeItem(STORAGE_KEY_FIRST_TRY_COUNT);
        } catch {
            // Ignore
        }
    }
}

export interface MatchEloPrOptions {
    readonly prX?: number | null;
    readonly prO?: number | null;
}

/**
 * Détermine le K-Factor approprié selon le niveau Elo actuel.
 */
export function getKFactor(rating: number): number {
    if (rating >= 2400) return 16;
    if (rating >= 2100) return 24;
    return 32;
}

/**
 * Calcule l'espérance mathématique de victoire d'un joueur A face à un joueur B.
 * Retourne un nombre entre 0.0 et 1.0.
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
    const diff = (ratingB - ratingA) / 400;
    return 1 / (1 + Math.pow(10, diff));
}

/**
 * Calcule la variation d'Elo pour une partie terminée en intégrant le verrou méritocratique de PR
 * et la règle d'écart extrême (2000 vs 1400 -> +1 Elo ; 1400 bat 2000 avec meilleur PR -> +30 Elo).
 */
export function calculateMatchElo(
    playerXRating: number,
    playerORating: number,
    winner: Player,
    customK?: number,
    prOptions?: MatchEloPrOptions,
): EloCalculationResult {
    const safeX = Math.max(MIN_ELO_RATING, Math.round(playerXRating));
    const safeO = Math.max(MIN_ELO_RATING, Math.round(playerORating));

    const expectedScoreX = calculateExpectedScore(safeX, safeO);
    const expectedScoreO = 1 - expectedScoreX;

    const actualScoreX = winner === 'X' ? 1 : 0;
    const actualScoreO = winner === 'O' ? 1 : 0;

    const kX = customK ?? getKFactor(safeX);
    const kO = customK ?? getKFactor(safeO);

    let deltaX = Math.round(kX * (actualScoreX - expectedScoreX));
    let deltaO = Math.round(kO * (actualScoreO - expectedScoreO));
    let prBlockedGain = false;

    const hasValidPrs =
        typeof prOptions?.prX === 'number' &&
        Number.isFinite(prOptions.prX) &&
        typeof prOptions?.prO === 'number' &&
        Number.isFinite(prOptions.prO);

    const prX = hasValidPrs ? (prOptions!.prX as number) : null;
    const prO = hasValidPrs ? (prOptions!.prO as number) : null;

    if (winner === 'X') {
        const ratingGap = safeX - safeO;
        // 1. Verrou PR : si le PR de l'adversaire O est meilleur (strictement inférieur) que celui de X -> 0 point Elo gagné
        if (prX !== null && prO !== null && prX > prO) {
            deltaX = 0;
            deltaO = 0;
            prBlockedGain = true;
        } else if (ratingGap >= 500) {
            // 2. Favori à gros écart (ex: 2000 vs 1400) -> ne gagne que +1 point Elo
            deltaX = 1;
            deltaO = -1;
        } else if (ratingGap <= -500) {
            // 3. Outsider à gros écart (ex: 1400 bat 2000 avec meilleur PR) -> gagne +30 points Elo
            deltaX = 30;
            deltaO = -30;
        }
    } else {
        const ratingGap = safeO - safeX;
        if (prX !== null && prO !== null && prO > prX) {
            deltaO = 0;
            deltaX = 0;
            prBlockedGain = true;
        } else if (ratingGap >= 500) {
            deltaO = 1;
            deltaX = -1;
        } else if (ratingGap <= -500) {
            deltaO = 30;
            deltaX = -30;
        }
    }

    const playerXNewRating = Math.max(MIN_ELO_RATING, safeX + deltaX);
    const playerONewRating = Math.max(MIN_ELO_RATING, safeO + deltaO);

    return {
        playerXNewRating,
        playerONewRating,
        deltaX,
        deltaO,
        expectedScoreX: Math.round(expectedScoreX * 1000) / 1000,
        expectedScoreO: Math.round(expectedScoreO * 1000) / 1000,
        prBlockedGain,
    };
}

/**
 * Lit le PR Moyen Public du joueur (affiché partout à côté de son Elo).
 */
export function readPublicAveragePr(): number {
    if (typeof window === 'undefined') return inMemoryPublicPr;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PUBLIC_PR);
        if (!raw) return inMemoryPublicPr;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < MIN_PUBLIC_AVERAGE_PR || parsed > 25) {
            return DEFAULT_INITIAL_PUBLIC_PR;
        }
        inMemoryPublicPr = Number(parsed.toFixed(2));
        return inMemoryPublicPr;
    } catch {
        return inMemoryPublicPr;
    }
}

/**
 * Récompense une réussite au 1er essai sur un Quizz en améliorant (abaissant) le PR Moyen Public du joueur.
 */
export function rewardFirstTryQuizOnPublicPr(): {
    readonly previousPr: number;
    readonly newPr: number;
    readonly deltaPr: number;
    readonly totalFirstTrySolved: number;
} {
    const previousPr = readPublicAveragePr();
    const newPr = Number(
        Math.max(MIN_PUBLIC_AVERAGE_PR, previousPr - PR_IMPROVEMENT_PER_FIRST_TRY_QUIZ).toFixed(2),
    );
    const deltaPr = Number((newPr - previousPr).toFixed(2));
    inMemoryPublicPr = newPr;
    inMemoryFirstTryCount += 1;
    let totalFirstTrySolved = inMemoryFirstTryCount;

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_PUBLIC_PR, String(newPr));
            const prevCount = Number(localStorage.getItem(STORAGE_KEY_FIRST_TRY_COUNT) || '0');
            totalFirstTrySolved = (Number.isFinite(prevCount) ? prevCount : 0) + 1;
            inMemoryFirstTryCount = totalFirstTrySolved;
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_COUNT, String(totalFirstTrySolved));
        } catch {
            // Ignore quota errors
        }
    }

    return { previousPr, newPr, deltaPr, totalFirstTrySolved };
}

/**
 * Met à jour le PR Moyen Public du joueur après une partie complète (moyenne glissante pondérée).
 */
export function recordMatchIntoPublicAveragePr(matchPr: number): number {
    if (!Number.isFinite(matchPr) || matchPr < 0) return readPublicAveragePr();
    const current = readPublicAveragePr();
    const blended = Number(
        Math.max(MIN_PUBLIC_AVERAGE_PR, Math.min(25, current * 0.85 + matchPr * 0.15)).toFixed(2),
    );
    inMemoryPublicPr = blended;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_PUBLIC_PR, String(blended));
        } catch {
            // Ignore
        }
    }
    return blended;
}

export interface EloTierInfo {
    title: string;
    badge: string;
    colorClass: string;
    minRating: number;
}

export const ELO_TIERS: EloTierInfo[] = [
    { title: 'Légende', badge: '👑', colorClass: 'text-amber-400', minRating: 2100 },
    { title: 'Grand-Maître', badge: '💎', colorClass: 'text-purple-400', minRating: 1900 },
    { title: 'Maître', badge: '⚔️', colorClass: 'text-rose-400', minRating: 1700 },
    { title: 'Compétiteur', badge: '🎯', colorClass: 'text-blue-400', minRating: 1500 },
    { title: 'Initié', badge: '🛡️', colorClass: 'text-emerald-400', minRating: 1300 },
    { title: 'Apprenti', badge: '🌱', colorClass: 'text-slate-400', minRating: 0 },
];

/**
 * Retourne le rang/titre et badge associé à un score Elo.
 */
export function getEloTier(rating: number): EloTierInfo {
    const safeRating = Math.max(0, rating);
    for (const tier of ELO_TIERS) {
        if (safeRating >= tier.minRating) {
            return tier;
        }
    }
    return ELO_TIERS[ELO_TIERS.length - 1];
}
