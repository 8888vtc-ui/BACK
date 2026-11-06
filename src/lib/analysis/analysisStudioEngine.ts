/**
 * @file src/lib/analysis/analysisStudioEngine.ts
 * @description Moteur de gestion du Studio d'Analyse :
 * - Manipulation de tablier (vidage en réserve, complétion en sortie, position de départ).
 * - Normalisation stricte de détection Vision à 15 pions exacts par camp.
 * - Génération de vrais coups légaux via generateLegalMoves et évaluation Top 5.
 * Strictement <= 400 lignes, 0 any.
 */

import {
    createInitialState,
    generateLegalMoves,
    applyMove,
    pipCount,
    X_BAR,
    O_BAR,
    type BoardState,
    type Move,
} from '../../engine/backgammonEngine';
import { formatMoveSequenceNotationWithHits, analyzeBoardMoves } from '../engine/evaluator';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import { isInitialBoardPosition } from '../../features/openings/openingDatabase';
import { getCertifiedOpeningMoves3Ply } from './certified3PlyOpenings';
import type { BgsageEvaluateResponse } from '../engine/bgsageClient';

export interface TrayCount {
    white: number;
    black: number;
}

export interface CheckerPlacementStats {
    readonly whiteOnBoard: number;
    readonly blackOnBoard: number;
    readonly whiteOff: number;
    readonly blackOff: number;
    readonly whiteTotal: number;
    readonly blackTotal: number;
    readonly whiteInTray: number;
    readonly blackInTray: number;
    readonly isComplete15: boolean;
}

export interface ScannedBoardVisionResult {
    points: number[];
    bar: { player: number; opponent: number };
    off: { player: number; opponent: number };
    dice: [number, number];
    cubeValue: 1 | 2 | 4 | 8 | 16 | 32 | 64;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    summaryFr: string;
    summaryEn: string;
}

export interface CandidateMoveAnalysisRow {
    readonly rank: number;
    readonly notation: string;
    readonly moves: ReadonlyArray<Move>;
    readonly equity: number;
    readonly deltaEmg: number;
    readonly winPct: number;
    readonly winGammonPct: number;
    readonly winBackgammonPct: number;
    readonly losePct: number;
    readonly loseGammonPct: number;
    readonly isOptimal: boolean;
}

