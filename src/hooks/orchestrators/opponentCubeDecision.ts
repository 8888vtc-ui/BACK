import type { BoardState } from '../../engine/backgammonEngine';
import { isInitialBoardPosition } from '../../features/openings';
import { evaluateBotCubeWithBgsage } from '../../lib/engine/bgsageClient';
import { CUBE_DECISION_BUDGET_MS } from '../../lib/gameFeel/speedPresets';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import { evaluateHumanCubeHeuristic } from '../../engine/humanBotController';

export function canOpponentDouble(boardState: BoardState, matchLength: number): boolean {
    const isBotDmp = matchLength > 0 && boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
    const isBotOneAway = matchLength > 0 && boardState.scoreO === matchLength - 1;

    return (
        !boardState.crawford &&
        !isBotDmp &&
        !isBotOneAway &&
        !isInitialBoardPosition(boardState.board) &&
        (boardState.cubeOwner === null || boardState.cubeOwner === 'O') &&
        !(matchLength > 0 && (boardState.scoreX >= matchLength || boardState.scoreO >= matchLength))
    );
}

export async function evaluateOpponentDoubleAsync(
    boardState: BoardState,
    difficulty: AIDifficulty,
): Promise<boolean> {
    try {
        const iaCubeState: BoardState = {
            ...boardState,
            turn: 'O',
            dice: null,
        };
        const sageCube = await evaluateBotCubeWithBgsage(iaCubeState, difficulty, CUBE_DECISION_BUDGET_MS);
        if (!sageCube) return false;

        if (difficulty === 'beginner' || difficulty === 'intermediate') {
            const winProb = Math.max(0, Math.min(1, ((sageCube.noDouble ?? 0) + 1) / 2));
            const justHitOpponent = (boardState.board[0] ?? 0) > 0;
            return evaluateHumanCubeHeuristic({
                difficulty,
                winProbability: winProb,
                justHitOpponent,
            }).shouldDouble;
        }

        return sageCube.shouldDouble;
    } catch {
        return false;
    }
}
