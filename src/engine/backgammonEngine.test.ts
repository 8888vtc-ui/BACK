import { describe, it, expect } from 'vitest';
import {
    BoardState,
    Player,
    MoveSequence,
    createInitialState,
    parseXGID,
    serializeXGID,
    generateLegalMoves,
    computeLegalTargets,
    applyMove,
    pipCount,
    borneOffCount,
    X_BAR,
    O_BAR,
    evaluateMoveSafety,
    getSafestDestination,
} from './backgammonEngine';

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

function hasMove(results: MoveSequence[], from: number, to: number): boolean {
    return results.some((r) => r.moves.some((m) => m.from === from && m.to === to));
}

describe('createInitialState', () => {
    it("produit la position d'ouverture standard", () => {
        const s = createInitialState();
        expect(s.board[1]).toBe(-2);
        expect(s.board[6]).toBe(5);
        expect(s.board[8]).toBe(3);
        expect(s.board[12]).toBe(-5);
        expect(s.board[13]).toBe(5);
        expect(s.board[17]).toBe(-3);
        expect(s.board[19]).toBe(-5);
        expect(s.board[24]).toBe(2);
        expect(s.board[X_BAR]).toBe(0);
        expect(s.board[O_BAR]).toBe(0);
        expect(s.turn).toBe('X');
        expect(s.cubeValue).toBe(1);
        expect(s.cubeOwner).toBeNull();
        expect(s.scoreX).toBe(0);
        expect(s.scoreO).toBe(0);
        expect(s.crawford).toBe(false);
    });
});

describe('pipCount', () => {
    it("vaut 167/167 à l'ouverture", () => {
        expect(pipCount(createInitialState().board)).toEqual({ X: 167, O: 167 });
    });

    it('compte les pions sur la barre', () => {
        const board = makeBoard({ 6: 14 }, { 24: 15 }, 1, 0);
        expect(pipCount(board)).toEqual({ X: 25 + 14 * 6, O: 15 });
    });
});

describe('XGID', () => {
    const EXAMPLE = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10';

    it('parse le format standard', () => {
        const s = parseXGID(EXAMPLE);
        expect(s.board[1]).toBe(-2);
        expect(s.board[6]).toBe(5);
        expect(s.board[8]).toBe(3);
        expect(s.board[12]).toBe(-5);
        expect(s.board[13]).toBe(5);
        expect(s.board[17]).toBe(-3);
        expect(s.board[19]).toBe(-5);
        expect(s.board[24]).toBe(2);
        expect(s.board[X_BAR]).toBe(0);
        expect(s.board[O_BAR]).toBe(0);
        expect(s.turn).toBe('X');
        expect(s.cubeOwner).toBeNull();
        expect(s.cubeValue).toBe(1);
        expect(s.dice).toEqual([4, 2]);
        expect(s.matchLength).toBe(10);
    });

    it("sérialise la position d'ouverture", () => {
        const s = createInitialState(10);
        s.dice = [4, 2];
        expect(serializeXGID(s)).toBe(EXAMPLE);
    });

    it('round-trip sans perte', () => {
        expect(serializeXGID(parseXGID(EXAMPLE))).toBe(EXAMPLE);
    });
});

