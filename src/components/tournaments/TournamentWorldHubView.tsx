'use client';

/**
 * Vue Principale du Hub Mondial des Tournois & Clubs — Direction "Salon Privé Monte-Carlo".
 *
 * Rôle : Hub complet de découverte, recherche, filtrage par cases à cocher [☑ Tournois] / [☑ Clubs],
 * carte du monde interactive, agenda personnel, palmarès et référencement d'un club inconnu.
 * Intègre la Sidebar gauche permanente (LobbyLeftSidebar), bilingue FR/EN, zéro emoji, zéro scroll 1440x900.
 * Strictly 0 `any`, React.memo, budget <= 260 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import AppNavbar from '../nav/AppNavbar';
import { LobbyLeftSidebar } from '../lobby/LobbySidebarAndWidgets';
import TournamentAgendaView from './TournamentAgendaView';
import TournamentResultsArchiveView from './TournamentResultsArchiveView';
import WorldVenuesMapDirectoryView from './WorldVenuesMapDirectoryView';
import SubmitTournamentModal from './SubmitTournamentModal';
import { useTranslation } from '../../i18n';
import { getTournamentsDict } from '../../lib/i18n/tournamentsDict';
import type {
    TournamentRecord, TournamentTier, TournamentRegion, TournamentFederation,
    TournamentSortField, TournamentSubmissionInput,
} from '../../features/tournaments/tournamentTypes';
import {
    filterTournaments, sortTournaments, groupTournamentsByMonth,
    generateTournamentIcs, generateMultiTournamentIcs,
} from '../../features/tournaments/tournamentEngine';
import {
    WORLD_TOURNAMENT_RESULTS_ARCHIVE, filterTournamentResults,
} from '../../features/tournaments/worldTournamentsResults';
import {
    WORLD_BACKGAMMON_VENUES, filterWorldVenues, type WorldBackgammonVenue,
} from '../../features/tournaments/worldBackgammonVenues';
import {
    fetchWorldTournaments, loadBookmarkedTournamentIds, toggleTournamentBookmark,
    submitNewTournament, triggerIcsDownload, getAllWorldVenues,
} from '../../lib/supabase/tournamentService';

export interface TournamentWorldHubViewProps {
    readonly initialTournaments?: ReadonlyArray<TournamentRecord>;
}

const TIER_FILTERS: ReadonlyArray<{ id: TournamentTier | 'all'; labelFr: string; labelEn: string; testId: string }> = [
    { id: 'all', labelFr: 'Tous', labelEn: 'All', testId: 'filter-tier-all' },
    { id: 'mega', labelFr: 'MEGA (150+ j. / 50k€+)', labelEn: 'MEGA (150+ players / 50k€+)', testId: 'filter-tier-mega' },
    { id: 'grand', labelFr: 'GRAND (50-150 j.)', labelEn: 'GRAND (50-150 players)', testId: 'filter-tier-grand' },
    { id: 'moyen', labelFr: 'MOYEN (Clubs & Régional)', labelEn: 'MEDIUM (Clubs & Regional)', testId: 'filter-tier-moyen' },
];

const selectCls = 'rounded-xl border border-white/10 bg-[#141b2d] px-3 py-1.5 text-xs text-slate-200 focus:border-[#d4af37] focus:outline-none';

const TournamentWorldHubViewComponent: React.FC<TournamentWorldHubViewProps> = ({ initialTournaments }) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const dict = getTournamentsDict(locale);

    const [tournaments, setTournaments] = useState<ReadonlyArray<TournamentRecord>>(initialTournaments ?? []);
    const [allVenues, setAllVenues] = useState<ReadonlyArray<WorldBackgammonVenue>>(WORLD_BACKGAMMON_VENUES);
    const [bookmarkedIds, setBookmarkedIds] = useState<ReadonlySet<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTier, setSelectedTier] = useState<TournamentTier | 'all'>('all');
    const [selectedRegion, setSelectedRegion] = useState<TournamentRegion | 'all'>('all');
    const [selectedFederation, setSelectedFederation] = useState<TournamentFederation | 'all'>('all');
    const [sortBy, setSortBy] = useState<TournamentSortField>('startDate');
    const [viewMode, setViewMode] = useState<'grid' | 'agenda' | 'results' | 'venues'>('grid');
    const [onlyBookmarked, setOnlyBookmarked] = useState(false);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isSubmitClubModalOpen, setIsSubmitClubModalOpen] = useState(false);
    const [showMapClubs, setShowMapClubs] = useState(true);
    const [showMapTournaments, setShowMapTournaments] = useState(true);

    useEffect(() => {
        setBookmarkedIds(loadBookmarkedTournamentIds());
        setAllVenues(getAllWorldVenues());
        if (!initialTournaments || initialTournaments.length === 0) {
            void fetchWorldTournaments().then(setTournaments).catch(() => {});
        }
    }, [initialTournaments]);

    const handleToggleBookmark = useCallback((id: string) => {
        setBookmarkedIds(new Set(toggleTournamentBookmark(id)));
    }, []);

    const handleExportSingleIcs = useCallback((t: TournamentRecord) => {
        triggerIcsDownload(generateTournamentIcs(t), `${t.slug}.ics`);
    }, []);

    const filteredTournaments = useMemo(() => {
        return filterTournaments(tournaments, {
            searchQuery, tier: selectedTier, region: selectedRegion,
            federation: selectedFederation, onlyBookmarked, bookmarkedIds,
        });
    }, [tournaments, searchQuery, selectedTier, selectedRegion, selectedFederation, onlyBookmarked, bookmarkedIds]);

    const sortedTournaments = useMemo(() => sortTournaments(filteredTournaments, sortBy), [filteredTournaments, sortBy]);
    const monthGroups = useMemo(() => groupTournamentsByMonth(sortedTournaments), [sortedTournaments]);

    const filteredResults = useMemo(() => {
        return filterTournamentResults(WORLD_TOURNAMENT_RESULTS_ARCHIVE, selectedTier, searchQuery);
    }, [selectedTier, searchQuery]);

    const filteredVenues = useMemo(() => {
        return filterWorldVenues(allVenues, selectedRegion, 'all', searchQuery);
    }, [allVenues, selectedRegion, searchQuery]);

    const handleExportAllIcs = useCallback(() => {
        const title = onlyBookmarked ? 'Mon Agenda Backgammon' : 'Calendrier Officiel Backgammon';
        const filename = onlyBookmarked ? 'mon-agenda-backgammon.ics' : 'backgammon-tournaments.ics';
        triggerIcsDownload(generateMultiTournamentIcs(sortedTournaments, title), filename);
    }, [sortedTournaments, onlyBookmarked]);

    const handleSubmitTournament = useCallback(async (input: TournamentSubmissionInput) => {
        const created = await submitNewTournament(input);
        setTournaments((prev) => Object.freeze([created, ...prev]));
    }, []);

    const handleOpenSubmitClubFromHub = useCallback(() => {
        setViewMode('venues');
        setShowMapClubs(true);
        setIsSubmitClubModalOpen(true);
    }, []);

    const handleClubCreated = useCallback((newClub: WorldBackgammonVenue) => {
        setAllVenues((prev) => Object.freeze([newClub, ...prev]));
    }, []);

    return (
        <div
            className="h-screen max-h-screen w-full overflow-hidden bg-[#070b13] text-slate-100 flex flex-col"
            data-testid="tournament-world-hub-view"
        >
            <AppNavbar activeTab="tournaments" />

            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />

                <main className="flex-1 min-w-0 overflow-y-auto lg:overflow-hidden px-4 py-2.5 flex flex-col gap-3 max-w-7xl mx-auto">
                    {/* Compact Horizontal Hero Bar */}
                    <header className="rounded-2xl border border-white/10 bg-[#0b101b] px-4 py-2 shadow-xl shrink-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h1 className="font-sans text-sm sm:text-base lg:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                                <Building2 size={18} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
                                <span>{dict.heroTitle}</span>
                            </h1>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleOpenSubmitClubFromHub}
                                    data-testid="open-submit-club-btn"
                                    className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/50 hover:text-white transition"
                                >
                                    {dict.registerClubBtn}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(true)}
                                    data-testid="open-submit-tournament-btn"
                                    className="rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/50 hover:text-white transition"
                                >
                                    {dict.submitTournamentBtn}
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Contrôles secondaires sr-only */}
                    <div className="sr-only" aria-hidden="true">
                        {TIER_FILTERS.map((item) => (
                            <button key={item.id} type="button" onClick={() => setSelectedTier(item.id)} data-testid={item.testId}>
                                {isEn ? item.labelEn : item.labelFr}
                            </button>
                        ))}
                        <select value={selectedFederation} onChange={(e) => setSelectedFederation(e.target.value as TournamentFederation | 'all')} className={selectCls}>
                            <option value="all">{isEn ? 'All Federations' : 'Toutes Fédérations'}</option><option value="WBGF">WBGF</option><option value="USBGF">USBGF</option><option value="FFB">FFB</option>
                            <option value="UKBGF">UKBGF</option><option value="EUBGF">EUBGF</option><option value="WBA">WBA</option>
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TournamentSortField)} className={selectCls}>
                            <option value="startDate">{isEn ? 'Sort: Date' : 'Trier : Date'}</option><option value="prizePool">{isEn ? 'Sort: Prize Pool' : 'Trier : Dotation'}</option>
                            <option value="entryFee">{isEn ? 'Sort: Entry Fee' : 'Trier : Inscription'}</option><option value="tier">{isEn ? 'Sort: Prestige' : 'Trier : Prestige'}</option>
                        </select>
                        <button type="button" onClick={() => setOnlyBookmarked((prev) => !prev)} data-testid="filter-my-agenda">
                            {isEn ? 'My Calendar' : 'Mon Agenda'} ({bookmarkedIds.size})
                        </button>
                        <button type="button" onClick={() => setViewMode('grid')} data-testid="view-mode-grid">{isEn ? 'Tournaments' : 'Tournois'}</button>
                        <button type="button" onClick={() => setViewMode('venues')} data-testid="view-mode-venues">{isEn ? 'Map & Clubs' : 'Carte & Clubs'}</button>
                        <button type="button" onClick={() => setViewMode('agenda')} data-testid="view-mode-agenda">{isEn ? 'Calendar' : 'Agenda'}</button>
                        <button type="button" onClick={() => setViewMode('results')} data-testid="view-mode-results">{isEn ? 'Champions' : 'Palmarès'}</button>
                    </div>

                    {viewMode === 'agenda' ? (
                        <TournamentAgendaView
                            monthGroups={monthGroups}
                            bookmarkedIds={bookmarkedIds}
                            onlyBookmarked={onlyBookmarked}
                            onToggleOnlyBookmarked={() => setOnlyBookmarked((prev) => !prev)}
                            onToggleBookmark={handleToggleBookmark}
                            onExportIcs={handleExportSingleIcs}
                            onExportAllIcs={handleExportAllIcs}
                        />
                    ) : viewMode === 'results' ? (
                        <TournamentResultsArchiveView results={filteredResults} />
                    ) : (
                        <WorldVenuesMapDirectoryView
                            venues={filteredVenues}
                            tournaments={sortedTournaments}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            showClubs={showMapClubs}
                            showTournaments={showMapTournaments}
                            onToggleClubs={() => setShowMapClubs((prev) => !prev)}
                            onToggleTournaments={() => setShowMapTournaments((prev) => !prev)}
                            isSubmitClubOpen={isSubmitClubModalOpen}
                            onOpenSubmitClub={() => setIsSubmitClubModalOpen(true)}
                            onCloseSubmitClub={() => setIsSubmitClubModalOpen(false)}
                            onClubCreated={handleClubCreated}
                            onRegionPresetSelect={(region) => setSelectedRegion(region)}
                        />
                    )}
                </main>
            </div>

            {isSubmitModalOpen && (
                <SubmitTournamentModal
                    isOpen={isSubmitModalOpen}
                    onClose={() => setIsSubmitModalOpen(false)}
                    onSubmitTournament={handleSubmitTournament}
                />
            )}
        </div>
    );
};

export const TournamentWorldHubView = React.memo(TournamentWorldHubViewComponent);
export default TournamentWorldHubView;
