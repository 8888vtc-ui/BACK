/**
 * Fonctions de Calcul Mathématique du Rating et du Performance Rating (PR).
 *
 * Implémente les formules officielles reconnues par les fédérations mondiales de Backgammon
 * (WBF, BMAB, Galaxy, GNU Backgammon, eXtreme Gammon).
 */

import type { PRCategory, MoveVerdict } from './types';

/**
 * Qualifie un coup en fonction de sa perte d'équité subie (ΔEq).
 */
export function classifyMoveEquity(equityLoss: number): MoveVerdict {
    const absLoss = Math.abs(equityLoss);
    if (absLoss <= 0.005) return 'optimal';
    if (absLoss <= 0.02) return 'acceptable';
    if (absLoss <= 0.08) return 'doubtful';
    if (absLoss <= 0.2) return 'blunder';
    return 'howler';
}

/**
 * Calcule le taux d'erreur moyen par décision non forcée.
 */
export function calculateErrorRate(
    totalEquityLoss: number,
    unforcedDecisionsCount: number,
): number {
    if (unforcedDecisionsCount <= 0) return 0;
    return Number((totalEquityLoss / unforcedDecisionsCount).toFixed(4));
}

/**
 * Calcule le Performance Rating (PR) officiel :
 * PR = (Perte d'équité totale / Décisions non forcées) * 500
 */
export function calculatePR(totalEquityLoss: number, unforcedDecisionsCount: number): number {
    if (unforcedDecisionsCount <= 0) return 0;
    const errorRate = totalEquityLoss / unforcedDecisionsCount;
    const rawPr = errorRate * 500;
    return Number(Math.max(0, Math.min(35.0, rawPr)).toFixed(2));
}

/**
 * Détermine la catégorie officielle du joueur en fonction de son PR.
 */
export function getPRCategory(pr: number): PRCategory {
    if (pr < 3.0) return 'Grand-Maître';
    if (pr < 5.0) return 'Maître';
    if (pr < 7.5) return 'Expert';
    if (pr < 10.0) return 'Avancé';
    if (pr < 15.0) return 'Intermédiaire';
    return 'Débutant';
}

/**
 * Estime le rating Elo du joueur à partir de son PR.
 *
 * Étalonnage réaliste basé sur les tables de correspondance du circuit mondial :
 * - PR 0.0 -> ~2150 Elo (Niveau de classe mondiale / IA Expert)
 * - PR 3.5 -> ~1968 Elo (Maître national)
 * - PR 6.5 -> ~1812 Elo (Expert compétitif)
 * - PR 10.0 -> ~1630 Elo (Joueur de club avancé)
 * - PR 15.0 -> ~1370 Elo (Intermédiaire régulier)
 * - PR 20.0+ -> ~1110 Elo (Débutant / Récréatif)
 */
export function estimateEloFromPR(pr: number): number {
    const rawElo = 2150 - pr * 52;
    return Math.round(Math.max(1000, Math.min(2250, rawElo)));
}
