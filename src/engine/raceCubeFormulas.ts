/**
 * Algorithmes de Videau en Course (Sans Contact) — Standards Mathématiques 2026.
 *
 * Implémente avec exactitude paramétrique les formules de référence :
 *   1. Formule de Course de Timmes (Octobre 2026 — Standard de précision par défaut)
 *      - Ajustements structurels sur les 4 tranches de pips (<=12, 13..30, 31..60, >60)
 *      - Formule de Bear-off court (<=12 pips tous pions dans le jan intérieur)
 *   2. Règle de Trice / Art Benjamin pour les Courses Longues (60 < X < 130)
 *      - Règle des 10 % + Exception de la « Règle des 9 » (X in {69, 79, 89, 99} => +1)
 *   3. Formule de Benjamin 3v3 pour les Fins de Partie (<= 3 pions) & EPC (7n + 1)
 *
 * Couche Règles pure (`src/engine/`), 100 % déterministe, zéro `any`, < 400 lignes.
 */

import { type Player, pipCount } from './backgammonEngine';

export type RaceCubeDecisionCode =
    | 'NO_DOUBLE_TAKE'
    | 'DOUBLE_TAKE'
    | 'REDOUBLE_TAKE'
    | 'DOUBLE_PASS'
    | 'REDOUBLE_PASS';

export interface TimmesRaceResult {
    readonly rollerRawPips: number;
    readonly opponentRawPips: number;
    readonly rollerAdjustedPips: number;
    readonly opponentAdjustedPips: number;
    readonly boostFactor: number;
    readonly delta: number;
    readonly isShortBearoffFormula: boolean;
    readonly doubleThreshold: number;
    readonly redoubleThreshold: number;
    readonly takeThreshold: number;
    readonly canInitialDouble: boolean;
    readonly canRedouble: boolean;
    readonly shouldTake: boolean;
    readonly decision: RaceCubeDecisionCode;
}

export interface TriceBenjaminLongRaceResult {
    readonly rollerPips: number;
    readonly opponentPips: number;
    readonly pointOfLastTake: number;
    readonly doublePoint: number;
    readonly redoublePoint: number;
    readonly nineRuleApplied: boolean;
    readonly canInitialDouble: boolean;
    readonly canRedouble: boolean;
    readonly shouldTake: boolean;
    readonly decision: RaceCubeDecisionCode;
}

export interface Benjamin3v3Result {
    readonly rollerRawPips: number;
    readonly opponentRawPips: number;
    readonly rollerApc: number;
    readonly opponentApc: number;
    readonly rollerEpc: number;
    readonly opponentEpc: number;
    readonly canInitialDouble: boolean;
    readonly canRedouble: boolean;
    readonly shouldTake: boolean;
    readonly decision: RaceCubeDecisionCode;
}

/**
 * Retourne le nombre de pions de `player` sur son point relatif `relPt` (1 = as, 24 = point le plus éloigné).
 */
export function getRelativePointCount(board: readonly number[], player: Player, relPt: number): number {
    if (relPt < 1 || relPt > 24) return 0;
    const idx = player === 'X' ? relPt : 25 - relPt;
    const val = board[idx] ?? 0;
    return player === 'X' ? Math.max(0, val) : Math.max(0, -val);
}

/**
 * Calcule l'Effective Pip Count simplifié en sortie pure : EPC = 7n + 1
 * (6 pips par pion si tous sur le point 6 + 1 pip par pion de gaspillage moyen + 1 pip constant).
 */
export function computeSimpleBearoffEpc(checkersRemaining: number): number {
    const n = Math.max(0, Math.trunc(checkersRemaining));
    if (n === 0) return 0;
    return 7 * n + 1;
}

/**
 * 1. Formule de Course de Timmes (Octobre 2026) — Standard de précision par défaut.
 * Gère à la fois la formule générale à 4 tranches et la formule dédiée au bear-off court (<= 12 pips).
 */
