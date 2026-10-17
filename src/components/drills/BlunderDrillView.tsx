'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import {
    applyMove,
    computeLegalTargets,
    X_BAR,
    O_BAR,
} from '../../engine/backgammonEngine';
import BackgammonBoard from '../board/BackgammonBoard';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import {
    getAllBlunders,
    getBlundersToReview,
    getBlunderBankStats,
    resetAllBlunderMastery,
    clearBlunderBank,
} from '../../features/drills/blunderBank';
import {
    validateDrillMove,
    createDrillSession,
    advanceDrillSession,
} from '../../features/drills/blunderDrillEngine';
import type {
    PlayerBlunderRecord,
    DrillValidationResult,
    BlunderDrillSession,
    BlunderBankStats,
} from '../../features/drills/types';
import { STRATEGIC_CONCEPTS_CATALOG } from '../../lib/stats/statsAggregator';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';

export interface BlunderDrillViewProps {
    initialConceptId?: string;
    onClose?: () => void;
}

export default function BlunderDrillView({
    initialConceptId,
    onClose,
}: BlunderDrillViewProps) {
    const { theme } = useBoardTheme();

    const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>(
        initialConceptId || 'all',
    );

    // Initialisation de la session de drill
    const [session, setSession] = useState<BlunderDrillSession>(() =>
        createDrillSession({
            conceptId: initialConceptId && initialConceptId !== 'all' ? initialConceptId : undefined,
        }),
    );

    const [stats, setStats] = useState<BlunderBankStats>(() => getBlunderBankStats());

    // Blunder actuellement affiché
    const currentBlunder: PlayerBlunderRecord | null =
        session.blunders[session.currentIndex] ?? null;

    // État interactif du plateau pour l'erreur courante
    const [currentBoard, setCurrentBoard] = useState<number[]>(
        () => currentBlunder?.board ?? new Array(28).fill(0),
    );
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<DrillValidationResult | null>(null);
    const [attemptsOnCurrent, setAttemptsOnCurrent] = useState<number>(0);

    // Réinitialise le plateau dès que le blunder change
    useEffect(() => {
        if (currentBlunder) {
            setCurrentBoard(currentBlunder.board);
            setPlayedMoves([]);
            setUsedDice([false, false]);
            setSelectedPoint(null);
            setSelectedDie(null);
            setShowHint(false);
            setValidationResult(null);
            setAttemptsOnCurrent(0);
        }
    }, [currentBlunder]);

    // Changement de filtre de concept
    const handleFilterChange = (conceptId: string) => {
        setSelectedConceptFilter(conceptId);
        const newSession = createDrillSession({
            conceptId: conceptId !== 'all' ? conceptId : undefined,
        });
        setSession(newSession);
        setStats(getBlunderBankStats());
    };

    // État synthétique pour BackgammonBoard
    const boardState: BoardState = useMemo(() => {
        return {
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
        };
    }, [currentBoard, currentBlunder]);

    // Calcul des cibles légales
    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        if (!currentBlunder) {
            return { leftDieTargets: new Map(), rightDieTargets: new Map() };
        }
        try {
            return computeLegalTargets(boardState, currentBlunder.dice, usedDice);
        } catch {
            return { leftDieTargets: new Map(), rightDieTargets: new Map() };
        }
    }, [boardState, currentBlunder, usedDice]);

    // Réinitialiser la tentative sur l'erreur courante
    const handleResetCurrentAttempt = useCallback(() => {
        if (!currentBlunder) return;
        setCurrentBoard(currentBlunder.board);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setValidationResult(null);
        impactLight();
    }, [currentBlunder]);

    // Clic sur un pion
    const handleCheckerClick = useCallback(
        (point: number) => {
            if (!currentBlunder || validationResult?.isCorrect) return;

            const isPlayerX = currentBlunder.player === 'X';
            const hasChecker = isPlayerX
                ? point === X_BAR
                    ? currentBoard[X_BAR] > 0
                    : currentBoard[point] > 0
                : point === O_BAR
                ? currentBoard[O_BAR] < 0
                : currentBoard[point] < 0;

            if (!hasChecker) return;

            impactLight();

            if (selectedPoint === point) {
                setSelectedPoint(null);
                setSelectedDie(null);
                return;
            }

            // Détection du dé applicable
            const canLeft = leftDieTargets.has(point);
            const canRight = rightDieTargets.has(point);

            if (canLeft && (!canRight || !usedDice[0])) {
                setSelectedPoint(point);
                setSelectedDie(0);
            } else if (canRight) {
                setSelectedPoint(point);
                setSelectedDie(1);
            } else if (canLeft) {
                setSelectedPoint(point);
                setSelectedDie(0);
            }
        },
        [currentBlunder, validationResult, currentBoard, selectedPoint, leftDieTargets, rightDieTargets, usedDice],
    );

    // Déplacement vers destination
    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (!currentBlunder || selectedPoint === null || selectedDie === null) return;

            const targets = selectedDie === 0 ? leftDieTargets : rightDieTargets;
            const valid = targets.get(selectedPoint);

            if (!valid || !valid.includes(dest)) {
                return;
            }

            impactLight();

            const move: Move = { from: selectedPoint, to: dest };
            const newBoard = applyMove(currentBoard, move, currentBlunder.player);
            const newUsed: [boolean, boolean] = [usedDice[0], usedDice[1]];
            newUsed[selectedDie] = true;
            const newPlayedMoves = [...playedMoves, move];

            setCurrentBoard(newBoard);
            setUsedDice(newUsed);
            setPlayedMoves(newPlayedMoves);
            setSelectedPoint(null);
            setSelectedDie(null);

            // Vérifie si les deux dés sont joués ou si plus aucun coup n'est possible
            const tempState: BoardState = {
                ...boardState,
                board: newBoard,
            };
            const remaining = computeLegalTargets(tempState, currentBlunder.dice, newUsed);
            const turnFinished =
                (newUsed[0] && newUsed[1]) ||
                (remaining.leftDieTargets.size === 0 && remaining.rightDieTargets.size === 0);

            if (turnFinished) {
                // Validation immédiate
                const result = validateDrillMove(currentBlunder, newPlayedMoves, newBoard);
                setValidationResult(result);
                setAttemptsOnCurrent((prev) => prev + 1);

                if (result.isCorrect) {
                    notificationSuccess();
                    toast.success(
                        result.verdict === 'optimal'
                            ? 'Coup optimal trouvé ! Vous avez corrigé cette erreur avec brio.'
                            : 'Variante acceptable trouvée !',
                        '🎉 Bravo !',
                    );
                } else {
                    notificationError();
                    toast.error(
                        `Ce coup reste une faute (-${result.equityLoss.toFixed(3)} ΔEq). Rejouez jusqu’à trouver le bon coup !`,
                        '❌ Erreur',
                    );
                }
            }
        },
        [currentBlunder, selectedPoint, selectedDie, leftDieTargets, rightDieTargets, currentBoard, usedDice, playedMoves, boardState],
    );

    // Passage à l'erreur suivante après réussite
    const handleNextBlunder = () => {
        if (!validationResult?.isCorrect) return;
        const next = advanceDrillSession(session, true);
        setSession(next);
        setStats(getBlunderBankStats());
        impactLight();
    };

    // Redémarrer une session complète
    const handleRestartSession = () => {
        const next = createDrillSession({
            conceptId: selectedConceptFilter !== 'all' ? selectedConceptFilter : undefined,
        });
        setSession(next);
        setStats(getBlunderBankStats());
        impactLight();
    };

    // Réinitialiser la maîtrise globale
    const handleResetAllMastery = () => {
        resetAllBlunderMastery();
        handleRestartSession();
        toast.info('La maîtrise de toutes les erreurs a été réinitialisée pour un nouvel entraînement.');
    };

    return (
        <div className="flex w-full flex-col items-center gap-4 p-2 sm:p-4 text-slate-100 max-w-5xl mx-auto">
            {/* Header & Navigation */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🎯</span>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            Drills de Blunders
                        </h1>
                        <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                            Rejeu interactif
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        Rejouez automatiquement vos erreurs passées jusqu'à trouver le bon coup certifié par le moteur GNUBG.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {onClose ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                        >
                            ← Retour au plateau
                        </button>
                    ) : (
                        <a
                            href="/"
                            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                        >
                            ← Retour au plateau
                        </a>
                    )}
                </div>
            </div>

            {/* Barre de Stats & Filtre de Concept */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">Erreurs en banque</p>
                    <p className="font-mono text-lg font-bold text-white mt-0.5">{stats.totalBlunders}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                    <p className="text-[10px] text-emerald-400 font-semibold uppercase">Maîtrisées</p>
                    <p className="font-mono text-lg font-bold text-emerald-300 mt-0.5" data-testid="mastered-count">
                        {stats.masteredCount} / {stats.totalBlunders}
                    </p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
                    <p className="text-[10px] text-amber-400 font-semibold uppercase">À travailler</p>
                    <p className="font-mono text-lg font-bold text-amber-300 mt-0.5">{stats.remainingToReview}</p>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-2.5">
                    <p className="text-[10px] text-blue-400 font-semibold uppercase">Taux de maîtrise</p>
                    <p className="font-mono text-lg font-bold text-blue-300 mt-0.5">{stats.masteryRate}%</p>
                </div>
            </div>

            {/* Filtre par concept */}
            <div className="w-full flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">Concept :</span>
                    <select
                        value={selectedConceptFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        data-testid="concept-filter"
                    >
                        <option value="all">🎯 Tous les concepts ({stats.totalBlunders})</option>
                        {STRATEGIC_CONCEPTS_CATALOG.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleResetAllMastery}
                    className="text-slate-400 hover:text-slate-200 underline text-[11px] transition"
                    title="Réinitialise le statut de toutes les erreurs pour les retravailler"
                >
                    🔄 Réinitialiser la maîtrise
                </button>
            </div>

            {/* Session terminée ou Aucune erreur */}
            {session.isCompleted || !currentBlunder ? (
                <div className="w-full rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-slate-900 to-emerald-950/30 p-8 text-center shadow-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl">
                        🏆
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-white">
                        Session de Drill terminée !
                    </h2>
                    <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                        Félicitations ! Vous avez rejoué et trouvé les bons coups sur l'ensemble des erreurs de cette sélection.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={handleRestartSession}
                            className="rounded-xl border border-emerald-400 bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition"
                        >
                            🎯 Démarrer un nouveau drill
                        </button>
                        <a
                            href="/progression"
                            className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                        >
                            📊 Voir ma progression
                        </a>
                    </div>
                </div>
            ) : (
                <>
                    {/* Stepper de Progression du Drill */}
                    <div className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-md">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-amber-400">
                                Erreur {session.currentIndex + 1} sur {session.blunders.length}
                            </span>
                            <span className="font-mono text-slate-400">
                                {Math.round(((session.currentIndex) / session.blunders.length) * 100)}% complété
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                                style={{
                                    width: `${((session.currentIndex) / session.blunders.length) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Carte d'information de l'erreur */}
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3">
                            <div>
                                <span className="rounded bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                                    {currentBlunder.conceptName}
                                </span>
                                <p className="text-xs text-slate-300 mt-1">
                                    <span className="text-slate-400">Votre coup passé : </span>
                                    <span className="font-mono font-bold text-rose-400 underline decoration-rose-500/50">
                                        {currentBlunder.playedMove}
                                    </span>
                                    <span className="ml-2 font-mono text-[11px] text-rose-300">
                                        (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowHint((prev) => !prev)}
                                    className="rounded-lg border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition"
                                    data-testid="drill-hint-toggle"
                                >
                                    💡 {showHint ? 'Masquer indice' : 'Indice'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetCurrentAttempt}
                                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                                    data-testid="drill-reset-btn"
                                >
                                    ↺ Réinitialiser
                                </button>
                            </div>
                        </div>

                        {/* Indice déroulant */}
                        {showHint && currentBlunder.hint && (
                            <div
                                className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-xs text-amber-200 leading-relaxed animate-in fade-in duration-200"
                                data-testid="drill-hint-box"
                            >
                                <span className="font-bold text-amber-100">💡 Conseil pédagogique : </span>
                                {currentBlunder.hint}
                            </div>
                        )}
                    </div>

                    {/* Plateau de Backgammon interactif */}
                    <div className="w-full flex justify-center overflow-x-auto">
                        <BackgammonBoard
                            state={boardState}
                            leftDieTargets={leftDieTargets}
                            rightDieTargets={rightDieTargets}
                            selectedPoint={selectedPoint}
                            selectedDie={selectedDie}
                            usedDice={usedDice}
                            onCheckerClick={handleCheckerClick}
                            onCheckerRightClick={(pt) => {
                                impactLight();
                                setSelectedPoint(pt);
                                setSelectedDie(1);
                            }}
                            onDestinationClick={handleDestinationClick}
                            onSelectDie={(d) => setSelectedDie(d)}
                            onDeselect={() => {
                                setSelectedPoint(null);
                                setSelectedDie(null);
                            }}
                            theme={theme}
                        />
                    </div>

                    {/* Bandeau de Validation / Rétroaction */}
                    {validationResult && (
                        <div
                            className={`w-full rounded-2xl border p-4 shadow-xl transition-all duration-300 animate-in fade-in ${
                                validationResult.isCorrect
                                    ? 'border-emerald-500/60 bg-gradient-to-r from-emerald-950/90 to-slate-900 text-emerald-100'
                                    : 'border-rose-500/60 bg-gradient-to-r from-rose-950/90 to-slate-900 text-rose-100'
                            }`}
                            data-testid="drill-feedback-banner"
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">
                                            {validationResult.isCorrect ? '👑' : '❌'}
                                        </span>
                                        <h3 className="text-sm font-bold">
                                            {validationResult.feedbackMessage}
                                        </h3>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-300">
                                        <span className="text-slate-400">Coup joué : </span>
                                        <span className="font-mono font-bold text-white">
                                            {validationResult.playedNotation}
                                        </span>
                                        <span className="mx-2 text-slate-500">|</span>
                                        <span className="text-slate-400">Coup optimal certifié : </span>
                                        <span className="font-mono font-bold text-emerald-400">
                                            {validationResult.optimalNotation}
                                        </span>
                                    </p>
                                    {validationResult.isCorrect && currentBlunder.explanation && (
                                        <p className="mt-2 text-xs text-slate-200 leading-relaxed border-t border-emerald-500/20 pt-2">
                                            <span className="font-bold text-emerald-300">Pourquoi c'est optimal : </span>
                                            {currentBlunder.explanation}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {validationResult.isCorrect ? (
                                        <button
                                            type="button"
                                            onClick={handleNextBlunder}
                                            className="rounded-xl border border-emerald-400 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition flex items-center gap-1.5"
                                            data-testid="drill-next-btn"
                                        >
                                            <span>Erreur suivante</span>
                                            <span>→</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResetCurrentAttempt}
                                            className="rounded-xl border border-rose-400 bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-rose-500 transition flex items-center gap-1.5"
                                            data-testid="drill-retry-btn"
                                        >
                                            <span>↺ Réessayer ce coup</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