describe('generateLegalMoves', () => {
    it("génère 18 coups légaux pour 4-2 à l'ouverture", () => {
        const moves = generateLegalMoves(createInitialState(), [4, 2]);
        expect(moves).toHaveLength(18);
        expect(hasMove(moves, 24, 20)).toBe(true);
        expect(hasMove(moves, 13, 9)).toBe(true);
        expect(hasMove(moves, 8, 4)).toBe(true);
        expect(hasMove(moves, 6, 2)).toBe(true);
    });

    it('oblige à jouer le maximum de dés', () => {
        const board = makeBoard({ 6: 1, 8: 1, 24: 13 }, { 1: 2, 18: 2, 22: 2, 13: 9 });
        const moves = generateLegalMoves(makeState(board), [6, 2]);
        expect(moves).toHaveLength(1);
        expect(moves[0].board[2]).toBe(1);
        expect(moves[0].board[4]).toBe(1);
        expect(moves[0].board[24]).toBe(13);
    });

    it('joue le dé le plus fort quand un seul est jouable', () => {
        const board = makeBoard({ 6: 1, 7: 1, 24: 13 }, { 5: 2, 18: 2, 23: 2, 13: 9 });
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves).toHaveLength(1);
        expect(moves[0].moves).toEqual([{ from: 7, to: 1 }]);
    });

    it('gère les doubles (4 mouvements)', () => {
        const board = makeBoard({ 24: 1, 13: 14 }, { 1: 15 });
        const moves = generateLegalMoves(makeState(board), [6, 6]);
        expect(moves).toHaveLength(4);
        for (const m of moves) expect(m.moves).toHaveLength(4);
    });

    it('bear-off exact', () => {
        const board = makeBoard({ 6: 1, 1: 14 }, { 5: 2, 24: 13 });
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves).toHaveLength(1);
        expect(moves[0].board[6]).toBe(0);
        expect(moves[0].board[1]).toBe(13);
    });

    it('bear-off par dépassement (overshoot)', () => {
        const board = makeBoard({ 5: 1, 1: 14 }, { 4: 2, 24: 13 });
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves).toHaveLength(1);
        expect(moves[0].board[5]).toBe(0);
        expect(moves[0].board[1]).toBe(13);
    });

    it('interdit le dépassement si une flèche plus haute est occupée', () => {
        const board = makeBoard({ 6: 1, 5: 1, 1: 13 }, { 24: 15 });
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves).toHaveLength(3);
    });

    it('oblige à entrer depuis la barre avant tout autre coup', () => {
        // X a 1 pion sur la barre. O a une porte sur la flèche 24 (bloquant le dé 1 : 25 - 1 = 24).
        // Avec les dés [6, 1], X doit donc obligatoirement entrer sur la flèche 19 (25 - 6 = 19).
        const board = makeBoard({ 23: 14 }, { 24: 2, 13: 13 }, 1, 0);
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves.length).toBeGreaterThan(0);
        for (const m of moves) expect(m.moves[0]).toEqual({ from: X_BAR, to: 19 });
    });

    it("renvoie un pion adverse à la barre lors d'une frappe", () => {
        const board = makeBoard({ 6: 1, 13: 14 }, { 4: 1, 19: 14 });
        const moves = generateLegalMoves(makeState(board), [2, 1]);
        const hit = moves.find((r) => r.moves.some((m) => m.from === 6 && m.to === 4));
        expect(hit).toBeDefined();
        expect(hit!.board[O_BAR]).toBe(-1);
    });

    it("retourne une liste vide quand aucun coup n'est possible", () => {
        const board = makeBoard({ 24: 1, 13: 14 }, { 18: 2, 23: 2, 7: 2, 12: 2, 1: 7 });
        const moves = generateLegalMoves(makeState(board), [6, 1]);
        expect(moves).toHaveLength(0);
    });
});

describe('borneOffCount', () => {
    it('compte les pions sortis', () => {
        const board = makeBoard({ 6: 5, 1: 5 }, { 24: 15 });
        expect(borneOffCount(board, 'X')).toBe(5);
        expect(borneOffCount(board, 'O')).toBe(0);
    });
});

