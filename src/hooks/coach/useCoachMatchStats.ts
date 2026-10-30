import { useState, useCallback, useEffect, useRef } from 'react';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';
import {
    appendDecisionToMatchStats,
    type CoachAnalysisHistoryEntry,
    type MatchStats,
    type LastMoveFeedback,
} from '../useCoachHelpers';

const INITIAL_MATCH_STATS: MatchStats = {
    decisionsCount: 0,
    totalEquityLoss: 0,
    blundersCount: 0,
    totalErrorRate: 0,
};

export function useCoachMatchStats(coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry> = []) {
    const [matchStats, setMatchStats] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [matchStatsO] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);
    const prevHistoryLenRef = useRef<number>(0);

    // Synchronise matchStats lors d'une nouvelle manche (reset) ou d'un Rewind (« Rejouer ce coup »)
    useEffect(() => {
        const currLen = coachHistory.length;
        const prevLen = prevHistoryLenRef.current;
        prevHistoryLenRef.current = currLen;

        if (currLen < prevLen) {
            if (currLen === 0) {
                setMatchStats(INITIAL_MATCH_STATS);
                setOptimalStreak(0);
                setBrilliantMove(false);
                setLastMoveFeedback(null);
            } else {
                let rebuilt = INITIAL_MATCH_STATS;
                for (const entry of coachHistory) {
                    rebuilt = appendDecisionToMatchStats(
                        rebuilt,
                        entry.coachState.verdict,
                        entry.coachState.equityLoss,
                        entry.coachState.playedMove,
                        entry.coachState.optimalMove,
                    );
                }
                setMatchStats(rebuilt);
            }
        }
    }, [coachHistory]);

    const recordDecisionStats = useCallback(
        (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => {
            setMatchStats((prev) => appendDecisionToMatchStats(prev, verdict, rawEquityLoss, playedMove, optimalMove));
            if (verdict === 'optimal') setOptimalStreak((prev) => prev + 1);
            else if (verdict === 'blunder') setOptimalStreak(0);
        },
        [],
    );

    return {
        matchStats,
        matchStatsO,
        optimalStreak,
        brilliantMove,
        setBrilliantMove,
        lastMoveFeedback,
        setLastMoveFeedback,
        recordDecisionStats,
    };
}
