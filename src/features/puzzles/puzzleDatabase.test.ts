import { describe, it, expect } from 'vitest';
import {
    PUZZLE_DATABASE,
    getDailyPuzzle,
    getAllPuzzles,
    getPuzzleById,
} from './puzzleDatabase';

describe('puzzleDatabase', () => {
    it('contient au moins 7 puzzles tactiques et stratégiques', () => {
        expect(PUZZLE_DATABASE.length).toBeGreaterThanOrEqual(7);
        for (const puzzle of PUZZLE_DATABASE) {
            expect(puzzle.id).toBeDefined();
            expect(puzzle.title).toBeDefined();
            expect(puzzle.category).toBeDefined();
            expect(puzzle.difficulty).toBeDefined();
            expect(puzzle.initialBoard).toHaveLength(26);
            expect(puzzle.dice).toHaveLength(2);
            expect(puzzle.optimalNotation).toBeDefined();
            expect(puzzle.explanation).toBeDefined();
        }
    });

    it('sélectionne le même puzzle de manière déterministe pour une date donnée', () => {
        const date1 = new Date(2026, 9, 16); // 16 Octobre 2026
        const date2 = new Date(2026, 9, 16); // Même jour
        const puzzleA = getDailyPuzzle(date1);
        const puzzleB = getDailyPuzzle(date2);

        expect(puzzleA.id).toBe(puzzleB.id);
        expect(puzzleA.title).toBe(puzzleB.title);
    });

    it('sélectionne un puzzle par son ID', () => {
        const puzzle = getPuzzleById('puzzle_01_gold_point');
        expect(puzzle).not.toBeNull();
        expect(puzzle?.title).toContain('Point d’Or');
        expect(puzzle?.optimalNotation).toBe('8/5 6/5');

        const unknown = getPuzzleById('non_existent');
        expect(unknown).toBeNull();
    });

    it('renvoie tous les puzzles avec getAllPuzzles', () => {
        const all = getAllPuzzles();
        expect(all).toHaveLength(PUZZLE_DATABASE.length);
    });
});
