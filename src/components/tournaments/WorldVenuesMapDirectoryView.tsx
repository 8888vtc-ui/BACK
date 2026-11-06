'use client';

/**
 * @file src/components/tournaments/WorldVenuesMapDirectoryView.tsx
 * @description Vue Carte Mondiale Interactive avec Layout Côte-à-Côte (8 colonnes carte + 4 colonnes fiche détail).
 * Zéro chevauchement de boîte sur la carte, zoom fluide, boutons d'action club/tournoi dédiés.
 * Strictement <= 280 lignes, 0 any (SCALABILITY.md).
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord, TournamentRegion } from '../../features/tournaments/tournamentTypes';
import { formatTournamentDateFr } from '../../features/tournaments/tournamentEngine';
import InteractiveWorldMap, { type MapPresetRegionId } from './InteractiveWorldMap';
import VenueOrTournamentDetailPanel from './VenueOrTournamentDetailPanel';
import SubmitClubInlineModal from './SubmitClubInlineModal';
import VenueDirectoryCard from './VenueDirectoryCard';

export interface WorldVenuesMapDirectoryViewProps {
    readonly venues: ReadonlyArray<WorldBackgammonVenue>;
    readonly tournaments?: ReadonlyArray<TournamentRecord>;
    readonly searchQuery?: string;
    readonly onSearchQueryChange?: (q: string) => void;
    readonly showClubs?: boolean;
    readonly showTournaments?: boolean;
    readonly onToggleClubs?: () => void;
    readonly onToggleTournaments?: () => void;
    readonly isSubmitClubOpen?: boolean;
    readonly onOpenSubmitClub?: () => void;
    readonly onCloseSubmitClub?: () => void;
    readonly onClubCreated?: (club: WorldBackgammonVenue) => void;
    readonly onRegionPresetSelect?: (region: TournamentRegion | 'all') => void;
}

export const MAP_ZOOM_PRESETS: ReadonlyArray<{
    readonly id: MapPresetRegionId;
    readonly label: string;
    readonly regionFilter: TournamentRegion | 'all';
}> = [
    { id: 'world', label: '🌐 Monde', regionFilter: 'all' },
    { id: 'france', label: '📍 France & Riviera', regionFilter: 'europe' },
    { id: 'europe', label: '🏛️ Europe', regionFilter: 'europe' },
    { id: 'americas', label: '🧭 Amériques', regionFilter: 'north_america' },
    { id: 'asia', label: '✨ Asie & Dubaï', regionFilter: 'asia_pacific' },
];

export const WorldVenuesMapDirectoryView: React.FC<WorldVenuesMapDirectoryViewProps> = React.memo(({
    venues,
    tournaments = [],
    searchQuery = '',
    onSearchQueryChange,
    showClubs: controlledShowClubs,
    showTournaments: controlledShowTournaments,
    onToggleClubs,
    onToggleTournaments,
    isSubmitClubOpen: controlledModalOpen,
    onOpenSubmitClub,
    onCloseSubmitClub,
    onClubCreated,
    onRegionPresetSelect,
}) => {
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venues[0]?.id ?? null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [mapZoom, setMapZoom] = useState<MapPresetRegionId>('world');
    const [localShowClubs, setLocalShowClubs] = useState(true);
    const [localShowTournaments, setLocalShowTournaments] = useState(true);
    const [localModalOpen, setLocalModalOpen] = useState(false);

    const clubsChecked = controlledShowClubs ?? localShowClubs;
    const tournamentsChecked = controlledShowTournaments ?? localShowTournaments;
    const isModalOpen = controlledModalOpen ?? localModalOpen;

    const handleSelectPreset = useCallback(
        (presetId: MapPresetRegionId) => {
            setMapZoom(presetId);
            const preset = MAP_ZOOM_PRESETS.find((p) => p.id === presetId);
            if (preset && onRegionPresetSelect) {
                onRegionPresetSelect(preset.regionFilter);
            }
        },
        [onRegionPresetSelect],
    );

    const handleToggleClubs = useCallback(() => {
        if (onToggleClubs) onToggleClubs();
        else setLocalShowClubs((prev) => !prev);
    }, [onToggleClubs]);

    const handleToggleTournaments = useCallback(() => {
        if (onToggleTournaments) onToggleTournaments();
        else setLocalShowTournaments((prev) => !prev);
    }, [onToggleTournaments]);

    const closeModal = useCallback(() => {
        if (onCloseSubmitClub) onCloseSubmitClub();
        else setLocalModalOpen(false);
    }, [onCloseSubmitClub]);

    const handleSelectVenue = useCallback((id: string) => {
        setSelectedTournamentId(null);
        setSelectedVenueId(id || null);
    }, []);

    const handleSelectTournament = useCallback((id: string) => {
        if (!id) {
            setSelectedTournamentId(null);
            return;
        }
        setSelectedVenueId(null);
        setSelectedTournamentId(id);
    }, []);

    const activeVenue = useMemo(() => {
        if (selectedTournamentId) return null;
        if (!selectedVenueId) return venues[0] ?? null;
        return venues.find((v) => v.id === selectedVenueId) ?? venues[0] ?? null;
    }, [venues, selectedVenueId, selectedTournamentId]);

    const activeTournament = useMemo(() => {
        if (!selectedTournamentId) return null;
        return tournaments.find((t) => t.id === selectedTournamentId) ?? null;
    }, [tournaments, selectedTournamentId]);

    const handleClubCreated = useCallback((newClub: WorldBackgammonVenue) => {
        setSelectedVenueId(newClub.id);
        onClubCreated?.(newClub);
    }, [onClubCreated]);

    return (
        <div className="flex flex-col gap-5" data-testid="world-venues-map-directory">
            <SubmitClubInlineModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onClubCreated={handleClubCreated}
            />

            {/* Layout Côte-à-Côte : 8 colonnes Carte à gauche + 4 colonnes Fiche Détail à droite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-8 flex flex-col gap-2">
                    <div className="relative rounded-2xl border border-white/10 bg-[#070b13] p-3 shadow-2xl flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 px-1">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchQueryChange?.(e.target.value)}
                                    placeholder="Rechercher par ville, pays, club"
                                    data-testid="tournament-search-input"
                                    className="w-full rounded-xl border border-white/15 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none"
                                />
                                <span className="absolute left-2.5 top-2 text-xs text-slate-400" aria-hidden="true">🔍</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-bold transition ${clubsChecked ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                    <input type="checkbox" checked={clubsChecked} onChange={handleToggleClubs} data-testid="map-toggle-clubs" className="accent-emerald-400 rounded" />
                                    <span>✓ Clubs ({venues.length})</span>
                                </label>
                                <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-bold transition ${tournamentsChecked ? 'border-[#d4af37]/80 bg-[#d4af37]/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                                    <input type="checkbox" checked={tournamentsChecked} onChange={handleToggleTournaments} data-testid="map-toggle-tournaments" className="accent-[#d4af37] rounded" />
                                    <span>✓ Tournois ({tournaments.length})</span>
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Zoom régional de la carte">
                                {MAP_ZOOM_PRESETS.map((z) => (
                                    <button
                                        key={z.id}
                                        type="button"
                                        data-testid={`map-zoom-${z.id}`}
                                        onClick={() => handleSelectPreset(z.id)}
                                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                                            mapZoom === z.id
                                                ? 'border-[#d4af37] bg-[#d4af37]/20 text-amber-200 shadow'
                                                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {z.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <InteractiveWorldMap
                            venues={venues}
                            tournaments={tournaments}
                            showClubs={clubsChecked}
                            showTournaments={tournamentsChecked}
                            activePreset={mapZoom}
                            selectedVenueId={selectedVenueId}
                            selectedTournamentId={selectedTournamentId}
                            onSelectVenue={handleSelectVenue}
                            onSelectTournament={handleSelectTournament}
                            onResetPreset={() => handleSelectPreset('world')}
                            onSelectPreset={handleSelectPreset}
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 h-full">
                    <VenueOrTournamentDetailPanel
                        venue={activeVenue}
                        tournament={activeTournament}
                        onClose={() => { setSelectedVenueId(null); setSelectedTournamentId(null); }}
                    />
                </div>
            </div>

            {/* SECTION BAS : BANDE HORIZONTALE COMPACTE DES TOURNOIS EN BAS */}
            {tournamentsChecked && tournaments.length > 0 && (
                <section className="flex flex-col gap-1.5" data-testid="map-tournaments-section">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1 px-1">
                        <h3 className="font-serif text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                            <span>🏆</span>
                            <span>Tournois sur la Carte ({tournaments.length})</span>
                        </h3>
                        <span className="text-[11px] text-slate-400">Cliquez sur un tournoi pour le localiser ou vous entraîner</span>
                    </div>
                    <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-amber-500/30">
                        {tournaments.map((t) => {
                            const isSelected = selectedTournamentId === t.id;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => handleSelectTournament(t.id)}
                                    data-testid={`tournament-card-summary-${t.slug}`}
                                    className={`h-[76px] min-w-[240px] max-w-[280px] rounded-xl border p-2.5 transition cursor-pointer flex flex-col justify-between shrink-0 ${
                                        isSelected
                                            ? 'border-[#d4af37] bg-[#d4af37]/15 shadow-md shadow-[#d4af37]/20'
                                            : 'border-[#d4af37]/30 bg-[#0b101b] hover:border-[#d4af37]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase">
                                        <span className="truncate">{t.federation} • {t.tier}</span>
                                        <span className="text-amber-200 shrink-0 ml-1.5">{formatTournamentDateFr(t.startDate)}</span>
                                    </div>
                                    <h4 className="font-serif text-xs font-bold text-white truncate">{t.name}</h4>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span className="truncate">{t.city}, {t.countryCode}</span>
                                        <span className="text-emerald-400 font-semibold shrink-0 ml-1.5">Match en {t.matchLengthMain} pts</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* SECTION BAS : ANNUAIRE DES CLUBS */}
            {clubsChecked && venues.length > 0 && (
                <section className="flex flex-col gap-3" data-testid="map-venues-section">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h3 className="font-serif text-sm sm:text-base font-bold text-emerald-300">
                            🏛️ Clubs &amp; Salons ({venues.length})
                        </h3>
                        <span className="text-xs text-slate-400">Pourquoi jouer ici — Avantages du lieu &amp; Salons physiques</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {venues.map((v) => (
                            <VenueDirectoryCard key={v.id} venue={v} onSelectVenue={handleSelectVenue} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
});

WorldVenuesMapDirectoryView.displayName = 'WorldVenuesMapDirectoryView';
export default WorldVenuesMapDirectoryView;
