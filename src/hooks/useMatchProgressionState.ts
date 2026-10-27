/**
 * @file src/hooks/useMatchProgressionState.ts
 * @description Calculs d'état dérivés de progression de match et de règle de Crawford pour useBackgammonGame (< 200 lignes, 0 any).
 */
import { useMemo } from 'react';
import type { BoardState, Player } from '../engine/backgammonEngine';
import type { GamePhase } from './gameStateReducer';

export interface UseMatchProgressionParams {
    matchLength: number;
    boardState: BoardState;
    phase: GamePhase;
    crawfordAlreadyPlayed?: boolean;
}

export interface UseMatchProgressionResult {
    isDMP: boolean;
    canDouble: boolean;
    isMatchOver: boolean;
    matchWinner: Player | null;
    isCrawfordNext: boolean;
}

export function useMatchProgressionState({
    matchLength,
    boardState,
    phase,
    crawfordAlreadyPlayed,
}: UseMatchProgressionParams): UseMatchProgressionResult {
    const isDMP = useMemo(() => {
        if (matchLength <= 0) return false;
        return boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
    }, [matchLength, boardState.scoreX, boardState.scoreO]);

    const canDouble = useMemo(() => {
        if (boardState.crawford) return false;
        if (isDMP) return false;
        if (phase !== 'WAITING_FOR_ROLL') return false;
        if (boardState.cubeOwner !== null && boardState.cubeOwner !== boardState.turn) return false;
        if (matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength)) return false;
        return true;
    }, [boardState.crawford, isDMP, phase, boardState.cubeOwner, boardState.turn, boardState.scoreX, boardState.scoreO, matchLength]);

    const isMatchOver = useMemo(() => {
        if (matchLength <= 0) return false;
        return boardState.scoreX >= matchLength || boardState.scoreO >= matchLength;
    }, [boardState.scoreX, boardState.scoreO, matchLength]);

    const matchWinner: Player | null = useMemo(() => {
        if (matchLength <= 0) return null;
        if (boardState.scoreX >= matchLength) return 'X';
        if (boardState.scoreO >= matchLength) return 'O';
        return null;
    }, [boardState.scoreX, boardState.scoreO, matchLength]);

    const isCrawfordNext = useMemo(() => {
        if (matchLength <= 0 || isMatchOver) return false;
        if (crawfordAlreadyPlayed) return false;
        return (
            boardState.scoreX === matchLength - 1 ||
            boardState.scoreO === matchLength - 1
        );
    }, [matchLength, isMatchOver, crawfordAlreadyPlayed, boardState.scoreX, boardState.scoreO]);

    return { isDMP, canDouble, isMatchOver, matchWinner, isCrawfordNext };
}