export function evaluateTimmesRace(
    board: readonly number[],
    roller: Player,
    isRedouble = false,
): TimmesRaceResult {
    const opp: Player = roller === 'X' ? 'O' : 'X';
    const raw = pipCount(board as number[]);
    const lRaw = raw[roller];
    const tRaw = raw[opp];

    const collectStats = (p: Player) => {
        let totalCheckers = 0;
        let crossovers = 0;
        let outsideHome = 0;
        const home: number[] = [0, 0, 0, 0, 0, 0, 0]; // index 1..6
        for (let pt = 1; pt <= 24; pt++) {
            const c = getRelativePointCount(board, p, pt);
            if (c > 0) {
                totalCheckers += c;
                if (pt <= 6) {
                    home[pt] = c;
                } else {
                    outsideHome += c;
                    crossovers += c * Math.floor((pt - 1) / 6);
                }
            }
        }
        return { totalCheckers, crossovers, outsideHome, home };
    };

    const sL = collectStats(roller);
    const sT = collectStats(opp);

    // Cas spécifique : Bear-off court (<= 12 pips et tous les pions des deux camps dans le jan intérieur)
    if (lRaw <= 12 && tRaw <= 12 && sL.outsideHome === 0 && sT.outsideHome === 0) {
        const computeShortBearoffC = (pips: number, stats: ReturnType<typeof collectStats>): number => {
            const n1 = stats.home[1] ?? 0;
            const n2 = stats.home[2] ?? 0;
            const n3 = stats.home[3] ?? 0;
            const n4 = stats.home[4] ?? 0;
            const oddBonus = stats.totalCheckers % 2 === 1 ? 1.5 : 0;
            let spareBonus = 0;
            for (let i = 1; i <= 6; i++) {
                spareBonus += 0.5 * Math.max(0, (stats.home[i] ?? 0) - 2);
            }
            return pips + 3 + 2 * n1 + 1.5 * n2 + 1 * n3 + 0.5 * n4 + oddBonus + spareBonus;
        };

        const cRoller = Number(computeShortBearoffC(lRaw, sL).toFixed(2));
        const cOpp = Number(computeShortBearoffC(tRaw, sT).toFixed(2));
        const dShort = Number((cRoller - cOpp).toFixed(2));
        const doubleThreshold = Number((7 - 0.1 * cRoller).toFixed(2));
        const redoubleThreshold = Number((6 - 0.1 * cRoller).toFixed(2));
        const takeThreshold = 1;

        const canInitialDouble = dShort <= doubleThreshold;
        const canRedouble = dShort <= redoubleThreshold;
        const shouldTake = dShort >= takeThreshold;
        const activeDouble = isRedouble ? canRedouble : canInitialDouble;

        const decision: RaceCubeDecisionCode = !activeDouble
            ? 'NO_DOUBLE_TAKE'
            : shouldTake
              ? isRedouble
                  ? 'REDOUBLE_TAKE'
                  : 'DOUBLE_TAKE'
              : isRedouble
                ? 'REDOUBLE_PASS'
                : 'DOUBLE_PASS';

        return {
            rollerRawPips: lRaw,
            opponentRawPips: tRaw,
            rollerAdjustedPips: cRoller,
            opponentAdjustedPips: cOpp,
            boostFactor: 0,
            delta: dShort,
            isShortBearoffFormula: true,
            doubleThreshold,
            redoubleThreshold,
            takeThreshold,
            canInitialDouble,
            canRedouble,
            shouldTake,
            decision,
        };
    }

    // Formule générale de Timmes (Octobre 2026)
    const isShortBand = lRaw <= 30;
    const extraCheckerPenalty = isShortBand ? 2 : 1;

    const computeStackPenalty = (stats: ReturnType<typeof collectStats>): number => {
        const n1 = stats.home[1] ?? 0;
        const n2 = stats.home[2] ?? 0;
        const n3 = stats.home[3] ?? 0;
        const n6 = stats.home[6] ?? 0;
        const p3 = isShortBand ? 0.5 * Math.max(0, n3 - 2) : 1 * Math.max(0, n3 - 3);
        return (
            2 * Math.max(0, n1 - 2) +
            1 * Math.max(0, n2 - 2) +
            p3 +
            1 * Math.max(0, n6 - 5)
        );
    };

    let lGaps = 0;
    let tGaps = 0;
    for (const pt of [4, 5, 6]) {
        if ((sL.home[pt] ?? 0) === 0 && (sT.home[pt] ?? 0) > 0) lGaps += 1;
        if ((sT.home[pt] ?? 0) === 0 && (sL.home[pt] ?? 0) > 0) tGaps += 1;
    }

    const lAdj =
        lRaw +
        extraCheckerPenalty * Math.max(0, sL.totalCheckers - sT.totalCheckers) +
        Math.max(0, sL.crossovers - sT.crossovers) +
        computeStackPenalty(sL) +
        lGaps;

    const tAdj =
        tRaw +
        extraCheckerPenalty * Math.max(0, sT.totalCheckers - sL.totalCheckers) +
        Math.max(0, sT.crossovers - sL.crossovers) +
        computeStackPenalty(sT) +
        tGaps;

    let boostFactor = 1 / 6;
    let doubleThreshold = 7;
    let redoubleThreshold = 5;
    let takeThreshold = 2;

    if (lRaw <= 12) {
        boostFactor = 1 / 7;
        doubleThreshold = 10;
        redoubleThreshold = 8;
        takeThreshold = 2;
    } else if (lRaw <= 30) {
        boostFactor = 1 / 7;
        doubleThreshold = 5;
        redoubleThreshold = 4;
        takeThreshold = 1;
    } else if (lRaw <= 60) {
        boostFactor = 1 / 8;
        doubleThreshold = 4;
        redoubleThreshold = 3;
        takeThreshold = 0;
    }

    const delta = Number((lAdj + lAdj * boostFactor - tAdj).toFixed(2));
    const canInitialDouble = delta <= doubleThreshold;
    const canRedouble = delta <= redoubleThreshold;
    const shouldTake = delta >= takeThreshold;
    const activeDouble = isRedouble ? canRedouble : canInitialDouble;

    const decision: RaceCubeDecisionCode = !activeDouble
        ? 'NO_DOUBLE_TAKE'
        : shouldTake
          ? isRedouble
              ? 'REDOUBLE_TAKE'
              : 'DOUBLE_TAKE'
          : isRedouble
            ? 'REDOUBLE_PASS'
            : 'DOUBLE_PASS';

    return {
        rollerRawPips: lRaw,
        opponentRawPips: tRaw,
        rollerAdjustedPips: Number(lAdj.toFixed(2)),
        opponentAdjustedPips: Number(tAdj.toFixed(2)),
        boostFactor: Number(boostFactor.toFixed(4)),
        delta,
        isShortBearoffFormula: false,
        doubleThreshold,
        redoubleThreshold,
        takeThreshold,
        canInitialDouble,
        canRedouble,
        shouldTake,
        decision,
    };
}

