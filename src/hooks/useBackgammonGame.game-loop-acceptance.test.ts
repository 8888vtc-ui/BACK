// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgammonGame, GameResult } from './useBackgammonGame';

describe('useBackgammonGame - Boucle de jeu complète et zéro blocage', () => {
    it('enchaîne parfaitement : joueur roule → joue → commit automatique → IA répond visiblement → main revient', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    matchLength: 5,
                    autoOpponent: true,
                    opponentDelayMs: 400,
                    stepDelayMs: 300,
                    forcedOpponentDice: [3, 1],
                }),
            );

            // 1. Initialement : en attente du lancer de dé du joueur
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.state.turn).toBe('X');
            expect(result.current.dice).toBeNull();

            // 2. Le joueur lance les dés (par exemple [3, 1])
            act(() => {
                result.current.rollDice([3, 1]);
            });

            expect(result.current.phase).toBe('PLAYING_MOVES');
            expect(result.current.dice).toEqual([3, 1]);
            expect(result.current.usedDice).toEqual([false, false]);

            // 3. Coup 1 : pion 8 -> 5 avec le dé 3 (index 0)
            act(() => {
                result.current.selectChecker(8, 0);
                result.current.moveChecker(5);
            });

            // Le premier dé est consommé, le second reste à jouer
            expect(result.current.phase).toBe('PLAYING_MOVES');
            expect(result.current.usedDice[0]).toBe(true);
            expect(result.current.usedDice[1]).toBe(false);

            // 4. Coup 2 : pion 6 -> 5 avec le dé 1 (index 1) -> fermeture du jan
            act(() => {
                result.current.selectChecker(6, 1);
                result.current.moveChecker(5);
            });

            // 5. Commit automatique du tour : tous les dés sont joués !
            // La phase bascule immédiatement vers OPPONENT_THINKING et le tour passe à 'O'
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.state.turn).toBe('O');
            expect(result.current.usedDice).toEqual([false, false]);

            // 6. L'IA commence à réfléchir et lance ses dés
            act(() => {
                vi.advanceTimersByTime(400); // opponentDelayMs
            });

            expect(result.current.lastOpponentDice).toEqual([3, 1]);
            expect(result.current.opponentStatusMessage).toBeTruthy();

            // 7. L'IA déplace ses pions étape par étape avec mise à jour du highlight
            act(() => {
                vi.advanceTimersByTime(300); // 1er coup
            });
            expect(result.current.opponentHighlight).not.toBeNull();

            act(() => {
                vi.advanceTimersByTime(300); // 2nd coup
            });

            // 8. L'IA finalise son tour : absorption et retour de la main
            act(() => {
                vi.advanceTimersByTime(700); // tFinish
            });

            // 9. La main revient à X ! Phase WAITING_FOR_ROLL, aucun blocage
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.dice).toBeNull();
            expect(result.current.lastOpponentMoves).not.toBeNull();
            expect(result.current.lastOpponentMoves!.length).toBeGreaterThan(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it('gère une victoire directe de X en bear-off et transmet le résultat onGameOver sans blocage', () => {
        let gameOverCalled: GameResult | null = null;

        const { result } = renderHook(() =>
            useBackgammonGame({
                matchLength: 3,
                autoOpponent: true,
                opponentDelayMs: 0,
                onGameOver: (res: GameResult) => {
                    gameOverCalled = res;
                },
            }),
        );

        // Position de bear-off : 1 pion X restant sur la flèche 1
        const almostDoneBoard = new Array<number>(26).fill(0);
        almostDoneBoard[1] = 1; // 1 pion X
        almostDoneBoard[20] = -5; // O

        act(() => {
            result.current.applyRemoteState({
                board: almostDoneBoard,
                turn: 'X',
                phase: 'WAITING_FOR_ROLL',
                dice: null,
                usedDice: [false, false],
            });
        });

        // X roule [2, 1]
        act(() => {
            result.current.rollDice([2, 1]);
        });

        expect(result.current.phase).toBe('PLAYING_MOVES');

        // X sort son dernier pion (point 1 -> 0)
        act(() => {
            result.current.selectChecker(1, 0);
            result.current.moveChecker(0);
        });

        // Immédiatement : GAME_OVER
        expect(result.current.phase).toBe('GAME_OVER');
        expect(result.current.gameResult).not.toBeNull();
        expect(result.current.gameResult?.winner).toBe('X');
        expect(gameOverCalled).not.toBeNull();
        const finalRes = gameOverCalled as GameResult | null;
        expect(finalRes?.winner).toBe('X');
        expect(result.current.state.scoreX).toBeGreaterThanOrEqual(1);
    });

    it('ne bloque JAMAIS l’état OPPONENT_THINKING : un tour complet Humain → IA → Humain se termine toujours', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    matchLength: 5,
                    autoOpponent: true,
                    opponentDelayMs: 800,
                    stepDelayMs: 400,
                    forcedOpponentDice: [6, 5],
                    initialDifficulty: 'beginner',
                }),
            );

            // 1. Le joueur X lance les dés et joue un coup complet.
            act(() => {
                result.current.rollDice([3, 1]);
            });
            expect(result.current.phase).toBe('PLAYING_MOVES');

            act(() => {
                result.current.selectChecker(8, 0);
                result.current.moveChecker(5);
                result.current.selectChecker(6, 1);
                result.current.moveChecker(5);
            });

            // 2. Le tour bascule vers l'IA (OPPONENT_THINKING).
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.state.turn).toBe('O');

            // 3. On avance largement le temps (bien au-delà de tous les timers IA).
            act(() => {
                vi.advanceTimersByTime(10000);
            });

            // 4. L'IA doit avoir rendu la main : plus jamais bloqué en OPPONENT_THINKING.
            expect(result.current.phase).not.toBe('OPPONENT_THINKING');
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.dice).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });
});
