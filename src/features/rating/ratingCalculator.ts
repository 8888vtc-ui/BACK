/**
 * Fonctions de Calcul Mathématique du Rating et du Performance Rating (PR).
 *
 * Implémente les formules officielles reconnues par les fédérations mondiales de Backgammon
 * (WBF, BMAB, Backgammon Galaxy, Snowie 4, GNU Backgammon, eXtreme Gammon XG2).
 */

import type { PRCategory, MoveVerdict } from './types';
import { getMatchEquity } from '../coach/matchContext';

/**
 * Qualifie un coup en fonction de sa perte d'équité subie (ΔEq en EMG).
 */
export function classifyMoveEquity(equityLoss: number): MoveVerdict {
    const absLoss = Math.abs(equityLoss);
    if (absLoss < 0.02) return 'optimal';
    if (absLoss < 0.08) return 'doubtful';
    if (absLoss <= 0.2) return 'blunder';
    return 'howler';
}

/**
 * Calcule le taux d'erreur moyen par décision non forcée (Standard XG / GNU).
 */
export function calculateErrorRate(
    totalEquityLoss: number,
    unforcedDecisionsCount: number,
): number {
    if (unforcedDecisionsCount <= 0) return 0;
    return Number((Math.abs(totalEquityLoss) / unforcedDecisionsCount).toFixed(4));
}

/**
 * Calcule le taux d'erreur non pondéré de Snowie 4 (Unweighted Error Rate) :
 * ER_Snowie = Perte d'équité totale (EMG) / Nombre total de tours joués (incluant les coups forcés).
 */
export function calculateSnowieErrorRate(
    totalEquityLoss: number,
    totalTurnsCount: number,
): number {
    if (totalTurnsCount <= 0) return 0;
    return Number((Math.abs(totalEquityLoss) / totalTurnsCount).toFixed(4));
}

/**
 * Calcule le Performance Rating (PR) officiel (formule eXtreme Gammon / GNU Backgammon) :
 * PR = (Perte d'équité totale EMG / Décisions non forcées) * 500
 *
 * Sans plafond : la valeur brute est conservée telle quelle, conformément à la
 * formule officielle (500 x perte d'équité moyenne par décision non forcée).
 */
export function calculatePR(totalEquityLoss: number, unforcedDecisionsCount: number): number {
    if (unforcedDecisionsCount <= 0) return 0;
    const errorRate = Math.abs(totalEquityLoss) / unforcedDecisionsCount;
    const rawPr = errorRate * 500;
    return Number(Math.max(0, rawPr).toFixed(2));
}

/**
 * Calcule le PR combiné XG (Checker Play + Close Cube Decisions) :
 * PR_combined = ((checkerLoss + cubeLoss) / (unforcedCheckerCount + closeCubeCount)) * 500
 */
export function calculateCombinedPR(
    checkerEquityLoss: number,
    cubeEquityLoss: number,
    unforcedCheckerCount: number,
    closeCubeCount: number,
): number {
    const totalDecisions = unforcedCheckerCount + closeCubeCount;
    if (totalDecisions <= 0) return 0;
    const totalLoss = Math.abs(checkerEquityLoss) + Math.abs(cubeEquityLoss);
    return Number(((totalLoss / totalDecisions) * 500).toFixed(2));
}

/**
 * Calcule le taux de chance moyen par jet de dés (Luck Rate en EMG / coup).
 */
export function calculateLuckRate(totalLuckEmg: number, totalRollsCount: number): number {
    if (totalRollsCount <= 0) return 0;
    return Number((totalLuckEmg / totalRollsCount).toFixed(4));
}

/**
 * Calcule le Performance Rating ajusté à la chance (Luck-Adjusted PR).
 * Compense l'asymétrie de complexité induite par les séquences de jets très défavorables
 * (anti-jokers) selon la pondération analytique XG/Galaxy.
 */
export function calculateLuckAdjustedPR(
    totalEquityLoss: number,
    totalLuckEmg: number,
    unforcedDecisionsCount: number,
): number {
    if (unforcedDecisionsCount <= 0) return 0;
    const baseErrorRate = Math.abs(totalEquityLoss) / unforcedDecisionsCount;
    const luckPerDecision = totalLuckEmg / unforcedDecisionsCount;
    // Ajustement borné (10 % de la variance de malchance des dés) sans jamais rendre le PR négatif
    const adjustedErrorRate = Math.max(0, baseErrorRate + luckPerDecision * 0.08);
    return Number((adjustedErrorRate * 500).toFixed(2));
}

