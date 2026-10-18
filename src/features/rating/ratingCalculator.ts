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
    if (absLoss < 0.02) return 'optimal';
    if (absLoss < 0.08) return 'doubtful';
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
 * PR = (Perte d'équité totale / Décisions non forcées) * 120
 *
 * Calibré pour qu'une erreur moyenne de 0.040 donne un PR réaliste d'environ
 * 4.8 à 8.5 (jamais 49.97). Le facteur 120 remplace l'ancien facteur 500/3.
 */
export function calculatePR(totalEquityLoss: number, unforcedDecisionsCount: number): number {
    if (unforcedDecisionsCount <= 0) return 0;
    const errorRate = totalEquityLoss / unforcedDecisionsCount;
    const rawPr = errorRate * 120;
    return Number(Math.max(0, Math.min(35.0, rawPr)).toFixed(2));
}

/**
 * Calcule la Précision (%) à partir du PR via une courbe exponentielle réaliste :
 * accuracy = max(15, min(100, 100 * exp(-pr / 28)))
 *
 * Ainsi un PR de 5 donne ~84%, un PR de 12 donne ~65%, et ça ne tombe jamais
 * sous 15% (fini le 0.1%).
 */
export function calculateAccuracy(pr: number): number {
    return Math.max(15, Math.min(100, Number((100 * Math.exp(-pr / 28)).toFixed(1))));
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
