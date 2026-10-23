/**
 * Types pour l'export/import aux formats XGID et SGF, et liens de partage.
 */

import type { Player, BoardState } from '../../engine/backgammonEngine';
import type { RawGameTurn } from '../rating/types';

export interface MatchExportData {
    gameId: string;
    playerX?: string;
    playerO?: string;
    matchLength: number;
    scoreX: number;
    scoreO: number;
    winner?: Player | null;
    pointsWon?: number;
    currentState?: BoardState;
    turnsHistory?: RawGameTurn[];
}

export interface ParsedSGFMove {
    player: Player;
    dice: [number, number];
    notation: string;
}

export interface ParsedSGFData {
    playerX: string;
    playerO: string;
    matchLength: number;
    scoreX: number;
    scoreO: number;
    winner?: Player | null;
    pointsWon?: number;
    result?: string;
    moves: ParsedSGFMove[];
}
