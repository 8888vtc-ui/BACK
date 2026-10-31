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
import { isVisuallyObviousBestMove } from '../../features/personas/botPersonas';
import {
    selectHumanCalibratedMove,
    type BotPrErrorBudgetState,
} from '../../engine/humanBotController';

let sessionBotBudget: BotPrErrorBudgetState = {
    totalEmgLost: 0,
    unforcedDecisions: 0,
};

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
        if (difficulty === 'intermediate' || difficulty === 'beginner') {
            const analysis = analyzeBoardMoves(stateWithDice, rolledDice, {
                candidateMoves: legalSeqs,
                ply: 1,
                maxMoves: 64,
            });
            const validMoves = analysis.moves.filter(
                (m): m is typeof m & { moves: MoveSequence['moves']; board: number[] } =>
                    Boolean(m.moves && m.board),
            );
            if (validMoves.length > 0) {
                const topBoard = validMoves[0].board;
                if (isVisuallyObviousBestMove(stateWithDice.board, topBoard, stateWithDice.turn)) {
                    return { moves: validMoves[0].moves, board: topBoard };
                }
                const calibrated = selectHumanCalibratedMove({
                    boardBefore: stateWithDice.board,
                    candidates: validMoves.map((m, idx) => ({
                        id: `${idx}-${m.notation}`,
                        sequence: { moves: m.moves, board: m.board },
                        trueEquity: m.equity,
                    })),
                    difficulty,
                    player: stateWithDice.turn,
                    budgetState: sessionBotBudget,
                });
                sessionBotBudget = calibrated.updatedBudget;
                return calibrated.selected.sequence;
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
    if (legalSeqs.length === 0) return null;
    if (legalSeqs.length === 1) return legalSeqs[0];

    const book = pickOpeningBook(currentBoard, rolledDice, legalSeqs, difficulty);
    if (book) return book;

    // Uniquement pour les tests unitaires synchrones qui injectent un opponentDelayMs explicite
    if (isCustomTestTiming) {
        return pickLocalMove(stateWithDice, rolledDice, legalSeqs, difficulty);
    }

    // En jeu réel, tout passe obligatoirement par le moteur neuronal web Open Sage (avec retry automatique)
    const primaryTimeoutMs = Math.max(computeHardDeadlineMs, 4500);
    try {
        const sageChoice = await selectBotMoveWithBgsage(
            stateWithDice,
            legalSeqs,
            difficulty,
            primaryTimeoutMs,
        );
        if (sageChoice?.sequence) {
            return sageChoice.sequence;
        }
    } catch {
        // Retry sur le moteur neuronal web ci-dessous
    }

    try {
        const fallbackDifficulty: AIDifficulty =
            difficulty === 'grandmaster' ? 'expert' : difficulty;
        const retryChoice = await selectBotMoveWithBgsage(
            stateWithDice,
            legalSeqs,
            fallbackDifficulty,
            4500,
        );
        if (retryChoice?.sequence) {
            return retryChoice.sequence;
        }
    } catch {
        // Dernier recours si le réseau client est totalement coupé
    }

    return legalSeqs[0] ?? null;
}
