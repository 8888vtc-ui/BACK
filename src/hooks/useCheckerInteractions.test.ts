// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckerInteractions } from './useCheckerInteractions';
import { createInitialState } from '../engine/backgammonEngine';

describe('useCheckerInteractions hook', () => {
    const createMockGame = () => {
        const initialState = createInitialState(7);
        return {
            state: initialState,
            phase: 'PLAYING_MOVES' as const,
            dice: [3, 1] as [number, number] | null,
            usedDice: [false, false] as [boolean, boolean],
            selected: null,
            leftDieTargets: new Map<number, number[]>([[24, [21]]]),
            rightDieTargets: new Map<number, number[]>([[24, [23]]]),
            playMove: vi.fn(),
            selectChecker: vi.fn(),
            setSelectedDie: vi.fn(),
            deselect: vi.fn(),
            moveChecker: vi.fn(),
            rollDice: vi.fn(),
            offerDouble: vi.fn(),
            canDouble: false,
        } as any;
    };

    it('initializes with activeDie based on preferred die', () => {
        const game = createMockGame();
        const currentTurnMovesRef = { current: [] };
        const multiplayer = {
            broadcastMovePlayed: vi.fn(),
            broadcastTurnFinished: vi.fn(),
        };

        const { result } = renderHook(() =>
            useCheckerInteractions({
                game,
                isMultiplayerActive: false,
                multiplayer,
                currentTurnMovesRef,
            })
        );

        expect(result.current.activeDie).toBe(0);
    });

    it('plays move when handlePlayMove is invoked', () => {
        const game = createMockGame();
        const currentTurnMovesRef = { current: [] };
        const multiplayer = {
            broadcastMovePlayed: vi.fn(),
            broadcastTurnFinished: vi.fn(),
        };

        const { result } = renderHook(() =>
            useCheckerInteractions({
                game,
                isMultiplayerActive: false,
                multiplayer,
                currentTurnMovesRef,
            })
        );

        act(() => {
            result.current.handlePlayMove(24, 21, 0);
        });

        expect(game.playMove).toHaveBeenCalledWith(24, 21, 0);
        expect(currentTurnMovesRef.current).toHaveLength(1);
    });
});
