'use client';

/**
 * Vue Carte Mondiale Interactive & Répertoire Où Jouer au Backgammon.
 *
 * Rôle : Carte du monde vectorielle SVG Monte-Carlo (1000x500) avec repères interactifs,
 * fiches détaillées des clubs, salons et avantages joueurs vérifiés.
 *
 * Dépendances : WorldBackgammonVenue, VenueCategory, getCountryFlagEmoji.
 * Retrait : Supprimer ce fichier et ses imports dans TournamentWorldHubView.
 * Strictement 0 `any`, React.memo, budget <= 270 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue, VenueCategory } from '../../features/tournaments/worldBackgammonVenues';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';

export interface WorldVenuesMapDirectoryViewProps {
    readonly venues: ReadonlyArray<WorldBackgammonVenue>;
}

const CATEGORY_TABS: ReadonlyArray<{ id: VenueCategory | 'all'; label: string }> = [
    { id: 'all', label: 'Tous les Lieux' },
    { id: 'prestige_palace', label: '🏛️ Palaces & Cercles' },
    { id: 'federation_club', label: '🏆 Clubs Fédéraux' },
    { id: 'social_lounge', label: '🍸 Lounges & Rooftops' },
    { id: 'traditional_cafe', label: '☕ Cafés Traditionnels' },
];

const CATEGORY_STYLES: Readonly<Record<VenueCategory, { badge: string; cls: string; pinFill: string }>> = {
    prestige_palace: { badge: '🏛️ Palace & Cercle', cls: 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300', pinFill: '#eab308' },
    federation_club: { badge: '🏆 Club Fédéral', cls: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300', pinFill: '#10b981' },
    social_lounge: { badge: '🍸 Lounge & Rooftop', cls: 'border-sky-500/50 bg-sky-500/20 text-sky-300', pinFill: '#38bdf8' },
    traditional_cafe: { badge: '☕ Café Traditionnel', cls: 'border-amber-700/50 bg-amber-700/20 text-amber-200', pinFill: '#d97706' },
};

const WorldVenuesMapDirectoryViewComponent: React.FC<WorldVenuesMapDirectoryViewProps> = ({ venues }) => {
    const [selectedCategory, setSelectedCategory] = useState<VenueCategory | 'all'>('all');
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venues[0]?.id ?? null);

    const filtered = useMemo(() => {
        if (selectedCategory === 'all') return venues;
        return venues.filter((v) => v.category === selectedCategory);
    }, [venues, selectedCategory]);

    const activeVenue = useMemo(() => {
        return venues.find((v) => v.id === selectedVenueId) ?? filtered[0] ?? null;
    }, [venues, selectedVenueId, filtered]);

    const handleSelectVenue = useCallback((id: string) => setSelectedVenueId(id), []);

    return (
        <div className="flex flex-col gap-6" data-testid="world-venues-map-directory">
            {/* Header introductif */}
            <header className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0b101b] via-[#141b2d] to-[#0b101b] p-5 shadow-xl">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🌍</span>
                    <div>
                        <h3 className="font-serif text-lg font-bold text-white">Guide Mondial : Où Jouer au Backgammon (Clubs, Salons & Cafés)</h3>
                        <p className="mt-0.5 text-xs text-slate-300">Carte interactive des 16 clubs, lounges et salons mythiques où disputer des parties en réel (Live) avec pendule.</p>
                    </div>
                </div>
            </header>

            {/* Carte Interactive SVG */}
            <div className="relative rounded-2xl border border-white/10 bg-[#070b13] p-4 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                    <span className="font-semibold text-slate-300">🗺️ Carte Interactive des Clubs & Salons</span>
                    <span>Cliquez sur un repère pour afficher les détails</span>
                </div>

                <div className="relative w-full aspect-[2/1] max-h-[380px] bg-[#090e1a] rounded-xl overflow-hidden border border-white/5">
                    <svg viewBox="0 0 1000 500" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
                        <defs>
                            <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(212,175,55,0.06)" strokeWidth="0.8" />
                            </pattern>
                        </defs>
                        <rect width="1000" height="500" fill="#060911" />
                        <rect width="1000" height="500" fill="url(#gridPattern)" />
                        <g fill="rgba(255,255,255,0.03)" stroke="rgba(212,175,55,0.18)" strokeWidth="1">
                            <path d="M 120,80 Q 220,70 300,120 Q 320,180 260,240 Q 200,220 130,160 Z" />
                            <path d="M 230,260 Q 300,270 320,340 Q 270,450 240,460 Q 210,380 230,260 Z" />
                            <path d="M 440,70 Q 560,50 600,140 Q 540,190 450,150 Z" />
                            <path d="M 460,200 Q 560,190 580,280 Q 550,420 500,400 Q 450,300 460,200 Z" />
                            <path d="M 600,80 Q 860,60 910,180 Q 840,290 680,240 Q 620,160 600,80 Z" />
                            <path d="M 800,340 Q 920,330 940,410 Q 880,470 800,430 Z" />
                        </g>

                        {venues.map((venue) => {
                            const isSelected = activeVenue?.id === venue.id;
                            const pinX = venue.coordinates.mapX * 10;
                            const pinY = venue.coordinates.mapY * 5;
                            const catStyle = CATEGORY_STYLES[venue.category];

                            return (
                                <g key={venue.id} className="cursor-pointer" onClick={() => handleSelectVenue(venue.id)} data-testid={`map-pin-${venue.slug}`}>
                                    {isSelected && (
                                        <circle cx={pinX} cy={pinY} r="14" fill={catStyle.pinFill} opacity="0.35">
                                            <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                                        </circle>
                                    )}
                                    <circle cx={pinX} cy={pinY} r={isSelected ? 6 : 4} fill={catStyle.pinFill} stroke="#ffffff" strokeWidth={isSelected ? 2 : 1} />
                                    <text x={pinX} y={pinY - 8} textAnchor="middle" fill={isSelected ? '#fde047' : '#94a3b8'} fontSize={isSelected ? '11' : '8.5'} fontWeight={isSelected ? 'bold' : 'normal'} className="pointer-events-none drop-shadow">
                                        {venue.city}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {activeVenue && (
                    <div className="mt-3 p-3 rounded-xl border border-[#d4af37]/40 bg-[#0e1626]/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{getCountryFlagEmoji(activeVenue.countryCode)}</span>
                            <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{activeVenue.name}</span>
                                    <span className="text-slate-400 font-normal">({activeVenue.city}, {activeVenue.countryName})</span>
                                </div>
                                <div className="text-[11px] text-amber-300">{activeVenue.address} • {activeVenue.scheduleFr}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/tournaments/clubs/${activeVenue.slug}`} className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-1 font-medium text-amber-200 hover:bg-[#d4af37]/25 hover:border-[#d4af37]">📄 Fiche Club</Link>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeVenue.googleMapsQuery)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-slate-200 hover:text-white hover:border-[#d4af37]">🗺️ Itinéraire</a>
                            <Link href={`/?matchLength=7&tournament=${activeVenue.slug}`} className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 font-semibold text-amber-200 hover:border-amber-400">🎲 S'entraîner (7 pts)</Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Filtres par Catégorie */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3">
                {CATEGORY_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedCategory(tab.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${selectedCategory === tab.id ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grille des Fiches Lieux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filtered.map((venue) => {
                    const catStyle = CATEGORY_STYLES[venue.category];
                    const flag = getCountryFlagEmoji(venue.countryCode);
                    const isSelected = activeVenue?.id === venue.id;

                    return (
                        <article
                            key={venue.id}
                            id={venue.slug}
                            onClick={() => handleSelectVenue(venue.id)}
                            className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xl transition cursor-pointer ${isSelected ? 'border-[#d4af37] bg-[#0c1424] shadow-[0_0_15px_rgba(212,175,55,0.15)]' : 'border-white/10 bg-[#0b101b] hover:border-white/20'}`}
                            data-testid={`venue-card-${venue.slug}`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${catStyle.cls}`}>{catStyle.badge}</span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 font-semibold">{venue.federation}</span>
                                </div>

                                <div className="mt-3">
                                    <h4 className="font-serif text-base font-bold text-white leading-snug">{venue.name}</h4>
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                        <span className="text-base">{flag}</span>
                                        <span className="font-medium text-slate-200">{venue.city}, {venue.countryName}</span>
                                    </div>
                                </div>

                                <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs flex flex-col gap-1.5">
                                    <div className="text-slate-300"><span className="text-slate-400 font-semibold">📍 Adresse : </span>{venue.address}</div>
                                    <div className="text-amber-300"><span className="text-slate-400 font-semibold">🕒 Horaires : </span>{venue.scheduleFr}</div>
                                    <div className="text-emerald-400"><span className="text-slate-400 font-semibold">💳 Tarif : </span>{venue.entryCostLabel}</div>
                                </div>

                                <div className="mt-3">
                                    <div className="text-[11px] uppercase font-bold text-[#d4af37] mb-1.5">✨ Pourquoi jouer ici — Avantages du lieu</div>
                                    <ul className="flex flex-col gap-1 text-xs text-slate-300">
                                        {venue.playerBenefitsFr.map((benefit) => (
                                            <li key={benefit} className="flex items-start gap-1.5">
                                                <span className="text-emerald-400 shrink-0">✓</span>
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <p className="mt-3 text-xs text-slate-400 italic leading-relaxed">« {venue.atmosphereFr} »</p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Link href={`/tournaments/clubs/${venue.slug}`} className="rounded-lg border border-[#d4af37]/40 bg-[#d4af37]/15 px-2.5 py-1.5 text-xs font-semibold text-amber-200 hover:border-[#d4af37] transition">📄 Fiche Club</Link>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.googleMapsQuery)}`} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:border-[#d4af37] transition">🗺️ Maps ↗</a>
                                    <a href={venue.officialUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300 hover:text-white transition">🌐 Site</a>
                                </div>
                                <Link href={`/?matchLength=7&tournament=${venue.slug}`} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:border-amber-400 transition">🎲 S'entraîner (7 pts)</Link>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export const WorldVenuesMapDirectoryView = React.memo(WorldVenuesMapDirectoryViewComponent);
export default WorldVenuesMapDirectoryView;
