'use client';

/**
 * @file src/components/tournaments/InteractiveWorldMap.tsx
 * @description Carte du Monde Interactive SVG Haute Précision (TopoJSON world-atlas 176 pays, 1000×500)
 * Cadrage global monde (scale 1.05) avec New York, Vegas et Tokyo 100% visibles sans troncature.
 * Anti-chevauchement des labels en vue Monde, zoom fluide (France, Europe, Amériques, Asie)
 * et zéro boîte flottante masquant les continents (carte 100% dégagée).
 * Strictement <= 290 lignes, 0 any (SCALABILITY.md).
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
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
    readonly focusX: number;
    readonly focusY: number;
    readonly lat: number;
    readonly lng: number;
}

const PRESET_CAMERA: Readonly<Record<MapPresetRegionId, CameraState>> = {
    world: { scale: 1.05, focusX: 500, focusY: 250, lat: 0, lng: 0 },
    france: { scale: 4.8, focusX: 512, focusY: 120, lat: 46.5, lng: 3.5 },
    europe: { scale: 3.2, focusX: 535, focusY: 118, lat: 48, lng: 12 },
    americas: { scale: 2.2, focusX: 250, focusY: 175, lat: 27, lng: -90 },
    asia: { scale: 2.4, focusX: 740, focusY: 165, lat: 31, lng: 85 },
};

const ISOLATED_WORLD_HUBS: ReadonlySet<string> = new Set(['new york', 'tokyo']);

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
            const degDist = Math.hypot(current.lat - candidate.lat, current.lng - candidate.lng);
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
                const radius = (count === 2 ? 8.5 : 9.5 + idx * 2.2) * pinScale;
                const angle = count <= 4 ? (idx * 2 * Math.PI) / count - Math.PI / 4 : idx * 2.39996323;
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

export const InteractiveWorldMap: React.FC<InteractiveWorldMapProps> = React.memo(({
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
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    useEffect(() => {
        setZoomDelta(0);
    }, [activePreset]);

    const baseCam = PRESET_CAMERA[activePreset] ?? PRESET_CAMERA.world;
    const effectiveScale = Math.max(0.9, Math.min(6, Number((baseCam.scale + zoomDelta).toFixed(2))));
    const pinScale = useMemo(() => Math.max(0.26, Math.min(1, 1 / Math.pow(effectiveScale, 0.72))), [effectiveScale]);
    const isGlobalView = effectiveScale < 2.5;

    const txPct = useMemo(() => ((500 - baseCam.focusX) / 1000) * 100 * effectiveScale, [baseCam.focusX, effectiveScale]);
    const tyPct = useMemo(() => ((250 - baseCam.focusY) / 500) * 100 * effectiveScale, [baseCam.focusY, effectiveScale]);

    const positionedMarkers = useMemo(() => {
        const raw: RawMarkerNode[] = [];
        if (showClubs) {
            for (const v of venues) {
                raw.push({ key: `club-${v.id}`, kind: 'club', id: v.id, slug: v.slug, city: v.city, lat: v.coordinates.lat, lng: v.coordinates.lng });
            }
        }
        if (showTournaments) {
            for (const t of tournaments) {
                const coords = getTournamentMapCoords(t);
                raw.push({ key: `tournament-${t.id}`, kind: 'tournament', id: t.id, slug: t.slug, city: t.city, lat: coords.lat, lng: coords.lng });
            }
        }
        return computeSpiralOffsetMarkers(raw, pinScale);
    }, [venues, tournaments, showClubs, showTournaments, pinScale]);

    const shouldShowLabel = useCallback((marker: PositionedMarkerNode, isSelected: boolean): boolean => {
        if (isSelected || hoveredKey === marker.key) return true;
        if (isGlobalView) {
            return ISOLATED_WORLD_HUBS.has(marker.city.toLowerCase());
        }
        return true;
    }, [hoveredKey, isGlobalView]);

    return (
        <div
            data-testid="interactive-world-map"
            className="min-h-[520px] h-[520px] w-full bg-[#070B12] rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none"
        >
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
                    onClick={() => setZoomDelta((d) => Math.max(-(baseCam.scale - 0.9), Number((d - 0.6).toFixed(2))))}
                    title="Dézoomer (-)"
                    aria-label="Dézoomer la carte"
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-sm font-black text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 transition"
                >
                    −
                </button>
                <button
                    type="button"
                    data-testid="map-zoom-reset-btn"
                    onClick={() => { setZoomDelta(0); onResetPreset(); }}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-[#D4AF37] hover:text-white transition"
                >
                    Réinitialiser la vue
                </button>
            </div>

            <div
                data-testid="interactive-world-map-viewport"
                data-center-lat={baseCam.lat}
                data-center-lng={baseCam.lng}
                data-zoom={effectiveScale}
                className="w-full h-full flex items-center justify-center"
                style={{
                    transform: `translate(${txPct}%, ${tyPct}%) scale(${effectiveScale})`,
                    transformOrigin: '50% 50%',
                    transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
            >
                <svg
                    viewBox="-30 -10 1060 520"
                    className="w-full h-full select-none"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="Carte mondiale interactive des tournois et clubs"
                >
                    <defs>
                        <pattern id="mapGraticule" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
                        </pattern>
                    </defs>

                    <rect x="-30" y="-10" width="1060" height="520" fill="#070B12" />
                    <rect x="-30" y="-10" width="1060" height="520" fill="url(#mapGraticule)" />
                    <line x1="-30" y1="250" x2="1030" y2="250" stroke="rgba(212,175,55,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />

                    <g fill="#111827" stroke="#D4AF37" strokeOpacity="0.25" strokeWidth={Math.max(0.22, 0.55 * pinScale)} strokeLinejoin="round">
                        {WORLD_ATLAS_COUNTRY_PATHS.map((country) => (
                            <path key={country.id} d={country.d} />
                        ))}
                    </g>

                    {positionedMarkers.map((marker) => {
                        const isClub = marker.kind === 'club';
                        const isSelected = isClub ? selectedVenueId === marker.id : selectedTournamentId === marker.id;
                        const isHovered = hoveredKey === marker.key;
                        const showLabel = shouldShowLabel(marker, isSelected);
                        const radius = (isSelected ? 7.2 : isHovered ? 6.2 : 5.0) * pinScale;
                        const mainColor = isClub ? '#10B981' : '#D4AF37';

                        return (
                            <g
                                key={marker.key}
                                data-testid={isClub ? `map-pin-${marker.slug}` : `map-pin-tournament-${marker.slug}`}
                                onClick={() => (isClub ? onSelectVenue(marker.id) : onSelectTournament(marker.id))}
                                onMouseEnter={() => setHoveredKey(marker.key)}
                                onMouseLeave={() => setHoveredKey(null)}
                                className="cursor-pointer group"
                            >
                                <circle cx={marker.svgX} cy={marker.svgY} r={12 * pinScale} fill={mainColor} opacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.16} />
                                <circle
                                    cx={marker.svgX}
                                    cy={marker.svgY}
                                    r={radius}
                                    fill={mainColor}
                                    stroke={isSelected ? '#ffffff' : '#070B12'}
                                    strokeWidth={(isSelected ? 1.8 : 1.2) * pinScale}
                                />
                                <text
                                    x={marker.svgX}
                                    y={marker.svgY + 2.2 * pinScale}
                                    textAnchor="middle"
                                    fontSize={6.0 * pinScale}
                                    className="pointer-events-none select-none"
                                >
                                    {isClub ? '🏛️' : '🏆'}
                                </text>
                                {showLabel && (
                                    <text
                                        x={marker.svgX}
                                        y={marker.svgY + marker.labelDy * pinScale}
                                        textAnchor="middle"
                                        fill={isSelected ? '#fde68a' : isHovered ? '#ffffff' : '#e2e8f0'}
                                        fontSize={(isSelected ? 10 : 8.0) * pinScale}
                                        fontWeight={isSelected || isHovered ? 'bold' : '600'}
                                        className="pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
                                        data-testid={`map-city-label-${marker.slug}`}
                                    >
                                        {marker.city}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
});

InteractiveWorldMap.displayName = 'InteractiveWorldMap';
export default InteractiveWorldMap;