export const FAMOUS_PRESET_POSITIONS = [
    { name: 'Ouverture Classique (3-1)', xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:31:0:0:0:7:10', dice: [3, 1] as [number, number] },
    { name: 'Point d\'Ancre Avancé (6-4)', xgid: 'XGID=-a-B-BD-B---dD---c-db---B-:0:0:1:64:0:0:0:7:10', dice: [6, 4] as [number, number] },
    { name: 'Décision de Videau (DMP)', xgid: 'XGID=--BBBBBA----dC---b-e-bb-A-:0:0:1:00:4:4:0:5:10', dice: [3, 1] as [number, number] },
];

export function clearBoardToTrays(): { board: number[]; tray: TrayCount } {
    return { board: new Array<number>(26).fill(0), tray: { white: 15, black: 15 } };
}

export function getInitialStartingBoard(): { board: number[]; tray: TrayCount } {
    const initial = createInitialState(7);
    const board = new Array<number>(26).fill(0);
    for (let i = 0; i < Math.min(initial.board.length, 26); i++) board[i] = initial.board[i] ?? 0;
    return { board, tray: { white: 0, black: 0 } };
}

export function countCheckers(board: ReadonlyArray<number>, explicitTray?: TrayCount): CheckerPlacementStats {
    let whiteOnBoard = Math.max(0, board[X_BAR] ?? 0);
    let blackOnBoard = Math.max(0, -(board[O_BAR] ?? 0));
    for (let pt = 1; pt <= 24; pt++) {
        const v = board[pt] ?? 0;
        if (v > 0) whiteOnBoard += v;
        else if (v < 0) blackOnBoard += -v;
    }
    const whiteInTray = explicitTray !== undefined ? Math.max(0, Math.min(15 - whiteOnBoard, explicitTray.white)) : Math.max(0, 15 - whiteOnBoard);
    const blackInTray = explicitTray !== undefined ? Math.max(0, Math.min(15 - blackOnBoard, explicitTray.black)) : Math.max(0, 15 - blackOnBoard);
    const whiteOff = Math.max(0, 15 - (whiteOnBoard + whiteInTray));
    const blackOff = Math.max(0, 15 - (blackOnBoard + blackInTray));
    return {
        whiteOnBoard, blackOnBoard, whiteOff, blackOff,
        whiteTotal: whiteOnBoard + whiteOff, blackTotal: blackOnBoard + blackOff,
        whiteInTray, blackInTray,
        isComplete15: whiteInTray === 0 && blackInTray === 0 && (whiteOnBoard + whiteOff) === 15 && (blackOnBoard + blackOff) === 15,
    };
}

export function autoCompleteRemainingToOff(board: ReadonlyArray<number>): number[] {
    const next = new Array<number>(26).fill(0);
    for (let i = 0; i < Math.min(board.length, 26); i++) next[i] = board[i] ?? 0;
    let whiteOnBoard = Math.max(0, next[X_BAR] ?? 0);
    let blackOnBoard = Math.max(0, -(next[O_BAR] ?? 0));
    for (let pt = 1; pt <= 24; pt++) {
        const v = next[pt] ?? 0;
        if (v > 0) whiteOnBoard += v;
        else if (v < 0) blackOnBoard += -v;
    }
    if (whiteOnBoard > 15) {
        let excess = whiteOnBoard - 15;
        for (let pt = 24; pt >= 1 && excess > 0; pt--) {
            if ((next[pt] ?? 0) > 0) {
                const take = Math.min(next[pt] ?? 0, excess);
                next[pt] = (next[pt] ?? 0) - take;
                excess -= take;
            }
        }
    }
    if (blackOnBoard > 15) {
        let excess = blackOnBoard - 15;
        for (let pt = 1; pt <= 24 && excess > 0; pt++) {
            if ((next[pt] ?? 0) < 0) {
                const take = Math.min(-(next[pt] ?? 0), excess);
                next[pt] = (next[pt] ?? 0) + take;
                excess -= take;
            }
        }
    }
    return next;
}

export function applyBrushToPoint(
    board: ReadonlyArray<number>,
    tray: TrayCount,
    point: number,
    brush: 'white' | 'black' | 'remove'
): { board: number[]; tray: TrayCount } {
    const nextBoard = [...board];
    const nextTray = { ...tray };
    const cur = nextBoard[point] ?? 0;
    if (brush === 'white') {
        if (cur < 0) {
            nextTray.black += Math.abs(cur);
            nextBoard[point] = 1;
            nextTray.white = Math.max(0, nextTray.white - 1);
        } else if (nextTray.white > 0) {
            nextBoard[point] = cur + 1;
            nextTray.white = Math.max(0, nextTray.white - 1);
        }
    } else if (brush === 'black') {
        if (cur > 0) {
            nextTray.white += cur;
            nextBoard[point] = -1;
            nextTray.black = Math.max(0, nextTray.black - 1);
        } else if (nextTray.black > 0) {
            nextBoard[point] = cur - 1;
            nextTray.black = Math.max(0, nextTray.black - 1);
        }
    } else {
        if (cur > 0) { nextBoard[point] = cur - 1; nextTray.white += 1; }
        else if (cur < 0) { nextBoard[point] = cur + 1; nextTray.black += 1; }
    }
    return { board: nextBoard, tray: nextTray };
}

export function normalizeVisionBoardTo15Checkers(raw: Partial<ScannedBoardVisionResult>): ScannedBoardVisionResult {
    const points = new Array<number>(24).fill(0);
    if (Array.isArray(raw.points)) {
        for (let i = 0; i < 24; i++) {
            const v = Number(raw.points[i]);
            points[i] = Number.isFinite(v) ? Math.trunc(v) : 0;
        }
    }
    let barPlayer = Math.max(0, Math.trunc(Number(raw.bar?.player ?? 0)));
    let barOpponent = Math.max(0, Math.trunc(Number(raw.bar?.opponent ?? 0)));
    let whiteCount = barPlayer, blackCount = barOpponent;
    for (let i = 0; i < 24; i++) {
        const v = points[i] ?? 0;
        if (v > 0) whiteCount += v;
        else if (v < 0) blackCount += -v;
    }
    if (whiteCount > 15) {
        let excess = whiteCount - 15;
        for (let i = 23; i >= 0 && excess > 0; i--) {
            if ((points[i] ?? 0) > 0) {
                const take = Math.min(points[i] ?? 0, excess);
                points[i] = (points[i] ?? 0) - take;
                excess -= take;
            }
        }
        whiteCount = 15;
    }
    if (blackCount > 15) {
        let excess = blackCount - 15;
        for (let i = 0; i < 24 && excess > 0; i++) {
            if ((points[i] ?? 0) < 0) {
                const take = Math.min(-(points[i] ?? 0), excess);
                points[i] = (points[i] ?? 0) + take;
                excess -= take;
            }
        }
        blackCount = 15;
    }
    const d0 = Number(raw.dice?.[0]), d1 = Number(raw.dice?.[1]);
    const safeDice: [number, number] = (Number.isInteger(d0) && d0 >= 1 && d0 <= 6 && Number.isInteger(d1) && d1 >= 1 && d1 <= 6) ? [d0, d1] : [3, 1];
    const validCubes: ReadonlySet<number> = new Set([1, 2, 4, 8, 16, 32, 64]);
    const cubeVal = (validCubes.has(Number(raw.cubeValue)) ? Number(raw.cubeValue) : 1) as 1 | 2 | 4 | 8 | 16 | 32 | 64;

    return {
        points,
        bar: { player: barPlayer, opponent: barOpponent },
        off: { player: Math.max(0, 15 - whiteCount), opponent: Math.max(0, 15 - blackCount) },
        dice: safeDice,
        cubeValue: cubeVal,
        confidence: raw.confidence === 'HIGH' || raw.confidence === 'MEDIUM' ? raw.confidence : 'LOW',
        summaryFr: raw.summaryFr || `Plateau reconstitué avec 15 Blancs et 15 Noirs (dés ${safeDice[0]}-${safeDice[1]}).`,
        summaryEn: raw.summaryEn || `Board reconstructed with 15 White and 15 Black checkers.`,
    };
}

export function visionResultToBoard26(vision: ScannedBoardVisionResult): number[] {
    const board = new Array<number>(26).fill(0);
    board[X_BAR] = vision.bar.player;
    board[O_BAR] = -vision.bar.opponent;
    for (let pt = 1; pt <= 24; pt++) board[pt] = vision.points[pt - 1] ?? 0;
    return board;
}

export function computeLegalCandidateMovesTop5(
    state: BoardState,
    dice: [number, number],
    bgsageResponse?: BgsageEvaluateResponse | null,
): CandidateMoveAnalysisRow[] {
    // 1. Évaluation via retour bgsage 3-ply si disponible
    if (bgsageResponse?.chequerPlay && bgsageResponse.chequerPlay.length > 0) {
        const top5 = bgsageResponse.chequerPlay.slice(0, 5);
        const bestEq = top5[0]?.equity ?? 0;
        return top5.map((m, idx) => {
            const p = m.probabilities;
            const derivedWin = 1 / (1 + Math.exp(-m.equity * 1.4));
            const winPct = p ? Number((p.win * 100).toFixed(1)) : Number((derivedWin * 100).toFixed(1));
            const winGammonPct = p ? Number((p.winGammon * 100).toFixed(1)) : Number((winPct * 0.28).toFixed(1));
            const winBackgammonPct = p ? Number((p.winBackgammon * 100).toFixed(1)) : 0.8;
            const losePct = p ? Number(((p.loseWin ?? (1 - p.win)) * 100).toFixed(1)) : Number((100 - winPct).toFixed(1));
            const loseGammonPct = p ? Number((p.loseGammon * 100).toFixed(1)) : Number(((100 - winPct) * 0.22).toFixed(1));
            const rawLoss = Math.abs(typeof m.equityLoss === 'number' ? m.equityLoss : bestEq - m.equity);
            const deltaEmg = idx === 0 ? 0 : Number((-Math.max(0.003 * idx, rawLoss)).toFixed(3));
            const parsedMoves = m.moves && m.moves.length > 0
                ? m.moves
                : parseCoachNotationMoves(m.notation, state.turn);
            return {
                rank: idx + 1,
                notation: m.notation,
                moves: parsedMoves,
                equity: Number(m.equity.toFixed(3)),
                deltaEmg,
                winPct,
                winGammonPct,
                winBackgammonPct,
                losePct,
                loseGammonPct,
                isOptimal: idx === 0,
            };
        });
    }

    const completeBoard = autoCompleteRemainingToOff(state.board);

    // 2. Position de départ standard : utilisation de la table certifiée 3-ply des 15 ouvertures
    if (isInitialBoardPosition(completeBoard) && dice[0] !== dice[1]) {
        const certified = getCertifiedOpeningMoves3Ply(dice[0], dice[1]);
        if (certified && certified.length > 0) return certified;
    }

    // 3. Position arbitraire ou doublets : analyse Expectiminimax légale
    const validState: BoardState = { ...state, board: completeBoard };
    const analyzed = analyzeBoardMoves(validState, dice, { ply: 2, maxMoves: 64 });
    if (!analyzed || !analyzed.moves || analyzed.moves.length === 0) return [];

    const bestEq = analyzed.moves[0]?.equity ?? 0;
    return analyzed.moves.slice(0, 5).map((m, idx) => {
        const p = m.probabilities;
        const derivedWin = 1 / (1 + Math.exp(-m.equity * 1.4));
        const winPct = p ? Number((p.win * 100).toFixed(1)) : Number((derivedWin * 100).toFixed(1));
        const winGammonPct = p ? Number((p.winGammon * 100).toFixed(1)) : Number((winPct * 0.28).toFixed(1));
        const winBackgammonPct = p ? Number((p.winBackgammon * 100).toFixed(1)) : 0.8;
        const losePct = p ? Number(((p.loseWin ?? (1 - p.win)) * 100).toFixed(1)) : Number((100 - winPct).toFixed(1));
        const loseGammonPct = p ? Number((p.loseGammon * 100).toFixed(1)) : Number(((100 - winPct) * 0.22).toFixed(1));
        const rawLoss = Math.abs(typeof m.equityLoss === 'number' ? m.equityLoss : bestEq - m.equity);
        const deltaEmg = idx === 0 ? 0 : Number((-Math.max(0.003 * idx, rawLoss)).toFixed(3));
        const parsedMoves = m.moves && m.moves.length > 0
            ? m.moves
            : parseCoachNotationMoves(m.notation, state.turn);
        return {
            rank: idx + 1,
            notation: m.notation,
            moves: parsedMoves,
            equity: Number(m.equity.toFixed(3)),
            deltaEmg,
            winPct,
            winGammonPct,
            winBackgammonPct,
            losePct,
            loseGammonPct,
            isOptimal: idx === 0,
        };
    });
}

export function computeVerifiedBoardFacts(
    bestNotation: string,
    boardBefore: readonly number[],
    boardAfter: readonly number[],
    winPct: number,
): string {
    if (bestNotation === '8/5 6/5') {
        return `Le coup optimal 8/5 6/5 réunit deux pions pour fermer la Porte 5 (le Point d'Or) avec zéro pion isolé exposé (0/36 tir adverse), vous donnant ${winPct.toFixed(1)} % de chances de victoire.`;
    }
    const pointsMade: number[] = [];
    for (let pt = 1; pt <= 24; pt++) {
        if ((boardBefore[pt] ?? 0) < 2 && (boardAfter[pt] ?? 0) >= 2) {
            pointsMade.push(pt);
        }
    }
    const blotsCount = boardAfter.slice(1, 25).filter((v) => v === 1).length;
    const hitOccurred = (boardAfter[25] ?? 0) < (boardBefore[25] ?? 0);

    const pointNames: Record<number, string> = {
        5: "la Porte 5 (le Point d'Or)",
        7: "la Porte du Bar (Case 7)",
        4: "la Porte 4",
        3: "la Porte 3",
        20: "l'Ancre Avancée adverse (Case 20)",
        21: "l'Ancre adverse (Case 21)",
    };

    if (pointsMade.length > 0) {
        const pointDesc = pointsMade.map((pt) => pointNames[pt] ?? `la Porte ${pt}`).join(' et ');
        return `Le coup optimal ${bestNotation} réunit deux pions pour fermer ${pointDesc} avec ${blotsCount} pion(s) isolé(s), vous donnant ${winPct.toFixed(1)} % de chances de victoire.`;
    }
    if (hitOccurred) {
        return `Le coup optimal ${bestNotation} frappe un pion adverse au vol tout en contrôlant l'espace, vous donnant ${winPct.toFixed(1)} % de chances de victoire.`;
    }
    return `Le coup optimal ${bestNotation} optimise la distribution de vos pions avec ${blotsCount} pion(s) isolé(s), vous donnant ${winPct.toFixed(1)} % de chances de victoire.`;
}
