// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
    DICE_ROLL_MIN_DURATION_MS,
    DICE_ROLL_MAX_DURATION_MS,
    DICE_ROLL_DEFAULT_DURATION_MS,
    clampDiceRollDuration,
    computeDieRollDurationForIndex,
    computeExponentialDiceDeceleration,
    useDiceAnimation,
} from './useDiceAnimation';

describe('useDiceAnimation (Audit 5/20 — Vitesse & Physique du Lancer de Dés)', () => {
    it('calibre strictement la durée de roulement entre 350ms et 420ms avec décélération exponentielle', () => {
        expect(DICE_ROLL_MIN_DURATION_MS).toBe(350);
        expect(DICE_ROLL_MAX_DURATION_MS).toBe(420);
        expect(DICE_ROLL_DEFAULT_DURATION_MS).toBeGreaterThanOrEqual(350);
        expect(DICE_ROLL_DEFAULT_DURATION_MS).toBeLessThanOrEqual(420);

        expect(clampDiceRollDuration(120)).toBe(350);
        expect(clampDiceRollDuration(385)).toBe(385);
        expect(clampDiceRollDuration(900)).toBe(420);

        for (let idx = 0; idx < 4; idx++) {
            const d = computeDieRollDurationForIndex(idx);
            expect(d).toBeGreaterThanOrEqual(350);
            expect(d).toBeLessThanOrEqual(420);
        }

        // Courbe de décélération exponentielle : 0 -> rapide (> 0.9 à mi-course) -> 1
        expect(computeExponentialDiceDeceleration(0)).toBe(0);
        expect(computeExponentialDiceDeceleration(0.5)).toBeGreaterThan(0.9);
        expect(computeExponentialDiceDeceleration(1)).toBeCloseTo(1, 6);
    });

    it('verrouille les clics sur les pions pendant les 385ms du roulement et synchronise l’impact sonore exactement à la pose', () => {
        vi.useFakeTimers();
        try {
            const onRollStartSound = vi.fn();
            const onSettleSound = vi.fn();

            const { result, rerender } = renderHook(
                ({ dice }: { dice: [number, number] | null }) =>
                    useDiceAnimation({
                        dice,
                        durationMs: 385,
                        onRollStartSound,
                        onSettleSound,
                    }),
                { initialProps: { dice: null as [number, number] | null } },
            );

            expect(result.current.isRolling).toBe(false);
            expect(result.current.areCheckerClicksLocked).toBe(false);

            // Transition null -> [6, 4] : début du roulement
            rerender({ dice: [6, 4] });
            expect(result.current.isRolling).toBe(true);
            expect(result.current.areCheckerClicksLocked).toBe(true);
            expect(onRollStartSound).toHaveBeenCalledTimes(1);
            expect(onSettleSound).not.toHaveBeenCalled();

            // À 384ms (< 385ms) : toujours en roulement, clics pions verrouillés, pas encore d'impact de pose
            act(() => {
                vi.advanceTimersByTime(384);
            });
            expect(result.current.isRolling).toBe(true);
            expect(result.current.areCheckerClicksLocked).toBe(true);
            expect(onSettleSound).not.toHaveBeenCalled();

            // À 385ms exactement : pose des dés sur le tapis -> impact sonore synchronisé + déverrouillage des pions
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(result.current.isRolling).toBe(false);
            expect(result.current.areCheckerClicksLocked).toBe(false);
            expect(onSettleSound).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });
});
