'use client';

/**
 * Sous-hook d'orchestration asynchrone du tour Bot IA (`src/hooks/useOpponentTurnOrchestrator.ts`).
 *
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md, <= 200 lignes).
 */

import { useEffect, type MutableRefObject } from 'react';
import type { BoardState } from '../engine/backgammonEngine';
import type { Locale } from '../lib/i18n/types';
import type { AIDifficulty } from '../engine/aiHeuristics';
import type { GameSpeed } from '../lib/gameFeel/speedPresets';
import type {
    GameAction,
    GamePhase,
    UseBackgammonGameOptions,
} from './gameStateReducer';
import { canOpponentDouble } from './orchestrators/opponentCubeDecision';
import { executeOpponentTurn, BOT_FLIGHT_ESTIMATE_MS } from './orchestrators/opponentTurnExecution';

export { BOT_FLIGHT_ESTIMATE_MS };

export interface UseOpponentTurnOrchestratorParams {
    readonly autoOpponent: boolean;
    readonly boardState: BoardState;
    readonly phase: GamePhase;
    readonly matchLength: number;
    readonly difficulty: AIDifficulty;
    readonly options: UseBackgammonGameOptions;
    readonly dispatch: (action: GameAction) => void;
    readonly locale: Locale;
    readonly gameSpeedRef: MutableRefObject<GameSpeed> | { readonly current: GameSpeed };
    readonly provablyFairRef: MutableRefObject<{
        serverSeed: string;
        clientSeed: string;
        nonce: number;
    }> | { readonly current: { serverSeed: string; clientSeed: string; nonce: number } };
    readonly boardStateRef: MutableRefObject<BoardState> | { readonly current: BoardState };
    readonly opponentTurnInProgressRef: MutableRefObject<boolean>;
    readonly opponentTurnTokenRef: MutableRefObject<number>;
    readonly opponentTimersRef: MutableRefObject<NodeJS.Timeout[]>;
    readonly clearOpponentTimers: () => void;
}

export function useOpponentTurnOrchestrator({
    autoOpponent,
    boardState,
    phase,
    matchLength,
    difficulty,
    options,
    dispatch,
    locale,
    gameSpeedRef,
    provablyFairRef,
    boardStateRef,
    opponentTurnInProgressRef,
    opponentTurnTokenRef,
    opponentTimersRef,
    clearOpponentTimers,
}: UseOpponentTurnOrchestratorParams): void {
    const {
        opponentDelayMs = 400,
        stepDelayMs = 250,
        arrowPreviewMs = 250,
        forcedOpponentDice,
    } = options;

    useEffect(() => {
        if (!autoOpponent) return;

        if (boardState.turn !== 'O' || phase !== 'OPPONENT_THINKING') {
            opponentTurnInProgressRef.current = false;
            clearOpponentTimers();
            return;
        }

        if (opponentTurnInProgressRef.current) return;

        const isCustomTestTiming = options.opponentDelayMs !== undefined;
        const canIADouble = canOpponentDouble(boardState, matchLength);

        if (opponentDelayMs === 0) {
            dispatch({ type: 'PLAY_OPPONENT', dice: forcedOpponentDice });
            return;
        }

        opponentTurnInProgressRef.current = true;
        clearOpponentTimers();

        if (!isCustomTestTiming) {
            dispatch({
                type: 'OPPONENT_PREPARE_ROLL',
                statusMessage: locale === 'en' ? 'Black (AI) is rolling the dice...' : "L'ordinateur lance les dés...",
            });
        }

        const currentTurnToken = opponentTurnTokenRef.current;

        const runCycle = (yieldOffsetMs: number) => {
            void executeOpponentTurn({
                yieldOffsetMs,
                canIADouble,
                forcedOpponentDice,
                isCustomTestTiming,
                opponentDelayMs,
                stepDelayMs,
                difficulty,
                locale,
                dispatch,
                gameSpeedRef,
                provablyFairRef,
                boardStateRef,
                opponentTurnInProgressRef,
                opponentTurnTokenRef,
                currentTurnToken,
                opponentTimersRef,
                clearOpponentTimers,
            });
        };

        if (isCustomTestTiming) {
            runCycle(0);
        } else {
            const tYield = setTimeout(() => runCycle(16), 16);
            opponentTimersRef.current.push(tYield);
        }

        return () => {
            if (boardStateRef.current.turn !== 'O') {
                clearOpponentTimers();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boardState.turn, phase, difficulty, autoOpponent, opponentDelayMs, stepDelayMs, arrowPreviewMs, forcedOpponentDice, locale]);
}
