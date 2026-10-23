import { describe, it, expect } from 'vitest';
import { O_BAR } from './backgammonEngine';
import {
    createTurnHistoryStack,
    pushTurnSubMove,
    undoLastSubMove,
    undoEntireTurn,
    isReverseClickOnLastMovedChecker,
    lockTurnHistory,
} from './turnHistory';

describe('turnHistory (Audit 7/20 — Système Undo Pas-à-Pas & Restauration de Blot)', () => {
    it('annule pas-à-pas (dé par dé) et remet en place un blot adverse frappé depuis la barre centrale', () => {
        let stack = createTurnHistoryStack();

        const board0 = new Array<number>(26).fill(0);
        board0[13] = 2;
        board0[10] = -1; // Blot adverse en 10

        const board1 = [...board0];
        board1[13] = 1;
        board1[10] = 1; // X frappe en 10
        board1[O_BAR] = -1; // Le pion de O est sur la barre

        const board2 = [...board1];
        board2[10] = 0;
        board2[6] = 1; // X continue de 10 vers 6

        // 1er sous-coup (frappe en 10 avec dé 0)
        stack = pushTurnSubMove(stack, {
            boardBefore: board0,
            boardAfter: board1,
            usedDiceBefore: [false, false],
            move: { from: 13, to: 10, dieIndex: 0 },
        });
        expect(stack.steps[0].wasHit).toBe(true);

        // 2e sous-coup (10 -> 6 avec dé 1)
        stack = pushTurnSubMove(stack, {
            boardBefore: board1,
            boardAfter: board2,
            usedDiceBefore: [true, false],
            move: { from: 10, to: 6, dieIndex: 1 },
        });

        // Détection du clic inverse sur le dernier pion déplacé (point 6)
        expect(isReverseClickOnLastMovedChecker(stack, 6)).toBe(true);
        expect(isReverseClickOnLastMovedChecker(stack, 10)).toBe(false);

        // Undo du 2e sous-coup : réanime le dé 1, le blot adverse reste sur la barre (état board1)
        const step1Undo = undoLastSubMove(stack, [true, true]);
        expect(step1Undo.reanimatedDieIndex).toBe(1);
        expect(step1Undo.restored?.boardBefore[10]).toBe(1);
        expect(step1Undo.restored?.boardBefore[O_BAR]).toBe(-1);
        stack = step1Undo.nextStack;

        // Undo du 1er sous-coup : réanime le dé 0 et remet le blot adverse de la barre vers le point 10 !
        const step2Undo = undoLastSubMove(stack, [true, false]);
        expect(step2Undo.reanimatedDieIndex).toBe(0);
        expect(step2Undo.restored?.boardBefore[10]).toBe(-1);
        expect(step2Undo.restored?.boardBefore[O_BAR]).toBe(0);
    });

    it('permet d’annuler tout le tour d’un coup et verrouille définitivement l’historique après validation', () => {
        let stack = createTurnHistoryStack();
        const b0 = new Array<number>(26).fill(0);
        b0[24] = 2;

        stack = pushTurnSubMove(stack, {
            boardBefore: b0,
            usedDiceBefore: [false, false],
            move: { from: 24, to: 20, dieIndex: 0 },
        });
        stack = pushTurnSubMove(stack, {
            boardBefore: new Array<number>(26).fill(0),
            usedDiceBefore: [true, false],
            move: { from: 20, to: 15, dieIndex: 1 },
        });

        const fullUndo = undoEntireTurn(stack);
        expect(fullUndo.initialEntry?.boardBefore[24]).toBe(2);
        expect(fullUndo.nextStack.steps.length).toBe(0);

        // Verrouillage définitif à la fin du tour
        const locked = lockTurnHistory(stack);
        expect(locked.isLocked).toBe(true);
        expect(undoLastSubMove(locked, [true, true]).restored).toBeNull();
    });
});
