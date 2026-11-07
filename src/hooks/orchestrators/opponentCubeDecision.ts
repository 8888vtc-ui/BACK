import type { BoardState } from '../../engine/backgammonEngine';
import { isInitialBoardPosition } from '../../features/openings';
import { evaluateBotCubeWithBgsage } from '../../lib/engine/bgsageClient';
import { CUBE_DECISION_BUDGET_MS } from '../../lib/gameFeel/speedPresets';
import type { AIDifficulty } from '../../engine/aiHeuristics';

export function canOpponentDouble(
    boardState: BoardState,
    matchLength: number,
    difficulty?: AIDifficulty,
    matchLogLength: number = 0,
): boolean {
    const isBotDmp = matchLength > 0 && boardState.scoreX === matchLength - 1 && boardState.scoreO === matchLength - 1;
    const isBotOneAway = matchLength > 0 && boardState.scoreO === matchLength - 1;
    const isBeginnerGate =
        difficulty === 'beginner' ||
        (typeof window !== 'undefined' &&
            (window.localStorage?.getItem('bgtour_tier_gate') === 'BEGINNER' ||
                window.location?.search.includes('gate=beginner') ||
                window.location?.search.includes('start=guided')));
    const minTurnsBeforeCube = isBeginnerGate ? 16 : 6;

    return (
        matchLogLength >= minTurnsBeforeCube &&
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
        return sageCube.shouldDouble;
    } catch {
        return false;
    }
}
