'use client';

/**
 * Sous-hook de gestion des métriques et statistiques de performance du Coach.
 * Calcule les compteurs officiels XG2 / Galaxy (PR, taux d'erreur, séries optimales).
 */

import { useCallback, useState } from 'react';
import type { CoachVerdict } from '../features/coach/logAnalyzer';

export interface EvaluatedMove {
    turnNumber: number;
    player: 'X' | 'O';
    verdict: CoachVerdict;
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
}

export interface MatchStats {
    decisionsCount: number;
    totalEquityLoss: number;
    blundersCount: number;
    totalErrorRate?: number;
    evaluatedMoves?: EvaluatedMove[];
    decisionCounters?: {
        optimal: number;
        good: number;
        inaccuracy: number;
        blunder: number;
    };
}

export interface LastMoveFeedback {
    verdict: CoachVerdict;
    equityLoss: number;
    playedMove: string;
    timestamp: number;
}

export interface UseCoachStatsResult {
    matchStats: MatchStats;
    matchStatsX: MatchStats;
    matchStatsO: MatchStats;
    optimalStreak: number;
    brilliantMove: boolean;
    lastMoveFeedback: LastMoveFeedback | null;
    setBrilliantMove: (val: boolean) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback | null) => void;
    recordDecisionStats: (
        verdict: CoachVerdict,
        rawEquityLoss: number,
        playedMove: string,
        optimalMove: string,
    ) => void;
}

export function useCoachStats(): UseCoachStatsResult {
    const [matchStats, setMatchStats] = useState<MatchStats>({
        decisionsCount: 0,
        totalEquityLoss: 0,
        blundersCount: 0,
        totalErrorRate: 0,
    });
    const [matchStatsO] = useState<MatchStats>({
        decisionsCount: 0,
        totalEquityLoss: 0,
        blundersCount: 0,
        totalErrorRate: 0,
    });
    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);

    const recordDecisionStats = useCallback(
        (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => {
            const trueLoss = Math.abs(rawEquityLoss);
            const isBlunder = verdict === 'blunder';

            setMatchStats((prev) => {
                const nextDecisions = prev.decisionsCount + 1;
                const nextLoss = prev.totalEquityLoss + trueLoss;
                const newEval: EvaluatedMove = {
                    turnNumber: nextDecisions,
                    player: 'X',
                    verdict,
                    equityLoss: rawEquityLoss,
                    playedMove,
                    optimalMove,
                };
                const prevCounters = prev.decisionCounters ?? {
                    optimal: 0,
                    good: 0,
                    inaccuracy: 0,
                    blunder: 0,
                };
                const nextCounters = {
                    ...prevCounters,
                    [verdict]: prevCounters[verdict] + 1,
                };
                return {
                    decisionsCount: nextDecisions,
                    totalEquityLoss: nextLoss,
                    blundersCount: prev.blundersCount + (isBlunder ? 1 : 0),
                    totalErrorRate: nextDecisions > 0 ? (nextLoss / nextDecisions) * 500 : 0,
                    evaluatedMoves: [...(prev.evaluatedMoves ?? []), newEval],
                    decisionCounters: nextCounters,
                };
            });

            if (verdict === 'optimal') {
                setOptimalStreak((prev) => prev + 1);
            } else if (isBlunder) {
                setOptimalStreak(0);
            }
        },
        [],
    );

    return {
        matchStats,
        matchStatsX: matchStats,
        matchStatsO,
        optimalStreak,
        brilliantMove,
        lastMoveFeedback,
        setBrilliantMove,
        setLastMoveFeedback,
        recordDecisionStats,
    };
}
