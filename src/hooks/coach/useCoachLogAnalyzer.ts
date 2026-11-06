import { useEffect, useRef, type MutableRefObject } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import { formatCoachMoveSequence, movesFromBoardDiff } from '../../features/coach/coachMoveNotation';
import { soundEngine } from '../../lib/sound/soundEngine';
import { analyzeHumanMoveFromLogWithBgsage, type CoachVerdict } from '../../features/coach/logAnalyzer';
import { handleBlunderAndDecisionRecording } from './coachBlunderRecorder';
import { shouldNotify, type CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';
import {
    buildCoachStateFromLogResult,
    type CoachAnalysisHistoryEntry,
    type CoachState,
    type LastMoveFeedback,
} from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';
import type { MatchLogEntry } from '../../actions/types';
import { mapGameCubeAction, type CubeActionType, type CubeAction } from '../../features/coach/cubeCoach';
import type { HumanTurnSnapshot } from '../../features/coach/turnSnapshot';

export interface UseCoachLogAnalyzerParams {
    matchLog?: ReadonlyArray<MatchLogEntry>; gameState: BoardState;
    difficulty?: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' | string;
    botId?: string;
    challengerProfile?: { displayName?: string; username?: string; rating?: number; countryName?: string } | null;
    opponentName?: string;
    opponentElo?: number | null;
    isAuthenticated?: boolean;
    userId?: string;
    lastPlayerEvalRef: MutableRefObject<string | null>; analysisRequestIdRef: MutableRefObject<number>;
    humanSnapshotRef?: MutableRefObject<HumanTurnSnapshot | null>; latestHumanPacketIdRef?: MutableRefObject<string | null>;
    cancelActiveOperation: () => { requestId: number; controller: AbortController };
    evaluateCubeAction: (action: CubeActionType | CubeAction, stateOverride?: BoardState) => void;
    recordDecisionStats: (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => void;
    setBrilliantMove: (brilliant: boolean) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback | null | ((prev: LastMoveFeedback | null) => LastMoveFeedback | null)) => void;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void; notificationLevel: CoachNotificationLevel;
    setCoach: (coach: CoachState | null | ((prev: CoachState | null) => CoachState | null)) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void; speakCoachVoice: (text: string) => void;
    onCoachTriggered?: () => void;
}

export function useCoachLogAnalyzer({
    matchLog,
    gameState,
    difficulty,
    challengerProfile,
    opponentName,
    opponentElo,
    isAuthenticated,
    userId,
    lastPlayerEvalRef,
    analysisRequestIdRef,
    humanSnapshotRef,
    latestHumanPacketIdRef,
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
}: UseCoachLogAnalyzerParams): void {
    const matchLogRef = useRef(matchLog);
    matchLogRef.current = matchLog;

    useEffect(() => {
        const log = matchLog ?? [];
        if (log.length === 0) return;

        // Coupe-circuit anti-bot strict : Ne JAMAIS analyser les coups du bot
        const latestEntry = log[log.length - 1];
        if (!latestEntry || latestEntry.player !== 'X') return;
        const snapshot = humanSnapshotRef?.current;
        if (snapshot && snapshot.actor !== 'HUMAN') return;

        const lastEntry = latestEntry;
        const packet = lastEntry.packet;
        const packetId = packet?.packetId;
        if (latestHumanPacketIdRef && packetId) {
            latestHumanPacketIdRef.current = packetId;
        }

        const playedSig = lastEntry.notation ?? lastEntry.movePlayed.map((m) => `${m.from}-${m.to}`).join(',');
        const entryKey = `${lastEntry.turnIndex}:${lastEntry.dice[0]}-${lastEntry.dice[1]}:${playedSig}:${lastEntry.timestamp ?? (log.length - 1)}`;
        if (lastPlayerEvalRef.current === entryKey) return;
        lastPlayerEvalRef.current = entryKey;

        const cubeNotationAction = mapGameCubeAction(lastEntry.notation);
        if (cubeNotationAction) {
            evaluateCubeAction(cubeNotationAction, { ...gameState, board: [...lastEntry.boardBefore], turn: 'X' });
            return;
        }

        const { requestId, controller } = cancelActiveOperation();
        const isStale = () =>
            controller.signal.aborted ||
            analysisRequestIdRef.current !== requestId ||
            Boolean(latestHumanPacketIdRef && packetId && latestHumanPacketIdRef.current !== packetId);
        const isTurnStillInLog = () =>
            (matchLogRef.current ?? []).some(
                (entry) => entry.player === 'X' && entry.turnIndex === lastEntry.turnIndex,
            );

        void (async () => {
            try {
                const result = await analyzeHumanMoveFromLogWithBgsage({
                    logEntry: lastEntry,
                    packet,
                    localPlayer: 'X',
                    cubeValue: gameState.cubeValue,
                    cubeOwner: gameState.cubeOwner,
                    crawford: gameState.crawford,
                    matchLength: gameState.matchLength,
                    scoreX: gameState.scoreX,
                    scoreO: gameState.scoreO,
                    ply: 3,
                });
                if (!result || !isTurnStillInLog() || isStale()) return;

                const { verdict, equityLoss, isUnforced, candidateMoves } = result;
                const loggedMoves = [...lastEntry.movePlayed];
                const playedMoves =
                    loggedMoves.length > 0 ? loggedMoves : movesFromBoardDiff(lastEntry.boardBefore, lastEntry.boardAfter, 'X');
                const playedNotation = formatCoachMoveSequence(playedMoves, 'X', lastEntry.boardBefore);

                const { coachState, highlight } = buildCoachStateFromLogResult({
                    lastEntry,
                    result,
                    playedMoves,
                    playedNotation,
                    gameState,
                });
                if (!isTurnStillInLog()) return;

                if (isUnforced) {
                    handleBlunderAndDecisionRecording({
                        lastEntry,
                        result,
                        coachState,
                        playedNotation,
                        verdict,
                        equityLoss,
                        gameState,
                        difficulty,
                        challengerProfile,
                        opponentName,
                        opponentElo,
                        isAuthenticated,
                        userId,
                        recordDecisionStats,
                        setBrilliantMove,
                        isStale,
                    });
                }

                setCoachHistory((prev) => [
                    ...prev.filter((h) => h.turnIndex !== lastEntry.turnIndex),
                    { turnIndex: lastEntry.turnIndex, dice: [lastEntry.dice[0], lastEntry.dice[1]], coachState, highlight, boardBefore: [...lastEntry.boardBefore], boardAfter: [...lastEntry.boardAfter], timestamp: Date.now(), isUnforced },
                ]);

                if (isStale()) return;

                const nextFeedback: LastMoveFeedback = {
                    verdict, equityLoss, playedMove: playedNotation, optimalMove: result.optimalNotation, turnIndex: lastEntry.turnIndex, decisionType: 'checker',
                    errorCategoryLabel: coachState.tacticalSummary && coachState.tacticalSummary.length < 48 ? coachState.tacticalSummary : undefined,
                    errorAdvice: coachState.whyFailed || coachState.tacticalSummary || coachState.summary || undefined, timestamp: Date.now(),
                    packetId: packetId ?? result.packetId, optimalSubMoves: result.optimalSubMoves ?? coachState.optimalSubMoves,
                    boardBefore: lastEntry.boardBefore, boardAfter: lastEntry.boardAfter, dice: [lastEntry.dice[0], lastEntry.dice[1]],
                };
                const isNewError = (verdict === 'blunder' || verdict === 'inaccuracy') && Math.abs(equityLoss) > 0.020;
                setLastMoveFeedback((prev) => isNewError ? nextFeedback : (prev && (prev.verdict === 'blunder' || prev.verdict === 'inaccuracy' || Math.abs(prev.equityLoss) > 0.020) ? prev : nextFeedback));

                setSelectedCoachHistoryIndex(null);

                if (shouldNotify(verdict, notificationLevel)) {
                    setCoach(coachState);
                    setCoachHighlight(highlight);
                    if (verdict === 'blunder') {
                        try { soundEngine.playBlunderAlert(); } catch { /* ignore audio errors */ }
                        const summaryText = coachState.summary || coachState.tacticalSummary || coachState.explanation || '';
                        if (summaryText) speakCoachVoice(summaryText);
                    }
                    if (verdict !== 'optimal') {
                        onCoachTriggered?.();
                    }
                } else {
                    setCoach((prev) => {
                        if (prev === null) return null;
                        return prev.verdict === 'optimal' ? coachState : prev;
                    });
                    setCoachHighlight(null);
                }
            } catch (err) {
                if (!isStale()) console.warn('[Coach] Erreur évaluation log-driven tour X :', err);
            }
        })();
    }, [matchLog, gameState, onCoachTriggered, notificationLevel, recordDecisionStats, evaluateCubeAction, cancelActiveOperation, speakCoachVoice, lastPlayerEvalRef, analysisRequestIdRef, setBrilliantMove, setLastMoveFeedback, setCoachHistory, setSelectedCoachHistoryIndex, setCoach, setCoachHighlight]);
}
