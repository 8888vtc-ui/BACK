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
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';
import BlunderDrillHeader from './BlunderDrillHeader';
import BlunderDrillFeedbackCard from './BlunderDrillFeedbackCard';

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
        },
        [currentBlunder, validationResult, currentBoard, selectedDie, leftDieTargets, rightDieTargets, usedDice, handlePlayMove],
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
            <BlunderDrillHeader
                stats={stats}
                selectedConceptFilter={selectedConceptFilter}
                onFilterChange={handleFilterChange}
                onResetAllMastery={handleResetAllMastery}
                onClose={onClose}
            />

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
                    <BlunderDrillFeedbackCard
                        currentBlunder={currentBlunder}
                        currentIndex={session.currentIndex}
                        totalBlunders={session.blunders.length}
                        showHint={showHint}
                        onToggleHint={() => setShowHint((prev) => !prev)}
                        onResetAttempt={handleResetCurrentAttempt}
                        validationResult={validationResult}
                        onNextBlunder={handleNextBlunder}
                    />

                    <div className="w-full flex justify-center overflow-x-auto rounded-2xl border border-white/10 bg-[#080a0f] p-0 sm:p-3 max-sm:rounded-none max-sm:border-x-0 shadow-2xl">
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
