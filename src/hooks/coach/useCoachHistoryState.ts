import { useState, useCallback } from 'react';
import type { CoachState, CoachAnalysisHistoryEntry } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';

export function useCoachHistoryState() {
    const [coach, setCoach] = useState<CoachState | null>(null);
    const [coachHighlight, setCoachHighlight] = useState<CoachHighlight | null>(null);
    const [coachHistory, setCoachHistory] = useState<CoachAnalysisHistoryEntry[]>([]);
    const [selectedCoachHistoryIndex, setSelectedCoachHistoryIndex] = useState<number | null>(null);

    const selectCoachHistoryIndex = useCallback(
        (index: number | null) => {
            if (index === null || index < 0 || index >= coachHistory.length) {
                setSelectedCoachHistoryIndex(null);
                const latest = coachHistory[coachHistory.length - 1];
                if (latest) {
                    setCoach(latest.coachState);
                    setCoachHighlight(latest.highlight);
                }
                return;
            }
            setSelectedCoachHistoryIndex(index);
            const entry = coachHistory[index];
            if (entry) {
                setCoach(entry.coachState);
                setCoachHighlight(entry.highlight);
            }
        },
        [coachHistory],
    );

    return {
        coach,
        setCoach,
        coachHighlight,
        setCoachHighlight,
        coachHistory,
        setCoachHistory,
        selectedCoachHistoryIndex,
        setSelectedCoachHistoryIndex,
        selectCoachHistoryIndex,
    };
}
