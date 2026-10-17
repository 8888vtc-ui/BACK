import { describe, it, expect, beforeEach } from 'vitest';
import {
    normalizeMoveNotation,
    validateDrillMove,
    createDrillSession,
    advanceDrillSession,
} from './blunderDrillEngine';
import { BENCHMARK_BLUNDERS } from './benchmarkBlunders';
import { clearBlunderBank } from './blunderBank';

describe('BlunderDrillEngine Module', () => {
    beforeEach(() => {
        clearBlunderBank();
    });

    it('normalise correctement les notations de coups', () => {
        expect(normalizeMoveNotation('24/20 13/11')).toBe('13/11 24/20');
        expect(normalizeMoveNotation('8/5* 6/5')).toBe('6/5 8/5');
        expect(normalizeMoveNotation('')).toBe('');
    });

    it('valide immédiatement un coup direct identique au coup optimal', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Optimal: '8/5 6/5'
        const moves = [
            { from: 8, to: 5 },
            { from: 6, to: 5 },
        ];

        const result = validateDrillMove(blunder, moves);
        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
        expect(result.equityLoss).toBe(0);
        expect(result.canRetry).toBe(false);
        expect(result.feedbackMessage).toContain('Coup optimal');
    });

    it('valide une variante acceptable déclarée avec une perte d’équité minimale', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Acceptable: ['6/5 8/5']
        const moves = [
            { from: 6, to: 5 },
            { from: 8, to: 5 },
        ];

        const result = validateDrillMove(blunder, moves);
        expect(result.isCorrect).toBe(true);
        expect(result.canRetry).toBe(false);
        expect(result.equityLoss).toBeLessThanOrEqual(0.025);
    });

    it('rejette un coup erroné en signalant un blunder et autorise la tentative de rejouer', () => {
        const blunder = BENCHMARK_BLUNDERS[0]; // Golden point 3-1
        // Joue le mauvais coup : 24/21 13/12
        const badMoves = [
            { from: 24, to: 21 },
            { from: 13, to: 12 },
        ];

        const result = validateDrillMove(blunder, badMoves);
        expect(result.isCorrect).toBe(false);
        expect(result.canRetry).toBe(true);
        expect(result.equityLoss).toBeGreaterThan(0.025);
        expect(result.hint).toBeDefined();
        expect(result.feedbackMessage).toContain('Rejouez jusqu’à trouver le bon coup');
    });

    it('gère une session de drill complète avec createDrillSession et advanceDrillSession', () => {
        const session = createDrillSession({ maxBlunders: 3 });
        expect(session.blunders.length).toBe(3);
        expect(session.currentIndex).toBe(0);
        expect(session.isCompleted).toBe(false);

        // Réussite sur la 1ère
        const session1 = advanceDrillSession(session, true);
        expect(session1.currentIndex).toBe(1);
        expect(session1.sessionSolvedCount).toBe(1);
        expect(session1.isCompleted).toBe(false);

        // Échec sur la 2ème
        const session2 = advanceDrillSession(session1, false);
        expect(session2.currentIndex).toBe(2);
        expect(session2.sessionSolvedCount).toBe(1);
        expect(session2.isCompleted).toBe(false);

        // Réussite sur la 3ème (dernière)
        const sessionFinal = advanceDrillSession(session2, true);
        expect(sessionFinal.sessionSolvedCount).toBe(2);
        expect(sessionFinal.sessionAttemptsCount).toBe(3);
        expect(sessionFinal.isCompleted).toBe(true);
    });
});
