'use client';

/**
 * @file src/components/drills/BlunderDrillView.tsx
 * @description Orchestrateur modulaire du Quiz ER / PR (`/puzzles`) et du Quiz ERH (`/drills`) :
 * - Garantit l'invariant des 15 pions par joueur et le Pip Count partagé via `validateBoardState(board)`.
 * - Implémente les **2 essais maximum (`Essais : 2/2 ❤️❤️`)** avec **Indice Socratique** au 1er échec,
 *   réduction de moitié de la pénalité en cas de correction au 2e essai, et création automatique de carte
 *   **FSRS v5** (*Personal Blunder Drill*) si `ΔEMG >= 0.080`.
 * - Permet de jouer librement ses pions sur le plateau (*Smart Point Click*) puis de cliquer sur **`[✓ Valider mon coup]`**.
 * - Strictement < 295 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import { applyMove, computeLegalTargets, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import { formatMoveSequenceNotation } from '../../lib/engine/evaluator';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { useDrillRating } from '../../hooks/useDrillRating';
import {
    getAllBlunders,
    getBlunderBankStats,
    resetAllBlunderMastery,
    markBlunderAttempt,
    recordBlunder,
} from '../../features/drills/blunderBank';
import { validateDrillMove, validateDrillNotationChoice } from '../../features/drills/blunderDrillEngine';
import { validateBoardState, computeTenthsMetricDelta } from '../../features/drills/drillSubAgentsPipeline';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import {
    getAdaptivePlayerProfile,
    recordAdaptiveQuizOutcome,
    resetAdaptivePlayerProfile,
    selectNextAdaptiveQuiz,
    selectNextPersonalBlunderQuiz,
    isPersonalMatchBlunder,
    normalizeToQuizCategory,
    type AdaptivePlayerProfile,
} from '../../features/drills/adaptiveQuizEngine';
import type { PlayerBlunderRecord, DrillValidationResult, BlunderBankStats } from '../../features/drills/types';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { rewardFirstTryQuizOnPublicPr, breakFirstTryQuizStreak } from '../../features/multiplayer/elo';
import { toast } from '../toast/ToastContext';
import DrillHeader, { type QuizDrillMode } from './DrillHeader';
import BlunderDrillFeedbackCard from './BlunderDrillFeedbackCard';

export interface BlunderDrillViewProps {
    initialConceptId?: string;
    initialMode?: QuizDrillMode;
    onClose?: () => void;
}

function expandNotationTokens(notation: string): string {
    return notation
        .replace(/\*/g, '')
        .trim()
        .split(/\s+/)
        .flatMap((tok) => {
            const parts = tok.split('/');
            return parts.length > 2 ? parts.slice(0, -1).map((p, k) => `${p}/${parts[k + 1]}`) : [tok];
        })
        .join(' ');
}

