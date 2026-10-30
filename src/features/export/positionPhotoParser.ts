/**
 * @file src/features/export/positionPhotoParser.ts
 * @description Analyseur pur de position issue d'une photo de tournoi (Vision IA)
 * et réducteur de l'Éditeur Tactile Rapide (« Tap-to-Adjust »).
 *
 * Règles de Gouvernance :
 * - Règle 1 : Module pur sans DOM ni I/O.
 * - Règle 2 : Zéro donnée factice — retourne un `Result<ScannedPositionResult, Error>` explicite.
 * - Règle 3 : Typage strict (0 `any`).
 * - SCALABILITY.md R1 : < 300 lignes.
 */

import {
    createInitialState,
    O_BAR,
    X_BAR,
    serializeXGID,
    type BoardState,
    type Player,
} from '../../engine/backgammonEngine';
import { MAX_CHECKERS_PER_PLAYER } from '../../engine/bearOffRules';
import { analyzeBoardCube, findBestBoardMove } from '../../lib/engine/evaluator';

/** Orientation visuelle du jan intérieur du joueur (flèches 1 à 6) sur la photo. */
export type HomeQuadrantOrientation =
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left';

/** Mode d'outil de l'éditeur tactile « Tap-to-Adjust ». */
export type PositionEditorTool = 'add-x' | 'add-o' | 'remove';

/** Structure brute extraite par le modèle de vision sur les 24 colonnes visuelles + barre + dés + videau. */
export interface RawVisionBoardPayload {
    /** 12 flèches de la rangée supérieure visuelle (de gauche à droite, index 0..11). >0 = Blanc (X), <0 = Noir (O). */
    readonly topRowVisual: readonly number[];
    /** 12 flèches de la rangée inférieure visuelle (de gauche à droite, index 0..11). >0 = Blanc (X), <0 = Noir (O). */
    readonly bottomRowVisual: readonly number[];
    /** Pions Blancs (X) sur la barre centrale (>= 0). */
    readonly barX?: number;
    /** Pions Noirs (O) sur la barre centrale (>= 0). */
    readonly barO?: number;
    /** Valeur du videau (1, 2, 4, 8, 16, 32, 64). */
    readonly cubeValue?: number;
    /** Propriétaire du videau ('X' | 'O' | null). */
    readonly cubeOwner?: Player | null;
    /** Dés visibles sur le tablier ([1..6, 1..6] ou null). */
    readonly dice?: readonly [number, number] | null;
    /** Joueur au trait ('X' | 'O'). */
    readonly turn?: Player;
    /** Indices visuels signalés comme incertains par le modèle (optionnel). */
    readonly uncertainVisualColumns?: readonly number[];
}

export interface ScannedPositionResult {
    readonly state: BoardState;
    readonly xgid: string;
    readonly totalCheckersX: number;
    readonly totalCheckersO: number;
    readonly ambiguousPoints: readonly number[];
    readonly warnings: readonly string[];
}

export type VisionParseResult =
    | { readonly ok: true; readonly value: ScannedPositionResult }
    | { readonly ok: false; readonly error: Error };

/**
 * Calcule les 12 numéros de flèches canoniques (1..24) correspondant à la rangée
 * supérieure (gauche -> droite) et inférieure (gauche -> droite) selon l'emplacement
 * du jan intérieur du joueur X (`1..6`).
 */
export function getVisualRowPointMapping(orientation: HomeQuadrantOrientation): {
    readonly topRowPoints: readonly number[];
    readonly bottomRowPoints: readonly number[];
} {
    switch (orientation) {
        case 'bottom-right':
            return {
                topRowPoints: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
                bottomRowPoints: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
            };
        case 'bottom-left':
            return {
                topRowPoints: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13],
                bottomRowPoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            };
        case 'top-right':
            return {
                topRowPoints: [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
                bottomRowPoints: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
            };
        case 'top-left':
            return {
                topRowPoints: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                bottomRowPoints: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13],
            };
    }
}

/** Compte le total des pions X (blancs) et O (noirs) présents sur le plateau et la barre. */
export function countBoardCheckers(board: readonly number[]): {
    readonly totalX: number;
    readonly totalO: number;
} {
    let totalX = Math.max(0, Math.trunc(board[X_BAR] ?? 0));
    let totalO = Math.max(0, Math.trunc(-(board[O_BAR] ?? 0)));
    for (let pt = 1; pt <= 24; pt++) {
        const val = Math.trunc(board[pt] ?? 0);
        if (val > 0) totalX += val;
        else if (val < 0) totalO += Math.abs(val);
    }
    return { totalX, totalO };
}

