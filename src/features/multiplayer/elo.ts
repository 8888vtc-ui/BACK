/**
 * Moteur de calcul du double indice public : Classement Elo Méritocratique + PR Moyen Public
 * avec Courbe Dégressive d'Elo (+30 pts max), Plafond Dynamique indexé sur le PR Moyen Public
 * (empêche de monter à des Elo irréalistes en battant des bots), Boucle d'Addiction Quizz
 * et Garde-fous Anti-Collusion Humain-Humain.
 *
 * Règles d'Or BackgammonTour :
 * 1. Verrou Méritocratique par le PR + Elo en Séquestre (Escrow) :
 *    Le vainqueur ne gagne AUCUN point Elo immédiat (`delta = 0`) si le PR de son adversaire
 *    est meilleur (`winnerPr > loserPr`). 50% de son gain théorique est mis en « Elo en Séquestre »,
 *    déblocable en réussissant 2 Quizz de suite au 1er essai !
 * 2. Bouclier de Maîtrise PR (Anti-Ragequit) :
 *    Si le perdant a joué un meilleur PR que le vainqueur (`loserPr < winnerPr`), il perd `0 Elo`.
 * 3. Courbe Dégressive Continue des Points Elo (de +30 pts à +1 pt) :
 *    - Le gain n'est JAMAIS fixe à 30 points : il varie de façon continue et dégressive (`computeScaledBaseEloGain`)
 *      selon l'écart de niveau (`ratingGap = winnerRating - loserRating`) :
 *        * Outsider à -500 Elo ou plus (ex: 1400 bat 2000 avec meilleur PR) -> `+30 Elo`
 *        * Outsider à -250 Elo -> `~+23 Elo`
 *        * Égalité (écart 0) -> `+15 Elo`
 *        * Favori à +150 Elo -> `~+9 Elo`
 *        * Favori à +300 Elo -> `~+4 Elo`
 *        * Favori à +500 Elo ou plus (ex: 2000 bat 1400) -> `+1 Elo`
 * 4. Plafond Elo Dynamique piloté par le PR Moyen Public (`computePrCeilingFactor`) :
 *    C'est le PR qui gouverne l'Elo ! Un joueur ne peut pas monter à des Elo élevés en enchaînant les bots
 *    si son PR Moyen Public ne suit pas :
 *    `targetMaxEloForPr = 2250 - publicPr * 65` (ex: PR 10.0 -> plafond ~1600 Elo ; PR 6.0 -> ~1860 Elo ; PR 2.5 -> ~2085 Elo).
 *    Plus l'Elo du joueur approche ou dépasse le plafond autorisé par son PR, plus son gain Elo diminue crescendo jusqu'à `+1 Elo`.
 * 5. Garde-fous Anti-Collusion Humain-Humain :
 *    - Salon privé (`isPrivateRoom: true`) ou moins de 6 décisions (`decisionsCount < 6`) -> `0 Elo`.
 */

import type { Player } from '../../engine/backgammonEngine';
import type { EloCalculationResult } from './types';

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

export function readLocalPlayerElo(): number {
    if (typeof window === 'undefined') return inMemoryLocalElo;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_LOCAL_ELO);
        if (!raw) return inMemoryLocalElo;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < MIN_ELO_RATING) {
            return DEFAULT_INITIAL_ELO;
        }
        inMemoryLocalElo = Math.round(parsed);
        return inMemoryLocalElo;
    } catch {
        return inMemoryLocalElo;
    }
}

export function saveLocalPlayerElo(rating: number): number {
    const safeRating = Math.max(MIN_ELO_RATING, Math.round(rating));
    inMemoryLocalElo = safeRating;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_LOCAL_ELO, String(safeRating));
        } catch {
            // Ignore
        }
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
        } catch {
            // Ignore
        }
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
 * Calcule le plafond Elo naturel correspondant à un PR Moyen Public donné.
 * Exemple :
 * - PR 12.0 -> Plafond 1470 Elo
 * - PR 8.5  -> Plafond 1698 Elo
 * - PR 5.0  -> Plafond 1925 Elo
 * - PR 2.0  -> Plafond 2120 Elo
 */
