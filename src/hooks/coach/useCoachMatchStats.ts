import { useState, useCallback } from 'react';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';
import { appendDecisionToMatchStats, type MatchStats, type LastMoveFeedback } from '../useCoachHelpers';

const INITIAL_MATCH_STATS: MatchStats = {
    decisionsCount: 0,
    totalEquityLoss: 0,
    blundersCount: 0,
    totalErrorRate: 0,
};

export function useCoachMatchStats() {
    const [matchStats, setMatchStats] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [matchStatsO] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);

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
