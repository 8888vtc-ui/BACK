// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamePersistence } from './useGamePersistence';
import { createInitialState } from '../engine/backgammonEngine';

describe('useGamePersistence hook', () => {
    const createMockGame = () => {
        const initialState = createInitialState(7);
        return {
            state: initialState,
            difficulty: 'expert' as const,
            dice: null,
            lastOpponentDice: null,
            lastOpponentMoves: null,
            applyRemoteState: vi.fn(),
        } as any;
    };

    it('initializes gameId and empty turnsHistory', () => {
        const game = createMockGame();
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            })
        );

        expect(result.current.gameIdRef.current).toContain('game_');
        expect(result.current.turnsHistoryRef.current).toHaveLength(0);
        expect(result.current.latestGameAnalysis).toBeNull();
    });

    it('resets history on resetGameHistory', () => {
        const game = createMockGame();
        const t = (key: string) => key;

        const { result } = renderHook(() =>
            useGamePersistence({
                game,
                isMultiplayerActive: false,
                t,
            })
        );

        act(() => {
            result.current.turnsHistoryRef.current.push({} as any);
            result.current.resetGameHistory();
        });

        expect(result.current.turnsHistoryRef.current).toHaveLength(0);
        expect(result.current.latestGameAnalysis).toBeNull();
    });
});
