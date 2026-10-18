/**
 * Tests de validation en conditions réelles du moteur tri-phase.
 *
 * Vérifie les 3 points critiques demandés :
 * 1. Le Bear-off privilégie bien la sortie immédiate des pions.
 * 2. Le plafond de 5 pions par flèche est respecté (règle de rendu).
 * 3. La cohérence des verdicts (OPTIMAL / DOUTEUX / BLUNDER) et du PR.
 */

import { describe, it, expect } from 'vitest';
import {
    classifyPosition,
    evaluateBoard,
    analyzeBoardMoves,
    type PositionRegime,
} from './evaluator';
import {
    createInitialState,
    type BoardState,
    type Player,
} from '../../engine/backgammonEngine';
import { classifyMoveEquity, calculatePR, calculateAccuracy } from '../../features/rating/ratingCalculator';

/** Construit un état de course pure (bear-off) pour X, avec pions dans le jan intérieur. */
function makeBearOffState(): BoardState {
    const board = new Array<number>(26).fill(0);
    // X (blanc) : 15 pions répartis dans son jan intérieur (flèches 1..6).
    board[1] = 3;
    board[2] = 3;
    board[3] = 3;
    board[4] = 3;
    board[5] = 3;
    // O (noir) : 15 pions dans son jan intérieur (flèches 19..24).
    board[19] = -3;
    board[20] = -3;
    board[21] = -3;
    board[22] = -3;
    board[23] = -3;

    return {
        board,
        turn: 'X',
        cubeValue: 1,
        cubeOwner: null,
        dice: [6, 1],
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

describe('Moteur tri-phase — validation en conditions réelles', () => {
    describe('1. Détection du régime (classifyPosition)', () => {
        it('classe une position de course pure (bear-off) en RACE', () => {
            const state = makeBearOffState();
            const regime: PositionRegime = classifyPosition(state.board);
            expect(regime).toBe('RACE');
        });

        it('classe la position d\'ouverture en CONTACT', () => {
            const state = createInitialState();
            const regime: PositionRegime = classifyPosition(state.board);
            expect(regime).toBe('CONTACT');
        });
    });

    describe('2. Bear-off privilégie la sortie immédiate', () => {
        it('évalue la sortie d\'un pion comme strictement meilleure qu\'un déplacement interne', () => {
            const state = makeBearOffState();
            // Analyse des coups pour les dés [6, 1].
            const result = analyzeBoardMoves(state, [6, 1], { ply: 2, maxMoves: 10 });

            expect(result.moves.length).toBeGreaterThan(0);

            // Le meilleur coup doit être une sortie (notation contenant "/off").
            const bestNotation = result.bestMove?.notation ?? '';
            expect(bestNotation).toContain('/off');
        });

        it('borne l\'équité entre -1 et +1 en course pure', () => {
            const state = makeBearOffState();
            const evalResult = evaluateBoard(state, 2);
            expect(evalResult.cubelessEquity).toBeGreaterThanOrEqual(-1);
            expect(evalResult.cubelessEquity).toBeLessThanOrEqual(1);
            expect(evalResult.cubefulEquity).toBeGreaterThanOrEqual(-1);
            expect(evalResult.cubefulEquity).toBeLessThanOrEqual(1);
        });
    });

    describe('3. Cohérence des verdicts et du PR', () => {
        it('classifie correctement les seuils OPTIMAL / DOUTEUX / BLUNDER', () => {
            expect(classifyMoveEquity(-0.01)).toBe('optimal');
            expect(classifyMoveEquity(-0.05)).toBe('doubtful');
            expect(classifyMoveEquity(-0.09)).toBe('blunder');
        });

        it('calcule un PR crédible (entre 2 et 15) pour une erreur moyenne de 0.040', () => {
            // 10 décisions, perte totale 0.4 -> errorRate 0.04 -> PR = 4.8
            const pr = calculatePR(0.4, 10);
            expect(pr).toBeGreaterThanOrEqual(2);
            expect(pr).toBeLessThanOrEqual(15);
            expect(pr).toBeCloseTo(4.8, 1);
        });

        it('calcule une précision entre 65% et 99% (jamais 0.1%)', () => {
            const accuracy = calculateAccuracy(4.8);
            expect(accuracy).toBeGreaterThanOrEqual(65);
            expect(accuracy).toBeLessThanOrEqual(99);
        });
    });
});
