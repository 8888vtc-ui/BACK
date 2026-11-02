/**
 * Base de Données des Puzzles de Backgammon.
 *
 * Source unique : positions validées par GNU Backgammon 3-ply cubeful (voir gnubgPuzzleAdapter.ts).
 */

import type { BackgammonPuzzle } from './types';
import { buildGnubgPuzzleLibrary } from './gnubgPuzzleAdapter';

/** Puzzles = positions validées par GNU Backgammon 3-ply (purge db_clean_v3 : anciens puzzles manuels supprimés). */
export const PUZZLE_DATABASE: BackgammonPuzzle[] = buildGnubgPuzzleLibrary();

/**
 * Récupère le puzzle quotidien de manière déterministe pour une date donnée.
 * Chaque joueur dans le monde obtient le même puzzle pour un jour donné !
 */
export function getDailyPuzzle(date: Date = new Date()): BackgammonPuzzle {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Calcul d'une graine de date déterministe
    const seed = year * 10000 + month * 100 + day;
    const index = Math.abs(seed) % PUZZLE_DATABASE.length;

    return PUZZLE_DATABASE[index];
}

/**
 * Récupère l'ensemble des puzzles disponibles dans la base.
 */
export function getAllPuzzles(): BackgammonPuzzle[] {
    return PUZZLE_DATABASE;
}

/**
 * Récupère un puzzle par son identifiant unique.
 */
export function getPuzzleById(id: string): BackgammonPuzzle | null {
    return PUZZLE_DATABASE.find((p) => p.id === id) || null;
}
