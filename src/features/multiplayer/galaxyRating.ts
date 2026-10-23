/**
 * Système de Classement Backgammon Galaxy V2 — Galaxy Dual Rating (GR) & Leaderboard.
 *
 * Implémente la règle signature de Backgammon Galaxy :
 * ΔGR = f(MatchResult, PR_Delta, MatchLength)
 *
 * Principe Dual-Condition :
 * 1. Condition de Victoire (Match Result) : pondérée par l'écart de niveau initial et √MatchLength.
 * 2. Condition de Qualité de Jeu (PR Battle) : compare le Performance Rating (PR) des deux joueurs.
 *    - Si le vainqueur du match a aussi le meilleur PR (plus bas), il remporte le gain maximal (Double Star).
 *    - Si le perdant du match a mieux joué (PR inférieur au vainqueur), le bouclier PR s'active :
 *      sa perte est fortement réduite, annulée ou transformée en gain net de GR si l'écart de PR
 *      ou l'excellence absolue (PR <= 3.5) le justifie.
 */

import type { Player } from '../../engine/backgammonEngine';
import { calculateExpectedScore, MIN_ELO_RATING } from './elo';
import {
    evaluateHeadToHeadCompositeMatch,
    type HeadToHeadCompositeResult,
    createDefaultGlicko2Player,
} from '../../lib/rating/glicko2Composite';

export interface MultiplayerGlicko2Input {
    playerXRating: number;
    playerXRD?: number;
    playerXVolatility?: number;
    playerORating: number;
    playerORD?: number;
    playerOVolatility?: number;
    winner: Player;
    playerXPR: number;
    playerOPR: number;
    matchLength: number;
}

/**
 * Calcule l'évolution Glicko-2 composite d'un match multijoueur pondéré par la longueur w(L) = L / (L + 4)
 * et le différentiel de Performance Rating (PR) Open Sage.
 */
export function calculateMultiplayerGlicko2Rating(
    input: MultiplayerGlicko2Input,
): HeadToHeadCompositeResult {
    const playerX = createDefaultGlicko2Player({
        rating: input.playerXRating,
        rd: input.playerXRD,
        volatility: input.playerXVolatility,
    });
    const playerO = createDefaultGlicko2Player({
        rating: input.playerORating,
        rd: input.playerORD,
        volatility: input.playerOVolatility,
    });

    return evaluateHeadToHeadCompositeMatch({
        playerX,
        playerO,
        winner: input.winner,
        matchLength: input.matchLength,
        playerXPR: input.playerXPR,
        playerOPR: input.playerOPR,
    });
}

export interface GalaxyRatingInput {
    /** Galaxy Rating (GR) actuel du joueur X */
    playerXRating: number;
    /** Galaxy Rating (GR) actuel du joueur O */
    playerORating: number;
    /** Vainqueur du match ('X' ou 'O') */
    winner: Player;
    /** Performance Rating (PR XG) réalisé par le joueur X sur le match (plus bas = meilleur) */
    playerXPR: number;
    /** Performance Rating (PR XG) réalisé par le joueur O sur le match (plus bas = meilleur) */
    playerOPR: number;
    /** Longueur du match en points (0 ou 1 pour Money/1pt, 3, 5, 7, 11...) */
    matchLength: number;
}

export interface GalaxyRatingResult {
    playerXNewRating: number;
    playerONewRating: number;
    deltaX: number;
    deltaO: number;
    /** Qui a remporté la bataille du PR (meilleur jeu technique) */
    prWinner: Player | 'tie';
    /** Indique si le perdant du match a bénéficié de la protection / bonus PR Galaxy */
    loserProtectedByPR: boolean;
    /** Multiplicateur lié à la longueur du match */
    matchLengthFactor: number;
    expectedScoreX: number;
    expectedScoreO: number;
}

export interface GalaxyStarTier {
    title: string;
    stars: number;
    badge: string;
    minGR: number;
    colorClass: string;
}

export interface GalaxyLeaderboardEntry {
    userId: string;
    displayName: string;
    galaxyRating: number;
    averagePR: number;
    matchesPlayed: number;
    winRate: number;
    countryCode?: string;
}

export const GALAXY_STAR_TIERS: ReadonlyArray<GalaxyStarTier> = [
    { title: 'Super Grandmaster', stars: 5, badge: '🌌', minGR: 2300, colorClass: 'text-amber-300' },
    { title: 'Grandmaster', stars: 5, badge: '👑', minGR: 2100, colorClass: 'text-amber-400' },
    { title: 'Master', stars: 4, badge: '💎', minGR: 1900, colorClass: 'text-purple-300' },
    { title: 'Expert', stars: 3, badge: '⚔️', minGR: 1700, colorClass: 'text-sky-300' },
    { title: 'Contender', stars: 2, badge: '🎯', minGR: 1500, colorClass: 'text-emerald-300' },
    { title: 'Challenger', stars: 1, badge: '🛡️', minGR: 0, colorClass: 'text-slate-300' },
];

const PR_TIE_TOLERANCE = 0.05;

/**
 * Calcule le facteur d'échelle d'un match selon sa longueur.
 * Normalisé autour d'un match en 5 points (facteur 1.0).
 */
export function computeMatchLengthFactor(matchLength: number): number {
    const effectivePoints = Math.max(1, matchLength || 1);
    const factor = Math.sqrt(effectivePoints / 5);
    return Number(Math.max(0.55, Math.min(1.65, factor)).toFixed(3));
}

/**
 * Détermine le vainqueur technique (PR Battle).
 * Un PR plus faible indique un meilleur jeu.
 */
