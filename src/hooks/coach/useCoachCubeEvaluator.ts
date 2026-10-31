import { useCallback } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import type { CubeAction, CubeActionType, CubeCoachResult } from '../../features/coach/cubeCoach';
import { soundEngine } from '../../lib/sound/soundEngine';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';
import type { CoachAnalysisHistoryEntry, CoachState, LastMoveFeedback } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';
import { executeCubeEvaluation } from './coachCubeEvaluator';
import { recordLiveMatchDecisionOnAdaptiveProfile } from '../../features/drills/adaptiveQuizEngine';

export interface UseCoachCubeEvaluatorParams {
    cancelActiveOperation: () => void;
    gameState: BoardState;
    notificationLevel: CoachNotificationLevel;
    coachHistoryLength: number;
    recordDecisionStats: (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback) => void;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void;
    setCoach: (coach: CoachState | null | ((prev: CoachState | null) => CoachState | null)) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    speakCoachVoice: (text: string) => void;
    onCoachTriggered?: () => void;
}

export function useCoachCubeEvaluator({
    cancelActiveOperation,
    gameState,
    notificationLevel,
    coachHistoryLength,
    recordDecisionStats,
    setLastMoveFeedback,
    setCoachHistory,
    setSelectedCoachHistoryIndex,
    setCoach,
    setCoachHighlight,
    speakCoachVoice,
    onCoachTriggered,
}: UseCoachCubeEvaluatorParams) {
    const evaluateCubeAction = useCallback(
        (action: CubeActionType | CubeAction, stateOverride?: BoardState): CubeCoachResult => {
            cancelActiveOperation();
            const evalState: BoardState = stateOverride ?? gameState;
            const res = executeCubeEvaluation({
                action,
                evalState,
                notificationLevel,
                historyLength: coachHistoryLength,
            });

            const cubeCategory = res.cubeRes.playedAction === 'missed_double'
                ? 'Videau oublié (Missed Double)'
                : res.cubeRes.playedAction === 'double'
                  ? 'Erreur de Videau — Double prématuré'
                  : res.cubeRes.playedAction === 'take'
                    ? 'Erreur de Videau — Take trop optimiste'
                    : 'Erreur de Videau — Pass trop frileux';

            recordDecisionStats(res.cubeRes.verdict, res.rawLoss, res.playedLabel, res.cubeRes.optimalAction);
            try {
                recordLiveMatchDecisionOnAdaptiveProfile({
                    board: evalState.board,
                    turnIndex: coachHistoryLength,
                    equityLoss: res.rawLoss,
                    isCube: true,
                });
            } catch {
                // ignore storage errors
            }
            setLastMoveFeedback({
                verdict: res.cubeRes.verdict,
                equityLoss: res.rawLoss,
                playedMove: res.playedLabel,
                optimalMove: res.cubeRes.optimalAction,
                decisionType: 'cube',
                errorCategoryLabel: cubeCategory,
                errorAdvice: `${res.cubeRes.explanation} ${res.cubeRes.advice}`.trim(),
                timestamp: Date.now(),
            });
            setCoachHistory((prev) => [...prev, res.historyEntry]);
            setSelectedCoachHistoryIndex(null);

            if (res.shouldNotifyUser) {
                setCoach(res.cubeCoachState);
                setCoachHighlight(null);
                if (res.cubeRes.verdict === 'blunder') {
                    try { soundEngine.playBlunderAlert(); } catch { /* ignore audio errors */ }
                    speakCoachVoice(res.cubeRes.explanation || res.cubeRes.advice);
                }
                if (res.cubeRes.verdict !== 'optimal') onCoachTriggered?.();
            } else {
                setCoach((prev) => (prev !== null ? res.cubeCoachState : null));
            }
            return res.cubeRes;
        },
        [cancelActiveOperation, coachHistoryLength, gameState, notificationLevel, onCoachTriggered, recordDecisionStats, setCoach, setCoachHighlight, setCoachHistory, setLastMoveFeedback, setSelectedCoachHistoryIndex, speakCoachVoice],
    );

    return { evaluateCubeAction };
}
