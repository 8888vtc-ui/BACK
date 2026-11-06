/**
 * @file src/features/coach/turnSnapshot.ts
 * @description Capture immuable du tour humain (HumanTurnSnapshot) & Triple Assertion anti-erreur (< 190 lignes, 0 any).
 */

import type { BoardState } from '../../engine/backgammonEngine';
import { applyMove, pipCount, serializeCanonicalXGID } from '../../engine/backgammonEngine';
import { computeShotExposure } from '../../lib/engine/shotExposure';
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

export interface CommittedHumanMovePacket {
    readonly packetId: string;
    readonly turnNumber: number;
    readonly actor: 'X';
    readonly boardBeforeMove: readonly number[];
    readonly boardAfterMove: readonly number[];
    readonly offBefore: { readonly X: number; readonly O: number };
    readonly offAfter: { readonly X: number; readonly O: number };
    readonly diceRolled: readonly [number, number];
    readonly playedMoveNotation: string;
    readonly playedSubMoves: ReadonlyArray<{ readonly from: number; readonly to: number; readonly die: number; readonly isHit: boolean }>;
    readonly matchContext: {
        readonly scoreX: number;
        readonly scoreO: number;
        readonly matchLength: number;
        readonly cubeValue: number;
        readonly cubeOwner: 'X' | 'O' | null;
        readonly crawford: boolean;
    };
    readonly optimalSubMoves?: ReadonlyArray<{ readonly from: number; readonly to: number }>;
}

export function boardSignature(board: readonly number[]): string {
    return board.slice(0, 26).join(',');
}

export function computeOffCheckers(board: readonly number[]): { X: number; O: number } {
    let sumX = board[0] > 0 ? board[0] : 0;
    let sumO = board[25] < 0 ? -board[25] : 0;
    for (let p = 1; p <= 24; p++) {
        const val = board[p] ?? 0;
        if (val > 0) sumX += val;
        else if (val < 0) sumO += -val;
    }
    return {
        X: Math.max(0, 15 - sumX),
        O: Math.max(0, 15 - sumO),
    };
}

