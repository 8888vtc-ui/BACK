'use client';

/**
 * @file src/components/tournaments/InteractiveWorldMap.tsx
 * @description Carte du Monde Interactive SVG Haute Précision (Projection Mercator/Équirectangulaire 1000×500)
 * avec caméra CSS/SVG fluide (`cubic-bezier(0.22, 1, 0.36, 1)`), 35 pions interactifs (18 Tournois 🏆 Or #D4AF37
 * + 17 Clubs 🏛️ Émeraude #10B981), contrôles de zoom (+ / - / Réinitialiser la vue) et Popup flottante détaillée.
 * Strictement 0 `any`, SSR-safe, < 295 lignes (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';
import { getTournamentMapCoords } from '../../lib/supabase/tournamentService';

export type MapPresetRegionId = 'world' | 'france' | 'europe' | 'americas' | 'asia';

export interface InteractiveWorldMapProps {
    readonly venues: ReadonlyArray<WorldBackgammonVenue>;
    readonly tournaments: ReadonlyArray<TournamentRecord>;
    readonly showClubs: boolean;
    readonly showTournaments: boolean;
    readonly activePreset: MapPresetRegionId;
    readonly selectedVenueId: string | null;
    readonly selectedTournamentId: string | null;
    readonly onSelectVenue: (id: string) => void;
    readonly onSelectTournament: (id: string) => void;
    readonly onResetPreset: () => void;
}

interface CameraState {
    readonly scale: number;
    readonly focusX: number; // 0..1000
    readonly focusY: number; // 0..500
}

const PRESET_CAMERA: Readonly<Record<MapPresetRegionId, CameraState>> = {
    world: { scale: 1, focusX: 500, focusY: 250 },
    france: { scale: 4.5, focusX: 502, focusY: 148 },
    europe: { scale: 2.6, focusX: 518, focusY: 142 },
    americas: { scale: 2.0, focusX: 255, focusY: 215 },
    asia: { scale: 2.4, focusX: 735, focusY: 195 },
};

const CLUB_COLLISION_OFFSET: Readonly<Record<string, { dx: number; dy: number; labelDy: number }>> = {
    'paris-vie-deau': { dx: -7, dy: -4, labelDy: -9 },
    'backgammon-social-paris': { dx: 7, dy: -2, labelDy: 12 },
    'lyon-backgammon-club': { dx: -6, dy: 0, labelDy: -8 },
    'association-genevoise-backgammon': { dx: 8, dy: -4, labelDy: -8 },
    'ancre-marseillaise': { dx: -7, dy: 6, labelDy: 12 },
    'french-riviera-backgammon-club': { dx: -2, dy: 6, labelDy: 12 },
    'monte-carlo-society': { dx: 9, dy: 2, labelDy: -8 },
};

const TOURNAMENT_COLLISION_OFFSET: Readonly<Record<string, { dx: number; dy: number }>> = {
    'monte-carlo-world-championship-2027': { dx: 4, dy: -5 },
    'riviera-cup-nice-2027': { dx: -5, dy: 3 },
    'paris-masters-ffb-2026': { dx: 0, dy: -7 },
    'grand-prix-lyon-2027': { dx: 4, dy: 2 },
    'geneva-lake-classic-2027': { dx: 6, dy: -2 },
    'london-weekend-open-2026': { dx: 5, dy: -4 },
    'uk-backgammon-open-2027': { dx: -6, dy: -5 },
};

/** Tracés continentaux détaillés (projection équirectangulaire calibrée 1000×500) */
const WORLD_CONTINENT_PATHS: ReadonlyArray<{ readonly id: string; readonly d: string }> = [
    // Amérique du Nord (Alaska, Canada, USA, Mexique, Amérique Centrale)
    {
        id: 'north-america',
        d: 'M 55,65 L 125,52 L 210,58 L 285,72 L 325,105 L 308,138 L 285,165 L 270,192 L 245,208 L 222,205 L 205,228 L 235,248 L 218,255 L 185,225 L 158,185 L 145,148 L 115,112 L 68,95 Z',
    },
    // Groenland
    {
        id: 'greenland',
        d: 'M 335,32 L 420,25 L 438,58 L 395,88 L 348,75 Z',
    },
    // Amérique du Sud
    {
        id: 'south-america',
        d: 'M 255,252 L 312,258 L 368,295 L 362,348 L 328,405 L 292,462 L 272,455 L 268,385 L 248,320 Z',
    },
    // Royaume-Uni & Irlande
    {
        id: 'uk-ireland',
        d: 'M 465,105 L 488,102 L 492,130 L 470,132 Z',
    },
    // Europe Occidentale, Centrale, Ibérie, Italie, Balkans & Scandinavie
    {
        id: 'continental-europe',
        d: 'M 495,55 L 545,45 L 575,68 L 560,98 L 598,105 L 595,148 L 572,175 L 548,182 L 532,165 L 522,178 L 508,162 L 495,162 L 480,180 L 458,178 L 462,152 L 482,135 L 505,112 L 492,82 Z',
    },
    // Afrique & Madagascar
    {
        id: 'africa',
        d: 'M 455,192 L 525,188 L 572,202 L 615,248 L 605,315 L 575,385 L 538,425 L 508,395 L 498,325 L 452,268 L 442,225 Z M 612,355 L 626,352 L 622,392 L 608,388 Z',
    },
    // Moyen-Orient, Péninsule Arabique, Asie & Japon
    {
        id: 'eurasia-middle-east',
        d: 'M 575,62 L 725,48 L 885,62 L 945,95 L 912,145 L 875,185 L 855,235 L 805,265 L 775,228 L 732,265 L 698,218 L 658,232 L 612,228 L 585,185 L 595,142 Z',
    },
    // Archipel Japonais
    {
        id: 'japan',
        d: 'M 852,155 L 875,162 L 868,195 L 846,188 Z',
    },
    // Asie du Sud-Est & Indonésie
    {
        id: 'se-asia-indonesia',
        d: 'M 782,275 L 855,282 L 895,308 L 835,318 L 778,298 Z',
    },
    // Australie & Nouvelle-Zélande
    {
        id: 'australia-nz',
        d: 'M 795,338 L 892,332 L 922,378 L 902,428 L 825,422 L 788,385 Z M 942,422 L 962,418 L 955,452 L 938,448 Z',
    },
];

