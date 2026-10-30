'use client';

/**
 * Hook de logique Coach IA — analyse temps réel des coups et du videau (< 200 lignes, 0 any).
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import type { BoardState, Player } from '../engine/backgammonEngine';
import { useCoachVoice } from './useCoachVoice';
import {
    readStoredNotificationLevel,
    writeStoredNotificationLevel,
    type CoachNotificationLevel,
} from '../features/coach/coachNotificationSettings';
import {
    type CoachAnalysisHistoryEntry, type CoachMoveHistoryItem, type CoachState,
    type EvaluatedMove, type LastMoveFeedback, type MatchStats,
    type UseCoachDeps, type UseCoachResult,
} from './useCoachHelpers';
import { useCoachCubeEvaluator } from './coach/useCoachCubeEvaluator';
import { useCoachLogAnalyzer } from './coach/useCoachLogAnalyzer';
import { executeManualTrigger } from './coach/coachManualTrigger';
import { useCoachMatchStats } from './coach/useCoachMatchStats';
import { useCoachHistoryState } from './coach/useCoachHistoryState';
import { useCoachRoundWatcher } from './coach/useCoachRoundWatcher';
import { useCoachReplay } from './coach/useCoachReplay';

export type { CoachState, EvaluatedMove, MatchStats, LastMoveFeedback, CoachAnalysisHistoryEntry, CoachMoveHistoryItem, UseCoachDeps, UseCoachResult };

export function useCoach({
    game,
    currentTurnMovesRef,
    currentTurnDiceRef,
    turnBoardBeforeRef,
    onCoachTriggered,
}: UseCoachDeps): UseCoachResult {
    const {
        coach, setCoach,
        coachHighlight, setCoachHighlight,
        coachHistory, setCoachHistory,
        selectedCoachHistoryIndex, setSelectedCoachHistoryIndex,
        selectCoachHistoryIndex,
    } = useCoachHistoryState();

    const {
        matchStats, matchStatsO,
        optimalStreak, brilliantMove, setBrilliantMove,
        lastMoveFeedback, setLastMoveFeedback,
        recordDecisionStats,
    } = useCoachMatchStats(coachHistory);

    const lastPlayerEvalRef = useRef<string | null>(null);
    const lastCubeEvalKeyRef = useRef<string | null>(null);
    const prevDoublingOfferedByRef = useRef<Player | null>(null);
    const stateBeforeCubeOfferRef = useRef<BoardState | null>(null);
    const prevHumanRollKeyRef = useRef<string>('');
    const analysisRequestIdRef = useRef(0);
    const activeAbortRef = useRef<AbortController | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // ANTI-HYDRATATION : valeur initiale constante (identique SSR/CSR), puis
    // synchronisation de la préférence persistée après le montage (jamais pendant le rendu).
    const [notificationLevel, setNotificationLevelState] = useState<CoachNotificationLevel>('all');
    const { speak: speakCoachVoice, stop: stopCoachVoice } = useCoachVoice();

    useEffect(() => {
        setNotificationLevelState(readStoredNotificationLevel('all'));
    }, []);

    const setNotificationLevel = useCallback((level: CoachNotificationLevel) => {
        setNotificationLevelState(level);
        writeStoredNotificationLevel(level);
    }, []);

    const cancelActiveOperation = useCallback((): { requestId: number; controller: AbortController } => {
        activeAbortRef.current?.abort();
        stopCoachVoice();
        const controller = new AbortController();
        activeAbortRef.current = controller;
        analysisRequestIdRef.current += 1;
        return { requestId: analysisRequestIdRef.current, controller };
    }, [stopCoachVoice]);

    useEffect(() => () => { activeAbortRef.current?.abort(); }, []);

    const { evaluateCubeAction } = useCoachCubeEvaluator({
        cancelActiveOperation,
        gameState: game.state,
        notificationLevel,
        coachHistoryLength: coachHistory.length,
        recordDecisionStats,
        setLastMoveFeedback,
        setCoachHistory,
        setSelectedCoachHistoryIndex,
        setCoach,
        setCoachHighlight,
        speakCoachVoice,
        onCoachTriggered,
    });

    useCoachRoundWatcher({
        moveHistory: game.moveHistory,
        matchLog: game.matchLog,
        doublingOfferedBy: game.doublingOfferedBy,
        phase: game.phase,
        gameResult: game.gameResult,
        state: game.state,
        dice: game.dice,
        currentTurnMovesRef,
        cancelActiveOperation,
        lastPlayerEvalRef,
        lastCubeEvalKeyRef,
        prevHumanRollKeyRef,
        prevDoublingOfferedByRef,
        stateBeforeCubeOfferRef,
        setCoach,
        setCoachHighlight,
        setLastMoveFeedback,
        setCoachHistory,
        setSelectedCoachHistoryIndex,
        evaluateCubeAction,
    });

    useCoachLogAnalyzer({
        matchLog: game.matchLog,
        gameState: game.state,
        lastPlayerEvalRef,
        analysisRequestIdRef,
        cancelActiveOperation,
        evaluateCubeAction,
        recordDecisionStats,
        setBrilliantMove,
        setLastMoveFeedback,
        setCoachHistory,
        setSelectedCoachHistoryIndex,
        notificationLevel,
        setCoach,
        setCoachHighlight,
        speakCoachVoice,
        onCoachTriggered,
    });

    const { dismissCoach, replayMove } = useCoachReplay({
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
    });

    const triggerCoach = useCallback(async () => {
        const { requestId, controller } = cancelActiveOperation();
        const isStale = () => controller.signal.aborted || analysisRequestIdRef.current !== requestId;
        setIsAnalyzing(true);

        try {
            await executeManualTrigger({
                gameState: game.state,
                gameDice: game.dice,
                gameMoveHistory: game.moveHistory,
                gameMatchLog: game.matchLog,
                currentTurnDiceRef,
                currentTurnMovesRef,
                turnBoardBeforeRef,
                isStale,
                setCoach,
                setCoachHighlight,
                speakCoachVoice,
                onCoachTriggered,
            });
        } finally {
            if (!isStale()) setIsAnalyzing(false);
        }
    }, [cancelActiveOperation, currentTurnDiceRef, currentTurnMovesRef, game.dice, game.matchLog, game.moveHistory, game.state, onCoachTriggered, setCoach, setCoachHighlight, speakCoachVoice, turnBoardBeforeRef]);

    return {
        coach,
        coachHighlight,
        coachHistory,
        selectedCoachHistoryIndex,
        selectCoachHistoryIndex,
        matchStats,
        matchStatsX: matchStats,
        matchStatsO,
        optimalStreak,
        brilliantMove,
        isAnalyzing,
        lastMoveFeedback,
        notificationLevel,
        setNotificationLevel,
        evaluateCubeAction,
        dismissCoach,
        replayMove,
        triggerCoach,
    };
}
