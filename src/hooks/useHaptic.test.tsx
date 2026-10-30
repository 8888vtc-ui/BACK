// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHaptic } from './useHaptic';
import { useSoundManager } from './useSoundManager';
import { soundEngine } from '../lib/sound/soundEngine';
import { Capacitor } from '@capacitor/core';

describe('useHaptic & useSoundManager — Intégration Dossier #4', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('déclenche les séquences haptiques Web via useHaptic et annule avec cancelHaptics()', async () => {
        vi.spyOn(Capacitor, 'isPluginAvailable').mockReturnValue(false);
        const mockVibrate = vi.fn();
        vi.stubGlobal('navigator', { vibrate: mockVibrate });

        const { result } = renderHook(() => useHaptic());

        await act(async () => {
            await result.current.triggerHaptic('pickup');
        });
        expect(mockVibrate).toHaveBeenLastCalledWith(6);

        await act(async () => {
            await result.current.triggerHaptic('blotHit');
        });
        expect(mockVibrate).toHaveBeenLastCalledWith([22, 45, 35]);

        await act(async () => {
            await result.current.triggerHaptic('swapDice');
        });
        expect(mockVibrate).toHaveBeenLastCalledWith([8, 25, 8]);

        act(() => {
            result.current.cancelHaptics();
        });
        expect(mockVibrate).toHaveBeenLastCalledWith(0);
    });

    it('délègue playMove, playHit(pointIndex), playBearOff(checkersInTray) et playBrilliantMove à soundEngine', () => {
        const slideSpy = vi.spyOn(soundEngine, 'checkerSlideAndPlace').mockImplementation(() => {});
        const hitSpy = vi.spyOn(soundEngine, 'playCheckerHit').mockImplementation(() => {});
        const bearOffSpy = vi.spyOn(soundEngine, 'playBearOff').mockImplementation(() => {});
        const brilliantSpy = vi.spyOn(soundEngine, 'playBrilliantMove').mockImplementation(() => {});

        const { result } = renderHook(() => useSoundManager());

        act(() => {
            result.current.playMove();
            result.current.playHit(18);
            result.current.playBearOff?.(7);
            result.current.playBrilliantMove?.();
        });

        expect(slideSpy).toHaveBeenCalledTimes(1);
        expect(hitSpy).toHaveBeenCalledWith(18);
        expect(bearOffSpy).toHaveBeenCalledWith(7);
        expect(brilliantSpy).toHaveBeenCalledTimes(1);
    });
});
