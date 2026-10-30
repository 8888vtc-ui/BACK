import { useEffect, type MutableRefObject } from 'react';
import type { BoardState, Player } from '../../engine/backgammonEngine';
import type { CubeAction, CubeActionType } from '../../features/coach/cubeCoach';
import type { MatchLogEntry } from '../../actions/types';
import type { GameResult } from '../../engine/aiHeuristics';
import { detectPlayerCubeDecision } from '../useCoachTrigger';
import type { CoachAnalysisHistoryEntry, CoachMoveHistoryItem, CoachState, LastMoveFeedback } from '../useCoachHelpers';
import type { CoachHighlight } from '../../components/board/boardThemes';

export interface UseCoachRoundWatcherParams {
    moveHistory?: ReadonlyArray<CoachMoveHistoryItem>;
    matchLog?: ReadonlyArray<MatchLogEntry>;
    doublingOfferedBy?: Player | null;
    phase?: string;
    gameResult?: GameResult | null;
    state: BoardState;
    dice: [number, number] | null;
    currentTurnMovesRef: MutableRefObject<unknown[]>;
    cancelActiveOperation: () => void;
    lastPlayerEvalRef: MutableRefObject<string | null>;
    lastCubeEvalKeyRef: MutableRefObject<string | null>;
    prevHumanRollKeyRef: MutableRefObject<string>;
    prevDoublingOfferedByRef: MutableRefObject<Player | null>;
    stateBeforeCubeOfferRef: MutableRefObject<BoardState | null>;
    setCoach: (coach: CoachState | null) => void;
    setCoachHighlight: (highlight: CoachHighlight | null) => void;
    setLastMoveFeedback: (feedback: LastMoveFeedback | null) => void;
    setCoachHistory: (updater: (prev: CoachAnalysisHistoryEntry[]) => CoachAnalysisHistoryEntry[]) => void;
    setSelectedCoachHistoryIndex: (index: number | null) => void;
    evaluateCubeAction: (action: CubeActionType | CubeAction, stateOverride?: BoardState) => void;
}

export function useCoachRoundWatcher({
    moveHistory,
    matchLog,
    doublingOfferedBy,
    phase,
    gameResult,
    state,
    dice,
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
}: UseCoachRoundWatcherParams): void {
    // 1. Autorité de réinitialisation : manche vs nouveau lancer
    useEffect(() => {
        const isNewRound =
            Boolean(moveHistory && moveHistory.length === 0) &&
            (matchLog?.length ?? 0) === 0 &&
            currentTurnMovesRef.current.length === 0 &&
            !doublingOfferedBy &&
            phase !== 'DOUBLING_OFFERED';
        const rollKey = state.turn === 'X' && dice !== null ? `X:${dice[0]}-${dice[1]}:${matchLog?.length ?? 0}` : '';
        const isNewHumanRoll = rollKey !== '' && rollKey !== prevHumanRollKeyRef.current;
        prevHumanRollKeyRef.current = rollKey;

        if (isNewRound) {
            cancelActiveOperation();
            lastPlayerEvalRef.current = null;
            lastCubeEvalKeyRef.current = null;
            setCoach(null);
            setCoachHighlight(null);
            setLastMoveFeedback(null);
            setCoachHistory((prev) => (prev.length === 0 ? prev : []));
            setSelectedCoachHistoryIndex(null);
        } else if (isNewHumanRoll) {
            setCoachHighlight(null);
            setSelectedCoachHistoryIndex(null);
        }
    }, [moveHistory, matchLog, doublingOfferedBy, phase, state.turn, dice, cancelActiveOperation, currentTurnMovesRef, lastCubeEvalKeyRef, lastPlayerEvalRef, prevHumanRollKeyRef, setCoach, setCoachHighlight, setLastMoveFeedback, setCoachHistory, setSelectedCoachHistoryIndex]);

    // 2. Interception des décisions de videau du joueur
    useEffect(() => {
        const { decision, updatedOfferSnapshot, nextPrevOfferedBy } = detectPlayerCubeDecision({
            moveHistory,
            doublingOfferedBy,
            prevOfferedBy: prevDoublingOfferedByRef.current,
            stateBeforeCubeOffer: stateBeforeCubeOfferRef.current,
            phase,
            gameResult,
            currentState: state,
        });
        stateBeforeCubeOfferRef.current = updatedOfferSnapshot;
        prevDoublingOfferedByRef.current = nextPrevOfferedBy;

        if (decision && lastCubeEvalKeyRef.current !== decision.key) {
            lastCubeEvalKeyRef.current = decision.key;
            evaluateCubeAction(decision.action, decision.stateToEval);
        }
    }, [moveHistory, doublingOfferedBy, phase, gameResult, state, evaluateCubeAction, lastCubeEvalKeyRef, prevDoublingOfferedByRef, stateBeforeCubeOfferRef]);
}
