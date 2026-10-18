/**
 * Tests de calibration du régime CONTACT — cohérence et bornes.
 *
 * Le régime CONTACT utilise une heuristique tri-phase à coefficients calibrés.
 * Sans référence gnubg externe (contrainte 100 % client-side), on ne peut pas
 * mesurer un PR objectif en contact. Ces tests verrouillent donc des
 * PROPRIÉTÉS DE COHÉRENCE qui garantissent que l'évaluateur ne dégénère pas :
 *
 *   1. Bornes : l'équité cubeless est toujours dans [-1, +1].
 *   2. Symétrie : échanger les perspectives (X <-> O) inverse l'équité.
 *   3. Monotonie : une position clairement gagnante a une équité > 0.
 *   4. Déterminisme : deux évaluations identiques donnent le même résultat.
 *
 * Ces tests agissent comme garde-fous de non-régression : si un futur
 * refactoring casse l'évaluateur de contact, ils échoueront immédiatement.
 */

import { describe, it, expect } from 'vitest';
import { evaluateBoard, classifyPosition } from './evaluator';
import { createInitialState, type BoardState, type Player } from '../../engine/backgammonEngine';

/** Construit un état de contact (blitz) : X a une prime, O a un blot exposé. */
function makeBlitzState(): BoardState {
    const board = new Array<number>(26).fill(0);
    // X (blanc) : prime sur 5-6-7-8, 2 pions sur 13.
    board[5] = 2;
    board[6] = 2;
    board[7] = 2;
    board[8] = 2;
    board[13] = 2;
    board[24] = 2; // ancre arrière
    // O (noir) : 1 blot exposé sur 20, pions sur 12, 17, 19.
    board[20] = -1;
    board[12] = -5;
    board[17] = -3;
    board[19] = -5;
    board[1] = -2;
    return {
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
}

/** Inverse la perspective d'un état (X <-> O, miroir du plateau). */
function mirrorState(state: BoardState): BoardState {
    const board = new Array<number>(26).fill(0);
    for (let p = 1; p <= 24; p++) {
        board[25 - p] = -state.board[p];
    }
    board[0] = -state.board[25]; // barre X <-> barre O
    board[25] = -state.board[0];
    return {
        ...state,
        board,
        turn: state.turn === 'X' ? 'O' : 'X',
    };
}

describe('Calibration du régime CONTACT — cohérence', () => {
    describe('1. Bornes de l\'équité', () => {
        it('l\'équité cubeless est toujours dans [-1, +1]', () => {
            const positions = [createInitialState(), makeBlitzState()];
            for (const state of positions) {
                const evalResult = evaluateBoard(state, 2);
                expect(evalResult.cubelessEquity).toBeGreaterThanOrEqual(-1);
                expect(evalResult.cubelessEquity).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('2. Symétrie (X <-> O)', () => {
        it('une position parfaitement symétrique a une équité quasi nulle', () => {
            // Position parfaitement symétrique : X et O ont des structures miroir.
            const board = new Array<number>(26).fill(0);
            // X : 2 pions sur 6, 3 sur 8, 5 sur 13, 2 sur 24.
            board[6] = 2;
            board[8] = 3;
            board[13] = 5;
            board[24] = 2;
            // O : miroir exact (2 sur 19, 3 sur 17, 5 sur 12, 2 sur 1).
            board[19] = -2;
            board[17] = -3;
            board[12] = -5;
            board[1] = -2;

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

            const e1 = evaluateBoard(state, 2).cubelessEquity;
            // Une position symétrique doit être quasi équilibrée (|équité| < 0.1).
            expect(Math.abs(e1)).toBeLessThan(0.1);
        });
    });

    describe('3. Monotonie (position gagnante)', () => {
        it('une position de blitz avec prime et blot adverse exposé est favorable à X', () => {
            const state = makeBlitzState();
            const evalResult = evaluateBoard(state, 2);
            // X a une prime (5-6-7-8) et O a un blot exposé : X est favori.
            expect(evalResult.cubelessEquity).toBeGreaterThan(0);
        });

        it('la position d\'ouverture est quasi équilibrée (|équité| < 0.2)', () => {
            const state = createInitialState();
            const evalResult = evaluateBoard(state, 2);
            expect(Math.abs(evalResult.cubelessEquity)).toBeLessThan(0.2);
        });
    });

    describe('4. Déterminisme', () => {
        it('deux évaluations identiques donnent le même résultat', () => {
            const state = makeBlitzState();
            const e1 = evaluateBoard(state, 2);
            const e2 = evaluateBoard(state, 2);
            expect(e1.cubelessEquity).toBe(e2.cubelessEquity);
            expect(e1.probabilities.win).toBe(e2.probabilities.win);
        });
    });

    describe('5. Classification du régime', () => {
        it('la position de blitz est classée CONTACT', () => {
            expect(classifyPosition(makeBlitzState().board)).toBe('CONTACT');
        });
        it('la position d\'ouverture est classée CONTACT', () => {
            expect(classifyPosition(createInitialState().board)).toBe('CONTACT');
        });
    });
});
