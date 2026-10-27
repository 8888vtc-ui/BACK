'use client';

import React, { useState } from 'react';
import type { OpeningEntry } from '../../features/openings/types';
import type { Move } from '../../engine/backgammonEngine';

export interface OpeningAssistantBannerProps {
    opening: OpeningEntry;
    onApplyMove: (moves: Move[]) => void;
    onExploreBook: (openingId?: string) => void;
    onDismiss: () => void;
    isHighlighted?: boolean;
    onToggleHighlight?: () => void;
}

export function OpeningAssistantBanner({
    opening,
    onApplyMove,
    onExploreBook,
    onDismiss,
    isHighlighted = true,
    onToggleHighlight,
}: OpeningAssistantBannerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            data-testid="opening-assistant-banner"
            className="w-full max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-r from-[#1c140b]/95 via-[#0e131f]/95 to-[#141a29]/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* 1. Titre & Badge Book */}
                <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#33230f] to-[#140d05] text-2xl shadow-inner">
                        📖
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-white/10 bg-[#2b1e0c] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-[#f3c65f]">
                                Opening Book Certifié
                            </span>
                            <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                                {opening.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-300 font-mono">
                                Jet [{opening.dice[0]}-{opening.dice[1]}]
                            </span>
                        </div>
                        <h3 className="font-serif mt-1 text-base sm:text-lg font-black tracking-wide text-[#fdf8eb]">
                            {opening.name}
                        </h3>
                    </div>
                </div>

                {/* 2. Coup optimal & Métriques */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-emerald-500/15 px-3.5 py-1.5 shadow-inner">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                            Coup Recommandé
                        </span>
                        <span className="font-mono text-lg font-black tracking-wider text-emerald-200">
                            {opening.bestMoveNotation}
                        </span>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 px-3.5 py-1.5 text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Équité Rollout
                        </span>
                        <span
                            className={`font-mono text-sm font-bold ${
                                opening.equity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                            {opening.equity >= 0 ? `+${opening.equity.toFixed(3)}` : opening.equity.toFixed(3)}
                        </span>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-white/10 bg-black/40 px-3.5 py-1.5 text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Victoires
                        </span>
                        <span className="font-mono text-sm font-bold text-amber-300">
                            {opening.winPercentage}%
                        </span>
                    </div>
                </div>

                {/* 3. Boutons d'action */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        type="button"
                        data-testid="apply-opening-btn"
                        onClick={() => onApplyMove(opening.bestMoves)}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-[#fef08a]/80 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-4 py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-[#1c1004] shadow-md hover:brightness-105 active:scale-95 transition-all"
                        title="Jouer automatiquement ce coup sur le plateau"
                    >
                        <span>⚡</span>
                        <span>Jouer {opening.bestMoveNotation}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="explore-book-btn"
                        onClick={() => onExploreBook(opening.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-200 hover:border-white/25 hover:text-white transition"
                        title="Voir toutes les ouvertures et alternatives"
                    >
                        <span>📖</span>
                        <span className="hidden sm:inline">Variantes</span>
                    </button>

                    {onToggleHighlight && (
                        <button
                            type="button"
                            onClick={onToggleHighlight}
                            className={`rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold transition ${
                                isHighlighted
                                    ? 'border-[#f3c65f] bg-[#3a2a10] text-[#fff8e1]'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
                            }`}
                            title="Activer/désactiver l'indicateur visuel sur le plateau"
                        >
                            👁️
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:border-white/25 hover:text-white transition"
                        title={isExpanded ? 'Réduire' : 'Détails stratégiques'}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>

                    <button
                        type="button"
                        data-testid="dismiss-opening-btn"
                        onClick={onDismiss}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs sm:text-sm text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-500/40 transition"
                        title="Masquer la bannière"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Volet déroulant pédagogique */}
            {isExpanded && (
                <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm animate-in fade-in">
                    <div className="md:col-span-2 space-y-1.5">
                        <div className="font-semibold text-[#f3c65f] flex items-center gap-1.5">
                            <span>🧠</span>
                            <span>Analyse Tactique Rollout 4-Ply</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{opening.explanation}</p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-amber-500/10 p-3.5 space-y-1">
                        <div className="font-bold text-[#f3c65f] flex items-center gap-1">
                            <span>💡</span>
                            <span>Principe Clé</span>
                        </div>
                        <p className="text-amber-100 font-medium leading-relaxed">{opening.keyRule}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
