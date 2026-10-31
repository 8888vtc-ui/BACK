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

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
                {/* Hero Banner */}
                <header className="rounded-3xl border border-[#d4af37]/30 bg-gradient-to-br from-[#0e1626] via-[#0b101b] to-[#070b13] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#d4af37]">
                                <span>🏛️</span> Circuit International Officiel & Annuaire des Clubs
                            </div>
                            <h1 className="mt-2 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                                OÙ JOUER : CARTE MONDIALE DES CLUBS & TOURNOIS
                            </h1>
                            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-300">
                                Trouvez un club près de chez vous ou un tournoi international sur la carte du monde. Votre club est inconnu ? Enregistrez-le en 30 secondes.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center shrink-0">
                            <button
                                type="button"
                                onClick={handleOpenSubmitClubFromHub}
                                data-testid="open-submit-club-btn"
                                className="rounded-2xl border border-emerald-400/80 bg-emerald-500/20 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/30 transition"
                            >
                                + Enregistrer mon Club
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSubmitModalOpen(true)}
                                data-testid="open-submit-tournament-btn"
                                className="rounded-2xl border border-[#d4af37] bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 px-4 py-3 text-xs sm:text-sm font-bold text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:brightness-110 transition"
                            >
                                + Référencer un Tournoi
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/10 pt-6">
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                            <div className="text-[11px] uppercase font-semibold text-slate-400">Total Tournois</div>
                            <div className="mt-1 font-serif text-2xl font-bold text-white">{stats.totalCount}</div>
                        </div>
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                            <div className="text-[11px] uppercase font-semibold text-slate-400">Clubs & Salons</div>
                            <div className="mt-1 font-serif text-2xl font-bold text-emerald-400">{allVenues.length}</div>
                        </div>
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                            <div className="text-[11px] uppercase font-semibold text-slate-400">Pays Représentés</div>
                            <div className="mt-1 font-serif text-2xl font-bold text-sky-300">{stats.countriesCount}</div>
                        </div>
                        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                            <div className="text-[11px] uppercase font-semibold text-slate-400">Prize Pool Cumulé</div>
                            <div className="mt-1 font-serif text-2xl font-bold text-yellow-300">{stats.totalPrizePoolEstimateEur.toLocaleString('fr-FR')} €</div>
                        </div>
                    </div>
                </header>

                {/* Filtres & Contrôles */}
                <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b101b] p-4 sm:p-5 shadow-xl">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher par ville, pays, club ou tournoi..."
                                data-testid="tournament-search-input"
                                className="w-full rounded-xl border border-white/15 bg-white/5 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none"
                            />
                            <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setOnlyBookmarked((prev) => !prev)}
                                data-testid="filter-my-agenda"
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${onlyBookmarked ? 'border-amber-400/70 bg-amber-500/20 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}
                            >
                                ⭐ Mon Agenda ({bookmarkedIds.size})
                            </button>
                            <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                                <button type="button" onClick={() => setViewMode('grid')} data-testid="view-mode-grid" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${viewMode === 'grid' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🗂️ Tournois</button>
                                <button type="button" onClick={() => setViewMode('venues')} data-testid="view-mode-venues" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${viewMode === 'venues' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🌍 Carte & Clubs</button>
                                <button type="button" onClick={() => setViewMode('agenda')} data-testid="view-mode-agenda" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${viewMode === 'agenda' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>📅 Agenda</button>
                                <button type="button" onClick={() => setViewMode('results')} data-testid="view-mode-results" className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${viewMode === 'results' ? 'bg-[#141b2d] text-[#d4af37] shadow' : 'text-slate-400'}`}>🏆 Palmarès</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {TIER_FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedTier(item.id)}
                                    data-testid={item.testId}
                                    className={`rounded-xl border px-3 py-1 text-xs font-semibold transition ${selectedTier === item.id ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
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
                        </div>
                    </div>
                </section>

                {/* Contenu selon viewMode */}
                {viewMode === 'grid' ? (
                    sortedTournaments.length === 0 ? (
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
                    )
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
