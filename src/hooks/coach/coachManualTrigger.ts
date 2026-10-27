import type { MutableRefObject } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import { movesFromBoardDiff } from '../../features/coach/coachMoveNotation';
import { runManualTriggerAnalysis } from '../useCoachTrigger';
import { buildFallbackTriggerCoachState, type CoachState, type CoachMoveHistoryItem } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';
import type { MatchLogEntry } from '../../actions/types';

export interface ExecuteManualTriggerParams {
    gameState: BoardState;
    gameDice: [number, number] | null;
    gameMoveHistory?: ReadonlyArray<CoachMoveHistoryItem>;
    gameMatchLog?: ReadonlyArray<MatchLogEntry>;
    currentTurnDiceRef: MutableRefObject<[number, number] | null>;
    currentTurnMovesRef: MutableRefObject<unknown[]>;
    turnBoardBeforeRef: MutableRefObject<number[]>;
    isStale: () => boolean;
    setCoach: (coach: CoachState | null) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    speakCoachVoice: (text: string) => void;
    onCoachTriggered?: () => void;
}

export async function executeManualTrigger({
    gameState,
    gameDice,
    gameMoveHistory,
    gameMatchLog,
    currentTurnDiceRef,
    currentTurnMovesRef,
    turnBoardBeforeRef,
    isStale,
    setCoach,
    setCoachHighlight,
    speakCoachVoice,
    onCoachTriggered,
}: ExecuteManualTriggerParams): Promise<void> {
    onCoachTriggered?.();

    const evalDice: [number, number] = currentTurnDiceRef.current ?? gameDice ?? [3, 1];
    const firstHistBoard = gameMoveHistory?.[0]?.board;
    const hasPendingMoves =
        Boolean(gameDice) &&
        ((gameMoveHistory && gameMoveHistory.length > 0) || currentTurnMovesRef.current.length > 0);
    const boardToEval =
        gameDice && firstHistBoard && firstHistBoard.length === 26
            ? [...firstHistBoard]
            : gameDice && currentTurnMovesRef.current.length > 0 && turnBoardBeforeRef.current.length === 26
              ? [...turnBoardBeforeRef.current]
              : [...gameState.board];
    const stateToEval: BoardState = { ...gameState, board: boardToEval, dice: evalDice, turn: 'X' };

    const pendingMoves = hasPendingMoves ? movesFromBoardDiff(boardToEval, gameState.board, 'X') : [];
    const pendingEntry =
        hasPendingMoves && pendingMoves.length > 0
            ? {
                  turnIndex: (gameMatchLog?.length ?? 0) + 1,
                  player: 'X' as const,
                  dice: [evalDice[0], evalDice[1]] as const,
                  boardBefore: boardToEval,
                  movePlayed: pendingMoves,
                  boardAfter: [...gameState.board],
              }
            : undefined;

    try {
        const { coachState, highlight } = await runManualTriggerAnalysis(
            stateToEval,
            evalDice,
            gameMatchLog,
            Boolean(gameDice),
            pendingEntry,
        );
        if (isStale()) return;
        setCoach(coachState);
        setCoachHighlight(highlight);
        const summaryText = coachState.summary || coachState.tacticalSummary || coachState.explanation || '';
        if (summaryText) speakCoachVoice(summaryText);
    } catch (err) {
        if (isStale()) return;
        console.warn('[Coach] Moteur ou worker indisponible, repli sur featureExtractor :', err);
        setCoach(buildFallbackTriggerCoachState(gameState));
    }
}
