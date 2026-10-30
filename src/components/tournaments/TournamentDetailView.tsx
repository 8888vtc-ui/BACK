'use client';

/**
 * Vue Détaillée d'un Tournoi Officiel — Direction "Salon Privé Monte-Carlo".
 *
 * Rôle : Fiche exhaustive d'un tournoi (règlement, cadence, buy-in, dotation, side events)
 * avec entraînement direct aux conditions du tournoi, export .ICS et Google Agenda.
 *
 * Dépendances : AppNavbar, TournamentRecord, getCountryFlagEmoji, buildGoogleCalendarUrl.
 * Retrait : Supprimer ce fichier et sa route `/tournaments/[slug]`.
 * Strictement 0 `any`, React.memo, budget <= 265 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import type { TournamentRecord, TournamentTier } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji, buildGoogleCalendarUrl, generateTournamentIcs } from '../../features/tournaments/tournamentEngine';
import { loadBookmarkedTournamentIds, toggleTournamentBookmark, triggerIcsDownload } from '../../lib/supabase/tournamentService';

export interface TournamentDetailViewProps {
    readonly tournament: TournamentRecord;
    readonly relatedTournaments: ReadonlyArray<TournamentRecord>;
}

const TIER_BADGES: Readonly<Record<TournamentTier, { label: string; cls: string }>> = {
    mega: { label: '👑 MEGA MAJOR', cls: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.25)]' },
    grand: { label: '🏆 GRAND MASTER', cls: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' },
    moyen: { label: '🎖️ OPEN MOYEN', cls: 'border-amber-700/50 bg-amber-700/20 text-amber-200' },
};

const TournamentDetailViewComponent: React.FC<TournamentDetailViewProps> = ({ tournament, relatedTournaments }) => {
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        setIsBookmarked(loadBookmarkedTournamentIds().has(tournament.id));
    }, [tournament.id]);

    const handleToggleBookmark = useCallback(() => {
        const next = toggleTournamentBookmark(tournament.id);
        setIsBookmarked(next.has(tournament.id));
    }, [tournament.id]);

    const handleExportIcs = useCallback(() => {
        triggerIcsDownload(generateTournamentIcs(tournament), `${tournament.slug}.ics`);
    }, [tournament]);

    const tierInfo = TIER_BADGES[tournament.tier] ?? TIER_BADGES.moyen;
    const flag = getCountryFlagEmoji(tournament.countryCode);
    const googleCalUrl = buildGoogleCalendarUrl(tournament);
    const trainHref = `/?matchLength=${tournament.matchLengthMain}&tournament=${encodeURIComponent(tournament.name)}`;

    return (
        <div
            className="h-dvh max-h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#070b13] text-slate-100 flex flex-col"
            data-testid="tournament-detail-view"
        >
            <AppNavbar activeTab="tournaments" />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
                <nav className="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <Link href="/tournaments" className="hover:text-[#d4af37] transition">← Base Mondiale des Tournois</Link>
                    <span>/</span>
                    <span className="text-slate-200 truncate">{tournament.name}</span>
                </nav>

                {/* Hero Header */}
                <section className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0e1626] via-[#0b101b] to-[#070b13] p-6 sm:p-8 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${tierInfo.cls}`}>
                                {tierInfo.label}
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                                {tournament.federation}
                            </span>
                            {tournament.isVerified && (
                                <span className="rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
                                    ✓ Vérifié
                                </span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleBookmark}
                            data-testid="detail-bookmark-btn"
                            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                                isBookmarked ? 'border-amber-400/80 bg-amber-500/20 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <span>{isBookmarked ? '★ Dans Mon Agenda' : '☆ Ajouter à Mon Agenda'}</span>
                        </button>
                    </div>

                    <div className="mt-4">
                        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">{tournament.name}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                            <span className="text-xl" role="img" aria-label={tournament.countryName}>{flag}</span>
                            <span className="font-semibold text-white">{tournament.city}, {tournament.countryName}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-amber-300 font-medium">{tournament.venueName}</span>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-3xl">{tournament.descriptionFr}</p>
                    {tournament.descriptionEn && tournament.descriptionEn !== tournament.descriptionFr && (
                        <p className="mt-2 text-xs text-slate-400 italic leading-relaxed max-w-3xl">{tournament.descriptionEn}</p>
                    )}
                </section>

                {/* Spécifications 2 Colonnes */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-6 shadow-xl flex flex-col gap-4">
                        <h2 className="font-serif text-base font-bold text-[#d4af37] border-b border-white/10 pb-2 flex items-center gap-2">
                            <span>🎲</span> Format & Règlement Officiel
                        </h2>
                        <dl className="grid grid-cols-1 gap-2.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Longueur Main Event</dt>
                                <dd className="font-bold text-white">Match en {tournament.matchLengthMain} points</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Cadence Horloge</dt>
                                <dd className="font-semibold text-amber-200">{tournament.clockRules}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Variante</dt>
                                <dd className="font-semibold text-slate-200 capitalize">{tournament.speedVariant}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Affluence Attendue</dt>
                                <dd className="font-semibold text-slate-200">{tournament.expectedPlayersMin} – {tournament.expectedPlayersMax} joueurs</dd>
                            </div>
                            {tournament.sideEvents.length > 0 && (
                                <div className="pt-1">
                                    <dt className="text-slate-400 mb-1.5">Side Events</dt>
                                    <dd className="flex flex-wrap gap-1.5">
                                        {tournament.sideEvents.map((evt) => (
                                            <span key={evt} className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">{evt}</span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-6 shadow-xl flex flex-col gap-4">
                        <h2 className="font-serif text-base font-bold text-[#d4af37] border-b border-white/10 pb-2 flex items-center gap-2">
                            <span>💶</span> Dates, Inscriptions & Dotation
                        </h2>
                        <dl className="grid grid-cols-1 gap-2.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Dates</dt>
                                <dd className="font-bold text-amber-300">{tournament.startDate} → {tournament.endDate} ({tournament.timezone})</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Clôture Inscriptions</dt>
                                <dd className="font-semibold text-slate-200">{tournament.registrationDeadline ?? 'Sur place / Veille'}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Buy-in Main Event</dt>
                                <dd className="font-bold text-white">{tournament.entryFeeMain} {tournament.currency}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Prize Pool Estimé</dt>
                                <dd className="font-bold text-emerald-400 text-sm">
                                    {tournament.estimatedPrizePool ? `${tournament.estimatedPrizePool.toLocaleString('fr-FR')} ${tournament.currency}` : 'Non communiqué'}
                                </dd>
                            </div>
                            <div className="flex justify-between pt-1">
                                <dt className="text-slate-400">Organisateur</dt>
                                <dd className="font-medium text-slate-300 text-right">{tournament.organizerName}</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                {/* Barre d'Actions */}
                <section className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#141b2d] via-[#0b101b] to-[#141b2d] p-5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={trainHref}
                        data-testid="detail-train-btn"
                        className="flex-1 min-w-[240px] flex items-center justify-center gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600/40 to-yellow-600/30 px-5 py-3 text-sm font-bold text-amber-200 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:brightness-110 transition"
                    >
                        <span>🎯</span> S'entraîner aux conditions du tournoi ({tournament.matchLengthMain} pts)
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleExportIcs}
                            data-testid="detail-export-ics-btn"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:border-[#d4af37]/50 hover:bg-white/10 transition"
                        >
                            <span>📅</span> Télécharger .ICS
                        </button>
                        <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-200 hover:border-[#d4af37]/50 hover:bg-white/10 transition"
                        >
                            <span>📆</span> Google Agenda ↗
                        </a>
                        <a
                            href={tournament.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[#d4af37] hover:border-[#d4af37] hover:bg-white/10 transition"
                        >
                            Site Officiel ↗
                        </a>
                    </div>
                </section>

                {/* Tournois Associés */}
                {relatedTournaments.length > 0 && (
                    <section className="mt-2 flex flex-col gap-3">
                        <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                            <span>🏛️</span> Autres Tournois du Même Circuit
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedTournaments.map((rel) => {
                                const relTier = TIER_BADGES[rel.tier] ?? TIER_BADGES.moyen;
                                return (
                                    <Link
                                        key={rel.id}
                                        href={`/tournaments/${rel.slug}`}
                                        className="rounded-xl border border-white/10 bg-[#0b101b] p-4 transition hover:border-[#d4af37]/50 hover:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className={`rounded px-1.5 py-0.5 border ${relTier.cls}`}>{relTier.label}</span>
                                            <span className="text-slate-400">{rel.startDate}</span>
                                        </div>
                                        <h4 className="mt-2 text-xs font-bold text-white truncate">{rel.name}</h4>
                                        <div className="mt-1 text-[11px] text-slate-400">
                                            {getCountryFlagEmoji(rel.countryCode)} {rel.city}, {rel.countryName} • {rel.matchLengthMain} pts
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export const TournamentDetailView = React.memo(TournamentDetailViewComponent);
export default TournamentDetailView;