export function getMaxTargetEloForPublicPr(publicPr: number): number {
    const clampedPr = Math.max(MIN_PUBLIC_AVERAGE_PR, Math.min(20, publicPr));
    return Math.round(2250 - clampedPr * 65);
}

/**
 * Calcule le gain Elo dégressif continu entre +30 pts (outsider à -500 Elo) et +1 pt (favori à +500 Elo),
 * avec amortissement par le Plafond PR (`publicPr`) pour empêcher toute inflation Elo contre les bots.
 */
export function computeDegressiveEloGain(
    winnerRating: number,
    loserRating: number,
    winnerPublicPr?: number | null,
): number {
    const ratingGap = winnerRating - loserRating; // > 0 si favori gagne, < 0 si outsider gagne

    let baseGain: number;
    if (ratingGap >= 500) {
        baseGain = 1;
    } else if (ratingGap <= -500) {
        baseGain = 30;
    } else if (ratingGap >= 0) {
        // Favori : descend progressivement de 16 pts (écart 0) jusqu'à 1 pt (écart +500)
        const ratio = ratingGap / 500; // 0.0 -> 1.0
        baseGain = Math.max(1, Math.round(16 * Math.pow(1 - ratio, 1.35)));
    } else {
        // Outsider : monte progressivement de 16 pts (écart 0) jusqu'à 30 pts (écart -500)
        const ratio = Math.abs(ratingGap) / 500; // 0.0 -> 1.0
        baseGain = Math.min(30, Math.round(16 + 14 * Math.pow(ratio, 0.9)));
    }

    // Frein de plafond piloté par le PR Moyen Public (empêche d'atteindre un Elo élevé sans améliorer son PR)
    if (typeof winnerPublicPr === 'number' && Number.isFinite(winnerPublicPr) && baseGain > 1) {
        const targetMaxElo = getMaxTargetEloForPublicPr(winnerPublicPr);
        const distanceAboveCeiling = winnerRating - targetMaxElo;
        if (distanceAboveCeiling >= 120) {
            return 1;
        }
        if (distanceAboveCeiling > -100) {
            // Entre (plafond - 100) et (plafond + 120), réduction progressive crescendo
            const progress = (distanceAboveCeiling + 100) / 220; // 0.0 -> 1.0
            const damping = Math.max(0.1, 1 - progress * 0.88);
            baseGain = Math.max(1, Math.round(baseGain * damping));
        }
    }

    return baseGain;
}

/**
 * Stocke des points Elo en séquestre (Escrow) lorsqu'une victoire est bloquée par un PR inférieur à l'adversaire.
 */
export function storeEscrowEloPoints(points: number): number {
    const safePoints = Math.max(0, Math.round(points));
    inMemoryEscrowElo = safePoints;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_ESCROW_ELO, String(safePoints));
        } catch {
            // Ignore
        }
    }
    return inMemoryEscrowElo;
}

/**
 * Lit les points Elo actuellement en séquestre (déblocables par 2 Quizz réussis au 1er essai).
 */
export function readEscrowEloPoints(): number {
    if (typeof window === 'undefined') return inMemoryEscrowElo;
    try {
        const raw = localStorage.getItem(STORAGE_KEY_ESCROW_ELO);
        if (!raw) return inMemoryEscrowElo;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed < 0) return 0;
        inMemoryEscrowElo = Math.round(parsed);
        return inMemoryEscrowElo;
    } catch {
        return inMemoryEscrowElo;
    }
}

