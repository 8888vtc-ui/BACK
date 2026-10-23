// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { Player } from '../engine/backgammonEngine';
import { useMoveBuffer } from './useMoveBuffer';

describe('useMoveBuffer (Audit 6/20 — 0 Input-Drop à 5 clics/sec)', () => {
    it('garantit 0 input-drop à une cadence de 5 clics/seconde (1 clic toutes les 200ms sur un double)', () => {
        vi.useFakeTimers();
        try {
            const executedMoves: Array<{ from: number; to: number }> = [];

            const { result } = renderHook(() =>
                useMoveBuffer({
                    activePlayer: 'X',
                    gamePhase: 'HUMAN_MOVING',
                    intervalMs: 120,
                    maxAhead: 2,
                    onExecuteMove: (from, to) => {
                        executedMoves.push({ from, to });
                    },
                }),
            );

            const fourDoubleMoves = [
                { from: 24, to: 20 },
                { from: 20, to: 16 },
                { from: 13, to: 9 },
                { from: 13, to: 9 },
            ];

            // Simulation d'une rafale de 4 clics à 5 clics/seconde (toutes les 200ms)
            for (const mv of fourDoubleMoves) {
                act(() => {
                    const accepted = result.current.enqueueMove(mv.from, mv.to, 0);
                    expect(accepted).toBe(true);
                });
                act(() => {
                    vi.advanceTimersByTime(200);
                });
            }

            expect(executedMoves).toEqual(fourDoubleMoves);
            expect(result.current.snapshot.droppedCount).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it('enchaîne 2 pre-moves cliqués en < 20ms et les dépile à 120ms d’intervalle, ou purge si l’adversaire prend la main', () => {
        vi.useFakeTimers();
        try {
            const executedMoves: Array<{ from: number; to: number }> = [];

            const { result, rerender } = renderHook(
                ({ activePlayer }: { activePlayer: Player }) =>
                    useMoveBuffer({
                        activePlayer,
                        gamePhase: 'HUMAN_MOVING',
                        intervalMs: 120,
                        maxAhead: 2,
                        onExecuteMove: (from, to) => {
                            executedMoves.push({ from, to });
                        },
                    }),
                { initialProps: { activePlayer: 'X' as Player } },
            );

            // 3 clics quasi-simultanés (t = 0ms) : 1 exécuté immédiatement + 2 bufferisés
            act(() => {
                result.current.enqueueMove(24, 18, 0);
                result.current.enqueueMove(18, 12, 0);
                result.current.enqueueMove(13, 7, 0);
            });

            expect(executedMoves).toEqual([{ from: 24, to: 18 }]);
            expect(result.current.snapshot.items.length).toBe(2);

            // À t = 120ms : le 2e coup (18 -> 12) est dépilé et exécuté
            act(() => {
                vi.advanceTimersByTime(120);
            });
            expect(executedMoves).toEqual([
                { from: 24, to: 18 },
                { from: 18, to: 12 },
            ]);
            expect(result.current.snapshot.items.length).toBe(1);

            // Avant t = 240ms, l'adversaire ('O') prend le trait -> purge immédiate du 3e coup en attente
            rerender({ activePlayer: 'O' });
            expect(result.current.snapshot.items.length).toBe(0);
            expect(result.current.snapshot.lastPurgeReason).toBe('OPPONENT_TURN');

            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(executedMoves.length).toBe(2);
        } finally {
            vi.useRealTimers();
        }
    });
});
