import { describe, it, expect } from 'vitest';
import {
    getBestCheckerForDie,
    findSafestMoveForDie,
    evaluateSumOfDiceMove,
    findDirectMoveToDestination,
    findPortMove,
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

    it('evaluateSumOfDiceMove computes valid sum-of-dice move when single-die targets are open', () => {
        const board = createInitialState().board;
        // Sur [6, 5] à l'ouverture, le pion en 24 a leftDests=[18] et rightDests=[] (20 bloqué par O)
        // mais la case finale 24 - 11 = 13 est libre (+5 pions X) !
        const result = evaluateSumOfDiceMove(24, [6, 5], board, 'X', [18], []);
        expect(result.isPossible).toBe(true);
        expect(result.midDest).toBe(18);
        expect(result.sumDest).toBe(13);
    });

    it('findDirectMoveToDestination prioritizes bar entry and single-source target', () => {
        const left = new Map<number, number[]>([[X_BAR, [22]]]);
        const right = new Map<number, number[]>([[X_BAR, [20]]]);
        expect(findDirectMoveToDestination(22, 'X', left, right, 0)).toEqual({
            from: X_BAR,
            to: 22,
            die: 0,
        });
        expect(findDirectMoveToDestination(20, 'X', left, right, 0)).toEqual({
            from: X_BAR,
            to: 20,
            die: 1,
        });
    });

    it('findPortMove finds 2 checkers converging on an empty point to build a door', () => {
        const board = createInitialState().board;
        const left = new Map<number, number[]>([[8, [5]]]);
        const right = new Map<number, number[]>([[6, [5]]]);
        const port = findPortMove(5, [3, 1], board, 'X', left, right);
        expect(port).toEqual({
            from1: 8,
            from2: 6,
            die1: 0,
            die2: 1,
        });
    });
});
