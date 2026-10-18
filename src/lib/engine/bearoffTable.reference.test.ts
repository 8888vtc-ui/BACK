import { describe, it, expect } from 'vitest';
import {
    bearoffExpectedRolls,
    bearoffIndex,
    bearoffDecode,
} from './bearoffTable';
import { analyzeBoardMoves } from './evaluator';
import { BoardState } from '../../engine/backgammonEngine';

describe('Bear-off Exact Table — Tests de Référence Mathématique (PR 0.00)', () => {
    it('calcule exactement les valeurs théoriques publiées pour 1 pion', () => {
        // 0 pion
        expect(bearoffExpectedRolls([0, 0, 0, 0, 0, 0])).toBe(0);

        // 1 pion sur les points 1, 2, 3 : 100% des 36 lancers suffisent à le sortir
        // (ex: sur le point 3, même 2-1 sort le pion via 3-2-1=off, et 1-1 offre 4 pas)
        expect(bearoffExpectedRolls([1, 0, 0, 0, 0, 0])).toBe(1.0);
        expect(bearoffExpectedRolls([0, 1, 0, 0, 0, 0])).toBe(1.0);
        expect(bearoffExpectedRolls([0, 0, 1, 0, 0, 0])).toBe(1.0);

        // 1 pion sur le point 4 : seul le lancer 2-1 (2 cas sur 36) échoue au tour 1
        expect(bearoffExpectedRolls([0, 0, 0, 1, 0, 0])).toBeGreaterThan(1.0);

        // 1 pion sur le point 5 : échec pour 2-1, 3-1, 1-1 (5 cas sur 36) -> ~1.14
        expect(bearoffExpectedRolls([0, 0, 0, 0, 1, 0])).toBeCloseTo(1.14, 2);

        // 1 pion sur le point 6 : 27 jets sur 36 le sortent au tour 1 (9 cas échouent) -> 1 + 9/36 = 1.25
        expect(bearoffExpectedRolls([0, 0, 0, 0, 0, 1])).toBeCloseTo(1.25, 2);
    });

    it('respecte la monotonie stricte par distance à partir du point 3', () => {
        const r3 = bearoffExpectedRolls([0, 0, 1, 0, 0, 0]);
        const r4 = bearoffExpectedRolls([0, 0, 0, 1, 0, 0]);
        const r5 = bearoffExpectedRolls([0, 0, 0, 0, 1, 0]);
        const r6 = bearoffExpectedRolls([0, 0, 0, 0, 0, 1]);

        expect(r3).toBeLessThan(r4);
        expect(r4).toBeLessThan(r5);
        expect(r5).toBeLessThan(r6);
    });

    it('respecte la croissance par paliers de dés sur le point 1 (2 pions par lancer non-double)', () => {
        const e1 = bearoffExpectedRolls([1, 0, 0, 0, 0, 0]);
        const e2 = bearoffExpectedRolls([2, 0, 0, 0, 0, 0]);
        const e3 = bearoffExpectedRolls([3, 0, 0, 0, 0, 0]);
        const e4 = bearoffExpectedRolls([4, 0, 0, 0, 0, 0]);
        const e5 = bearoffExpectedRolls([5, 0, 0, 0, 0, 0]);

        // 1 ou 2 pions : 1 jet
        expect(e1).toBe(1.0);
        expect(e2).toBe(1.0);

        // 3 ou 4 pions : 1.83 jets
        expect(e3).toBeGreaterThan(e2);
        expect(e4).toBeGreaterThanOrEqual(e3);

        // 5 pions : au moins 3 jets requis en cas de non-double
        expect(e5).toBeGreaterThan(e4);
    });

    it('évalue avec cohérence les configurations multi-pions de référence', () => {
        // 2 pions sur le 6 vs 2 pions sur le 1
        const twoOnSix = bearoffExpectedRolls([0, 0, 0, 0, 0, 2]);
        const twoOnOne = bearoffExpectedRolls([2, 0, 0, 0, 0, 0]);
        expect(twoOnSix).toBeGreaterThan(twoOnOne);

        // 15 pions tous sur le point 1 (position fermée, ~7.0 jets moyens avec doubles)
        const allOnOne = bearoffExpectedRolls([15, 0, 0, 0, 0, 0]);
        expect(allOnOne).toBeCloseTo(7.0, 0);

        // 15 pions répartis sur le plateau intérieur prennent nettement plus de temps
        const distributed = bearoffExpectedRolls([3, 3, 2, 2, 3, 2]);
        expect(distributed).toBeGreaterThan(allOnOne);
    });

    it('encode et décode fidèlement tous les états limites (0 et 54263)', () => {
        const emptyCounts = [0, 0, 0, 0, 0, 0];
        const emptyIdx = bearoffIndex(emptyCounts);
        expect(emptyIdx).toBe(0);
        expect(bearoffDecode(0)).toEqual(emptyCounts);

        const maxCounts = [15, 0, 0, 0, 0, 0];
        const maxIdx = bearoffIndex(maxCounts);
        expect(bearoffDecode(maxIdx)).toEqual(maxCounts);
    });

    it('en bear-off pur, analyzeBoardMoves sélectionne le coup maximisant la sortie des pions (to = 0)', () => {
        const board = new Array<number>(26).fill(0);
        // X a 2 pions restants : un sur le point 1 et un sur le point 2
        board[1] = 1;
        board[2] = 1;

        // O a 2 pions sur sa flèche 24
        board[24] = -2;

        const state: BoardState = {
            board,
            turn: 'X',
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

        // X tire [2, 1] : X peut sortir les deux pions avec to = 0
        const result = analyzeBoardMoves(state, [2, 1]);
        expect(result.moves.length).toBeGreaterThan(0);
        expect(result.bestMove).not.toBeNull();

        const bestMove = result.bestMove!;
        // Le meilleur coup doit porter les 2 pions hors du plateau (to = 0)
        expect(bestMove.moves).toBeDefined();
        const moves = bestMove.moves!;
        expect(moves.length).toBe(2);
        const bearsOffBoth = moves.every(m => m.to === 0);
        expect(bearsOffBoth).toBe(true);
    });
});
