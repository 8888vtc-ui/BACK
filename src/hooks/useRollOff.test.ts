// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRollOff } from './useRollOff';

describe('useRollOff hook', () => {
    it('manages roll off lifecycle', () => {
        const { result } = renderHook(() => useRollOff());

        expect(result.current.rollOffDone).toBe(false);
        expect(result.current.rollOff.winner).toBeNull();

        act(() => {
            result.current.handleRollOff();
        });

        // Apres le roll-off, des dés ont été tirés
        expect(result.current.rollOff.xDie).toBeGreaterThanOrEqual(1);
        expect(result.current.rollOff.oDie).toBeGreaterThanOrEqual(1);
    });

    it('resets roll off state when resetRollOff is called', () => {
        const { result } = renderHook(() => useRollOff());

        act(() => {
            result.current.handleRollOff();
        });

        act(() => {
            result.current.resetRollOff();
        });

        expect(result.current.rollOffDone).toBe(false);
        expect(result.current.rollOff.xDie).toBeNull();
        expect(result.current.rollOff.oDie).toBeNull();
        expect(result.current.rollOff.winner).toBeNull();
    });
});

