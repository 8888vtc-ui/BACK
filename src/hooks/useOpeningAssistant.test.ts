// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOpeningAssistant } from './useOpeningAssistant';
import { createInitialState } from '../engine/backgammonEngine';

describe('useOpeningAssistant hook', () => {
    const createMockGame = () => ({
        state: createInitialState(7),
        phase: 'PLAYING_MOVES' as const,
        dice: [3, 1] as [number, number] | null,
        usedDice: [false, false] as [boolean, boolean],
        applyRemoteState: vi.fn(),
    } as any);

    it('detects 3-1 opening and toggles highlight', () => {
        const game = createMockGame();
        const currentTurnMovesRef = { current: [] };
        const multiplayer = {
            broadcastMovePlayed: vi.fn(),
            broadcastTurnFinished: vi.fn(),
        };

        const { result } = renderHook(() =>
            useOpeningAssistant({
                game,
                isMultiplayerActive: false,
                multiplayer,
                currentTurnMovesRef,
                historyLength: 0,
            })
        );

        expect(result.current.openingEntry).not.toBeNull();
        expect(result.current.isOpeningHighlightActive).toBe(true);

        act(() => {
            result.current.toggleOpeningHighlight();
        });
        expect(result.current.isOpeningHighlightActive).toBe(false);

        act(() => {
            result.current.dismissOpening();
        });
        expect(result.current.isOpeningDismissed).toBe(true);
        expect(result.current.openingEntry).toBeNull();
    });
});
