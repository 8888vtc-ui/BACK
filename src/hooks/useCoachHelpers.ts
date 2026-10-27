/**
 * Types, constructeurs et formateurs purs pour `useCoach.ts` (SCALABILITY.md R1 <= 200 lignes, 0 any).
 */

export type {
    CoachState,
    EvaluatedMove,
    MatchStats,
    LastMoveFeedback,
    CoachAnalysisHistoryEntry,
    CoachMoveHistoryItem,
    UseCoachDeps,
    UseCoachResult,
} from './coach/coachTypes';

export {
    CUBE_PLAYED_LABEL,
    extractCandidateMoveList,
} from './coach/coachTypes';

export {
    appendDecisionToMatchStats,
    buildCoachStateFromLogResult,
    buildFallbackTriggerCoachState,
} from './coach/coachStateBuilders';

export { classifyVerdict } from '../features/coach/logAnalyzer';
export { formatCoachMoveSequenceFromBoard } from '../features/coach/coachMoveNotation';
