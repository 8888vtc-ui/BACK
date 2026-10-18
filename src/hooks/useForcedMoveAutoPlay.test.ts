// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useForcedMoveAutoPlay } from './useForcedMoveAutoPlay';

describe('useForcedMoveAutoPlay hook', () => {
    it('schedules move when there is exactly one legal move', () => {
        vi.useFakeTimers();
        const onPlayMove = vi.fn();

        renderHook(() =>
            useForcedMoveAutoPlay({
                phase: 'PLAYING_MOVES',
                turn: 'X',
                dice: [3, 1],
                leftDieTargets: new Map([[24, [21]]]),
                rightDieTargets: new Map(),
                onPlayMove,
            })
        );

        expect(onPlayMove).not.toHaveBeenCalled();

        vi.advanceTimersByTime(600);
        expect(onPlayMove).toHaveBeenCalledWith(24, 21, 0);

        vi.useRealTimers();
    });
});
