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
        return { label: 'Non calibré', colorClass: 'text-amber-200/80 border-[#d4af37]/30 bg-[#1a150b]/80' };
    }
    if (pr <= 3.0) {
        return { label: 'Grand Maître', colorClass: 'text-amber-200 border-[#f3c65f]/60 bg-amber-500/20' };
    }
    if (pr <= 5.5) {
        return { label: 'Maître', colorClass: 'text-emerald-200 border-emerald-400/50 bg-emerald-500/15' };
    }
    if (pr <= 10.0) {
        return { label: 'Avancé', colorClass: 'text-sky-200 border-sky-400/45 bg-sky-500/15' };
    }
    return { label: 'En progression', colorClass: 'text-slate-200 border-white/20 bg-white/10' };
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
            className="relative w-full overflow-hidden rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#111726]/95 via-[#0d1320]/95 to-[#121826]/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,244,214,0.18)]"
        >
            {/* Filet spéculaire supérieur en laiton poli */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#f3c65f]/60 to-transparent"
            />

            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
                {/* Identité & Blason Héraldique de Club Privé */}
                <div className="flex items-center gap-3.5">
                    <div
                        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#e5c158]/70 bg-gradient-to-b from-[#2b1f0e] via-[#161008] to-[#090704] shadow-[0_6px_18px_rgba(0,0,0,0.75),inset_0_1px_2px_rgba(255,245,205,0.4)]"
                        title={`Membre du Salon · ${displayName ?? 'Joueur Privilège'}`}
                    >
                        {/* Couronne gravée au sommet du blason */}
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="absolute -top-1.5 h-3.5 w-3.5 text-[#f3c65f] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                            fill="currentColor"
                        >
                            <path d="M3 18h18v2H3v-2zm0-2l2-9 4.5 4L12 5l2.5 6L19 7l2 9H3z" />
                        </svg>
                        <span className="font-serif bg-gradient-to-b from-[#fff7dc] via-[#ecc966] to-[#b58422] bg-clip-text text-sm font-black tracking-widest text-transparent">
                            {monogram}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif text-base font-bold tracking-wide text-[#fdf8eb]">
                                {displayName ?? 'Mon Espace Joueur'}
                            </span>
                            <span
                                data-testid="player-rank-badge"
                                className="rounded-full border border-[#e5c158]/50 bg-gradient-to-r from-[#2c200d] to-[#1e1508] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f3c65f] shadow-inner"
                            >
                                🏆 {rankTitle}
                            </span>
                            {puzzleStreak > 0 && (
                                <span
                                    data-testid="player-streak-badge"
                                    className="rounded-full border border-amber-400/45 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200"
                                >
                                    🔥 Série {puzzleStreak}j
                                </span>
                            )}
                        </div>
                        <span className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-400">
                            Certification officielle · Moteur neuronal Open Sage 3-Ply
                        </span>
                    </div>
                </div>

                {/* Guichets Horlogers : ELO, PR Moyen, Matchs + Bouton Revue */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    <div
                        data-testid="player-elo-stat"
                        className="flex flex-col rounded-xl border border-[#d4af37]/25 bg-[#070a10]/90 px-3 py-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]"
                    >
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            Cote ELO
                        </span>
                        <span className="font-mono text-sm font-black text-[#f3c65f]">
                            {eloRating}
                        </span>
                    </div>

                    <div
                        data-testid="player-pr-stat"
                        className="flex flex-col rounded-xl border border-[#d4af37]/25 bg-[#070a10]/90 px-3 py-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]"
                    >
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            PR Moyen
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-black text-amber-100">
                                {averagePR !== null ? averagePR.toFixed(2) : '—'}
                            </span>
                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${prBadge.colorClass}`}>
                                {prBadge.label}
                            </span>
                        </div>
                    </div>

                    <div
                        data-testid="player-games-stat"
                        className="flex flex-col rounded-xl border border-[#d4af37]/25 bg-[#070a10]/90 px-3 py-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.85)]"
                    >
                        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                            Matchs
                        </span>
                        <span className="font-mono text-sm font-black text-slate-100">
                            {gamesPlayed}
                            {winRatePct !== null ? (
                                <span className="ml-1 text-[10px] font-semibold text-[#e5c158]">
                                    ({winRatePct}%)
                                </span>
                            ) : null}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenReview}
                        data-testid="player-profile-review-btn"
                        className="flex items-center gap-1.5 rounded-xl border border-[#e5c158]/55 bg-gradient-to-b from-[#2f220e] via-[#211709] to-[#140e05] px-3.5 py-2 text-xs font-bold tracking-wide text-[#fce8b2] shadow-[0_4px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,245,205,0.28)] transition hover:border-[#f3c65f] hover:from-[#3d2c12] hover:to-[#1d1407] hover:text-white active:scale-95"
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
