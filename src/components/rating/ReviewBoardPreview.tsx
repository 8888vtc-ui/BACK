'use client';

/**
 * Aperçu interactif coup par coup & mode Blunder Training (< 300 lignes, 0 any).
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { EvaluatedTurn } from '../../features/rating/types';
import { impactLight, impactMedium } from '../../lib/capacitor/haptics';
import ReviewBoardGrid from './ReviewBoardGrid';

export interface ReviewBoardPreviewProps {
    turn: EvaluatedTurn;
    currentIndex: number;
    totalTurns: number;
    onPrev: () => void;
    onNext: () => void;
    onFirst: () => void;
    onLast: () => void;
    onPrevMistake: () => void;
    onNextMistake: () => void;
    hasPrevMistake: boolean;
    hasNextMistake: boolean;
    onSelectIndex: (index: number) => void;
    initialDrillMode?: boolean;
}

export function parseMoveNotation(notation: string): Array<{ from: number; to: number }> {
    if (!notation) return [];
    const tokens = notation.trim().split(/\s+/);
    const moves: Array<{ from: number; to: number }> = [];

    for (const t of tokens) {
        const parts = t.split('/');
        if (parts.length === 2) {
            const from = parts[0].toLowerCase() === 'bar' ? 25 : parseInt(parts[0], 10);
            const to = parts[1].toLowerCase() === 'off' ? 0 : parseInt(parts[1], 10);
            if (!isNaN(from) && !isNaN(to)) {
                moves.push({ from, to });
            }
        }
    }
    return moves;
}

export default function ReviewBoardPreview({
    turn, currentIndex, totalTurns, onPrev, onNext, onFirst, onLast,
    onPrevMistake, onNextMistake, hasPrevMistake, hasNextMistake, onSelectIndex, initialDrillMode = false,
}: ReviewBoardPreviewProps) {
    const [viewMode, setViewMode] = useState<'before' | 'after'>('before');
    const [isDrillMode, setIsDrillMode] = useState<boolean>(initialDrillMode);
    const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

    useEffect(() => {
        setSelectedGuess(null);
        setViewMode('before');
    }, [currentIndex, turn.moveNumber]);

    useEffect(() => {
        setIsDrillMode(initialDrillMode);
    }, [initialDrillMode]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onNext();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onPrev, onNext]);

    const activeBoard = viewMode === 'before' ? turn.boardBefore : turn.boardAfter;
    const playedMoves = useMemo(() => parseMoveNotation(turn.playedNotation), [turn.playedNotation]);
    const optimalMoves = useMemo(() => parseMoveNotation(turn.optimalNotation), [turn.optimalNotation]);

    const isMistake = turn.verdict === 'doubtful' || turn.verdict === 'blunder' || turn.verdict === 'howler';
    const hideSolution = isDrillMode && selectedGuess === null;

    const quizChoices = useMemo(() => {
        if (!isMistake || turn.playedNotation === turn.optimalNotation) return [turn.optimalNotation];
        return currentIndex % 2 === 0
            ? [turn.optimalNotation, turn.playedNotation]
            : [turn.playedNotation, turn.optimalNotation];
    }, [isMistake, turn.optimalNotation, turn.playedNotation, currentIndex]);

    const navBtnClass = 'rounded-xl border border-white/10 bg-[#1e120a] px-3 py-1.5 text-xs font-bold text-[#e8dcc6] hover:border-[#f3c65f] disabled:opacity-30 transition';

    return (
        <div
            className="rounded-2xl border border-white/10 bg-[#140b06]/90 p-4 shadow-2xl flex flex-col gap-4"
            data-testid="review-board-preview"
        >
            {/* 1. En-tête du coup sélectionné */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a180c] text-base font-black text-[#f3c65f] font-mono border border-white/15">
                        {turn.dice[0]}-{turn.dice[1]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                                Coup #{turn.moveNumber}
                            </span>
                            <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    turn.verdict === 'optimal'
                                        ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                                        : turn.verdict === 'acceptable'
                                          ? 'bg-teal-950 border border-teal-500/40 text-teal-300'
                                          : turn.verdict === 'doubtful'
                                            ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                                            : 'bg-rose-950 border border-rose-500/40 text-rose-300'
                                }`}
                            >
                                {turn.verdict}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#e8dcc6]/70">
                                {turn.equityLoss === 0 ? '0.000 ΔEq' : `${turn.equityLoss.toFixed(3)} ΔEq`}
                            </span>
                        </div>
                        <div className="text-xs text-[#e8dcc6]/80 mt-0.5 flex items-center gap-2">
                            <span>Joueur {turn.player}</span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-white">
                                Joué : <strong className="text-amber-300">{hideSolution ? '??? (Quiz actif)' : turn.playedNotation}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-white">
                                Optimal : <strong className="text-emerald-400">{hideSolution ? '??? (Quiz actif)' : turn.optimalNotation}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {isMistake && (
                        <button
                            type="button"
                            onClick={() => {
                                impactLight();
                                setIsDrillMode((prev) => !prev);
                                setSelectedGuess(null);
                                setViewMode('before');
                            }}
                            data-testid="toggle-blunder-drill-btn"
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                isDrillMode
                                    ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-md'
                                    : 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                            }`}
                        >
                            🎯 {isDrillMode ? 'Quitter le Quiz' : 'Blunder Training'}
                        </button>
                    )}

                    <div className="flex items-center gap-1 bg-[#0d0704] p-1 rounded-xl border border-white/10 text-xs">
                        <button
                            type="button"
                            onClick={() => setViewMode('before')}
                            className={`px-3 py-1 rounded-lg font-semibold transition ${
                                viewMode === 'before' ? 'bg-[#2a180c] text-white shadow' : 'text-[#e8dcc6]/70 hover:text-white'
                            }`}
                        >
                            Avant le coup
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('after')}
                            className={`px-3 py-1 rounded-lg font-semibold transition ${
                                viewMode === 'after' ? 'bg-[#2a180c] text-white shadow' : 'text-[#e8dcc6]/70 hover:text-white'
                            }`}
                        >
                            Après le coup
                        </button>
                    </div>
                </div>
            </div>

            {/* Module interactif Blunder Training */}
            {isDrillMode && isMistake && (
                <div
                    className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    data-testid="blunder-training-panel"
                >
                    <div className="text-xs">
                        <p className="font-bold text-amber-300">
                            🎯 Blunder Training — Trouvez le coup optimal avec [{turn.dice[0]}-{turn.dice[1]}] :
                        </p>
                        {selectedGuess && (
                            <p
                                className={`mt-1 font-semibold ${selectedGuess === turn.optimalNotation ? 'text-emerald-400' : 'text-rose-400'}`}
                                data-testid="blunder-training-feedback"
                            >
                                {selectedGuess === turn.optimalNotation
                                    ? `✅ Exact ! ${turn.optimalNotation} est le meilleur coup certifié.`
                                    : `❌ ${selectedGuess} perd ${Math.abs(turn.equityLoss).toFixed(3)} EMG. Le coup optimal était ${turn.optimalNotation}.`}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {quizChoices.map((choice) => (
                            <button
                                key={choice}
                                type="button"
                                onClick={() => {
                                    impactMedium();
                                    setSelectedGuess(choice);
                                }}
                                data-testid={`drill-choice-${choice}`}
                                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition ${
                                    selectedGuess === choice
                                        ? choice === turn.optimalNotation
                                            ? 'border-emerald-400 bg-emerald-600 text-white'
                                            : 'border-rose-400 bg-rose-600 text-white'
                                        : 'border-white/15 bg-[#140b06] text-[#fdf8eb] hover:border-amber-400'
                                }`}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Visualisation vectorielle du plateau */}
            <ReviewBoardGrid
                activeBoard={activeBoard}
                dice={turn.dice}
                playedMoves={playedMoves}
                optimalMoves={optimalMoves}
                isMistake={isMistake}
                hideSolution={hideSolution}
            />

            {/* 3. Barre de navigation coup par coup */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                    <button
                        type="button" onClick={onPrevMistake} disabled={!hasPrevMistake}
                        className="rounded-xl border border-white/10 bg-[#1e120a] px-2.5 py-1.5 text-xs font-semibold text-[#e8dcc6] hover:border-[#f3c65f] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Aller à la faute précédente"
                    >
                        ⚠️ Faute préc.
                    </button>
                    <button
                        type="button" onClick={onNextMistake} disabled={!hasNextMistake}
                        className="rounded-xl border border-white/10 bg-[#1e120a] px-2.5 py-1.5 text-xs font-semibold text-[#e8dcc6] hover:border-[#f3c65f] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Aller à la faute suivante"
                    >
                        ⚠️ Faute suiv.
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={onFirst} disabled={currentIndex === 0} className={navBtnClass} title="Premier coup (Début)">⏮</button>
                    <button type="button" onClick={() => { impactLight(); onPrev(); }} disabled={currentIndex === 0} className={navBtnClass} title="Coup précédent (Flèche gauche)">◀</button>
                    <span className="px-3 text-xs font-mono font-bold text-white">{currentIndex + 1} / {totalTurns}</span>
                    <button type="button" onClick={() => { impactLight(); onNext(); }} disabled={currentIndex === totalTurns - 1} className={navBtnClass} title="Coup suivant (Flèche droite)">▶</button>
                    <button type="button" onClick={onLast} disabled={currentIndex === totalTurns - 1} className={navBtnClass} title="Dernier coup (Fin)">⏭</button>
                </div>

                <div className="w-full sm:w-48 flex items-center gap-2">
                    <input
                        type="range" min="0" max={totalTurns - 1} value={currentIndex}
                        onChange={(e) => onSelectIndex(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
