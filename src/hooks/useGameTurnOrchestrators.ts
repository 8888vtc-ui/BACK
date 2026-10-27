/**
 * @file src/hooks/useGameTurnOrchestrators.ts
 * @description Orchestration conjointe des timers humains, de l'IA adverse, du cube et du QA bridge (< 200 lignes, 0 any).
 */
import type { MutableRefObject } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { AIDifficulty } from '../engine/aiHeuristics';
import type { Locale } from '../lib/i18n/types';
import type { GameSpeed } from '../lib/gameFeel/speedPresets';
import type { ProvablyFairSessionState } from '../lib/crypto/provablyFairRng';
import type { AutoConfirmMode } from './useTurnConfirmation';
import type { GamePhase as StrictGamePhase } from '../actions/types';
import type {
    BackgammonGameState,
    GameAction,
    GamePhase,
    UseBackgammonGameOptions,
} from './gameStateReducer';
import { useHumanTurnTimer } from './useHumanTurnTimer';
import { useOpponentTurnOrchestrator } from './useOpponentTurnOrchestrator';
import { useOpponentCubeResponse } from './useOpponentCubeResponse';
import { useGameQaBridge } from './useGameQaBridge';
import type { useGameActionDispatchers } from './useGameActionDispatchers';

export interface UseGameTurnOrchestratorsParams {
    state: BackgammonGameState;
    dispatch: (action: GameAction) => void;
    humanPlayer: Player;
    strictGamePhase: StrictGamePhase;
    autoConfirmTurn: boolean;
    autoConfirmMode: AutoConfirmMode;
    setAutoConfirmTurn: (val: boolean) => void;
    isDMP: boolean;
    matchLength: number;
    options: UseBackgammonGameOptions;
    locale: Locale;
    session: {
        gameSpeedRef: MutableRefObject<GameSpeed>;
        provablyFairRef: MutableRefObject<ProvablyFairSessionState>;
        opponentTurnInProgressRef: MutableRefObject<boolean>;
        opponentTurnTokenRef: MutableRefObject<number>;
        opponentTimersRef: MutableRefObject<NodeJS.Timeout[]>;
        humanTimersRef: MutableRefObject<NodeJS.Timeout[]>;
        clearOpponentTimers: () => void;
        clearHumanTimers: () => void;
    };
    boardStateRef: { current: BackgammonGameState['boardState'] };
    dispatchers: ReturnType<typeof useGameActionDispatchers>;
}

export function useGameTurnOrchestrators({
    state,
    dispatch,
    humanPlayer,
    strictGamePhase,
    autoConfirmTurn,
    autoConfirmMode,
    setAutoConfirmTurn,
    isDMP,
    matchLength,
    options,
    locale,
    session,
    boardStateRef,
    dispatchers,
}: UseGameTurnOrchestratorsParams) {
    const { boardState, phase, difficulty, doublingOfferedBy, autoOpponent } = state;
    const isCustomTestTiming = options.opponentDelayMs !== undefined;

    useHumanTurnTimer({
        phase,
        boardState,
        humanPlayer,
        strictGamePhase,
        moveHistory: state.moveHistory,
        opponentStatusMessage: state.opponentStatusMessage,
        autoConfirmTurn,
        autoConfirmMode,
        isDMP,
        matchLength,
        clearHumanTimers: session.clearHumanTimers,
        humanTimersRef: session.humanTimersRef,
        dispatch,
    });

    useOpponentTurnOrchestrator({
        autoOpponent,
        boardState,
        phase,
        matchLength,
        difficulty,
        options,
        dispatch,
        locale,
        gameSpeedRef: session.gameSpeedRef,
        provablyFairRef: session.provablyFairRef,
        boardStateRef,
        opponentTurnInProgressRef: session.opponentTurnInProgressRef,
        opponentTurnTokenRef: session.opponentTurnTokenRef,
        opponentTimersRef: session.opponentTimersRef,
        clearOpponentTimers: session.clearOpponentTimers,
    });

    useOpponentCubeResponse({
        autoOpponent,
        phase,
        doublingOfferedBy,
        isCustomTestTiming,
        opponentDelayMs: options.opponentDelayMs ?? 400,
        boardState,
        difficulty,
        dispatch,
    });

    useGameQaBridge({
        state,
        dispatch,
        rollDice: dispatchers.rollDice,
        offerDouble: dispatchers.offerDouble,
        takeDouble: dispatchers.takeDouble,
        passDouble: dispatchers.passDouble,
        resignGame: dispatchers.resignGame,
        applyRemoteState: dispatchers.applyRemoteState,
        startNewGame: dispatchers.startNewGame,
        startNewMatch: dispatchers.startNewMatch,
        setAutoConfirmTurn,
    });
}
