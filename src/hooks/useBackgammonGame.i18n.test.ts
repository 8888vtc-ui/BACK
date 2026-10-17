// @vitest-environment jsdom

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgammonGame } from './useBackgammonGame';
import { O_BAR, O_OFF } from '../engine/backgammonEngine';

describe('useBackgammonGame - i18n Status Messages (FR & EN)', () => {
    it('génère des messages de statut localisés en ANGLAIS (lancers, coups, sortie)', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'O',
                    autoOpponent: true,
                    opponentDelayMs: 400,
                    stepDelayMs: 400,
                    forcedOpponentDice: [3, 3],
                    initialDifficulty: 'beginner',
                    locale: 'en',
                }),
            );

            // 1. Lancer de double en anglais
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.opponentStatusMessage).toBe(
                'Black (AI) rolled a double 🎲🎲 [3-3] (4 moves)!',
            );

            // 2. Premier coup séquentiel en anglais
            act(() => {
                vi.advanceTimersByTime(400);
            });

            expect(result.current.opponentStatusMessage).toMatch(/^Move 1\/4: Black moves /);

            // 3. Deuxième coup
            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(result.current.opponentStatusMessage).toMatch(/^Move 2\/4: Black moves /);

            // 4. Fin de tour
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(result.current.state.turn).toBe('X');
            expect(result.current.phase).toBe('WAITING_FOR_ROLL');
            expect(result.current.opponentStatusMessage).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('génère des messages de statut localisés en FRANÇAIS (lancers, coups, sortie)', () => {
        vi.useFakeTimers();

        try {
            const { result } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'O',
                    autoOpponent: true,
                    opponentDelayMs: 400,
                    stepDelayMs: 400,
                    forcedOpponentDice: [5, 2],
                    initialDifficulty: 'beginner',
                    locale: 'fr',
                }),
            );

            // 1. Lancer régulier en français
            expect(result.current.state.turn).toBe('O');
            expect(result.current.phase).toBe('OPPONENT_THINKING');
            expect(result.current.opponentStatusMessage).toBe(
                'Noir (IA) a lancé les dés 🎲🎲 [5-2]',
            );

            // 2. Déplacement en français
            act(() => {
                vi.advanceTimersByTime(400);
            });
            expect(result.current.opponentStatusMessage).toMatch(/^Coup 1\/2 : Noir déplace /);

            // 3. Fin de tour
            act(() => {
                vi.advanceTimersByTime(2000);
            });
            expect(result.current.state.turn).toBe('X');
            expect(result.current.opponentStatusMessage).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('affiche le message de blocage approprié en anglais et en français quand l’adversaire est fanned', () => {
        vi.useFakeTimers();

        try {
            // Configuration où O est sur la barre et toutes les portes d'entrée de X (19..24 pour O) sont fermées par X
            const blockedBoard = new Array<number>(26).fill(0);
            blockedBoard[O_BAR] = -1; // 1 pion O sur la barre
            blockedBoard[1] = 2;
            blockedBoard[2] = 2;
            blockedBoard[3] = 2;
            blockedBoard[4] = 2;
            blockedBoard[5] = 2;
            blockedBoard[6] = 2; // Jan intérieur de X complètement fermé (portes 1..6)
            blockedBoard[10] = -14;

            // Test EN
            const { result: hookEn } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'X',
                    autoOpponent: true,
                    opponentDelayMs: 300,
                    stepDelayMs: 300,
                    forcedOpponentDice: [6, 5],
                    locale: 'en',
                }),
            );

            act(() => {
                hookEn.current.applyRemoteState({
                    board: blockedBoard,
                    turn: 'O',
                    phase: 'OPPONENT_THINKING',
                });
            });

            expect(hookEn.current.opponentStatusMessage).toContain('Black (AI) is blocked (no legal moves)');

            // Test FR
            const { result: hookFr } = renderHook(() =>
                useBackgammonGame({
                    initialTurn: 'X',
                    autoOpponent: true,
                    opponentDelayMs: 300,
                    stepDelayMs: 300,
                    forcedOpponentDice: [6, 5],
                    locale: 'fr',
                }),
            );

            act(() => {
                hookFr.current.applyRemoteState({
                    board: blockedBoard,
                    turn: 'O',
                    phase: 'OPPONENT_THINKING',
                });
            });

            expect(hookFr.current.opponentStatusMessage).toContain('Noir (IA) est bloqué (aucun coup possible)');
        } finally {
            vi.useRealTimers();
        }
    });
});
