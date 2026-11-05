'use client';

/**
 * @file src/components/tournaments/VenueOrTournamentDetailPanel.tsx
 * @description Panneau latéral droit (4 colonnes) affichant la fiche détaillée du Club ou du Tournoi sélectionné.
 * Évite d'occulter la carte du monde avec une modale flottante.
 * Strictement <= 200 lignes, 0 any.
 */

import React from 'react';
import Link from 'next/link';
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
    if (!venue && !tournament) {
        return (
            <aside
                data-testid="venue-detail-empty-panel"
                className="h-full min-h-[520px] rounded-2xl border border-white/10 bg-[#070b13] p-6 flex flex-col items-center justify-center text-center text-slate-400 shadow-2xl"
            >
                <span className="text-4xl mb-3" aria-hidden="true">🗺️</span>
                <h3 className="font-serif text-base font-bold text-white mb-1">Sélectionnez un Lieu ou Tournoi</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                    Cliquez sur un marqueur de la carte (🏆 Tournoi ou 🏛️ Club) pour afficher ses horaires, son adresse et ses liens officiels.
                </p>
            </aside>
        );
    }

    if (tournament) {
        return (
            <aside
                data-testid="tournament-detail-panel"
                className="h-full min-h-[520px] rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#0b1320] via-[#070b13] to-[#070b13] p-4 sm:p-5 flex flex-col justify-between shadow-2xl"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-black uppercase text-amber-300">
                                {tournament.countryCode}
                            </span>
                            <div>
                                <span className="inline-block rounded border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                                    🏆 Tournoi {tournament.tier.toUpperCase()} • {tournament.federation}
                                </span>
                                <h3 className="mt-1 font-serif text-base font-bold text-white leading-snug">{tournament.name}</h3>
                            </div>
                        </div>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                data-testid="close-detail-panel-btn"
                                className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white"
                                aria-label="Fermer la fiche"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                        <div>
                            <span className="text-slate-400">📍 Ville &amp; Pays : </span>
                            <span className="font-semibold text-white">{tournament.city}, {tournament.countryName}</span>
                            {tournament.venueName && (
                                <span className="block text-[11px] text-slate-300 mt-0.5">Lieu : {tournament.venueName}</span>
                            )}
                        </div>
                        <div>
                            <span className="text-slate-400">📅 Dates Officielles : </span>
                            <span className="font-bold text-amber-200">
                                {formatTournamentDateFr(tournament.startDate)} → {formatTournamentDateFr(tournament.endDate)}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400">💰 Dotation (Prize Pool) : </span>
                            <span className="font-black text-[#D4AF37]">
                                {tournament.estimatedPrizePool
                                    ? `${tournament.estimatedPrizePool.toLocaleString('fr-FR')} ${tournament.currency}`
                                    : 'Officiel FFB / WBGF'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400">🎲 Format Compétition : </span>
                            <span className="font-semibold text-emerald-300">Match principal en {tournament.matchLengthMain} pts</span>
                        </div>
                        {tournament.descriptionFr && (
                            <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                                « {tournament.descriptionFr} »
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                    <Link
                        href={`/tournaments/${tournament.slug}`}
                        data-testid="tournament-details-btn"
                        className="w-full rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#070B12] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                    >
                        🏆 Voir les Détails / S’inscrire au Tournoi ↗
                    </Link>
                    <Link
                        href={`/?matchLength=${tournament.matchLengthMain}&tournament=${encodeURIComponent(tournament.name)}`}
                        data-testid="tournament-train-btn"
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-center text-xs font-bold text-slate-200 hover:border-[#D4AF37] hover:text-white transition"
                    >
                        🎲 S’entraîner au format {tournament.matchLengthMain} pts
                    </Link>
                </div>
            </aside>
        );
    }

    if (!venue) return null;

    return (
        <aside
            data-testid="club-detail-panel"
            className="h-full min-h-[520px] rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-[#0b1b16] via-[#070b13] to-[#070b13] p-4 sm:p-5 flex flex-col justify-between shadow-2xl"
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 font-mono text-xs font-black uppercase text-emerald-300">
                            {venue.countryCode}
                        </span>
                        <div>
                            <span className="inline-block rounded border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                🏛️ Club &amp; Salon • {venue.federation}
                            </span>
                            <h3 className="mt-1 font-serif text-base font-bold text-white leading-snug">{venue.name}</h3>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            data-testid="close-detail-panel-btn"
                            className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white"
                            aria-label="Fermer la fiche"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                    <div>
                        <span className="text-slate-400">📍 Ville / Adresse : </span>
                        <span className="font-semibold text-white">{venue.city}, {venue.countryName}</span>
                        {venue.address && (
                            <span className="block text-[11px] text-slate-300 mt-0.5">{venue.address}</span>
                        )}
                    </div>
                    <div>
                        <span className="text-slate-400">🕒 Horaires d’Ouverture : </span>
                        <span className="font-semibold text-amber-200">{venue.scheduleFr}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">💳 Tarif / Accès : </span>
                        <span className="font-semibold text-emerald-300">{venue.entryCostLabel}</span>
                    </div>
                    {venue.atmosphereFr && (
                        <p className="text-[11px] text-slate-300 italic pt-1 border-t border-white/5">
                            « {venue.atmosphereFr} »
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <a
                    href={venue.officialUrl || `/tournaments/clubs/${venue.slug}`}
                    target={venue.officialUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    data-testid="club-official-site-btn"
                    className="w-full rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] via-[#f7d77e] to-[#b88924] px-4 py-2.5 text-center text-xs font-black uppercase tracking-wider text-[#070B12] shadow-[0_4px_16px_rgba(212,175,55,0.35)] hover:brightness-105 transition"
                >
                    📍 Site Officiel / S’inscrire au Club ↗
                </a>
                <Link
                    href={`/?matchLength=7&tournament=${encodeURIComponent(venue.name)}`}
                    data-testid="club-play-online-btn"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-center text-xs font-bold text-slate-200 hover:border-[#D4AF37] hover:text-white transition"
                >
                    🎲 Jouer au Salon en ligne du Club
                </Link>
            </div>
        </aside>
    );
});

VenueOrTournamentDetailPanel.displayName = 'VenueOrTournamentDetailPanel';
export default VenueOrTournamentDetailPanel;
