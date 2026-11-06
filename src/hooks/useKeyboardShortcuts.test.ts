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

    it('handles Tab and S keys to swap dice', () => {
        const onSwapDice = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({
                phase: 'CHECKER_PLAY',
                turn: 'X',
                dice: [5, 3],
                canDouble: false,
                onRollDice: vi.fn(),
                onSwapDice,
                onOfferDouble: vi.fn(),
            })
        );

        // Tab
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        expect(onSwapDice).toHaveBeenCalledTimes(1);

        // S
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
        expect(onSwapDice).toHaveBeenCalledTimes(2);

        // Shift+S or S uppercase
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'S' }));
        expect(onSwapDice).toHaveBeenCalledTimes(3);
    });

    it('handles U, Backspace and Ctrl+Z keys to undo move', () => {
        const onUndo = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({
                phase: 'CHECKER_PLAY',
                turn: 'X',
                dice: [5, 3],
                canDouble: false,
                canUndo: true,
                onRollDice: vi.fn(),
                onSwapDice: vi.fn(),
                onOfferDouble: vi.fn(),
                onUndo,
            })
        );

        // U
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'u' }));
        expect(onUndo).toHaveBeenCalledTimes(1);

        // Backspace
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
        expect(onUndo).toHaveBeenCalledTimes(2);

        // Ctrl+Z
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
        expect(onUndo).toHaveBeenCalledTimes(3);
    });

    it('ignores shortcuts when user is typing in an input element', () => {
        const onSwapDice = vi.fn();
        const onUndo = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({
                phase: 'CHECKER_PLAY',
                turn: 'X',
                dice: [5, 3],
                canDouble: false,
                canUndo: true,
                onRollDice: vi.fn(),
                onSwapDice,
                onOfferDouble: vi.fn(),
                onUndo,
            })
        );

        const input = document.createElement('input');
        document.body.appendChild(input);

        const event = new KeyboardEvent('keydown', { key: 's', bubbles: true });
        Object.defineProperty(event, 'target', { value: input });
        window.dispatchEvent(event);

        expect(onSwapDice).not.toHaveBeenCalled();
        document.body.removeChild(input);
    });
});
