// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { X_BAR } from '../engine/backgammonEngine';
import { useBarReentry } from './useBarReentry';

describe('useBarReentry (Audit 3/20 — Ergonomie de Rentrée de Barre)', () => {
    it('verrouille les autres pions et illumine uniquement les points d’entrée légaux (19..24 pour X)', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        board[13] = 4;
        board[24] = -2; // Bloqué pour dé 1

        const leftDieTargets = new Map<number, number[]>();
        const rightDieTargets = new Map<number, number[]>([[X_BAR, [21]]]);

        const { result } = renderHook(() =>
            useBarReentry({
                board,
                player: 'X',
                dice: [1, 4],
                usedDice: [false, false],
                leftDieTargets,
                rightDieTargets,
                gamePhase: 'HUMAN_MOVING',
            }),
        );

        expect(result.current.isOnBar).toBe(true);
        expect(result.current.barCount).toBe(1);
        expect(result.current.areOtherCheckersLocked).toBe(true);
        expect(result.current.isPointLocked(13)).toBe(true);
        expect(Array.from(result.current.legalEntryPoints)).toEqual([21]);
        expect(result.current.isDanced).toBe(false);
        expect(result.current.dancedMessage).toBeNull();
    });

    it('affiche un message explicite et passe le tour automatiquement après 800ms en cas de Danse (Fanned)', () => {
        vi.useFakeTimers();
        try {
            const board = new Array<number>(26).fill(0);
            board[X_BAR] = 1;
            for (let pt = 19; pt <= 24; pt++) {
                board[pt] = -2; // Portes 19..24 fermées
            }

            const onAutoPassTurn = vi.fn();

            const { result } = renderHook(() =>
                useBarReentry({
                    board,
                    player: 'X',
                    dice: [3, 6],
                    usedDice: [false, false],
                    leftDieTargets: new Map(),
                    rightDieTargets: new Map(),
                    gamePhase: 'HUMAN_MOVING',
                    onAutoPassTurn,
                }),
            );

            expect(result.current.isDanced).toBe(true);
            expect(result.current.dancedMessage).toContain('Aucun coup possible');

            // À 799ms, le tour n'est pas encore passé
            act(() => {
                vi.advanceTimersByTime(799);
            });
            expect(onAutoPassTurn).not.toHaveBeenCalled();

            // À 800ms exactement, le tour passe automatiquement
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(onAutoPassTurn).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });
});