describe("computeLegalTargets (règle du max-de-dés dans l'UI)", () => {
    it('interdit de commencer par le coup qui empêche de jouer les deux dés', () => {
        // Dans cette position, 8/2 (dé 6) permet ensuite 6/4 (dé 2).
        // Mais 8/6 (dé 2) bloque tout coup de 6.
        const board = makeBoard({ 6: 1, 8: 1, 24: 13 }, { 1: 2, 18: 2, 22: 2, 13: 9 });
        const state = makeState(board);
        const { leftDieTargets, rightDieTargets } = computeLegalTargets(state, [6, 2], [false, false]);

        // Dé 6 (gauche) : 8 -> 2 est permis
        expect(leftDieTargets.get(8)).toEqual([2]);
        // Dé 2 (droit) : 8 -> 6 est interdit car 8/6 empêche de jouer le 6
        expect(rightDieTargets.has(8)).toBe(false);
        // Mais 6 -> 4 avec le dé 2 est permis car il permet ensuite 8 -> 2 avec le 6
        expect(rightDieTargets.get(6)).toEqual([4]);

        // Une fois le dé 6 joué (8/2), l'état résultant permet au dé 2 de jouer 6/4
        const boardAfter6 = applyMove(board, { from: 8, to: 2 }, 'X');
        const after6 = computeLegalTargets(makeState(boardAfter6), [6, 2], [true, false]);
        expect(after6.leftDieTargets.size).toBe(0);
        expect(after6.rightDieTargets.get(6)).toEqual([4]);
    });

    it('oblige à jouer le dé le plus fort quand un seul dé est jouable (d1 != d2)', () => {
        // 7/1 avec 6 est jouable (mais bloque le 1)
        // 7/6 avec 1 est jouable (mais bloque le 6)
        const board = makeBoard({ 6: 1, 7: 1, 24: 13 }, { 5: 2, 18: 2, 23: 2, 13: 9 });
        const state = makeState(board);
        const { leftDieTargets, rightDieTargets } = computeLegalTargets(state, [6, 1], [false, false]);

        // Seul le dé le plus fort (6) a des cibles
        expect(leftDieTargets.get(7)).toEqual([1]);
        expect(rightDieTargets.size).toBe(0);

        // Après avoir joué le 6, plus aucun coup n'est possible pour le 1
        const boardAfter6 = applyMove(board, { from: 7, to: 1 }, 'X');
        const after6 = computeLegalTargets(makeState(boardAfter6), [6, 1], [true, false]);
        expect(after6.leftDieTargets.size).toBe(0);
        expect(after6.rightDieTargets.size).toBe(0);
    });

    it('autorise le petit dé si le grand dé ne peut pas être joué du tout', () => {
        // Point 7 a des pions, point 1 est bloqué par 2 pions O.
        // 7/1 (dé 6) est impossible.
        // 7/6 (dé 1) est possible.
        const board = makeBoard({ 7: 15 }, { 1: 2 });
        const state = makeState(board);
        const { leftDieTargets, rightDieTargets } = computeLegalTargets(state, [6, 1], [false, false]);

        expect(leftDieTargets.size).toBe(0);
        expect(rightDieTargets.get(7)).toEqual([6]);
    });

    it('propose les deux dés quand les deux peuvent être commencés librement', () => {
        const state = createInitialState();
        const { leftDieTargets, rightDieTargets } = computeLegalTargets(state, [4, 2], [false, false]);

        // 4 peut démarrer de 24, 13, 8
        expect(leftDieTargets.has(24)).toBe(true);
        expect(leftDieTargets.has(13)).toBe(true);
        expect(leftDieTargets.has(8)).toBe(true);

        // 2 peut démarrer de 24, 13, 6
        expect(rightDieTargets.has(24)).toBe(true);
        expect(rightDieTargets.has(13)).toBe(true);
        expect(rightDieTargets.has(6)).toBe(true);
    });

    it('retourne des maps vides si les deux dés sont déjà consommés', () => {
        const state = createInitialState();
        const { leftDieTargets, rightDieTargets } = computeLegalTargets(state, [4, 2], [true, true]);
        expect(leftDieTargets.size).toBe(0);
        expect(rightDieTargets.size).toBe(0);
    });
});

describe('evaluateMoveSafety & getSafestDestination (Modèle Snowie/TMG)', () => {
    it('privilégie la sortie définitive (bear-off) sur toute autre destination', () => {
        const board = makeBoard({ 1: 2, 2: 2, 3: 11 });
        const from = 1;
        // Bear-off (to=0) vs coup intermédiaire non-off
        const safetyBearOff = evaluateMoveSafety(board, { from: 1, to: 0 }, 'X');
        const safetyMove = evaluateMoveSafety(board, { from: 2, to: 1 }, 'X');

        expect(safetyBearOff).toBeGreaterThan(safetyMove);
        expect(getSafestDestination(1, [0], board, 'X')).toBe(0);
    });

    it('privilégie la frappe d un blot adverse ou la formation d une porte fermée', () => {
        // Destination 20 a 1 pion ami (faire une porte)
        // Destination 21 est vide avec risque de frappe adverse
        const board = makeBoard({ 24: 2, 20: 1 }, { 22: 2 });
        const from = 24;
        const dests = [21, 20]; // dé 3 -> 21 (blot), dé 4 -> 20 (porte fermée !)

        const safest = getSafestDestination(from, dests, board, 'X');
        expect(safest).toBe(20);
    });

    it('privilégie la frappe d un blot adverse pour renvoyer à la barre', () => {
        // Destination 18 frappe un pion adverse (-1 sur 18)
        // Destination 20 atterrit sur une case vide
        const board = makeBoard({ 24: 2 }, { 18: -1, 22: 2 });
        const from = 24;
        const dests = [20, 18];

        const safest = getSafestDestination(from, dests, board, 'X');
        expect(safest).toBe(18);
    });
});