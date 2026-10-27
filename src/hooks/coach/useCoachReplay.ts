import { useCallback, type MutableRefObject } from 'react';
import type { CoachAnalysisHistoryEntry, CoachState } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';

export interface UseCoachReplayParams {
    cancelActiveOperation: () => void;
    selectedCoachHistoryIndex: number | null;
    coachHistory: CoachAnalysisHistoryEntry[];
    coach: CoachState | null;
    game: {
        rewindToLogTurn?: (turnIndex?: number) => void;
        undoMove: () => void;
    };
    lastPlayerEvalRef: MutableRefObject<string | null>;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void;
    setCoach: (coach: CoachState | null) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    setIsAnalyzing: (analyzing: boolean) => void;
}

export function useCoachReplay({
    cancelActiveOperation,
    selectedCoachHistoryIndex,
    coachHistory,
    coach,
    game,
    lastPlayerEvalRef,
    setCoachHistory,
    setSelectedCoachHistoryIndex,
    setCoach,
    setCoachHighlight,
    setIsAnalyzing,
}: UseCoachReplayParams) {
    const dismissCoach = useCallback(() => {
        cancelActiveOperation();
        setCoach(null);
        setCoachHighlight(null);
        setSelectedCoachHistoryIndex(null);
        setIsAnalyzing(false);
    }, [cancelActiveOperation, setCoach, setCoachHighlight, setSelectedCoachHistoryIndex, setIsAnalyzing]);

    const replayMove = useCallback(() => {
        cancelActiveOperation();
        const selectedEntry = selectedCoachHistoryIndex !== null ? coachHistory[selectedCoachHistoryIndex] : undefined;
        const targetTurnIndex = selectedEntry?.turnIndex ?? coach?.turnIndex;
        if (game.rewindToLogTurn) game.rewindToLogTurn(targetTurnIndex);
        else game.undoMove();
        lastPlayerEvalRef.current = null;
        if (targetTurnIndex !== undefined) setCoachHistory((prev) => prev.filter((h) => h.turnIndex < targetTurnIndex));
        setSelectedCoachHistoryIndex(null);
        setCoach(null);
        setCoachHighlight(null);
    }, [cancelActiveOperation, coach?.turnIndex, coachHistory, game, selectedCoachHistoryIndex, setCoach, setCoachHighlight, setCoachHistory, setSelectedCoachHistoryIndex, lastPlayerEvalRef]);

    return { dismissCoach, replayMove };
}
