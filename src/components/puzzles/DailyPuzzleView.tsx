'use client';

/**
 * Vue autonome des Puzzles Quotidiens (`DailyPuzzleView.tsx`).
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), objectif et bouton de validation visibles sans scroller.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Move, BoardState } from '../../engine/backgammonEngine';
import { applyMove, computeLegalTargets, X_BAR, O_BAR } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import { getDailyPuzzle, getAllPuzzles, getPuzzleById } from '../../features/puzzles/puzzleDatabase';
import { validatePuzzleMove } from '../../features/puzzles/puzzleEngine';
import { getPuzzleStats, recordPuzzleAttempt, isPuzzleSolved, getTodayDateString } from '../../features/puzzles/puzzleStorage';
import type { BackgammonPuzzle, PuzzleValidationResult, DailyPuzzleStats } from '../../features/puzzles/types';
import { impactLight, notificationSuccess, notificationError } from '../../lib/capacitor/haptics';
import { toast } from '../toast/ToastContext';

export interface DailyPuzzleViewProps {
    initialPuzzleId?: string;
    onClose?: () => void;
}

const DIFFICULTY_COLORS: Readonly<Record<BackgammonPuzzle['difficulty'], string>> = {
    beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    expert: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
};

const DIFFICULTY_LABELS: Readonly<Record<BackgammonPuzzle['difficulty'], string>> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    expert: 'Expert',
};

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
    opening: 'Ouverture',
    blitz: 'Attaque & Blitz',
    prime: 'Construction de Prime',
    escape: 'Évasion des Pions',
    bear_off: 'Sortie Sécurisée',
    contact: 'Jeu de Contact',
    cube: 'Décision de Videau',
};

export default function DailyPuzzleView({ initialPuzzleId, onClose }: DailyPuzzleViewProps) {
    const { theme } = useBoardTheme();
    const allPuzzles = useMemo(() => getAllPuzzles(), []);
    const [selectedPuzzleId, setSelectedPuzzleId] = useState<string>(initialPuzzleId || getDailyPuzzle().id);
    const puzzle = useMemo<BackgammonPuzzle>(() => getPuzzleById(selectedPuzzleId) || getDailyPuzzle(), [selectedPuzzleId]);

    const [currentBoard, setCurrentBoard] = useState<number[]>(puzzle.initialBoard);
    const [playedMoves, setPlayedMoves] = useState<Move[]>([]);
    const [usedDice, setUsedDice] = useState<[boolean, boolean]>([false, false]);
    const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
    const [selectedDie, setSelectedDie] = useState<0 | 1 | null>(null);
    const [showHint, setShowHint] = useState<boolean>(false);
    const [showSolution, setShowSolution] = useState<boolean>(false);
    const [validationResult, setValidationResult] = useState<PuzzleValidationResult | null>(null);
    const [stats, setStats] = useState<DailyPuzzleStats>(() => getPuzzleStats());

    useEffect(() => {
        setCurrentBoard(puzzle.initialBoard); setPlayedMoves([]); setUsedDice([false, false]);
        setSelectedPoint(null); setSelectedDie(null); setShowHint(false); setShowSolution(false); setValidationResult(null);
    }, [puzzle]);

    const boardState: BoardState = useMemo(
        () => ({
            board: currentBoard, turn: puzzle.turn, cubeValue: puzzle.cubeValue ?? 1,
            cubeOwner: puzzle.cubeOwner ?? null, dice: puzzle.dice, matchLength: puzzle.matchLength ?? 7,
            scoreX: puzzle.scoreX ?? 0, scoreO: puzzle.scoreO ?? 0, crawford: false, doubled: false, resigned: 0,
        }),
        [currentBoard, puzzle],
    );

    const { leftDieTargets, rightDieTargets } = useMemo(() => {
        try {
            return computeLegalTargets(boardState, puzzle.dice, usedDice);
        } catch {
            return { leftDieTargets: new Map<number, number[]>(), rightDieTargets: new Map<number, number[]>() };
        }
    }, [boardState, puzzle.dice, usedDice]);

    const handleReset = useCallback(() => {
        setCurrentBoard(puzzle.initialBoard); setPlayedMoves([]); setUsedDice([false, false]);
        setSelectedPoint(null); setSelectedDie(null); setValidationResult(null); impactLight();
    }, [puzzle.initialBoard]);

    const handleCheckerClick = useCallback(
        (point: number) => {
            if (validationResult?.isCorrect) return;
            if (selectedPoint === point) {
                setSelectedPoint(null);
                setSelectedDie(null);
                return;
            }
            const hasChecker =
                puzzle.turn === 'X'
                    ? point === X_BAR ? currentBoard[X_BAR] > 0 : currentBoard[point] > 0
                    : point === O_BAR ? currentBoard[O_BAR] < 0 : currentBoard[point] < 0;
            if (!hasChecker) return;

            const leftTargets = leftDieTargets.get(point) || [];
            const rightTargets = rightDieTargets.get(point) || [];
            if (leftTargets.length === 0 && rightTargets.length === 0) return;

            setSelectedPoint(point);
            if (!usedDice[0] && leftTargets.length > 0) setSelectedDie(0);
            else if (!usedDice[1] && rightTargets.length > 0) setSelectedDie(1);
            impactLight();
        },
        [currentBoard, puzzle.turn, selectedPoint, leftDieTargets, rightDieTargets, usedDice, validationResult],
    );

    const handleDestinationClick = useCallback(
        (dest: number) => {
            if (selectedPoint === null) return;
            const leftTargets = leftDieTargets.get(selectedPoint) || [];
            const rightTargets = rightDieTargets.get(selectedPoint) || [];

            let dieUsed: 0 | 1 | null = null;
            if (selectedDie === 0 && leftTargets.includes(dest)) dieUsed = 0;
            else if (selectedDie === 1 && rightTargets.includes(dest)) dieUsed = 1;
            else if (!usedDice[0] && leftTargets.includes(dest)) dieUsed = 0;
            else if (!usedDice[1] && rightTargets.includes(dest)) dieUsed = 1;
            if (dieUsed === null) return;

            const move: Move = { from: selectedPoint, to: dest };
            const isDouble = puzzle.dice[0] === puzzle.dice[1];
            setCurrentBoard(applyMove(currentBoard, move, puzzle.turn));
            setPlayedMoves((prev) => {
                const nextMoves = [...prev, move];
                setUsedDice((prevDice) => {
                    if (isDouble && nextMoves.length <= 2) return [false, false];
                    const next: [boolean, boolean] = [...prevDice];
                    next[dieUsed] = true;
                    return next;
                });
                return nextMoves;
            });
            setSelectedPoint(null);
            setSelectedDie(null);
            impactLight();
        },
        [selectedPoint, selectedDie, leftDieTargets, rightDieTargets, usedDice, currentBoard, puzzle.turn, puzzle.dice],
    );

    const handleVerify = useCallback(() => {
        if (playedMoves.length === 0) {
            toast.warning('Déplacez vos pions sur le plateau avant de valider.');
            return;
        }
        const result = validatePuzzleMove(puzzle, playedMoves, currentBoard);
        setValidationResult(result);
        setStats(recordPuzzleAttempt(puzzle.id, result.isCorrect, getTodayDateString()));

        if (result.isCorrect) {
            notificationSuccess();
            toast.success('Félicitations ! Coup optimal validé par le moteur.', '🎉 Puzzle Résolu !');
        } else {
            notificationError();
            toast.error(`Perte d'équité : -${result.equityLoss.toFixed(3)}`, 'Inexactitude');
        }
    }, [puzzle, playedMoves, currentBoard]);

    const handleRevealSolution = useCallback(() => {
        setShowSolution(true);
        impactLight();
    }, []);

    return (
        <div className="w-full max-w-6xl space-y-3 animate-fade-in" data-testid="daily-puzzle-view">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e121b]/95 px-4 py-3 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1a1109] text-base">🧩</span>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-[#fdf8eb]">Défi Backgammon Quotidien</h1>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 font-mono text-xs text-[#f3c65f]">{getTodayDateString()}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1109]/90 px-3 py-1.5" title="Série de victoires quotidiennes consécutives" data-testid="puzzle-streak-badge">
                        <span className="text-base">🔥</span>
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-bold text-[#f3c65f] uppercase tracking-wider">Série en cours</span>
                            <span className="font-mono font-extrabold text-[#fdf8eb]">{stats.currentStreak} {stats.currentStreak > 1 ? 'jours' : 'jour'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
                        <span className="font-semibold text-[#a5b0c4] uppercase tracking-wider">Résolus</span>
                        <span className="font-mono font-extrabold text-emerald-400">{stats.totalSolved} / {allPuzzles.length}</span>
                    </div>
                    {onClose && (
                        <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-[#150c07] px-2.5 py-1.5 text-xs text-[#e2d2b5] hover:border-white/25 hover:text-white transition-colors" aria-label="Fermer le mode puzzle">✕</button>
                    )}
                </div>
            </header>

            <section data-testid="puzzle-objective-and-actions" className="rounded-2xl border border-white/10 bg-[#0e121b]/95 p-3.5 sm:p-4 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-[#fdf8eb]">{puzzle.title}</h2>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_COLORS[puzzle.difficulty]}`}>{DIFFICULTY_LABELS[puzzle.difficulty]}</span>
                        <span className="rounded-full border border-white/10 bg-[#150c07] px-2.5 py-0.5 text-xs font-semibold text-[#e2d2b5]">{CATEGORY_LABELS[puzzle.category] || puzzle.category}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1">
                        <span className="text-xs text-[#a5b0c4] font-medium">Jet à jouer :</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#fdf8eb]">
                            <span className="rounded bg-[#180c06] px-2 py-0.5 border border-white/10">{puzzle.dice[0]}</span>
                            <span className="rounded bg-[#180c06] px-2 py-0.5 border border-white/10">{puzzle.dice[1]}</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs sm:text-sm text-[#e2d2b5] leading-relaxed" data-testid="puzzle-objective-description">{puzzle.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-[#a5b0c4] font-semibold">Votre coup :</span>
                        {playedMoves.length === 0 ? (
                            <span className="italic text-slate-400">Sélectionnez un pion puis sa destination</span>
                        ) : (
                            playedMoves.map((m, idx) => (
                                <span key={idx} className="rounded-lg border border-white/10 bg-[#d4af37]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#f3c65f]">
                                    {m.from === X_BAR ? 'bar' : m.from}/{m.to === 0 ? 'off' : m.to}
                                </span>
                            ))
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleReset} disabled={playedMoves.length === 0} className="rounded-xl border border-white/10 bg-[#150c07] px-3 py-1.5 text-xs font-bold text-[#fdf8eb] hover:border-white/25 disabled:opacity-40 disabled:cursor-not-allowed transition" data-testid="puzzle-reset-button">🔄 Réinitialiser</button>
                        <button type="button" onClick={() => setShowHint(!showHint)} className="rounded-xl border border-white/10 bg-[#1a1109] px-3 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="puzzle-hint-button">💡 {showHint ? 'Masquer l’indice' : 'Indice'}</button>
                        <button type="button" onClick={handleRevealSolution} className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-[#e2d2b5] hover:border-white/25 hover:text-white transition" data-testid="puzzle-solution-button">👁️ Voir la solution</button>
                        <button type="button" onClick={handleVerify} className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-1.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1a0f08] shadow-md transition hover:brightness-105 active:scale-95" data-testid="puzzle-verify-button">✦ Valider ma réponse</button>
                    </div>
                </div>

                {showHint && (
                    <div className="rounded-xl border border-white/10 bg-[#180c06]/90 p-3 text-xs text-[#fdf8eb]" data-testid="puzzle-hint-box">
                        <span className="font-bold text-[#f3c65f]">💡 Indice tactique :</span> {puzzle.hint}
                    </div>
                )}

                {showSolution && (
                    <div className="rounded-xl border border-white/10 bg-[#180c06]/95 p-3 text-xs text-[#e2d2b5] space-y-1.5" data-testid="puzzle-solution-box">
                        <div className="flex items-center gap-2 font-extrabold text-[#f3c65f]">
                            <span>🎯 Solution certifiée Monte-Carlo :</span>
                            <span className="rounded border border-white/10 bg-black/50 px-2 py-0.5 font-mono text-[#fdf8eb]">{puzzle.optimalNotation}</span>
                        </div>
                        <p>{puzzle.explanation}</p>
                    </div>
                )}

                {validationResult && (
                    <div className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-100' : 'border-rose-500/50 bg-rose-950/30 text-rose-100'}`} data-testid="puzzle-verdict-card">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold">
                                {validationResult.isCorrect ? '🎉 ' : '⚠️ '}
                                {validationResult.verdict === 'optimal' ? 'Coup Parfait & Optimal !' : validationResult.verdict === 'acceptable' ? 'Bonne Alternative (Acceptable)' : 'Inexactitude ou Blunder'}
                            </span>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border border-white/10 bg-black/40">ΔEq : -{validationResult.equityLoss.toFixed(3)}</span>
                        </div>
                        <p className="text-[#fdf8eb]">{validationResult.explanation}</p>
                        <div className="flex items-center gap-3 pt-1">
                            <span>Coup joué : <strong className="font-mono text-white">{validationResult.playedNotation}</strong></span>
                            <span>•</span>
                            <span>Optimal : <strong className="font-mono text-[#f3c65f]">{validationResult.optimalNotation}</strong></span>
                        </div>
                    </div>
                )}
            </section>

            <div className="relative rounded-2xl border border-white/10 bg-[#080a0f] p-2 sm:p-3 shadow-2xl">
                <Board state={boardState} gamePhase="HUMAN_MOVING" leftDieTargets={leftDieTargets} rightDieTargets={rightDieTargets} selectedPoint={selectedPoint} selectedDie={selectedDie} usedDice={usedDice} onCheckerClick={handleCheckerClick} onCheckerRightClick={() => {}} onDestinationClick={handleDestinationClick} theme={theme} />
            </div>

            <section className="rounded-2xl border border-white/10 bg-[#0e121b]/90 p-4 shadow-xl space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#f3c65f]">📚 Catalogue des Puzzles &amp; Archives</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {allPuzzles.map((p) => (
                        <button key={p.id} type="button" onClick={() => setSelectedPuzzleId(p.id)} className={`flex flex-col text-left rounded-xl border p-3 transition-all ${p.id === puzzle.id ? 'border-[#f3c65f] bg-[#2a170c]/80 shadow-md' : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-[#150c07]'}`} data-testid={`puzzle-card-${p.id}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-[#fdf8eb] truncate">{p.title}</span>
                                {isPuzzleSolved(p.id) && <span className="text-xs" title="Puzzle résolu">✅</span>}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`rounded border px-1.5 py-0.5 font-semibold ${DIFFICULTY_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                                <span className="text-[#a5b0c4]">{CATEGORY_LABELS[p.category] || p.category}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
}
