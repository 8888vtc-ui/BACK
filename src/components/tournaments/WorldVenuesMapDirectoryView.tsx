'use client';

/**
 * @file src/components/tournaments/WorldVenuesMapDirectoryView.tsx
 * @description Vue Carte Mondiale Interactive Côte-à-Côte (8 colonnes carte + 4 colonnes fiche détail)
 * avec grille paginée de 4 tournois en bas (zéro carte coupée à droite), bilingue FR/EN, zéro emoji et zéro scroll.
 * Strictement <= 280 lignes, 0 any (SCALABILITY.md).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Search, Globe, MapPin, Building2, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getTournamentsDict } from '../../lib/i18n/tournamentsDict';
import type { WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord, TournamentRegion } from '../../features/tournaments/tournamentTypes';
import { formatTournamentDateFr } from '../../features/tournaments/tournamentEngine';
import InteractiveWorldMap, { type MapPresetRegionId } from './InteractiveWorldMap';
import VenueOrTournamentDetailPanel from './VenueOrTournamentDetailPanel';
import SubmitClubInlineModal from './SubmitClubInlineModal';

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

const PRESET_REGION_MAP: Readonly<Record<MapPresetRegionId, TournamentRegion | 'all'>> = {
    world: 'all',
    france: 'europe',
    europe: 'europe',
    americas: 'north_america',
    asia: 'asia_pacific',
};

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
    onCloseSubmitClub,
    onClubCreated,
    onRegionPresetSelect,
}) => {
    const { locale } = useTranslation();
    const dict = getTournamentsDict(locale);

    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venues[0]?.id ?? null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [mapZoom, setMapZoom] = useState<MapPresetRegionId>('world');
    const [localShowClubs, setLocalShowClubs] = useState(true);
    const [localShowTournaments, setLocalShowTournaments] = useState(true);
    const [localModalOpen, setLocalModalOpen] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);

    const clubsChecked = controlledShowClubs ?? localShowClubs;
    const tournamentsChecked = controlledShowTournaments ?? localShowTournaments;
    const isModalOpen = controlledModalOpen ?? localModalOpen;

    const presets = useMemo(() => [
        { id: 'world' as const, label: dict.presetWorld, Icon: Globe },
        { id: 'france' as const, label: dict.presetFrance, Icon: MapPin },
        { id: 'europe' as const, label: dict.presetEurope, Icon: Building2 },
        { id: 'americas' as const, label: dict.presetAmericas, Icon: Globe },
        { id: 'asia' as const, label: dict.presetAsia, Icon: MapPin },
    ], [dict]);

    const handleSelectPreset = useCallback((presetId: MapPresetRegionId) => {
        setMapZoom(presetId);
        setPageIndex(0);
        onRegionPresetSelect?.(PRESET_REGION_MAP[presetId]);
    }, [onRegionPresetSelect]);

    const handleToggleClubs = useCallback(() => {
        if (onToggleClubs) onToggleClubs(); else setLocalShowClubs((prev) => !prev);
    }, [onToggleClubs]);

    const handleToggleTournaments = useCallback(() => {
        if (onToggleTournaments) onToggleTournaments(); else setLocalShowTournaments((prev) => !prev);
    }, [onToggleTournaments]);

    const closeModal = useCallback(() => {
        if (onCloseSubmitClub) onCloseSubmitClub(); else setLocalModalOpen(false);
    }, [onCloseSubmitClub]);

    const handleSelectVenue = useCallback((id: string) => { setSelectedTournamentId(null); setSelectedVenueId(id || null); }, []);
    const handleSelectTournament = useCallback((id: string) => {
        if (!id) { setSelectedTournamentId(null); return; }
        setSelectedVenueId(null); setSelectedTournamentId(id);
    }, []);

    const activeVenue = useMemo(() => {
        if (selectedTournamentId) return null;
        return (selectedVenueId ? venues.find((v) => v.id === selectedVenueId) : venues[0]) ?? venues[0] ?? null;
    }, [venues, selectedVenueId, selectedTournamentId]);

    const activeTournament = useMemo(() => (selectedTournamentId ? tournaments.find((t) => t.id === selectedTournamentId) ?? null : null), [tournaments, selectedTournamentId]);
    const handleClubCreated = useCallback((newClub: WorldBackgammonVenue) => { setSelectedVenueId(newClub.id); onClubCreated?.(newClub); }, [onClubCreated]);

    const pageSize = 4;
    const totalPages = Math.max(1, Math.ceil(tournaments.length / pageSize));
    const safePage = Math.min(pageIndex, totalPages - 1);
    const visibleTournaments = useMemo(
        () => tournaments.slice(safePage * pageSize, safePage * pageSize + pageSize),
        [tournaments, safePage],
    );

    return (
        <div className="flex flex-col gap-3" data-testid="world-venues-map-directory">
            {isModalOpen && (
                <SubmitClubInlineModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onClubCreated={handleClubCreated}
                />
            )}

            {/* Layout Côte-à-Côte : 8 colonnes Carte à gauche + 4 colonnes Fiche Détail à droite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                <div className="lg:col-span-8 flex flex-col">
                    <div className="relative rounded-2xl border border-white/10 bg-[#070b13] p-3 shadow-2xl flex flex-col gap-2.5 h-full justify-between">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => onSearchQueryChange?.(e.target.value)}
                                    placeholder={dict.searchPlaceholder}
                                    data-testid="tournament-search-input"
                                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none"
                                />
                                <Search size={14} strokeWidth={1.5} className="absolute left-2.5 top-2 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                                <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-semibold transition ${clubsChecked ? 'border-white/25 bg-white/[0.06] text-zinc-100' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>
                                    <input type="checkbox" checked={clubsChecked} onChange={handleToggleClubs} data-testid="map-toggle-clubs" className="accent-emerald-400 rounded" />
                                    <Building2 size={13} strokeWidth={1.5} className="text-emerald-400" />
                                    <span>{dict.clubsToggle(venues.length)}</span>
                                </label>
                                <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-semibold transition ${tournamentsChecked ? 'border-white/25 bg-white/[0.06] text-zinc-100' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>
                                    <input type="checkbox" checked={tournamentsChecked} onChange={handleToggleTournaments} data-testid="map-toggle-tournaments" className="accent-[#d4af37] rounded" />
                                    <Trophy size={13} strokeWidth={1.5} className="text-[#D4AF37]" />
                                    <span>{dict.tournamentsToggle(tournaments.length)}</span>
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Region zoom">
                                {presets.map((z) => {
                                    const active = mapZoom === z.id;
                                    return (
                                        <button
                                            key={z.id}
                                            type="button"
                                            data-testid={`map-zoom-${z.id}`}
                                            onClick={() => handleSelectPreset(z.id)}
                                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                                                active
                                                    ? 'border-[#D4AF37]/60 bg-white/10 text-[#D4AF37] shadow-sm'
                                                    : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white'
                                            }`}
                                        >
                                            <z.Icon size={12} strokeWidth={1.5} className="text-[#D4AF37]" />
                                            <span>{z.label}</span>
                                        </button>
                                    );
                                })}
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

            {/* SECTION BAS : GRILLE PROPRE 4 CARTES PAR LIGNE (ZÉRO TEXTE COUPÉ À DROITE) */}
            {tournamentsChecked && tournaments.length > 0 && (
                <section className="flex flex-col gap-1.5" data-testid="map-tournaments-section">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1 px-1">
                        <h3 className="font-sans text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                            <Trophy size={14} strokeWidth={1.5} className="text-[#D4AF37]" />
                            <span>{dict.bottomTournamentsTitle(tournaments.length)}</span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline text-[11px] text-slate-400">{dict.bottomTournamentsHint}</span>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label={dict.prevPageAria}
                                        data-testid="tournaments-page-prev"
                                        onClick={() => setPageIndex((p) => (p - 1 + totalPages) % totalPages)}
                                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-zinc-200 hover:border-[#D4AF37] hover:text-white transition"
                                    >
                                        <ChevronLeft size={13} strokeWidth={1.5} />
                                    </button>
                                    <span className="font-mono text-[11px] text-zinc-400 px-1">
                                        {safePage + 1}/{totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={dict.nextPageAria}
                                        data-testid="tournaments-page-next"
                                        onClick={() => setPageIndex((p) => (p + 1) % totalPages)}
                                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-zinc-200 hover:border-[#D4AF37] hover:text-white transition"
                                    >
                                        <ChevronRight size={13} strokeWidth={1.5} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {visibleTournaments.map((t) => {
                            const isSelected = selectedTournamentId === t.id;
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => handleSelectTournament(t.id)}
                                    data-testid={`tournament-card-summary-${t.slug}`}
                                    className={`h-[70px] rounded-xl border p-2.5 transition cursor-pointer flex flex-col justify-between min-w-0 ${
                                        isSelected
                                            ? 'border-[#d4af37] bg-white/[0.08] shadow-md'
                                            : 'border-white/10 bg-[#0b101b] hover:border-[#d4af37]/60'
                                    }`}
                                >
                                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase gap-1">
                                        <span className="truncate">{t.federation} • {t.tier}</span>
                                        <span className="text-amber-200 shrink-0">{formatTournamentDateFr(t.startDate)}</span>
                                    </div>
                                    <h4 className="font-sans text-xs font-bold tracking-tight text-white truncate">{t.name}</h4>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1">
                                        <span className="truncate">{t.city}, {t.countryCode}</span>
                                        <span className="text-emerald-400 font-semibold shrink-0">{dict.mainMatchPts(t.matchLengthMain)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
});

WorldVenuesMapDirectoryView.displayName = 'WorldVenuesMapDirectoryView';
export default WorldVenuesMapDirectoryView;