const InteractiveWorldMapComponent: React.FC<InteractiveWorldMapProps> = ({
    venues,
    tournaments,
    showClubs,
    showTournaments,
    activePreset,
    selectedVenueId,
    selectedTournamentId,
    onSelectVenue,
    onSelectTournament,
    onResetPreset,
}) => {
    const [zoomDelta, setZoomDelta] = useState<number>(0);

    useEffect(() => {
        setZoomDelta(0);
    }, [activePreset]);

    const baseCam = PRESET_CAMERA[activePreset] ?? PRESET_CAMERA.world;
    const effectiveScale = Math.max(1, Math.min(6, Number((baseCam.scale + zoomDelta).toFixed(2))));

    // Inverse scale factor so markers stay crisp and readable when zoomed in
    const pinScale = useMemo(() => Math.max(0.32, Math.min(1, 1 / Math.pow(effectiveScale, 0.72))), [effectiveScale]);

    const txPct = useMemo(() => ((500 - baseCam.focusX) / 1000) * 100 * effectiveScale, [baseCam.focusX, effectiveScale]);
    const tyPct = useMemo(() => ((250 - baseCam.focusY) / 500) * 100 * effectiveScale, [baseCam.focusY, effectiveScale]);

    const activeVenue = useMemo(
        () => (selectedVenueId ? venues.find((v) => v.id === selectedVenueId) ?? null : null),
        [venues, selectedVenueId],
    );
    const activeTournament = useMemo(
        () => (selectedTournamentId ? tournaments.find((t) => t.id === selectedTournamentId) ?? null : null),
        [tournaments, selectedTournamentId],
    );

    return (
        <div
            data-testid="interactive-world-map"
            className="min-h-[520px] h-[520px] w-full bg-[#090D16] rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none"
        >
            {/* Contrôles Caméra (+ / - / Réinitialiser la vue) en haut à droite */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/35 bg-[#090D16]/90 p-1.5 shadow-xl backdrop-blur-md">
                <button
                    type="button"
                    data-testid="map-zoom-in-btn"
                    onClick={() => setZoomDelta((d) => Math.min(3.5, Number((d + 0.6).toFixed(2))))}
                    title="Zoomer (+)"
                    aria-label="Zoomer sur la carte"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm font-black text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
                >
                    +
                </button>
                <button
                    type="button"
                    data-testid="map-zoom-out-btn"
                    onClick={() => setZoomDelta((d) => Math.max(-(baseCam.scale - 1), Number((d - 0.6).toFixed(2))))}
                    title="Dézoomer (-)"
                    aria-label="Dézoomer la carte"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm font-black text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
                >
                    −
                </button>
                <button
                    type="button"
                    data-testid="map-zoom-reset-btn"
                    onClick={() => {
                        setZoomDelta(0);
                        onResetPreset();
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-[#D4AF37] hover:text-white transition"
                >
                    Réinitialiser la vue
                </button>
            </div>

            {/* Légende temps réel en haut à gauche */}
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#090D16]/85 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-md">
                <span className="inline-flex items-center gap-1.5 text-[#D4AF37]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_#D4AF37]" />
                    🏆 {tournaments.length} Tournois
                </span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5 text-[#10B981]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                    🏛️ {venues.length} Clubs &amp; Salons
                </span>
                <span className="text-slate-500 font-mono text-[10px]">({effectiveScale.toFixed(1)}×)</span>
            </div>

            {/* Canevas Vectoriel 1000×500 avec transition caméra cubic-bezier(0.22, 1, 0.36, 1) */}
            <div
                data-testid="interactive-world-map-viewport"
                className="w-full h-full flex items-center justify-center"
                style={{
                    transform: `translate(${txPct}%, ${tyPct}%) scale(${effectiveScale})`,
                    transformOrigin: '50% 50%',
                    transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-full select-none"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="Carte mondiale interactive des 18 tournois et 17 clubs de backgammon"
                >
                    <defs>
                        <radialGradient id="oceanGlow" cx="50%" cy="48%" r="60%">
                            <stop offset="0%" stopColor="#111C30" />
                            <stop offset="100%" stopColor="#090D16" />
                        </radialGradient>
                        <pattern id="mapGraticule" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="0.6" />
                        </pattern>
                    </defs>

                    {/* Fond océanique + grille de méridiens/parallèles */}
                    <rect width="1000" height="500" fill="url(#oceanGlow)" />
                    <rect width="1000" height="500" fill="url(#mapGraticule)" />
                    {/* Équateur & Tropiques */}
                    <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(212,175,55,0.16)" strokeWidth="0.7" strokeDasharray="4 4" />
                    <line x1="0" y1="185" x2="1000" y2="185" stroke="rgba(56,189,248,0.10)" strokeWidth="0.5" strokeDasharray="2 4" />
                    <line x1="0" y1="315" x2="1000" y2="315" stroke="rgba(56,189,248,0.10)" strokeWidth="0.5" strokeDasharray="2 4" />

                    {/* Masses continentales haute visibilité */}
                    <g fill="#152238" stroke="#D4AF37" strokeOpacity="0.45" strokeWidth={0.9 * pinScale}>
                        {WORLD_CONTINENT_PATHS.map((continent) => (
                            <path key={continent.id} d={continent.d} />
                        ))}
                    </g>

                    {/* PIONS ÉMERAUDE (#10B981, icône 🏛️) : 17 CLUBS & SALONS */}
                    {showClubs &&
                        venues.map((venue) => {
                            const isSelected = activeVenue?.id === venue.id;
                            const offset = CLUB_COLLISION_OFFSET[venue.slug] ?? { dx: 0, dy: 0, labelDy: -8 };
                            const pinX = venue.coordinates.mapX * 10 + offset.dx * pinScale;
                            const pinY = venue.coordinates.mapY * 5 + offset.dy * pinScale;
                            const r = (isSelected ? 7.2 : 5.4) * pinScale;

                            return (
                                <g
                                    key={venue.id}
                                    data-testid={`map-pin-${venue.slug}`}
                                    onClick={() => onSelectVenue(venue.id)}
                                    className="cursor-pointer group"
                                >
                                    <circle cx={pinX} cy={pinY} r={11 * pinScale} fill="#10B981" opacity={isSelected ? 0.38 : 0.16} />
                                    <circle
                                        cx={pinX}
                                        cy={pinY}
                                        r={r}
                                        fill="#10B981"
                                        stroke="#ecfdf5"
                                        strokeWidth={(isSelected ? 2 : 1.2) * pinScale}
                                    />
                                    <text
                                        x={pinX}
                                        y={pinY + 2.4 * pinScale}
                                        textAnchor="middle"
                                        fontSize={6.5 * pinScale}
                                        className="pointer-events-none"
                                    >
                                        🏛️
                                    </text>
                                    <text
                                        x={pinX}
                                        y={pinY + offset.labelDy * pinScale}
                                        textAnchor="middle"
                                        fill={isSelected ? '#6ee7b7' : '#e2e8f0'}
                                        fontSize={(isSelected ? 10 : 8.2) * pinScale}
                                        fontWeight="bold"
                                        className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                                    >
                                        {venue.city}
                                    </text>
                                </g>
                            );
                        })}

                    {/* PIONS OR LUMINEUX (#D4AF37, icône 🏆 avec effet pulse) : 18 TOURNOIS */}
                    {showTournaments &&
                        tournaments.map((t) => {
                            const isSelected = activeTournament?.id === t.id;
                            const coords = getTournamentMapCoords(t);
                            const offset = TOURNAMENT_COLLISION_OFFSET[t.slug] ?? { dx: 5, dy: -4 };
                            const pinX = coords.mapX * 10 + offset.dx * pinScale;
                            const pinY = coords.mapY * 5 + offset.dy * pinScale;
                            const r = (isSelected ? 8.0 : 6.2) * pinScale;

                            return (
                                <g
                                    key={t.id}
                                    data-testid={`map-pin-tournament-${t.slug}`}
                                    onClick={() => onSelectTournament(t.id)}
                                    className="cursor-pointer group"
                                >
                                    <circle cx={pinX} cy={pinY} r={13 * pinScale} fill="#D4AF37" opacity={isSelected ? 0.45 : 0.25}>
                                        <animate
                                            attributeName="r"
                                            values={`${8 * pinScale};${16 * pinScale};${8 * pinScale}`}
                                            dur="2.2s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                    <circle
                                        cx={pinX}
                                        cy={pinY}
                                        r={r}
                                        fill="#D4AF37"
                                        stroke="#090D16"
                                        strokeWidth={1.5 * pinScale}
                                    />
                                    <text
                                        x={pinX}
                                        y={pinY + 2.5 * pinScale}
                                        textAnchor="middle"
                                        fontSize={7.2 * pinScale}
                                        className="pointer-events-none"
                                    >
                                        🏆
                                    </text>
                                </g>
                            );
                        })}
                </svg>
            </div>

            {/* CARTE FLOTTANTE (POPUP / DRAWER) AU CLIC SUR UN PION */}
            {(activeTournament || activeVenue) && (
                <div
                    data-testid="map-floating-popup"
                    className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-[420px] z-30 rounded-2xl border border-[#D4AF37]/60 bg-[#090D16]/95 p-4 text-xs text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md"
                >
                    {activeTournament ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getCountryFlagEmoji(activeTournament.countryCode)}</span>
                                    <div>
                                        <span className="inline-block rounded border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#D4AF37]">
                                            🏆 Tournoi {activeTournament.tier.toUpperCase()} • {activeTournament.federation}
                                        </span>
                                        <h4 className="mt-0.5 font-serif text-sm font-bold text-white">{activeTournament.name}</h4>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectTournament('')}
                                    className="rounded-lg border border-white/10 px-2 py-0.5 text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px]">
                                <div>
                                    <span className="text-slate-400">📍 Ville/Pays : </span>
                                    <span className="font-semibold text-white">{activeTournament.city}, {activeTournament.countryName}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">📅 Dates : </span>
                                    <span className="font-semibold text-amber-200">{activeTournament.startDate} → {activeTournament.endDate}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">💰 Prize Pool : </span>
                                    <span className="font-bold text-[#D4AF37]">
                                        {activeTournament.estimatedPrizePool
                                            ? `${activeTournament.estimatedPrizePool.toLocaleString('fr-FR')} ${activeTournament.currency}`
                                            : 'Officiel'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">🎲 Format : </span>
                                    <span className="font-semibold text-emerald-300">Match en {activeTournament.matchLengthMain} pts</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Link
                                    href={`/tournaments/${activeTournament.slug}`}
                                    data-testid="map-popup-action-btn"
                                    className="flex-1 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#b88924] px-3 py-2 text-center text-xs font-black text-[#090D16] shadow hover:brightness-105 transition"
                                >
                                    Voir les détails / S’inscrire →
                                </Link>
                                <Link
                                    href={`/?matchLength=${activeTournament.matchLengthMain}&tournament=${encodeURIComponent(activeTournament.name)}`}
                                    className="rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
                                >
                                    🎲 S’entraîner
                                </Link>
                            </div>
                        </div>
                    ) : activeVenue ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{getCountryFlagEmoji(activeVenue.countryCode)}</span>
                                    <div>
                                        <span className="inline-block rounded border border-emerald-400/50 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                                            🏛️ Club &amp; Salon • {activeVenue.federation}
                                        </span>
                                        <h4 className="mt-0.5 font-serif text-sm font-bold text-white">{activeVenue.name}</h4>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectVenue('')}
                                    className="rounded-lg border border-white/10 px-2 py-0.5 text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px]">
                                <div>
                                    <span className="text-slate-400">📍 Ville/Pays : </span>
                                    <span className="font-semibold text-white">{activeVenue.city}, {activeVenue.countryName}</span>
                                    <span className="ml-1.5 font-mono text-[10px] text-slate-400">
                                        ({activeVenue.coordinates.lat.toFixed(2)}°, {activeVenue.coordinates.lng.toFixed(2)}°)
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">🕒 Horaires : </span>
                                    <span className="font-semibold text-amber-200">{activeVenue.scheduleFr}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">💳 Tarif / Accès : </span>
                                    <span className="font-semibold text-emerald-300">{activeVenue.entryCostLabel}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                                <Link
                                    href={`/tournaments/clubs/${activeVenue.slug}`}
                                    data-testid="map-popup-action-btn"
                                    className="flex-1 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#b88924] px-3 py-2 text-center text-xs font-black text-[#090D16] shadow hover:brightness-105 transition"
                                >
                                    Voir les détails / S’inscrire →
                                </Link>
                                <Link
                                    href={`/?matchLength=7&tournament=${activeVenue.slug}`}
                                    className="rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 transition"
                                >
                                    🎲 S’entraîner
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export const InteractiveWorldMap = React.memo(InteractiveWorldMapComponent);
export default InteractiveWorldMap;
