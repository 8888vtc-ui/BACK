import { describe, it, expect } from 'vitest';
import { X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { computeShotExposure } from './shotExposure';

function makeBoard(xPoints: Record<number, number>, oPoints: Record<number, number>): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = 0;
    board[O_BAR] = 0;
    return board;
}

describe('computeShotExposure', () => {
    it("compte l'union des lancers et non la somme par blot", () => {
        // Blots X sur 5 et 6, un pion O sur 2 (distances 3 et 4).
        // Par blot : 13 + 14 = 27. Union réelle : 20 lancers contenant un 3 ou un 4
        // + 3 uniquement indirects (1-2, 2-1, 2-2) = 23.
        const board = makeBoard({ 5: 1, 6: 1, 13: 13 }, { 2: 1, 19: 14 });
        const exposure = computeShotExposure(board, 'X');
        expect(exposure.directRolls).toBe(20);
        expect(exposure.indirectRolls).toBe(3);
        expect(exposure.totalRolls).toBe(23);
        expect(exposure.hittingNumbers).toEqual([3, 4]);
        expect(exposure.duplicatedNumbers).toEqual([]);
    });

    it('détecte la duplication quand une face frappe deux blots', () => {
        // Pions O sur 2 et 3 : le 3 frappe 5 (depuis 2) ET 6 (depuis 3).
        const board = makeBoard({ 5: 1, 6: 1, 13: 13 }, { 2: 1, 3: 1, 19: 13 });
        const exposure = computeShotExposure(board, 'X');
        expect(exposure.duplicatedNumbers).toEqual([{ die: 3, blots: [5, 6] }]);
    });

    it("renvoie zéro sans blot", () => {
        const board = makeBoard({ 6: 5, 8: 3, 13: 5, 24: 2 }, { 1: 2, 12: 5, 17: 3, 19: 5 });
        const exposure = computeShotExposure(board, 'X');
        expect(exposure.totalRolls).toBe(0);
        expect(exposure.hittingNumbers).toEqual([]);
    });
});