/**
 * 2. Règle de Trice / Art Benjamin pour les Courses Longues (60 < X < 130).
 * Inclut la Règle des 10 % et l'exception de la « Règle des 9 » (X in {69, 79, 89, 99} => +1).
 */
export function evaluateTriceBenjaminLongRace(
    rollerPips: number,
    opponentPips: number,
    isRedouble = false,
): TriceBenjaminLongRaceResult {
    const X = Math.max(0, Math.trunc(rollerPips));
    const Y = Math.max(0, Math.trunc(opponentPips));
    const nineRuleApplied = X === 69 || X === 79 || X === 89 || X === 99;
    const pointOfLastTake = X + Math.floor(X / 10) + 2 + (nineRuleApplied ? 1 : 0);
    const doublePoint = pointOfLastTake - 3;
    const redoublePoint = pointOfLastTake - 2;

    const canInitialDouble = Y >= doublePoint;
    const canRedouble = Y >= redoublePoint;
    const shouldTake = Y <= pointOfLastTake;
    const activeDouble = isRedouble ? canRedouble : canInitialDouble;

    const decision: RaceCubeDecisionCode = !activeDouble
        ? 'NO_DOUBLE_TAKE'
        : shouldTake
          ? isRedouble
              ? 'REDOUBLE_TAKE'
              : 'DOUBLE_TAKE'
          : isRedouble
            ? 'REDOUBLE_PASS'
            : 'DOUBLE_PASS';

    return {
        rollerPips: X,
        opponentPips: Y,
        pointOfLastTake,
        doublePoint,
        redoublePoint,
        nineRuleApplied,
        canInitialDouble,
        canRedouble,
        shouldTake,
        decision,
    };
}

