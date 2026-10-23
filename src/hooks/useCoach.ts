'use client';

/**
 * Hook de logique Coach IA — analyse temps réel des coups et du videau (< 290 lignes, 0 any).
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { type BoardState, type Player, serializeXGID } from '../engine/backgammonEngine';
import { analyzeCubeDecision, mapGameCubeAction, type CubeAction, type CubeActionType, type CubeCoachResult } from '../features/coach/cubeCoach';
import { buildCubeNotification } from '../features/coach/cubeNotification';
import { formatCoachMoveSequence, movesFromBoardDiff } from '../features/coach/coachMoveNotation';
import { soundEngine } from '../lib/sound/soundEngine';
import { toast } from '../components/toast/ToastContext';
import type { CoachHighlight } from '../components/board/boardThemes';
import { analyzeHumanMoveFromLogWithBgsage, type CoachVerdict } from '../features/coach/logAnalyzer';
import { shouldNotify, type CoachNotificationLevel } from '../features/coach/coachNotificationSettings';
import {
    appendDecisionToMatchStats,
    buildCoachStateFromLogResult,
    buildFallbackTriggerCoachState,
    CUBE_PLAYED_LABEL,
    type CoachMoveHistoryItem,
    type CoachState,
    type EvaluatedMove,
    type LastMoveFeedback,
    type MatchStats,
    type UseCoachDeps,
    type UseCoachResult,
} from './useCoachHelpers';
import { detectPlayerCubeDecision, runManualTriggerAnalysis } from './useCoachTrigger';

export type { CoachState, EvaluatedMove, MatchStats, LastMoveFeedback, CoachMoveHistoryItem, UseCoachDeps, UseCoachResult };

const INITIAL_MATCH_STATS: MatchStats = {
    decisionsCount: 0,
    totalEquityLoss: 0,
    blundersCount: 0,
    totalErrorRate: 0,
};

export function useCoach({
    game,
    currentTurnMovesRef,
    currentTurnDiceRef,
    turnBoardBeforeRef,
    onCoachTriggered,
}: UseCoachDeps): UseCoachResult {
    const [coach, setCoach] = useState<CoachState | null>(null);
    const [coachHighlight, setCoachHighlight] = useState<CoachHighlight | null>(null);
    const [matchStats, setMatchStats] = useState<MatchStats>(INITIAL_MATCH_STATS);
    const [matchStatsO] = useState<MatchStats>(INITIAL_MATCH_STATS);

    const lastPlayerEvalRef = useRef<string | null>(null);
    const lastCubeEvalKeyRef = useRef<string | null>(null);
    const prevDoublingOfferedByRef = useRef<Player | null>(null);
    const stateBeforeCubeOfferRef = useRef<BoardState | null>(null);
    const analysisRequestIdRef = useRef(0);
    const activeAbortRef = useRef<AbortController | null>(null);

    const [optimalStreak, setOptimalStreak] = useState(0);
    const [brilliantMove, setBrilliantMove] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notificationLevel, setNotificationLevel] = useState<CoachNotificationLevel>('blunder');
    const [lastMoveFeedback, setLastMoveFeedback] = useState<LastMoveFeedback | null>(null);

    const cancelActiveOperation = useCallback((): { requestId: number; controller: AbortController } => {
        activeAbortRef.current?.abort();
        const controller = new AbortController();
        activeAbortRef.current = controller;
        analysisRequestIdRef.current += 1;
        return { requestId: analysisRequestIdRef.current, controller };
    }, []);

    useEffect(() => () => { activeAbortRef.current?.abort(); }, []);

    const recordDecisionStats = useCallback(
        (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => {
            setMatchStats((prev) => appendDecisionToMatchStats(prev, verdict, rawEquityLoss, playedMove, optimalMove));
            if (verdict === 'optimal') setOptimalStreak((prev) => prev + 1);
            else if (verdict === 'blunder') setOptimalStreak(0);
        },
        [],
    );

    const evaluateCubeAction = useCallback(
        (action: CubeActionType | CubeAction, stateOverride?: BoardState): CubeCoachResult => {
            cancelActiveOperation();
            const normalizedAction = mapGameCubeAction(action) ?? 'double';
            const evalState: BoardState = stateOverride ?? game.state;
            const cubeRes = analyzeCubeDecision(evalState, normalizedAction);
            const rawLoss =
                cubeRes.equityLoss ??
                (cubeRes.verdict === 'blunder' ? -0.12 : cubeRes.verdict === 'inaccuracy' ? -0.045 : cubeRes.verdict === 'good' ? -0.015 : 0);
            const playedLabel = CUBE_PLAYED_LABEL[normalizedAction];

            recordDecisionStats(cubeRes.verdict, rawLoss, playedLabel, cubeRes.optimalAction);
            setLastMoveFeedback({ verdict: cubeRes.verdict, equityLoss: rawLoss, playedMove: playedLabel, timestamp: Date.now() });

            const notif = buildCubeNotification(cubeRes, notificationLevel);
            if (notif) {
                if (notif.type === 'warning') toast.warning(notif.message, notif.title);
                else toast.info(notif.message, notif.title);
            }

            if (cubeRes.verdict !== 'optimal' && shouldNotify(cubeRes.verdict, notificationLevel)) {
                if (cubeRes.verdict === 'blunder') soundEngine.playBlunderAlert();
                setCoach({
                    verdict: cubeRes.verdict,
                    equityLoss: rawLoss,
                    playedMove: playedLabel,
                    optimalMove: cubeRes.optimalAction,
                    explanation: `${cubeRes.explanation} ${cubeRes.advice}`.trim(),
                    summary: cubeRes.explanation,
                    tacticalSummary: cubeRes.advice,
                    positionKey: serializeXGID(evalState),
                    boardBefore: [...evalState.board],
                });
                setCoachHighlight(null);
                onCoachTriggered?.();
            }
            return cubeRes;
        },
        [cancelActiveOperation, game.state, notificationLevel, onCoachTriggered, recordDecisionStats],
    );

    // 1. Autorité unifiée de réinitialisation du Coach (nouvelle manche OU nouveau lancer de dés par X)
    useEffect(() => {
        const isNewRound =
            Boolean(game.moveHistory && game.moveHistory.length === 0) &&
            (game.matchLog?.length ?? 0) === 0 &&
            currentTurnMovesRef.current.length === 0 &&
            !game.doublingOfferedBy &&
            game.phase !== 'DOUBLING_OFFERED';
        const isNewHumanRoll = game.state.turn === 'X' && game.dice !== null;

        if (isNewRound || isNewHumanRoll) {
            cancelActiveOperation();
            setCoach(null);
            setCoachHighlight(null);
        }
    }, [game.moveHistory, game.matchLog, game.doublingOfferedBy, game.phase, game.state.turn, game.dice, currentTurnMovesRef, cancelActiveOperation]);

    // 2. Interception des décisions de videau du joueur (`OFFER_DOUBLE`, `TAKE_DOUBLE`, `PASS_DOUBLE`)
    useEffect(() => {
        const { decision, updatedOfferSnapshot, nextPrevOfferedBy } = detectPlayerCubeDecision({
            moveHistory: game.moveHistory,
            doublingOfferedBy: game.doublingOfferedBy,
            prevOfferedBy: prevDoublingOfferedByRef.current,
            stateBeforeCubeOffer: stateBeforeCubeOfferRef.current,
            phase: game.phase,
            gameResult: game.gameResult,
            currentState: game.state,
        });
        stateBeforeCubeOfferRef.current = updatedOfferSnapshot;
        prevDoublingOfferedByRef.current = nextPrevOfferedBy;

        if (decision && lastCubeEvalKeyRef.current !== decision.key) {
            lastCubeEvalKeyRef.current = decision.key;
            evaluateCubeAction(decision.action, decision.stateToEval);
        }
    }, [game.moveHistory, game.doublingOfferedBy, game.phase, game.gameResult, game.state, evaluateCubeAction]);

    // 3. Analyse automatique LOG-DRIVEN des coups de pions du joueur X avec garde anti-désynchronisation
    useEffect(() => {
        const log = game.matchLog ?? [];
        if (log.length === 0) return;

        const lastEntry = log[log.length - 1];
        if (lastEntry.player !== 'X') return;
        const entryKey = `${lastEntry.turnIndex}:${lastEntry.dice[0]}-${lastEntry.dice[1]}`;
        if (lastPlayerEvalRef.current === entryKey) return;
        lastPlayerEvalRef.current = entryKey;

        const cubeNotationAction = mapGameCubeAction(lastEntry.notation);
        if (cubeNotationAction) {
            evaluateCubeAction(cubeNotationAction, { ...game.state, board: [...lastEntry.boardBefore], turn: 'X' });
            return;
        }

        const { requestId, controller } = cancelActiveOperation();
        const isStale = () => controller.signal.aborted || analysisRequestIdRef.current !== requestId;

        void (async () => {
            try {
                const result = await analyzeHumanMoveFromLogWithBgsage({
                    logEntry: lastEntry,
                    localPlayer: 'X',
                    cubeValue: game.state.cubeValue,
                    matchLength: game.state.matchLength,
                    scoreX: game.state.scoreX,
                    scoreO: game.state.scoreO,
                    ply: 2,
                });
                if (isStale() || !result) return;

                const { verdict, equityLoss, isUnforced, candidateMoves } = result;
                const loggedMoves = [...lastEntry.movePlayed];
                const playedMoves =
                    loggedMoves.length > 0 ? loggedMoves : movesFromBoardDiff(lastEntry.boardBefore, lastEntry.boardAfter, 'X');
                const playedNotation = formatCoachMoveSequence(playedMoves, 'X', lastEntry.boardBefore);

                if (isUnforced) {
                    recordDecisionStats(verdict, equityLoss, playedNotation, result.optimalNotation);
                    const secondBest = candidateMoves[1];
                    setBrilliantMove(
                        Math.abs(equityLoss) < 0.0001 && secondBest !== undefined && Math.abs(secondBest.equityLoss) > 0.06,
                    );
                }
                if (isStale()) return;

                setLastMoveFeedback({ verdict, equityLoss, playedMove: playedNotation, timestamp: Date.now() });

                if (verdict !== 'optimal' && shouldNotify(verdict, notificationLevel)) {
                    if (verdict === 'blunder') soundEngine.playBlunderAlert();
                    const { coachState, highlight } = buildCoachStateFromLogResult({
                        lastEntry,
                        result,
                        playedMoves,
                        playedNotation,
                        gameState: game.state,
                    });
                    if (isStale()) return;
                    setCoach(coachState);
                    setCoachHighlight(highlight);
                    onCoachTriggered?.();
                } else {
                    setCoach(null);
                    setCoachHighlight(null);
                }
            } catch (err) {
                if (!isStale()) console.warn('[Coach] Erreur évaluation log-driven tour X :', err);
            }
        })();
    }, [game.matchLog, game.state, onCoachTriggered, notificationLevel, recordDecisionStats, evaluateCubeAction, cancelActiveOperation]);

    const dismissCoach = useCallback(() => {
        cancelActiveOperation();
        setCoach(null);
        setCoachHighlight(null);
        setIsAnalyzing(false);
    }, [cancelActiveOperation]);

    const replayMove = useCallback(() => {
        cancelActiveOperation();
        game.undoMove();
        setCoach(null);
        setCoachHighlight(null);
    }, [cancelActiveOperation, game]);

    const triggerCoach = useCallback(async () => {
        const { requestId, controller } = cancelActiveOperation();
        const isStale = () => controller.signal.aborted || analysisRequestIdRef.current !== requestId;

        setIsAnalyzing(true);
        onCoachTriggered?.();

        const evalDice: [number, number] = currentTurnDiceRef.current ?? game.dice ?? [3, 1];
        const firstHistBoard = game.moveHistory?.[0]?.board;
        const boardToEval =
            game.dice && firstHistBoard && firstHistBoard.length === 26
                ? [...firstHistBoard]
                : game.dice && currentTurnMovesRef.current.length > 0 && turnBoardBeforeRef.current.length === 26
                  ? [...turnBoardBeforeRef.current]
                  : [...game.state.board];
        const stateToEval: BoardState = { ...game.state, board: boardToEval, dice: evalDice, turn: 'X' };

        try {
            const { coachState, highlight } = await runManualTriggerAnalysis(
                stateToEval,
                evalDice,
                game.matchLog,
                Boolean(game.dice),
            );
            if (isStale()) return;
            setCoach(coachState);
            setCoachHighlight(highlight);
        } catch (err) {
            if (isStale()) return;
            console.warn('[Coach] Moteur ou worker indisponible, repli sur featureExtractor :', err);
            setCoach(buildFallbackTriggerCoachState(game.state));
        } finally {
            if (!isStale()) setIsAnalyzing(false);
        }
    }, [cancelActiveOperation, currentTurnDiceRef, currentTurnMovesRef, game.dice, game.matchLog, game.moveHistory, game.state, onCoachTriggered, turnBoardBeforeRef]);

    return {
        coach,
        coachHighlight,
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
