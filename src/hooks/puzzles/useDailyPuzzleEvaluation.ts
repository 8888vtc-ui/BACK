import { useState, useCallback } from 'react';
import {
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
} from '../../lib/puzzle/puzzleService';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import type { Move } from '../../engine/backgammonEngine';

export interface UseDailyPuzzleEvaluationParams {
    puzzle: DailyPuzzleDefinition;
    playedMoves?: ReadonlyArray<Move>;
}

export function useDailyPuzzleEvaluation({ puzzle, playedMoves = [] }: UseDailyPuzzleEvaluationParams) {
    const [hintLevel, setHintLevel] = useState<HintLevel>(0);
    const [attemptsCount, setAttemptsCount] = useState<number>(0);
    const [failedOnFirstAttempt, setFailedOnFirstAttempt] = useState<boolean>(false);
    const [verdict, setVerdict] = useState<DailyPuzzleVerdictEvaluation | null>(null);
    const [showDebrief, setShowDebrief] = useState<boolean>(false);
    const [profile, setProfile] = useState<LocalPuzzleProfileState>(() => loadLocalPuzzleProfile());
    const [ratingDelta, setRatingDelta] = useState<number | null>(null);
    const [fsrsScheduledEntry, setFsrsScheduledEntry] = useState<LocalFsrsErrorEntry | null>(null);

    const resetEvaluationState = useCallback(() => {
        setHintLevel(0);
        setAttemptsCount(0);
        setFailedOnFirstAttempt(false);
        setVerdict(null);
        setShowDebrief(false);
        setRatingDelta(null);
        setFsrsScheduledEntry(null);
    }, []);

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

    const submitCheckerSolution = useCallback(async (movesToEval?: ReadonlyArray<Move>): Promise<DailyPuzzleVerdictEvaluation | null> => {
        const moves = movesToEval ?? playedMoves;
        if (moves.length === 0) return null;
        const evalResult = evaluateDailyPuzzleCheckerMove(puzzle, moves, hintLevel);
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
        hintLevel,
        attemptsCount,
        failedOnFirstAttempt,
        verdict,
        setVerdict,
        showDebrief,
        profile,
        ratingDelta,
        fsrsScheduledEntry,
        resetEvaluationState,
        unlockNextHint,
        submitCheckerSolution,
        submitCubeDecision,
        openDebrief,
    };
}