function normalizeCubeValue(raw?: number): number {
    const valid = [1, 2, 4, 8, 16, 32, 64];
    if (typeof raw === 'number' && valid.includes(raw)) return raw;
    return 1;
}

function normalizeDice(raw?: readonly [number, number] | null): [number, number] | null {
    if (!raw || raw.length !== 2) return null;
    const d1 = Math.trunc(raw[0]);
    const d2 = Math.trunc(raw[1]);
    if (d1 >= 1 && d1 <= 6 && d2 >= 1 && d2 <= 6) {
        return [d1, d2];
    }
    return null;
}

/**
 * Transforme et valide la charge utile issue de la Vision IA en `ScannedPositionResult`.
 * Ne génère jamais de position factice : renvoie `{ ok: false, error }` si la structure est invalide.
 */
export function validateAndBuildScannedPosition(
    payload: RawVisionBoardPayload,
    orientation: HomeQuadrantOrientation = 'bottom-right',
    matchContext?: {
        readonly matchLength?: number;
        readonly scoreX?: number;
        readonly scoreO?: number;
        readonly crawford?: boolean;
    },
): VisionParseResult {
    if (
        !payload ||
        !Array.isArray(payload.topRowVisual) ||
        !Array.isArray(payload.bottomRowVisual) ||
        payload.topRowVisual.length !== 12 ||
        payload.bottomRowVisual.length !== 12
    ) {
        return {
            ok: false,
            error: new Error(
                'Format de reconnaissance invalide : les 24 flèches (12 haut + 12 bas) sont requises.',
            ),
        };
    }

    const { topRowPoints, bottomRowPoints } = getVisualRowPointMapping(orientation);
    const board = new Array<number>(26).fill(0);
    const ambiguousPoints: number[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < 12; i++) {
        const topVal = Math.trunc(Number(payload.topRowVisual[i]) || 0);
        const botVal = Math.trunc(Number(payload.bottomRowVisual[i]) || 0);
        const topPt = topRowPoints[i];
        const botPt = bottomRowPoints[i];

        board[topPt] = Math.max(-15, Math.min(15, topVal));
        board[botPt] = Math.max(-15, Math.min(15, botVal));

        if (Math.abs(board[topPt]) >= 6) ambiguousPoints.push(topPt);
        if (Math.abs(board[botPt]) >= 6) ambiguousPoints.push(botPt);
    }

    const barX = Math.max(0, Math.min(15, Math.trunc(Number(payload.barX) || 0)));
    const barO = Math.max(0, Math.min(15, Math.trunc(Number(payload.barO) || 0)));
    board[X_BAR] = barX;
    board[O_BAR] = -barO;

    const { totalX, totalO } = countBoardCheckers(board);
    if (totalX > MAX_CHECKERS_PER_PLAYER) {
        warnings.push(
            `${totalX} pions Blancs détectés (maximum légal : 15). Ajustez la flèche surnuméraire d'un tap.`,
        );
    }
    if (totalO > MAX_CHECKERS_PER_PLAYER) {
        warnings.push(
            `${totalO} pions Noirs détectés (maximum légal : 15). Ajustez la flèche surnuméraire d'un tap.`,
        );
    }
    if (ambiguousPoints.length > 0) {
        warnings.push(
            `Pile haute (≥ 6 pions) sur ${ambiguousPoints.map((p) => `pt ${p}`).join(', ')} : vérifiez le compte.`,
        );
    }

    const state: BoardState = {
        board,
        turn: payload.turn === 'O' ? 'O' : 'X',
        cubeValue: normalizeCubeValue(payload.cubeValue),
        cubeOwner: payload.cubeOwner === 'X' || payload.cubeOwner === 'O' ? payload.cubeOwner : null,
        dice: normalizeDice(payload.dice),
        matchLength: matchContext?.matchLength ?? 7,
        scoreX: matchContext?.scoreX ?? 0,
        scoreO: matchContext?.scoreO ?? 0,
        crawford: matchContext?.crawford ?? false,
        doubled: false,
        resigned: 0,
    };

    return {
        ok: true,
        value: {
            state,
            xgid: serializeXGID(state),
            totalCheckersX: totalX,
            totalCheckersO: totalO,
            ambiguousPoints,
            warnings,
        },
    };
}

