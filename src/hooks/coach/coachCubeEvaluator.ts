import { type BoardState, serializeXGID } from '../../engine/backgammonEngine';
import {
    analyzeCubeDecision,
    mapGameCubeAction,
    type CubeAction,
    type CubeActionType,
    type CubeCoachResult,
} from '../../features/coach/cubeCoach';
import { getTheoryConceptById } from '../../features/knowledge/knowledgeBaseData';
import { buildCubeNotification } from '../../features/coach/cubeNotification';
import { toast } from '../../components/toast/ToastContext';
import { shouldNotify, type CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';
import { CUBE_PLAYED_LABEL, type CoachState, type CoachAnalysisHistoryEntry } from '../useCoachHelpers';

export interface ExecuteCubeEvaluationParams {
    action: CubeActionType | CubeAction;
    evalState: BoardState;
    notificationLevel: CoachNotificationLevel;
    historyLength: number;
}

export interface ExecuteCubeEvaluationResult {
    cubeRes: CubeCoachResult;
    rawLoss: number;
    playedLabel: string;
    cubeCoachState: CoachState;
    historyEntry: CoachAnalysisHistoryEntry;
    shouldNotifyUser: boolean;
}

export function executeCubeEvaluation({
    action,
    evalState,
    notificationLevel,
    historyLength,
}: ExecuteCubeEvaluationParams): ExecuteCubeEvaluationResult {
    const normalizedAction = mapGameCubeAction(action) ?? 'double';
    const cubeRes = analyzeCubeDecision(evalState, normalizedAction);
    const rawLoss =
        cubeRes.equityLoss ??
        (cubeRes.verdict === 'blunder' ? -0.12 : cubeRes.verdict === 'inaccuracy' ? -0.045 : cubeRes.verdict === 'good' ? -0.015 : 0);
    const playedLabel = CUBE_PLAYED_LABEL[normalizedAction];

    const notif = buildCubeNotification(cubeRes, notificationLevel);
    if (notif) {
        if (notif.type === 'warning') toast.warning(notif.message, notif.title);
        else toast.info(notif.message, notif.title);
    }

    const kbCubeId = evalState.crawford
        ? 'crawford-rule'
        : (evalState.matchLength ?? 0) === 0
          ? 'jacoby-beaver-money'
          : normalizedAction === 'double'
            ? 'woolsey-law'
            : 'janowski-cube-model';
    const kbCube = getTheoryConceptById(kbCubeId);
    const kbText = kbCube
        ? `\n\n📚 Théorie (${kbCube.title.fr} — ${kbCube.author}) : ${kbCube.keyTakeaway.fr} ${kbCube.goldenRule.fr}`
        : '';

    const cubeCoachState: CoachState = {
        verdict: cubeRes.verdict,
        equityLoss: rawLoss,
        playedMove: playedLabel,
        optimalMove: cubeRes.optimalAction,
        explanation: `${cubeRes.explanation} ${cubeRes.advice}${kbText}`.trim(),
        whyFailed: cubeRes.verdict !== 'optimal' ? cubeRes.explanation : undefined,
        whyOptimal: `${cubeRes.optimalAction} — ${cubeRes.advice}`,
        summary: cubeRes.explanation,
        tacticalSummary: cubeRes.advice,
        positionKey: serializeXGID(evalState),
        boardBefore: [...evalState.board],
    };

    const historyEntry: CoachAnalysisHistoryEntry = {
        turnIndex: historyLength + 1,
        dice: null,
        coachState: cubeCoachState,
        highlight: null,
        boardBefore: [...evalState.board],
        boardAfter: [...evalState.board],
        timestamp: Date.now(),
    };

    const shouldNotifyUser = shouldNotify(cubeRes.verdict, notificationLevel);

    return {
        cubeRes,
        rawLoss,
        playedLabel,
        cubeCoachState,
        historyEntry,
        shouldNotifyUser,
    };
}
