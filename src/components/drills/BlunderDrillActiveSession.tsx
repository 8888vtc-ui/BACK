'use client';

/**
 * @file src/components/drills/BlunderDrillActiveSession.tsx
 * @description Session active du Quiz ER / PR Adaptatif (< 240 lignes, 0 any, 0 emoji).
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { applyMove, computeLegalTargets, type BoardState } from '../../engine/backgammonEngine';
import { formatMoveSequenceNotation } from '../../lib/engine/evaluator';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { useDrillRating } from '../../hooks/useDrillRating';
import { getAllBlunders, getBlunderBankStats, resetAllBlunderMastery, markBlunderAttempt, recordBlunder, registerFactoryQuizzes } from '../../features/drills/blunderBank';
import { buildHarvestedBlunder, type HarvestedSeedInput } from '../../features/drills/benchmarkBlunders';
import { getSavedPlayerTierGate } from '../../hooks/usePlayerTierGate';
import { validateDrillNotationChoice } from '../../features/drills/blunderDrillEngine';
import { validateBoardState, computeTenthsMetricDelta } from '../../features/drills/drillSubAgentsPipeline';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import {
    getAdaptivePlayerProfile, recordAdaptiveQuizOutcome, resetAdaptivePlayerProfile,
    selectNextAdaptiveQuiz, selectNextPersonalBlunderQuiz, isPersonalMatchBlunder,
    normalizeToQuizCategory, type AdaptivePlayerProfile,
} from '../../features/drills/adaptiveQuizEngine';
import type { PlayerBlunderRecord, DrillValidationResult, BlunderBankStats } from '../../features/drills/types';
import { getPendingPersonalBlundersCount, PERSONAL_BLUNDERS_UPDATED_EVENT } from '../../lib/blunders/personalBlunderStore';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { rewardFirstTryQuizOnPublicPr, breakFirstTryQuizStreak } from '../../features/multiplayer/elo';
import { toast } from '../toast/ToastContext';
import DrillHeader, { type QuizDrillMode } from './DrillHeader';
import BlunderDrillFeedbackCard from './BlunderDrillFeedbackCard';
import PersonalBlundersNotebookView from './PersonalBlundersNotebookView';
import BlunderDrillFinishedCard from './BlunderDrillFinishedCard';
import DrillBoardStage from './DrillBoardStage';
import { useDrillBoardInteraction } from '../../hooks/useDrillBoardInteraction';
import type { BlunderDrillViewProps } from './BlunderDrillView';

const expandNotationTokens = (n: string): string => n.replace(/\*/g, '').trim().split(/\s+/).flatMap((tok) => {
    const parts = tok.split('/');
    return parts.length > 2 ? parts.slice(0, -1).map((p, k) => `${p}/${parts[k + 1]}`) : [tok];
}).join(' ');

