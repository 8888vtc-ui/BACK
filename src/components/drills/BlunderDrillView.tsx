'use client';

/**
 * Vue interactive des Drills de Blunders (`BlunderDrillView.tsx`).
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), bordures épurées border-white/10,
 * objectif, dés à rejouer, contrôles et feedback de validation visibles au premier coup d'œil sans scroller.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import { applyMove, computeLegalTargets, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { getBlunderBankStats, resetAllBlunderMastery } from '../../features/drills/blunderBank';
import { validateDrillMove, createDrillSession, advanceDrillSession } from '../../features/drills/blunderDrillEngine';
import type { PlayerBlunderRecord, DrillValidationResult, BlunderDrillSession, BlunderBankStats } from '../../features/drills/types';
import { STRATEGIC_CONCEPTS_CATALOG } from '../../lib/stats/statsAggregator';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';

export interface BlunderDrillViewProps {
    initialConceptId?: string;
    onClose?: () => void;
}

export default function BlunderDrillView({ initialConceptId, onClose }: BlunderDrillViewProps) {
    const { theme } = useBoardTheme();
    const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>(initialConceptId || 'all');
    const [session, setSession] = useState<BlunderDrillSession>(() =>
        createDrillSession({ conceptId: initialConceptId && initialConceptId !== 'all' ? initialConceptId : undefined }),
    );
    const [stats, setStats] = useState<BlunderBankStats>(() => getBlunderBankStats());

    const currentBlunder: PlayerBlunderRecord | null = session.blunders[session.currentIndex] ?? null;
    const [currentBoard, setCurrentBoard] = useState<number[]>(() => currentBlunder?.board ?? new Array(28).fill(0));
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<DrillValidationResult | null>(null);
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
            liveDrillRef.current = { board: currentBlunder.board, usedDice: [false, false], playedMoves: [] };
        }
    }, [currentBlunder]);

    const handleFilterChange = (conceptId: string) => {
        setSelectedConceptFilter(conceptId);
        setSession(createDrillSession({ conceptId: conceptId !== 'all' ? conceptId : undefined }));
        setStats(getBlunderBankStats());
    };

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
                const result = validateDrillMove(currentBlunder, newPlayedMoves, newBoard);
                setValidationResult(result);
                if (result.isCorrect) {
                    notificationSuccess();
                    toast.success(result.verdict === 'optimal' ? 'Coup optimal trouvé ! Vous avez corrigé cette erreur avec brio.' : 'Variante acceptable trouvée !', '🎉 Bravo !');
                } else {
                    notificationError();
                    toast.error(`Ce coup reste une faute (-${result.equityLoss.toFixed(3)} ΔEq). Rejouez jusqu’à trouver le bon coup !`, '❌ Erreur');
                }
            }
        },
        [currentBlunder, validationResult, leftDieTargets, rightDieTargets, currentBoard, usedDice, boardState, selectedDie],
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
            if (selectedPoint === point) {
                if (selectedDie === 1 && !usedDice[1] && rightDests.length > 0) {
                    handlePlayMove(point, rightDests[0], 1);
                    return;
                }
                if (!usedDice[0] && leftDests.length > 0) {
                    handlePlayMove(point, leftDests[0], 0);
                    return;
                }
                if (!usedDice[1] && rightDests.length > 0) {
                    handlePlayMove(point, rightDests[0], 1);
                    return;
                }
                setSelectedPoint(null);
                setSelectedDie(null);
                return;
            }
            impactLight();
            if (leftDests.length > 0 && (rightDests.length === 0 || !usedDice[0])) {
                setSelectedPoint(point);
                setSelectedDie(0);
            } else if (rightDests.length > 0) {
                setSelectedPoint(point);
                setSelectedDie(1);
            }
        },
        [currentBlunder, validationResult, currentBoard, selectedPoint, selectedDie, leftDieTargets, rightDieTargets, usedDice, handlePlayMove],
    );

    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (!currentBlunder || selectedPoint === null) return;
            handlePlayMove(selectedPoint, dest, selectedDie ?? undefined);
        },
        [currentBlunder, selectedPoint, selectedDie, handlePlayMove],
    );

    const handleNextBlunder = () => {
        if (!validationResult?.isCorrect) return;
        setSession(advanceDrillSession(session, true));
        setStats(getBlunderBankStats());
        impactLight();
    };

    const handleRestartSession = () => {
        setSession(createDrillSession({ conceptId: selectedConceptFilter !== 'all' ? selectedConceptFilter : undefined }));
        setStats(getBlunderBankStats());
        impactLight();
    };

    const handleResetAllMastery = () => {
        resetAllBlunderMastery();
        handleRestartSession();
        toast.info('La maîtrise de toutes les erreurs a été réinitialisée pour un nouvel entraînement.');
    };

    return (
        <div className="flex w-full flex-col items-center gap-3 p-2 sm:p-4 text-[#fdf8eb] max-w-5xl mx-auto">
            {/* 1. En-tête compact & Compteurs de Maîtrise */}
            <header className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121b]/95 px-4 py-3 shadow-lg">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1a1109] text-base">🎯</span>
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-[#fdf8eb]">Drills de Blunders</h1>
                    <span className="rounded-full border border-white/10 bg-[#1a1109] px-2.5 py-0.5 text-xs font-bold text-[#f3c65f]">Rejeu interactif</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"><span className="text-[#a5b0c4] font-bold uppercase mr-1.5">Banque</span><span className="font-mono font-extrabold text-[#fdf8eb]">{stats.totalBlunders}</span></div>
                    <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/25 px-3 py-1.5"><span className="text-emerald-400 font-bold uppercase mr-1.5">Maîtrisées</span><span className="font-mono font-extrabold text-emerald-300" data-testid="mastered-count">{stats.masteredCount} / {stats.totalBlunders}</span></div>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"><span className="text-[#f3c65f] font-bold uppercase mr-1.5">Maîtrise</span><span className="font-mono font-extrabold text-[#f3c65f]">{stats.masteryRate}%</span></div>
                    {onClose ? (
                        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</button>
                    ) : (
                        <Link href="/" className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">← Retour au plateau</Link>
                    )}
                </div>
            </header>

            {/* 2. Filtre par concept */}
            <div className="w-full flex items-center justify-between flex-wrap gap-2 text-xs rounded-2xl border border-white/10 bg-[#0e121b]/90 px-4 py-2">
                <div className="flex items-center gap-2">
                    <label htmlFor="drill-concept-filter" className="font-bold text-[#e2d2b5]">Concept :</label>
                    <select id="drill-concept-filter" name="conceptFilter" value={selectedConceptFilter} onChange={(e) => handleFilterChange(e.target.value)} className="rounded-xl border border-white/10 bg-black/50 px-3 py-1 text-xs text-[#fdf8eb] focus:outline-none focus:ring-1 focus:ring-[#f3c65f]" data-testid="concept-filter">
                        <option value="all">🎯 Tous les concepts ({stats.totalBlunders})</option>
                        {STRATEGIC_CONCEPTS_CATALOG.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                </div>
                <button type="button" onClick={handleResetAllMastery} className="text-[#e2d2b5] hover:text-[#f3c65f] underline text-xs font-semibold transition">🔄 Réinitialiser la maîtrise</button>
            </div>

            {session.isCompleted || !currentBlunder ? (
                <div className="w-full rounded-2xl border border-white/10 bg-[#0e121b] p-6 text-center shadow-2xl space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#2a170c] text-2xl">🏆</div>
                    <h2 className="text-lg font-black text-[#fdf8eb]">Session de Drill terminée !</h2>
                    <p className="text-xs sm:text-sm text-[#e2d2b5] max-w-md mx-auto">Félicitations ! Vous avez rejoué et trouvé les bons coups sur l&apos;ensemble des erreurs de cette sélection.</p>
                    <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                        <button type="button" onClick={handleRestartSession} className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] shadow-md transition hover:brightness-105">🎯 Démarrer un nouveau drill</button>
                        <Link href="/progression" className="rounded-xl border border-white/10 bg-[#150c07] px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition">📊 Voir ma progression</Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* 3. Carte Position, Objectif, Dés à rejouer & Contrôles visibles sans scroller */}
                    <section data-testid="drill-position-card" className="w-full rounded-2xl border border-white/10 bg-[#0e121b]/95 p-3.5 sm:p-4 shadow-xl space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-bold text-[#f3c65f]">Erreur {session.currentIndex + 1} sur {session.blunders.length}</span>
                                <span className="rounded border border-rose-500/40 bg-rose-950/80 px-2 py-0.5 text-xs font-bold text-rose-200">{currentBlunder.conceptName}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs">
                                <span className="text-[#a5b0c4] font-semibold">Jet à rejouer :</span>
                                <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[0]}</span>
                                <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[1]}</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <p className="text-[#e2d2b5]">
                                <span className="text-[#a5b0c4]">Votre coup passé : </span>
                                <span className="font-mono font-bold text-rose-400 underline decoration-rose-500/50">{currentBlunder.playedMove}</span>
                                <span className="ml-2 font-mono text-xs text-rose-300">(-{currentBlunder.equityLoss.toFixed(3)} ΔEq)</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setShowHint((prev) => !prev)} className="rounded-xl border border-white/10 bg-[#1a1109] px-3 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="drill-hint-toggle">💡 {showHint ? 'Masquer indice' : 'Indice'}</button>
                                <button type="button" onClick={handleResetCurrentAttempt} className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-[#e2d2b5] hover:border-white/25 transition" data-testid="drill-reset-btn">↺ Réinitialiser</button>
                            </div>
                        </div>
                        {showHint && currentBlunder.hint && (
                            <div className="rounded-xl border border-white/10 bg-[#180c06]/90 p-3 text-xs text-[#fdf8eb] leading-relaxed" data-testid="drill-hint-box">
                                <span className="font-bold text-[#f3c65f]">💡 Conseil pédagogique : </span>{currentBlunder.hint}
                            </div>
                        )}
                        {validationResult && (
                            <div className={`w-full rounded-xl border p-3.5 text-xs ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100' : 'border-rose-500/50 bg-rose-950/60 text-rose-100'}`} data-testid="drill-feedback-banner">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                            <h3 className="text-sm font-bold">{validationResult.feedbackMessage}</h3>
                                        </div>
                                        <p className="text-xs text-slate-200">
                                            <span>Coup joué : <strong className="font-mono text-white">{validationResult.playedNotation}</strong></span>
                                            <span className="mx-2 text-slate-500">|</span>
                                            <span>Coup optimal certifié : <strong className="font-mono text-emerald-300">{validationResult.optimalNotation}</strong></span>
                                        </p>
                                        {validationResult.isCorrect && currentBlunder.explanation && (
                                            <p className="text-xs text-slate-200 pt-1"><strong className="text-emerald-300">Pourquoi c&apos;est optimal : </strong>{currentBlunder.explanation}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0">
                                        {validationResult.isCorrect ? (
                                            <button type="button" onClick={handleNextBlunder} className="rounded-xl border border-emerald-400 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition" data-testid="drill-next-btn">Erreur suivante →</button>
                                        ) : (
                                            <button type="button" onClick={handleResetCurrentAttempt} className="rounded-xl border border-rose-400 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition" data-testid="drill-retry-btn">↺ Réessayer ce coup</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 4. Plateau de Backgammon interactif */}
                    <div className="w-full flex justify-center overflow-x-auto rounded-2xl border border-white/10 bg-[#080a0f] p-2 sm:p-3 shadow-2xl">
                        <Board
                            state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets}
                            selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice}
                            onCheckerClick={handleCheckerClick}
                            onCheckerRightClick={(pt) => { impactLight(); setSelectedPoint(pt); setSelectedDie(1); }}
                            onDestinationClick={handleDestinationClick}
                            onPlayMove={handlePlayMove}
                            onSelectDie={(d) => setSelectedDie(d)}
                            onDiceClick={() => setSelectedDie((prev) => (prev === 1 ? 0 : 1))}
                            onDeselect={() => { setSelectedPoint(null); setSelectedDie(null); }}
                            theme={theme}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
