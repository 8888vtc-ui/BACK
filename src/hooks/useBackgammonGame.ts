'use client';

import { useReducer, useMemo } from 'react';
import { Player, computeLegalTargets } from '../engine/backgammonEngine';
import {
    evaluateWin, scoreBoardForOpponent, scoreBoard0PlyNoisy, scoreBoard1Ply,
    scoreBoard2PlyForOpponent, selectBestOpponentSequence,
    type WinType, type GameResult, type AIDifficulty,
} from '../engine/aiHeuristics';
import type { GamePhase as StrictGamePhase, MatchLogEntry } from '../actions/types';
import { AUTO_CONFIRM_TURN_STORAGE_KEY } from './useTurnConfirmation';
import { useGameAutoConfirmPreference } from './useGameAutoConfirmPreference';
import { useGameTelemetryTracker } from './useGameTelemetryTracker';
import { useMatchProgressionState } from './useMatchProgressionState';
import { useGameActionDispatchers } from './useGameActionDispatchers';
import { useGameActionBridge } from './useGameActionBridge';
import { useGameSessionControl } from './useGameSessionControl';
import { useGameTurnOrchestrators } from './useGameTurnOrchestrators';
import {
    type GamePhase, type OpponentMoveArrow, type UseBackgammonGameOptions,
    type BackgammonGameState, type GameAction,
    createInitialGameState, backgammonGameReducer, gameReducer,
    annotateOpponentMoveHits, deriveStrictGamePhase,
} from './gameStateReducer';

export const AUTO_CONFIRM_TURN_DELAY_MS = 250;
export const BOT_FLIGHT_ESTIMATE_MS = 250;
export { AUTO_CONFIRM_TURN_STORAGE_KEY };
export {
    evaluateWin, scoreBoardForOpponent, scoreBoard0PlyNoisy, scoreBoard1Ply,
    scoreBoard2PlyForOpponent, selectBestOpponentSequence,
};
export type { WinType, GameResult, AIDifficulty, StrictGamePhase, MatchLogEntry };
export * from './gameStateReducer';

/**
 * Hook de jeu Backgammon : machine à états intégrée (< 200 lignes, 0 any).
 */
