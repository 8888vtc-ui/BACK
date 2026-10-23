// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, cleanup } from '@testing-library/react';
import { useForcedMoveAutoPlay } from './useForcedMoveAutoPlay';
import Board from '../components/board/Board';
import { createInitialState } from '../engine/backgammonEngine';

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

describe('useForcedMoveAutoPlay hook & Board Forced Move Pulsation (Audit 13 / 20)', () => {
    it('exécute automatiquement le coup forcé unique après 300ms lorsque autoPlayEnabled est actif', () => {
        vi.useFakeTimers();
        const onPlayMove = vi.fn();

        const { result } = renderHook(() =>
            useForcedMoveAutoPlay({
                phase: 'PLAYING_MOVES',
                turn: 'X',
                dice: [3, 1],
                leftDieTargets: new Map([[24, [21]]]),
                rightDieTargets: new Map(),
                onPlayMove,
            }),
        );

        expect(result.current.isForcedMove).toBe(true);
        expect(result.current.highlightOrigin).toBe(24);
        expect(result.current.highlightDestination).toBe(21);
        expect(onPlayMove).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(onPlayMove).toHaveBeenCalledWith(24, 21, 0);

        vi.useRealTimers();
    });

    it('n’exécute pas automatiquement le coup forcé si autoPlayEnabled === false, tout en exposant les cibles à faire pulser', () => {
        vi.useFakeTimers();
        const onPlayMove = vi.fn();

        const { result } = renderHook(() =>
            useForcedMoveAutoPlay({
                phase: 'HUMAN_MOVING',
                turn: 'X',
                dice: [4, 4],
                leftDieTargets: new Map([[13, [9]]]),
                rightDieTargets: new Map([[13, [9]]]),
                onPlayMove,
                autoPlayEnabled: false,
            }),
        );

        expect(result.current.isForcedMove).toBe(true);
        expect(result.current.highlightOrigin).toBe(13);
        expect(result.current.highlightDestination).toBe(9);

        vi.advanceTimersByTime(1000);
        expect(onPlayMove).not.toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('fait pulser simultanément la flèche de départ (data-forced-origin) et la destination (ghost-checker) sur le plateau', () => {
        const base = createInitialState(7);
        const state = {
            ...base,
            dice: [3, 1] as [number, number],
            turn: 'X' as const,
        };

        const { getByTestId } = render(
            React.createElement(Board, {
                state,
                leftDieTargets: new Map([[24, [21]]]),
                rightDieTargets: new Map(),
                selectedPoint: null,
                selectedDie: null,
                usedDice: [false, false],
                onCheckerClick: vi.fn(),
                onCheckerRightClick: vi.fn(),
                onDestinationClick: vi.fn(),
                gamePhase: 'HUMAN_MOVING',
            }),
        );

        expect(getByTestId('point-triangle-24').getAttribute('data-forced-origin')).toBe('true');
        expect(getByTestId('ghost-checker-21')).toBeTruthy();
        expect(getByTestId('ghost-checker-21').textContent).toBe('3');
    });
});
