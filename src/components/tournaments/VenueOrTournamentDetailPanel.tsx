'use client';

/**
 * @file src/components/tournaments/VenueOrTournamentDetailPanel.tsx
 * @description Panneau latéral droit (4 colonnes) affichant la fiche détaillée du Club ou du Tournoi sélectionné.
 * Zéro emoji système, icônes Lucide fines (strokeWidth={1.5}), typographie sans-serif, bilingue FR/EN.
 * Strictement <= 220 lignes, 0 any.
 */

import React from 'react';
import Link from 'next/link';
import { Building2, Trophy, MapPin, Clock, CreditCard, ExternalLink, Dices, Calendar, Award, Globe, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getTournamentsDict } from '../../lib/i18n/tournamentsDict';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { formatTournamentDateFr } from '../../features/tournaments/tournamentEngine';

export interface VenueOrTournamentDetailPanelProps {
    readonly venue: WorldBackgammonVenue | null;
    readonly tournament: TournamentRecord | null;
    readonly onClose?: () => void;
}

export const VenueOrTournamentDetailPanel: React.FC<VenueOrTournamentDetailPanelProps> = React.memo(({
    venue,
    tournament,
    onClose,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const dict = getTournamentsDict(locale);

    if (!venue && !tournament) {
        return (
            <aside
                data-testid="venue-detail-empty-panel"
                className="h-full min-h-[380px] rounded-2xl border border-white/10 bg-[#070b13] p-5 flex flex-col items-center justify-center text-center text-slate-400 shadow-2xl"
            >
                <Globe className="w-8 h-8 text-[#D4AF37] mb-3" strokeWidth={1.5} />
                <h3 className="font-sans text-base font-bold tracking-tight text-white mb-1">{dict.emptyPanelTitle}</h3>
                <p className="text-xs text-slate-400 max-w-xs">{dict.emptyPanelDesc}</p>
            </aside>
        );
    }

    if (tournament) {
        return (
            <aside
                data-testid="tournament-detail-panel"
                className="h-full min-h-[380px] rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#0b1320] via-[#070b13] to-[#070b13] p-4 flex flex-col justify-between shadow-2xl"
            >
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#D4AF37] shrink-0">
                                <Trophy size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                            </span>
                            <div>
                                <span className="inline-flex items-center gap-1 rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                                    <Trophy size={11} strokeWidth={1.5} />
                                    <span>{dict.tournamentBadgePrefix} {tournament.tier.toUpperCase()} • {tournament.federation}</span>
                                </span>
                                <h3 className="mt-0.5 font-sans text-sm sm:text-base font-bold tracking-tight text-white leading-snug">{tournament.name}</h3>
                            </div>
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                data-testid="close-detail-panel-btn"
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white"
                                aria-label="Close"
                            ><X size={14} strokeWidth={1.5} /></button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                        <div className="flex items-start gap-2">
                            <MapPin size={14} strokeWidth={1.5} className="text-[#D4AF37] shrink-0 mt-0.5" />
                            <div>
                                <span className="text-slate-400">{dict.cityCountryLabel} </span>
                                <span className="font-semibold text-white">{tournament.city}, {tournament.countryName}</span>
                                {tournament.venueName && (
                                    <span className="block text-xs text-slate-300 mt-0.5">{dict.venueLabel} {tournament.venueName}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={14} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                            <div>
                                <span className="text-slate-400">{dict.officialDatesLabel} </span>
                                <span className="font-bold text-amber-200 whitespace-nowrap">
                                    {formatTournamentDateFr(tournament.startDate)} → {formatTournamentDateFr(tournament.endDate)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Award size={14} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                            <div>
                                <span className="text-slate-400">{dict.prizePoolLabel} </span>
                                <span className="font-black text-[#D4AF37]">
                                    {tournament.estimatedPrizePool
                                        ? `${tournament.estimatedPrizePool.toLocaleString(isEn ? 'en-US' : 'fr-FR')} ${tournament.currency}`
                                        : dict.officialPrizeFallback}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Dices size={14} strokeWidth={1.5} className="text-emerald-400 shrink-0" />
                            <div>
                                <span className="text-slate-400">{dict.formatLabel} </span>
                                <span className="font-semibold text-emerald-300">{dict.mainMatchPts(tournament.matchLengthMain)}</span>
                            </div>
                        </div>
                        {tournament.descriptionFr && (
                            <p className="text-xs text-slate-300 italic pt-1 border-t border-white/5 line-clamp-2">
                                « {tournament.descriptionFr} »
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2.5 border-t border-white/10">
                    <Link
                        href={`/tournaments/${tournament.slug}`}
                        data-testid="tournament-details-btn"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-lg hover:brightness-105 transition"
                    >
                        <span>{dict.officialTournamentCta}</span>
                        <ExternalLink size={14} strokeWidth={1.75} />
                    </Link>
                    <Link
                        href={`/?matchLength=${tournament.matchLengthMain}&tournament=${encodeURIComponent(tournament.name)}`}
                        data-testid="tournament-train-btn"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-center text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/50 hover:text-white transition"
                    >
                        <Dices size={14} strokeWidth={1.5} className="text-[#D4AF37]" />
                        <span>{dict.trainTournamentCta(tournament.matchLengthMain)}</span>
                    </Link>
                </div>
            </aside>
        );
    }

    if (!venue) return null;

    return (
        <aside
            data-testid="club-detail-panel"
            className="h-full min-h-[380px] rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-[#0b1b16] via-[#070b13] to-[#070b13] p-4 flex flex-col justify-between shadow-2xl"
        >
            <div className="flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-[#D4AF37] shrink-0">
                            <Building2 size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                        </span>
                        <div>
                            <span className="inline-flex items-center gap-1 rounded border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                                <Building2 size={11} strokeWidth={1.5} />
                                <span>{dict.clubBadgePrefix} • {venue.federation}</span>
                            </span>
                            <h3 className="mt-0.5 font-sans text-sm sm:text-base font-bold tracking-tight text-white leading-snug">{venue.name}</h3>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            data-testid="close-detail-panel-btn"
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white"
                            aria-label="Close"
                        ><X size={14} strokeWidth={1.5} /></button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                    <div className="flex items-start gap-2">
                        <MapPin size={14} strokeWidth={1.5} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                            <span className="text-slate-400">{dict.cityAddressLabel} </span>
                            <span className="font-semibold text-white">{venue.city}, {venue.countryName}</span>
                            {venue.address && (
                                <span className="block text-xs text-slate-300 mt-0.5 line-clamp-2">{venue.address}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <Clock size={14} strokeWidth={1.5} className="text-[#D4AF37] shrink-0 mt-0.5" />
                        <div>
                            <span className="text-slate-400">{dict.openingHoursLabel} </span>
                            <span className="font-semibold text-amber-200">{venue.scheduleFr}</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-2">
                        <CreditCard size={14} strokeWidth={1.5} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-slate-400">{dict.feesAccessLabel} </span>
                            <span className="font-semibold text-emerald-300">{venue.entryCostLabel}</span>
                        </div>
                    </div>
                    {venue.atmosphereFr && (
                        <p className="text-xs text-slate-300 italic pt-1 border-t border-white/5 line-clamp-2">
                            « {venue.atmosphereFr} »
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 pt-2.5 border-t border-white/10">
                <a
                    href={venue.officialUrl || `/tournaments/clubs/${venue.slug}`}
                    target={venue.officialUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    data-testid="club-official-site-btn"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-black shadow-lg hover:brightness-105 transition"
                >
                    <span>{dict.officialClubCta}</span>
                    <ExternalLink size={14} strokeWidth={1.75} />
                </a>
                <Link
                    href={`/?matchLength=7&tournament=${encodeURIComponent(venue.name)}`}
                    data-testid="club-play-online-btn"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-center text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/50 hover:text-white transition"
                >
                    <Dices size={14} strokeWidth={1.5} className="text-[#D4AF37]" />
                    <span>{dict.playClubLoungeCta}</span>
                </Link>
            </div>
        </aside>
    );
});

VenueOrTournamentDetailPanel.displayName = 'VenueOrTournamentDetailPanel';
export default VenueOrTournamentDetailPanel;
