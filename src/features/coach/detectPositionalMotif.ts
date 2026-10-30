/**
 * @file src/features/coach/detectPositionalMotif.ts
 * @description Moteur Symbolique Géométrique 0 ms (Zero-Server-Cost) — Taxonomie fermée des 18 Motifs
 * Tactiques & Positionnels du Backgammon (« Cercle Monte-Carlo »).
 *
 * Compare trois vecteurs d'état canoniques de 26 entiers (`boardBefore`, `boardPlayed`, `boardOptimal`)
 * orientés dans le sens de marche du joueur actif (24 -> 1, 25 = barre joueur actif, 0 = barre adverse <= 0).
 * Inclut une fonction de normalisation automatique `toCanonicalActiveBoard(board, activePlayer)` pour
 * convertir un plateau moteur (`X_BAR = 0`, `O_BAR = 25`) vers la convention canonique XAI.
 *
 * Strictement 0 `any`, < 400 lignes.
 */

import type { Player } from '../../engine/backgammonEngine';

export type MotifId =
    | 'BLITZ_HIT_AND_COVER'
    | 'EXTEND_PRIME_WALL'
    | 'MAKE_KEY_POINT_5_4_7'
    | 'SECURE_ADVANCED_ANCHOR'
    | 'TEMPO_HIT_OUTFIELD'
    | 'DIRECT_VS_INDIRECT_SHOT'
    | 'EXACT_DICE_DUPLICATION'
    | 'INTENTIONAL_SLOTTING'
    | 'ESCAPE_LAST_RUNNER'
    | 'SPLIT_VS_STACK_BACK'
    | 'UNSTACK_MIDPOINT'
    | 'BRING_DOWN_BUILDERS'
    | 'BACKGAME_DOUBLE_ANCHOR'
    | 'HOLDING_GAME_TIMING'
    | 'KILL_A_NUMBER_DEFENSE'
    | 'SAFE_BEAR_IN_CONTACT'
    | 'BEAROFF_WASTAGE_EPC'
    | 'FLEXIBILITY_SPARES';

export interface RaceTelemetry {
    readonly rawPipCount: number;
    readonly oppPipCount: number;
    readonly keithCount: number;
    readonly oppKeithCount: number;
    readonly pointOfLastTake: number;
    readonly epc: number;
    readonly wastage: number;
    readonly crossovers: number;
    readonly borneOff: number;
}

export interface DuplicationTelemetry {
    readonly duplicatedDice: number[];
    readonly overlapScore: number;
}

export interface MotifDetectionResult {
    readonly motif: MotifId;
    readonly primaryPoint?: number;
    readonly secondaryPoint?: number;
    readonly duplicatedDice: number[];
    readonly primeLengthOpt: number;
    readonly primeLengthPlay: number;
    readonly buildersOpt: number;
    readonly buildersPlay: number;
    readonly strippedPointsOpt: number;
    readonly strippedPointsPlay: number;
    readonly raceOpt: RaceTelemetry;
    readonly racePlay: RaceTelemetry;
}

const own = (b: Int8Array | readonly number[], i: number): number => ((b[i] ?? 0) > 0 ? (b[i] ?? 0) : 0);
const opp = (b: Int8Array | readonly number[], i: number): number => ((b[i] ?? 0) < 0 ? -(b[i] ?? 0) : 0);
const isPoint = (b: Int8Array | readonly number[], i: number): boolean => (b[i] ?? 0) >= 2;

/**
 * Convertit un plateau du moteur (`X_BAR = 0`, `O_BAR = 25`) vers le vecteur canonique XAI de 26 entiers
 * où `B[25] >= 0` est la barre du joueur actif, `B[0] <= 0` est la barre adverse, et `B[1..24]` va de 24 vers 1.
 */