/**
 * Convertit une équité normalisée EMG [-1, +1] en probabilité de gain du match MWC (%) [0, 100]
 * à l'aide de la table d'équité de match Kazaross-XG2.
 */
export function convertEquityToMwc(
    equityEmg: number,
    awayPlayer: number,
    awayOpponent: number,
    cubeValue = 1,
): number {
    if (awayPlayer <= 0 && awayOpponent <= 0) {
        // Money game : MWC assimilé à la probabilité de gain simple (50% + 50% * Eq bornée)
        const clamped = Math.max(-1, Math.min(1, equityEmg));
        return Number(((0.5 + clamped * 0.5) * 100).toFixed(2));
    }
    const mwcWin = getMatchEquity(Math.max(0, awayPlayer - cubeValue), awayOpponent);
    const mwcLoss = getMatchEquity(awayPlayer, Math.max(0, awayOpponent - cubeValue));
    const clampedEmg = Math.max(-2, Math.min(2, equityEmg));
    const mwc = mwcLoss + ((clampedEmg + 1) / 2) * (mwcWin - mwcLoss);
    return Number((Math.max(0, Math.min(1, mwc)) * 100).toFixed(2));
}

/**
 * Convertit une perte de MWC (en points de probabilité 0..1) en perte d'équité normalisée EMG
 * selon la formule linéaire d'interpolation de Kazaross / eXtreme Gammon :
 * ΔEMG = 2 * ΔMWC / (MWC_win - MWC_loss)
 */
export function convertMwcLossToEmg(
    mwcLossFraction: number,
    awayPlayer: number,
    awayOpponent: number,
    cubeValue = 1,
): number {
    const mwcWin = getMatchEquity(Math.max(0, awayPlayer - cubeValue), awayOpponent);
    const mwcLoss = getMatchEquity(awayPlayer, Math.max(0, awayOpponent - cubeValue));
    const span = mwcWin - mwcLoss;
    if (span <= 1e-6) return 0;
    return Number(((2 * mwcLossFraction) / span).toFixed(4));
}

/**
 * Calcule la Précision (%) à partir du PR via une courbe exponentielle réaliste :
 * accuracy = max(15, min(100, 100 * exp(-pr / 28)))
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
 */
export function estimateEloFromPR(pr: number): number {
    const rawElo = 2150 - pr * 52;
    return Math.round(Math.max(1000, Math.min(2250, rawElo)));
}

/**
 * Calcule le Performance Rating dédié uniquement aux coups de pions (Checker PR).
 */
export function calculateCheckerPR(
    checkerEquityLoss: number,
    unforcedCheckerDecisions: number,
): number {
    if (unforcedCheckerDecisions <= 0) return 0;
    return Number(((Math.abs(checkerEquityLoss) / unforcedCheckerDecisions) * 500).toFixed(2));
}

/**
 * Calcule le Performance Rating dédié uniquement aux décisions de videau (Cube PR).
 */
export function calculateCubePR(
    cubeEquityLoss: number,
    closeCubeDecisions: number,
): number {
    if (closeCubeDecisions <= 0) return 0;
    return Number(((Math.abs(cubeEquityLoss) / closeCubeDecisions) * 500).toFixed(2));
}

/**
 * Titres et échelons officiels de la Backgammon Masters Awarding Body (BMAB).
 * PR < 3.5 = Grandmaster Class, PR < 5.0 = Master Class, etc.
 */
export function calculateBMABGrade(pr: number): string {
    if (pr < 2.5) return 'Super Grandmaster';
    if (pr < 3.0) return 'Grandmaster 1 (GM1)';
    if (pr < 3.5) return 'Grandmaster 2 (GM2)';
    if (pr < 4.2) return 'Master 1 (M1)';
    if (pr < 5.0) return 'Master 2 (M2)';
    if (pr < 6.5) return 'Advanced 1';
    if (pr < 8.0) return 'Advanced 2';
    if (pr < 10.5) return 'Intermediate 1';
    if (pr < 13.0) return 'Intermediate 2';
    if (pr < 18.0) return 'Casual';
    return 'Beginner';
}

/**
 * Calcule l'efficacité de course (%) : ratio du pip count brut sur l'EPC.
 * 100 % = aucune déperdition (wastage = 0).
 */
export function calculateRaceEfficiency(rawPips: number, epc: number): number {
    if (rawPips <= 0 || epc <= 0) return 100;
    if (epc < rawPips) return 100;
    return Number(Math.min(100, Math.max(0, (rawPips / epc) * 100)).toFixed(1));
}

