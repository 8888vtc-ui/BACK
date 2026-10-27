import { useState, useEffect, useCallback, useRef } from 'react';
import { INTRO_REPLAY_DURATION_MS, type DailyPuzzleDefinition } from '../../lib/puzzle/puzzleService';

export interface UseDailyPuzzleIntroParams {
    puzzle: DailyPuzzleDefinition;
    autoSkipIntro?: boolean;
    onSetBoard: (board: ReadonlyArray<number>) => void;
    onResetMoveState: () => void;
}

export function useDailyPuzzleIntro({
    puzzle,
    autoSkipIntro,
    onSetBoard,
    onResetMoveState,
}: UseDailyPuzzleIntroParams) {
    const [isReplayingIntro, setIsReplayingIntro] = useState<boolean>(() => !(autoSkipIntro ?? false));
    const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearReplayTimer = useCallback(() => {
        if (replayTimerRef.current !== null) {
            clearTimeout(replayTimerRef.current);
            replayTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        clearReplayTimer();
        if (autoSkipIntro) {
            setIsReplayingIntro(false);
            onSetBoard(puzzle.initialBoard);
            return;
        }
        setIsReplayingIntro(true);
        onSetBoard(puzzle.opponentReplay.boardBeforeOpponent);
        replayTimerRef.current = setTimeout(() => {
            onSetBoard(puzzle.initialBoard);
            setIsReplayingIntro(false);
            replayTimerRef.current = null;
        }, INTRO_REPLAY_DURATION_MS);

        return clearReplayTimer;
    }, [puzzle, autoSkipIntro, clearReplayTimer, onSetBoard]);

    const triggerIntroReplay = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(true);
        onResetMoveState();
        onSetBoard(puzzle.opponentReplay.boardBeforeOpponent);
        replayTimerRef.current = setTimeout(() => {
            onSetBoard(puzzle.initialBoard);
            setIsReplayingIntro(false);
            replayTimerRef.current = null;
        }, INTRO_REPLAY_DURATION_MS);
    }, [clearReplayTimer, onResetMoveState, onSetBoard, puzzle]);

    const skipIntroReplay = useCallback(() => {
        clearReplayTimer();
        setIsReplayingIntro(false);
        onSetBoard(puzzle.initialBoard);
    }, [clearReplayTimer, onSetBoard, puzzle.initialBoard]);

    return {
        isReplayingIntro,
        setIsReplayingIntro,
        clearReplayTimer,
        triggerIntroReplay,
        skipIntroReplay,
    };
}