/**
 * Calcule la variation d'Elo pour une partie terminée en intégrant :
 * - Garde-fous Anti-Collusion (Salon privé = non classé, Quorum < 6 décisions = gain nul)
 * - Verrou méritocratique de PR + Elo en Séquestre (50% du gain théorique récupérable via 2 Quizz 1er essai)
 * - Bouclier de Maîtrise PR pour le perdant malchanceux (`loserPr < winnerPr` -> `0` perte Elo)
 * - Courbe Dégressive Continue de `+30 Elo` à `+1 Elo` + Plafond PR Moyen Public.
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

    const isPrivate = prOptions?.isPrivateRoom === true;
    const belowDecisionQuorum =
        typeof prOptions?.decisionsCount === 'number' &&
        prOptions.decisionsCount < MIN_RANKED_DECISIONS_QUORUM;

    if (isPrivate || belowDecisionQuorum) {
        return {
            playerXNewRating: safeX,
            playerONewRating: safeO,
            deltaX: 0,
            deltaO: 0,
            expectedScoreX: Math.round(expectedScoreX * 1000) / 1000,
            expectedScoreO: Math.round(expectedScoreO * 1000) / 1000,
            prBlockedGain: false,
            prShieldActivated: false,
            escrowEloPoints: 0,
            antiCollusionLimited: true,
        };
    }

    let deltaX = 0;
    let deltaO = 0;
    let prBlockedGain = false;
    let prShieldActivated = false;
    let escrowEloPoints = 0;

    const hasValidPrs =
        typeof prOptions?.prX === 'number' &&
        Number.isFinite(prOptions.prX) &&
        typeof prOptions?.prO === 'number' &&
        Number.isFinite(prOptions.prO);

    const prX = hasValidPrs ? (prOptions!.prX as number) : null;
    const prO = hasValidPrs ? (prOptions!.prO as number) : null;

    if (winner === 'X') {
        const degressiveGainX =
            customK !== undefined
                ? Math.round(customK * (1 - expectedScoreX))
                : computeDegressiveEloGain(safeX, safeO, prOptions?.publicPrX);
        if (prX !== null && prO !== null && prX > prO) {
            escrowEloPoints = Math.max(1, Math.round(degressiveGainX * 0.5));
            storeEscrowEloPoints(escrowEloPoints);
            deltaX = 0;
            deltaO = 0;
            prBlockedGain = true;
            prShieldActivated = true;
        } else {
            deltaX = degressiveGainX;
            deltaO = -degressiveGainX;
        }
    } else {
        const degressiveGainO =
            customK !== undefined
                ? Math.round(customK * (1 - expectedScoreO))
                : computeDegressiveEloGain(safeO, safeX, prOptions?.publicPrO);
        if (prX !== null && prO !== null && prO > prX) {
            escrowEloPoints = Math.max(1, Math.round(degressiveGainO * 0.5));
            storeEscrowEloPoints(escrowEloPoints);
            deltaO = 0;
            deltaX = 0;
            prBlockedGain = true;
            prShieldActivated = true;
        } else {
            deltaO = degressiveGainO;
            deltaX = -degressiveGainO;
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
        prShieldActivated,
        escrowEloPoints,
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
 * Convertit le PR Moyen Public du joueur en palier minimal de difficulté de Quizz (1 à 4) :
 * - PR > 9.0       -> Palier 1 (Fondamentaux 1-ply)
 * - PR 5.5 à 9.0   -> Palier 2 (Club 2-ply)
 * - PR 3.0 à 5.5   -> Palier 3 (Expert 2-ply/3-ply)
 * - PR < 3.0       -> Palier 4 (Maître / Grand-Maître 3-ply)
 */
export function getTargetQuizTierFromPublicPr(publicPr: number = readPublicAveragePr()): 1 | 2 | 3 | 4 {
    if (publicPr < 3.0) return 4;
    if (publicPr <= 5.5) return 3;
    if (publicPr <= 9.0) return 2;
    return 1;
}

/**
 * Lit l'état actuel de la jauge de cristallisation Quizz (0 à 5 entre deux matchs) et la série 1er essai.
 */