/**
 * 3. Formule de Benjamin 3v3 pour les Fins de Partie (<= 3 pions chacun dans le jan intérieur).
 * Calcule l'Adjusted Pip Count (APC) avec pénalités de spares et applique les 5 paliers exacts.
 */
export function evaluateBenjamin3v3Bearoff(
    board: readonly number[],
    roller: Player,
    isRedouble = false,
): Benjamin3v3Result {
    const opp: Player = roller === 'X' ? 'O' : 'X';
    const raw = pipCount(board as number[]);

    const computePlayerApc = (p: Player, rawP: number): { apc: number; checkers: number } => {
        let sparesPenalty = 0;
        let checkers = 0;
        for (let pt = 1; pt <= 6; pt++) {
            const c = getRelativePointCount(board, p, pt);
            checkers += c;
            const spares = Math.max(0, c - 1);
            if (spares > 0) {
                if (pt === 1) sparesPenalty += 2 * spares;
                else if (pt === 2) sparesPenalty += 1 * spares;
                else sparesPenalty += 0.5 * spares;
            }
        }
        return { apc: Number((rawP + sparesPenalty).toFixed(2)), checkers };
    };

    const rStats = computePlayerApc(roller, raw[roller]);
    const oStats = computePlayerApc(opp, raw[opp]);
    const X = rStats.apc;
    const Y = oStats.apc;

    let canInitialDouble = false;
    let canRedouble = false;
    let shouldTake = true;

    if (X < 11) {
        canInitialDouble = true;
        canRedouble = true;
        shouldTake = Y <= X - 3;
    } else if (X <= 11.5) {
        canInitialDouble = true;
        canRedouble = true;
        shouldTake = Y <= X - 2;
    } else if (X <= 12.5) {
        canInitialDouble = true;
        canRedouble = Y >= 9;
        shouldTake = Y <= X - 2;
    } else if (X <= 14.5) {
        canInitialDouble = Y >= X - 2;
        canRedouble = Y >= X - 1;
        shouldTake = Y <= X - 1;
    } else {
        canInitialDouble = Y >= X - 1;
        canRedouble = Y >= X;
        shouldTake = Y <= X + 1;
    }

    const activeDouble = isRedouble ? canRedouble : canInitialDouble;
    const decision: RaceCubeDecisionCode = !activeDouble
        ? 'NO_DOUBLE_TAKE'
        : shouldTake
          ? isRedouble
              ? 'REDOUBLE_TAKE'
              : 'DOUBLE_TAKE'
          : isRedouble
            ? 'REDOUBLE_PASS'
            : 'DOUBLE_PASS';

    return {
        rollerRawPips: raw[roller],
        opponentRawPips: raw[opp],
        rollerApc: X,
        opponentApc: Y,
        rollerEpc: computeSimpleBearoffEpc(rStats.checkers),
        opponentEpc: computeSimpleBearoffEpc(oStats.checkers),
        canInitialDouble,
        canRedouble,
        shouldTake,
        decision,
    };
}

