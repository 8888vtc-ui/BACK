// @vitest-environment jsdom
/**
 * Tests du hook useDesktopControls (One-Click TMG).
 *
 * Vérifie que :
 * 1. Le clic gauche joue le dé préféré (défaut 0, ou 1 après inversion des dés).
 * 2. Le clic droit joue le second dé (`1 - preferredDie`).
 * 3. Le repli sur l'autre dé fonctionne quand le dé prioritaire n'a pas de destination.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createInitialState } from '../engine/backgammonEngine';
import { useDesktopControls } from './useDesktopControls';

function createMockGame(overrides: Partial<any> = {}) {
    return {
        leftDieTargets: new Map<number, number[]>(),
        rightDieTargets: new Map<number, number[]>(),
        state: createInitialState(),
        dice: [3, 1] as [number, number] | null,
        ...overrides,
    };
}

describe('useDesktopControls — One-Click', () => {
    it('joue le dé 1 (destination la plus sûre) au clic gauche', () => {
        const game = createMockGame({
            leftDieTargets: new Map([[8, [5, 4]]]), // pion 8 -> destinations 5 et 4
            rightDieTargets: new Map(),
        });
        const onPlayMove = vi.fn();

        const { result } = renderHook(() => useDesktopControls({ game, onPlayMove }));

        act(() => {
            result.current.handleOneClick(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, expect.any(Number), 0);
    });

    it('joue le dé préféré 1 au clic gauche après inversion des dés (preferredDie = 1)', () => {
        const game = createMockGame({
            leftDieTargets: new Map([[8, [5]]]),
            rightDieTargets: new Map([[8, [7]]]),
        });
        const onPlayMove = vi.fn();

        const { result } = renderHook(() =>
            useDesktopControls({ game, onPlayMove, preferredDie: 1 }),
        );

        act(() => {
            result.current.handleOneClick(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, 7, 1);
    });

    it('joue le dé 2 (destination la plus sûre) au clic droit', () => {
        const game = createMockGame({
            leftDieTargets: new Map(),
            rightDieTargets: new Map([[8, [6, 5]]]),
        });
        const onPlayMove = vi.fn();

        const { result } = renderHook(() => useDesktopControls({ game, onPlayMove }));

        act(() => {
            result.current.handleOneRightClick(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, expect.any(Number), 1);
    });

    it("repli sur le dé 2 quand le dé 1 n'a pas de destination (clic gauche)", () => {
        const game = createMockGame({
            leftDieTargets: new Map(),
            rightDieTargets: new Map([[8, [6]]]),
        });
        const onPlayMove = vi.fn();

        const { result } = renderHook(() => useDesktopControls({ game, onPlayMove }));

        act(() => {
            result.current.handleOneClick(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, 6, 1);
    });

    it('ne joue rien si aucune destination', () => {
        const game = createMockGame();
        const onPlayMove = vi.fn();

        const { result } = renderHook(() => useDesktopControls({ game, onPlayMove }));

        act(() => {
            result.current.handleOneClick(8);
        });

        expect(onPlayMove).not.toHaveBeenCalled();
    });

    it('smart-click porte : joue les 2 pions pour faire la porte', () => {
        const game = createMockGame({
            dice: [3, 1] as [number, number],
            leftDieTargets: new Map([[8, [5]]]),   // pion 8 -> 5 (dé 3)
            rightDieTargets: new Map([[6, [5]]]),  // pion 6 -> 5 (dé 1)
        });
        const onPlayMove = vi.fn();

        const { result } = renderHook(() => useDesktopControls({ game, onPlayMove }));

        act(() => {
            result.current.handlePortClick(5);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, 5, 0);
        expect(onPlayMove).toHaveBeenCalledWith(6, 5, 1);
    });
});
