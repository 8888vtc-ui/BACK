import { useCallback, type MutableRefObject } from 'react';
import type { CoachAnalysisHistoryEntry, CoachState, LastMoveFeedback } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';
import type { MatchLogEntry } from '../../actions/types';

export interface UseCoachReplayParams {
    cancelActiveOperation: () => void;
    selectedCoachHistoryIndex: number | null;
    coachHistory: CoachAnalysisHistoryEntry[];
    coach: CoachState | null;
    lastMoveFeedback?: LastMoveFeedback | null;
    game: {
        rewindToLogTurn?: (turnIndex?: number) => void;
        undoMove: () => void;
        matchLog?: ReadonlyArray<MatchLogEntry>;
    };
    lastPlayerEvalRef: MutableRefObject<string | null>;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void;
    setCoach: (coach: CoachState | null) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback | null) => void;
    setIsAnalyzing: (analyzing: boolean) => void;
}

export function useCoachReplay({
    cancelActiveOperation,
    selectedCoachHistoryIndex,
    coachHistory,
    coach,
    lastMoveFeedback,
    game,
    lastPlayerEvalRef,
    setCoachHistory,
    setSelectedCoachHistoryIndex,
    setCoach,
    setCoachHighlight,
    setLastMoveFeedback,
    setIsAnalyzing,
}: UseCoachReplayParams) {
    const dismissCoach = useCallback(() => {
        cancelActiveOperation();
        setCoach(null);
        setCoachHighlight(null);
        setLastMoveFeedback(null);
        setSelectedCoachHistoryIndex(null);
        setIsAnalyzing(false);
    }, [cancelActiveOperation, setCoach, setCoachHighlight, setLastMoveFeedback, setSelectedCoachHistoryIndex, setIsAnalyzing]);

    const replayMove = useCallback(() => {
        cancelActiveOperation();
        const selectedEntry = selectedCoachHistoryIndex !== null ? coachHistory[selectedCoachHistoryIndex] : undefined;
        const latestHistoryTurn = coachHistory.length > 0 ? coachHistory[coachHistory.length - 1]?.turnIndex : undefined;
        const lastLogXTurn = game.matchLog
            ? [...game.matchLog].reverse().find((e) => e.player === 'X' && e.dice[0] > 0 && e.dice[1] > 0)?.turnIndex
            : undefined;
        const targetTurnIndex =
            selectedEntry?.turnIndex ??
            coach?.turnIndex ??
            lastMoveFeedback?.turnIndex ??
            latestHistoryTurn ??
            lastLogXTurn;

        if (game.rewindToLogTurn) game.rewindToLogTurn(targetTurnIndex);
        else game.undoMove();

        lastPlayerEvalRef.current = null;
        if (targetTurnIndex !== undefined) {
            setCoachHistory((prev) => prev.filter((h) => h.turnIndex < targetTurnIndex));
        } else {
            setCoachHistory((prev) => prev.slice(0, -1));
        }
        setSelectedCoachHistoryIndex(null);
        setCoach(null);
        setCoachHighlight(null);
        setLastMoveFeedback(null);
        setIsAnalyzing(false);
    }, [cancelActiveOperation, coach?.turnIndex, coachHistory, game, lastMoveFeedback?.turnIndex, selectedCoachHistoryIndex, setCoach, setCoachHighlight, setCoachHistory, setIsAnalyzing, setLastMoveFeedback, setSelectedCoachHistoryIndex, lastPlayerEvalRef]);

    return { dismissCoach, replayMove };
}
