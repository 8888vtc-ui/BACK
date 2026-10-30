'use client';

/**
 * Barre de statut "Mon Espace Joueur" dans le Lobby — Design Pilules de Progression Galaxy.
 * Strictement 0 `any`, < 180 lignes, 0 classe text-[8px] / text-[9px].
 */

import React from 'react';
import { getCompetitiveRankTitle } from '../nav/UserAccountMenu';

export interface PlayerProfileCardProps {
    displayName: string | null;
    eloRating: number;
    averagePR: number | null;
    gamesPlayed: number;
    winsCount: number;
    puzzleStreak: number;
    onOpenReview: () => void;
}

export function getPrClassLabel(pr: number | null): { label: string; colorClass: string } {
    if (pr === null) {
        return { label: 'Non calibré', colorClass: 'text-slate-300 border-white/10 bg-white/5' };
    }
    if (pr <= 3.0) {
        return { label: 'Grand Maître', colorClass: 'text-amber-200 border-white/10 bg-amber-500/15' };
    }
    if (pr <= 5.5) {
        return { label: 'Maître', colorClass: 'text-emerald-200 border-white/10 bg-emerald-500/15' };
    }
    if (pr <= 10.0) {
        return { label: 'Avancé', colorClass: 'text-sky-200 border-white/10 bg-sky-500/15' };
    }
    return { label: 'En progression', colorClass: 'text-slate-200 border-white/10 bg-white/10' };
}

const PlayerProfileCardComponent: React.FC<PlayerProfileCardProps> = ({
    displayName,
    eloRating,
    averagePR,
    gamesPlayed,
    winsCount,
    puzzleStreak,
    onOpenReview,
}) => {
    const rankTitle = getCompetitiveRankTitle(eloRating);
    const prBadge = getPrClassLabel(averagePR);
    const winRatePct = gamesPlayed > 0 ? Math.round((winsCount / gamesPlayed) * 100) : null;
    const monogram = (displayName ?? 'M').trim().slice(0, 2).toUpperCase();
    const eloProgress = Math.min(100, Math.max(10, Math.round(((eloRating - 1000) / 1200) * 100)));
    const streakProgress = Math.min(100, Math.max(15, puzzleStreak * 20));

    return (
        <section
            aria-label="Mon Espace Joueur"
            data-testid="player-profile-card"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
        >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Pilule Identité & Série */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Avatar + Nom + Rang */}
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1f35] px-2.5 py-1.5">
                        <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#121526] text-xs font-black text-slate-200"
                            title={`Membre · ${displayName ?? 'Joueur'}`}
                        >
                            {monogram}
                        </div>
                        <span className="text-sm font-bold text-white">
                            {displayName ?? 'Mon Espace Joueur'}
                        </span>
                        <span
                            data-testid="player-rank-badge"
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                        >
                            🏆 {rankTitle}
                        </span>
                    </div>

                    {/* Pilule Série / Progression Dorée */}
                    {puzzleStreak > 0 && (
                        <div
                            data-testid="player-streak-badge"
                            className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200"
                        >
                            <span>🔥 Série {puzzleStreak}j</span>
                            <div className="h-1.5 w-10 overflow-hidden rounded-full bg-amber-950/80">
                                <div
                                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                                    style={{ width: `${streakProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Pilules Statistiques ELO, PR, Matchs & Action */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Pilule Elo avec mini-jauge bleue */}
                    <div
                        data-testid="player-elo-stat"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1f35] px-3 py-1.5"
                    >
                        <span aria-hidden="true" className="text-xs">📊</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ELO</span>
                        <span className="font-mono text-sm sm:text-base font-black text-white">{eloRating}</span>
                        <div className="h-1.5 w-8 overflow-hidden rounded-full bg-sky-950 hidden sm:block">
                            <div
                                className="h-full rounded-full bg-sky-400 transition-all duration-300"
                                style={{ width: `${eloProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Pilule PR */}
                    <div
                        data-testid="player-pr-stat"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1f35] px-3 py-1.5"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PR</span>
                        <span className="font-mono text-sm sm:text-base font-black text-white">
                            {averagePR !== null ? averagePR.toFixed(2) : '—'}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${prBadge.colorClass}`}>
                            {prBadge.label}
                        </span>
                    </div>

                    {/* Pilule Matchs */}
                    <div
                        data-testid="player-games-stat"
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1f35] px-3 py-1.5"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matchs</span>
                        <span className="font-mono text-sm sm:text-base font-bold text-white">
                            {gamesPlayed}
                            {winRatePct !== null && (
                                <span className="ml-1 text-xs font-normal text-slate-400">({winRatePct}%)</span>
                            )}
                        </span>
                    </div>

                    {/* Bouton Revue & PR */}
                    <button
                        type="button"
                        onClick={onOpenReview}
                        data-testid="player-profile-review-btn"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition active:scale-95 shadow"
                    >
                        <span>📊</span>
                        <span>Revue &amp; PR</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const PlayerProfileCard = React.memo(PlayerProfileCardComponent);
export default PlayerProfileCard;
