'use client';

/**
 * Hook React `useDailyPuzzle` — Orchestration complète du "Puzzle du Jour" (/daily-puzzle).
 * Loi 5 : < 300 lignes, typage strict, gestion exacte de l'historique des dés et nettoyage du timer d'intro.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    applyMove,
    computeLegalTargets,
    X_BAR,
    O_BAR,
    type BoardState,
    type Move,
} from '../engine/backgammonEngine';
import {
    DAILY_PUZZLES_CATALOG,
    INTRO_REPLAY_DURATION_MS,
    getDailyPuzzleForUtcDate,
    getDailyPuzzleById,
    getUtcDateString,
    getCountdownToNextUtcMidnight,
    formatPuzzleMatchScoreLabel,
    computePuzzleXpWithHintPenalty,
    evaluateDailyPuzzleCheckerMove,
    evaluateDailyPuzzleCubeDecision,
    loadLocalPuzzleProfile,
    syncDailyPuzzleCompletion,
    injectFailedPuzzleIntoFsrs,
    type DailyPuzzleDefinition,
    type DailyPuzzleVerdictEvaluation,
    type HintLevel,
    type CubeDecisionAction,
    type LocalPuzzleProfileState,
    type LocalFsrsErrorEntry,
} from '../lib/puzzle/puzzleService';
import { impactLight, notificationSuccess, notificationError } from '../lib/capacitor/haptics';

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

interface SubMoveSnapshot {
    readonly boardBefore: ReadonlyArray<number>;
    readonly usedDiceBefore: readonly [boolean, boolean];
}

export function useDailyPuzzle(options?: UseDailyPuzzleOptions): UseDailyPuzzleReturn {
    const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(
        () => options?.initialPuzzleId ?? getDailyPuzzleForUtcDate().id,
    );
    const puzzle = useMemo<DailyPuzzleDefinition>(
        () => getDailyPuzzleById(selectedPuzzleId) ?? getDailyPuzzleForUtcDate(),
        [selectedPuzzleId],
    );

    const [isReplayingIntro, setIsReplayingIntro] = useState<boolean>(() => !(options?.autoSkipIntro ?? false));
    const [currentBoard, setCurrentBoard] = useState<ReadonlyArray<number>>(() =>
        options?.autoSkipIntro ? puzzle.initialBoard : puzzle.opponentReplay.boardBeforeOpponent,
    );
    const [history, setHistory] = useState<ReadonlyArray<SubMoveSnapshot>>([]);
    const [playedMoves, setPlayedMoves] = useState<ReadonlyArray<Move>>([]);
    const [usedDice, setUsedDice] = useState<readonly [boolean, boolean]>([false, false]);
    const liveMoveStateRef = useRef<{ board: ReadonlyArray<number>; usedDice: readonly [boolean, boolean] }>({
        board: currentBoard,
        usedDice: [false, false],
    });
    liveMoveStateRef.current = { board: currentBoard, usedDice };
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [hintLevel, setHintLevel] = useState<HintLevel>(0);
    const [attemptsCount, setAttemptsCount] = useState<number>(0);
    const [failedOnFirstAttempt, setFailedOnFirstAttempt] = useState<boolean>(false);
    const [verdict, setVerdict] = useState<DailyPuzzleVerdictEvaluation | null>(null);
    const [showDebrief, setShowDebrief] = useState<boolean>(false);
    const [profile, setProfile] = useState<LocalPuzzleProfileState>(() => loadLocalPuzzleProfile());
    const [ratingDelta, setRatingDelta] = useState<number | null>(null);
    const [fsrsScheduledEntry, setFsrsScheduledEntry] = useState<LocalFsrsErrorEntry | null>(null);
    const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const utcDateString = useMemo(() => getUtcDateString(), []);
    const utcCountdown = useMemo(() => getCountdownToNextUtcMidnight().formatted, []);
    const matchScoreLabel = useMemo(() => formatPuzzleMatchScoreLabel(puzzle), [puzzle]);

    const clearReplayTimer = useCallback(() => {
        if (replayTimerRef.current !== null) {
            clearTimeout(replayTimerRef.current);
            replayTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        clearReplayTimer();
        if (options?.autoSkipIntro) {
            setIsReplayingIntro(false);
            setCurrentBoard(puzzle.initialBoard);
            return;
        }
        setIsReplayingIntro(true);
        setCurrentBoard(puzzle.opponentReplay.boardBeforeOpponent);
        replayTimerRef.current = setTimeout(() => {
            setCurrentBoard(puzzle.initialBoard);
            setIsReplayingIntro(false);
            replayTimerRef.current = null;
        }, INTRO_REPLAY_DURATION_MS);

        return clearReplayTimer;
    }, [puzzle, options?.autoSkipIntro, clearReplayTimer]);

    const triggerIntroReplay = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(true);
        setCurrentBoard(puzzle.opponentReplay.boardBeforeOpponent);
        setPlayedMoves([]);
        setHistory([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        replayTimerRef.current = setTimeout(() => {
            setCurrentBoard(puzzle.initialBoard);
            setIsReplayingIntro(false);
            replayTimerRef.current = null;
        }, INTRO_REPLAY_DURATION_MS);
    }, [puzzle, clearReplayTimer]);

    const skipIntroReplay = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(false);
        setCurrentBoard(puzzle.initialBoard);
    }, [puzzle.initialBoard, clearReplayTimer]);

    const selectPuzzleById = useCallback((id: string) => {
        const target = getDailyPuzzleById(id) ?? getDailyPuzzleForUtcDate();
        setSelectedPuzzleId(target.id);
        setPlayedMoves([]);
        setHistory([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setHintLevel(0);
        setAttemptsCount(0);
        setFailedOnFirstAttempt(false);
        setVerdict(null);
        setShowDebrief(false);
        setRatingDelta(null);
        setFsrsScheduledEntry(null);
    }, []);

    const boardState = useMemo<BoardState>(
        () => ({
            board: [...currentBoard],
            turn: isReplayingIntro ? (puzzle.turn === 'X' ? 'O' : 'X') : puzzle.turn,
            cubeValue: puzzle.cubeValue,
            cubeOwner: puzzle.cubeOwner,
            dice: isReplayingIntro ? null : [puzzle.dice[0], puzzle.dice[1]],
            matchLength: puzzle.matchLength || 7,
            scoreX: puzzle.scoreX,
            scoreO: puzzle.scoreO,
            crawford: puzzle.isCrawford,
            doubled: Boolean(puzzle.doublingOfferedBy),
            resigned: 0,
        }),
        [currentBoard, puzzle, isReplayingIntro],
    );

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (isReplayingIntro) {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
        try {
            return computeLegalTargets(boardState, [puzzle.dice[0], puzzle.dice[1]], [usedDice[0], usedDice[1]]);
        } catch {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
    }, [boardState, puzzle.dice, usedDice, isReplayingIntro]);

    const highlightedHintSources = useMemo<ReadonlySet<number>>(
        () => (hintLevel < 2 ? new Set<number>() : new Set<number>(puzzle.optimalSourcePoints)),
        [hintLevel, puzzle.optimalSourcePoints],
    );
    const xpPreview = useMemo(() => computePuzzleXpWithHintPenalty(hintLevel), [hintLevel]);

    const handleResetAttempt = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(false);
        setCurrentBoard(puzzle.initialBoard);
        setPlayedMoves([]);
        setHistory([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        if (!verdict?.isSolved) setVerdict(null);
        void impactLight();
    }, [puzzle.initialBoard, verdict?.isSolved, clearReplayTimer]);

    const handleUndoLastMove = useCallback(() => {
        if (playedMoves.length === 0 || history.length === 0) return;
        const lastSnapshot = history[history.length - 1];
        setCurrentBoard(lastSnapshot.boardBefore);
        setUsedDice(lastSnapshot.usedDiceBefore);
        setHistory((prev) => prev.slice(0, -1));
        setPlayedMoves((prev) => prev.slice(0, -1));
        setSelectedPoint(null);
        setSelectedDie(null);
        void impactLight();
    }, [playedMoves.length, history]);

    const handlePlayMove = useCallback(
        (from: number, to: number, explicitDie?: 0 | 1) => {
            if (isReplayingIntro || verdict?.isSolved) return;
            const liveBoard = liveMoveStateRef.current.board;
            const liveUsedDice = liveMoveStateRef.current.usedDice;
            let liveTargets = { leftDieTargets, rightDieTargets };
            if (liveBoard !== currentBoard || liveUsedDice !== usedDice) {
                try {
                    liveTargets = computeLegalTargets(
                        { ...boardState, board: [...liveBoard] },
                        [puzzle.dice[0], puzzle.dice[1]],
                        [liveUsedDice[0], liveUsedDice[1]],
                    );
                } catch {
                    return;
                }
            }
            const leftTargets = liveTargets.leftDieTargets.get(from) ?? [];
            const rightTargets = liveTargets.rightDieTargets.get(from) ?? [];

            let dieUsed: 0 | 1 | null = null;
            if (explicitDie === 0 && !liveUsedDice[0] && leftTargets.includes(to)) dieUsed = 0;
            else if (explicitDie === 1 && !liveUsedDice[1] && rightTargets.includes(to)) dieUsed = 1;
            else if (!liveUsedDice[0] && leftTargets.includes(to)) dieUsed = 0;
            else if (!liveUsedDice[1] && rightTargets.includes(to)) dieUsed = 1;
            if (dieUsed === null) return;

            const move: Move = { from, to };
            const nextBoard = applyMove([...liveBoard], move, puzzle.turn);
            const nextUsedDice: [boolean, boolean] = [liveUsedDice[0], liveUsedDice[1]];
            nextUsedDice[dieUsed] = true;
            liveMoveStateRef.current = { board: nextBoard, usedDice: nextUsedDice };

            setHistory((prev) => [...prev, { boardBefore: liveBoard, usedDiceBefore: liveUsedDice }]);
            setCurrentBoard(nextBoard);
            setPlayedMoves((prev) => [...prev, move]);
            setUsedDice(nextUsedDice);
            setSelectedPoint(null);
            setSelectedDie(null);
            void impactLight();
        },
        [isReplayingIntro, verdict?.isSolved, leftDieTargets, rightDieTargets, usedDice, currentBoard, boardState, puzzle.dice, puzzle.turn],
    );

    const handleCheckerClick = useCallback(
        (point: number) => {
            if (isReplayingIntro || verdict?.isSolved) return;
            const hasChecker =
                puzzle.turn === 'X'
                    ? point === X_BAR ? (currentBoard[X_BAR] ?? 0) > 0 : (currentBoard[point] ?? 0) > 0
                    : point === O_BAR ? (currentBoard[O_BAR] ?? 0) < 0 : (currentBoard[point] ?? 0) < 0;
            if (!hasChecker) return;

            const leftTargets = leftDieTargets.get(point) ?? [];
            const rightTargets = rightDieTargets.get(point) ?? [];
            if (leftTargets.length === 0 && rightTargets.length === 0) return;

            if (selectedPoint === point) {
                if (!usedDice[0] && leftTargets.length > 0) {
                    handlePlayMove(point, leftTargets[0], 0);
                    return;
                }
                if (!usedDice[1] && rightTargets.length > 0) {
                    handlePlayMove(point, rightTargets[0], 1);
                    return;
                }
                setSelectedPoint(null);
                setSelectedDie(null);
                return;
            }

            setSelectedPoint(point);
            if (!usedDice[0] && leftTargets.length > 0) setSelectedDie(0);
            else if (!usedDice[1] && rightTargets.length > 0) setSelectedDie(1);
            void impactLight();
        },
        [isReplayingIntro, verdict?.isSolved, selectedPoint, puzzle.turn, currentBoard, leftDieTargets, rightDieTargets, usedDice, handlePlayMove],
    );

    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined);
        },
        [selectedPoint, selectedDie, handlePlayMove],
    );

    const handleSelectDie = useCallback((die: 0 | 1) => setSelectedDie(die), []);
    const handleDeselect = useCallback(() => { setSelectedPoint(null); setSelectedDie(null); }, []);
    const unlockNextHint = useCallback(() => {
        setHintLevel((prev) => (prev < 2 ? ((prev + 1) as HintLevel) : 2));
        void impactLight();
    }, []);

    const processEvaluationSideEffects = useCallback(
        async (evalResult: DailyPuzzleVerdictEvaluation) => {
            const isFirstTry = attemptsCount === 0;
            setAttemptsCount((prev) => prev + 1);
            setVerdict(evalResult);
            if (evalResult.revealDebrief) setShowDebrief(true);

            if (evalResult.code === 'BEST') {
                void notificationSuccess();
                const syncRes = await syncDailyPuzzleCompletion({ puzzle, solvedOnFirstAttempt: !failedOnFirstAttempt && isFirstTry });
                setProfile(syncRes.profile);
                setRatingDelta(syncRes.ratingDelta);
                return;
            }
            if (evalResult.code === 'EXCELLENT_ALTERNATIVE') {
                void impactLight();
                return;
            }
            void notificationError();
            if (isFirstTry && !failedOnFirstAttempt) {
                setFailedOnFirstAttempt(true);
                const fsrsRes = await injectFailedPuzzleIntoFsrs({ puzzle, playedNotation: evalResult.playedNotation, equityLoss: evalResult.deltaEquity });
                setFsrsScheduledEntry(fsrsRes.entry);
            }
        },
        [attemptsCount, failedOnFirstAttempt, puzzle],
    );

    const submitCheckerSolution = useCallback(async (): Promise<DailyPuzzleVerdictEvaluation | null> => {
        if (playedMoves.length === 0) return null;
        const evalResult = evaluateDailyPuzzleCheckerMove(puzzle, playedMoves, hintLevel);
        await processEvaluationSideEffects(evalResult);
        return evalResult;
    }, [playedMoves, puzzle, hintLevel, processEvaluationSideEffects]);

    const submitCubeDecision = useCallback(
        async (action: CubeDecisionAction): Promise<DailyPuzzleVerdictEvaluation> => {
            const evalResult = evaluateDailyPuzzleCubeDecision(puzzle, action, hintLevel);
            await processEvaluationSideEffects(evalResult);
            return evalResult;
        },
        [puzzle, hintLevel, processEvaluationSideEffects],
    );

    const openDebrief = useCallback(() => setShowDebrief(true), []);

    return {
        puzzle, catalog: DAILY_PUZZLES_CATALOG, utcDateString, utcCountdown, matchScoreLabel,
        isReplayingIntro, currentBoard, boardState, playedMoves, usedDice, selectedPoint, selectedDie,
        leftDieTargets, rightDieTargets, hintLevel, highlightedHintSources, xpPreview,
        attemptsCount, failedOnFirstAttempt, verdict, showDebrief, profile, ratingDelta, fsrsScheduledEntry,
        selectPuzzleById, triggerIntroReplay, skipIntroReplay, handleCheckerClick, handleDestinationClick,
        handlePlayMove, handleSelectDie, handleDeselect, handleUndoLastMove, handleResetAttempt,
        unlockNextHint, submitCheckerSolution, submitCubeDecision, openDebrief,
    };
}