export function toCanonicalActiveBoard(
    engineBoard: readonly number[],
    activePlayer: Player = 'X',
): Int8Array {
    const out = new Int8Array(26);
    if (activePlayer === 'X') {
        out[25] = Math.max(0, engineBoard[0] ?? 0);
        out[0] = -Math.max(0, -(engineBoard[25] ?? 0));
        for (let i = 1; i <= 24; i++) {
            out[i] = engineBoard[i] ?? 0;
        }
    } else {
        out[25] = Math.max(0, -(engineBoard[25] ?? 0));
        out[0] = -Math.max(0, engineBoard[0] ?? 0);
        for (let i = 1; i <= 24; i++) {
            out[i] = -(engineBoard[25 - i] ?? 0);
        }
    }
    return out;
}

export function isContactPosition(b: Int8Array | readonly number[]): boolean {
    if (own(b, 25) > 0 || opp(b, 0) > 0) return true;
    let highestOwn = 0;
    let lowestOpp = 25;
    for (let i = 1; i <= 24; i++) {
        if (own(b, i) > 0 && i > highestOwn) highestOwn = i;
        if (opp(b, i) > 0 && i < lowestOpp) lowestOpp = i;
    }
    return highestOwn > lowestOpp;
}

export function computeRaceTelemetry(b: Int8Array | readonly number[]): RaceTelemetry {
    let rawPipCount = 25 * own(b, 25);
    let oppPipCount = 25 * opp(b, 0);
    let totalOwnCheckers = own(b, 25);
    let crossovers = 0;

    for (let i = 1; i <= 24; i++) {
        const cOwn = own(b, i);
        const cOpp = opp(b, i);
        rawPipCount += i * cOwn;
        oppPipCount += (25 - i) * cOpp;
        totalOwnCheckers += cOwn;
        if (cOwn > 0) {
            crossovers += Math.floor((i - 1) / 6) * cOwn;
        }
    }

    const borneOff = 15 - totalOwnCheckers;

    // Pénalités exactes du Keith Count
    const p1 = Math.max(0, own(b, 1) - 1) * 2;
    const p2 = Math.max(0, own(b, 2) - 1) * 1;
    const p3 = Math.max(0, own(b, 3) - 3) * 1;
    const gaps456 = (own(b, 4) === 0 ? 1 : 0) + (own(b, 5) === 0 ? 1 : 0) + (own(b, 6) === 0 ? 1 : 0);
    const keithCount = rawPipCount + p1 + p2 + p3 + gaps456;

    // Keith Count adverse (indices miroirs 24..19)
    const op1 = Math.max(0, opp(b, 24) - 1) * 2;
    const op2 = Math.max(0, opp(b, 23) - 1) * 1;
    const op3 = Math.max(0, opp(b, 22) - 3) * 1;
    const ogaps = (opp(b, 21) === 0 ? 1 : 0) + (opp(b, 20) === 0 ? 1 : 0) + (opp(b, 19) === 0 ? 1 : 0);
    const oppKeithCount = oppPipCount + op1 + op2 + op3 + ogaps;

    const pointOfLastTake = keithCount + Math.floor(keithCount / 7) - 2;

    // Calcul de l'EPC de Walter Trice (partition analytique en 4 régimes)
    const a = own(b, 1);
    const bPt = own(b, 2);
    const c = own(b, 3);
    const d = own(b, 4);
    const e = own(b, 5);
    const g = gaps456;
    const h = (own(b, 4) === 1 ? 1 : 0) + (own(b, 5) === 1 ? 1 : 0) + (own(b, 6) === 1 ? 1 : 0);

    let epc = rawPipCount;
    const nRolls = Math.ceil(totalOwnCheckers / 2);
    const G =
        totalOwnCheckers > 0
            ? rawPipCount / totalOwnCheckers - (totalOwnCheckers % 2 === 1 ? 0.5 : 0)
            : 0;

    if (totalOwnCheckers === 0) {
        epc = 0;
    } else if (crossovers === 0 && G <= 2.3 && (a >= 3 || bPt >= 3)) {
        // Position Rollish : théorème 7n + 1 de Trice avec ajustement G
        const base7n1 = 7 * nRolls + 1;
        if (G < 1.5) epc = base7n1;
        else if (G <= 2.0) epc = base7n1 + (2 * G - 3);
        else epc = base7n1 + (4 * G - 7);
    } else if (totalOwnCheckers <= 8) {
        // Position Non-Rollish <= 8 pions (haute précision à < 0.5 pip)
        epc =
            rawPipCount +
            4 +
            2 * a +
            1.3 * bPt +
            0.8 * c +
            0.4 * d +
            0.2 * e +
            0.7 * (g - 2) +
            0.3 * (h - 2);
    } else if (totalOwnCheckers >= 7 && a <= 2 && bPt <= 2 && c <= 2) {
        // Position Pippish : méthode abc
        epc = rawPipCount + 7 + a + 0.5 * bPt;
    } else {
        // Position générale >= 9 pions : Fastimate
        epc = rawPipCount + 4 + 2 * a + bPt + 0.5 * c + 1.2 * g;
    }

    return {
        rawPipCount,
        oppPipCount,
        keithCount,
        oppKeithCount,
        pointOfLastTake,
        epc: Math.round(epc * 100) / 100,
        wastage: Math.round((epc - rawPipCount) * 100) / 100,
        crossovers,
        borneOff,
    };
}

