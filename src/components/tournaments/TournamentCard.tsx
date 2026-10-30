'use client';

/**
 * Carte de Tournoi de Prestige — Style Haute-Horlogerie "Salon Privé Monte-Carlo".
 *
 * Rôle : Affiche l'ensemble des détails d'un tournoi (palier, dates, dotation, lieu, pendule)
 * et fournit les actions directes d'export calendrier (.ICS, Google Agenda), mise en favori,
 * lien vers la fiche détaillée et entraînement direct aux conditions réelles du tournoi.
 *
 * Dépendances : TournamentRecord, getCountryFlagEmoji, buildGoogleCalendarUrl.
 * Retrait : Supprimer ce fichier et ses imports dans TournamentWorldHubView.
 * Strictement 0 `any`, React.memo, budget <= 270 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useCallback } from 'react';
import Link from 'next/link';
import type { TournamentRecord, TournamentTier } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji, buildGoogleCalendarUrl } from '../../features/tournaments/tournamentEngine';

export interface TournamentCardProps {
    readonly tournament: TournamentRecord;
    readonly isBookmarked: boolean;
    readonly onToggleBookmark: (tournamentId: string) => void;
    readonly onExportIcs: (tournament: TournamentRecord) => void;
}

interface TierBadgeConfig {
    readonly label: string;
    readonly className: string;
}

const TIER_CONFIGS: Readonly<Record<TournamentTier, TierBadgeConfig>> = {
    mega: {
        label: '👑 MEGA MAJOR',
        className: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.25)]',
    },
    grand: {
        label: '🏆 GRAND MASTER',
        className: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-emerald-500/20 text-emerald-300 border-emerald-500/50',
    },
    moyen: {
        label: '🎖️ OPEN MOYEN',
        className: 'bg-gradient-to-r from-amber-800/20 via-orange-800/25 to-amber-800/20 text-amber-200 border-amber-700/50',
    },
};

function formatDateRange(startIso: string, endIso: string): string {
    const months = ['jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const sParts = startIso.split('-');
    const eParts = endIso.split('-');
    const sDay = parseInt(sParts[2], 10);
    const sMonth = months[parseInt(sParts[1], 10) - 1];
    const eDay = parseInt(eParts[2], 10);
    const eMonth = months[parseInt(eParts[1], 10) - 1];
    const eYear = eParts[0];

    if (sMonth === eMonth && sParts[0] === eParts[0]) {
        return `${sDay} - ${eDay} ${sMonth} ${eYear}`;
    }
    return `${sDay} ${sMonth} - ${eDay} ${eMonth} ${eYear}`;
}

const TournamentCardComponent: React.FC<TournamentCardProps> = ({
    tournament,
    isBookmarked,
    onToggleBookmark,
    onExportIcs,
}) => {
    const tierConfig = TIER_CONFIGS[tournament.tier] ?? TIER_CONFIGS.moyen;
    const flag = getCountryFlagEmoji(tournament.countryCode);
    const googleCalendarUrl = buildGoogleCalendarUrl(tournament);

    const handleBookmarkClick = useCallback(() => {
        onToggleBookmark(tournament.id);
    }, [onToggleBookmark, tournament.id]);

    const handleExportIcsClick = useCallback(() => {
        onExportIcs(tournament);
    }, [onExportIcs, tournament]);

    return (
        <article
            className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0b101b] p-5 shadow-xl transition-all duration-200 hover:border-[#d4af37]/50 hover:shadow-2xl"
            data-testid={`tournament-card-${tournament.slug}`}
        >
            {/* Header: Palier, Fédération & Favori */}
            <div>
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${tierConfig.className}`}>
                            {tierConfig.label}
                        </span>
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                            {tournament.federation}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleBookmarkClick}
                        data-testid={`bookmark-tournament-${tournament.slug}`}
                        aria-label={isBookmarked ? 'Retirer de mon agenda' : 'Ajouter à mon agenda'}
                        className={`rounded-lg border p-1.5 transition ${
                            isBookmarked
                                ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                                : 'border-white/10 bg-white/5 text-slate-400 hover:border-amber-400/40 hover:text-amber-300'
                        }`}
                    >
                        <span className="text-sm">{isBookmarked ? '★' : '☆'}</span>
                    </button>
                </div>

                {/* Titre et Localisation */}
                <div className="mt-3">
                    <Link
                        href={`/tournaments/${tournament.slug}`}
                        className="font-serif text-lg font-bold text-white leading-snug tracking-tight hover:text-[#d4af37] transition block"
                    >
                        {tournament.name}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="text-base" role="img" aria-label={tournament.countryName}>{flag}</span>
                        <span className="font-medium text-slate-200">{tournament.city}, {tournament.countryName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="truncate text-slate-400">{tournament.venueName}</span>
                    </div>
                </div>

                {/* Métriques clés : Dates, Cadence, Dotation */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white/[0.03] p-3 text-xs border border-white/5">
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Dates</div>
                        <div className="font-semibold text-amber-300">{formatDateRange(tournament.startDate, tournament.endDate)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Format & Pendule</div>
                        <div className="font-semibold text-slate-200">{tournament.matchLengthMain} pts • {tournament.clockRules}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Inscription</div>
                        <div className="font-semibold text-slate-200">{tournament.entryFeeMain} {tournament.currency}</div>
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Prize Pool Estimé</div>
                        <div className="font-semibold text-emerald-400">
                            {tournament.estimatedPrizePool !== null
                                ? `${tournament.estimatedPrizePool.toLocaleString('fr-FR')} ${tournament.currency}`
                                : 'Non communiqué'}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {tournament.descriptionFr}
                </p>

                {/* Side events */}
                {tournament.sideEvents.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                        {tournament.sideEvents.map((evt) => (
                            <span key={evt} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 border border-white/5">
                                {evt}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions : Calendrier, Entraînement & Fiche */}
            <div className="mt-5 border-t border-white/5 pt-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={handleExportIcsClick}
                        data-testid={`export-ics-${tournament.slug}`}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#d4af37]/40 hover:bg-white/10"
                    >
                        <span>📅</span> .ICS
                    </button>
                    <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#d4af37]/40 hover:bg-white/10"
                    >
                        <span>📆</span> Google Agenda
                    </a>
                </div>

                <Link
                    href={`/?matchLength=${tournament.matchLengthMain}&tournament=${encodeURIComponent(tournament.name)}`}
                    className="flex items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-gradient-to-r from-amber-600/30 to-yellow-600/20 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition hover:border-amber-400 hover:from-amber-600/40"
                >
                    <span>🎯</span> S'entraîner aux conditions ({tournament.matchLengthMain} pts)
                </Link>

                <div className="grid grid-cols-2 gap-2 text-center">
                    <Link
                        href={`/tournaments/${tournament.slug}`}
                        data-testid={`detail-link-${tournament.slug}`}
                        className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-semibold text-[#d4af37] transition hover:border-[#d4af37]/50 hover:bg-white/10"
                    >
                        Fiche détaillée →
                    </Link>
                    <a
                        href={tournament.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/20 hover:text-white"
                    >
                        Site Officiel ↗
                    </a>
                </div>
            </div>
        </article>
    );
};

export const TournamentCard = React.memo(TournamentCardComponent);
export default TournamentCard;
