/**
 * Types & Contrats pour le mode Puzzles Quotidiens (Daily Backgammon Puzzles).
 */

import type { Move, Player } from '../../engine/backgammonEngine';
import type { AnalyzeMovesResult } from '../../lib/engine/types';

export type PuzzleCategory =
    | 'opening'
    | 'blitz'
    | 'prime'
    | 'escape'
    | 'bear_off'
    | 'contact'
    | 'cube';

export type PuzzleDifficulty = 'beginner' | 'intermediate' | 'expert';

export interface BackgammonPuzzle {
    id: string;
    title: string;
    category: PuzzleCategory;
    difficulty: PuzzleDifficulty;
    description: string;
    hint: string;
    explanation: string;
    strategicConcept: string;

    // Position initiale du plateau (tableau de 26 entiers)
    initialBoard: number[];
    turn: Player; // Joueur au trait (généralement 'X')
    dice: [number, number]; // Dés obtenus (ex: [3, 1])
    matchLength?: number;
    scoreX?: number;
    scoreO?: number;
    cubeValue?: number;
    cubeOwner?: Player | null;

    // Solution certifiée par le moteur
    optimalNotation: string; // ex: "8/5 6/5" ou "24/20 13/11"
    acceptableNotations?: string[]; // Variantes proches (equityLoss < seuil)
    equityLossThreshold?: number; // Tolérance d'équité (défaut: 0.025)
}

export interface PuzzleValidationResult {
    isCorrect: boolean;
    verdict: 'optimal' | 'acceptable' | 'blunder';
    equityLoss: number;
    playedNotation: string;
    optimalNotation: string;
    explanation: string;
    analysis?: AnalyzeMovesResult;
}

export interface DailyPuzzleStats {
    currentStreak: number;
    maxStreak: number;
    lastCompletedDate: string | null; // format "YYYY-MM-DD"
    solvedPuzzleIds: string[];
    totalSolved: number;
    totalAttempted: number;
}
