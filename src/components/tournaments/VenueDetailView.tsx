'use client';

/**
 * Fiche SEO Détaillée d'un Club ou Salon de Backgammon.
 *
 * Rôle : Présente l'ensemble des informations pratiques d'un club (adresse, horaires,
 * tarifs, avantages pour les joueurs, fédération) avec liens Google Maps et entraînement.
 *
 * Dépendances : AppNavbar, WorldBackgammonVenue, getCountryFlagEmoji.
 * Retrait : Supprimer ce fichier et sa route `/tournaments/clubs/[slug]`.
 * Strictement 0 `any`, React.memo, budget <= 220 lignes (SCALABILITY.md R1 & R2).
 */

import React from 'react';
import Link from 'next/link';
import AppNavbar from '../nav/AppNavbar';
import type { WorldBackgammonVenue, VenueCategory } from '../../features/tournaments/worldBackgammonVenues';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';

export interface VenueDetailViewProps {
    readonly venue: WorldBackgammonVenue;
    readonly relatedVenues: ReadonlyArray<WorldBackgammonVenue>;
}

const CATEGORY_STYLES: Readonly<Record<VenueCategory, { badge: string; cls: string }>> = {
    prestige_palace: { badge: '🏛️ Palace & Cercle de Prestige', cls: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300' },
    federation_club: { badge: '🏆 Club Fédéral Officiel', cls: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300' },
    social_lounge: { badge: '🍸 Lounge & Rooftop', cls: 'border-sky-500/50 bg-sky-500/20 text-sky-300' },
    traditional_cafe: { badge: '☕ Café Traditionnel', cls: 'border-amber-700/50 bg-amber-700/20 text-amber-200' },
};

const VenueDetailViewComponent: React.FC<VenueDetailViewProps> = ({ venue, relatedVenues }) => {
    const catStyle = CATEGORY_STYLES[venue.category];
    const flag = getCountryFlagEmoji(venue.countryCode);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.googleMapsQuery)}`;

    return (
        <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col" data-testid="venue-detail-view">
            <AppNavbar activeTab="tournaments" />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
                {/* Fil d'Ariane */}
                <nav className="flex items-center gap-2 text-xs text-slate-400" aria-label="Breadcrumb">
                    <Link href="/tournaments" className="hover:text-[#d4af37] transition">Tournois & Clubs</Link>
                    <span>›</span>
                    <span className="text-slate-300">Où Jouer</span>
                    <span>›</span>
                    <span className="text-slate-300">{venue.city}</span>
                    <span>›</span>
                    <span className="text-white truncate font-medium">{venue.name}</span>
                </nav>

                {/* Hero Banner du Club */}
                <section className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0e1626] via-[#0b101b] to-[#070b13] p-6 sm:p-8 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${catStyle.cls}`}>
                                {catStyle.badge}
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                                Affiliation : {venue.federation}
                            </span>
                        </div>
                        <div className="text-xs font-semibold text-amber-300">
                            Niveaux : {venue.skillLevels}
                        </div>
                    </div>

                    <div className="mt-4">
                        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                            {venue.name}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                            <span className="text-xl" role="img" aria-label={venue.countryName}>{flag}</span>
                            <span className="font-semibold text-white">{venue.city}, {venue.countryName}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300">{venue.address}</span>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-300 leading-relaxed max-w-3xl">
                        {venue.seoSummaryFr}
                    </p>
                </section>

                {/* Section Avantages & Atmosphère */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-6 shadow-xl flex flex-col gap-4">
                        <h2 className="font-serif text-base font-bold text-[#d4af37] border-b border-white/10 pb-2">
                            ✨ Pourquoi jouer ici — Les avantages de cet établissement
                        </h2>
                        <ul className="flex flex-col gap-2.5 text-xs text-slate-300">
                            {venue.playerBenefitsFr.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-2">
                                    <span className="text-emerald-400 font-bold text-sm shrink-0">✓</span>
                                    <span className="leading-relaxed">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-6 shadow-xl flex flex-col gap-4">
                        <h2 className="font-serif text-base font-bold text-[#d4af37] border-b border-white/10 pb-2">
                            ℹ️ Informations Pratiques & Ambiance
                        </h2>
                        <dl className="grid grid-cols-1 gap-2.5 text-xs">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Horaires des sessions</dt>
                                <dd className="font-bold text-amber-300">{venue.scheduleFr}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Tarif & Accès</dt>
                                <dd className="font-semibold text-emerald-400">{venue.entryCostLabel}</dd>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                                <dt className="text-slate-400">Fédération de rattachement</dt>
                                <dd className="font-medium text-slate-200">{venue.federation}</dd>
                            </div>
                            <div className="pt-1">
                                <dt className="text-slate-400 mb-1">Ambiance du lieu</dt>
                                <dd className="text-slate-300 italic">« {venue.atmosphereFr} »</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                {/* CTAs Actions */}
                <section className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#141b2d] via-[#0b101b] to-[#141b2d] p-5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={`/?matchLength=7&tournament=${venue.slug}`}
                        data-testid="venue-train-btn"
                        className="flex-1 min-w-[240px] flex items-center justify-center gap-2 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600/40 to-yellow-600/30 px-5 py-3 text-sm font-bold text-amber-200 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:brightness-110 transition"
                    >
                        <span>🎲</span> S'entraîner aux conditions de ce Club (Match 7 pts)
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:border-[#d4af37]/50 hover:bg-white/10 transition"
                        >
                            <span>🗺️</span> Itinéraire Google Maps ↗
                        </a>
                        <a
                            href={venue.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-[#d4af37] hover:border-[#d4af37] hover:bg-white/10 transition"
                        >
                            <span>🌐</span> Site Officiel du Club ↗
                        </a>
                    </div>
                </section>

                {/* Lieux Associés */}
                {relatedVenues.length > 0 && (
                    <section className="mt-2 flex flex-col gap-3">
                        <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
                            <span>🏛️</span> Autres Clubs & Lieux dans la Région
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedVenues.map((rel) => {
                                const relCat = CATEGORY_STYLES[rel.category];
                                return (
                                    <Link
                                        key={rel.id}
                                        href={`/tournaments/clubs/${rel.slug}`}
                                        className="rounded-xl border border-white/10 bg-[#0b101b] p-4 transition hover:border-[#d4af37]/50 hover:bg-white/[0.02]"
                                    >
                                        <div className="flex items-center justify-between text-[10px] font-bold">
                                            <span className={`rounded px-1.5 py-0.5 border ${relCat.cls}`}>{relCat.badge}</span>
                                            <span className="text-slate-400">{rel.city}</span>
                                        </div>
                                        <h4 className="mt-2 text-xs font-bold text-white truncate">{rel.name}</h4>
                                        <div className="mt-1 text-[11px] text-slate-400">
                                            {getCountryFlagEmoji(rel.countryCode)} {rel.countryName} • {rel.scheduleFr}
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

export const VenueDetailView = React.memo(VenueDetailViewComponent);
export default VenueDetailView;
