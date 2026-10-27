/**
 * @file src/hooks/useGameActionDispatchers.ts
 * @description Dispatchers d'actions utilisateur et moteur pour useBackgammonGame (< 200 lignes, 0 any).
 */
import { useCallback, type MutableRefObject } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { AIDifficulty } from '../engine/aiHeuristics';
import type { GameAction, GamePhase } from './gameStateReducer';

export interface UseGameActionDispatchersParams {
    dispatch: (action: GameAction) => void;
    isCustomTestTiming: boolean;
    clearOpponentTimers: () => void;
    clearHumanTimers: () => void;
    opponentTurnInProgressRef: MutableRefObject<boolean>;
    resetTelemetry: () => void;
    humanPlayer: Player;
}

export function useGameActionDispatchers({
    dispatch,
    isCustomTestTiming,
    clearOpponentTimers,
    clearHumanTimers,
    opponentTurnInProgressRef,
    resetTelemetry,
    humanPlayer,
}: UseGameActionDispatchersParams) {
    const rollDice = useCallback((forcedDice?: [number, number]) => {
        clearHumanTimers();
        dispatch({
            type: 'ROLL_DICE',
            dice: forcedDice,
            deferBlockedTransition: !isCustomTestTiming,
        });
    }, [clearHumanTimers, isCustomTestTiming, dispatch]);

    const selectChecker = useCallback((point: number, die?: 0 | 1 | null) => {
        dispatch({ type: 'SELECT_CHECKER', point, die });
    }, [dispatch]);

    const deselect = useCallback(() => {
        dispatch({ type: 'DESELECT' });
    }, [dispatch]);

    const setSelectedDie = useCallback((die: 0 | 1) => {
        dispatch({ type: 'SET_SELECTED_DIE', die });
    }, [dispatch]);

    const moveChecker = useCallback((destination: number, from?: number, die?: 0 | 1) => {
        dispatch({
            type: 'MOVE_CHECKER',
            destination,
            from,
            die,
            deferCommit: !isCustomTestTiming,
        });
    }, [isCustomTestTiming, dispatch]);

    const playMove = useCallback((from: number, to: number, die?: 0 | 1) => {
        dispatch({
            type: 'PLAY_MOVE',
            from,
            to,
            die,
            deferCommit: !isCustomTestTiming,
        });
    }, [isCustomTestTiming, dispatch]);

    const offerDouble = useCallback(() => {
        dispatch({ type: 'OFFER_DOUBLE' });
    }, [dispatch]);

    const takeDouble = useCallback(() => {
        dispatch({ type: 'TAKE_DOUBLE' });
    }, [dispatch]);

    const passDouble = useCallback(() => {
        dispatch({ type: 'PASS_DOUBLE' });
    }, [dispatch]);

    const startNewGame = useCallback(() => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        dispatch({ type: 'START_NEW_GAME' });
    }, [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, dispatch]);

    const setDifficulty = useCallback((difficulty: AIDifficulty) => {
        dispatch({ type: 'SET_DIFFICULTY', difficulty });
    }, [dispatch]);

    const resetMatch = useCallback(() => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        resetTelemetry();
        dispatch({ type: 'RESET_MATCH' });
    }, [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, resetTelemetry, dispatch]);

    const startNewMatch = useCallback((newMatchLength: number, newDifficulty: AIDifficulty) => {
        clearOpponentTimers();
        clearHumanTimers();
        opponentTurnInProgressRef.current = false;
        resetTelemetry();
        dispatch({ type: 'NEW_MATCH', matchLength: newMatchLength, difficulty: newDifficulty });
    }, [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, resetTelemetry, dispatch]);

    const updateClientSeeds = useCallback((clientSeedA: string, clientSeedB?: string) => {
        dispatch({ type: 'SET_CLIENT_SEEDS', clientSeedA, clientSeedB });
    }, [dispatch]);

    const playOpponentTurn = useCallback((forcedDice?: [number, number]) => {
        dispatch({ type: 'PLAY_OPPONENT', dice: forcedDice });
    }, [dispatch]);

    const applyRemoteState = useCallback(
        (payload: {
            board: number[];
            dice?: [number, number] | null;
            turn?: Player;
            usedDice?: [boolean, boolean] | boolean[];
            phase?: GamePhase;
            cubeValue?: number;
            cubeOwner?: Player | null;
            scoreX?: number;
            scoreO?: number;
            crawford?: boolean;
            doublingOfferedBy?: Player | null;
        }) => {
            clearOpponentTimers();
            clearHumanTimers();
            opponentTurnInProgressRef.current = false;
            dispatch({ type: 'APPLY_REMOTE_STATE', ...payload });
        },
        [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, dispatch],
    );

    const resignGame = useCallback(
        (multiplier: 1 | 2 | 3 = 1, winner?: Player) => {
            clearOpponentTimers();
            clearHumanTimers();
            opponentTurnInProgressRef.current = false;
            dispatch({
                type: 'RESIGN_GAME',
                multiplier,
                winner: winner ?? (humanPlayer === 'X' ? 'O' : 'X'),
            });
        },
        [clearOpponentTimers, clearHumanTimers, opponentTurnInProgressRef, humanPlayer, dispatch],
    );

    return {
        rollDice,
        selectChecker,
        deselect,
        setSelectedDie,
        moveChecker,
        playMove,
        offerDouble,
        takeDouble,
        passDouble,
        startNewGame,
        setDifficulty,
        resetMatch,
        startNewMatch,
        updateClientSeeds,
        playOpponentTurn,
        applyRemoteState,
        resignGame,
    };
}
