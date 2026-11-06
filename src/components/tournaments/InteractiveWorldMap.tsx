'use client';

/**
 * @file src/components/tournaments/InteractiveWorldMap.tsx
 * @description Carte du Monde Haute Horlogerie SVG (TopoJSON world-atlas 176 pays, 1000×500)
 * Zéro emoji système, anti-chevauchement des labels en Europe en vue Monde, multilingue FR/EN,
 * et cadrage mondial 100% zéro-scroll (h-[340px]).
 * Strictement <= 260 lignes, 0 any (SCALABILITY.md).
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { getTournamentsDict } from '../../lib/i18n/tournamentsDict';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { getTournamentMapCoords } from '../../lib/supabase/tournamentService';
import { WORLD_ATLAS_COUNTRY_PATHS } from './worldAtlasPaths';
import {
    type RawMarkerNode,
    computeSpiralOffsetMarkers,
} from './mapMarkerLayout';

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
    readonly onSelectPreset?: (preset: MapPresetRegionId) => void;
}

interface CameraState {
    readonly scale: number;
    readonly focusX: number;
    readonly focusY: number;
    readonly lat: number;
    readonly lng: number;
}

const PRESET_CAMERA: Readonly<Record<MapPresetRegionId, CameraState>> = {
    world: { scale: 1.05, focusX: 500, focusY: 242, lat: 0, lng: 0 },
    france: { scale: 4.8, focusX: 512, focusY: 120, lat: 46.5, lng: 3.5 },
    europe: { scale: 3.2, focusX: 535, focusY: 118, lat: 48, lng: 12 },
    americas: { scale: 2.2, focusX: 250, focusY: 175, lat: 27, lng: -90 },
    asia: { scale: 2.4, focusX: 740, focusY: 165, lat: 31, lng: 85 },
};

const GLOBAL_SPACED_HUBS: ReadonlySet<string> = new Set([
    'new york', 'tokyo', 'dubai', 'sydney',
]);

const EUROPE_DENSE_CITIES: ReadonlySet<string> = new Set([
    'londres', 'london', 'paris', 'monte-carlo', 'monaco', 'lyon', 'marseille', 'nice', 'genève', 'geneve',
]);

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
    onSelectPreset,
}) => {
    const { locale } = useTranslation();
    const dict = getTournamentsDict(locale);
    const [zoomDelta, setZoomDelta] = useState<number>(0);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    useEffect(() => { setZoomDelta(0); }, [activePreset]);

    const baseCam = PRESET_CAMERA[activePreset] ?? PRESET_CAMERA.world;
    const effectiveScale = Math.max(0.9, Math.min(6, Number((baseCam.scale + zoomDelta).toFixed(2))));
    const pinScale = useMemo(() => Math.max(0.26, Math.min(1, 1 / Math.pow(effectiveScale, 0.72))), [effectiveScale]);
    const isGlobalView = effectiveScale < 2.2;

    const txPct = useMemo(() => ((500 - baseCam.focusX) / 1000) * 100 * effectiveScale, [baseCam.focusX, effectiveScale]);
    const tyPct = useMemo(() => ((242 - baseCam.focusY) / 425) * 100 * effectiveScale, [baseCam.focusY, effectiveScale]);

    const frenchClusteredCount = useMemo(() => {
        if (!isGlobalView) return 0;
        const cCount = venues.filter((v) => v.countryCode === 'FR' && v.city.toLowerCase() !== 'paris' && v.id !== selectedVenueId).length;
        const tCount = tournaments.filter((t) => t.countryCode === 'FR' && t.city.toLowerCase() !== 'paris' && t.id !== selectedTournamentId).length;
        return cCount + tCount;
    }, [isGlobalView, venues, tournaments, selectedVenueId, selectedTournamentId]);

    const positionedMarkers = useMemo(() => {
        const raw: RawMarkerNode[] = [];
        if (showClubs) {
            for (const v of venues) {
                const isSelected = selectedVenueId === v.id;
                const isFrRegional = v.countryCode === 'FR' && v.city.toLowerCase() !== 'paris';
                if (isGlobalView && isFrRegional && !isSelected) continue;
                raw.push({ key: `club-${v.id}`, kind: 'club', id: v.id, slug: v.slug, city: v.city, lat: v.coordinates.lat, lng: v.coordinates.lng });
            }
        }
        if (showTournaments) {
            for (const t of tournaments) {
                const isSelected = selectedTournamentId === t.id;
                const isFrRegional = t.countryCode === 'FR' && t.city.toLowerCase() !== 'paris';
                if (isGlobalView && isFrRegional && !isSelected) continue;
                const coords = getTournamentMapCoords(t);
                raw.push({ key: `tournament-${t.id}`, kind: 'tournament', id: t.id, slug: t.slug, city: t.city, lat: coords.lat, lng: coords.lng });
            }
        }
        return computeSpiralOffsetMarkers(raw, pinScale);
    }, [venues, tournaments, showClubs, showTournaments, pinScale, isGlobalView, selectedVenueId, selectedTournamentId]);

    const visibleCityLabelKeys = useMemo(() => {
        const keys = new Set<string>();
        const cityAssigned = new Set<string>();
        for (const m of positionedMarkers) {
            const isSelected = m.kind === 'club' ? selectedVenueId === m.id : selectedTournamentId === m.id;
            if (isSelected || hoveredKey === m.key) {
                keys.add(m.key);
                cityAssigned.add(m.city.toLowerCase());
            }
        }
        if (!isGlobalView) {
            for (const m of positionedMarkers) {
                if (keys.has(m.key)) continue;
                const cityLower = m.city.toLowerCase();
                // Anti-chevauchement Europe (Londres/Paris/Monte-Carlo) : label affiché uniquement sur sélection ou hover
                if (EUROPE_DENSE_CITIES.has(cityLower)) continue;
                if (cityAssigned.has(cityLower)) continue;
                keys.add(m.key);
                cityAssigned.add(cityLower);
            }
        }
        return keys;
    }, [positionedMarkers, selectedVenueId, selectedTournamentId, hoveredKey, isGlobalView]);

    return (
        <div
            data-testid="interactive-world-map"
            className="min-h-[420px] h-[420px] w-full bg-[#070B12] rounded-2xl border border-[#D4AF37]/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none"
        >
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 rounded-xl border border-[#D4AF37]/35 bg-[#070B12]/90 p-1 shadow-xl backdrop-blur-md">
                <button type="button" data-testid="map-zoom-in-btn" onClick={() => setZoomDelta((d) => Math.min(3.5, Number((d + 0.6).toFixed(2))))} title={dict.zoomInTitle} aria-label={dict.zoomInTitle} className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-xs font-black text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 transition">+</button>
                <button type="button" data-testid="map-zoom-out-btn" onClick={() => setZoomDelta((d) => Math.max(-(baseCam.scale - 0.9), Number((d - 0.6).toFixed(2))))} title={dict.zoomOutTitle} aria-label={dict.zoomOutTitle} className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-mono text-xs font-black text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/15 transition">−</button>
                <button type="button" data-testid="map-zoom-reset-btn" onClick={() => { setZoomDelta(0); onResetPreset(); }} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-bold text-slate-200 hover:border-[#D4AF37] hover:text-white transition">{dict.resetView}</button>
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
                    viewBox="-20 30 1040 425"
                    className="w-full h-full select-none"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label={dict.heroTitle}
                >
                    <defs>
                        <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#151E2B" />
                            <stop offset="100%" stopColor="#0F1722" />
                        </linearGradient>
                        <pattern id="mapGraticule" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="0.4" />
                        </pattern>
                    </defs>

                    <rect x="-20" y="30" width="1040" height="425" fill="#070B12" />
                    <rect x="-20" y="30" width="1040" height="425" fill="url(#mapGraticule)" />
                    <line x1="-20" y1="250" x2="1020" y2="250" stroke="rgba(212,175,55,0.12)" strokeWidth="0.5" strokeDasharray="4 4" />

                    <g fill="url(#landGrad)" stroke="#D4AF37" strokeOpacity="0.28" strokeWidth={Math.max(0.35, 0.75 * pinScale)} strokeLinejoin="round">
                        {WORLD_ATLAS_COUNTRY_PATHS.map((country) => (
                            <path key={country.id} d={country.d} />
                        ))}
                    </g>

                    {positionedMarkers.map((marker) => {
                        const isClub = marker.kind === 'club';
                        const isSelected = isClub ? selectedVenueId === marker.id : selectedTournamentId === marker.id;
                        const isHovered = hoveredKey === marker.key;
                        const radius = (isSelected ? 6.8 : isHovered ? 5.8 : 4.6) * pinScale;
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
                                <circle cx={marker.svgX} cy={marker.svgY} r={11 * pinScale} fill={mainColor} opacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.16} />
                                <circle
                                    cx={marker.svgX}
                                    cy={marker.svgY}
                                    r={radius}
                                    fill={mainColor}
                                    stroke={isSelected ? '#ffffff' : '#070B12'}
                                    strokeWidth={(isSelected ? 1.8 : 1.2) * pinScale}
                                />
                                <circle cx={marker.svgX} cy={marker.svgY} r={1.8 * pinScale} fill="#070B12" className="pointer-events-none" />
                            </g>
                        );
                    })}

                    {isGlobalView && frenchClusteredCount > 0 && (
                        <g
                            data-testid="map-cluster-france"
                            onClick={() => (onSelectPreset ? onSelectPreset('france') : onResetPreset())}
                            className="cursor-pointer group"
                        >
                            <rect
                                x="412"
                                y="116"
                                width="54"
                                height="16"
                                rx="8"
                                fill="rgba(11,16,27,0.95)"
                                stroke="#D4AF37"
                                strokeWidth="1"
                                className="group-hover:stroke-amber-300 transition"
                            />
                            <text x="439" y="127" textAnchor="middle" fill="#FDE68A" fontSize="9" fontWeight="700">
                                {dict.clusterClubsLabel(frenchClusteredCount)}
                            </text>
                        </g>
                    )}

                    {positionedMarkers.map((marker) => {
                        if (!visibleCityLabelKeys.has(marker.key)) return null;
                        const isClub = marker.kind === 'club';
                        const isSelected = isClub ? selectedVenueId === marker.id : selectedTournamentId === marker.id;
                        const isHovered = hoveredKey === marker.key;
                        const pillWidth = Math.max(34, marker.city.length * 6.0 + 14) * pinScale;
                        const pillHeight = 14 * pinScale;
                        const isDenseEuropeGlobal = isGlobalView && marker.svgX >= 450 && marker.svgX <= 560 && marker.svgY <= 155;
                        const pillX = isDenseEuropeGlobal ? marker.svgX - pillWidth - 8 * pinScale : marker.svgX - pillWidth / 2;
                        const pillY = isDenseEuropeGlobal ? marker.svgY - 19 * pinScale : marker.svgY + marker.labelDy * pinScale - 10 * pinScale;
                        const textX = pillX + pillWidth / 2;
                        const textY = pillY + 9.8 * pinScale;

                        return (
                            <g key={`lbl-${marker.key}`} className="pointer-events-none select-none">
                                <rect
                                    x={pillX}
                                    y={pillY}
                                    width={pillWidth}
                                    height={pillHeight}
                                    rx={7 * pinScale}
                                    fill="rgba(8,11,18,0.95)"
                                    stroke={isSelected ? '#d4af37' : 'rgba(212,175,55,0.35)'}
                                    strokeWidth={Math.max(0.6, 0.9 * pinScale)}
                                />
                                <text
                                    x={textX}
                                    y={textY}
                                    textAnchor="middle"
                                    fill={isSelected ? '#fde68a' : isHovered ? '#ffffff' : '#f1f5f9'}
                                    fontSize={8.5 * pinScale}
                                    fontWeight={isSelected || isHovered ? 'bold' : '600'}
                                    data-testid={`map-city-label-${marker.slug}`}
                                >
                                    {marker.city}
                                </text>
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
