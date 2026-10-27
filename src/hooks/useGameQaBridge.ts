'use client';

/**
 * Pont d'inspection & contrôle QA / E2E Playwright exposé sur `window.__BG_QA__`.
 * Conforme à SCALABILITY.md (< 65 lignes).
 */

import { useEffect } from 'react';
import type { Player } from '../engine/backgammonEngine';
import type { AIDifficulty } from '../engine/aiHeuristics';
import type { BackgammonGameState, GameAction, GamePhase } from './gameStateReducer';

export interface UseGameQaBridgeParams {
    state: BackgammonGameState;
    dispatch: (action: GameAction) => void;
    rollDice: (dice?: [number, number]) => void;
    offerDouble: () => void;
    takeDouble: () => void;
    passDouble: () => void;
    resignGame: (multiplier?: 1 | 2 | 3, winner?: Player) => void;
    applyRemoteState: (payload: {
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
    }) => void;
    startNewGame: () => void;
    startNewMatch: (matchLength: number, difficulty: AIDifficulty) => void;
    setAutoConfirmTurn: (enabled: boolean) => void;
}

export function useGameQaBridge({
    state,
    dispatch,
    rollDice,
    offerDouble,
    takeDouble,
    passDouble,
    resignGame,
    applyRemoteState,
    startNewGame,
    startNewMatch,
    setAutoConfirmTurn,
}: UseGameQaBridgeParams): void {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qaTarget = window as unknown as {
            __BG_QA__?: {
                getState: () => BackgammonGameState;
                dispatch: (action: GameAction) => void;
                rollDice: (dice?: [number, number]) => void;
                offerDouble: () => void;
                takeDouble: () => void;
                passDouble: () => void;
                resignGame: (multiplier?: 1 | 2 | 3, winner?: Player) => void;
                applyRemoteState: typeof applyRemoteState;
                startNewGame: () => void;
                startNewMatch: (matchLength: number, difficulty: AIDifficulty) => void;
                setAutoConfirmTurn: (enabled: boolean) => void;
            };
        };
        qaTarget.__BG_QA__ = {
            getState: () => state,
            dispatch,
            rollDice,
            offerDouble,
            takeDouble,
            passDouble,
            resignGame,
            applyRemoteState,
            startNewGame,
            startNewMatch,
            setAutoConfirmTurn,
        };
    }, [
        state,
        dispatch,
        rollDice,
        offerDouble,
        takeDouble,
        passDouble,
        resignGame,
        applyRemoteState,
        startNewGame,
        startNewMatch,
        setAutoConfirmTurn,
    ]);
}
