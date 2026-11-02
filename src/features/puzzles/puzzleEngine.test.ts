import { describe, it, expect } from 'vitest';
import { validatePuzzleMove, normalizeNotation } from './puzzleEngine';
import { PUZZLE_DATABASE } from './puzzleDatabase';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';

describe('puzzleEngine (Validation de la réponse du joueur)', () => {
    const puzzle01 = PUZZLE_DATABASE[0]!;
    const optimalMoves = parseCoachNotationMoves(puzzle01.optimalNotation, 'X');
    const parts = puzzle01.optimalNotation.split(/\s+/);
    const reversedNotation = parts.length > 1 ? `${parts[1]} ${parts[0]}` : puzzle01.optimalNotation;
    const reversedMoves = parseCoachNotationMoves(reversedNotation, 'X');
    const badMoves = parseCoachNotationMoves('24/20 13/9', 'X');

    it('normalise correctement les notations et ignore l’ordre des dés', () => {
        expect(normalizeNotation(puzzle01.optimalNotation)).toBe(normalizeNotation(reversedNotation));
        expect(normalizeNotation('bar/20* 13/11')).toBe('13/11 bar/20');
    });

    it('valide avec succès un coup optimal identique à la solution certifiée', () => {
        const result = validatePuzzleMove(puzzle01, optimalMoves);

        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
        expect(result.equityLoss).toBe(0);
        expect(result.explanation).toBeDefined();
    });

    it('valide avec succès un coup écrit dans l’ordre inverse des sous-coups', () => {
        const result = validatePuzzleMove(puzzle01, reversedMoves);

        expect(result.isCorrect).toBe(true);
        expect(result.verdict).toBe('optimal');
    });

    it('identifie un blunder quand le coup joué est sous-optimal', () => {
        const result = validatePuzzleMove(puzzle01, badMoves);

        expect(result.isCorrect).toBe(false);
        expect(result.verdict).toBe('blunder');
        expect(result.equityLoss).toBeGreaterThan(0.015);
        expect(result.explanation).toBeDefined();
    });
});
