import { describe, it, expect } from 'vitest';
import { validatePuzzleMove, normalizeNotation } from './puzzleEngine';
import { getPuzzleById } from './puzzleDatabase';

describe('puzzleEngine (Validation de la réponse du joueur)', () => {
    const puzzle01 = getPuzzleById('puzzle_01_gold_point')!;

    it('normalise correctement les notations et ignore l’ordre des dés', () => {
        expect(normalizeNotation('8/5 6/5')).toBe(normalizeNotation('6/5 8/5'));
        expect(normalizeNotation('bar/20* 13/11')).toBe('13/11 bar/20');
    });

    it('valide avec succès un coup optimal identique à la solution certifiée', () => {
        // Coup optimal 8/5 6/5
        const moves = [
            { from: 8, to: 5 },
            { from: 6, to: 5 },
        ];

        const result = validatePuzzleMove(puzzle01, moves);

        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
        expect(result.equityLoss).toBe(0);
        expect(result.explanation).toContain('point 5');
    });

    it('valide avec succès un coup écrit dans l’ordre inverse des sous-coups', () => {
        // 6/5 puis 8/5
        const moves = [
            { from: 6, to: 5 },
            { from: 8, to: 5 },
        ];

        const result = validatePuzzleMove(puzzle01, moves);

        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
    });

    it('identifie un blunder quand le coup joué est sous-optimal', () => {
        // Coup très faible d'ouverture 3-1 : 24/20 ou 13/9
        const badMoves = [
            { from: 13, to: 10 },
            { from: 10, to: 9 },
        ];

        const result = validatePuzzleMove(puzzle01, badMoves);

        expect(result.isCorrect).toBe(false);
        expect(result.verdict).toBe('blunder');
        expect(result.equityLoss).toBeGreaterThan(0.025);
        expect(result.explanation).toContain('Inexactitude tactique');
    });
});
