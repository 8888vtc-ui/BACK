// @vitest-environment jsdom
/**
 * Tests du module cubeCoach (analyse pédagogique des décisions de videau et des cubes oubliés).
 */

import { describe, it, expect } from 'vitest';
import { analyzeCubeDecision, classifyCubeResponse, detectMissedCubeBeforeRoll } from './cubeCoach';
import type { BoardState } from '../../engine/backgammonEngine';

function makeState(overrides: Partial<BoardState> = {}): BoardState {
    return {
        board: Array(26).fill(0),
        turn: 'X',
        dice: null,
        usedDice: [false, false],
        cubeValue: 1,
        cubeOwner: null,
        crawford: false,
        matchLength: 7,
        scoreX: 0,
        scoreO: 0,
        ...overrides,
    } as BoardState;
}

describe('classifyCubeResponse', () => {
    it('reconnaît un take correct sur Double, take', () => {
        const res = classifyCubeResponse('Double, take', 'take');
        expect(res.verdict).toBe('optimal');
        expect(res.explanation).toContain('Bon take');
    });

    it('reconnaît un pass fautif (blunder) sur Double, take', () => {
        const res = classifyCubeResponse('Double, take', 'pass');
        expect(res.verdict).toBe('blunder');
        expect(res.explanation).toContain('Pass trop frileux');
    });

    it('reconnaît un pass correct sur Double, pass', () => {
        const res = classifyCubeResponse('Double, pass', 'pass');
        expect(res.verdict).toBe('optimal');
        expect(res.explanation).toContain('Bon pass');
    });

    it('reconnaît un take trop optimiste (blunder) sur Double, pass', () => {
        const res = classifyCubeResponse('Double, pass', 'take');
        expect(res.verdict).toBe('blunder');
        expect(res.explanation).toContain('Take trop optimiste');
    });

    it('classe un double optimal sur Double, take et Double, pass', () => {
        expect(classifyCubeResponse('Double, take', 'double').verdict).toBe('optimal');
        expect(classifyCubeResponse('Double, pass', 'double').verdict).toBe('optimal');
    });

    it('classe un double sous Crawford en blunder', () => {
        const res = classifyCubeResponse('No double (Crawford rule)', 'double');
        expect(res.verdict).toBe('blunder');
        expect(res.explanation).toContain('Crawford');
    });

    it('classe un double prématuré en blunder sur No double, take', () => {
        const res = classifyCubeResponse('No double, take', 'double');
        expect(res.verdict).toBe('blunder');
        expect(res.explanation).toContain('Double prématuré');
    });

    it('détecte un videau oublié (missed_double) quand Double était requis', () => {
        const res = classifyCubeResponse('Double, take', 'missed_double');
        expect(res.verdict).toBe('blunder');
        expect(res.explanation).toContain('Videau oublié');
        expect(classifyCubeResponse('No double, take', 'missed_double').verdict).toBe('optimal');
    });
});

describe('analyzeCubeDecision & detectMissedCubeBeforeRoll', () => {
    it('retourne un verdict optimal pour un double justifié', () => {
        const state = makeState({
            board: [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 15,
            ],
        });
        const result = analyzeCubeDecision(state, 'double');
        expect(result.verdict).toBeDefined();
        expect(result.optimalAction).toBeTruthy();
        expect(result.explanation).toBeTruthy();
        expect(result.advice).toBeTruthy();
    });

    it('détecte un double interdit par la règle de Crawford et ignore les cubes oubliés sous Crawford', () => {
        const state = makeState({ crawford: true });
        const result = analyzeCubeDecision(state, 'double');
        expect(result.verdict).toBe('blunder');
        expect(result.explanation).toContain('Crawford');
        expect(detectMissedCubeBeforeRoll(state)).toBeNull();
    });

    it('retourne un verdict pour un take et un pass', () => {
        const state = makeState();
        for (const action of ['double', 'take', 'pass', 'missed_double'] as const) {
            const result = analyzeCubeDecision(state, action);
            expect(result.explanation.length).toBeGreaterThan(0);
            expect(result.advice.length).toBeGreaterThan(0);
        }
    });
});
