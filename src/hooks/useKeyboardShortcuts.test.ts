// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts hook', () => {
    it('handles Space key to roll dice', () => {
        const onRollDice = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({
                phase: 'WAITING_FOR_ROLL',
                turn: 'X',
                dice: null,
                canDouble: false,
                onRollDice,
                onSwapDice: vi.fn(),
                onOfferDouble: vi.fn(),
            })
        );

        const event = new KeyboardEvent('keydown', { key: ' ' });
        window.dispatchEvent(event);

        expect(onRollDice).toHaveBeenCalledTimes(1);
    });
});
