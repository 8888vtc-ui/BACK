// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameModals } from './useGameModals';

describe('useGameModals hook', () => {
    it('manages modal visibility transitions correctly', () => {
        const { result } = renderHook(() => useGameModals());

        expect(result.current.isMatchmakingModalOpen).toBe(false);

        act(() => {
            result.current.openMatchmaking();
        });
        expect(result.current.isMatchmakingModalOpen).toBe(true);

        act(() => {
            result.current.closeMatchmaking();
        });
        expect(result.current.isMatchmakingModalOpen).toBe(false);

        act(() => {
            result.current.openOpeningBook('opening_123');
        });
        expect(result.current.isOpeningBookModalOpen).toBe(true);
        expect(result.current.selectedOpeningIdForModal).toBe('opening_123');
    });
});
