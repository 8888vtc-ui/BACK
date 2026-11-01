'use client';

/**
 * @file src/components/drills/BlunderDrillView.tsx
 * @description Vue interactive du Quiz ER (`/puzzles`) et du Quiz ERH (`/drills`) :
 * - Séparation 100 % étanche entre ER et ERH (état, affichage et persistance).
 * - Mise à jour dynamique en temps réel du Niveau ER ou ERH à chaque coup (+ en vert / - en rouge).
 * - Survol d'un choix A/B/C/D -> flèche de prévisualisation immédiate sur le plateau.
 * - Clic sur A/B/C/D (ou coup joué sur le plateau) -> validation en 1 clic sans bouton "Valider".
 * - Strictement < 300 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import { applyMove, computeLegalTargets, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { getAllBlunders, getBlunderBankStats, resetAllBlunderMastery, markBlunderAttempt } from '../../features/drills/blunderBank';
import { validateDrillMove, validateDrillNotationChoice } from '../../features/drills/blunderDrillEngine';
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
import {
    getQuizErState,
    getQuizErhState,
    recordQuizErAttempt,
    recordQuizErhAttempt,
} from '../../features/drills/quizRatingStore';
import type { PlayerBlunderRecord, DrillValidationResult, BlunderBankStats } from '../../features/drills/types';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { rewardFirstTryQuizOnPublicPr, breakFirstTryQuizStreak } from '../../features/multiplayer/elo';
import { toast } from '../toast/ToastContext';
import BlunderDrillHeader, { type QuizDrillMode } from './BlunderDrillHeader';
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
            if (parts.length > 2) {
                const res: string[] = [];
                for (let k = 0; k < parts.length - 1; k++) {
                    res.push(`${parts[k]}/${parts[k + 1]}`);
                }
                return res;
            }
            return [tok];
        })
        .join(' ');
}

export default function BlunderDrillView({ initialConceptId, initialMode = 'adaptive', onClose }: BlunderDrillViewProps) {
    const { theme } = useBoardTheme();
    const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptivePlayerProfile>(() => getAdaptivePlayerProfile());
    const [stats, setStats] = useState<BlunderBankStats>(() => getBlunderBankStats());
    const [drillMode, setDrillMode] = useState<QuizDrillMode>(initialMode);
    const [hearts, setHearts] = useState<number>(5);
    const [streak, setStreak] = useState<number>(0);
    const [xp, setXp] = useState<number>(0);
    const [quizStepCount, setQuizStepCount] = useState<number>(0);
    const [hoveredChoiceNotation, setHoveredChoiceNotation] = useState<string | null>(null);

    const isErMode = drillMode === 'pr_math';
    const [liveRatingValue, setLiveRatingValue] = useState<number>(() =>
        initialMode === 'pr_math' ? getQuizErState().erRating : getQuizErhState().erhRating,
    );
    const [liveRatingDelta, setLiveRatingDelta] = useState<number>(() =>
        initialMode === 'pr_math' ? getQuizErState().lastDeltaEr : getQuizErhState().lastDeltaErh,
    );

    const personalBlundersCount = useMemo(
        () => getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stats],
    );

    const initialSelection = useMemo(() => {
        const all = getAllBlunders();
        if (initialConceptId && initialConceptId !== 'all') {
            const matching = all.find((b) => b.conceptId === initialConceptId);
            if (matching) {
                return {
                    quiz: matching,
                    targetCategory: { id: normalizeToQuizCategory(matching.conceptId), shortLabel: matching.conceptName, fullName: matching.conceptName, icon: '🎯' },
                    reasonLabel: `Focus ciblé · ${matching.conceptName}`,
                };
            }
        }
        return selectNextAdaptiveQuiz(all);
    }, [initialConceptId]);

    const [currentBlunder, setCurrentBlunder] = useState<PlayerBlunderRecord | null>(() => initialSelection.quiz);
    const [reasonLabel, setReasonLabel] = useState<string>(() => initialSelection.reasonLabel);
    const [currentBoard, setCurrentBoard] = useState<number[]>(() => currentBlunder?.board ?? new Array(28).fill(0));
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<DrillValidationResult | null>(null);
    const failedOnCurrentQuizRef = useRef<boolean>(false);

    const liveDrillRef = useRef<{ board: number[]; usedDice: [boolean, boolean]; playedMoves: Move[] }>({
        board: currentBoard,
        usedDice: [false, false],
        playedMoves: [],
    });
    liveDrillRef.current = { board: currentBoard, usedDice, playedMoves };

    useEffect(() => {
        if (currentBlunder) {
            setCurrentBoard(currentBlunder.board);
            setPlayedMoves([]);
            setUsedDice([false, false]);
            setSelectedPoint(null);
            setSelectedDie(null);
            setShowHint(false);
            setValidationResult(null);
            setHoveredChoiceNotation(null);
            failedOnCurrentQuizRef.current = false;
            liveDrillRef.current = { board: currentBlunder.board, usedDice: [false, false], playedMoves: [] };
        }
    }, [currentBlunder]);

    const applyValidationFeedback = useCallback(
        (result: DrillValidationResult) => {
            setValidationResult(result);
            setHoveredChoiceNotation(null);
            if (!currentBlunder) return;

            // Persistance strictement cloisonnée : ER uniquement en mode ER, ERH uniquement en mode ERH
            if (isErMode) {
                const updatedEr = recordQuizErAttempt(result.isCorrect, currentBlunder.tier ?? 2, currentBlunder.equityLoss);
                setLiveRatingValue(updatedEr.erRating);
                setLiveRatingDelta(updatedEr.lastDeltaEr);
            } else {
                const updatedErh = recordQuizErhAttempt(result.isCorrect, currentBlunder.tier ?? 2, currentBlunder.equityLoss);
                setLiveRatingValue(updatedErh.erhRating);
                setLiveRatingDelta(updatedErh.lastDeltaErh);
            }

            if (result.isCorrect) {
                notificationSuccess();
                markBlunderAttempt(currentBlunder.id, true);
                if (!failedOnCurrentQuizRef.current) {
                    rewardFirstTryQuizOnPublicPr();
                }
                const outcome = recordAdaptiveQuizOutcome(currentBlunder, true);
                setAdaptiveProfile(outcome.profile);
                setStats(getBlunderBankStats());
                setStreak((prev) => {
                    const next = prev + 1;
                    setXp((currXp) => currXp + 25 * Math.min(next, 4));
                    return next;
                });
            } else {
                failedOnCurrentQuizRef.current = true;
                breakFirstTryQuizStreak();
                notificationError();
                markBlunderAttempt(currentBlunder.id, false);
                const outcome = recordAdaptiveQuizOutcome(currentBlunder, false);
                setAdaptiveProfile(outcome.profile);
                setStats(getBlunderBankStats());
                setStreak(0);
                setHearts((prev) => Math.max(0, prev - 1));
            }
        },
        [currentBlunder, isErMode],
    );

    const boardState: BoardState = useMemo(
        () => ({
            board: validationResult && currentBlunder ? currentBlunder.board : currentBoard,
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
        }),
        [currentBoard, currentBlunder, validationResult],
    );

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!currentBlunder) return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        try {
            return computeLegalTargets(boardState, currentBlunder.dice, usedDice);
        } catch {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
    }, [boardState, currentBlunder, usedDice]);

    const handleResetCurrentAttempt = useCallback(() => {
        if (!currentBlunder) return;
        setCurrentBoard(currentBlunder.board);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setValidationResult(null);
        setHoveredChoiceNotation(null);
        liveDrillRef.current = { board: currentBlunder.board, usedDice: [false, false], playedMoves: [] };
        impactLight();
    }, [currentBlunder]);

    const handlePlayMove = useCallback(
        (from: number, to: number, explicitDie?: 0 | 1) => {
            if (!currentBlunder || validationResult !== null) return;
            const live = liveDrillRef.current;
            let liveTargets = { leftDieTargets, rightDieTargets };
            if (live.board !== currentBoard || live.usedDice !== usedDice) {
                try {
                    liveTargets = computeLegalTargets({ ...boardState, board: [...live.board] }, currentBlunder.dice, live.usedDice);
                } catch {
                    return;
                }
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

            const remaining = computeLegalTargets({ ...boardState, board: newBoard }, currentBlunder.dice, newUsed);
            const turnFinished = (newUsed[0] && newUsed[1]) || (remaining.leftDieTargets.size === 0 && remaining.rightDieTargets.size === 0);
            if (turnFinished) {
                const result = validateDrillMove(currentBlunder, newPlayedMoves, newBoard);
                applyValidationFeedback(result);
            }
        },
        [currentBlunder, validationResult, leftDieTargets, rightDieTargets, currentBoard, usedDice, boardState, selectedDie, applyValidationFeedback],
    );

    const handleSelectQuizChoice = useCallback(
        (notation: string) => {
            if (!currentBlunder || validationResult !== null) return;
            impactLight();
            try {
                const moves = parseCoachNotationMoves(expandNotationTokens(notation), currentBlunder.player);
                if (moves.length > 0) {
                    let previewBoard = [...currentBlunder.board];
                    for (const m of moves) {
                        previewBoard = applyMove(previewBoard, m, currentBlunder.player);
                    }
                    setCurrentBoard(previewBoard);
                    setPlayedMoves(moves);
                    setUsedDice([true, true]);
                    liveDrillRef.current = { board: previewBoard, usedDice: [true, true], playedMoves: moves };
                }
            } catch {
                // ignore notation preview errors
            }
            const result = validateDrillNotationChoice(currentBlunder, notation);
            applyValidationFeedback(result);
        },
        [currentBlunder, validationResult, applyValidationFeedback],
    );

    const handleCheckerClick = useCallback(
        (point: number) => {
            if (!currentBlunder || validationResult !== null) return;
            const isPlayerX = currentBlunder.player === 'X';
            const hasChecker = isPlayerX
                ? point === X_BAR ? currentBoard[X_BAR] > 0 : currentBoard[point] > 0
                : point === O_BAR ? currentBoard[O_BAR] < 0 : currentBoard[point] < 0;
            if (!hasChecker) return;

            const leftDests = leftDieTargets.get(point) ?? [];
            const rightDests = rightDieTargets.get(point) ?? [];
            if (selectedDie === 1 && !usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
            else if (!usedDice[0] && leftDests.length > 0) handlePlayMove(point, leftDests[0], 0);
            else if (!usedDice[1] && rightDests.length > 0) handlePlayMove(point, rightDests[0], 1);
        },
        [currentBlunder, validationResult, currentBoard, selectedDie, leftDieTargets, rightDieTargets, usedDice, handlePlayMove],
    );

    const handleSelectDrillMode = (nextMode: QuizDrillMode) => {
        setDrillMode(nextMode);
        const all = getAllBlunders();
        const pick =
            nextMode === 'personal_blunders'
                ? selectNextPersonalBlunderQuiz(all)
                : selectNextAdaptiveQuiz(all);
        setCurrentBlunder(pick.quiz);
        setReasonLabel(pick.reasonLabel);
        setQuizStepCount(0);
    };

    const handleNextBlunder = () => {
        if (!validationResult) return;
        const all = getAllBlunders();
        const exclude = currentBlunder ? [currentBlunder.id] : [];
        const nextPick =
            drillMode === 'personal_blunders'
                ? selectNextPersonalBlunderQuiz(all, exclude)
                : selectNextAdaptiveQuiz(all, exclude);
        setCurrentBlunder(nextPick.quiz);
        setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount((prev) => prev + 1);
        setStats(getBlunderBankStats());
        impactLight();
    };

    const handleResetAllMastery = () => {
        resetAllBlunderMastery();
        const freshProfile = resetAdaptivePlayerProfile();
        setAdaptiveProfile(freshProfile);
        setHearts(5);
        setStreak(0);
        const nextPick = selectNextAdaptiveQuiz(getAllBlunders());
        setCurrentBlunder(nextPick.quiz);
        setReasonLabel(nextPick.reasonLabel);
        setQuizStepCount(0);
        setStats(getBlunderBankStats());
        toast.info('Votre profil adaptatif a été réinitialisé.');
    };

    const activeCategoryId = currentBlunder ? normalizeToQuizCategory(currentBlunder.conceptId) : undefined;

    const coachHighlight = useMemo(() => {
        if (!currentBlunder) return null;
        if (!validationResult && hoveredChoiceNotation) {
            const previewMoves = parseCoachNotationMoves(expandNotationTokens(hoveredChoiceNotation), currentBlunder.player);
            return { played: [], optimal: previewMoves };
        }
        if (!validationResult) return null;
        const optimalMoves = parseCoachNotationMoves(expandNotationTokens(currentBlunder.optimalMove), currentBlunder.player);
        const wrongMoves = validationResult.isCorrect
            ? []
            : playedMoves.length > 0
                ? playedMoves
                : parseCoachNotationMoves(expandNotationTokens(validationResult.playedNotation), currentBlunder.player);
        return { played: wrongMoves, optimal: optimalMoves };
    }, [validationResult, currentBlunder, playedMoves, hoveredChoiceNotation]);

    return (
        <div className="relative flex h-dvh max-h-dvh w-full max-w-[1920px] mx-auto flex-col p-1 sm:p-1.5 [@media(max-height:540px)]:!p-0.5 text-[#fdf8eb] overflow-hidden">
            {!currentBlunder ? (
                <div className="w-full m-auto max-w-md rounded-2xl border border-white/10 bg-[#0e121b] p-6 text-center shadow-2xl space-y-3">
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
                        <BlunderDrillHeader
                            stats={stats}
                            adaptiveProfile={adaptiveProfile}
                            activeCategoryId={activeCategoryId}
                            adaptiveReasonLabel={reasonLabel}
                            drillMode={drillMode}
                            personalBlundersCount={personalBlundersCount}
                            onSelectDrillMode={handleSelectDrillMode}
                            hearts={hearts}
                            streak={streak}
                            xp={xp}
                            liveRatingValue={liveRatingValue}
                            liveRatingDelta={liveRatingDelta}
                            onResetAllMastery={handleResetAllMastery}
                            onClose={onClose}
                        />
                    </div>

                    <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#080a0f] p-0.5 shadow-2xl [@media(orientation:landscape)]:col-span-8 [@media(orientation:landscape)]:col-start-1 [@media(orientation:landscape)]:row-start-1 [@media(orientation:landscape)]:row-span-2 lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:row-span-2 [@media(orientation:landscape)]:h-full lg:h-full">
                        <Board
                            state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets}
                            selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice}
                            onCheckerClick={handleCheckerClick}
                            onCheckerRightClick={(pt) => { if (validationResult) return; impactLight(); setSelectedPoint(pt); setSelectedDie(1); }}
                            onDestinationClick={(dest) => { if (!validationResult && currentBlunder && selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined); }}
                            onPlayMove={handlePlayMove}
                            onSelectDie={(d) => setSelectedDie(d)}
                            onDiceClick={() => setSelectedDie((prev) => (prev === 1 ? 0 : 1))}
                            onDeselect={() => { setSelectedPoint(null); setSelectedDie(null); }}
                            onUndo={handleResetCurrentAttempt}
                            canConfirm={false}
                            canUndo={playedMoves.length > 0 && !validationResult}
                            coachHighlight={coachHighlight}
                            theme={theme}
                        />
                    </div>

                    <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col [@media(orientation:landscape)]:col-span-4 [@media(orientation:landscape)]:col-start-9 [@media(orientation:landscape)]:row-start-2 lg:col-span-4 lg:col-start-9 lg:row-start-2 [@media(orientation:landscape)]:h-full lg:h-full max-h-[46dvh] [@media(orientation:landscape)]:max-h-full lg:max-h-full shrink-0">
                        <BlunderDrillFeedbackCard
                            currentBlunder={currentBlunder}
                            currentIndex={quizStepCount}
                            totalBlunders={stats.totalBlunders}
                            showHint={showHint}
                            onToggleHint={() => setShowHint((prev) => !prev)}
                            onResetAttempt={handleResetCurrentAttempt}
                            validationResult={validationResult}
                            onNextBlunder={handleNextBlunder}
                            onSelectQuizChoice={handleSelectQuizChoice}
                            onHoverQuizChoice={setHoveredChoiceNotation}
                            hoveredChoiceNotation={hoveredChoiceNotation}
                            drillMode={drillMode}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
