'use client';

/**
 * Hook d'orchestration des temporisations du tour humain (Fanned / Jet bloqué et Auto-Commit).
 * Conforme à SCALABILITY.md (< 85 lignes).
 */

import { useEffect } from 'react';
import { generateLegalMoves, type BoardState, type Player } from '../engine/backgammonEngine';
import type { GamePhase as StrictGamePhase } from '../actions/types';
import type { GamePhase, GameAction, MoveHistoryEntry } from './gameStateReducer';
import { shouldAutoConfirmTurn, type AutoConfirmMode } from './useTurnConfirmation';

export const AUTO_CONFIRM_TURN_DELAY_MS = 250;

export interface UseHumanTurnTimerParams {
    phase: GamePhase;
    boardState: BoardState;
    humanPlayer: Player;
    strictGamePhase: StrictGamePhase;
    moveHistory: MoveHistoryEntry[];
    opponentStatusMessage: string | null;
    autoConfirmTurn: boolean;
    autoConfirmMode: AutoConfirmMode;
    isDMP: boolean;
    matchLength: number;
    clearHumanTimers: () => void;
    humanTimersRef: React.MutableRefObject<NodeJS.Timeout[]>;
    dispatch: (action: GameAction) => void;
}

export function useHumanTurnTimer({
    phase,
    boardState,
    humanPlayer,
    strictGamePhase,
    moveHistory,
    opponentStatusMessage,
    autoConfirmMode,
    isDMP,
    matchLength,
    clearHumanTimers,
    humanTimersRef,
    dispatch,
}: UseHumanTurnTimerParams): void {
    useEffect(() => {
        clearHumanTimers();
        if (phase !== 'PLAYING_MOVES' || !boardState.dice || boardState.turn !== humanPlayer) {
            return;
        }

        const isBlockedFanned =
            moveHistory.length === 0 &&
            opponentStatusMessage === 'Bloqué — aucun coup possible';

        if (isBlockedFanned) {
            const tBlocked = setTimeout(() => {
                dispatch({ type: 'COMMIT_HUMAN_TURN' });
            }, 1200);
            humanTimersRef.current.push(tBlocked);
            return () => {
                clearHumanTimers();
            };
        }

        if (strictGamePhase === 'HUMAN_READY_TO_COMMIT' && moveHistory.length > 0) {
            const turnStartBoard = moveHistory[0]?.board ?? boardState.board;
            const isForcedSingleChoice =
                autoConfirmMode === 'forced_only' || autoConfirmMode === 'always_except_cube'
                    ? generateLegalMoves({ ...boardState, board: turnStartBoard, turn: humanPlayer }, boardState.dice).length <= 1
                    : false;
            const opponentCanDoubleNextTurn =
                !boardState.crawford &&
                !isDMP &&
                (boardState.cubeOwner === null || boardState.cubeOwner === 'O') &&
                (matchLength <= 0 || boardState.scoreO < matchLength - 1);

            const shouldAutoCommit = shouldAutoConfirmTurn({
                mode: autoConfirmMode,
                isForcedSingleChoice,
                opponentCanDoubleNextTurn,
            });

            if (shouldAutoCommit) {
                const tAutoCommit = setTimeout(() => {
                    dispatch({ type: 'COMMIT_HUMAN_TURN' });
                }, AUTO_CONFIRM_TURN_DELAY_MS);
                humanTimersRef.current.push(tAutoCommit);
                return () => {
                    clearHumanTimers();
                };
            }
        }
    }, [
        phase,
        boardState,
        humanPlayer,
        strictGamePhase,
        moveHistory,
        opponentStatusMessage,
        clearHumanTimers,
        humanTimersRef,
        autoConfirmMode,
        isDMP,
        matchLength,
        dispatch,
    ]);
}
