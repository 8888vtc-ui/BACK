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

    it('plays the highest die by default when clicking a checker with two distinct playable dice ([5, 2] or [2, 5])', () => {
        // Cas 1 : tirage [5, 2] -> le dé 0 (5) est le plus élevé
        const game52 = createMockGame();
        game52.dice = [5, 2];
        game52.leftDieTargets = new Map([[24, [19]]]);
        game52.rightDieTargets = new Map([[24, [22]]]);
        const currentTurnMovesRef = { current: [] };
        const multiplayer = {
            broadcastMovePlayed: vi.fn(),
            broadcastTurnFinished: vi.fn(),
        };

        const { result: res52 } = renderHook(() =>
            useCheckerInteractions({
                game: game52,
                isMultiplayerActive: false,
                multiplayer,
                currentTurnMovesRef,
            })
        );

        expect(res52.current.activeDie).toBe(0);
        act(() => {
            res52.current.handleCheckerClick(24);
        });
        expect(game52.playMove).toHaveBeenCalledWith(24, 19, 0);

        // Cas 2 : tirage [2, 5] -> le dé 1 (5) est le plus élevé
        const game25 = createMockGame();
        game25.dice = [2, 5];
        game25.leftDieTargets = new Map([[24, [22]]]);
        game25.rightDieTargets = new Map([[24, [19]]]);

        const { result: res25 } = renderHook(() =>
            useCheckerInteractions({
                game: game25,
                isMultiplayerActive: false,
                multiplayer,
                currentTurnMovesRef,
            })
        );

        expect(res25.current.activeDie).toBe(1);
        act(() => {
            res25.current.handleCheckerClick(24);
        });
        expect(game25.playMove).toHaveBeenCalledWith(24, 19, 1);
    });

    it('falls back automatically to the lower die when the highest die is blocked for the clicked checker', () => {
        const game = createMockGame();
        // Tirage [2, 5] : le 5 (dé 1) est bloqué pour le pion en 24, seul le 2 (dé 0 -> 22) est légal
        game.dice = [2, 5];
        game.leftDieTargets = new Map([[24, [22]]]);
        game.rightDieTargets = new Map([[13, [8]]]);

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

        expect(game.playMove).toHaveBeenCalledWith(24, 22, 0);
    });

    it('allows manual inversion via handleSwapDice or right-click to play the smaller die first', () => {
        const game = createMockGame();
        game.dice = [2, 5];
        game.leftDieTargets = new Map([[24, [22]]]);
        game.rightDieTargets = new Map([[24, [19]]]);
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

        // Clic droit (action secondaire) joue directement le plus petit dé (dé 0 : 24 -> 22)
        act(() => {
            result.current.handleCheckerRightClick(24);
        });
        expect(game.playMove).toHaveBeenCalledWith(24, 22, 0);

        // Ou inversion manuelle des dés puis clic gauche
        game.playMove.mockClear();
        act(() => {
            result.current.handleSwapDice();
        });
        expect(result.current.activeDie).toBe(0);

        act(() => {
            result.current.handleCheckerClick(24);
        });
        expect(game.playMove).toHaveBeenCalledWith(24, 22, 0);
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

    it('plays one-click move when preferred die was explicitly selected even with 2 destinations', () => {
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
            result.current.handleSwapDice();
        });

        act(() => {
            result.current.handleCheckerClick(24);
        });

        expect(game.playMove).toHaveBeenCalledWith(24, 23, 1);
    });
});
