import { useEffect, type MutableRefObject } from 'react';
import type { BoardState } from '../../engine/backgammonEngine';
import { formatCoachMoveSequence, movesFromBoardDiff } from '../../features/coach/coachMoveNotation';
import { soundEngine } from '../../lib/sound/soundEngine';
import { analyzeHumanMoveFromLogWithBgsage, type CoachVerdict } from '../../features/coach/logAnalyzer';
import { evaluateBrilliantMoveCriteria } from '../../features/coach/tacticalExplainer';
import { recordBlunder } from '../../features/drills/blunderBank';
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

export interface UseCoachLogAnalyzerParams {
    matchLog?: ReadonlyArray<MatchLogEntry>;
    gameState: BoardState;
    lastPlayerEvalRef: MutableRefObject<string | null>;
    analysisRequestIdRef: MutableRefObject<number>;
    cancelActiveOperation: () => { requestId: number; controller: AbortController };
    evaluateCubeAction: (action: CubeActionType | CubeAction, stateOverride?: BoardState) => void;
    recordDecisionStats: (verdict: CoachVerdict, rawEquityLoss: number, playedMove: string, optimalMove: string) => void;
    setBrilliantMove: (brilliant: boolean) => void;
    setLastMoveFeedback: (
        feedback: LastMoveFeedback | null | ((prev: LastMoveFeedback | null) => LastMoveFeedback | null),
    ) => void;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void;
    notificationLevel: CoachNotificationLevel;
    setCoach: (coach: CoachState | null | ((prev: CoachState | null) => CoachState | null)) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    speakCoachVoice: (text: string) => void;
    onCoachTriggered?: () => void;
}

export function useCoachLogAnalyzer({
    matchLog,
    gameState,
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
}: UseCoachLogAnalyzerParams): void {
    useEffect(() => {
        const log = matchLog ?? [];
        if (log.length === 0) return;

        // Trouve le dernier coup joué par le joueur humain 'X' dans le journal actuel
        let lastXIndex = -1;
        for (let i = log.length - 1; i >= 0; i--) {
            if (log[i].player === 'X') {
                lastXIndex = i;
                break;
            }
        }
        if (lastXIndex < 0) return;

        const lastEntry = log[lastXIndex];
        const playedSig = lastEntry.notation ?? lastEntry.movePlayed.map((m) => `${m.from}-${m.to}`).join(',');
        const entryKey = `${lastEntry.turnIndex}:${lastEntry.dice[0]}-${lastEntry.dice[1]}:${playedSig}:${lastEntry.timestamp ?? lastXIndex}`;
        if (lastPlayerEvalRef.current === entryKey) return;
        lastPlayerEvalRef.current = entryKey;

        const cubeNotationAction = mapGameCubeAction(lastEntry.notation);
        if (cubeNotationAction) {
            evaluateCubeAction(cubeNotationAction, { ...gameState, board: [...lastEntry.boardBefore], turn: 'X' });
            return;
        }

        const { requestId, controller } = cancelActiveOperation();
        const isStale = () => controller.signal.aborted || analysisRequestIdRef.current !== requestId;

        void (async () => {
            try {
                const result = await analyzeHumanMoveFromLogWithBgsage({
                    logEntry: lastEntry,
                    localPlayer: 'X',
                    cubeValue: gameState.cubeValue,
                    cubeOwner: gameState.cubeOwner,
                    crawford: gameState.crawford,
                    matchLength: gameState.matchLength,
                    scoreX: gameState.scoreX,
                    scoreO: gameState.scoreO,
                    ply: 3,
                    signal: controller.signal,
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
                    const uniquenessDelta = secondBest !== undefined ? Math.abs(secondBest.equityLoss) : 0;
                    const isBrilliant = evaluateBrilliantMoveCriteria({
                        equityLossEmg: Math.abs(equityLoss),
                        secondBestGapEmg: uniquenessDelta,
                        slottedKeyPointNaked: uniquenessDelta > 0.045 || playedNotation.includes('*'),
                    });
                    setBrilliantMove(isBrilliant);
                    if (verdict === 'blunder' || Math.abs(equityLoss) >= 0.06) {
                        try {
                            recordBlunder({
                                board: [...lastEntry.boardBefore],
                                dice: [lastEntry.dice[0], lastEntry.dice[1]],
                                player: 'X',
                                playedMove: playedNotation,
                                optimalMove: result.optimalNotation,
                                acceptableMoves: candidateMoves
                                    .filter((m) => Math.abs(m.equityLoss) < 0.02)
                                    .map((m) => m.notation),
                                equityLoss: Math.abs(equityLoss),
                                verdict: Math.abs(equityLoss) >= 0.20 ? 'howler' : Math.abs(equityLoss) >= 0.08 ? 'blunder' : 'doubtful',
                                conceptId: 'positional',
                                conceptName: 'Jeu positionnel',
                                explanation: `Le coup optimal était ${result.optimalNotation} (perte de ${Math.abs(equityLoss).toFixed(3)} EMG sur ${playedNotation}).`,
                            });
                        } catch { /* ignore storage errors */ }
                    }
                }
                if (isStale()) return;

                const { coachState, highlight } = buildCoachStateFromLogResult({
                    lastEntry,
                    result,
                    playedMoves,
                    playedNotation,
                    gameState,
                });
                if (isStale()) return;

                const nextFeedback: LastMoveFeedback = {
                    verdict,
                    equityLoss,
                    playedMove: playedNotation,
                    optimalMove: result.optimalNotation,
                    turnIndex: lastEntry.turnIndex,
                    decisionType: 'checker',
                    errorCategoryLabel: coachState.tacticalSummary && coachState.tacticalSummary.length < 48
                        ? coachState.tacticalSummary
                        : undefined,
                    errorAdvice: coachState.whyFailed || coachState.tacticalSummary || coachState.summary || undefined,
                    timestamp: Date.now(),
                };
                const isNewError =
                    verdict === 'blunder' || verdict === 'inaccuracy' || Math.abs(equityLoss) >= 0.02;
                setLastMoveFeedback((prev) => {
                    if (isNewError) return nextFeedback;
                    const prevIsOpenError =
                        prev !== null &&
                        (prev.verdict === 'blunder' ||
                            prev.verdict === 'inaccuracy' ||
                            Math.abs(prev.equityLoss) >= 0.02);
                    return prevIsOpenError ? prev : nextFeedback;
                });

                setCoachHistory((prev) => {
                    const filtered = prev.filter((h) => h.turnIndex !== lastEntry.turnIndex);
                    return [
                        ...filtered,
                        {
                            turnIndex: lastEntry.turnIndex,
                            dice: [lastEntry.dice[0], lastEntry.dice[1]],
                            coachState,
                            highlight,
                            boardBefore: [...lastEntry.boardBefore],
                            boardAfter: [...lastEntry.boardAfter],
                            timestamp: Date.now(),
                            isUnforced,
                        },
                    ];
                });
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
