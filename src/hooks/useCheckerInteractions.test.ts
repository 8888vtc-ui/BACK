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

    it('selects checker when multiple destinations are possible instead of forcing an arbitrary move', () => {
        const game = createMockGame();
        // Point 24 has targets in both left (21) and right (23)
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
            result.current.handleCheckerClick(24);
        });

        // Ne doit PAS jouer de coup forcé arbitraire
        expect(game.playMove).not.toHaveBeenCalled();
        // Doit sélectionner le pion pour laisser le joueur choisir sa destination
        expect(game.selectChecker).toHaveBeenCalledWith(24);
    });

    it('auto-plays directly when only 1 legal destination exists', () => {
        const game = createMockGame();
        // Point 8 has only 1 destination (5) on left die
        game.leftDieTargets = new Map([[8, [5]]]);
        game.rightDieTargets = new Map();

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
            result.current.handleCheckerClick(8);
        });

        // Doit jouer directement 8 -> 5 sans étape superflue
        expect(game.playMove).toHaveBeenCalledWith(8, 5, 0);
    });
});
