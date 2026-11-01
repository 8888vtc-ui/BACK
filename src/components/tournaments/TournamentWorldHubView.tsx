'use client';

/**
 * Vue Principale du Hub Mondial des Tournois & Clubs — Direction "Salon Privé Monte-Carlo".
 *
 * Rôle : Hub complet de découverte, recherche, filtrage par cases à cocher [☑ Tournois] / [☑ Clubs],
 * carte du monde interactive, agenda personnel, palmarès et référencement d'un club inconnu.
 *
 * Dépendances : AppNavbar, TournamentCard, TournamentAgendaView, TournamentResultsArchiveView,
 * WorldVenuesMapDirectoryView, SubmitTournamentModal, tournamentEngine, tournamentService.
 * Retrait : Supprimer ce composant et sa route associée.
 * Strictly 0 `any`, React.memo, budget <= 295 lignes (SCALABILITY.md R1 & R2).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AppNavbar from '../nav/AppNavbar';
import TournamentCard from './TournamentCard';
import TournamentAgendaView from './TournamentAgendaView';
import TournamentResultsArchiveView from './TournamentResultsArchiveView';
import WorldVenuesMapDirectoryView from './WorldVenuesMapDirectoryView';
import SubmitTournamentModal from './SubmitTournamentModal';
import type {
    TournamentRecord,
    TournamentTier,
    TournamentRegion,
    TournamentFederation,
    TournamentSortField,
    TournamentSubmissionInput,
} from '../../features/tournaments/tournamentTypes';
import {
    filterTournaments,
    sortTournaments,
    groupTournamentsByMonth,
    computeTournamentStats,
    generateTournamentIcs,
    generateMultiTournamentIcs,
} from '../../features/tournaments/tournamentEngine';
import {
    WORLD_TOURNAMENT_RESULTS_ARCHIVE,
    filterTournamentResults,
} from '../../features/tournaments/worldTournamentsResults';
import {
    WORLD_BACKGAMMON_VENUES,
    filterWorldVenues,
    type WorldBackgammonVenue,
} from '../../features/tournaments/worldBackgammonVenues';
import {
    fetchWorldTournaments,
    loadBookmarkedTournamentIds,
    toggleTournamentBookmark,
    submitNewTournament,
    triggerIcsDownload,
    getAllWorldVenues,
} from '../../lib/supabase/tournamentService';

export interface TournamentWorldHubViewProps {
    readonly initialTournaments?: ReadonlyArray<TournamentRecord>;
}

const TIER_FILTERS: ReadonlyArray<{ id: TournamentTier | 'all'; label: string; testId: string }> = [
    { id: 'all', label: 'Tous', testId: 'filter-tier-all' },
    { id: 'mega', label: '👑 MEGA (150+ j. / 50k€+)', testId: 'filter-tier-mega' },
    { id: 'grand', label: '🏆 GRAND (50-150 j.)', testId: 'filter-tier-grand' },
    { id: 'moyen', label: '🎖️ MOYEN (Clubs & Régional)', testId: 'filter-tier-moyen' },
];

const selectCls = 'rounded-xl border border-white/10 bg-[#141b2d] px-3 py-1.5 text-xs text-slate-200 focus:border-[#d4af37] focus:outline-none';

const TournamentWorldHubViewComponent: React.FC<TournamentWorldHubViewProps> = ({ initialTournaments }) => {
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
    const stats = useMemo(() => computeTournamentStats(tournaments), [tournaments]);

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
            className="h-dvh max-h-dvh w-full overflow-y-auto overflow-x-hidden overscroll-y-contain bg-[#070b13] text-slate-100 flex flex-col"
            data-testid="tournament-world-hub-view"
        >
            <AppNavbar activeTab="tournaments" />

            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-2.5 flex flex-col gap-2.5">
                {/* Compact Horizontal Hero Bar (60% reduced height for immediate map visibility) */}
                <header className="rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0e1626] via-[#0b101b] to-[#070b13] px-4 py-2.5 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 min-w-0">
                            <h1 className="font-serif text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                <span className="text-[#d4af37]">🏛️</span>
                                <span>OÙ JOUER : CARTE MONDIALE DES CLUBS &amp; TOURNOIS</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1 text-slate-300">
                                    <strong className="font-serif text-sm text-white">{stats.totalCount}</strong>
                                    <span className="text-[10px] uppercase text-slate-400">Tournois</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-300">
                                    <strong className="font-serif text-sm text-emerald-400">{allVenues.length}</strong>
                                    <span className="text-[10px] uppercase text-emerald-300/80">Clubs &amp; Salons</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-sky-300">
                                    <strong className="font-serif text-sm text-sky-300">{stats.countriesCount}</strong>
                                    <span className="text-[10px] uppercase text-sky-300/80">Pays</span>
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-amber-200">
                                    <strong className="font-serif text-sm text-yellow-300">{stats.totalPrizePoolEstimateEur.toLocaleString('fr-FR')} €</strong>
                                    <span className="text-[10px] uppercase text-amber-300/80">Dotation</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleOpenSubmitClubFromHub}
                                data-testid="open-submit-club-btn"
                                className="rounded-xl border border-emerald-400/80 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30 transition"
                            >
                                + Enregistrer mon Club
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSubmitModalOpen(true)}
                                data-testid="open-submit-tournament-btn"
                                className="rounded-xl border border-[#d4af37] bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 px-3 py-1.5 text-xs font-bold text-yellow-200 hover:brightness-110 transition"
                            >
                                + Référencer un Tournoi
                            </button>
                        </div>
                    </div>
                </header>

                {/* Filtres & Contrôles Compactés */}
                <section className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#0b101b] px-3.5 py-2.5 shadow-lg">
                    <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center justify-between">
                        <div className="relative flex-1 min-w-[220px]">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher par ville, pays, club ou tournoi..."
                                data-testid="tournament-search-input"
                                className="w-full rounded-xl border border-white/15 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none"
                            />
                            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {TIER_FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedTier(item.id)}
                                    data-testid={item.testId}
                                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${selectedTier === item.id ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value as TournamentRegion | 'all')} className={selectCls}>
                                <option value="all">Toutes Régions</option><option value="europe">Europe</option><option value="north_america">Amérique du Nord</option>
                                <option value="middle_east">Moyen-Orient</option><option value="asia_pacific">Asie-Pacifique</option><option value="latin_america">Amérique Latine</option>
                            </select>
                            <select value={selectedFederation} onChange={(e) => setSelectedFederation(e.target.value as TournamentFederation | 'all')} className={selectCls}>
                                <option value="all">Toutes Fédérations</option><option value="WBGF">WBGF</option><option value="USBGF">USBGF</option><option value="FFB">FFB</option>
                                <option value="UKBGF">UKBGF</option><option value="EUBGF">EUBGF</option><option value="WBA">WBA</option>
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as TournamentSortField)} className={selectCls}>
                                <option value="startDate">Trier : Date</option><option value="prizePool">Trier : Dotation</option>
                                <option value="entryFee">Trier : Inscription</option><option value="tier">Trier : Prestige</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => setOnlyBookmarked((prev) => !prev)}
                                data-testid="filter-my-agenda"
                                className={`rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${onlyBookmarked ? 'border-amber-400/70 bg-amber-500/20 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}
                            >
                                ⭐ Mon Agenda ({bookmarkedIds.size})
                            </button>
                            <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5">
                                <button type="button" onClick={() => setViewMode('grid')} data-testid="view-mode-grid" className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${viewMode === 'grid' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🗂️ Tournois</button>
                                <button type="button" onClick={() => setViewMode('venues')} data-testid="view-mode-venues" className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${viewMode === 'venues' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🌍 Carte &amp; Clubs</button>
                                <button type="button" onClick={() => setViewMode('agenda')} data-testid="view-mode-agenda" className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${viewMode === 'agenda' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>📅 Agenda</button>
                                <button type="button" onClick={() => setViewMode('results')} data-testid="view-mode-results" className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition ${viewMode === 'results' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🏆 Palmarès</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contenu selon viewMode */}
                {viewMode === 'grid' ? (
                    <div className="flex flex-col gap-6">
                        <WorldVenuesMapDirectoryView
                            venues={filteredVenues}
                            tournaments={sortedTournaments}
                            showClubs={showMapClubs}
                            showTournaments={showMapTournaments}
                            onToggleClubs={() => setShowMapClubs((prev) => !prev)}
                            onToggleTournaments={() => setShowMapTournaments((prev) => !prev)}
                            isSubmitClubOpen={isSubmitClubModalOpen}
                            onOpenSubmitClub={() => setIsSubmitClubModalOpen(true)}
                            onCloseSubmitClub={() => setIsSubmitClubModalOpen(false)}
                            onClubCreated={handleClubCreated}
                        />
                        {sortedTournaments.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-[#0b101b] p-12 text-center text-slate-400">
                                <p className="text-base">Aucun tournoi ne correspond à vos critères de recherche.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedTournaments.map((t) => (
                                    <TournamentCard
                                        key={t.id}
                                        tournament={t}
                                        isBookmarked={bookmarkedIds.has(t.id)}
                                        onToggleBookmark={handleToggleBookmark}
                                        onExportIcs={handleExportSingleIcs}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : viewMode === 'agenda' ? (
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
                        showClubs={showMapClubs}
                        showTournaments={showMapTournaments}
                        onToggleClubs={() => setShowMapClubs((prev) => !prev)}
                        onToggleTournaments={() => setShowMapTournaments((prev) => !prev)}
                        isSubmitClubOpen={isSubmitClubModalOpen}
                        onOpenSubmitClub={() => setIsSubmitClubModalOpen(true)}
                        onCloseSubmitClub={() => setIsSubmitClubModalOpen(false)}
                        onClubCreated={handleClubCreated}
                    />
                )}
            </main>

            <SubmitTournamentModal
                isOpen={isSubmitModalOpen}
                onClose={() => setIsSubmitModalOpen(false)}
                onSubmitTournament={handleSubmitTournament}
            />
        </div>
    );
};

export const TournamentWorldHubView = React.memo(TournamentWorldHubViewComponent);
export default TournamentWorldHubView;
