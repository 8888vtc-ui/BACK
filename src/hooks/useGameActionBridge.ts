/**
 * @file src/hooks/useGameActionBridge.ts
 * @description Passerelle d'exécution des actions complexes (commitHumanMove, replayFromLog, runAiTurn, rewindToLogTurn)
 * pour useBackgammonGame (< 200 lignes, 0 any).
 */
import { useCallback, type MutableRefObject } from 'react';
import type { Move } from '../engine/backgammonEngine';
import type { GameResult } from '../engine/aiHeuristics';
import type { MatchLogEntry } from '../actions/types';
import { commitHumanMoveAction } from '../actions/commitHumanMoveAction';
import { replayFromLogAction } from '../actions/replayFromLogAction';
import { runAiTurnAction } from '../actions/runAiTurnAction';
import { getSpeedPreset, type GameSpeed } from '../lib/gameFeel/speedPresets';
import {
    deriveStrictGamePhase,
    type BackgammonGameState,
    type GameAction,
} from './gameStateReducer';

export interface UseGameActionBridgeParams {
    state: BackgammonGameState;
    gameResult: GameResult | null;
    dispatch: (action: GameAction) => void;
    clearHumanTimers: () => void;
    clearOpponentTimers: () => void;
    opponentTurnInProgressRef: MutableRefObject<boolean>;
    gameSpeedRef: MutableRefObject<GameSpeed>;
}

export function useGameActionBridge({
    state,
    gameResult,
    dispatch,
    clearHumanTimers,
    clearOpponentTimers,
    opponentTurnInProgressRef,
    gameSpeedRef,
}: UseGameActionBridgeParams) {
    const { boardState, phase, usedDice } = state;

    const commitHumanMove = useCallback((moves?: Move[]) => {
        const currentGPhase = deriveStrictGamePhase(
            phase,
            usedDice,
            state.opponentHighlight,
            gameResult,
        );
        const res = commitHumanMoveAction({
            currentPhase: currentGPhase,
            turnIndex: (state.matchLog?.length ?? 0) + 1,
            player: boardState.turn,
            dice: boardState.dice ?? [1, 1],
            boardBefore: state.moveHistory[0]?.board ?? boardState.board,
            movesPlayed: moves ?? state.moveHistory.flatMap((h) => (h.move ? [h.move] : [])),
            boardAfter: boardState.board,
            matchLog: state.matchLog ?? [],
            isGameOver: !!gameResult,
        });
        if (currentGPhase === 'HUMAN_READY_TO_COMMIT') {
            clearHumanTimers();
            dispatch({ type: 'COMMIT_HUMAN_TURN' });
        }
        return res;
    }, [phase, usedDice, state.opponentHighlight, state.matchLog, state.moveHistory, gameResult, boardState, clearHumanTimers, dispatch]);

    const replayFromLog = useCallback((entry: MatchLogEntry, showBefore?: boolean) => {
        return replayFromLogAction({ logEntry: entry, showBefore });
    }, []);

    const runAiTurn = useCallback((dice: [number, number], turnIndex?: number) => {
        return runAiTurnAction(
            {
                currentBoard: boardState.board,
                turnIndex: turnIndex ?? (state.matchLog?.length ?? 0) + 1,
                dice,
                difficulty: state.difficulty,
                rollDurationMs: getSpeedPreset(gameSpeedRef.current).T1_DICE_ROLL_ANIMATION_MS,
                previewDurationMs: getSpeedPreset(gameSpeedRef.current).T3_ARROW_PREVIEW_MS,
                isGameOver: !!gameResult,
            },
            {
                onPhaseChange: (p) => {
                    if (p === 'AI_TURN_ROLLING') {
                        dispatch({ type: 'OPPONENT_PREPARE_ROLL' });
                    } else if (p === 'AI_TURN_SHOWING_ARROWS') {
                        dispatch({
                            type: 'OPPONENT_START_TURN',
                            dice,
                            statusMessage: "L'ordinateur prépare son déplacement...",
                        });
                    }
                },
                onArrowsReady: (arrows) => {
                    dispatch({ type: 'OPPONENT_SHOW_ARROWS', arrows });
                },
                onApplyBoard: (board) => {
                    dispatch({ type: 'OPPONENT_FINISH_TURN', finalBoard: [...board], dice, moves: [] });
                },
                onLogEntryAdded: () => {},
            },
        );
    }, [boardState.board, state.matchLog?.length, state.difficulty, gameSpeedRef, gameResult, dispatch]);

    const undoMove = useCallback(() => {
        clearHumanTimers();
        dispatch({ type: 'UNDO_MOVE' });
    }, [clearHumanTimers, dispatch]);

    const rewindToLogTurn = useCallback((turnIndex?: number) => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        dispatch({ type: 'REWIND_TO_LOG_TURN', turnIndex });
        return true;
    }, [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, dispatch]);

    return {
        commitHumanMove,
        replayFromLog,
        runAiTurn,
        undoMove,
        rewindToLogTurn,
    };
}
