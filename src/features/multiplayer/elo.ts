/**
 * Moteur de calcul du classement Elo pour le Backgammon Multijoueur.
 *
 * Implémente la formule standard FIDE / WBF :
 * - Espérance de gain E = 1 / (1 + 10 ^ ((R_adv - R_joueur) / 400))
 * - K-Factor adaptatif selon le niveau du joueur
 * - Seuil minimal garanti (rating >= 100)
 */

import type { Player } from '../../engine/backgammonEngine';
import type { EloCalculationResult } from './types';

export const DEFAULT_INITIAL_ELO = 1500;
export const MIN_ELO_RATING = 100;

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
 * Calcule la variation d'Elo pour une partie terminée.
 *
 * @param playerXRating Elo de départ du joueur X
 * @param playerORating Elo de départ du joueur O
 * @param winner Vainqueur de la manche ('X' ou 'O')
 * @param customK Optionnel : forcer un K-factor spécifique
 */
export function calculateMatchElo(
    playerXRating: number,
    playerORating: number,
    winner: Player,
    customK?: number,
): EloCalculationResult {
    const safeX = Math.max(MIN_ELO_RATING, Math.round(playerXRating));
    const safeO = Math.max(MIN_ELO_RATING, Math.round(playerORating));

    const expectedScoreX = calculateExpectedScore(safeX, safeO);
    const expectedScoreO = 1 - expectedScoreX;

    const actualScoreX = winner === 'X' ? 1 : 0;
    const actualScoreO = winner === 'O' ? 1 : 0;

    const kX = customK ?? getKFactor(safeX);
    const kO = customK ?? getKFactor(safeO);

    const deltaX = Math.round(kX * (actualScoreX - expectedScoreX));
    const deltaO = Math.round(kO * (actualScoreO - expectedScoreO));

    const playerXNewRating = Math.max(MIN_ELO_RATING, safeX + deltaX);
    const playerONewRating = Math.max(MIN_ELO_RATING, safeO + deltaO);

    return {
        playerXNewRating,
        playerONewRating,
        deltaX,
        deltaO,
        expectedScoreX: Math.round(expectedScoreX * 1000) / 1000,
        expectedScoreO: Math.round(expectedScoreO * 1000) / 1000,
    };
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
