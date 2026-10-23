// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchBootstrap, type MatchBootstrapGame } from './useMatchBootstrap';
import type { RealtimeBroadcastAction } from '../features/multiplayer/types';

describe('useMatchBootstrap hook', () => {
    const mockGame: MatchBootstrapGame = {
        state: { board: new Array<number>(26).fill(0) },
        autoOpponent: false,
        applyRemoteState: vi.fn(),
        rollDice: vi.fn(),
        offerDouble: vi.fn(),
        takeDouble: vi.fn(),
        passDouble: vi.fn(),
    };

    it('route correctement les événements distants (dés, coup, fin de tour, videau)', () => {
        const { result } = renderHook(() => useMatchBootstrap(mockGame));

        // 1. Dés lancés par l'adversaire
        const diceAction: RealtimeBroadcastAction = {
            type: 'DICE_ROLLED',
            player: 'O',
            dice: [4, 2],
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(diceAction);
        });
        expect(mockGame.rollDice).toHaveBeenCalledWith([4, 2]);

        // 2. Déplacement de pion
        const moveAction: RealtimeBroadcastAction = {
            type: 'CHECKER_MOVED',
            player: 'O',
            move: { from: 13, to: 15 },
            board: [1, 2, 3],
            usedDice: [true, false],
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(moveAction);
        });
        expect(mockGame.applyRemoteState).toHaveBeenCalledWith({
            board: [1, 2, 3],
            usedDice: [true, false],
        });

        // 3. Fin de tour
        const turnAction: RealtimeBroadcastAction = {
            type: 'TURN_FINISHED',
            player: 'O',
            nextTurn: 'X',
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(turnAction);
        });
        expect(mockGame.applyRemoteState).toHaveBeenCalledWith(
            expect.objectContaining({
                turn: 'X',
                dice: null,
                usedDice: [false, false],
                phase: 'WAITING_FOR_ROLL',
            }),
        );

        // 4. Double offert
        const doubleOfferAction: RealtimeBroadcastAction = {
            type: 'DOUBLE_OFFERED',
            player: 'O',
            cubeValue: 2,
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(doubleOfferAction);
        });
        expect(mockGame.offerDouble).toHaveBeenCalled();

        // 5. Double accepté
        const doubleAcceptAction: RealtimeBroadcastAction = {
            type: 'DOUBLE_ACCEPTED',
            player: 'O',
            cubeValue: 2,
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(doubleAcceptAction);
        });
        expect(mockGame.takeDouble).toHaveBeenCalled();

        // 6. Double passé
        const doublePassAction: RealtimeBroadcastAction = {
            type: 'DOUBLE_PASSED',
            player: 'O',
            winner: 'X',
            timestamp: Date.now(),
        };
        act(() => {
            result.current.handleRemoteAction(doublePassAction);
        });
        expect(mockGame.passDouble).toHaveBeenCalled();
    });
});
