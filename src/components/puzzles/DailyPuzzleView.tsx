'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Move, BoardState, Player } from '../../engine/backgammonEngine';
import {
    applyMove,
    computeLegalTargets,
    X_BAR,
    O_BAR,
} from '../../engine/backgammonEngine';
import Board from '../board/Board';
import type { CoachHighlight } from '../board/BackgammonBoard';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import {
    getDailyPuzzle,
    getAllPuzzles,
    getPuzzleById,
} from '../../features/puzzles/puzzleDatabase';
import { validatePuzzleMove } from '../../features/puzzles/puzzleEngine';
import {
    getPuzzleStats,
    recordPuzzleAttempt,
    isPuzzleSolved,
    getTodayDateString,
} from '../../features/puzzles/puzzleStorage';
import type { BackgammonPuzzle, PuzzleValidationResult, DailyPuzzleStats } from '../../features/puzzles/types';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';

export interface DailyPuzzleViewProps {
    initialPuzzleId?: string;
    onClose?: () => void;
}

export default function DailyPuzzleView({ initialPuzzleId, onClose }: DailyPuzzleViewProps) {
    const { theme } = useBoardTheme();
    const allPuzzles = useMemo(() => getAllPuzzles(), []);

    // Puzzle sélectionné (par défaut le puzzle du jour)
    const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(
        initialPuzzleId || getDailyPuzzle().id,
    );

    const puzzle = useMemo<BackgammonPuzzle>(() => {
        return getPuzzleById(selectedPuzzleId) || getDailyPuzzle();
    }, [selectedPuzzleId]);

    // État du plateau pour le puzzle actif
    const [currentBoard, setCurrentBoard] = useState<number[]>(puzzle.initialBoard);
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [showSolution, setShowSolution] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<PuzzleValidationResult | null>(null);
    const [stats, setStats] = useState<DailyPuzzleStats>(() => getPuzzleStats());

    // Réinitialise le puzzle quand on change de puzzle
    useEffect(() => {
        setCurrentBoard(puzzle.initialBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setShowHint(false);
        setShowSolution(false);
        setValidationResult(null);
    }, [puzzle]);

    // État BoardState synthétique pour BackgammonBoard
    const boardState: BoardState = useMemo(() => {
        return {
            board: currentBoard,
            turn: puzzle.turn,
            cubeValue: puzzle.cubeValue ?? 1,
            cubeOwner: puzzle.cubeOwner ?? null,
            dice: puzzle.dice,
            matchLength: puzzle.matchLength ?? 7,
            scoreX: puzzle.scoreX ?? 0,
            scoreO: puzzle.scoreO ?? 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };
    }, [currentBoard, puzzle]);

    // Cibles légales basées sur le dé et les dés consommés
    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        try {
            return computeLegalTargets(boardState, puzzle.dice, usedDice);
        } catch {
            return { leftDieTargets: new Map(), rightDieTargets: new Map() };
        }
    }, [boardState, puzzle.dice, usedDice]);

    // Réinitialiser la tentative en cours
    const handleReset = useCallback(() => {
        setCurrentBoard(puzzle.initialBoard);
        setPlayedMoves([]);
        setUsedDice([false, false]);
        setSelectedPoint(null);
        setSelectedDie(null);
        setValidationResult(null);
        impactLight();
    }, [puzzle.initialBoard]);

    // Sélection d'un pion
    const handleCheckerClick = useCallback(
        (point: number) => {
            if (validationResult?.isCorrect) return; // Déjà résolu

            const hasChecker =
                puzzle.turn === 'X'
                    ? point === X_BAR
                        ? currentBoard[X_BAR] > 0
                        : currentBoard[point] > 0
                    : point === O_BAR
                        ? currentBoard[O_BAR] < 0
                        : currentBoard[point] < 0;

            if (!hasChecker) return;

            // Déterminer les destinations possibles pour ce point
            const leftTargets = leftDieTargets.get(point) || [];
            const rightTargets = rightDieTargets.get(point) || [];

            if (leftTargets.length === 0 && rightTargets.length === 0) return;

            setSelectedPoint(point);
            if (!usedDice[0] && leftTargets.length > 0) {
                setSelectedDie(0);
            } else if (!usedDice[1] && rightTargets.length > 0) {
                setSelectedDie(1);
            }
            impactLight();
        },
        [currentBoard, puzzle.turn, leftDieTargets, rightDieTargets, usedDice, validationResult],
    );

    // Déplacement vers une destination légale
    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (selectedPoint === null) return;

            const leftTargets = leftDieTargets.get(selectedPoint) || [];
            const rightTargets = rightDieTargets.get(selectedPoint) || [];

            let dieUsed: 0 | 1 | null = null;
            if (selectedDie === 0 && leftTargets.includes(dest)) {
                dieUsed = 0;
            } else if (selectedDie === 1 && rightTargets.includes(dest)) {
                dieUsed = 1;
            } else if (!usedDice[0] && leftTargets.includes(dest)) {
                dieUsed = 0;
            } else if (!usedDice[1] && rightTargets.includes(dest)) {
                dieUsed = 1;
            }

            if (dieUsed === null) return;

            const move: Move = { from: selectedPoint, to: dest };
            const nextBoard = applyMove(currentBoard, move, puzzle.turn);

            setCurrentBoard(nextBoard);
            setPlayedMoves((prev) => [...prev, move]);
            setUsedDice((prev) => {
                const next: [boolean, boolean] = [...prev];
                next[dieUsed!] = true;
                return next;
            });

            setSelectedPoint(null);
            setSelectedDie(null);
            impactLight();
        },
        [selectedPoint, selectedDie, leftDieTargets, rightDieTargets, usedDice, currentBoard, puzzle.turn],
    );

    // Validation de la réponse par le moteur
    const handleVerify = useCallback(() => {
        if (playedMoves.length === 0) {
            toast.warning('Déplacez vos pions sur le plateau avant de valider.');
            return;
        }

        const result = validatePuzzleMove(puzzle, playedMoves, currentBoard);
        setValidationResult(result);

        const updatedStats = recordPuzzleAttempt(puzzle.id, result.isCorrect, getTodayDateString());
        setStats(updatedStats);

        if (result.isCorrect) {
            notificationSuccess();
            toast.success('Félicitations ! Coup optimal validé par le moteur.', '🎉 Puzzle Résolu !');
        } else {
            notificationError();
            toast.error(`Perte d'équité : -${result.equityLoss.toFixed(3)}`, 'Inexactitude');
        }
    }, [puzzle, playedMoves, currentBoard]);

    // Révéler la solution optimale
    const handleRevealSolution = useCallback(() => {
        setShowSolution(true);
        impactLight();
    }, []);

    const isCompleted = isPuzzleSolved(puzzle.id);
    const difficultyColors = {
        beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        expert: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    };

    const categoryLabels: Record<string, string> = {
        opening: 'Ouverture',
        blitz: 'Attaque & Blitz',
        prime: 'Construction de Prime',
        escape: 'Évasion des Pions',
        bear_off: 'Sortie Sécurisée',
        contact: 'Jeu de Contact',
        cube: 'Décision de Videau',
    };

    return (
        <div className="w-full max-w-6xl space-y-5 animate-fade-in" data-testid="daily-puzzle-view">
            {/* 1. En-tête : Badge Quotidien, Séries (Streaks) & Stats */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-3xl border border-slate-700/80 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
                            🧩
                        </span>
                        <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                            Défi Backgammon Quotidien
                        </h1>
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300 font-mono">
                            {getTodayDateString()}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Chaque jour, une situation tactique ou stratégique à résoudre certifiée par GNUBG.
                    </p>
                </div>

                {/* Badges de série et progression */}
                <div className="flex items-center gap-3">
                    <div
                        className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 shadow-inner"
                        title="Série de victoires quotidiennes consécutives"
                        data-testid="puzzle-streak-badge"
                    >
                        <span className="text-xl animate-bounce">🔥</span>
                        <div>
                            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                Série en cours
                            </div>
                            <div className="text-sm font-extrabold text-white font-mono">
                                {stats.currentStreak} {stats.currentStreak > 1 ? 'jours' : 'jour'}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-800/60 px-3.5 py-2 text-right">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Résolus
                        </div>
                        <div className="text-sm font-extrabold text-emerald-400 font-mono">
                            {stats.totalSolved} / {allPuzzles.length}
                        </div>
                    </div>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                            aria-label="Fermer le mode puzzle"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* 2. Carte Descriptive du Puzzle & Objectif */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base sm:text-lg font-bold text-white">{puzzle.title}</h2>
                        <span
                            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${difficultyColors[puzzle.difficulty]
                                }`}
                        >
                            {puzzle.difficulty === 'beginner'
                                ? 'Débutant'
                                : puzzle.difficulty === 'intermediate'
                                    ? 'Intermédiaire'
                                    : 'Expert'}
                        </span>
                        <span className="rounded-full bg-slate-800 border border-slate-700/80 px-2.5 py-0.5 text-[10px] text-slate-300">
                            {categoryLabels[puzzle.category] || puzzle.category}
                        </span>
                    </div>

                    {/* Dés obtenus pour ce puzzle */}
                    <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-slate-700 px-3 py-1">
                        <span className="text-xs text-slate-400 font-medium">Jet à jouer :</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
                            <span className="rounded-md bg-slate-900 px-2 py-0.5 border border-slate-700">
                                {puzzle.dice[0]}
                            </span>
                            <span className="rounded-md bg-slate-900 px-2 py-0.5 border border-slate-700">
                                {puzzle.dice[1]}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-200">{puzzle.description}</div>

                {/* Historique des coups joués en direct */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">Votre coup :</span>
                    {playedMoves.length === 0 ? (
                        <span className="italic text-slate-500">
                            Sélectionnez un pion puis sa flèche de destination
                        </span>
                    ) : (
                        playedMoves.map((m, idx) => (
                            <span
                                key={idx}
                                className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-2 py-1 font-mono font-bold text-amber-300"
                            >
                                {m.from === X_BAR ? 'bar' : m.from}/{m.to === 0 ? 'off' : m.to}
                            </span>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Plateau Interactif de Backgammon */}
            <div className="relative rounded-3xl border border-slate-800 bg-slate-950 p-2 sm:p-4 shadow-2xl">
                <Board
                    state={boardState}
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={selectedPoint}
                    selectedDie={selectedDie}
                    usedDice={usedDice}
                    onCheckerClick={handleCheckerClick}
                    onCheckerRightClick={() => { }}
                    onDestinationClick={handleDestinationClick}
                    theme={theme}
                />
            </div>

            {/* 4. Barre d'Actions & Boutons */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={playedMoves.length === 0}
                        className={`rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-semibold transition ${playedMoves.length > 0
                            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white'
                            : 'bg-slate-800/40 text-slate-500 opacity-50 cursor-not-allowed'
                            }`}
                        data-testid="puzzle-reset-button"
                    >
                        🔄 Réinitialiser
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowHint(!showHint)}
                        className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition"
                        data-testid="puzzle-hint-button"
                    >
                        💡 {showHint ? 'Masquer l’indice' : 'Indice'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRevealSolution}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        data-testid="puzzle-solution-button"
                    >
                        👁️ Voir la solution
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleVerify}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    data-testid="puzzle-verify-button"
                >
                    ⚡ Valider ma réponse
                </button>
            </div>

            {/* Boîte d'Indice dépliable */}
            {showHint && (
                <div
                    className="rounded-2xl border border-indigo-500/40 bg-indigo-950/30 p-4 text-xs text-indigo-200 shadow-lg animate-fade-in"
                    data-testid="puzzle-hint-box"
                >
                    <span className="font-bold text-indigo-300">💡 Indice tactique :</span> {puzzle.hint}
                </div>
            )}

            {/* Boîte de Solution Dévoilée */}
            {showSolution && (
                <div
                    className="rounded-2xl border border-amber-500/50 bg-amber-950/25 p-4 text-xs text-amber-200 shadow-xl animate-fade-in space-y-2"
                    data-testid="puzzle-solution-box"
                >
                    <div className="flex items-center gap-2 text-sm font-extrabold text-amber-300">
                        <span>🎯 Solution certifiée GNUBG :</span>
                        <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-mono">
                            {puzzle.optimalNotation}
                        </span>
                    </div>
                    <p className="text-slate-300">{puzzle.explanation}</p>
                </div>
            )}

            {/* 5. Panneau de Verdict Moteur (Feedback Immédiat) */}
            {validationResult && (
                <div
                    className={`rounded-3xl border p-5 shadow-2xl animate-fade-in space-y-3 ${validationResult.isCorrect
                        ? 'border-emerald-500/60 bg-emerald-950/30 text-emerald-100'
                        : 'border-rose-500/60 bg-rose-950/30 text-rose-100'
                        }`}
                    data-testid="puzzle-verdict-card"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">
                                {validationResult.isCorrect ? '🎉' : '⚠️'}
                            </span>
                            <span className="text-base font-extrabold">
                                {validationResult.verdict === 'optimal'
                                    ? 'Coup Parfait & Optimal !'
                                    : validationResult.verdict === 'acceptable'
                                        ? 'Bonne Alternative (Acceptable)'
                                        : 'Inexactitude ou Blunder'}
                            </span>
                        </div>
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
                            ΔEq : -{validationResult.equityLoss.toFixed(3)}
                        </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200">
                        {validationResult.explanation}
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                        <div className="text-xs">
                            <span className="text-slate-400 font-semibold">Coup joué : </span>
                            <span className="font-mono font-bold text-white">
                                {validationResult.playedNotation}
                            </span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="text-xs">
                            <span className="text-slate-400 font-semibold">Optimal : </span>
                            <span className="font-mono font-bold text-amber-400">
                                {validationResult.optimalNotation}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Catalogue & Archives des Puzzles */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-extrabold text-white">
                    📚 Catalogue des Puzzles & Archives
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {allPuzzles.map((p) => {
                        const solved = isPuzzleSolved(p.id);
                        const isCurrent = p.id === puzzle.id;

                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedPuzzleId(p.id)}
                                className={`flex flex-col text-left rounded-2xl border p-3.5 transition-all ${isCurrent
                                    ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/60 shadow-lg'
                                    : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800'
                                    }`}
                                data-testid={`puzzle-card-${p.id}`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="text-xs font-bold text-white truncate">
                                        {p.title}
                                    </span>
                                    {solved && (
                                        <span className="text-xs" title="Puzzle résolu">
                                            ✅
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px]">
                                    <span
                                        className={`rounded px-1.5 py-0.5 font-semibold ${difficultyColors[p.difficulty]
                                            }`}
                                    >
                                        {p.difficulty}
                                    </span>
                                    <span className="text-slate-400">
                                        {categoryLabels[p.category] || p.category}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
