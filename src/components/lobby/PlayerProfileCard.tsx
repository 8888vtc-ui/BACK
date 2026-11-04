'use client';

/**
 * @file src/components/lobby/PlayerProfileCard.tsx
 * @description Header unifié "Mon Espace Joueur" du bloc Académie & Analyse Grand Maître.
 * Police `font-mono tabular-nums`, séparateurs verticaux `h-4 w-[1px] bg-white/[0.08]`, icônes `lucide-react`.
 * Strictement 0 `any`, < 160 lignes, 0 classe text-[8px] / text-[9px].
 */

import React from 'react';
import { BarChart3, Flame, Trophy } from 'lucide-react';
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
        return { label: 'Non calibré', colorClass: 'text-zinc-300 border-white/10 bg-white/[0.04]' };
    }
    if (pr <= 3.0) {
        return { label: 'Grand Maître', colorClass: 'text-[#F3E5AB] border-[#D4AF37]/40 bg-[#D4AF37]/15' };
    }
    if (pr <= 5.5) {
        return { label: 'Maître', colorClass: 'text-emerald-200 border-emerald-400/30 bg-emerald-500/15' };
    }
    if (pr <= 10.0) {
        return { label: 'Avancé', colorClass: 'text-sky-200 border-white/10 bg-sky-500/15' };
    }
    return { label: 'En progression', colorClass: 'text-zinc-200 border-white/10 bg-white/10' };
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
            className="w-full border-b border-white/10 pb-2.5"
        >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Identité & Rang */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 font-mono text-xs font-bold text-[#F3E5AB]"
                            title={`Membre · ${displayName ?? 'Joueur'}`}
                        >
                            {monogram}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white">
                            {displayName ?? 'Mon Espace Joueur'}
                        </span>
                        <span
                            data-testid="player-rank-badge"
                            className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] font-medium text-zinc-300"
                        >
                            <Trophy size={12} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />
                            <span>{`🏆 ${rankTitle}`}</span>
                        </span>
                    </div>

                    {puzzleStreak > 0 && (
                        <div
                            data-testid="player-streak-badge"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[11px] font-semibold text-[#F3E5AB]"
                        >
                            <Flame size={12} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />
                            <span>{`🔥 Série ${puzzleStreak}j`}</span>
                        </div>
                    )}
                </div>

                {/* Métriques tabulaires unifiées avec séparateurs verticaux fins */}
                <div className="flex flex-wrap items-center gap-2.5 font-mono tabular-nums">
                    <div data-testid="player-elo-stat" className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">ELO</span>
                        <span className="text-xs sm:text-sm font-bold text-white">{eloRating}</span>
                    </div>

                    <span aria-hidden="true" className="h-4 w-[1px] bg-white/[0.08]" />

                    <div
                        data-testid="player-pr-stat"
                        title="Performance Rating : mesure la précision de vos coups, plus il est bas, meilleur vous êtes"
                        className="flex items-center gap-1.5 cursor-help"
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 underline decoration-dotted underline-offset-2">
                            PR
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                            {averagePR !== null ? averagePR.toFixed(2) : '—'}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 font-sans text-[11px] font-medium border ${prBadge.colorClass}`}>
                            {prBadge.label}
                        </span>
                    </div>

                    <span aria-hidden="true" className="h-4 w-[1px] bg-white/[0.08]" />

                    <div data-testid="player-games-stat" className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">MATCHS</span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                            {gamesPlayed}
                            {winRatePct !== null && (
                                <span className="ml-1 text-xs font-normal text-zinc-400">({winRatePct}%)</span>
                            )}
                        </span>
                    </div>

                    <span aria-hidden="true" className="hidden sm:block h-4 w-[1px] bg-white/[0.08]" />

                    <button
                        type="button"
                        onClick={onOpenReview}
                        data-testid="player-profile-review-btn"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:border-[#D4AF37]/40 hover:bg-white/[0.07] px-2.5 py-1 font-sans text-xs font-semibold text-zinc-200 hover:text-white transition-all duration-150 active:scale-95"
                    >
                        <BarChart3 size={14} strokeWidth={1.5} aria-hidden="true" className="text-[#10B981]" />
                        <span>Revue &amp; PR</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const PlayerProfileCard = React.memo(PlayerProfileCardComponent);
export default PlayerProfileCard;