export function maxPrimeLength(b: Int8Array | readonly number[]): number {
    let maxLen = 0;
    let curLen = 0;
    for (let i = 1; i <= 12; i++) {
        if (isPoint(b, i)) {
            curLen++;
            if (curLen > maxLen) maxLen = curLen;
        } else {
            curLen = 0;
        }
    }
    return maxLen;
}

export function computeDuplication(b: Int8Array | readonly number[]): DuplicationTelemetry {
    const dieCounts = new Int8Array(7); // indices 1..6

    // 1. Tirs directs sur les blots du joueur actif
    for (let target = 1; target <= 24; target++) {
        if (own(b, target) === 1) {
            for (let d = 1; d <= 6; d++) {
                const shooter = target - d;
                if (shooter >= 1 && opp(b, shooter) >= 1) dieCounts[d]++;
                if (target === 25 - d && opp(b, 0) >= 1) dieCounts[d]++;
            }
        }
    }

    // 2. Dés d'entrée adverse depuis la barre
    if (opp(b, 0) >= 1) {
        for (let d = 1; d <= 6; d++) {
            if (own(b, 25 - d) <= 1) dieCounts[d]++;
        }
    }

    // 3. Dés d'évasion des pions arrières adverses par-dessus les portes de prime
    for (let pos = 1; pos <= 6; pos++) {
        if (opp(b, pos) >= 1) {
            for (let d = 1; d <= 6; d++) {
                if (own(b, pos + d) <= 1 && isPoint(b, pos + d - 1)) {
                    dieCounts[d]++;
                }
            }
        }
    }

    const duplicatedDice: number[] = [];
    let overlapScore = 0;
    for (let d = 1; d <= 6; d++) {
        if (dieCounts[d] >= 2) {
            duplicatedDice.push(d);
            overlapScore += dieCounts[d] - 1;
        }
    }
    return { duplicatedDice, overlapScore };
}

