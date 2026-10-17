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
            className="w-full max-w-6xl rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 via-slate-900/95 to-teal-950/80 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in"
        >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* 1. Titre & Badge Book */}
                <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-2xl shadow-lg shadow-emerald-900/50 ring-2 ring-emerald-400/30">
                        📖
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/30">
                                Opening Book Certifié
                            </span>
                            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                                {opening.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                                Jet [{opening.dice[0]}-{opening.dice[1]}]
                            </span>
                        </div>
                        <h3 className="mt-1 text-base sm:text-lg font-black tracking-wide text-white">
                            {opening.name}
                        </h3>
                    </div>
                </div>

                {/* 2. Coup optimal & Métriques */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 shadow-inner">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            Coup Recommandé
                        </span>
                        <span className="text-lg font-black tracking-wider text-emerald-200">
                            {opening.bestMoveNotation}
                        </span>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Équité Rollout
                        </span>
                        <span
                            className={`text-sm font-bold ${
                                opening.equity >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                        >
                            {opening.equity >= 0 ? `+${opening.equity.toFixed(3)}` : opening.equity.toFixed(3)}
                        </span>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Victoires
                        </span>
                        <span className="text-sm font-bold text-amber-300">
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
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all"
                        title="Jouer automatiquement ce coup sur le plateau"
                    >
                        <span>⚡</span>
                        <span>Jouer {opening.bestMoveNotation}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="explore-book-btn"
                        onClick={() => onExploreBook(opening.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                        title="Voir toutes les ouvertures et alternatives"
                    >
                        <span>📖</span>
                        <span className="hidden sm:inline">Variantes</span>
                    </button>

                    {onToggleHighlight && (
                        <button
                            type="button"
                            onClick={onToggleHighlight}
                            className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                isHighlighted
                                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                                    : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200'
                            }`}
                            title="Activer/désactiver l'indicateur visuel sur le plateau"
                        >
                            👁️
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsExpanded((prev) => !prev)}
                        className="rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                        title={isExpanded ? 'Réduire' : 'Détails stratégiques'}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>

                    <button
                        type="button"
                        data-testid="dismiss-opening-btn"
                        onClick={onDismiss}
                        className="rounded-xl border border-slate-700 bg-slate-800/70 p-2 text-xs text-slate-400 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-700/50 transition"
                        title="Masquer la bannière"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Volet déroulant pédagogique */}
            {isExpanded && (
                <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-in fade-in">
                    <div className="md:col-span-2 space-y-1.5">
                        <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                            <span>🧠</span>
                            <span>Analyse Tactique Rollout 4-Ply</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{opening.explanation}</p>
                    </div>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                        <div className="font-bold text-amber-300 flex items-center gap-1">
                            <span>💡</span>
                            <span>Principe Clé</span>
                        </div>
                        <p className="text-amber-100 font-medium leading-snug">{opening.keyRule}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
