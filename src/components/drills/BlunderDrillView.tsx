'use client';

/**
 * Vue interactive du Parcours Adaptatif de Quizz (`BlunderDrillView.tsx`).
 * Zéro Sous-Menu : Sélection aléatoire intelligente pondérée par les faiblesses sur les 9 techniques,
 * garantie mathématique Zéro Doublon (`seenQuizIds`), et évolution automatique de niveau (N1 0-ply -> N4 3-ply).
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import { applyMove, computeLegalTargets, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { getAllBlunders, getBlunderBankStats, resetAllBlunderMastery, markBlunderAttempt } from '../../features/drills/blunderBank';
import { validateDrillMove, validateDrillNotationChoice } from '../../features/drills/blunderDrillEngine';
import { formatCoachMoveSequence, parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
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
import {
    rewardFirstTryQuizOnPublicPr,
    breakFirstTryQuizStreak,
    MAX_QUIZ_CRYSTALLIZATION_STACK,
} from '../../features/multiplayer/elo';
import { toast } from '../toast/ToastContext';
import BlunderDrillHeader, { type QuizDrillMode } from './BlunderDrillHeader';
import BlunderDrillFeedbackCard from './BlunderDrillFeedbackCard';

export interface BlunderDrillViewProps {
    initialConceptId?: string;
    initialMode?: QuizDrillMode;
    onClose?: () => void;
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
    const [speedSecondsLeft, setSpeedSecondsLeft] = useState<number | null>(null);
    const personalBlundersCount = useMemo(
        () => getAllBlunders().filter((b) => isPersonalMatchBlunder(b) && !b.isMastered).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stats],
    );

    useEffect(() => {
        if (drillMode !== 'speed_60s' || speedSecondsLeft === null) return;
        if (speedSecondsLeft <= 0) {
            toast.success(`Défi Éclair 60s terminé ! Vous avez gagné ${xp} Sceaux d'Or !`, '⚡ Temps écoulé !');
            setSpeedSecondsLeft(null);
            setDrillMode('adaptive');
            return;
        }
        const timer = setTimeout(() => {
            setSpeedSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);
        return () => clearTimeout(timer);
    }, [drillMode, speedSecondsLeft, xp]);

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
            failedOnCurrentQuizRef.current = false;
            liveDrillRef.current = { board: currentBlunder.board, usedDice: [false, false], playedMoves: [] };
        }
    }, [currentBlunder]);

    const applyValidationFeedback = useCallback(
        (result: DrillValidationResult) => {
            setValidationResult(result);
            if (!currentBlunder) return;

            if (result.isCorrect) {
                notificationSuccess();
                markBlunderAttempt(currentBlunder.id, true);
                const isFirstTry = !failedOnCurrentQuizRef.current;
                const prReward = isFirstTry ? rewardFirstTryQuizOnPublicPr() : null;
                const outcome = recordAdaptiveQuizOutcome(currentBlunder, true);
                setAdaptiveProfile(outcome.profile);
                setStats(getBlunderBankStats());
                setStreak((prev) => {
                    const next = prev + 1;
                    setXp((currXp) => currXp + 25 * Math.min(next, 4));
                    return next;
                });
                const prBonusLabel = prReward
                    ? prReward.crystallizationCapped
                        ? ` · Jauge Quizz ${MAX_QUIZ_CRYSTALLIZATION_STACK}/${MAX_QUIZ_CRYSTALLIZATION_STACK} (Jouez 1 partie pour cristalliser votre PR ${prReward.newPr.toFixed(2)} !)`
                        : ` · PR Public : ${prReward.newPr.toFixed(2)} (${prReward.deltaPr.toFixed(2)}) [${prReward.crystallizationUsed}/${MAX_QUIZ_CRYSTALLIZATION_STACK}]`
                    : '';
                if (prReward && prReward.unlockedEscrowElo > 0) {
                    toast.success(
                        `+${prReward.unlockedEscrowElo} pts Elo en séquestre débloqués grâce à 2 Quizz réussis au 1er essai${prBonusLabel} !`,
                        '🔓 Elo en Séquestre Débloqué !',
                    );
                } else if (outcome.leveledUp) {
                    toast.success(
                        `Niveau ${outcome.categoryState.level}/4 débloqué en ${outcome.categoryMeta.fullName}${prBonusLabel} !`,
                        '🚀 Montée de Palier !',
                    );
                } else {
                    toast.success(
                        `${outcome.categoryMeta.shortLabel} : Maîtrise ${outcome.categoryState.masteryScore}%${prBonusLabel}`,
                        isFirstTry
                            ? prReward && prReward.firstTryStreak >= 3
                                ? `🔥 Série x${prReward.firstTryStreak} au 1er Essai — PR Turbo !`
                                : '🎯 1er Essai — PR Amélioré !'
                            : '🎉 Bravo !',
                    );
                }
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
                toast.error(
                    `Faute (-${result.equityLoss.toFixed(3)} ΔEq) en ${outcome.categoryMeta.shortLabel}. Le Coach cible cette lacune !`,
                    '❌ Erreur analysée',
                );
            }
        },
        [currentBlunder],
    );

    const boardState: BoardState = useMemo(
        () => ({
            board: currentBoard,
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
        [currentBoard, currentBlunder],
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
        liveDrillRef.current = { board: currentBlunder.board, usedDice: [false, false], playedMoves: [] };
        impactLight();
    }, [currentBlunder]);

    const handlePlayMove = useCallback(
        (from: number, to: number, explicitDie?: 0 | 1) => {
            if (!currentBlunder || validationResult?.isCorrect) return;
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
                setValidationResult(null);
            }
        },
        [currentBlunder, validationResult, leftDieTargets, rightDieTargets, currentBoard, usedDice, boardState, selectedDie],
    );

    const handleValidateAttempt = useCallback(() => {
        if (!currentBlunder || validationResult?.isCorrect) return;
        const live = liveDrillRef.current;
        if (live.playedMoves.length === 0) return;
        const result = validateDrillMove(currentBlunder, live.playedMoves, live.board);
        applyValidationFeedback(result);
    }, [currentBlunder, validationResult, applyValidationFeedback]);

    const handleSelectQuizChoice = useCallback(
        (notation: string) => {
            if (!currentBlunder) return;
            impactLight();
            try {
                const moves = parseCoachNotationMoves(notation.replace(/\*/g, ''), currentBlunder.player);
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
                // ignore notation preview errors on cube actions
            }
            if (validationResult?.isCorrect) return;
            const result = validateDrillNotationChoice(currentBlunder, notation);
            applyValidationFeedback(result);
        },
        [currentBlunder, validationResult, applyValidationFeedback],
    );

    const handleCheckerClick = useCallback(
        (point: number) => {
            if (!currentBlunder || validationResult?.isCorrect) return;
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
        if (nextMode === 'personal_blunders') {
            setSpeedSecondsLeft(null);
            const pick = selectNextPersonalBlunderQuiz(all);
            setCurrentBlunder(pick.quiz);
            setReasonLabel(pick.reasonLabel);
        } else if (nextMode === 'speed_60s') {
            setSpeedSecondsLeft(60);
            const pick = selectNextAdaptiveQuiz(all);
            setCurrentBlunder(pick.quiz);
            setReasonLabel('⚡ Défi Éclair 60s — Enchaînez les lectures justes pour doubler vos Sceaux d’Or !');
        } else {
            setSpeedSecondsLeft(null);
            const pick = selectNextAdaptiveQuiz(all);
            setCurrentBlunder(pick.quiz);
            setReasonLabel(pick.reasonLabel);
        }
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
        toast.info('Votre profil adaptatif et vos 9 jauges de compétences ont été réinitialisés.');
    };

    const activeCategoryId = currentBlunder ? normalizeToQuizCategory(currentBlunder.conceptId) : undefined;
    const isTurnComplete =
        playedMoves.length > 0 &&
        ((usedDice[0] && usedDice[1]) || (leftDieTargets.size === 0 && rightDieTargets.size === 0));
    const stagedNotation = useMemo(() => {
        if (!currentBlunder || playedMoves.length === 0) return null;
        return formatCoachMoveSequence(playedMoves, currentBlunder.player, currentBlunder.board);
    }, [currentBlunder, playedMoves]);

    const coachHighlight = useMemo(() => {
        if (!validationResult || !currentBlunder) return null;
        const expandTokens = (notation: string) =>
            notation
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
        const optimalMoves = parseCoachNotationMoves(expandTokens(currentBlunder.optimalMove), currentBlunder.player);
        const wrongMoves = validationResult.isCorrect
            ? []
            : playedMoves.length > 0
                ? playedMoves
                : parseCoachNotationMoves(expandTokens(validationResult.playedNotation), currentBlunder.player);
        return {
            played: wrongMoves,
            optimal: optimalMoves,
        };
    }, [validationResult, currentBlunder, playedMoves]);

    return (
        <div className="relative flex h-dvh max-h-dvh w-full max-w-[1920px] mx-auto flex-col p-1 sm:p-1.5 [@media(max-height:540px)]:!p-0.5 text-[#fdf8eb] overflow-hidden">
            {/* Garde-fou Mobile Portrait : Quizz uniquement en mode Paysage sur portable */}
            <div className="hidden [@media(max-width:640px)_and_(orientation:portrait)]:flex fixed inset-0 z-50 flex-col items-center justify-center gap-4 bg-[#07090e]/98 p-6 text-center backdrop-blur-md">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/50 bg-[#1a120b] text-3xl shadow-xl">
                    📱↻
                </div>
                <h2 className="font-display text-lg font-black text-[#f7f3e8]">
                    Mode Paysage Requis pour les Quizz
                </h2>
                <p className="max-w-xs text-xs leading-relaxed text-[#e2d2b5]">
                    Tournez votre téléphone à l&apos;horizontale pour afficher le plateau de Backgammon en pleine hauteur à côté des 2 Quizz (<strong>🎯 Quizz PR</strong> &amp; <strong>🧠 Quizz ERH</strong>).
                </p>
                {onClose ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-[#f3c65f]/60 bg-[#1c130b] px-4 py-2 text-xs font-extrabold text-[#f3c65f]"
                    >
                        ← Retour au Salon
                    </button>
                ) : (
                    <Link
                        href="/"
                        className="rounded-xl border border-[#f3c65f]/60 bg-[#1c130b] px-4 py-2 text-xs font-extrabold text-[#f3c65f]"
                    >
                        ← Retour au Salon
                    </Link>
                )}
            </div>

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
                <div className="flex-1 min-h-0 h-full w-full grid grid-cols-12 gap-1.5 [@media(max-height:540px)]:!gap-1 overflow-hidden">
                    {/* COLONNE GAUCHE (8/12) : Plateau 100 % de la hauteur verticale de l'écran (Zéro barre au-dessus ni en-dessous) */}
                    <div className="col-span-8 h-full min-h-0 min-w-0 flex items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#080a0f] p-0.5 shadow-2xl">
                        <Board
                            state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets}
                            selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice}
                            onCheckerClick={handleCheckerClick}
                            onCheckerRightClick={(pt) => { impactLight(); setSelectedPoint(pt); setSelectedDie(1); }}
                            onDestinationClick={(dest) => { if (currentBlunder && selectedPoint !== null) handlePlayMove(selectedPoint, dest, selectedDie ?? undefined); }}
                            onPlayMove={handlePlayMove}
                            onSelectDie={(d) => setSelectedDie(d)}
                            onDiceClick={() => setSelectedDie((prev) => (prev === 1 ? 0 : 1))}
                            onDeselect={() => { setSelectedPoint(null); setSelectedDie(null); }}
                            onConfirm={handleValidateAttempt}
                            onUndo={handleResetCurrentAttempt}
                            canConfirm={isTurnComplete && !validationResult?.isCorrect}
                            canUndo={playedMoves.length > 0 && !validationResult?.isCorrect}
                            coachHighlight={coachHighlight}
                            theme={theme}
                        />
                    </div>

                    {/* COLONNE DROITE (4/12) : En-tête (Retour + 2 Quizz PR/ERH) + Dés, QCM Express, Valider & Explications */}
                    <div className="col-span-4 h-full min-h-0 min-w-0 overflow-hidden flex flex-col gap-1">
                        <BlunderDrillHeader
                            stats={stats}
                            adaptiveProfile={adaptiveProfile}
                            activeCategoryId={activeCategoryId}
                            adaptiveReasonLabel={reasonLabel}
                            drillMode={drillMode}
                            personalBlundersCount={personalBlundersCount}
                            speedSecondsLeft={speedSecondsLeft}
                            onSelectDrillMode={handleSelectDrillMode}
                            hearts={hearts}
                            streak={streak}
                            xp={xp}
                            onResetAllMastery={handleResetAllMastery}
                            onClose={onClose}
                        />
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
                                onValidateAttempt={handleValidateAttempt}
                                canValidateAttempt={isTurnComplete}
                                stagedNotation={stagedNotation}
                                drillMode={drillMode}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
