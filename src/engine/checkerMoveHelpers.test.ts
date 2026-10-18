import { describe, it, expect } from 'vitest';
import {
    getBestCheckerForDie,
    findSafestMoveForDie,
    evaluateSumOfDiceMove,
} from './checkerMoveHelpers';
import { createInitialState, X_BAR } from './backgammonEngine';

describe('checkerMoveHelpers', () => {
    it('getBestCheckerForDie returns null when targets is empty', () => {
        const board = createInitialState().board;
        const targets = new Map<number, number[]>();
        expect(getBestCheckerForDie(targets, board, 'X')).toBeNull();
    });

    it('getBestCheckerForDie prioritizes bar checkers', () => {
        const board = [...createInitialState().board];
        board[X_BAR] = 1; // 1 pion sur la barre pour X
        const targets = new Map<number, number[]>([
            [X_BAR, [21]],
            [24, [20]],
        ]);
        const best = getBestCheckerForDie(targets, board, 'X');
        expect(best).toBe(X_BAR);
    });

    it('findSafestMoveForDie returns null when no targets are present', () => {
        const board = createInitialState().board;
        const targets = new Map<number, number[]>();
        expect(findSafestMoveForDie(targets, board, 'X')).toBeNull();
    });

    it('findSafestMoveForDie picks the safest destination for selected checker', () => {
        const board = createInitialState().board;
        const targets = new Map<number, number[]>([
            [24, [21, 20]],
        ]);
        const move = findSafestMoveForDie(targets, board, 'X', 24);
        expect(move).toBeDefined();
        expect(move?.from).toBe(24);
    });

    it('evaluateSumOfDiceMove returns false for doubles', () => {
        const board = createInitialState().board;
        const result = evaluateSumOfDiceMove(24, [3, 3], board, 'X', [21], [21]);
        expect(result.isPossible).toBe(false);
    });
});
