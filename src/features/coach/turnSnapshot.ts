/**
 * @file src/features/coach/turnSnapshot.ts
 * @description Capture immuable du tour humain (HumanTurnSnapshot) & Triple Assertion anti-erreur (< 190 lignes, 0 any).
 */

import type { BoardState } from '../../engine/backgammonEngine';
import { pipCount, serializeCanonicalXGID } from '../../engine/backgammonEngine';
import { validateBoardState } from '../drills/drillSubAgentsPipeline';
import { parseCoachNotationMoves } from './coachMoveNotation';

export interface HumanTurnSnapshot {
    readonly turnId: string;
    readonly actor: 'HUMAN';
    readonly timestamp: number;
    readonly dice: readonly [number, number];
    readonly boardBeforeMove: readonly number[];
    readonly xgidBeforeMove: string;
    readonly pipCountX: number;
    readonly pipCountO: number;
}

export interface ValidationSnapshotResult {
    readonly isValid: boolean;
    readonly reason?: string;
    readonly sanitizedPlayedNotation?: string;
    readonly sanitizedOptimalNotation?: string;
}

/**
 * Capture immuable au lancer de dés du joueur humain (Verrou 1).
 * Vérifie 15 pions par camp et clone profondément les 26 cases.
 */
export function createHumanTurnSnapshot(
    state: BoardState,
    dice: [number, number] | null,
    turnIndex: number,
): HumanTurnSnapshot | null {
    if (state.turn !== 'X' || !dice || (dice[0] === 0 && dice[1] === 0)) {
        return null;
    }

    const boardClone = [...state.board];
    let rawWhite = Math.max(0, boardClone[0] ?? 0);
    let rawBlack = Math.max(0, -(boardClone[25] ?? 0));
    for (let p = 1; p <= 24; p++) {
        const val = boardClone[p] ?? 0;
        if (val > 0) rawWhite += val;
        else if (val < 0) rawBlack += -val;
    }
    if (rawWhite > 15 || rawBlack > 15) {
        return null;
    }

    const validation = validateBoardState(boardClone, 'X');
    if (!validation.isValid15Checkers || validation.whiteCheckersTotal !== 15 || validation.blackCheckersTotal !== 15) {
        return null;
    }

    const pips = pipCount(boardClone);
    const xgid = serializeCanonicalXGID({
        ...state,
        board: boardClone,
        dice: [dice[0], dice[1]],
    });

    return {
        turnId: `human_turn_${turnIndex}_${Date.now()}`,
        actor: 'HUMAN',
        timestamp: Date.now(),
        dice: [dice[0], dice[1]],
        boardBeforeMove: Object.freeze(boardClone),
        xgidBeforeMove: xgid,
        pipCountX: pips.X,
        pipCountO: pips.O,
    };
}

/**
 * Contrôle physique strict : vérifie qu'une notation ne déplace QUE des pions existants
 * sur le plateau d'origine (Verrou 2 - Assertion B).
 */
export function verifyCheckersPhysicallyExistOnBoard(
    notation: string,
    boardBefore: readonly number[],
    player: 'X' | 'O' = 'X',
): boolean {
    if (!notation || notation === 'Pass' || notation === 'Double' || notation === 'Take' || notation === 'Drop') {
        return true;
    }
    const moves = parseCoachNotationMoves(notation, player);
    if (moves.length === 0) return true;

    const boardSim = [...boardBefore];
    for (const m of moves) {
        if (m.from === 0 || (player === 'O' && m.from === 25)) {
            const barCount = player === 'X' ? boardSim[0] : -boardSim[25];
            if (barCount <= 0) return false;
            if (player === 'X') boardSim[0] -= 1; else boardSim[25] += 1;
        } else if (m.from >= 1 && m.from <= 24) {
            const count = player === 'X' ? boardSim[m.from] : -boardSim[m.from];
            if (count <= 0) return false;
            if (player === 'X') boardSim[m.from] -= 1; else boardSim[m.from] += 1;
        } else {
            return false;
        }
        if (m.to >= 1 && m.to <= 24) {
            if (player === 'X') boardSim[m.to] += 1; else boardSim[m.to] -= 1;
        }
    }
    return true;
}

/**
 * Validation du coup par signature d'état & mêmes dés (Verrou 2 - Triple Assertion).
 */
export function validateMoveAgainstSnapshot(
    snapshot: HumanTurnSnapshot | null,
    playedNotation: string,
    optimalNotation: string,
    currentActor: 'X' | 'O' = 'X',
): ValidationSnapshotResult {
    // Coupe-circuit anti-bot strict
    if (!snapshot || snapshot.actor !== 'HUMAN' || currentActor !== 'X') {
        return { isValid: false, reason: 'ANTI_BOT_SHORT_CIRCUIT_TRIGGERED' };
    }

    // Assertion A : Vérification des dés
    const playedMoves = parseCoachNotationMoves(playedNotation, 'X');
    if (playedMoves.length > 0) {
        const allowedDices = snapshot.dice[0] === snapshot.dice[1]
            ? [snapshot.dice[0], snapshot.dice[0], snapshot.dice[0], snapshot.dice[0]]
            : [snapshot.dice[0], snapshot.dice[1]];
        for (const m of playedMoves) {
            const step = m.from === 0 ? 25 - m.to : m.to === 0 ? m.from : m.from - m.to;
            if (step > 0 && !allowedDices.includes(step) && step !== snapshot.dice[0] + snapshot.dice[1]) {
                return { isValid: false, reason: `DICE_MISMATCH_${step}` };
            }
        }
    }

    // Assertion B : Existence physique des pions sur boardBeforeMove
    const playedCheckersExist = verifyCheckersPhysicallyExistOnBoard(playedNotation, snapshot.boardBeforeMove, 'X');
    if (!playedCheckersExist) {
        return { isValid: false, reason: `PHANTOM_PLAYED_MOVE_${playedNotation}` };
    }

    const optimalCheckersExist = verifyCheckersPhysicallyExistOnBoard(optimalNotation, snapshot.boardBeforeMove, 'X');
    if (!optimalCheckersExist) {
        return { isValid: false, reason: `PHANTOM_OPTIMAL_MOVE_${optimalNotation}` };
    }

    return {
        isValid: true,
        sanitizedPlayedNotation: playedNotation,
        sanitizedOptimalNotation: optimalNotation,
    };
}

/**
 * Assertion C : Vérité d'équité & Zéro punition si perte <= 0.020 EMG.
 */
export function sanitizeVerdictWithEquityThreshold(equityLoss: number, rawVerdict: string): 'optimal' | 'good' | 'inaccuracy' | 'blunder' {
    const absLoss = Math.abs(equityLoss);
    if (absLoss <= 0.010) return 'optimal';
    if (absLoss <= 0.020) return 'good';
    if (absLoss >= 0.080) return 'blunder';
    return (rawVerdict === 'blunder' ? 'blunder' : 'inaccuracy');
}
