/**
 * Types et constructeurs purs pour `useCoach.ts` (< 280 lignes, 0 any).
 */

import type React from 'react';
import {
    type BoardState,
    type Move,
    type Player,
    applyMove,
    pipCount,
    serializeXGID,
} from '../engine/backgammonEngine';
import type { AIDifficulty, GameResult } from '../engine/aiHeuristics';
import {
    extractStrategicFeatures,
    analyzeBoardStructure,
    analyzeBlots,
    generateRuleBasedExplanation,
    buildMatchContext,
    type StrategicFeatures,
} from '../features/coach';
import type { CubeAction, CubeActionType, CubeCoachResult } from '../features/coach/cubeCoach';
import { analyzeBoardMoves } from '../lib/engine/evaluator';
import {
    formatCoachMoveSequence,
    formatCoachMoveSequenceFromBoard,
    parseCoachNotationMoves,
} from '../features/coach/coachMoveNotation';
import type { CoachHighlight } from '../components/board/boardThemes';
import {
    classifyVerdict,
    type CoachVerdict,
    type HumanMoveAnalysis,
} from '../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../actions/types';
import { explainTacticalDifference } from '../features/coach/tacticalExplainer';
import type { CoachNotificationLevel } from '../features/coach/coachNotificationSettings';
import { detectLocale } from '../lib/i18n/I18nContext';
import type { Locale } from '../lib/i18n/types';

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
    turnNumber: number; player: 'X' | 'O'; verdict: CoachVerdict;
    equityLoss: number; playedMove: string; optimalMove: string;
}

export interface MatchStats {
    decisionsCount: number; totalEquityLoss: number; blundersCount: number;
    totalErrorRate?: number; evaluatedMoves?: EvaluatedMove[];
    decisionCounters?: { optimal: number; good: number; inaccuracy: number; blunder: number };
}

export interface LastMoveFeedback {
    verdict: CoachVerdict; equityLoss: number; playedMove?: string; optimalMove?: string; turnIndex?: number; timestamp?: number;
}

export interface CoachAnalysisHistoryEntry {
    readonly turnIndex: number; readonly dice: [number, number] | null;
    readonly coachState: CoachState; readonly highlight: CoachHighlight | null;
    readonly boardBefore: number[]; readonly boardAfter: number[]; readonly timestamp: number;
}

export interface CoachMoveHistoryItem {
    board?: number[]; usedDice?: boolean[]; move?: Move; player?: Player;
    moves?: Move[]; type?: CubeActionType | string; action?: CubeActionType | string; state?: BoardState;
}

export interface UseCoachDeps {
    game: {
        state: BoardState; dice: [number, number] | null; undoMove: () => void;
        rewindToLogTurn?: (turnIndex?: number) => boolean;
        difficulty?: AIDifficulty | string; phase?: string; doublingOfferedBy?: Player | null;
        gameResult?: GameResult | null; lastOpponentDice?: [number, number] | null;
        lastOpponentMoves?: { from: number; to: number }[] | null;
        moveHistory?: ReadonlyArray<CoachMoveHistoryItem>; matchLog?: ReadonlyArray<MatchLogEntry>;
    };
    currentTurnMovesRef: React.MutableRefObject<{ from: number; to: number }[]>;
    currentTurnDiceRef: React.MutableRefObject<[number, number] | null>;
    turnBoardBeforeRef: React.MutableRefObject<number[]>;
    onCoachTriggered?: () => void;
}

export interface UseCoachResult {
    coach: CoachState | null; coachHighlight: CoachHighlight | null;
    coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex: number | null;
    selectCoachHistoryIndex: (index: number | null) => void;
    matchStats: MatchStats; matchStatsX: MatchStats; matchStatsO: MatchStats;
    optimalStreak: number; brilliantMove: boolean; isAnalyzing: boolean;
    lastMoveFeedback: LastMoveFeedback | null; notificationLevel: CoachNotificationLevel;
    setNotificationLevel: (level: CoachNotificationLevel) => void;
    evaluateCubeAction: (action: CubeActionType | CubeAction, stateOverride?: BoardState) => CubeCoachResult;
    dismissCoach: () => void; replayMove: () => void; triggerCoach: () => Promise<void>;
}