/**
 * Applique un tap de l'Éditeur Tactile Rapide (« Tap-to-Adjust ») sur une flèche (1..24) ou la barre (0, 25).
 * Garantit l'immuabilité et le plafond strict de 15 pions par joueur.
 */
export function applyPointEditorTap(
    board: readonly number[],
    point: number,
    tool: PositionEditorTool,
): number[] {
    if (point < 0 || point > 25) return [...board];
    const next = [...board];
    const { totalX, totalO } = countBoardCheckers(next);

    if (point === X_BAR) {
        if (tool === 'add-x' && totalX < MAX_CHECKERS_PER_PLAYER) next[X_BAR] = (next[X_BAR] ?? 0) + 1;
        else if (tool === 'remove' && (next[X_BAR] ?? 0) > 0) next[X_BAR] = next[X_BAR] - 1;
        return next;
    }

    if (point === O_BAR) {
        if (tool === 'add-o' && totalO < MAX_CHECKERS_PER_PLAYER) next[O_BAR] = (next[O_BAR] ?? 0) - 1;
        else if (tool === 'remove' && (next[O_BAR] ?? 0) < 0) next[O_BAR] = next[O_BAR] + 1;
        return next;
    }

    const current = next[point] ?? 0;
    if (tool === 'remove') {
        if (current > 0) next[point] = current - 1;
        else if (current < 0) next[point] = current + 1;
        return next;
    }

    if (tool === 'add-x') {
        if (current < 0) {
            next[point] = 0;
        } else if (totalX < MAX_CHECKERS_PER_PLAYER) {
            next[point] = current + 1;
        }
        return next;
    }

    if (tool === 'add-o') {
        if (current > 0) {
            next[point] = 0;
        } else if (totalO < MAX_CHECKERS_PER_PLAYER) {
            next[point] = current - 1;
        }
        return next;
    }

    return next;
}

/** Retourne un plateau entièrement vide (26 zéros) pour composer une position de zéro. */
export function createEmptyEditorBoard(): number[] {
    return new Array<number>(26).fill(0);
}

/** Retourne une copie fraîche de la position initiale standard (15 pions chacun). */
export function createInitialEditorBoard(): number[] {
    return [...createInitialState(7).board];
}

/**
 * Inverse les côtés Blanc (X) et Noir (O) sur le plateau (miroir des flèches 1..24 <-> 24..1 et des barres)
 * pour permettre au joueur de prendre la défense adverse en 1 tap.
 */
export function invertEditorBoardSides(board: readonly number[]): number[] {
    const next = new Array<number>(26).fill(0);
    next[X_BAR] = Math.max(0, -(board[O_BAR] ?? 0));
    next[O_BAR] = -Math.max(0, board[X_BAR] ?? 0);
    for (let pt = 1; pt <= 24; pt++) {
        next[pt] = -(board[25 - pt] ?? 0);
    }
    return next;
}

export interface InstantPositionVerdict {
    readonly cubeAction: string;
    readonly noDoubleEq: number;
    readonly doubleTakeEq: number;
    readonly bestMoveNotation: string | null;
    readonly bestMoveEquity: number | null;
}

/**
 * Calcule instantanément le verdict du videau (Double / Take / Pass) et le meilleur coup
 * pour la position de l'éditeur via le moteur tri-phase embarqué.
 */
export function evaluateScannedPositionInstant(state: BoardState): InstantPositionVerdict {
    const cubeRes = analyzeBoardCube(state);
    let bestMoveNotation: string | null = null;
    let bestMoveEquity: number | null = null;
    if (state.dice) {
        const bestMove = findBestBoardMove(state, state.dice, 1);
        if (bestMove) {
            bestMoveNotation = bestMove.notation;
            bestMoveEquity = bestMove.equity;
        }
    }
    return {
        cubeAction: cubeRes.optimalAction ?? 'No double, take',
        noDoubleEq: cubeRes.noDouble ?? 0,
        doubleTakeEq: cubeRes.doubleTake ?? 0,
        bestMoveNotation,
        bestMoveEquity,
    };
}

