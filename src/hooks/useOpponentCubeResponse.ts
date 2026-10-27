'use client';

/**
 * Hook de réponse automatique de l'IA adverse lors d'une offre de double (Take / Pass).
 * Interroge Open Sage Cloud Run en priorité, avec repli déterministe local Janowski.
 * Conforme à SCALABILITY.md (< 80 lignes).
 */

import { useEffect } from 'react';
import type { BoardState, Player } from '../engine/backgammonEngine';
import type { AIDifficulty } from '../engine/aiHeuristics';
import { evaluateBoard, shouldTakeDouble } from '../lib/engine/evaluator';
import { evaluateBotCubeWithBgsage } from '../lib/engine/bgsageClient';
import type { GamePhase, GameAction } from './gameStateReducer';

export interface UseOpponentCubeResponseOptions {
    autoOpponent: boolean;
    phase: GamePhase;
    doublingOfferedBy: Player | null;
    isCustomTestTiming: boolean;
    opponentDelayMs: number;
    boardState: BoardState;
    difficulty: AIDifficulty;
    dispatch: (action: GameAction) => void;
}

export function useOpponentCubeResponse({
    autoOpponent,
    phase,
    doublingOfferedBy,
    isCustomTestTiming,
    opponentDelayMs,
    boardState,
    difficulty,
    dispatch,
}: UseOpponentCubeResponseOptions): void {
    useEffect(() => {
        if (!autoOpponent) return;
        if (phase === 'DOUBLING_OFFERED' && doublingOfferedBy === 'X') {
            const cubeDelay = isCustomTestTiming ? opponentDelayMs : 500;
            let cancelled = false;
            const timer = setTimeout(async () => {
                if (!isCustomTestTiming) {
                    try {
                        const doublerState: BoardState = {
                            ...boardState,
                            turn: 'X',
                            dice: null,
                        };
                        const sageCube = await evaluateBotCubeWithBgsage(doublerState, difficulty, 2000);
                        if (!cancelled && sageCube) {
                            if (sageCube.shouldTake) {
                                dispatch({ type: 'TAKE_DOUBLE' });
                            } else {
                                dispatch({ type: 'PASS_DOUBLE' });
                            }
                            return;
                        }
                    } catch {
                        // Repli local si bgsage est indisponible
                    }
                }

                if (cancelled) return;
                const iaState: BoardState = {
                    ...boardState,
                    turn: 'O',
                    dice: null,
                };
                const iaEval = evaluateBoard(iaState, 2);
                if (shouldTakeDouble(iaEval.cubelessEquity)) {
                    dispatch({ type: 'TAKE_DOUBLE' });
                } else {
                    dispatch({ type: 'PASS_DOUBLE' });
                }
            }, cubeDelay);

            return () => {
                cancelled = true;
                clearTimeout(timer);
            };
        }
    }, [phase, doublingOfferedBy, autoOpponent, opponentDelayMs, isCustomTestTiming, boardState, difficulty, dispatch]);
}
