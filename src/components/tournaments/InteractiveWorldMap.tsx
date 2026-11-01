'use client';

/**
 * @file src/components/tournaments/InteractiveWorldMap.tsx
 * @description Carte du Monde Interactive SVG Haute Précision (TopoJSON world-atlas 176 pays, 1000×500)
 * avec fond mer #070B12, terre #111827, frontières fines #D4AF37/25, fonction spiralOffset anti-chevauchement
 * lorsque deux marqueurs sont proches (distance < 0.8°), caméra CSS/SVG fluide (`cubic-bezier(0.22, 1, 0.36, 1)`),
 * 35 pions interactifs (18 Tournois 🏆 Or #D4AF37 + 17 Clubs 🏛️ Émeraude #10B981) et Popup flottante.
 * Strictement 0 `any`, SSR-safe (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';
import { getTournamentMapCoords } from '../../lib/supabase/tournamentService';
import { WORLD_ATLAS_COUNTRY_PATHS } from './worldAtlasPaths';

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
    world: { scale: 1, focusX: 500, focusY: 230 },
    france: { scale: 4.5, focusX: 515, focusY: 122 },
    europe: { scale: 2.6, focusX: 530, focusY: 122 },
    americas: { scale: 2.0, focusX: 255, focusY: 185 },
    asia: { scale: 2.4, focusX: 735, focusY: 165 },
};

const GOLDEN_ANGLE_RAD = 2.39996323; // ~137.508°

interface RawMarkerNode {
    readonly key: string;
    readonly kind: 'club' | 'tournament';
    readonly id: string;
    readonly slug: string;
    readonly city: string;
    readonly lat: number;
    readonly lng: number;
}

interface PositionedMarkerNode extends RawMarkerNode {
    readonly svgX: number;
    readonly svgY: number;
    readonly labelDy: number;
}

/**
 * Projette exactement (lat, lng) sur le référentiel équirectangulaire 1000×500 de `world-atlas`
 * et applique un décalage radial en spirale (`spiralOffset`) dès que deux marqueurs ont `distance < 0.8°`.
 */