export function detectPositionalMotif(
    boardBefore: Int8Array | readonly number[],
    boardPlayed: Int8Array | readonly number[],
    boardOptimal: Int8Array | readonly number[],
    directShotsOpt: number,
    directShotsPlay: number,
    totalHitRollsOpt: number,
    totalHitRollsPlay: number,
): MotifDetectionResult {
    const raceOpt = computeRaceTelemetry(boardOptimal);
    const racePlay = computeRaceTelemetry(boardPlayed);
    const racePre = computeRaceTelemetry(boardBefore);
    const dupOpt = computeDuplication(boardOptimal);
    const dupPlay = computeDuplication(boardPlayed);

    const primeLengthOpt = maxPrimeLength(boardOptimal);
    const primeLengthPlay = maxPrimeLength(boardPlayed);

    const countBuilders = (b: Int8Array | readonly number[]): number => {
        let s = 0;
        for (let i = 8; i <= 11; i++) {
            if (own(b, i) === 1) s += 1;
            else if (own(b, i) >= 3) s += own(b, i) - 2;
        }
        return s;
    };

    const countStripped = (b: Int8Array | readonly number[]): number => {
        let s = 0;
        for (let i = 4; i <= 13; i++) if (own(b, i) === 2) s++;
        return s;
    };

    const buildersOpt = countBuilders(boardOptimal);
    const buildersPlay = countBuilders(boardPlayed);
    const strippedPointsOpt = countStripped(boardOptimal);
    const strippedPointsPlay = countStripped(boardPlayed);

    const baseResult = {
        duplicatedDice: dupOpt.duplicatedDice,
        primeLengthOpt,
        primeLengthPlay,
        buildersOpt,
        buildersPlay,
        strippedPointsOpt,
        strippedPointsPlay,
        raceOpt,
        racePlay,
    };

    // 17 (prioritaire si course pure sans contact) : BEAROFF_WASTAGE_EPC
    if (!isContactPosition(boardBefore)) {
        return { ...baseResult, motif: 'BEAROFF_WASTAGE_EPC' };
    }

    // 1. BLITZ_HIT_AND_COVER
    const innerPointsOpt = [1, 2, 3, 4, 5, 6].filter((i) => isPoint(boardOptimal, i)).length;
    const innerPointsPlay = [1, 2, 3, 4, 5, 6].filter((i) => isPoint(boardPlayed, i)).length;
    if (opp(boardOptimal, 0) > opp(boardPlayed, 0) && innerPointsOpt >= innerPointsPlay && innerPointsOpt >= 3) {
        return { ...baseResult, motif: 'BLITZ_HIT_AND_COVER' };
    }

    // 2. EXTEND_PRIME_WALL
    if (primeLengthOpt > primeLengthPlay && primeLengthOpt >= 4) {
        return { ...baseResult, motif: 'EXTEND_PRIME_WALL' };
    }

    // 3. MAKE_KEY_POINT_5_4_7
    for (const keyPt of [5, 7, 4]) {
        if (isPoint(boardOptimal, keyPt) && !isPoint(boardPlayed, keyPt)) {
            return { ...baseResult, motif: 'MAKE_KEY_POINT_5_4_7', primaryPoint: keyPt };
        }
    }

    // 4. SECURE_ADVANCED_ANCHOR
    for (const anchorPt of [20, 21, 18, 22, 19]) {
        if (isPoint(boardOptimal, anchorPt) && !isPoint(boardPlayed, anchorPt)) {
            return { ...baseResult, motif: 'SECURE_ADVANCED_ANCHOR', primaryPoint: anchorPt };
        }
    }

    // 5. TEMPO_HIT_OUTFIELD
    if (opp(boardOptimal, 0) > opp(boardPlayed, 0)) {
        for (let i = 7; i <= 18; i++) {
            if (opp(boardBefore, i) === 1 && opp(boardOptimal, i) === 0) {
                return { ...baseResult, motif: 'TEMPO_HIT_OUTFIELD', primaryPoint: i };
            }
        }
    }

    // 6. DIRECT_VS_INDIRECT_SHOT
    if (directShotsOpt < directShotsPlay) {
        return { ...baseResult, motif: 'DIRECT_VS_INDIRECT_SHOT' };
    }

    // 7. EXACT_DICE_DUPLICATION
    if (dupOpt.overlapScore > dupPlay.overlapScore && totalHitRollsOpt < totalHitRollsPlay) {
        return { ...baseResult, motif: 'EXACT_DICE_DUPLICATION' };
    }

    // 8. INTENTIONAL_SLOTTING
    for (const slotPt of [5, 4, 7]) {
        if (
            own(boardBefore, slotPt) === 0 &&
            own(boardOptimal, slotPt) === 1 &&
            own(boardPlayed, slotPt) === 0 &&
            (opp(boardOptimal, 0) >= 1 || totalHitRollsOpt <= 6)
        ) {
            return { ...baseResult, motif: 'INTENTIONAL_SLOTTING', primaryPoint: slotPt };
        }
    }

    // 9. ESCAPE_LAST_RUNNER
    const backCount = (b: Int8Array | readonly number[]) =>
        [19, 20, 21, 22, 23, 24].reduce((acc, i) => acc + own(b, i), 0);
    if (backCount(boardOptimal) < backCount(boardPlayed) && backCount(boardBefore) <= 2) {
        return { ...baseResult, motif: 'ESCAPE_LAST_RUNNER' };
    }

    // 10. SPLIT_VS_STACK_BACK
    if (own(boardBefore, 24) === 2 && own(boardOptimal, 24) === 1 && own(boardPlayed, 24) === 2) {
        const splitTarget = [18, 20, 21, 22, 23].find((i) => own(boardOptimal, i) > own(boardBefore, i));
        return { ...baseResult, motif: 'SPLIT_VS_STACK_BACK', primaryPoint: splitTarget ?? 20 };
    }

    // 11. UNSTACK_MIDPOINT
    if (
        own(boardBefore, 13) >= 5 &&
        own(boardOptimal, 13) < own(boardBefore, 13) &&
        own(boardPlayed, 13) === own(boardBefore, 13)
    ) {
        return { ...baseResult, motif: 'UNSTACK_MIDPOINT', primaryPoint: 13 };
    }

    // 12. BRING_DOWN_BUILDERS
    if (buildersOpt > buildersPlay) {
        return { ...baseResult, motif: 'BRING_DOWN_BUILDERS' };
    }

    // 13. BACKGAME_DOUBLE_ANCHOR
    const deepAnchorsOpt = [19, 20, 21, 22, 23, 24].filter((i) => isPoint(boardOptimal, i)).length;
    const deepAnchorsPlay = [19, 20, 21, 22, 23, 24].filter((i) => isPoint(boardPlayed, i)).length;
    if (
        deepAnchorsOpt >= 2 &&
        racePre.rawPipCount - racePre.oppPipCount >= 25 &&
        (deepAnchorsOpt > deepAnchorsPlay || raceOpt.rawPipCount >= racePlay.rawPipCount)
    ) {
        return { ...baseResult, motif: 'BACKGAME_DOUBLE_ANCHOR' };
    }

    // 14. HOLDING_GAME_TIMING
    const hasHighAnchor = [18, 20, 21].some((i) => isPoint(boardBefore, i));
    const outfieldTiming = (b: Int8Array | readonly number[]) =>
        [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].reduce((acc, i) => acc + (i - 6) * own(b, i), 0);
    if (
        hasHighAnchor &&
        racePre.rawPipCount - racePre.oppPipCount >= 12 &&
        outfieldTiming(boardOptimal) > outfieldTiming(boardPlayed)
    ) {
        return { ...baseResult, motif: 'HOLDING_GAME_TIMING' };
    }

    // 16. SAFE_BEAR_IN_CONTACT
    const outerCheckers = (b: Int8Array | readonly number[]) =>
        [7, 8, 9, 10, 11, 12].reduce((acc, i) => acc + own(b, i), 0);
    if (
        outerCheckers(boardOptimal) <= outerCheckers(boardBefore) &&
        totalHitRollsOpt === 0 &&
        totalHitRollsPlay > 0
    ) {
        return { ...baseResult, motif: 'SAFE_BEAR_IN_CONTACT' };
    }

    // 15. KILL_A_NUMBER_DEFENSE
    if (own(boardOptimal, 6) > own(boardPlayed, 6) && racePre.rawPipCount - racePre.oppPipCount >= 15) {
        return { ...baseResult, motif: 'KILL_A_NUMBER_DEFENSE', primaryPoint: 6 };
    }

    // 18. FLEXIBILITY_SPARES (Garantie zéro phrase vague)
    return { ...baseResult, motif: 'FLEXIBILITY_SPARES' };
}

