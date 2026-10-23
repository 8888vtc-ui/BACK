// @vitest-environment jsdom
/**
 * Tests du hook useMobileTouchControls & MobileThumbZoneBar (Audit 2 & Audit 16 / 20).
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, act, fireEvent, cleanup } from '@testing-library/react';
import { createInitialState, X_BAR } from '../engine/backgammonEngine';
import {
    useMobileTouchControls,
    shouldPreventSystemEdgeSwipe,
    getThumbZoneGestureProtectionStyle,
    type MobileGameView,
} from './useMobileTouchControls';
import { MobileThumbZoneBar } from '../components/board/MobileThumbZoneBar';

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

function createMockGame(overrides: Partial<MobileGameView> = {}): MobileGameView {
    return {
        leftDieTargets: new Map<number, number[]>(),
        rightDieTargets: new Map<number, number[]>(),
        state: createInitialState(),
        selected: null,
        ...overrides,
    };
}

describe('useMobileTouchControls — Tap-to-Move, Target Preview & Thumb Zone (Audit 2 & 16 / 20)', () => {
    it('joue le dé actif (destination la plus sûre) au tap quand un seul dé joue depuis ce point', () => {
        const game = createMockGame({
            leftDieTargets: new Map([[8, [5, 4]]]),
            rightDieTargets: new Map(),
        });
        const onPlayMove = vi.fn();
        const onSwapDice = vi.fn();

        const { result } = renderHook(() =>
            useMobileTouchControls({ game, onPlayMove, activeDie: 0, onSwapDice }),
        );

        act(() => {
            result.current.handleTapPoint(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, expect.any(Number), 0);
    });

    it('repli sur l\'autre dé quand le dé actif n\'a pas de destination', () => {
        const game = createMockGame({
            leftDieTargets: new Map(),
            rightDieTargets: new Map([[8, [6]]]),
        });
        const onPlayMove = vi.fn();
        const onSwapDice = vi.fn();

        const { result } = renderHook(() =>
            useMobileTouchControls({ game, onPlayMove, activeDie: 0, onSwapDice }),
        );

        act(() => {
            result.current.handleTapPoint(8);
        });

        expect(onPlayMove).toHaveBeenCalledWith(8, 6, 1);
    });

    it('prévisualise les cibles fantômes au 1er tap quand les 2 dés offrent 2 destinations distinctes, puis joue au 2e tap', () => {
        const onPlayMove = vi.fn();
        const onSelectChecker = vi.fn();
        const onSwapDice = vi.fn();

        const gameUnselected = createMockGame({
            leftDieTargets: new Map([[13, [7]]]),
            rightDieTargets: new Map([[13, [12]]]),
            selected: null,
        });

        const { result: res1 } = renderHook(() =>
            useMobileTouchControls({
                game: gameUnselected,
                onPlayMove,
                onSelectChecker,
                activeDie: 0,
                onSwapDice,
            }),
        );

        act(() => {
            res1.current.handleTapPoint(13);
        });

        expect(onSelectChecker).toHaveBeenCalledWith(13);
        expect(onPlayMove).not.toHaveBeenCalled();

        // 2e tap alors que le point 13 est déjà sélectionné -> joue le dé actif
        const gameSelected = createMockGame({
            leftDieTargets: new Map([[13, [7]]]),
            rightDieTargets: new Map([[13, [12]]]),
            selected: { point: 13, die: null },
        });

        const { result: res2 } = renderHook(() =>
            useMobileTouchControls({
                game: gameSelected,
                onPlayMove,
                onSelectChecker,
                activeDie: 0,
                onSwapDice,
            }),
        );

        act(() => {
            res2.current.handleTapPoint(13);
        });

        expect(onPlayMove).toHaveBeenCalledWith(13, 7, 0);
    });

    it('exécute immédiatement le déplacement lors d’un tap direct sur l’une des 2 destinations surbrillées', () => {
        const onPlayMove = vi.fn();
        const onSelectChecker = vi.fn();
        const onSwapDice = vi.fn();

        const gameSelected = createMockGame({
            leftDieTargets: new Map([[13, [7]]]),
            rightDieTargets: new Map([[13, [10]]]),
            selected: { point: 13, die: null },
        });

        const { result } = renderHook(() =>
            useMobileTouchControls({
                game: gameSelected,
                onPlayMove,
                onSelectChecker,
                activeDie: 0,
                onSwapDice,
            }),
        );

        act(() => {
            result.current.handleTapPoint(10);
        });

        expect(onPlayMove).toHaveBeenCalledWith(13, 10, 1);
    });

    it('priorise la sortie de la barre lors d’un tap sur le point d’entrée du jan adverse', () => {
        const stateWithBar = createInitialState();
        stateWithBar.board[X_BAR] = 1;
        const onPlayMove = vi.fn();

        const game = createMockGame({
            state: stateWithBar,
            leftDieTargets: new Map([[X_BAR, [22]]]),
            rightDieTargets: new Map([[X_BAR, [20]]]),
        });

        const { result } = renderHook(() =>
            useMobileTouchControls({
                game,
                onPlayMove,
                activeDie: 0,
                onSwapDice: vi.fn(),
            }),
        );

        act(() => {
            result.current.handleTapPoint(20);
        });

        expect(onPlayMove).toHaveBeenCalledWith(X_BAR, 20, 1);
    });

    it('inverse l\'ordre des dés au tap sur la paire', () => {
        const game = createMockGame();
        const onPlayMove = vi.fn();
        const onSwapDice = vi.fn();

        const { result } = renderHook(() =>
            useMobileTouchControls({ game, onPlayMove, activeDie: 0, onSwapDice }),
        );

        act(() => {
            result.current.handleTapDice();
        });

        expect(onSwapDice).toHaveBeenCalled();
    });

    it('Audit 16/20 : gère la commutation Droitier / Gaucher, la prévention des gestes bords système et la barre Thumb Zone', () => {
        expect(shouldPreventSystemEdgeSwipe(12, 390)).toBe(true);
        expect(shouldPreventSystemEdgeSwipe(380, 390)).toBe(true);
        expect(shouldPreventSystemEdgeSwipe(195, 390)).toBe(false);

        const gestureStyle = getThumbZoneGestureProtectionStyle(true);
        expect(gestureStyle.touchAction).toBe('none');
        expect(gestureStyle.overscrollBehavior).toBe('none');

        const onRoll = vi.fn();
        const onConfirm = vi.fn();
        const onUndo = vi.fn();

        const { getByTestId } = render(
            React.createElement(MobileThumbZoneBar, {
                canRoll: true,
                canConfirm: false,
                canUndo: true,
                canDouble: true,
                canSwapDice: true,
                onRoll,
                onConfirm,
                onUndo,
                onOfferDouble: vi.fn(),
                onSwapDice: vi.fn(),
            }),
        );

        const bar = getByTestId('mobile-thumb-zone-bar');
        expect(bar.getAttribute('data-thumb-zone')).toBe('bottom-quarter');
        expect(bar.getAttribute('data-handedness')).toBe('right');
        expect(bar.className).toContain('flex-row');

        // Commutation Droitier -> Gaucher
        fireEvent.click(getByTestId('btn-toggle-handedness'));
        expect(bar.getAttribute('data-handedness')).toBe('left');
        expect(bar.className).toContain('flex-row-reverse');

        // Action primaire Lancer et secondaire Annuler
        fireEvent.click(getByTestId('btn-thumb-roll'));
        expect(onRoll).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('btn-thumb-undo'));
        expect(onUndo).toHaveBeenCalledTimes(1);
    });
});
