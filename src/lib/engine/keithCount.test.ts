/**
 * Tests du Keith Count (calibration officielle de la course, Tom Keith 1993).
 *
 * Valide :
 * 1. Le calcul des pips bruts et des ajustements.
 * 2. La règle de décision de videau (double/take/pass) en course pure.
 */

import { describe, it, expect } from 'vitest';
import { computeKeithCount, evaluateKeithCube } from './keithCount';
import { createInitialState } from '../../engine/backgammonEngine';

/** Construit un plateau de course pure (les deux joueurs ont croisé). */
function makeRaceBoard(xHome: number[], oHome: number[]): number[] {
    const board = new Array<number>(26).fill(0);
    // X (blanc) : pions dans son jan intérieur (flèches 1..6).
    for (let i = 0; i < 6; i++) {
        board[i + 1] = xHome[i] ?? 0;
    }
    // O (noir) : pions dans son jan intérieur (flèches 19..24).
    for (let i = 0; i < 6; i++) {
        board[24 - i] = -(oHome[i] ?? 0);
    }
    return board;
}

describe('Keith Count — calibration de la course', () => {
    describe('1. Calcul des pips bruts et ajustements', () => {
        it('position d\'ouverture : pips bruts = 167 pour chaque joueur', () => {
            const state = createInitialState();
            const kx = computeKeithCount(state.board, 'X');
            const ko = computeKeithCount(state.board, 'O');
            expect(kx.rawPips).toBe(167);
            expect(ko.rawPips).toBe(167);
            // Gaps sur les flèches 4 et 5 (la 6 a 5 pions) => 2 ajustements
            expect(kx.adjustments).toBe(2);
            expect(ko.adjustments).toBe(2);
        });

        it('pénalise l\'empilement sur la flèche 1 (+2 par pion au-delà de 1)', () => {
            // X : 4 pions sur la flèche 1 => +2*(4-1) = +6 d'empilement
            // + 3 gaps sur 4, 5, 6 (+3) = 9
            const board = makeRaceBoard([4, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]);
            const kx = computeKeithCount(board, 'X');
            expect(kx.rawPips).toBe(4);
            expect(kx.adjustments).toBe(6 + 3);
            expect(kx.total).toBe(13);
        });

        it('pénalise l\'empilement sur les flèches 2 et 3 selon la formule officielle', () => {
            // 2 pions sur flèche 2 (+1), 4 pions sur flèche 3 (+1), points 4/5/6 occupés (0 gap)
            // 1 pion sur flèche 1 (0 ajustement car pas > 1)
            const board = makeRaceBoard([1, 2, 4, 2, 2, 2], [0, 0, 0, 0, 0, 0]);
            const kx = computeKeithCount(board, 'X');
            // rawPips = 1*1 + 2*2 + 4*3 + 2*4 + 2*5 + 2*6 = 1 + 4 + 12 + 8 + 10 + 12 = 47
            expect(kx.rawPips).toBe(47);
            // c1=1 (0), c2=2 (1), c3=4 (1), gaps=0 => adjustments = 2
            expect(kx.adjustments).toBe(2);
            expect(kx.total).toBe(49);
        });

        it('pénalise les gaps sur 4, 5 et 6', () => {
            // X : 3 pions sur la flèche 6, 1 pion sur la flèche 8 (extérieur), rien sur 1..5
            const board = new Array<number>(26).fill(0);
            board[6] = 3;
            board[8] = 1;
            const kx = computeKeithCount(board, 'X');
            // rawPips = 3*6 + 1*8 = 26. Gaps sur 4 et 5 (2 gaps) => 2
            expect(kx.rawPips).toBe(26);
            expect(kx.adjustments).toBe(2);
            expect(kx.total).toBe(28);
        });
    });

    describe('2. Décision de videau en course pure', () => {
        it('avance > 4 pips => Double, pass', () => {
            // X très en avance : 1 pion sur flèche 1 (1 pip), O : 15 pions sur flèche 6 (90 pips).
            const board = makeRaceBoard([1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15]);
            const decision = evaluateKeithCube(board, 'X', false);
            expect(decision.action).toBe('Double, pass');
        });

        it('avance modérée (2-4 pips) => Double, take', () => {
            // X en avance de ~3 pips : 2 pions flèche 6 (12 pips) vs 3 pions flèche 5 (15 pips).
            const board = makeRaceBoard([0, 0, 0, 0, 0, 2], [0, 0, 0, 0, 3, 0]);
            const decision = evaluateKeithCube(board, 'X', false);
            expect(decision.action).toBe('Double, take');
        });

        it('pas d\'avance => No double, take', () => {
            // Positions équilibrées.
            const board = makeRaceBoard([0, 0, 0, 0, 0, 2], [0, 0, 0, 0, 0, 2]);
            const decision = evaluateKeithCube(board, 'X', false);
            expect(decision.action).toBe('No double, take');
        });

        it('redouble demande une avance plus stricte (+1 pip)', () => {
            // Avance de 2 pips : suffisant pour un premier double, mais pas pour un redouble
            const board = makeRaceBoard([0, 0, 0, 0, 2, 0], [0, 0, 0, 0, 0, 2]); // 10 pips vs 12 pips (diff = 2)
            const firstDouble = evaluateKeithCube(board, 'X', false);
            const redouble = evaluateKeithCube(board, 'X', true);
            expect(firstDouble.action).toBe('Double, take');
            expect(redouble.action).toBe('No double, take');
        });
    });

    describe('3. Intégration analyzeBoardCube en régime de course pure', () => {
        it('analyzeBoardCube applique les décisions de Keith en régime RACE', async () => {
            const { analyzeBoardCube } = await import('./evaluator');

            // Position de course pure : X en nette avance
            const board = makeRaceBoard([1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15]);
            const state = {
                board,
                turn: 'X' as const,
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

            const result = analyzeBoardCube(state);
            expect(result.optimalAction).toBe('Double, pass');
        });

        it('la règle de Crawford interdit le double même en avance écrasante', async () => {
            const { analyzeBoardCube } = await import('./evaluator');

            const board = makeRaceBoard([1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15]);
            const state = {
                board,
                turn: 'X' as const,
                cubeValue: 1,
                cubeOwner: null,
                dice: null,
                matchLength: 0,
                scoreX: 0,
                scoreO: 0,
                crawford: true,
                doubled: false,
                resigned: 0,
            };

            const result = analyzeBoardCube(state);
            expect(result.optimalAction).toBe('No double (Crawford rule)');
        });
    });
});