export function BlunderDrillActiveSession({ initialConceptId, initialMode = 'adaptive', onClose }: BlunderDrillViewProps) {
    const { theme } = useBoardTheme();
    const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptivePlayerProfile>(() => getAdaptivePlayerProfile());
    const [stats, setStats] = useState<BlunderBankStats>(() => getBlunderBankStats());
    const [drillMode, setDrillMode] = useState<QuizDrillMode>(() => {
        const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        return sp?.get('filter') === 'personal-blunders' || sp?.get('mode') === 'personal_blunders' ? 'personal_blunders' : initialMode;
    });
    const [hearts, setHearts] = useState<number>(5);
    const [attemptsLeft, setAttemptsLeft] = useState<number>(2);
    const [fsrsScheduled, setFsrsScheduled] = useState<boolean>(false);
    const [streak, setStreak] = useState<number>(0);
    const [xp, setXp] = useState<number>(0);
    const [quizStepCount, setQuizStepCount] = useState<number>(0);
    const [hoveredChoiceNotation, setHoveredChoiceNotation] = useState<string | null>(null);
    const [storePendingCount, setStorePendingCount] = useState<number>(() => getPendingPersonalBlundersCount());
    const [showHint, setShowHint] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<DrillValidationResult | null>(null);
    const failedOnCurrentQuizRef = useRef<boolean>(false);

    useEffect(() => {
        const onStoreUpdate = () => setStorePendingCount(getPendingPersonalBlundersCount());
        window.addEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, onStoreUpdate);
        if (typeof window !== 'undefined') {
            const gate = getSavedPlayerTierGate();
            fetch(`/api/quizzes/factory?limit=100&gate=${gate}&random=true`)
                .then((r) => r.json())
                .then((data) => {
                    if (data.success && Array.isArray(data.quizzes)) {
                        const loaded = data.quizzes.map((s: HarvestedSeedInput, idx: number) => buildHarvestedBlunder(s, idx));
                        registerFactoryQuizzes(loaded);
                    }
                })
                .catch(() => {});
        }
        return () => window.removeEventListener(PERSONAL_BLUNDERS_UPDATED_EVENT, onStoreUpdate);
    }, []);

    const isErMode = drillMode === 'pr_math';
    const { erPrScore, activeMetricScore, activeTenthsDelta, ratingValue, ratingDelta, recordAttempt } = useDrillRating(isErMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const personalBlundersCount = useMemo(() => {
        const legacyCount = getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length;
        return storePendingCount > 0 ? storePendingCount : legacyCount;
    }, [stats, storePendingCount]);

    const initialSelection = useMemo(() => {
        const all = getAllBlunders();
        if (initialMode === 'personal_blunders') {
            const pick = selectNextPersonalBlunderQuiz(all);
            if (pick.quiz) return { quiz: pick.quiz, reasonLabel: pick.reasonLabel };
        }
        if (initialConceptId && initialConceptId !== 'all') {
            const m = all.find((b) => b.conceptId === initialConceptId);
            if (m) return { quiz: m, reasonLabel: `Focus ciblé · ${m.conceptName}` };
        }
        return selectNextAdaptiveQuiz(all);
    }, [initialConceptId, initialMode]);

    const [currentBlunder, setCurrentBlunder] = useState<PlayerBlunderRecord | null>(() => initialSelection.quiz);
    const [reasonLabel, setReasonLabel] = useState<string>(() => initialSelection.reasonLabel);
    const validatedInitialBoard = useMemo(() => (currentBlunder ? validateBoardState(currentBlunder.board, currentBlunder.player).normalizedBoard : new Array<number>(28).fill(0)), [currentBlunder]);

    const applyValidationFeedback = useCallback((result: DrillValidationResult) => {
        if (!currentBlunder) return;
        setValidationResult(result);
        setHoveredChoiceNotation(null);
        const isNearOptimal = result.verdict === 'acceptable' || (result.equityLoss > 0 && result.equityLoss <= 0.020);
        if (result.isCorrect) {
            const isPersonal = Boolean((currentBlunder && isPersonalMatchBlunder(currentBlunder)) || drillMode === 'personal_blunders');
            const explicitDelta = isNearOptimal ? 0 : failedOnCurrentQuizRef.current ? -0.1 : isPersonal ? -0.2 : -0.1;
            recordAttempt(true, currentBlunder.tier ?? 2, result.equityLoss, explicitDelta);
            markBlunderAttempt(currentBlunder.id, true);
            setAdaptiveProfile(recordAdaptiveQuizOutcome(currentBlunder, true).profile);
            setStats(getBlunderBankStats()); notificationSuccess();
            if (!failedOnCurrentQuizRef.current) rewardFirstTryQuizOnPublicPr();
            setStreak((prev) => { const next = prev + 1; setXp((c) => c + 25 * Math.min(next, 4)); return next; });
        } else {
            const nextAttempts = Math.max(0, attemptsLeft - 1);
            setAttemptsLeft(nextAttempts); failedOnCurrentQuizRef.current = true;
            breakFirstTryQuizStreak(); notificationError(); setStreak(0); setHearts((prev) => Math.max(0, prev - 1));
            const penaltyTenths = nextAttempts === 1 ? 0.2 : computeTenthsMetricDelta(false, result.equityLoss || currentBlunder.equityLoss);
            recordAttempt(false, currentBlunder.tier ?? 2, result.equityLoss || currentBlunder.equityLoss, penaltyTenths);
            markBlunderAttempt(currentBlunder.id, false);
            setAdaptiveProfile(recordAdaptiveQuizOutcome(currentBlunder, false).profile);
            if (nextAttempts === 0 && (result.equityLoss || currentBlunder.equityLoss) >= 0.080) {
                recordBlunder({ ...currentBlunder, id: `fsrs_drill_${currentBlunder.id}`, playedMove: result.playedNotation, gameId: 'quiz_fsrs_v5' });
                setFsrsScheduled(true);
            }
            setStats(getBlunderBankStats());
        }
    }, [currentBlunder, recordAttempt, attemptsLeft, drillMode]);

    const {
        currentBoard, setCurrentBoard, playedMoves, setPlayedMoves,
        usedDice, setUsedDice, selectedPoint, setSelectedPoint,
        selectedDie, setSelectedDie, liveDrillRef,
        handleResetCurrentAttempt, handlePlayMove, handleConfirmBoardMove, handleCheckerClick,
    } = useDrillBoardInteraction({
        currentBlunder, validatedInitialBoard, validationResult,
        onApplyValidation: applyValidationFeedback, attemptsLeft,
        onSetAttemptsLeft: (updater) => setAttemptsLeft(updater),
    });

    useEffect(() => {
        if (!currentBlunder) return;
        setShowHint(false); setValidationResult(null); setAttemptsLeft(2);
        setFsrsScheduled(false); setHoveredChoiceNotation(null); failedOnCurrentQuizRef.current = false;
    }, [currentBlunder]);

    const boardState: BoardState = useMemo(() => ({
        board: validationResult && currentBlunder ? validatedInitialBoard : currentBoard,
        turn: currentBlunder?.player ?? 'X', cubeValue: currentBlunder?.matchContext?.cubeValue ?? 1,
        cubeOwner: currentBlunder?.matchContext?.cubeOwner ?? null, dice: currentBlunder?.dice ?? [3, 1],
        matchLength: currentBlunder?.matchContext?.matchLength ?? 7, scoreX: currentBlunder?.matchContext?.scoreX ?? 0,
        scoreO: currentBlunder?.matchContext?.scoreO ?? 0, crawford: currentBlunder?.matchContext?.crawford ?? false,
        doubled: false, resigned: 0,
    }), [currentBoard, currentBlunder, validationResult, validatedInitialBoard]);

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!currentBlunder) return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        try { return computeLegalTargets(boardState, currentBlunder.dice, usedDice); }
        catch { return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() }; }
    }, [boardState, currentBlunder, usedDice]);

    const canConfirmBoardMove = Boolean(currentBlunder && validationResult === null && playedMoves.length > 0 && ((usedDice[0] && usedDice[1]) || (leftDieTargets.size === 0 && rightDieTargets.size === 0)));
    const pendingBoardNotation = playedMoves.length > 0 && currentBlunder ? formatMoveSequenceNotation(playedMoves, currentBlunder.player) : null;

    const handleSelectQuizChoice = useCallback((notation: string) => {
        if (!currentBlunder || (validationResult !== null && (validationResult.isCorrect || attemptsLeft <= 0))) return;
        impactLight();
        try {
            const moves = parseCoachNotationMoves(expandNotationTokens(notation), currentBlunder.player);
            if (moves.length > 0) {
                const previewBoard = moves.reduce((acc, m) => applyMove(acc, m, currentBlunder.player), [...validatedInitialBoard]);
                setCurrentBoard(previewBoard); setPlayedMoves(moves); setUsedDice([true, true]);
                liveDrillRef.current = { board: previewBoard, usedDice: [true, true], playedMoves: moves };
            }
        } catch { /* ignore */ }
        applyValidationFeedback(validateDrillNotationChoice(currentBlunder, notation));
    }, [currentBlunder, validationResult, attemptsLeft, applyValidationFeedback, validatedInitialBoard, setCurrentBoard, setPlayedMoves, setUsedDice, liveDrillRef]);

    const handleSelectDrillMode = (nextMode: QuizDrillMode) => {
        setDrillMode(nextMode);
        if (nextMode !== 'personal_blunders') {
            const pick = selectNextAdaptiveQuiz(getAllBlunders());
            setCurrentBlunder(pick.quiz); setReasonLabel(pick.reasonLabel); setQuizStepCount(0);
        }
    };
    const handleNextBlunder = () => {
        if (!validationResult) return;
        const nextPick = drillMode === 'personal_blunders' ? selectNextPersonalBlunderQuiz(getAllBlunders(), currentBlunder ? [currentBlunder.id] : []) : selectNextAdaptiveQuiz(getAllBlunders(), currentBlunder ? [currentBlunder.id] : []);
        setCurrentBlunder(nextPick.quiz); setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount((prev) => prev + 1); setStats(getBlunderBankStats()); impactLight();
    };
    const handleResetAllMastery = () => {
        resetAllBlunderMastery(); setAdaptiveProfile(resetAdaptivePlayerProfile());
        setHearts(5); setAttemptsLeft(2); setStreak(0);
        const nextPick = selectNextAdaptiveQuiz(getAllBlunders());
        setCurrentBlunder(nextPick.quiz); setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount(0); setStats(getBlunderBankStats()); toast.info('Votre profil adaptatif a été réinitialisé.');
    };

    const coachHighlight = useMemo(() => {
        if (!currentBlunder) return null;
        if (hoveredChoiceNotation) return { played: [], optimal: parseCoachNotationMoves(expandNotationTokens(hoveredChoiceNotation), currentBlunder.player) };
        if (!validationResult) return null;
        const showOptimalArrow = validationResult.isCorrect || attemptsLeft <= 0;
        const optimalMoves = showOptimalArrow ? parseCoachNotationMoves(expandNotationTokens(currentBlunder.optimalMove), currentBlunder.player) : [];
        const wrongMoves = validationResult.isCorrect ? [] : playedMoves.length > 0 ? playedMoves : parseCoachNotationMoves(expandNotationTokens(validationResult.playedNotation), currentBlunder.player);
        return { played: wrongMoves, optimal: optimalMoves };
    }, [validationResult, currentBlunder, playedMoves, hoveredChoiceNotation, attemptsLeft]);

    const safeErScore = erPrScore ?? 6.3;
    const effectiveTargetQuizEr = currentBlunder ? (typeof currentBlunder.quizTargetER === 'number' ? currentBlunder.quizTargetER : Number((Math.max(0.5, safeErScore - 0.5)).toFixed(1))) : undefined;

    if (drillMode === 'personal_blunders') {
        return <PersonalBlundersNotebookView onSwitchToGeneralQuizzes={() => handleSelectDrillMode('pr_math')} />;
    }

    return (
        <div className="relative flex h-full max-h-full w-full max-w-[1920px] mx-auto flex-col p-1 sm:p-1.5 [@media(max-height:540px)]:!p-0.5 text-[#fdf8eb] bg-[#050505] overflow-hidden">
            {!currentBlunder ? (
                <BlunderDrillFinishedCard xp={xp} onResetCycle={handleResetAllMastery} />
            ) : (
                <div className="flex-1 min-h-0 h-full w-full flex flex-col [@media(orientation:landscape)]:grid [@media(orientation:landscape)]:grid-cols-12 [@media(orientation:landscape)]:grid-rows-[auto_1fr] lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-1 sm:gap-1.5 [@media(max-height:540px)]:!gap-1 overflow-hidden">
                    <div className="shrink-0 [@media(orientation:landscape)]:col-span-4 [@media(orientation:landscape)]:col-start-9 [@media(orientation:landscape)]:row-start-1 lg:col-span-4 lg:col-start-9 lg:row-start-1">
                        <DrillHeader stats={stats} adaptiveProfile={adaptiveProfile} activeCategoryId={normalizeToQuizCategory(currentBlunder.conceptId)} adaptiveReasonLabel={reasonLabel} drillMode={drillMode} personalBlundersCount={personalBlundersCount} isPersonalMatchBlunder={Boolean(currentBlunder && isPersonalMatchBlunder(currentBlunder))} onSelectDrillMode={handleSelectDrillMode} hearts={hearts} attemptsLeft={attemptsLeft} maxAttempts={2} streak={streak} xp={xp} erPrScore={safeErScore} targetQuizEr={effectiveTargetQuizEr} activeTenthsDelta={activeTenthsDelta} liveRatingValue={ratingValue ?? 1500} liveRatingDelta={ratingDelta} onResetAllMastery={handleResetAllMastery} onClose={onClose} />
                    </div>
                    <DrillBoardStage
                        boardState={boardState} leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets}
                        selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice}
                        onCheckerClick={(pt) => handleCheckerClick(pt, leftDieTargets, rightDieTargets)}
                        onCheckerRightClick={(pt) => { if (!validationResult) { impactLight(); setSelectedPoint(pt); setSelectedDie(1); } }}
                        onDestinationClick={(dest) => { if (!validationResult && selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined); }}
                        onPlayMove={handlePlayMove} onSelectDie={(d) => setSelectedDie(d)}
                        onDiceClick={() => setSelectedDie((prev) => (prev === 1 ? 0 : 1))}
                        onDeselect={() => { setSelectedPoint(null); setSelectedDie(null); }}
                        onConfirm={handleConfirmBoardMove} onUndo={handleResetCurrentAttempt}
                        canConfirm={canConfirmBoardMove} canUndo={playedMoves.length > 0 && !validationResult}
                        coachHighlight={coachHighlight} theme={theme}
                    />
                    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col [@media(orientation:landscape)]:col-span-4 [@media(orientation:landscape)]:col-start-9 [@media(orientation:landscape)]:row-start-2 lg:col-span-4 lg:col-start-9 lg:row-start-2 [@media(orientation:landscape)]:h-full lg:h-full max-h-[46dvh] [@media(orientation:landscape)]:max-h-full lg:max-h-full shrink-0">
                        <BlunderDrillFeedbackCard currentBlunder={currentBlunder} currentIndex={quizStepCount} totalBlunders={stats.totalBlunders} showHint={showHint} onToggleHint={() => setShowHint((prev) => !prev)} onResetAttempt={handleResetCurrentAttempt} validationResult={validationResult} attemptsLeft={attemptsLeft} fsrsScheduled={fsrsScheduled} pendingBoardNotation={pendingBoardNotation} canConfirmBoardMove={canConfirmBoardMove} onConfirmBoardMove={handleConfirmBoardMove} onNextBlunder={handleNextBlunder} onSelectQuizChoice={handleSelectQuizChoice} onHoverQuizChoice={setHoveredChoiceNotation} hoveredChoiceNotation={hoveredChoiceNotation} drillMode={drillMode} targetQuizEr={effectiveTargetQuizEr} currentMetricScore={activeMetricScore ?? safeErScore} ratingDelta={ratingDelta} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default BlunderDrillActiveSession;
