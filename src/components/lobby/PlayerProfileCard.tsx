'use client';

/**
 * Carte "Mon Espace Joueur" dans le Lobby — Design Horlogerie & Blason Héraldique.
 *
 * Affiche :
 *   - Blason de membre serti d'or ciselé (remplace l'avatar circulaire jaune basique)
 *   - Badge de rang compétitif (Novice à Grand Maître)
 *   - Guichets horlogers biseautés : Cote ELO, PR Moyen Open Sage, Bilan de Matchs
 *   - Bouton d'accès direct en 1 clic à la Revue & Analyse PR
 *   - Strictement 0 `any`, < 300 lignes.
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
        return { label: 'Non calibré', colorClass: 'text-amber-200/80 border-white/10 bg-[#1a150b]/80' };
    }
    if (pr <= 3.0) {
        return { label: 'Grand Maître', colorClass: 'text-amber-200 border-white/10 bg-amber-500/20' };
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
            className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c111d]/85 p-3.5 shadow-lg"
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Identité & Blason Héraldique de Club Privé */}
                <div className="flex items-center gap-3">
                    <div
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-[#2b1f0e] to-[#090704]"
                        title={`Membre du Salon · ${displayName ?? 'Joueur Privilège'}`}
                    >
                        <span className="font-serif bg-gradient-to-b from-[#fff7dc] via-[#ecc966] to-[#b58422] bg-clip-text text-xs font-black tracking-widest text-transparent">
                            {monogram}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-sm sm:text-base font-bold tracking-wide text-[#fdf8eb]">
                            {displayName ?? 'Mon Espace Joueur'}
                        </span>
                        <span
                            data-testid="player-rank-badge"
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-[#f3c65f]"
                        >
                            🏆 {rankTitle}
                        </span>
                        {puzzleStreak > 0 && (
                            <span
                                data-testid="player-streak-badge"
                                className="rounded-full border border-white/10 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-200"
                            >
                                🔥 Série {puzzleStreak}j
                            </span>
                        )}
                    </div>
                </div>

                {/* Guichets Horlogers : ELO, PR Moyen, Matchs + Bouton Revue */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <div
                        data-testid="player-elo-stat"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            ELO
                        </span>
                        <span className="font-mono text-sm font-black text-[#f3c65f]">
                            {eloRating}
                        </span>
                    </div>

                    <div
                        data-testid="player-pr-stat"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            PR
                        </span>
                        <span className="font-mono text-sm font-black text-amber-100">
                            {averagePR !== null ? averagePR.toFixed(2) : '—'}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold border ${prBadge.colorClass}`}>
                            {prBadge.label}
                        </span>
                    </div>

                    <div
                        data-testid="player-games-stat"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"
                    >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Matchs
                        </span>
                        <span className="font-mono text-sm font-black text-slate-100">
                            {gamesPlayed}
                            {winRatePct !== null ? (
                                <span className="ml-1 text-xs font-semibold text-[#e5c158]">
                                    ({winRatePct}%)
                                </span>
                            ) : null}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenReview}
                        data-testid="player-profile-review-btn"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:border-white/25 hover:bg-white/10 hover:text-white active:scale-95"
                    >
                        <span aria-hidden="true" className="[filter:sepia(0.9)_saturate(2.5)_hue-rotate(5deg)]">📊</span>
                        <span>Revue & PR</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export const PlayerProfileCard = React.memo(PlayerProfileCardComponent);
export default PlayerProfileCard;
