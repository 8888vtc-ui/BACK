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
        });

        it('pénalise l\'empilement sur la flèche 1 (+2 par pion au-delà de 2)', () => {
            // X : 4 pions sur la flèche 1 => +2*(4-2) = +4 d'ajustement.
            const board = makeRaceBoard([4, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]);
            const kx = computeKeithCount(board, 'X');
            // rawPips = 4 pions * 1 = 4. Ajustements = +4 (empilement flèche 1)
            // + 3 (gaspillage au-delà du premier : 4-1=3).
            expect(kx.rawPips).toBe(4);
            expect(kx.adjustments).toBeGreaterThanOrEqual(4);
        });

        it('pénalise les gaps dans le jan intérieur', () => {
            // X : 3 pions sur la flèche 6, 1 pion sur la flèche 8 (extérieur),
            // rien sur 4 et 5 => gaps pénalisés car il reste des pions plus hauts.
            const board = new Array<number>(26).fill(0);
            board[6] = 3; // 3 pions X sur la flèche 6
            board[8] = 1; // 1 pion X sur la flèche 8 (extérieur)
            const kx = computeKeithCount(board, 'X');
            // rawPips = 3*6 + 1*8 = 26. Gaps sur 4 et 5 (2 gaps) => +2.
            expect(kx.rawPips).toBe(26);
            expect(kx.adjustments).toBeGreaterThanOrEqual(2);
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

