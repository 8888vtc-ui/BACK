import type { BoardState, MoveSequence } from '../../engine/backgammonEngine';
import {
    selectBestOpponentSequence,
    type AIDifficulty,
} from '../../engine/aiHeuristics';
import {
    analyzeBoardMoves,
    findBestBoardMove,
} from '../../lib/engine/evaluator';
import { selectBotMoveWithBgsage } from '../../lib/engine/bgsageClient';
import { findOpeningBookSequenceForOpponent, isInitialBoardPosition } from '../../features/openings';

export interface ResolveOpponentMoveParams {
    stateWithDice: BoardState;
    currentBoard: number[];
    rolledDice: [number, number];
    legalSeqs: MoveSequence[];
    difficulty: AIDifficulty;
    computeHardDeadlineMs: number;
    isCustomTestTiming: boolean;
}

export function pickOpeningBook(
    board: number[],
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    try {
        if (difficulty !== 'beginner' && isInitialBoardPosition(board)) {
            return findOpeningBookSequenceForOpponent(board, rolledDice, legalSeqs);
        }
    } catch {
        // Livre indisponible : on continue avec les moteurs
    }
    return null;
}

export function pickLocalMove(
    stateWithDice: BoardState,
    rolledDice: [number, number],
    legalSeqs: MoveSequence[],
    difficulty: AIDifficulty,
): MoveSequence | null {
    try {
        if (difficulty === 'expert' || difficulty === 'grandmaster') {
            const unified = findBestBoardMove(stateWithDice, rolledDice, 2);
            if (unified?.sequence) return unified.sequence;
        }
        if (difficulty === 'intermediate') {
            const unified = findBestBoardMove(stateWithDice, rolledDice, 1);
            if (unified?.sequence) return unified.sequence;
        }
        if (difficulty === 'beginner') {
            const analysis = analyzeBoardMoves(stateWithDice, rolledDice, {
                candidateMoves: legalSeqs,
                ply: 1,
                maxMoves: 64,
            });
            if (analysis.moves.length > 0) {
                let bestMove = analysis.moves[0];
                let bestNoisyEq = -Infinity;
                for (const cand of analysis.moves) {
                    const noisyEq = cand.equity + (Math.random() - 0.5) * 0.28;
                    if (noisyEq > bestNoisyEq && cand.moves && cand.board) {
                        bestNoisyEq = noisyEq;
                        bestMove = cand;
                    }
                }
                if (bestMove.moves && bestMove.board) {
                    return { moves: bestMove.moves, board: bestMove.board };
                }
            }
        }
    } catch {
        // Repli sur l'heuristique ci-dessous
    }
    try {
        return selectBestOpponentSequence(legalSeqs, 'O', difficulty);
    } catch {
        return legalSeqs[0] ?? null;
    }
}

export async function resolveOpponentMoveSequence({
    stateWithDice,
    currentBoard,
    rolledDice,
    legalSeqs,
    difficulty,
    computeHardDeadlineMs,
    isCustomTestTiming,
}: ResolveOpponentMoveParams): Promise<MoveSequence | null> {
    const book = pickOpeningBook(currentBoard, rolledDice, legalSeqs, difficulty);
    if (book) return book;

    if (isCustomTestTiming || legalSeqs.length <= 1) {
        return pickLocalMove(stateWithDice, rolledDice, legalSeqs, difficulty);
    }

    try {
        const sageChoice = await selectBotMoveWithBgsage(
            stateWithDice,
            legalSeqs,
            difficulty,
            computeHardDeadlineMs,
        );
        return sageChoice?.sequence ?? pickLocalMove(stateWithDice, rolledDice, legalSeqs, difficulty);
    } catch {
        return pickLocalMove(stateWithDice, rolledDice, legalSeqs, difficulty);
    }
}