export function createCommittedHumanMovePacket(params: {
    turnNumber: number;
    boardBeforeMove: readonly number[];
    boardAfterMove: readonly number[];
    diceRolled: readonly [number, number];
    playedMoveNotation: string;
    playedSubMoves?: ReadonlyArray<{ from: number; to: number; die?: number; isHit?: boolean }>;
    matchContext: {
        scoreX: number;
        scoreO: number;
        matchLength: number;
        cubeValue: number;
        cubeOwner: 'X' | 'O' | null;
        crawford: boolean;
    };
    optimalSubMoves?: ReadonlyArray<{ from: number; to: number }>;
}): CommittedHumanMovePacket {
    const packetId = `pkt_${params.turnNumber}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const offBefore = computeOffCheckers(params.boardBeforeMove);
    const offAfter = computeOffCheckers(params.boardAfterMove);
    const subMoves = (params.playedSubMoves ?? []).map((m) => ({
        from: m.from,
        to: m.to,
        die: m.die ?? (m.from === 0 ? 25 - m.to : m.to === 0 ? m.from : Math.abs(m.from - m.to)),
        isHit: Boolean(m.isHit || (m.to >= 1 && m.to <= 24 && params.boardBeforeMove[m.to] === -1)),
    }));

    return Object.freeze({
        packetId,
        turnNumber: params.turnNumber,
        actor: 'X' as const,
        boardBeforeMove: Object.freeze([...params.boardBeforeMove]),
        boardAfterMove: Object.freeze([...params.boardAfterMove]),
        offBefore: Object.freeze(offBefore),
        offAfter: Object.freeze(offAfter),
        diceRolled: Object.freeze([params.diceRolled[0], params.diceRolled[1]]) as readonly [number, number],
        playedMoveNotation: params.playedMoveNotation,
        playedSubMoves: Object.freeze(subMoves),
        matchContext: Object.freeze({ ...params.matchContext }),
        optimalSubMoves: params.optimalSubMoves ? Object.freeze(params.optimalSubMoves.map((m) => ({ ...m }))) : undefined,
    });
}

export interface CoachVerifiedFacts {
    readonly realBlotsAfterPlayed: number[];
    readonly realPointsMadeByBest: number[];
    readonly realPointsMadeByPlayed: number[];
    readonly missedHit: boolean;
    readonly realBlotsAfterBest: number[];
    readonly directShotsOnPlayerAfterPlayed: number;
    readonly directShotsOnPlayerAfterBest: number;
    readonly summaryText: string;
}

export function extractVerifiedCoachFacts(
    boardBefore: readonly number[],
    boardPlayedAfter: readonly number[],
    boardOptimalAfter: readonly number[] = boardPlayedAfter,
): CoachVerifiedFacts {
    const realBlotsAfterPlayed: number[] = [];
    const realBlotsAfterBest: number[] = [];
    const realPointsMadeByBest: number[] = [];
    const realPointsMadeByPlayed: number[] = [];

    for (let p = 1; p <= 24; p++) {
        // Loi mathématique absolue : un blot n'existe sur p que si boardPlayedAfter[p] === 1 (strictement égal à 1)
        if ((boardPlayedAfter[p] ?? 0) === 1) realBlotsAfterPlayed.push(p);
        if ((boardOptimalAfter[p] ?? 0) === 1) realBlotsAfterBest.push(p);
        if ((boardBefore[p] ?? 0) < 2 && (boardOptimalAfter[p] ?? 0) >= 2) realPointsMadeByBest.push(p);
        if ((boardBefore[p] ?? 0) < 2 && (boardPlayedAfter[p] ?? 0) >= 2) realPointsMadeByPlayed.push(p);
    }

    const directShotsOnPlayerAfterPlayed =
        realBlotsAfterPlayed.length === 0 ? 0 : computeShotExposure([...boardPlayedAfter], 'X').totalRolls;
    const directShotsOnPlayerAfterBest =
        realBlotsAfterBest.length === 0 ? 0 : computeShotExposure([...boardOptimalAfter], 'X').totalRolls;

    const missedHit =
        ((boardOptimalAfter[25] ?? 0) < (boardBefore[25] ?? 0)) &&
        ((boardPlayedAfter[25] ?? 0) === (boardBefore[25] ?? 0));

    const summaryText =
        realBlotsAfterPlayed.length === 0
            ? 'Aucun pion isolé (0 blot exposé, 0 lancer adverse sur 36).'
            : `Pion(s) isolé(s) sur flèche${realBlotsAfterPlayed.length > 1 ? 's' : ''} ${realBlotsAfterPlayed.join(', ')} (${directShotsOnPlayerAfterPlayed} lancers sur 36).`;

    return {
        realBlotsAfterPlayed,
        realPointsMadeByBest,
        realPointsMadeByPlayed,
        missedHit,
        realBlotsAfterBest,
        directShotsOnPlayerAfterPlayed,
        directShotsOnPlayerAfterBest,
        summaryText,
    };
}

export const computeVerifiedBoardFacts = extractVerifiedCoachFacts;

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
 * sur le plateau d'origine en appliquant les règles exactes de frappe (Verrou 2 - Assertion B).
 */
export function verifyCheckersPhysicallyExistOnBoard(
    notation: string,
    boardBefore: readonly number[],
    player: 'X' | 'O' = 'X',
    dice?: readonly [number, number],
): boolean {
    if (!notation || notation === 'Pass' || notation === 'Double' || notation === 'Take' || notation === 'Drop') {
        return true;
    }
    const moves = parseCoachNotationMoves(notation, player, dice);
    if (moves.length === 0) return true;

    let boardSim = [...boardBefore];
    for (const m of moves) {
        if (m.from === 0 || (player === 'O' && m.from === 25)) {
            const barCount = player === 'X' ? boardSim[0] : -boardSim[25];
            if (barCount <= 0) return false;
        } else if (m.from >= 1 && m.from <= 24) {
            const count = player === 'X' ? boardSim[m.from] : -boardSim[m.from];
            if (count <= 0) return false;
        } else {
            return false;
        }
        boardSim = applyMove(boardSim, m, player);
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

/**
 * Verrou anti-hallucination des cases/blots (MISSION 10/25).
 * Toute flèche p in {1..24} citée comme "pion isolé (blot)" DOIT vérifier physiquement boardAfterMove[p] === 1.
 * Si boardAfterMove[p] >= 2 ou <= 0, interdiction formelle de l'appeler pion isolé !
 */
export function verifyAndSanitizeCoachTextAgainstBoard(
    text: string,
    boardAfterMove: readonly number[] | undefined,
    lang: 'fr' | 'en' = 'fr',
    player: 'X' | 'O' = 'X',
): { sanitizedText: string; hasHallucination: boolean; correctedPoints: number[] } {
    if (!text || !boardAfterMove || boardAfterMove.length < 25) {
        return { sanitizedText: text, hasHallucination: false, correctedPoints: [] };
    }

    const correctedPoints: number[] = [];
    let sanitized = text;
    const isEn = lang === 'en';

    const blotRegexes = [
        /(?:pion(?:s)?\s+isolé(?:s)?|blot(?:s)?|pion(?:s)?\s+seul(?:s)?)\s+(?:sur\s+(?:la\s+)?(?:case|flèche)\s+|en\s+|sur\s+)(\d{1,2})/gi,
        /(?:case|flèche)s?\s+(\d{1,2})\s+(?:comme\s+(?:un\s+)?(?:blot|pion isolé|pion seul)|laissée?\s+(?:exposée?|isolée?))/gi,
        /laisse\s+(?:un\s+)?(?:blot|pion isolé|pion seul)\s+(?:sur\s+(?:la\s+)?(?:case|flèche)\s+|en\s+|sur\s+)(\d{1,2})/gi,
        /(?:blot|lone\s+checker|isolated\s+checker)s?\s+(?:on\s+(?:point\s+)?|at\s+)(\d{1,2})/gi,
        /point\s+(\d{1,2})\s+(?:as\s+a\s+(?:blot|lone\s+checker|isolated\s+checker)|left\s+exposed)/gi,
        /leaves\s+a\s+(?:blot|lone\s+checker|isolated\s+checker)\s+(?:on\s+(?:point\s+)?|at\s+)(\d{1,2})/gi,
    ];

    for (const regex of blotRegexes) {
        sanitized = sanitized.replace(regex, (match, ptStr) => {
            const p = parseInt(ptStr, 10);
            if (isNaN(p) || p < 1 || p > 24) return match;
            const rawVal = boardAfterMove[p] ?? 0;
            const count = player === 'X' ? rawVal : -rawVal;

            if (count === 1) {
                return match;
            }

            correctedPoints.push(p);
            if (count >= 2) {
                return isEn
                    ? `secure point on point ${p} (${count} checkers)`
                    : `porte consolidée sur la case ${p} (${count} pions)`;
            }
            return isEn
                ? `cleared point ${p}`
                : `case ${p} libérée`;
        });
    }

    return {
        sanitizedText: sanitized,
        hasHallucination: correctedPoints.length > 0,
        correctedPoints,
    };
}

export type CoachSinType =
    | 'ILLEGAL_RECOMMENDED_MOVE'
    | 'MISMATCHED_PLAYED_MOVE'
    | 'WRONG_TURN_OR_POST_MOVE_BOARD'
    | 'LLM_TEXT_HALLUCINATION'
    | 'FALSE_BLUNDER_ON_OPTIMAL'
    | 'TIER_JARGON_VIOLATION'
    | 'BOT_ABSURD_MOVE';

export function auditCoachTruth(params: {
    player: 'X' | 'O';
    boardBeforeMove: readonly number[];
    boardAfterMove: readonly number[];
    diceRolled: readonly [number, number];
    playedMoveNotation: string;
    recommendedMoveNotation: string;
    equityLossEmg: number;
    playerTier?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
    botDifficulty?: string;
    coachExplanationText?: string;
}): { isValid: boolean; sin?: CoachSinType; errorMessage?: string } {
    if (!verifyCheckersPhysicallyExistOnBoard(params.recommendedMoveNotation, params.boardBeforeMove, params.player, params.diceRolled)) {
        return { isValid: false, sin: 'ILLEGAL_RECOMMENDED_MOVE', errorMessage: `Coup recommandé illégal : ${params.recommendedMoveNotation}` };
    }
    if (params.coachExplanationText) {
        const check = verifyAndSanitizeCoachTextAgainstBoard(params.coachExplanationText, params.boardAfterMove, 'fr', params.player);
        if (check.hasHallucination) {
            return { isValid: false, sin: 'LLM_TEXT_HALLUCINATION', errorMessage: `Hallucination détectée sur case(s) : ${check.correctedPoints.join(',')}` };
        }
    }
    return { isValid: true };
}