export function useBackgammonGame(options: UseBackgammonGameOptions = {}) {
    const {
        matchLength = 7, initialScoreX = 0, initialScoreO = 0, initialTurn = 'X',
        initialDifficulty = 'expert', autoOpponent = true, playerColor = 'X',
        onGameOver, locale = 'fr', autoConfirm, autoConfirmTurn: initialAutoConfirmTurn,
    } = options;

    const autoConfirmState = useGameAutoConfirmPreference({
        initialAutoConfirm: autoConfirm,
        initialAutoConfirmTurn,
        explicitAutoConfirmMode: options.autoConfirmMode,
    });

    const [state, dispatch] = useReducer(
        backgammonGameReducer,
        undefined,
        () => createInitialGameState(matchLength, initialScoreX, initialScoreO, initialTurn, autoOpponent, initialDifficulty),
    );

    const { boardState, phase, usedDice, selected, doublingOfferedBy, gameResult, difficulty } = state;
    const humanPlayer: Player = playerColor;
    const isHumanTurn = boardState.turn === humanPlayer;

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!boardState.dice || phase !== 'PLAYING_MOVES') {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
        return computeLegalTargets(boardState, boardState.dice, usedDice);
    }, [boardState, usedDice, phase]);

    const progression = useMatchProgressionState({
        matchLength,
        boardState,
        phase,
        crawfordAlreadyPlayed: state.crawfordAlreadyPlayed,
    });

    const session = useGameSessionControl({
        explicitGameSpeed: options.gameSpeed,
        onGameOver,
        provablyFairState: state.provablyFair,
        gameResult,
    });

    const boardStateRef = useMemo(() => ({ current: boardState }), [boardState]);
    const strictGamePhase = deriveStrictGamePhase(phase, usedDice, state.opponentHighlight, gameResult);

    const { moveTimingTracker, resetTelemetry } = useGameTelemetryTracker({
        phase,
        turn: boardState.turn,
        humanPlayer,
        dice: boardState.dice,
        matchLogLength: state.matchLog?.length ?? 0,
    });

    const isCustomTestTiming = options.opponentDelayMs !== undefined;
    const dispatchers = useGameActionDispatchers({
        dispatch,
        isCustomTestTiming,
        clearOpponentTimers: session.clearOpponentTimers,
        clearHumanTimers: session.clearHumanTimers,
        opponentTurnInProgressRef: session.opponentTurnInProgressRef,
        resetTelemetry,
        humanPlayer,
    });

    useGameTurnOrchestrators({
        state,
        dispatch,
        humanPlayer,
        strictGamePhase,
        autoConfirmTurn: autoConfirmState.autoConfirmTurn,
        autoConfirmMode: autoConfirmState.autoConfirmMode,
        setAutoConfirmTurn: autoConfirmState.setAutoConfirmTurn,
        isDMP: progression.isDMP,
        matchLength,
        options,
        locale,
        session,
        boardStateRef,
        dispatchers,
    });

    const bridge = useGameActionBridge({
        state,
        gameResult,
        dispatch,
        clearHumanTimers: session.clearHumanTimers,
        clearOpponentTimers: session.clearOpponentTimers,
        opponentTurnInProgressRef: session.opponentTurnInProgressRef,
        gameSpeedRef: session.gameSpeedRef,
    });

    return {
        state: boardState,
        phase,
        gamePhase: strictGamePhase,
        matchLog: state.matchLog ?? [],
        commitHumanMove: bridge.commitHumanMove,
        replayFromLog: bridge.replayFromLog,
        runAiTurn: bridge.runAiTurn,
        isAiThinking: phase === 'OPPONENT_THINKING' || (boardState.turn === 'O' && state.autoOpponent),
        humanPlayer,
        isHumanTurn,
        dice: boardState.dice,
        usedDice,
        leftDieTargets,
        rightDieTargets,
        selected,
        canDouble: progression.canDouble,
        isDMP: progression.isDMP,
        doublingOfferedBy,
        gameResult,
        isMatchOver: progression.isMatchOver,
        matchWinner: progression.matchWinner,
        isCrawfordNext: progression.isCrawfordNext,
        crawfordAlreadyPlayed: state.crawfordAlreadyPlayed,
        autoOpponent: state.autoOpponent,
        difficulty: state.difficulty,
        lastOpponentDice: state.lastOpponentDice,
        lastOpponentMoves: state.lastOpponentMoves,
        opponentHighlight: state.opponentHighlight,
        opponentStatusMessage: state.opponentStatusMessage,
        moveHistory: state.moveHistory,
        canUndo: state.moveHistory.length > 0 && phase === 'PLAYING_MOVES',
        isAwaitingConfirmation: strictGamePhase === 'HUMAN_READY_TO_COMMIT' && state.moveHistory.length > 0 && phase === 'PLAYING_MOVES',
        ...autoConfirmState,
        gameSpeed: session.gameSpeed,
        setGameSpeed: session.setGameSpeed,
        undoMove: bridge.undoMove,
        rewindToLogTurn: bridge.rewindToLogTurn,
        ...dispatchers,
        provablyFair: session.currentProvablyFair,
        serverSeedHash: session.currentProvablyFair.serverSeedHash,
        serverSeed: session.currentProvablyFair.isRevealed || phase === 'GAME_OVER' ? session.currentProvablyFair.serverSeed : null,
        clientSeed: session.currentProvablyFair.clientSeed,
        telemetry: moveTimingTracker.getMatchMetadata(),
        moveTimingTracker,
    };
}

export type UseBackgammonGameReturn = ReturnType<typeof useBackgammonGame>;
