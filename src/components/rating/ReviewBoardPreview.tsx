'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { EvaluatedTurn } from '../../features/rating/types';
import { impactLight } from '../../lib/capacitor/haptics';

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
    turn,
    currentIndex,
    totalTurns,
    onPrev,
    onNext,
    onFirst,
    onLast,
    onPrevMistake,
    onNextMistake,
    hasPrevMistake,
    hasNextMistake,
    onSelectIndex,
}: ReviewBoardPreviewProps) {
    const [viewMode, setViewMode] = useState<'before' | 'after'>('before');

    // Navigation clavier fluide
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
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

    // Rendu d'une flèche du plateau (1 à 24)
    const renderPoint = useCallback(
        (pointNum: number, isTop: boolean) => {
            const count = (activeBoard && activeBoard[pointNum]) || 0;
            const isX = count > 0;
            const numCheckers = Math.abs(count);
            const isAltColor = pointNum % 2 === 0;

            const isPlayedSource = playedMoves.some((m) => m.from === pointNum);
            const isPlayedDest = playedMoves.some((m) => m.to === pointNum);
            const isOptimalDest = optimalMoves.some((m) => m.to === pointNum);

            return (
                <div
                    key={pointNum}
                    className={`relative flex flex-col items-center flex-1 h-32 sm:h-40 border-r border-slate-800/60 last:border-r-0 ${
                        isTop ? 'justify-start pt-1' : 'justify-end pb-1'
                    } ${
                        isPlayedDest
                            ? isMistake
                                ? 'bg-rose-950/20 ring-1 ring-inset ring-rose-500/40'
                                : 'bg-emerald-950/20 ring-1 ring-inset ring-emerald-500/40'
                            : isOptimalDest && isMistake
                            ? 'bg-emerald-950/25 ring-1 ring-inset ring-emerald-400/50'
                            : isAltColor
                            ? 'bg-slate-900/60'
                            : 'bg-slate-950/60'
                    }`}
                >
                    {/* Numéro de la flèche */}
                    <div
                        className={`text-[10px] font-mono font-semibold ${
                            isTop ? 'order-first mb-0.5' : 'order-last mt-0.5'
                        } ${
                            isOptimalDest
                                ? 'text-emerald-300 font-bold'
                                : isPlayedDest
                                ? isMistake
                                    ? 'text-rose-300 font-bold'
                                    : 'text-emerald-300'
                                : 'text-slate-500'
                        }`}
                    >
                        {pointNum}
                    </div>

                    {/* Empilement des pions */}
                    <div
                        className={`flex flex-col items-center gap-0.5 w-full ${
                            isTop ? 'flex-col' : 'flex-col-reverse'
                        }`}
                    >
                        {Array.from({ length: Math.min(numCheckers, 5) }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition-all ${
                                    isX
                                        ? 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 border border-white/80 ring-1 ring-black/20'
                                        : 'bg-gradient-to-b from-amber-700 to-amber-950 text-amber-100 border border-amber-600/60'
                                }`}
                            >
                                {idx === 4 && numCheckers > 5 ? `+${numCheckers - 4}` : ''}
                            </div>
                        ))}
                    </div>

                    {/* Badges indicatifs des coups (Joué / Optimal) */}
                    {isOptimalDest && isMistake && (
                        <span
                            className={`absolute ${
                                isTop ? 'bottom-1' : 'top-1'
                            } rounded-full bg-emerald-500 px-1 text-[8px] font-black text-slate-950 shadow-sm`}
                            title="Destination optimale GNUBG"
                        >
                            ✓ Opt.
                        </span>
                    )}
                    {isPlayedDest && (
                        <span
                            className={`absolute ${
                                isTop ? 'bottom-5' : 'top-5'
                            } rounded-full px-1 text-[8px] font-bold shadow-sm ${
                                isMistake ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                            }`}
                            title="Destination coup joué"
                        >
                            {isMistake ? '✕ Joué' : '✓ Joué'}
                        </span>
                    )}
                </div>
            );
        },
        [activeBoard, playedMoves, optimalMoves, isMistake],
    );

    return (
        <div
            className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-2xl flex flex-col gap-4"
            data-testid="review-board-preview"
        >
            {/* 1. En-tête du coup sélectionné */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-base font-black text-amber-400 font-mono border border-slate-700">
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
                            <span className="text-xs font-mono font-bold text-slate-400">
                                {turn.equityLoss === 0 ? '0.000 ΔEq' : `${turn.equityLoss.toFixed(3)} ΔEq`}
                            </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-2">
                            <span>Joueur {turn.player}</span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-white">
                                Joué : <strong className="text-amber-300">{turn.playedNotation}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono font-semibold text-white">
                                Optimal : <strong className="text-emerald-400">{turn.optimalNotation}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bascule Avant / Après coup */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                        type="button"
                        onClick={() => setViewMode('before')}
                        className={`px-3 py-1 rounded-lg font-semibold transition ${
                            viewMode === 'before'
                                ? 'bg-slate-800 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Avant le coup
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('after')}
                        className={`px-3 py-1 rounded-lg font-semibold transition ${
                            viewMode === 'after'
                                ? 'bg-slate-800 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        Après le coup
                    </button>
                </div>
            </div>

            {/* 2. Visualisation vectorielle du plateau */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-2 sm:p-3 overflow-hidden shadow-inner">
                {/* Ligne haute : flèches 13 à 18 (à gauche) puis 19 à 24 (à droite) */}
                <div className="flex items-stretch border-b border-slate-700/80">
                    <div className="flex flex-1">
                        {[13, 14, 15, 16, 17, 18].map((p) => renderPoint(p, true))}
                    </div>
                    {/* Barre centrale */}
                    <div className="w-8 sm:w-10 bg-slate-950 flex flex-col items-center justify-center border-x border-slate-800 text-[9px] font-mono text-slate-500">
                        BAR
                    </div>
                    <div className="flex flex-1">
                        {[19, 20, 21, 22, 23, 24].map((p) => renderPoint(p, true))}
                    </div>
                </div>

                {/* Rivière médiane */}
                <div className="h-6 sm:h-8 flex items-center justify-between px-3 text-[10px] text-slate-400 bg-slate-950/70 border-y border-slate-800/80 font-mono">
                    <span>JAN EXTÉRIEUR (13-18 / 12-7)</span>
                    <span className="text-amber-400 font-bold">
                        Jet [{turn.dice[0]}-{turn.dice[1]}]
                    </span>
                    <span>JAN INTÉRIEUR (19-24 / 6-1)</span>
                </div>

                {/* Ligne basse : flèches 12 à 7 (à gauche) puis 6 à 1 (à droite) */}
                <div className="flex items-stretch">
                    <div className="flex flex-1">
                        {[12, 11, 10, 9, 8, 7].map((p) => renderPoint(p, false))}
                    </div>
                    {/* Barre centrale */}
                    <div className="w-8 sm:w-10 bg-slate-950 flex flex-col items-center justify-center border-x border-slate-800 text-[9px] font-mono text-slate-500">
                        BAR
                    </div>
                    <div className="flex flex-1">
                        {[6, 5, 4, 3, 2, 1].map((p) => renderPoint(p, false))}
                    </div>
                </div>
            </div>

            {/* 3. Barre de navigation coup par coup */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Saut d'erreur */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onPrevMistake}
                        disabled={!hasPrevMistake}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Aller à la faute précédente"
                    >
                        ⚠️ Faute préc.
                    </button>
                    <button
                        type="button"
                        onClick={onNextMistake}
                        disabled={!hasNextMistake}
                        className="rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Aller à la faute suivante"
                    >
                        ⚠️ Faute suiv.
                    </button>
                </div>

                {/* Contrôles pas-à-pas */}
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onFirst}
                        disabled={currentIndex === 0}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Premier coup (Début)"
                    >
                        ⏮
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            impactLight();
                            onPrev();
                        }}
                        disabled={currentIndex === 0}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Coup précédent (Flèche gauche)"
                    >
                        ◀
                    </button>

                    <span className="px-3 text-xs font-mono font-bold text-white">
                        {currentIndex + 1} / {totalTurns}
                    </span>

                    <button
                        type="button"
                        onClick={() => {
                            impactLight();
                            onNext();
                        }}
                        disabled={currentIndex === totalTurns - 1}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Coup suivant (Flèche droite)"
                    >
                        ▶
                    </button>
                    <button
                        type="button"
                        onClick={onLast}
                        disabled={currentIndex === totalTurns - 1}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-30 transition"
                        title="Dernier coup (Fin)"
                    >
                        ⏭
                    </button>
                </div>

                {/* Scrubber / Slider de progression */}
                <div className="w-full sm:w-48 flex items-center gap-2">
                    <input
                        type="range"
                        min="0"
                        max={totalTurns - 1}
                        value={currentIndex}
                        onChange={(e) => onSelectIndex(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
}
