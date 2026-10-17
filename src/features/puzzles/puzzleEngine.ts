/**
 * Moteur de Validation des Réponses de Puzzles.
 *
 * Compare le coup joué par l'utilisateur avec la solution certifiée par le moteur :
 * 1. Analyse exhaustive par le moteur déterministe (analyzeBoardMoves).
 * 2. Vérification d'équité (Equity Loss).
 * 3. Attribution du verdict :
 *    - 'optimal' : Coup parfait (perte d'équité nulle).
 *    - 'acceptable' : Variante proche ou tolérée (perte d'équité <= 0.025).
 *    - 'blunder' : Erreur tactique ou stratégique.
 */

import {
    Move,
    BoardState,
} from '../../engine/backgammonEngine';
import {
    analyzeBoardMoves,
    formatMoveSequenceNotation,
} from '../../lib/engine/evaluator';
import type { BackgammonPuzzle, PuzzleValidationResult } from './types';

/**
 * Nettoie une notation pour faciliter la comparaison (retire les astérisques de frappe et espaces superflus).
 */
export function normalizeNotation(notation: string): string {
    return notation
        .replace(/\*/g, '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .sort() // Ordonne les coups individuels (ex: "8/5 6/5" équivaut à "6/5 8/5")
        .join(' ');
}

/**
 * Valide le coup joué par le joueur pour un puzzle donné.
 */
export function validatePuzzleMove(
    puzzle: BackgammonPuzzle,
    playerMoves: Move[],
    resultingBoard?: number[],
): PuzzleValidationResult {
    const player = puzzle.turn;
    const playedNotation = formatMoveSequenceNotation(playerMoves, player);

    const puzzleState: BoardState = {
        board: puzzle.initialBoard,
        turn: puzzle.turn,
        cubeValue: puzzle.cubeValue ?? 1,
        cubeOwner: puzzle.cubeOwner ?? null,
        dice: puzzle.dice,
        matchLength: puzzle.matchLength ?? 7,
        scoreX: puzzle.scoreX ?? 0,
        scoreO: puzzle.scoreO ?? 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };

    // Analyse du moteur pour trouver les équités de référence
    const analysis = analyzeBoardMoves(puzzleState, puzzle.dice, { ply: 2, maxMoves: 8 });

    // 1. Vérification par notation directe normalisée
    const normalizedPlayed = normalizeNotation(playedNotation);
    const normalizedOptimal = normalizeNotation(puzzle.optimalNotation);
    const normalizedAcceptables = (puzzle.acceptableNotations ?? []).map(normalizeNotation);

    const isDirectMatch =
        normalizedPlayed === normalizedOptimal || normalizedAcceptables.includes(normalizedPlayed);

    if (isDirectMatch) {
        return {
            isCorrect: true,
            verdict: 'optimal',
            equityLoss: 0,
            playedNotation,
            optimalNotation: puzzle.optimalNotation,
            explanation: puzzle.explanation,
            analysis,
        };
    }

    // 2. Recherche du coup joué dans les candidats évalués par le moteur
    const evaluatedMove = analysis.moves.find(
        (m) => normalizeNotation(m.notation) === normalizedPlayed,
    );

    const threshold = puzzle.equityLossThreshold ?? 0.025;
    const equityLoss = evaluatedMove ? Math.abs(evaluatedMove.equityLoss) : 0.08;

    if (equityLoss <= threshold) {
        return {
            isCorrect: true,
            verdict: 'acceptable',
            equityLoss: Number(equityLoss.toFixed(4)),
            playedNotation,
            optimalNotation: puzzle.optimalNotation,
            explanation: `Variante acceptable (perte d’équité minime de -${equityLoss.toFixed(3)}). ${puzzle.explanation}`,
            analysis,
        };
    }

    // 3. Verdict Blunder / Inexact
    return {
        isCorrect: false,
        verdict: 'blunder',
        equityLoss: Number(equityLoss.toFixed(4)),
        playedNotation,
        optimalNotation: puzzle.optimalNotation,
        explanation: `Inexactitude tactique (perte d’équité de -${equityLoss.toFixed(3)} par rapport au coup optimal ${puzzle.optimalNotation}). ${puzzle.explanation}`,
        analysis,
    };
}
