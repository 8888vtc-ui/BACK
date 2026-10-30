'use client';

/**
 * Barre de statut "Mon Espace Joueur" dans le Lobby — Design E-Sport Pro 2026 (1 ligne, épuré).
 * Strictement 0 `any`, < 160 lignes.
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

    return (
        <section
            aria-label="Mon Espace Joueur"
            data-testid="player-profile-card"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-3.5 py-2.5"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-slate-800 text-xs font-bold text-slate-200"
                        title={`Membre · ${displayName ?? 'Joueur'}`}
                    >
                        {monogram}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                            {displayName ?? 'Mon Espace Joueur'}
                        </span>
                        <span
                            data-testid="player-rank-badge"
                            className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300"
                        >
                            🏆 {rankTitle}
                        </span>
                        {puzzleStreak > 0 && (
                            <span
                                data-testid="player-streak-badge"
                                className="rounded-md border border-white/10 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200"
                            >
                                🔥 Série {puzzleStreak}j
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        data-testid="player-elo-stat"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1"
                    >
                        <span className="text-[11px] font-medium uppercase text-slate-400">ELO</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white">{eloRating}</span>
                    </div>

                    <div
                        data-testid="player-pr-stat"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1"
                    >
                        <span className="text-[11px] font-medium uppercase text-slate-400">PR</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white">
                            {averagePR !== null ? averagePR.toFixed(2) : '—'}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium border ${prBadge.colorClass}`}>
                            {prBadge.label}
                        </span>
                    </div>

                    <div
                        data-testid="player-games-stat"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1"
                    >
                        <span className="text-[11px] font-medium uppercase text-slate-400">Matchs</span>
                        <span className="font-mono text-xs sm:text-sm font-bold text-white">
                            {gamesPlayed}
                            {winRatePct !== null ? (
                                <span className="ml-1 text-xs font-normal text-slate-400">({winRatePct}%)</span>
                            ) : null}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenReview}
                        data-testid="player-profile-review-btn"
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
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
