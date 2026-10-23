// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, act, cleanup } from '@testing-library/react';
import { useFischerClock } from './useFischerClock';
import { FischerClockBadge } from '../components/hud/FischerClockBadge';
import type { Player } from '../engine/backgammonEngine';

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('useFischerClock & FischerClockBadge (Audit 15 / 20)', () => {
    it('bascule à une précision de 100ms sous 10s, affiche les dixièmes (8.4s) et déclenche le tic-tac sonore 1 fois/s', () => {
        vi.useFakeTimers();
        let fakeNow = 100_000;
        const onCriticalTick = vi.fn();
        const onFlagFall = vi.fn();

        const { result } = renderHook(() =>
            useFischerClock({
                config: { type: 'fischer', bankMs: 9_500, delaySeconds: 5 },
                activePlayer: 'X',
                onCriticalTick,
                onFlagFall,
                nowProvider: () => fakeNow,
            }),
        );

        // Sous 10s (9500ms) -> tickIntervalMs = 100ms, isCriticalX = true, formattedX = "9.5s"
        expect(result.current.tickIntervalMs).toBe(100);
        expect(result.current.isCriticalX).toBe(true);
        expect(result.current.formattedX).toBe('9.5s');
        expect(onCriticalTick).toHaveBeenCalledWith(10);

        // Avance de 1100ms -> 8400ms ("8.4s")
        act(() => {
            fakeNow += 1_100;
            vi.advanceTimersByTime(1_100);
        });

        expect(result.current.formattedX).toBe('8.4s');
        expect(onCriticalTick).toHaveBeenCalledWith(9);

        // Avance jusqu'à épuisement (0ms) -> chute de drapeau
        act(() => {
            fakeNow += 8_500;
            vi.advanceTimersByTime(8_500);
        });

        expect(result.current.isFlagFallen).toBe(true);
        expect(result.current.flagFallenPlayer).toBe('X');
        expect(onFlagFall).toHaveBeenCalledWith('X');
    });

    it('applique l’incrément Fischer sans saut lors du changement de tour', () => {
        vi.useFakeTimers();
        let fakeNow = 50_000;

        const { result, rerender } = renderHook(
            ({ active }: { active: Player }) =>
                useFischerClock({
                    config: { type: 'fischer', bankMs: 60_000, delaySeconds: 8 },
                    activePlayer: active,
                    nowProvider: () => fakeNow,
                }),
            { initialProps: { active: 'X' as Player } },
        );

        // X réfléchit pendant 3 secondes (60s -> 57s)
        act(() => {
            fakeNow += 3_000;
            vi.advanceTimersByTime(3_000);
        });
        expect(result.current.bankXMs).toBe(57_000);

        // Fin du tour de X -> X reçoit +8s d'incrément Fischer (57s + 8s = 65s = 01:05) sans saut
        act(() => {
            rerender({ active: 'O' });
        });
        expect(result.current.bankXMs).toBe(65_000);
        expect(result.current.formattedX).toBe('01:05');
    });

    it('affiche un flash rouge critique non-bloquant (pointer-events-none) dans FischerClockBadge', () => {
        const { getByTestId } = render(
            React.createElement(FischerClockBadge, {
                player: 'X',
                formattedTime: '6.2s',
                formattedDelay: null,
                isActiveTurn: true,
                isCritical: true,
            }),
        );

        const badge = getByTestId('fischer-clock-x');
        expect(badge.getAttribute('data-critical-flash')).toBe('true');
        expect(getByTestId('fischer-clock-x-time').textContent).toBe('6.2s');

        const redFlash = getByTestId('fischer-clock-x-red-flash');
        expect(redFlash.className).toContain('pointer-events-none');
    });
});
