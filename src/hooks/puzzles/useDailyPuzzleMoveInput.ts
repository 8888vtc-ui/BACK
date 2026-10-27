import { useState, useCallback, useRef, useMemo } from 'react';
import {
    applyMove,
    computeLegalTargets,
    X_BAR,
    O_BAR,
    type BoardState,
    type Move,
} from '../../engine/backgammonEngine';
import type { DailyPuzzleDefinition } from '../../lib/puzzle/puzzleService';
import { impactLight } from '../../lib/capacitor/haptics';

export interface SubMoveSnapshot {
    readonly boardBefore: ReadonlyArray<number>;
    readonly usedDiceBefore: readonly [boolean, boolean];
}

export interface UseDailyPuzzleMoveInputParams {
    puzzle: DailyPuzzleDefinition;
    isReplayingIntro: boolean;
    isSolved: boolean;
    autoSkipIntro?: boolean;
    onResetVerdict: () => void;
    clearReplayTimer: () => void;
    setIsReplayingIntro: (val: boolean) => void;
}

export function useDailyPuzzleMoveInput({
    puzzle,
    isReplayingIntro,
    isSolved,
    autoSkipIntro,
    onResetVerdict,
    clearReplayTimer,
    setIsReplayingIntro,
}: UseDailyPuzzleMoveInputParams) {
    const [currentBoard, setCurrentBoard] = useState<ReadonlyArray<number>>(() =>
        autoSkipIntro ? puzzle.initialBoard : puzzle.opponentReplay.boardBeforeOpponent,
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

    const resetMoveState = useCallback((board: ReadonlyArray<number>) => {
        setCurrentBoard(board);
        setPlayedMoves([]);
        setHistory([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
    }, []);

    const handleResetAttempt = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(false);
        resetMoveState(puzzle.initialBoard);
        if (!isSolved) onResetVerdict();
        void impactLight();
    }, [clearReplayTimer, setIsReplayingIntro, resetMoveState, puzzle.initialBoard, isSolved, onResetVerdict]);

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
            if (isReplayingIntro || isSolved) return;
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
        [isReplayingIntro, isSolved, leftDieTargets, rightDieTargets, usedDice, currentBoard, boardState, puzzle.dice, puzzle.turn],
    );

    const handleCheckerClick = useCallback(
        (point: number) => {
            if (isReplayingIntro || isSolved) return;
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
        [isReplayingIntro, isSolved, selectedPoint, puzzle.turn, currentBoard, leftDieTargets, rightDieTargets, usedDice, handlePlayMove],
    );

    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined);
        },
        [selectedPoint, selectedDie, handlePlayMove],
    );

    const handleSelectDie = useCallback((die: 0 | 1) => setSelectedDie(die), []);
    const handleDeselect = useCallback(() => { setSelectedPoint(null); setSelectedDie(null); }, []);

    return {
        currentBoard,
        setCurrentBoard,
        boardState,
        playedMoves,
        setPlayedMoves,
        usedDice,
        setUsedDice,
        selectedPoint,
        selectedDie,
        leftDieTargets,
        rightDieTargets,
        resetMoveState,
        handlePlayMove,
        handleCheckerClick,
        handleDestinationClick,
        handleSelectDie,
        handleDeselect,
        handleUndoLastMove,
        handleResetAttempt,
    };
}
