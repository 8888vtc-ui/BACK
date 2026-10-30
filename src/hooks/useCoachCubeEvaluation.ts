'use client';

/**
 * Sous-hook d'évaluation des décisions de videau pour le Coach IA.
 * Détecte les offres, takes et drops via l'historique ou les transitions d'état.
 */

import { useCallback, useEffect, useRef } from 'react';
import type { BoardState, Player } from '../engine/backgammonEngine';
import type { GameResult } from '../engine/aiHeuristics';
import {
    analyzeCubeDecision,
    mapGameCubeAction,
    type CubeAction,
    type CubeActionType,
    type CubeCoachResult,
} from '../features/coach/cubeCoach';
import { buildCubeNotification } from '../features/coach/cubeNotification';
import { shouldNotify, type CoachNotificationLevel } from '../features/coach/coachNotificationSettings';
import { soundEngine } from '../lib/sound/soundEngine';
import { toast } from '../components/toast/ToastContext';
import type { CoachVerdict } from '../features/coach/logAnalyzer';
import type { CoachHighlight } from '../components/board/boardThemes';
import type { LastMoveFeedback } from './useCoachStats';

export interface CoachCubeState {
    verdict: 'optimal' | 'good' | 'inaccuracy' | 'blunder';
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    explanation: string | null;
    summary?: string;
    tacticalSummary?: string;
    positionKey?: string;
    boardBefore?: number[];
}

export interface CoachMoveHistoryItem {
    board?: number[];
    usedDice?: boolean[];
    type?: CubeActionType | string;
    action?: CubeActionType | string;
    player?: Player;
    state?: BoardState;
}

export interface UseCoachCubeEvaluationParams {
    gameState: BoardState;
    moveHistory?: ReadonlyArray<CoachMoveHistoryItem>;
    doublingOfferedBy?: Player | null;
    phase?: string;
    gameResult?: GameResult | null;
    notificationLevel: CoachNotificationLevel;
    recordDecisionStats: (
        verdict: CoachVerdict,
        rawEquityLoss: number,
        playedMove: string,
        optimalMove: string,
    ) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback | null) => void;
    setCoach: (state: CoachCubeState | null) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    onCoachTriggered?: () => void;
}

const CUBE_PLAYED_LABEL: Record<CubeAction, string> = {
    double: 'Videau : Doubler (×2)',
    take: 'Videau : Prendre (Take)',
    pass: 'Videau : Passer (Pass)',
    missed_double: 'Videau : Non doublé (Lancer direct)',
};

export function useCoachCubeEvaluation({
    gameState,
    moveHistory,
    doublingOfferedBy,
    phase,
    gameResult,
    notificationLevel,
    recordDecisionStats,
    setLastMoveFeedback,
    setCoach,
    setCoachHighlight,
    onCoachTriggered,
}: UseCoachCubeEvaluationParams) {
    const lastCubeEvalKeyRef = useRef<string | null>(null);
    const prevDoublingOfferedByRef = useRef<Player | null>(null);
    const stateBeforeCubeOfferRef = useRef<BoardState | null>(null);

    const evaluateCubeAction = useCallback(
        (action: CubeActionType | CubeAction, stateOverride?: BoardState): CubeCoachResult => {
            const normalizedAction = mapGameCubeAction(action) ?? 'double';
            const evalState: BoardState = stateOverride ?? gameState;
            const cubeRes = analyzeCubeDecision(evalState, normalizedAction);
            const loss =
                cubeRes.equityLoss ??
                (cubeRes.verdict === 'blunder'
                    ? -0.12
                    : cubeRes.verdict === 'inaccuracy'
                      ? -0.045
                      : cubeRes.verdict === 'good'
                        ? -0.015
                        : 0);
            const playedLabel = CUBE_PLAYED_LABEL[normalizedAction];

            recordDecisionStats(cubeRes.verdict, loss, playedLabel, cubeRes.optimalAction);

            setLastMoveFeedback({
                verdict: cubeRes.verdict,
                equityLoss: loss,
                playedMove: playedLabel,
                timestamp: Date.now(),
            });

            const notif = buildCubeNotification(cubeRes, notificationLevel);
            if (notif) {
                if (notif.type === 'warning') {
                    toast.warning(notif.message, notif.title);
                } else {
                    toast.info(notif.message, notif.title);
                }
            }

            if (cubeRes.verdict !== 'optimal' && shouldNotify(cubeRes.verdict, notificationLevel)) {
                if (cubeRes.verdict === 'blunder') {
                    soundEngine.playBlunderAlert();
                }
                setCoach({
                    verdict: cubeRes.verdict,
                    equityLoss: loss,
                    playedMove: playedLabel,
                    optimalMove: cubeRes.optimalAction,
                    explanation: `${cubeRes.explanation} ${cubeRes.advice}`.trim(),
                    summary: cubeRes.explanation,
                    tacticalSummary: cubeRes.advice,
                    positionKey: evalState.board.join(','),
                    boardBefore: [...evalState.board],
                });
                setCoachHighlight(null);
                onCoachTriggered?.();
            }

            return cubeRes;
        },
        [gameState, notificationLevel, onCoachTriggered, recordDecisionStats, setCoach, setCoachHighlight, setLastMoveFeedback],
    );

    useEffect(() => {
        const history = moveHistory ?? [];
        if (history.length > 0) {
            const lastItem = history[history.length - 1];
            const rawCubeType = lastItem.type ?? lastItem.action;
            const mapped = mapGameCubeAction(rawCubeType);
            if (mapped && (!lastItem.player || lastItem.player === 'X')) {
                const key = `hist:${history.length}:${rawCubeType}:${(lastItem.state ?? gameState).cubeValue}`;
                if (lastCubeEvalKeyRef.current !== key) {
                    lastCubeEvalKeyRef.current = key;
                    evaluateCubeAction(mapped, lastItem.state ?? gameState);
                }
                return;
            }
        }

        const prevOfferedBy = prevDoublingOfferedByRef.current;
        const currOfferedBy = doublingOfferedBy ?? null;

        if (currOfferedBy === 'O' && prevOfferedBy !== 'O') {
            stateBeforeCubeOfferRef.current = { ...gameState, board: [...gameState.board] };
        } else if (currOfferedBy === 'X' && prevOfferedBy !== 'X') {
            const key = `offer:${gameState.scoreX}-${gameState.scoreO}:${gameState.cubeValue}:${gameState.board.join(',')}`;
            if (lastCubeEvalKeyRef.current !== key) {
                lastCubeEvalKeyRef.current = key;
                evaluateCubeAction('OFFER_DOUBLE', gameState);
            }
        } else if (prevOfferedBy === 'O' && currOfferedBy === null) {
            const snapshot = stateBeforeCubeOfferRef.current ?? gameState;
            const isPass = phase === 'GAME_OVER' || gameResult?.winType === 'pass';
            const decisionType: CubeActionType = isPass ? 'PASS_DOUBLE' : 'TAKE_DOUBLE';
            const key = `${decisionType}:${snapshot.scoreX}-${snapshot.scoreO}:${snapshot.cubeValue}:${snapshot.board.join(',')}`;
            if (lastCubeEvalKeyRef.current !== key) {
                lastCubeEvalKeyRef.current = key;
                evaluateCubeAction(decisionType, snapshot);
            }
            stateBeforeCubeOfferRef.current = null;
        }

        prevDoublingOfferedByRef.current = currOfferedBy;
    }, [moveHistory, doublingOfferedBy, phase, gameResult, gameState, evaluateCubeAction]);

    return { evaluateCubeAction };
}