export function resolvePRWinner(playerXPR: number, playerOPR: number): Player | 'tie' {
    const safeX = Math.max(0, playerXPR);
    const safeO = Math.max(0, playerOPR);
    if (Math.abs(safeX - safeO) <= PR_TIE_TOLERANCE) {
        return 'tie';
    }
    return safeX < safeO ? 'X' : 'O';
}

/**
 * Calcule l'évolution du Galaxy Rating (GR) selon le modèle Dual-Condition (Match + PR).
 */
export function calculateGalaxyRating(input: GalaxyRatingInput): GalaxyRatingResult {
    const safeRatingX = Math.max(MIN_ELO_RATING, Math.round(input.playerXRating));
    const safeRatingO = Math.max(MIN_ELO_RATING, Math.round(input.playerORating));
    const safePRX = Math.max(0, input.playerXPR);
    const safePRO = Math.max(0, input.playerOPR);

    const expectedX = calculateExpectedScore(safeRatingX, safeRatingO);
    const expectedO = 1 - expectedX;

    const matchLengthFactor = computeMatchLengthFactor(input.matchLength);
    const baseK = 32 * matchLengthFactor;

    const prWinner = resolvePRWinner(safePRX, safePRO);
    const winner = input.winner;
    const loser: Player = winner === 'X' ? 'O' : 'X';

    const winnerExpected = winner === 'X' ? expectedX : expectedO;
    const loserExpected = loser === 'X' ? expectedX : expectedO;

    const winnerPR = winner === 'X' ? safePRX : safePRO;
    const loserPR = loser === 'X' ? safePRX : safePRO;

    // Variation brute standard (basée uniquement sur le résultat du match)
    const rawWinnerGain = baseK * (1 - winnerExpected);
    const rawLoserLoss = baseK * (0 - loserExpected); // négatif

    let winnerDelta = 0;
    let loserDelta = 0;
    let loserProtectedByPR = false;

    if (prWinner === winner || prWinner === 'tie') {
        // Cas 1 : Le vainqueur du match a aussi gagné (ou égalisé) la bataille du PR (Double Star)
        const excellenceBonus = winnerPR <= 2.5 ? 4 : winnerPR <= 5.0 ? 2 : 0;
        winnerDelta = Math.max(1, Math.round(rawWinnerGain + excellenceBonus));
        loserDelta = Math.round(rawLoserLoss);

        // Si le perdant a malgré tout joué à un niveau exceptionnel (ex: PR <= 2.5 contre PR 1.8),
        // sa perte est plafonnée de moitié.
        if (loserPR <= 2.5) {
            loserDelta = Math.round(loserDelta * 0.5);
            loserProtectedByPR = true;
        }
    } else {
        // Cas 2 : Le perdant du match a gagné la bataille du PR (loserPR < winnerPR) !
        loserProtectedByPR = true;
        const prAdvantage = Math.max(0, winnerPR - loserPR);

        // Le vainqueur du match ne touche que la part "résultat" réduite (pénalisé pour son PR inférieur)
        winnerDelta = Math.max(1, Math.round(rawWinnerGain * 0.45));

        // Calcul du bouclier PR et du bonus de performance pour le perdant malchanceux
        // Plus l'avantage de PR est grand et plus le PR absolu du perdant est bas, plus la compensation est forte.
        const shieldRatio = Math.min(1.0, 0.65 + prAdvantage * 0.08 + (loserPR <= 3.5 ? 0.25 : 0));
        const mitigatedLoss = rawLoserLoss * (1 - shieldRatio);

        // Bonus de maîtrise si le perdant a délivré un PR de classe Maître/Grand-Maître ou surclassé son adversaire
        let masteryBonus = 0;
        if (loserPR <= 2.5) {
            masteryBonus = 5 + Math.min(6, Math.round(prAdvantage));
        } else if (loserPR <= 4.5 && prAdvantage >= 2.5) {
            masteryBonus = 2 + Math.min(4, Math.round(prAdvantage * 0.5));
        } else if (prAdvantage >= 5.0) {
            masteryBonus = Math.min(4, Math.round((prAdvantage - 4) * 0.6));
        }

        loserDelta = Math.round(mitigatedLoss + masteryBonus);
    }

    const deltaX = winner === 'X' ? winnerDelta : loserDelta;
    const deltaO = winner === 'O' ? winnerDelta : loserDelta;

    return {
        playerXNewRating: Math.max(MIN_ELO_RATING, safeRatingX + deltaX),
        playerONewRating: Math.max(MIN_ELO_RATING, safeRatingO + deltaO),
        deltaX,
        deltaO,
        prWinner,
        loserProtectedByPR,
        matchLengthFactor,
        expectedScoreX: Math.round(expectedX * 1000) / 1000,
        expectedScoreO: Math.round(expectedO * 1000) / 1000,
    };
}

/**
 * Retourne le rang étoilé Galaxy correspondant à un score GR.
 */
export function getGalaxyStarTier(galaxyRating: number): GalaxyStarTier {
    const safeGR = Math.max(0, galaxyRating);
    for (const tier of GALAXY_STAR_TIERS) {
        if (safeGR >= tier.minGR) {
            return tier;
        }
    }
    return GALAXY_STAR_TIERS[GALAXY_STAR_TIERS.length - 1];
}

/**
 * Trie les entrées du Leaderboard selon le standard Galaxy (GR décroissant, puis PR croissant).
 */
export function rankLeaderboardEntries(
    entries: ReadonlyArray<GalaxyLeaderboardEntry>,
): GalaxyLeaderboardEntry[] {
    return [...entries].sort((a, b) => {
        if (b.galaxyRating !== a.galaxyRating) {
            return b.galaxyRating - a.galaxyRating;
        }
        return a.averagePR - b.averagePR;
    });
}
