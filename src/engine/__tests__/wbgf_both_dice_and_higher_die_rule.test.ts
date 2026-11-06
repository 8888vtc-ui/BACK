import { describe, it, expect } from 'vitest';
import {
    BoardState,
    Player,
    generateLegalMoves,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../backgammonEngine';

function makeBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

function makeState(board: number[], turn: Player = 'X'): BoardState {
    return {
        board,
        turn,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

describe('WBGF Official Rules: Mandatory Both Dice & Higher Die (20 Trap Positions)', () => {
    describe('Règle 1 : Obligation de jouer les 2 dés si une séquence le permet (10 Pièges)', () => {
        it('Pos 1: X en 24, dés [6, 1] — 18 bloqué, 23 et 17 ouverts => force 2 dés (24/23 23/17)', () => {
            const board = makeBoard({ 24: 1, 1: 14 }, { 18: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 1]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 24, to: 23 });
                expect(seq.moves[1]).toEqual({ from: 23, to: 17 });
            }
        });

        it('Pos 2: X en 24, dés [6, 4] — 18 bloqué, 20 et 14 ouverts => force 2 dés (24/20 20/14)', () => {
            const board = makeBoard({ 24: 1, 1: 14 }, { 18: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 4]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 24, to: 20 });
                expect(seq.moves[1]).toEqual({ from: 20, to: 14 });
            }
        });

        it('Pos 3: X en 24, dés [5, 3] — 19 bloqué, 21 et 16 ouverts => force 2 dés (24/21 21/16)', () => {
            const board = makeBoard({ 24: 1, 1: 14 }, { 19: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [5, 3]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 24, to: 21 });
                expect(seq.moves[1]).toEqual({ from: 21, to: 16 });
            }
        });

        it('Pos 4: X en 20, dés [4, 2] — 16 bloqué, 18 et 14 ouverts => force 2 dés (20/18 18/14)', () => {
            const board = makeBoard({ 20: 1, 1: 14 }, { 16: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [4, 2]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 20, to: 18 });
                expect(seq.moves[1]).toEqual({ from: 18, to: 14 });
            }
        });

        it('Pos 5: X en 15, dés [3, 2] — 12 bloqué, 13 et 10 ouverts => force 2 dés (15/13 13/10)', () => {
            const board = makeBoard({ 15: 1, 1: 14 }, { 12: 2, 6: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [3, 2]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 15, to: 13 });
                expect(seq.moves[1]).toEqual({ from: 13, to: 10 });
            }
        });

        it('Pos 6: O en 1, dés [6, 1] — 7 bloqué, 2 et 8 ouverts => force 2 dés pour O (1/2 2/8)', () => {
            const board = makeBoard({ 7: 2, 13: 13 }, { 1: 1, 24: 14 });
            const moves = generateLegalMoves(makeState(board, 'O'), [6, 1]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 1, to: 2 });
                expect(seq.moves[1]).toEqual({ from: 2, to: 8 });
            }
        });

        it('Pos 7: O en 1, dés [5, 3] — 6 bloqué, 4 et 9 ouverts => force 2 dés pour O (1/4 4/9)', () => {
            const board = makeBoard({ 6: 2, 13: 13 }, { 1: 1, 24: 14 });
            const moves = generateLegalMoves(makeState(board, 'O'), [5, 3]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 1, to: 4 });
                expect(seq.moves[1]).toEqual({ from: 4, to: 9 });
            }
        });

        it('Pos 8: X à la barre, dés [6, 2] — 19 bloqué, 23 et 17 ouverts => force 2 dés (bar/23 23/17)', () => {
            const board = makeBoard({ 1: 14 }, { 19: 2, 12: 13 }, 1, 0);
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 2]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: X_BAR, to: 23 });
                expect(seq.moves[1]).toEqual({ from: 23, to: 17 });
            }
        });

        it('Pos 9: O à la barre, dés [5, 1] — 5 bloqué, 1 et 6 ouverts => force 2 dés pour O (bar/1 1/6)', () => {
            const board = makeBoard({ 5: 2, 13: 13 }, { 24: 14 }, 0, 1);
            const moves = generateLegalMoves(makeState(board, 'O'), [5, 1]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: O_BAR, to: 1 });
                expect(seq.moves[1]).toEqual({ from: 1, to: 6 });
            }
        });

        it('Pos 10: X en bear-off, pions en 6 et 4, case 1 bloquée, dés [5, 3] => force 2 dés (6/3 4/off)', () => {
            const board = makeBoard({ 6: 1, 4: 1, 2: 13 }, { 1: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [5, 3]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0]).toEqual({ from: 6, to: 3 });
                expect(seq.moves[1]).toEqual({ from: 4, to: X_OFF });
            }
        });
    });

    describe('Règle 2 : Obligation de jouer le plus grand dé si un seul est jouable (10 Pièges)', () => {
        it('Pos 11: X en 24, dés [5, 3] — 21 et 19 ouverts, 16 bloqué => obligation dé 5 (24/19)', () => {
            const board = makeBoard({ 24: 1, 1: 14 }, { 16: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [5, 3]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 24, to: 19 }]);
        });

        it('Pos 12: X en 24, dés [6, 4] — 20 et 18 ouverts, 14 bloqué => obligation dé 6 (24/18)', () => {
            const board = makeBoard({ 24: 1, 1: 14 }, { 14: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 4]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 24, to: 18 }]);
        });

        it('Pos 13: X en 20, dés [6, 2] — 18 et 14 ouverts, 12 bloqué => obligation dé 6 (20/14)', () => {
            const board = makeBoard({ 20: 1, 1: 14 }, { 12: 2, 6: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 2]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 20, to: 14 }]);
        });

        it('Pos 14: X en 15, dés [4, 1] — 14 et 11 ouverts, 10 bloqué => obligation dé 4 (15/11)', () => {
            const board = makeBoard({ 15: 1, 1: 14 }, { 10: 2, 6: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [4, 1]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 15, to: 11 }]);
        });

        it('Pos 15: X en 12, dés [3, 2] — 10 et 9 ouverts, 7 bloqué => obligation dé 3 (12/9)', () => {
            const board = makeBoard({ 12: 1, 1: 14 }, { 7: 2, 6: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [3, 2]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 12, to: 9 }]);
        });

        it('Pos 16: O en 1, dés [5, 3] — 4 et 6 ouverts, 9 bloqué => obligation dé 5 pour O (1/6)', () => {
            const board = makeBoard({ 9: 2, 13: 13 }, { 1: 1, 24: 14 });
            const moves = generateLegalMoves(makeState(board, 'O'), [5, 3]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 1, to: 6 }]);
        });

        it('Pos 17: O en 1, dés [6, 2] — 3 et 7 ouverts, 9 bloqué => obligation dé 6 pour O (1/7)', () => {
            const board = makeBoard({ 9: 2, 13: 13 }, { 1: 1, 24: 14 });
            const moves = generateLegalMoves(makeState(board, 'O'), [6, 2]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 1, to: 7 }]);
        });

        it('Pos 18: X à la barre, dés [6, 2] — 23 et 19 ouverts, 17 bloqué => obligation dé 6 (bar/19)', () => {
            const board = makeBoard({ 1: 14 }, { 17: 2, 12: 13 }, 1, 0);
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 2]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: X_BAR, to: 19 }]);
        });

        it('Pos 19: O à la barre, dés [5, 3] — 3 et 5 ouverts, 8 bloqué => obligation dé 5 pour O (bar/5)', () => {
            const board = makeBoard({ 8: 2, 13: 13 }, { 24: 14 }, 0, 1);
            const moves = generateLegalMoves(makeState(board, 'O'), [5, 3]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: O_BAR, to: 5 }]);
        });

        it('Pos 20: X en 6, dés [4, 1] — 1 bloqué, 5 et 2 ouverts, 5-4=1 et 2-1=1 bloqués => obligation dé 4 (6/2)', () => {
            const board = makeBoard({ 6: 1, 2: 14 }, { 1: 2, 12: 13 });
            const moves = generateLegalMoves(makeState(board, 'X'), [4, 1]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toEqual([{ from: 6, to: 2 }]);
        });
    });
});

