/**
 * Types & interfaces du Coach IA (SCALABILITY.md, 0 any, < 400 lignes).
 */

import type React from 'react';
import type { BoardState, Move, Player } from '../../engine/backgammonEngine';
import type { AIDifficulty, GameResult } from '../../engine/aiHeuristics';
import type { StrategicFeatures } from '../../features/coach';
import type { CubeAction, CubeActionType, CubeCoachResult } from '../../features/coach/cubeCoach';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import type { CoachHighlight } from '../../components/board/boardThemes';
import type { CoachVerdict } from '../../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../../actions/types';
import type { CoachNotificationLevel } from '../../features/coach/coachNotificationSettings';

export interface CoachState {
    verdict: 'optimal' | 'good' | 'inaccuracy' | 'blunder';
    equityLoss: number;
    playedMove: string;
    optimalMove: string;
    explanation: string | null;
    whyFailed?: string;
    whyOptimal?: string;
    summary?: string;
    tacticalSummary?: string;
    features?: StrategicFeatures;
    positionKey?: string;
    candidateMoves?: {
        rank: number;
        notation: string;
        equity: number;
        equityLoss: number;
        winProbability?: number;
        gammonProbability?: number;
        backgammonProbability?: number;
    }[];
    candidates?: {
        rank?: number;
        notation?: string;
        equity?: number;
        equityLoss: number;
    }[];
    boardBefore?: number[];
    boardAfter?: number[];
    turnIndex?: number;
}

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
    playedMove?: string;
    optimalMove?: string;
    turnIndex?: number;
    timestamp?: number;
}

export interface CoachAnalysisHistoryEntry {
    readonly turnIndex: number;
    readonly dice: [number, number] | null;
    readonly coachState: CoachState;
    readonly highlight: CoachHighlight | null;
    readonly boardBefore: number[];
    readonly boardAfter: number[];
    readonly timestamp: number;
    readonly isUnforced?: boolean;
}

export interface CoachMoveHistoryItem {
    board?: number[];
    usedDice?: boolean[];
    move?: Move;
    player?: Player;
    moves?: Move[];
    type?: CubeActionType | string;
    action?: CubeActionType | string;
    state?: BoardState;
}

export interface UseCoachDeps {
    game: {
        state: BoardState;
        dice: [number, number] | null;
        undoMove: () => void;
        rewindToLogTurn?: (turnIndex?: number) => boolean;
        difficulty?: AIDifficulty | string;
        phase?: string;
        doublingOfferedBy?: Player | null;
        gameResult?: GameResult | null;
        lastOpponentDice?: [number, number] | null;
        lastOpponentMoves?: { from: number; to: number }[] | null;
        moveHistory?: ReadonlyArray<CoachMoveHistoryItem>;
        matchLog?: ReadonlyArray<MatchLogEntry>;
    };
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
    currentTurnDiceRef: React.MutableRefObject<[number, number] | null>;
    turnBoardBeforeRef: React.MutableRefObject<number[]>;
    onCoachTriggered?: () => void;
}

export interface UseCoachResult {
    coach: CoachState | null;
    coachHighlight: CoachHighlight | null;
    coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex: number | null;
    selectCoachHistoryIndex: (index: number | null) => void;
    matchStats: MatchStats;
    matchStatsX: MatchStats;
    matchStatsO: MatchStats;
    optimalStreak: number;
    brilliantMove: boolean;
    isAnalyzing: boolean;
    lastMoveFeedback: LastMoveFeedback | null;
    notificationLevel: CoachNotificationLevel;
    setNotificationLevel: (level: CoachNotificationLevel) => void;
    evaluateCubeAction: (action: CubeActionType | CubeAction, stateOverride?: BoardState) => CubeCoachResult;
    dismissCoach: () => void;
    replayMove: () => void;
    triggerCoach: () => Promise<void>;
}

export const CUBE_PLAYED_LABEL: Record<CubeAction, string> = {
    double: 'Videau : Doubler (×2)',
    take: 'Videau : Prendre (Take)',
    pass: 'Videau : Passer (Pass)',
    missed_double: 'Videau : Non doublé (Lancer direct)',
};

export function extractCandidateMoveList(candidate: unknown): Move[] {
    if (typeof candidate !== 'object' || candidate === null) return [];
    if (
        'moves' in candidate &&
        Array.isArray((candidate as { moves?: unknown }).moves) &&
        (candidate as { moves: Move[] }).moves.length > 0
    ) {
        return (candidate as { moves: Move[] }).moves;
    }
    if (
        'notation' in candidate &&
        typeof (candidate as { notation?: unknown }).notation === 'string' &&
        (candidate as { notation: string }).notation.trim().length > 0
    ) {
        return parseCoachNotationMoves((candidate as { notation: string }).notation, 'X');
    }
    return [];
}
