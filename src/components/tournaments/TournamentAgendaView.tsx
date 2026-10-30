'use client';

/**
 * Vue Agenda Chronologique Mensuel des Tournois — Direction "Haute-Horlogerie".
 *
 * Rôle : Affiche le calendrier des tournois regroupé par mois chronologiques avec timeline,
 * export global multi-événements en 1 clic et filtrage direct de l'agenda personnel.
 *
 * Dépendances : TournamentMonthGroup, TournamentRecord, getCountryFlagEmoji.
 * Retrait : Supprimer ce fichier et ses imports dans TournamentWorldHubView.
 * Strictement 0 `any`, React.memo, budget <= 240 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { TournamentMonthGroup, TournamentRecord, TournamentTier } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';

export interface TournamentAgendaViewProps {
    readonly monthGroups: ReadonlyArray<TournamentMonthGroup>;
    readonly bookmarkedIds: ReadonlySet<string>;
    readonly onlyBookmarked: boolean;
    readonly onToggleOnlyBookmarked: () => void;
    readonly onToggleBookmark: (tournamentId: string) => void;
    readonly onExportIcs: (tournament: TournamentRecord) => void;
    readonly onExportAllIcs: () => void;
}

const MONTH_NAMES_FR: ReadonlyArray<string> = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const TIER_ICONS: Readonly<Record<TournamentTier, { badge: string; color: string }>> = {
    mega: { badge: '👑 MEGA', color: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' },
    grand: { badge: '🏆 GRAND', color: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' },
    moyen: { badge: '🎖️ MOYEN', color: 'border-amber-700/50 bg-amber-700/20 text-amber-200' },
};

const TournamentAgendaViewComponent: React.FC<TournamentAgendaViewProps> = ({
    monthGroups,
    bookmarkedIds,
    onlyBookmarked,
    onToggleOnlyBookmarked,
    onToggleBookmark,
    onExportIcs,
    onExportAllIcs,
}) => {
    const totalTournamentsInView = useMemo(
        () => monthGroups.reduce((acc, g) => acc + g.tournaments.length, 0),
        [monthGroups]
    );

    return (
        <div className="flex flex-col gap-6" data-testid="tournament-agenda-view">
            {/* Header Action Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0b101b] via-[#141b2d] to-[#0b101b] p-4 shadow-lg">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🗓️</span>
                    <div>
                        <h3 className="font-serif text-base font-bold text-white">
                            Agenda Mondial & Calendrier Personnalisé
                        </h3>
                        <p className="text-xs text-slate-300">
                            {totalTournamentsInView} tournoi{totalTournamentsInView > 1 ? 's' : ''} au programme • Export iCal standard RFC 5545
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleOnlyBookmarked}
                        data-testid="agenda-toggle-bookmarks-btn"
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                            onlyBookmarked
                                ? 'border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40 hover:text-white'
                        }`}
                    >
                        <span>{onlyBookmarked ? '★' : '☆'}</span>
                        <span>Mon Agenda ({bookmarkedIds.size})</span>
                    </button>

                    <button
                        type="button"
                        onClick={onExportAllIcs}
                        data-testid="export-all-ics-btn"
                        className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/50 bg-gradient-to-r from-amber-600/30 to-yellow-600/20 px-3.5 py-1.5 text-xs font-bold text-[#d4af37] transition hover:border-[#d4af37] hover:from-amber-600/40"
                    >
                        <span>📅</span>
                        <span>Exporter tout en .ICS</span>
                    </button>
                </div>
            </div>

            {/* Liste des groupes mensuels */}
            {monthGroups.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0b101b]/80 p-12 text-center text-slate-400">
                    <p className="text-base">Aucun tournoi ne correspond aux filtres actifs.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {monthGroups.map((group) => {
                        const monthLabel = `${MONTH_NAMES_FR[group.monthIndex - 1] ?? ''} ${group.year}`;
                        const megaCount = group.tournaments.filter((t) => t.tier === 'mega').length;
                        const grandCount = group.tournaments.filter((t) => t.tier === 'grand').length;
                        const moyenCount = group.tournaments.filter((t) => t.tier === 'moyen').length;

                        return (
                            <section
                                key={group.monthKey}
                                className="rounded-2xl border border-white/10 bg-[#0b101b] p-5 shadow-xl"
                                data-testid={`month-group-${group.monthKey}`}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                                    <h4 className="font-serif text-lg font-bold text-white tracking-wide">
                                        {monthLabel}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs">
                                        {megaCount > 0 && (
                                            <span className="rounded-full border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 font-semibold text-yellow-300">
                                                {megaCount} Mega
                                            </span>
                                        )}
                                        {grandCount > 0 && (
                                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                                                {grandCount} Grand
                                            </span>
                                        )}
                                        {moyenCount > 0 && (
                                            <span className="rounded-full border border-amber-700/40 bg-amber-700/10 px-2 py-0.5 font-semibold text-amber-200">
                                                {moyenCount} Moyen
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 divide-y divide-white/5">
                                    {group.tournaments.map((t) => {
                                        const isBookmarked = bookmarkedIds.has(t.id);
                                        const tierInfo = TIER_ICONS[t.tier] ?? TIER_ICONS.moyen;
                                        const flag = getCountryFlagEmoji(t.countryCode);
                                        const trainHref = `/?matchLength=${t.matchLengthMain}&tournament=${encodeURIComponent(t.name)}`;

                                        return (
                                            <div
                                                key={t.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 transition hover:bg-white/[0.02] px-2 rounded-lg"
                                                data-testid={`agenda-row-${t.slug}`}
                                            >
                                                <div className="flex items-start sm:items-center gap-3 min-w-0">
                                                    <div className="w-16 shrink-0 text-center rounded-lg bg-white/5 border border-white/5 py-1">
                                                        <div className="text-[10px] uppercase font-bold text-slate-400">
                                                            {t.startDate.slice(8, 10)}
                                                        </div>
                                                        <div className="text-[9px] text-amber-300">
                                                            {MONTH_NAMES_FR[parseInt(t.startDate.slice(5, 7), 10) - 1]?.slice(0, 3)}
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${tierInfo.color}`}>
                                                                {tierInfo.badge}
                                                            </span>
                                                            <Link
                                                                href={`/tournaments/${t.slug}`}
                                                                className="text-xs font-semibold text-white truncate hover:text-[#d4af37] transition"
                                                            >
                                                                {t.name}
                                                            </Link>
                                                        </div>
                                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                                                            <span>{flag}</span>
                                                            <span className="text-slate-300">{t.city}, {t.countryName}</span>
                                                            <span>•</span>
                                                            <span>{t.matchLengthMain} pts</span>
                                                            <span>•</span>
                                                            <span className="text-emerald-400 font-medium">
                                                                {t.estimatedPrizePool ? `${t.estimatedPrizePool.toLocaleString('fr-FR')} ${t.currency}` : `${t.entryFeeMain} ${t.currency}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleBookmark(t.id)}
                                                        className={`rounded p-1.5 text-xs transition border ${
                                                            isBookmarked
                                                                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                                                                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                                        }`}
                                                        title={isBookmarked ? 'Retirer de mon agenda' : 'Ajouter à mon agenda'}
                                                    >
                                                        {isBookmarked ? '★' : '☆'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onExportIcs(t)}
                                                        className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-300 transition hover:border-[#d4af37]/40 hover:text-white"
                                                        title="Exporter vers mon calendrier (.ics)"
                                                    >
                                                        📅 .ICS
                                                    </button>

                                                    <Link
                                                        href={trainHref}
                                                        className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200 transition hover:border-amber-400"
                                                    >
                                                        🎯 {t.matchLengthMain} pts
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const TournamentAgendaView = React.memo(TournamentAgendaViewComponent);
export default TournamentAgendaView;