export default function BlunderDrillView({ initialConceptId, initialMode = 'adaptive', onClose }: BlunderDrillViewProps) {
    const { theme } = useBoardTheme();
    const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptivePlayerProfile>(() => getAdaptivePlayerProfile());
    const [stats, setStats] = useState<BlunderBankStats>(() => getBlunderBankStats());
    const [drillMode, setDrillMode] = useState<QuizDrillMode>(initialMode);
    const [hearts, setHearts] = useState<number>(5);
    const [attemptsLeft, setAttemptsLeft] = useState<number>(2);
    const [fsrsScheduled, setFsrsScheduled] = useState<boolean>(false);
    const [streak, setStreak] = useState<number>(0);
    const [xp, setXp] = useState<number>(0);
    const [quizStepCount, setQuizStepCount] = useState<number>(0);
    const [hoveredChoiceNotation, setHoveredChoiceNotation] = useState<string | null>(null);

    const isErMode = drillMode === 'pr_math';
    const { erPrScore, erhScore, activeMetricScore, activeTenthsDelta, ratingValue, ratingDelta, recordAttempt } = useDrillRating(isErMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const personalBlundersCount = useMemo(() => getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length, [stats]);

    const initialSelection = useMemo(() => {
        const all = getAllBlunders();
        if (initialConceptId && initialConceptId !== 'all') {
            const m = all.find((b) => b.conceptId === initialConceptId);
            if (m) return { quiz: m, targetCategory: { id: normalizeToQuizCategory(m.conceptId), shortLabel: m.conceptName, fullName: m.conceptName, icon: '🎯' }, reasonLabel: `Focus ciblé · ${m.conceptName}` };
        }
        return selectNextAdaptiveQuiz(all);
    }, [initialConceptId]);

    const [currentBlunder, setCurrentBlunder] = useState<PlayerBlunderRecord | null>(() => initialSelection.quiz);
    const [reasonLabel, setReasonLabel] = useState<string>(() => initialSelection.reasonLabel);
    const validatedInitialBoard = useMemo(
        () => (currentBlunder ? validateBoardState(currentBlunder.board, currentBlunder.player).normalizedBoard : new Array<number>(28).fill(0)),
        [currentBlunder],
    );
    const [currentBoard, setCurrentBoard] = useState<number[]>(() => validatedInitialBoard);
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<DrillValidationResult | null>(null);
    const failedOnCurrentQuizRef = useRef<boolean>(false);

    const liveDrillRef = useRef<{ board: number[]; usedDice: [boolean, boolean]; playedMoves: Move[] }>({ board: currentBoard, usedDice: [false, false], playedMoves: [] });
    liveDrillRef.current = { board: currentBoard, usedDice, playedMoves };

    useEffect(() => {
        if (!currentBlunder) return;
        const cleanBoard = validateBoardState(currentBlunder.board, currentBlunder.player).normalizedBoard;
        setCurrentBoard(cleanBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setShowHint(false);
        setValidationResult(null);
        setAttemptsLeft(2);
        setFsrsScheduled(false);
        setHoveredChoiceNotation(null);
        failedOnCurrentQuizRef.current = false;
        liveDrillRef.current = { board: cleanBoard, usedDice: [false, false], playedMoves: [] };
    }, [currentBlunder]);

    const applyValidationFeedback = useCallback((result: DrillValidationResult) => {
        setValidationResult(result);
        setHoveredChoiceNotation(null);
        if (!currentBlunder) return;

        const isNearOptimal = result.verdict === 'acceptable' || (result.equityLoss > 0 && result.equityLoss <= 0.020);

        if (result.isCorrect) {
            // Si réussi au 2e essai après un 1er échec, réduit la pénalité de moitié (-0.1) ; si quasi-optimal (-0.010 EMG), 0 pénalité
            const explicitDelta = isNearOptimal ? 0 : failedOnCurrentQuizRef.current ? -0.1 : -0.1;
            recordAttempt(true, currentBlunder.tier ?? 2, result.equityLoss, explicitDelta);
            markBlunderAttempt(currentBlunder.id, true);
            setAdaptiveProfile(recordAdaptiveQuizOutcome(currentBlunder, true).profile);
            setStats(getBlunderBankStats());
            notificationSuccess();
            if (!failedOnCurrentQuizRef.current) rewardFirstTryQuizOnPublicPr();
            setStreak((prev) => { const next = prev + 1; setXp((c) => c + 25 * Math.min(next, 4)); return next; });
        } else {
            const nextAttempts = Math.max(0, attemptsLeft - 1);
            setAttemptsLeft(nextAttempts);
            failedOnCurrentQuizRef.current = true;
            breakFirstTryQuizStreak();
            notificationError();
            setStreak(0);
            setHearts((prev) => Math.max(0, prev - 1));

            // 1er essai raté : pénalité +0.2 ; 2e essai raté : pénalité complète (+0.3 à +0.5) + carte FSRS v5 si ΔEMG >= 0.080
            const penaltyTenths = nextAttempts === 1 ? 0.2 : computeTenthsMetricDelta(false, result.equityLoss || currentBlunder.equityLoss);
            recordAttempt(false, currentBlunder.tier ?? 2, result.equityLoss || currentBlunder.equityLoss, penaltyTenths);
            markBlunderAttempt(currentBlunder.id, false);
            setAdaptiveProfile(recordAdaptiveQuizOutcome(currentBlunder, false).profile);

            if (nextAttempts === 0 && (result.equityLoss || currentBlunder.equityLoss) >= 0.080) {
                recordBlunder({
                    ...currentBlunder,
                    id: `fsrs_drill_${currentBlunder.id}`,
                    playedMove: result.playedNotation,
                    gameId: 'quiz_fsrs_v5',
                });
                setFsrsScheduled(true);
            }
            setStats(getBlunderBankStats());
        }
    }, [currentBlunder, recordAttempt, attemptsLeft]);

    const boardState: BoardState = useMemo(() => ({
        board: validationResult && currentBlunder ? validatedInitialBoard : currentBoard,
        turn: currentBlunder?.player ?? 'X',
        cubeValue: currentBlunder?.matchContext?.cubeValue ?? 1,
        cubeOwner: currentBlunder?.matchContext?.cubeOwner ?? null,
        dice: currentBlunder?.dice ?? [3, 1],
        matchLength: currentBlunder?.matchContext?.matchLength ?? 7,
        scoreX: currentBlunder?.matchContext?.scoreX ?? 0,
        scoreO: currentBlunder?.matchContext?.scoreO ?? 0,
        crawford: currentBlunder?.matchContext?.crawford ?? false,
        doubled: false,
        resigned: 0,
    }), [currentBoard, currentBlunder, validationResult, validatedInitialBoard]);

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!currentBlunder) return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        try { return computeLegalTargets(boardState, currentBlunder.dice, usedDice); }
        catch { return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() }; }
    }, [boardState, currentBlunder, usedDice]);

    const canConfirmBoardMove = useMemo(() => {
        if (!currentBlunder || validationResult !== null || playedMoves.length === 0) return false;
        return (usedDice[0] && usedDice[1]) || (leftDieTargets.size === 0 && rightDieTargets.size === 0);
    }, [currentBlunder, validationResult, playedMoves.length, usedDice, leftDieTargets.size, rightDieTargets.size]);

    const pendingBoardNotation = useMemo(
        () => (playedMoves.length > 0 && currentBlunder ? formatMoveSequenceNotation(playedMoves, currentBlunder.player) : null),
        [playedMoves, currentBlunder],
    );

    const handleConfirmBoardMove = useCallback(() => {
        if (!currentBlunder || validationResult !== null || playedMoves.length === 0) return;
        impactLight();
        applyValidationFeedback(validateDrillMove(currentBlunder, playedMoves, currentBoard));
    }, [currentBlunder, validationResult, playedMoves, currentBoard, applyValidationFeedback]);

    const handleResetCurrentAttempt = useCallback(() => {
        if (!currentBlunder) return;
        setCurrentBoard(validatedInitialBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setValidationResult(null);
        setHoveredChoiceNotation(null);
        if (attemptsLeft <= 0) setAttemptsLeft(1);
        liveDrillRef.current = { board: validatedInitialBoard, usedDice: [false, false], playedMoves: [] };
        impactLight();
    }, [currentBlunder, validatedInitialBoard, attemptsLeft]);

    const handlePlayMove = useCallback((from: number, to: number, explicitDie?: 0 | 1) => {
        if (!currentBlunder || validationResult !== null) return;
        const live = liveDrillRef.current;
        let liveTargets = { leftDieTargets, rightDieTargets };
        if (live.board !== currentBoard || live.usedDice !== usedDice) {
            try { liveTargets = computeLegalTargets({ ...boardState, board: [...live.board] }, currentBlunder.dice, live.usedDice); }
            catch { return; }
        }
        const leftDests = liveTargets.leftDieTargets.get(from) ?? [];
        const rightDests = liveTargets.rightDieTargets.get(from) ?? [];
        let dieUsed: 0 | 1 | null = null;
        if (explicitDie === 0 && !live.usedDice[0] && leftDests.includes(to)) dieUsed = 0;
        else if (explicitDie === 1 && !live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        else if (selectedDie === 1 && !live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        else if (!live.usedDice[0] && leftDests.includes(to)) dieUsed = 0;
        else if (!live.usedDice[1] && rightDests.includes(to)) dieUsed = 1;
        if (dieUsed === null) return;

        impactLight();
        const move: Move = { from, to };
        const newBoard = applyMove(live.board, move, currentBlunder.player);
        const newUsed: [boolean, boolean] = [live.usedDice[0], live.usedDice[1]];
        newUsed[dieUsed] = true;
        const newPlayedMoves = [...live.playedMoves, move];
        liveDrillRef.current = { board: newBoard, usedDice: newUsed, playedMoves: newPlayedMoves };
        setCurrentBoard(newBoard);
        setUsedDice(newUsed);
        setPlayedMoves(newPlayedMoves);
        setSelectedPoint(null);
        setSelectedDie(null);
    }, [currentBlunder, validationResult, leftDieTargets, rightDieTargets, currentBoard, usedDice, boardState, selectedDie]);

    const handleSelectQuizChoice = useCallback((notation: string) => {
        if (!currentBlunder || (validationResult !== null && (validationResult.isCorrect || attemptsLeft <= 0))) return;
        impactLight();
        try {
            const moves = parseCoachNotationMoves(expandNotationTokens(notation), currentBlunder.player);
            if (moves.length > 0) {
                const previewBoard = moves.reduce((acc, m) => applyMove(acc, m, currentBlunder.player), [...validatedInitialBoard]);
                setCurrentBoard(previewBoard);
                setPlayedMoves(moves);
                setUsedDice([true, true]);
                liveDrillRef.current = { board: previewBoard, usedDice: [true, true], playedMoves: moves };
            }
        } catch { /* ignore */ }
        applyValidationFeedback(validateDrillNotationChoice(currentBlunder, notation));
    }, [currentBlunder, validationResult, attemptsLeft, applyValidationFeedback, validatedInitialBoard]);

    const handleCheckerClick = useCallback((point: number) => {
        if (!currentBlunder || validationResult !== null) return;
        const isPlayerX = currentBlunder.player === 'X';
        const hasChecker = isPlayerX ? (point === X_BAR ? currentBoard[X_BAR] > 0 : currentBoard[point] > 0) : (point === O_BAR ? currentBoard[O_BAR] < 0 : currentBoard[point] < 0);
        if (!hasChecker) return;
        const leftDests = leftDieTargets.get(point) ?? [];
        const rightDests = rightDieTargets.get(point) ?? [];
        if (selectedDie === 1 && !usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
        else if (!usedDice[0] && leftDests.length > 0) handlePlayMove(point, leftDests[0], 0);
        else if (!usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
    }, [currentBlunder, validationResult, currentBoard, selectedDie, leftDieTargets, rightDieTargets, usedDice, handlePlayMove]);

    const handleSelectDrillMode = (nextMode: QuizDrillMode) => {
        setDrillMode(nextMode);
        const all = getAllBlunders();
        const pick = nextMode === 'personal_blunders' ? selectNextPersonalBlunderQuiz(all) : selectNextAdaptiveQuiz(all);
        setCurrentBlunder(pick.quiz);
        setReasonLabel(pick.reasonLabel);
        setQuizStepCount(0);
    };

    const handleNextBlunder = () => {
        if (!validationResult) return;
        const all = getAllBlunders();
        const exclude = currentBlunder ? [currentBlunder.id] : [];
        const nextPick = drillMode === 'personal_blunders' ? selectNextPersonalBlunderQuiz(all, exclude) : selectNextAdaptiveQuiz(all, exclude);
        setCurrentBlunder(nextPick.quiz);
        setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount((prev) => prev + 1);
        setStats(getBlunderBankStats());
        impactLight();
    };

    const handleResetAllMastery = () => {
        resetAllBlunderMastery();
        setAdaptiveProfile(resetAdaptivePlayerProfile());
        setHearts(5);
        setAttemptsLeft(2);
        setStreak(0);
        const nextPick = selectNextAdaptiveQuiz(getAllBlunders());
        setCurrentBlunder(nextPick.quiz);
        setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount(0);
        setStats(getBlunderBankStats());
        toast.info('Votre profil adaptatif a été réinitialisé.');
    };

    const coachHighlight = useMemo(() => {
        if (!currentBlunder) return null;
        if (hoveredChoiceNotation) return { played: [], optimal: parseCoachNotationMoves(expandNotationTokens(hoveredChoiceNotation), currentBlunder.player) };
        if (!validationResult) return null;
        // Au 1er essai raté (attemptsLeft === 1), ne pas révéler la flèche optimale !
        const showOptimalArrow = validationResult.isCorrect || attemptsLeft <= 0;
        const optimalMoves = showOptimalArrow ? parseCoachNotationMoves(expandNotationTokens(currentBlunder.optimalMove), currentBlunder.player) : [];
        const wrongMoves = validationResult.isCorrect ? [] : playedMoves.length > 0 ? playedMoves : parseCoachNotationMoves(expandNotationTokens(validationResult.playedNotation), currentBlunder.player);
        return { played: wrongMoves, optimal: optimalMoves };
    }, [validationResult, currentBlunder, playedMoves, hoveredChoiceNotation, attemptsLeft]);

    return (
        <div className="relative flex h-dvh max-h-dvh w-full max-w-[1920px] mx-auto flex-col p-1 sm:p-1.5 [@media(max-height:540px)]:!p-0.5 text-[#fdf8eb] bg-[#050505] overflow-hidden">
            {!currentBlunder ? (
                <div className="w-full m-auto max-w-md rounded-2xl border border-white/10 bg-[#12151C] p-6 text-center shadow-2xl space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#2a170c] text-2xl">🏆</div>
                    <h2 className="text-lg font-black text-[#fdf8eb]">Parcours terminé ! (+{xp} XP)</h2>
                    <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                        <button type="button" onClick={handleResetAllMastery} className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] shadow-md transition hover:brightness-105">🎯 Nouveau cycle adaptatif</button>
                        <Link href="/progression" className="rounded-xl border border-white/10 bg-[#150c07] px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">📊 Voir ma progression</Link>
                    </div>
                </div>
            ) : (
                <div className="flex-1 min-h-0 h-full w-full flex flex-col [@media(orientation:landscape)]:grid [@media(orientation:landscape)]:grid-cols-12 [@media(orientation:landscape)]:grid-rows-[auto_1fr] lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] gap-1 sm:gap-1.5 [@media(max-height:540px)]:!gap-1 overflow-hidden">
                    <div className="shrink-0 [@media(orientation:landscape)]:col-span-4 [@media(orientation:landscape)]:col-start-9 [@media(orientation:landscape)]:row-start-1 lg:col-span-4 lg:col-start-9 lg:row-start-1">
                        <DrillHeader stats={stats} adaptiveProfile={adaptiveProfile} activeCategoryId={normalizeToQuizCategory(currentBlunder.conceptId)} adaptiveReasonLabel={reasonLabel} drillMode={drillMode} personalBlundersCount={personalBlundersCount} onSelectDrillMode={handleSelectDrillMode} hearts={hearts} attemptsLeft={attemptsLeft} maxAttempts={2} streak={streak} xp={xp} erPrScore={erPrScore} erhScore={erhScore} activeTenthsDelta={activeTenthsDelta} liveRatingValue={ratingValue} liveRatingDelta={ratingDelta} onResetAllMastery={handleResetAllMastery} onClose={onClose} />
                    </div>
                    <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#050505] p-0.5 shadow-2xl [@media(orientation:landscape)]:col-span-8 [@media(orientation:landscape)]:col-start-1 [@media(orientation:landscape)]:row-start-1 [@media(orientation:landscape)]:row-span-2 lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:row-span-2 [@media(orientation:landscape)]:h-full lg:h-full">
                        <Board state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets} selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice} onCheckerClick={handleCheckerClick} onCheckerRightClick={(pt) => { if (!validationResult) { impactLight(); setSelectedPoint(pt); setSelectedDie(1); } }} onDestinationClick={(dest) => { if (!validationResult && selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined); }} onPlayMove={handlePlayMove} onSelectDie={(d) => setSelectedDie(d)} onDiceClick={() => setSelectedDie((prev) => (prev === 1 ? 0 : 1))} onDeselect={() => { setSelectedPoint(null); setSelectedDie(null); }} onConfirm={handleConfirmBoardMove} onUndo={handleResetCurrentAttempt} canConfirm={canConfirmBoardMove} canUndo={playedMoves.length > 0 && !validationResult} coachHighlight={coachHighlight} theme={theme} />
                    </div>
                    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col [@media(orientation:landscape)]:col-span-4 [@media(orientation:landscape)]:col-start-9 [@media(orientation:landscape)]:row-start-2 lg:col-span-4 lg:col-start-9 lg:row-start-2 [@media(orientation:landscape)]:h-full lg:h-full max-h-[46dvh] [@media(orientation:landscape)]:max-h-full lg:max-h-full shrink-0">
                        <BlunderDrillFeedbackCard currentBlunder={currentBlunder} currentIndex={quizStepCount} totalBlunders={stats.totalBlunders} showHint={showHint} onToggleHint={() => setShowHint((prev) => !prev)} onResetAttempt={handleResetCurrentAttempt} validationResult={validationResult} attemptsLeft={attemptsLeft} fsrsScheduled={fsrsScheduled} pendingBoardNotation={pendingBoardNotation} canConfirmBoardMove={canConfirmBoardMove} onConfirmBoardMove={handleConfirmBoardMove} onNextBlunder={handleNextBlunder} onSelectQuizChoice={handleSelectQuizChoice} onHoverQuizChoice={setHoveredChoiceNotation} hoveredChoiceNotation={hoveredChoiceNotation} drillMode={drillMode} currentMetricScore={activeMetricScore} ratingDelta={ratingDelta} />
                    </div>
                </div>
            )}
        </div>
    );
}