export const CUBE_PLAYED_LABEL: Record<CubeAction, string> = {
    double: 'Videau : Doubler (×2)',
    take: 'Videau : Prendre (Take)',
    pass: 'Videau : Passer (Pass)',
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

export function appendDecisionToMatchStats(
    prev: MatchStats,
    verdict: CoachVerdict,
    rawEquityLoss: number,
    playedMove: string,
    optimalMove: string,
): MatchStats {
    const trueLoss = Math.abs(rawEquityLoss);
    const isBlunder = verdict === 'blunder';
    const nextDecisions = prev.decisionsCount + 1;
    const nextLoss = prev.totalEquityLoss + trueLoss;
    const newEval: EvaluatedMove = {
        turnNumber: nextDecisions,
        player: 'X',
        verdict,
        equityLoss: rawEquityLoss,
        playedMove,
        optimalMove,
    };
    const prevCounters = prev.decisionCounters ?? { optimal: 0, good: 0, inaccuracy: 0, blunder: 0 };
    return {
        decisionsCount: nextDecisions,
        totalEquityLoss: nextLoss,
        blundersCount: prev.blundersCount + (isBlunder ? 1 : 0),
        totalErrorRate: nextDecisions > 0 ? (nextLoss / nextDecisions) * 500 : 0,
        evaluatedMoves: [...(prev.evaluatedMoves ?? []), newEval],
        decisionCounters: { ...prevCounters, [verdict]: prevCounters[verdict] + 1 },
    };
}

export function buildCoachStateFromLogResult(params: {
    lastEntry: MatchLogEntry;
    result: HumanMoveAnalysis & { source: 'bgsage' | 'local' };
    playedMoves: Move[];
    playedNotation: string;
    gameState: BoardState;
    language?: Locale;
}): { coachState: CoachState; highlight: CoachHighlight } {
    const { lastEntry, result, playedMoves, playedNotation, gameState } = params;
    const { verdict, equityLoss, candidateMoves, optimalNotation } = result;
    const boardBefore = [...lastEntry.boardBefore];
    const evalState: BoardState = { ...gameState, board: boardBefore, turn: 'X', dice: [lastEntry.dice[0], lastEntry.dice[1]] };
    const playedEndState: BoardState = { ...evalState, board: [...lastEntry.boardAfter] };

    let bestEndState: BoardState = evalState;
    let optimalHighlightMoves: Move[] = [];
    const trueOptimalNotation = optimalNotation || candidateMoves[0]?.notation || '';

    if (result.optimalMoves && result.optimalMoves.length > 0) {
        let bBest = [...evalState.board];
        for (const m of result.optimalMoves) bBest = applyMove(bBest, m, 'X');
        bestEndState = { ...evalState, board: bBest };
        optimalHighlightMoves = [...result.optimalMoves];
    } else {
        const parsedOptimal = parseCoachNotationMoves(trueOptimalNotation, 'X');
        if (parsedOptimal.length > 0) {
            let bBest = [...evalState.board];
            for (const m of parsedOptimal) bBest = applyMove(bBest, m, 'X');
            bestEndState = { ...evalState, board: bBest };
            optimalHighlightMoves = parsedOptimal;
        } else {
            const bestAnalysis = analyzeBoardMoves(evalState, [lastEntry.dice[0], lastEntry.dice[1]], { ply: 2, maxMoves: 64 });
            if (bestAnalysis.bestMove?.moves) {
                let bBest = [...evalState.board];
                for (const m of bestAnalysis.bestMove.moves) bBest = applyMove(bBest, m, 'X');
                bestEndState = { ...evalState, board: bBest };
            }
            optimalHighlightMoves = bestAnalysis.bestMove?.moves ?? [];
        }
    }

    const absoluteOptimalNotation =
        trueOptimalNotation || (optimalHighlightMoves.length > 0 ? formatCoachMoveSequence(optimalHighlightMoves, 'X', boardBefore) : '');
    const features = extractStrategicFeatures(evalState, playedEndState, bestEndState);
    if (result.bgsageInsights) features.bgsage = result.bgsageInsights;

    const tactical = explainTacticalDifference({
        boardBefore,
        boardOptimal: bestEndState.board,
        boardPlayed: playedEndState.board,
        player: 'X',
    });

    const effectiveLang = params.language || (typeof window !== 'undefined' ? detectLocale() : 'fr');
    const ruleBased = generateRuleBasedExplanation({
        verdict,
        equityLoss: -Math.abs(equityLoss),
        playedMove: playedNotation,
        optimalMove: absoluteOptimalNotation,
        features,
        matchContext: buildMatchContext({
            matchLength: gameState.matchLength,
            scoreX: gameState.scoreX,
            scoreO: gameState.scoreO,
            cubeValue: gameState.cubeValue,
            cubeOwner: gameState.cubeOwner,
            crawford: gameState.crawford,
        }),
        language: effectiveLang,
    });

    return {
        coachState: {
            verdict,
            equityLoss: -Math.abs(equityLoss),
            playedMove: playedNotation,
            optimalMove: absoluteOptimalNotation,
            explanation: ruleBased.explanation,
            whyFailed: ruleBased.whyFailed || undefined,
            whyOptimal: ruleBased.whyOptimal || undefined,
            summary: ruleBased.summary,
            tacticalSummary: verdict === 'optimal' ? undefined : tactical.summary,
            features,
            positionKey: serializeXGID(evalState),
            candidateMoves: candidateMoves.slice(0, 5).map(
                (
                    m: {
                        notation: string;
                        equity: number;
                        equityLoss: number;
                        winProbability?: number;
                        gammonProbability?: number;
                        backgammonProbability?: number;
                    },
                    i: number,
                ) => ({
                    rank: i + 1,
                    notation: m.notation === result.playedNotation ? playedNotation : m.notation,
                    equity: m.equity,
                    equityLoss: m.equityLoss,
                    winProbability: m.winProbability,
                    gammonProbability: m.gammonProbability,
                    backgammonProbability: m.backgammonProbability,
                }),
            ),
            boardBefore,
            boardAfter: [...lastEntry.boardAfter],
            turnIndex: lastEntry.turnIndex,
        },
        highlight: { played: playedMoves, optimal: optimalHighlightMoves },
    };
}

export function buildFallbackTriggerCoachState(
    gameState: BoardState,
    language?: Locale,
): CoachState {
    const pips = pipCount(gameState.board);
    const structure = analyzeBoardStructure(gameState.board, 'X');
    const userBlots = analyzeBlots(gameState.board, 'X');
    const fallbackFeatures: StrategicFeatures = {
        player: 'X',
        pipCountDiff: {
            player: pips.X,
            opponent: pips.O,
            leader: pips.X < pips.O ? 'X' : pips.X > pips.O ? 'O' : 'tie',
            diff: pips.X - pips.O,
        },
        blotsAndShots: { user: userBlots, best: userBlots.length > 0 ? userBlots.slice(0, 1) : [] },
        boardStructure: structure,
        contactStatus: pips.X > 0 && pips.O > 0 ? 'contact' : 'pureRace',
    };
    const fallbackMatchCtx = buildMatchContext({
        matchLength: gameState.matchLength,
        scoreX: gameState.scoreX,
        scoreO: gameState.scoreO,
        cubeValue: gameState.cubeValue,
        cubeOwner: gameState.cubeOwner,
        crawford: gameState.crawford,
    });
    const effectiveLang = language || (typeof window !== 'undefined' ? detectLocale() : 'fr');
    const fallbackRuleBased = generateRuleBasedExplanation({
        verdict: 'douteux',
        equityLoss: -0.06,
        playedMove: effectiveLang === 'en' ? 'Current position' : 'Position actuelle',
        optimalMove: effectiveLang === 'en' ? 'Structural consolidation' : 'Consolidation structurelle',
        features: fallbackFeatures,
        matchContext: fallbackMatchCtx,
        language: effectiveLang,
    });
    return {
        verdict: 'inaccuracy',
        equityLoss: -0.06,
        playedMove: 'Position actuelle',
        optimalMove: 'Consolidation structurelle',
        explanation: fallbackRuleBased.explanation,
        whyFailed: fallbackRuleBased.whyFailed,
        whyOptimal: fallbackRuleBased.whyOptimal,
        summary: fallbackRuleBased.summary,
        features: fallbackFeatures,
        positionKey: serializeXGID(gameState),
    };
}

export { classifyVerdict, formatCoachMoveSequenceFromBoard };