export function readQuizAddictionState(): {
    readonly firstTryStreak: number;
    readonly crystallizationUsed: number;
    readonly crystallizationMax: number;
    readonly escrowEloPoints: number;
} {
    return {
        firstTryStreak: inMemoryFirstTryStreak,
        crystallizationUsed: inMemoryCrystallizationUsed,
        crystallizationMax: MAX_QUIZ_CRYSTALLIZATION_STACK,
        escrowEloPoints: readEscrowEloPoints(),
    };
}

/**
 * Réinitialise la série de 1er essai lorsqu'un joueur échoue sur un Quizz.
 */
export function breakFirstTryQuizStreak(): void {
    inMemoryFirstTryStreak = 0;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_STREAK, '0');
        } catch {
            // Ignore
        }
    }
}

/**
 * Calcule le bonus de réduction de PR selon la série consécutive de réussites au 1er essai.
 * Série 1-2 : -0.15 PR | Série 3-4 : -0.25 PR | Série 5+ : -0.35 PR.
 */
export function getStreakPrReduction(streak: number): number {
    if (streak >= 5) return 0.35;
    if (streak >= 3) return 0.25;
    return PR_IMPROVEMENT_PER_FIRST_TRY_QUIZ;
}

/**
 * Récompense une réussite au 1er essai sur un Quizz :
 * - Incrémente la série sans faute (`firstTryStreak`)
 * - Applique le multiplicateur de série (`-0.15`, `-0.25` ou `-0.35 PR`) tant que la jauge de
 *   cristallisation (`5 Quizz` entre deux parties) n'est pas pleine
 * - Débloque automatiquement les points `escrowEloPoints` en séquestre dès 2 Quizz réussis au 1er essai !
 */
export function rewardFirstTryQuizOnPublicPr(): {
    readonly previousPr: number;
    readonly newPr: number;
    readonly deltaPr: number;
    readonly totalFirstTrySolved: number;
    readonly firstTryStreak: number;
    readonly crystallizationUsed: number;
    readonly crystallizationCapped: boolean;
    readonly unlockedEscrowElo: number;
} {
    const previousPr = readPublicAveragePr();
    inMemoryFirstTryStreak += 1;
    inMemoryFirstTryCount += 1;

    const crystallizationCapped = inMemoryCrystallizationUsed >= MAX_QUIZ_CRYSTALLIZATION_STACK;
    const reduction = crystallizationCapped ? 0 : getStreakPrReduction(inMemoryFirstTryStreak);

    if (!crystallizationCapped) {
        inMemoryCrystallizationUsed += 1;
    }

    const newPr = Number(
        Math.max(MIN_PUBLIC_AVERAGE_PR, previousPr - reduction).toFixed(2),
    );
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

    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_PUBLIC_PR, String(newPr));
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_STREAK, String(inMemoryFirstTryStreak));
            localStorage.setItem(STORAGE_KEY_CRYSTALLIZATION_USED, String(inMemoryCrystallizationUsed));
            const prevCount = Number(localStorage.getItem(STORAGE_KEY_FIRST_TRY_COUNT) || '0');
            totalFirstTrySolved = (Number.isFinite(prevCount) ? prevCount : 0) + 1;
            inMemoryFirstTryCount = totalFirstTrySolved;
            localStorage.setItem(STORAGE_KEY_FIRST_TRY_COUNT, String(totalFirstTrySolved));
        } catch {
            // Ignore quota errors
        }
    }

    return {
        previousPr,
        newPr,
        deltaPr,
        totalFirstTrySolved,
        firstTryStreak: inMemoryFirstTryStreak,
        crystallizationUsed: inMemoryCrystallizationUsed,
        crystallizationCapped,
        unlockedEscrowElo,
    };
}

/**
 * Met à jour le PR Moyen Public du joueur après une partie complète (moyenne glissante pondérée)
 * ET cristallise les progrès Quizz en remettant la jauge `crystallizationUsed` à `0/5`.
 */
export function recordMatchIntoPublicAveragePr(matchPr: number): number {
    inMemoryCrystallizationUsed = 0;
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(STORAGE_KEY_CRYSTALLIZATION_USED, '0');
        } catch {
            // Ignore
        }
    }
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