function computeSpiralOffsetMarkers(
    nodes: ReadonlyArray<RawMarkerNode>,
    pinScale: number,
): ReadonlyArray<PositionedMarkerNode> {
    const visited = new Set<string>();
    const clusters: Array<RawMarkerNode[]> = [];

    for (let i = 0; i < nodes.length; i++) {
        const current = nodes[i];
        if (!current || visited.has(current.key)) continue;
        const cluster: RawMarkerNode[] = [current];
        visited.add(current.key);

        for (let j = i + 1; j < nodes.length; j++) {
            const candidate = nodes[j];
            if (!candidate || visited.has(candidate.key)) continue;
            const dLat = current.lat - candidate.lat;
            const dLng = current.lng - candidate.lng;
            const degDist = Math.hypot(dLat, dLng);
            if (degDist < 0.8) {
                cluster.push(candidate);
                visited.add(candidate.key);
            }
        }
        clusters.push(cluster);
    }

    const positioned: PositionedMarkerNode[] = [];

    for (const cluster of clusters) {
        const count = cluster.length;
        cluster.forEach((node, idx) => {
            const baseSvgX = ((node.lng + 180) / 360) * 1000;
            const baseSvgY = ((90 - node.lat) / 180) * 500;

            let dx = 0;
            let dy = 0;
            if (count > 1) {
                // Répartition radiale régulière / spirale d'or autour du barycentre géographique
                const radius = (count === 2 ? 8.5 : 9.5 + idx * 2.2) * pinScale;
                const angle = count <= 4 ? (idx * 2 * Math.PI) / count - Math.PI / 4 : idx * GOLDEN_ANGLE_RAD;
                dx = Math.cos(angle) * radius;
                dy = Math.sin(angle) * radius;
            }

            positioned.push({
                ...node,
                svgX: Number((baseSvgX + dx).toFixed(2)),
                svgY: Number((baseSvgY + dy).toFixed(2)),
                labelDy: dy >= 0 ? 11.5 : -8.5,
            });
        });
    }

    return positioned;
}

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
    const pinScale = useMemo(() => Math.max(0.28, Math.min(1, 1 / Math.pow(effectiveScale, 0.75))), [effectiveScale]);

    const txPct = useMemo(() => ((500 - baseCam.focusX) / 1000) * 100 * effectiveScale, [baseCam.focusX, effectiveScale]);
    const tyPct = useMemo(() => ((250 - baseCam.focusY) / 500) * 100 * effectiveScale, [baseCam.focusY, effectiveScale]);

    const positionedMarkers = useMemo(() => {
        const raw: RawMarkerNode[] = [];
        if (showClubs) {
            for (const v of venues) {
                raw.push({
                    key: `club-${v.id}`,
                    kind: 'club',
                    id: v.id,
                    slug: v.slug,
                    city: v.city,
                    lat: v.coordinates.lat,
                    lng: v.coordinates.lng,
                });
            }
        }
        if (showTournaments) {
            for (const t of tournaments) {
                const coords = getTournamentMapCoords(t);
                raw.push({
                    key: `tournament-${t.id}`,
                    kind: 'tournament',
                    id: t.id,
                    slug: t.slug,
                    city: t.city,
                    lat: coords.lat,
                    lng: coords.lng,
                });
            }
        }
        return computeSpiralOffsetMarkers(raw, pinScale);
    }, [venues, tournaments, showClubs, showTournaments, pinScale]);

    const clubMarkers = useMemo(() => positionedMarkers.filter((m) => m.kind === 'club'), [positionedMarkers]);
    const tournamentMarkers = useMemo(() => positionedMarkers.filter((m) => m.kind === 'tournament'), [positionedMarkers]);

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
            className="min-h-[520px] h-[520px] w-full bg-[#070B12] rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none"
        >
            {/* Contrôles Caméra (+ / - / Réinitialiser la vue) en haut à droite */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/35 bg-[#070B12]/90 p-1.5 shadow-xl backdrop-blur-md">
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
            <div className="pointer-events-none absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#070B12]/85 px-3 py-1.5 text-[11px] font-semibold text-slate-200 backdrop-blur-md">
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

            {/* Canevas Vectoriel TopoJSON world-atlas 1000×500 avec transition caméra cubic-bezier(0.22, 1, 0.36, 1) */}
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
                    aria-label="Carte mondiale interactive haute précision des 18 tournois et 17 clubs de backgammon"
                >
                    <defs>
                        <pattern id="mapGraticule" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
                        </pattern>
                    </defs>

                    {/* Fond mer #070B12 + grille géographique */}
                    <rect width="1000" height="500" fill="#070B12" />
                    <rect width="1000" height="500" fill="url(#mapGraticule)" />
                    <line x1="0" y1="250" x2="1000" y2="250" stroke="rgba(212,175,55,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />

                    {/* Fond cartographique officiel TopoJSON world-atlas (176 pays) : terre #111827 et frontières fines #D4AF37/25 */}
                    <g
                        fill="#111827"
                        stroke="#D4AF37"
                        strokeOpacity="0.25"
                        strokeWidth={Math.max(0.22, 0.55 * pinScale)}
                        strokeLinejoin="round"
                    >
                        {WORLD_ATLAS_COUNTRY_PATHS.map((country) => (
                            <path key={country.id} d={country.d} />
                        ))}
                    </g>

                    {/* PIONS ÉMERAUDE (#10B981, icône 🏛️) : 17 CLUBS & SALONS */}
                    {clubMarkers.map((marker) => {
                        const isSelected = activeVenue?.id === marker.id;
                        const r = (isSelected ? 6.8 : 5.0) * pinScale;

                        return (
                            <g
                                key={marker.key}
                                data-testid={`map-pin-${marker.slug}`}
                                onClick={() => onSelectVenue(marker.id)}
                                className="cursor-pointer group"
                            >
                                <circle cx={marker.svgX} cy={marker.svgY} r={10 * pinScale} fill="#10B981" opacity={isSelected ? 0.38 : 0.16} />
                                <circle
                                    cx={marker.svgX}
                                    cy={marker.svgY}
                                    r={r}
                                    fill="#10B981"
                                    stroke="#ecfdf5"
                                    strokeWidth={(isSelected ? 1.8 : 1.1) * pinScale}
                                />
                                <text
                                    x={marker.svgX}
                                    y={marker.svgY + 2.2 * pinScale}
                                    textAnchor="middle"
                                    fontSize={6.0 * pinScale}
                                    className="pointer-events-none"
                                >
                                    🏛️
                                </text>
                                <text
                                    x={marker.svgX}
                                    y={marker.svgY + marker.labelDy * pinScale}
                                    textAnchor="middle"
                                    fill={isSelected ? '#6ee7b7' : '#e2e8f0'}
                                    fontSize={(isSelected ? 9.5 : 7.6) * pinScale}
                                    fontWeight="bold"
                                    className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                                >
                                    {marker.city}
                                </text>
                            </g>
                        );
                    })}

                    {/* PIONS OR LUMINEUX (#D4AF37, icône 🏆 avec effet pulse) : 18 TOURNOIS */}
                    {tournamentMarkers.map((marker) => {
                        const isSelected = activeTournament?.id === marker.id;
                        const r = (isSelected ? 7.4 : 5.6) * pinScale;

                        return (
                            <g
                                key={marker.key}
                                data-testid={`map-pin-tournament-${marker.slug}`}
                                onClick={() => onSelectTournament(marker.id)}
                                className="cursor-pointer group"
                            >
                                <circle cx={marker.svgX} cy={marker.svgY} r={12 * pinScale} fill="#D4AF37" opacity={isSelected ? 0.45 : 0.24}>
                                    <animate
                                        attributeName="r"
                                        values={`${7.5 * pinScale};${14.5 * pinScale};${7.5 * pinScale}`}
                                        dur="2.2s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                                <circle
                                    cx={marker.svgX}
                                    cy={marker.svgY}
                                    r={r}
                                    fill="#D4AF37"
                                    stroke="#070B12"
                                    strokeWidth={1.3 * pinScale}
                                />
                                <text
                                    x={marker.svgX}
                                    y={marker.svgY + 2.3 * pinScale}
                                    textAnchor="middle"
                                    fontSize={6.6 * pinScale}
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
                    className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-[420px] z-30 rounded-2xl border border-[#D4AF37]/60 bg-[#070B12]/95 p-4 text-xs text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-md"
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
                                    className="flex-1 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#b88924] px-3 py-2 text-center text-xs font-black text-[#070B12] shadow hover:brightness-105 transition"
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
                                    className="flex-1 rounded-xl border border-[#D4AF37] bg-gradient-to-r from-[#D4AF37] to-[#b88924] px-3 py-2 text-center text-xs font-black text-[#070B12] shadow hover:brightness-105 transition"
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
