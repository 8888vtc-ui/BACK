import { useState, useCallback, useEffect, useMemo } from 'react';
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
    const [matchStatsO] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);

    // Source unique de vérité pour matchStats : reconstruit de manière déterministe depuis coachHistory
    // dédupliqué par turnIndex. Empêche tout double comptage (PR gonflé) ou désynchronisation lors d'un Rewind.
    const matchStats = useMemo<MatchStats>(() => {
        if (coachHistory.length === 0) return INITIAL_MATCH_STATS;

        const deduplicatedByTurn = new Map<string, CoachAnalysisHistoryEntry>();
        let cubeFallbackIdx = 0;
        for (const entry of coachHistory) {
            const key = entry.turnIndex > 0 ? `turn:${entry.turnIndex}` : `cube:${cubeFallbackIdx++}:${entry.timestamp}`;
            deduplicatedByTurn.set(key, entry);
        }

        let rebuilt = INITIAL_MATCH_STATS;
        for (const entry of deduplicatedByTurn.values()) {
            if (entry.isUnforced === false) continue;
            rebuilt = appendDecisionToMatchStats(
                rebuilt,
                entry.coachState.verdict,
                entry.coachState.equityLoss,
                entry.coachState.playedMove,
                entry.coachState.optimalMove,
            );
        }
        return rebuilt;
    }, [coachHistory]);

    // Réinitialise les indicateurs visuels lors d'une nouvelle manche
    useEffect(() => {
        if (coachHistory.length === 0) {
            setOptimalStreak(0);
            setBrilliantMove(false);
            setLastMoveFeedback(null);
        }
    }, [coachHistory.length]);

    const recordDecisionStats = useCallback(
        (verdict: CoachVerdict, _rawEquityLoss: number, _playedMove: string, _optimalMove: string) => {
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
