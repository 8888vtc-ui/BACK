/**
 * @file src/hooks/useMatchProgressionState.ts
 * @description Calculs d'état dérivés de progression de match et de règle de Crawford pour useBackgammonGame (< 200 lignes, 0 any).
 */
import { useMemo } from 'react';
import type { BoardState, Player } from '../engine/backgammonEngine';
import { canPlayerOfferDouble } from '../engine/cubeRules';
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
        if (phase !== 'WAITING_FOR_ROLL') return false;
        if (isDMP) return false;
        return canPlayerOfferDouble({
            turn: boardState.turn,
            cubeValue: boardState.cubeValue,
            cubeOwner: boardState.cubeOwner,
            hasRolledDice: Boolean(boardState.dice),
            isCrawford: boardState.crawford,
            scoreX: boardState.scoreX,
            scoreO: boardState.scoreO,
            matchLength,
            board: boardState.board,
        });
    }, [
        phase,
        isDMP,
        boardState.turn,
        boardState.cubeValue,
        boardState.cubeOwner,
        boardState.dice,
        boardState.crawford,
        boardState.scoreX,
        boardState.scoreO,
        matchLength,
        boardState.board,
    ]);

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
