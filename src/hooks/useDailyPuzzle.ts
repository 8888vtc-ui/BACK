'use client';

/**
 * Hook React `useDailyPuzzle` — Orchestration complète du "Puzzle du Jour" (/daily-puzzle).
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md, <= 200 lignes).
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import type { BoardState, Move } from '../engine/backgammonEngine';
import {
    DAILY_PUZZLES_CATALOG,
    getDailyPuzzleForUtcDate,
    getDailyPuzzleById,
    getUtcDateString,
    getCountdownToNextUtcMidnight,
    formatPuzzleMatchScoreLabel,
    computePuzzleXpWithHintPenalty,
    type DailyPuzzleDefinition,
    type DailyPuzzleVerdictEvaluation,
    type HintLevel,
    type CubeDecisionAction,
    type LocalPuzzleProfileState,
    type LocalFsrsErrorEntry,
} from '../lib/puzzle/puzzleService';
import { useDailyPuzzleIntro } from './puzzles/useDailyPuzzleIntro';
import { useDailyPuzzleEvaluation } from './puzzles/useDailyPuzzleEvaluation';
import { useDailyPuzzleMoveInput } from './puzzles/useDailyPuzzleMoveInput';

export interface UseDailyPuzzleOptions {
    readonly initialPuzzleId?: string;
    readonly autoSkipIntro?: boolean;
}

export interface UseDailyPuzzleReturn {
    readonly puzzle: DailyPuzzleDefinition;
    readonly catalog: ReadonlyArray<DailyPuzzleDefinition>;
    readonly utcDateString: string;
    readonly utcCountdown: string;
    readonly matchScoreLabel: string;
    readonly isReplayingIntro: boolean;
    readonly currentBoard: ReadonlyArray<number>;
    readonly boardState: BoardState;
    readonly playedMoves: ReadonlyArray<Move>;
    readonly usedDice: readonly [boolean, boolean];
    readonly selectedPoint: number | null;
    readonly selectedDie: 0 | 1 | null;
    readonly leftDieTargets: Map<number, number[]>;
    readonly rightDieTargets: Map<number, number[]>;
    readonly hintLevel: HintLevel;
    readonly highlightedHintSources: ReadonlySet<number>;
    readonly xpPreview: { readonly earnedXp: number; readonly xpPenaltyPct: number };
    readonly attemptsCount: number;
    readonly failedOnFirstAttempt: boolean;
    readonly verdict: DailyPuzzleVerdictEvaluation | null;
    readonly showDebrief: boolean;
    readonly profile: LocalPuzzleProfileState;
    readonly ratingDelta: number | null;
    readonly fsrsScheduledEntry: LocalFsrsErrorEntry | null;
    readonly selectPuzzleById: (id: string) => void;
    readonly triggerIntroReplay: () => void;
    readonly skipIntroReplay: () => void;
    readonly handleCheckerClick: (point: number) => void;
    readonly handleDestinationClick: (dest: number) => void;
    readonly handlePlayMove: (from: number, to: number, die?: 0 | 1) => void;
    readonly handleSelectDie: (die: 0 | 1) => void;
    readonly handleDeselect: () => void;
    readonly handleUndoLastMove: () => void;
    readonly handleResetAttempt: () => void;
    readonly unlockNextHint: () => void;
    readonly submitCheckerSolution: () => Promise<DailyPuzzleVerdictEvaluation | null>;
    readonly submitCubeDecision: (action: CubeDecisionAction) => Promise<DailyPuzzleVerdictEvaluation>;
    readonly openDebrief: () => void;
}

export function useDailyPuzzle(options?: UseDailyPuzzleOptions): UseDailyPuzzleReturn {
    const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(
        () => options?.initialPuzzleId ?? getDailyPuzzleForUtcDate().id,
    );
    const puzzle = useMemo<DailyPuzzleDefinition>(
        () => getDailyPuzzleById(selectedPuzzleId) ?? getDailyPuzzleForUtcDate(),
        [selectedPuzzleId],
    );

    const evaluation = useDailyPuzzleEvaluation({ puzzle });

    const moveInputRef = useRef<{ setCurrentBoard: (b: ReadonlyArray<number>) => void; resetMoveState: (b: ReadonlyArray<number>) => void } | null>(null);

    const onSetBoard = useCallback((board: ReadonlyArray<number>) => {
        moveInputRef.current?.setCurrentBoard(board);
    }, []);

    const onResetMoveState = useCallback(() => {
        moveInputRef.current?.resetMoveState(puzzle.opponentReplay.boardBeforeOpponent);
    }, [puzzle.opponentReplay.boardBeforeOpponent]);

    const intro = useDailyPuzzleIntro({
        puzzle,
        autoSkipIntro: options?.autoSkipIntro,
        onSetBoard,
        onResetMoveState,
    });

    const moveInput = useDailyPuzzleMoveInput({
        puzzle,
        isReplayingIntro: intro.isReplayingIntro,
        isSolved: Boolean(evaluation.verdict?.isSolved),
        autoSkipIntro: options?.autoSkipIntro,
        onResetVerdict: () => evaluation.setVerdict(null),
        clearReplayTimer: intro.clearReplayTimer,
        setIsReplayingIntro: intro.setIsReplayingIntro,
    });
    moveInputRef.current = moveInput;

    const utcDateString = useMemo(() => getUtcDateString(), []);
    const utcCountdown = useMemo(() => getCountdownToNextUtcMidnight().formatted, []);
    const matchScoreLabel = useMemo(() => formatPuzzleMatchScoreLabel(puzzle), [puzzle]);

    const selectPuzzleById = useCallback((id: string) => {
        const target = getDailyPuzzleById(id) ?? getDailyPuzzleForUtcDate();
        setSelectedPuzzleId(target.id);
        moveInput.resetMoveState(target.initialBoard);
        evaluation.resetEvaluationState();
    }, [moveInput, evaluation]);

    const highlightedHintSources = useMemo<ReadonlySet<number>>(
        () => (evaluation.hintLevel < 2 ? new Set<number>() : new Set<number>(puzzle.optimalSourcePoints)),
        [evaluation.hintLevel, puzzle.optimalSourcePoints],
    );
    const xpPreview = useMemo(() => computePuzzleXpWithHintPenalty(evaluation.hintLevel), [evaluation.hintLevel]);

    const submitCheckerSolution = useCallback(async () => {
        if (moveInput.playedMoves.length === 0) return null;
        return evaluation.submitCheckerSolution(moveInput.playedMoves);
    }, [moveInput.playedMoves, evaluation]);

    return {
        puzzle,
        catalog: DAILY_PUZZLES_CATALOG,
        utcDateString,
        utcCountdown,
        matchScoreLabel,
        isReplayingIntro: intro.isReplayingIntro,
        currentBoard: moveInput.currentBoard,
        boardState: moveInput.boardState,
        playedMoves: moveInput.playedMoves,
        usedDice: moveInput.usedDice,
        selectedPoint: moveInput.selectedPoint,
        selectedDie: moveInput.selectedDie,
        leftDieTargets: moveInput.leftDieTargets,
        rightDieTargets: moveInput.rightDieTargets,
        hintLevel: evaluation.hintLevel,
        highlightedHintSources,
        xpPreview,
        attemptsCount: evaluation.attemptsCount,
        failedOnFirstAttempt: evaluation.failedOnFirstAttempt,
        verdict: evaluation.verdict,
        showDebrief: evaluation.showDebrief,
        profile: evaluation.profile,
        ratingDelta: evaluation.ratingDelta,
        fsrsScheduledEntry: evaluation.fsrsScheduledEntry,
        selectPuzzleById,
        triggerIntroReplay: intro.triggerIntroReplay,
        skipIntroReplay: intro.skipIntroReplay,
        handleCheckerClick: moveInput.handleCheckerClick,
        handleDestinationClick: moveInput.handleDestinationClick,
        handlePlayMove: moveInput.handlePlayMove,
        handleSelectDie: moveInput.handleSelectDie,
        handleDeselect: moveInput.handleDeselect,
        handleUndoLastMove: moveInput.handleUndoLastMove,
        handleResetAttempt: moveInput.handleResetAttempt,
        unlockNextHint: evaluation.unlockNextHint,
        submitCheckerSolution,
        submitCubeDecision: evaluation.submitCubeDecision,
        openDebrief: evaluation.openDebrief,
    };
}
