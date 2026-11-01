'use client';

/**
 * Vue Carte Mondiale Interactive "Où Jouer : Clubs & Tournois" — Direction "Salon Privé Monte-Carlo".
 *
 * Rôle : Carte du monde vectorielle SVG (1000x500) avec Zoom 1-Clic (Monde, Europe, France & Riviera,
 * Amériques, Asie & Dubaï), anti-chevauchement des repères, cases à cocher [☑ Tournois] / [☑ Clubs]
 * et formulaire d'enregistrement d'un club avec « 🎁 Page Club Officielle Offerte ».
 *
 * Strictement 0 `any`, React.memo (SCALABILITY.md R1 & R2).
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { WorldBackgammonVenue, VenueCategory } from '../../features/tournaments/worldBackgammonVenues';
import type { TournamentRecord, TournamentRegion } from '../../features/tournaments/tournamentTypes';
import { getCountryFlagEmoji } from '../../features/tournaments/tournamentEngine';
import { submitNewClub, type ClubSubmissionInput } from '../../lib/supabase/tournamentService';
import InteractiveWorldMap, { type MapPresetRegionId } from './InteractiveWorldMap';

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

const MAP_ZOOM_PRESETS: ReadonlyArray<{
    readonly id: MapPresetRegionId;
    readonly label: string;
    readonly regionFilter: TournamentRegion | 'all';
}> = [
    { id: 'world', label: '🌍 Monde', regionFilter: 'all' },
    { id: 'france', label: '🇫🇷 France & Riviera', regionFilter: 'europe' },
    { id: 'europe', label: '🇪🇺 Europe', regionFilter: 'europe' },
    { id: 'americas', label: '🇺🇸 Amériques', regionFilter: 'north_america' },
    { id: 'asia', label: '🌏 Asie & Dubaï', regionFilter: 'asia_pacific' },
];

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

const inputCls = 'w-full rounded-xl border border-white/15 bg-[#070b13] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-[#d4af37] focus:outline-none';

const WorldVenuesMapDirectoryViewComponent: React.FC<WorldVenuesMapDirectoryViewProps> = ({
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
    const [selectedCategory, setSelectedCategory] = useState<VenueCategory | 'all'>('all');
    const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venues[0]?.id ?? null);
    const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
    const [mapZoom, setMapZoom] = useState<MapPresetRegionId>('world');
    const [localShowClubs, setLocalShowClubs] = useState(true);
    const [localShowTournaments, setLocalShowTournaments] = useState(true);
    const [localModalOpen, setLocalModalOpen] = useState(false);

    const [clubName, setClubName] = useState('');
    const [clubCity, setClubCity] = useState('');
    const [clubCountry, setClubCountry] = useState('France');
    const [clubCountryCode, setClubCountryCode] = useState('FR');
    const [clubRegion, setClubRegion] = useState<TournamentRegion>('europe');
    const [clubCategory, setClubCategory] = useState<VenueCategory>('federation_club');
    const [clubFederation, setClubFederation] = useState('FFB / Club Local');
    const [clubAddress, setClubAddress] = useState('');
    const [clubSchedule, setClubSchedule] = useState('Jeudi 19h30 - 23h30');
    const [clubCost, setClubCost] = useState('Entrée libre / Consommation');
    const [clubUrl, setClubUrl] = useState('');
    const [createFreePage, setCreateFreePage] = useState(true);
    const [clubAtmosphere, setClubAtmosphere] = useState('Ambiance conviviale, chouettes et tournoi hebdomadaire sur pendule.');
    const [submitError, setSubmitError] = useState<string | null>(null);

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

    const openModal = useCallback(() => {
        if (onOpenSubmitClub) onOpenSubmitClub();
        else setLocalModalOpen(true);
    }, [onOpenSubmitClub]);

    const closeModal = useCallback(() => {
        if (onCloseSubmitClub) onCloseSubmitClub();
        else setLocalModalOpen(false);
        setSubmitError(null);
    }, [onCloseSubmitClub]);

    const filtered = useMemo(() => {
        return venues.filter((v) => {
            if (selectedCategory !== 'all' && v.category !== selectedCategory) return false;
            if (mapZoom === 'france' && v.countryCode !== 'FR' && v.countryCode !== 'MC') return false;
            if (mapZoom === 'europe' && v.region !== 'europe') return false;
            if (mapZoom === 'americas' && v.region !== 'north_america' && v.region !== 'latin_america') return false;
            if (mapZoom === 'asia' && v.region !== 'middle_east' && v.region !== 'asia_pacific') return false;
            return true;
        });
    }, [venues, selectedCategory, mapZoom]);

    const activeVenue = useMemo(() => {
        if (selectedTournamentId) return null;
        if (!selectedVenueId) return null;
        return venues.find((v) => v.id === selectedVenueId) ?? null;
    }, [venues, selectedVenueId, selectedTournamentId]);

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

    const handleCreateClub = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        try {
            const input: ClubSubmissionInput = {
                name: clubName, city: clubCity, countryName: clubCountry, countryCode: clubCountryCode,
                region: clubRegion, category: clubCategory, federation: clubFederation,
                address: clubAddress, scheduleFr: clubSchedule, entryCostLabel: clubCost,
                officialUrl: clubUrl, atmosphereFr: clubAtmosphere,
                createFreeHostedPage: createFreePage,
            };
            const created = await submitNewClub(input);
            onClubCreated?.(created);
            setSelectedTournamentId(null);
            setSelectedVenueId(created.id);
            setClubName('');
            setClubCity('');
            setClubAddress('');
            setClubUrl('');
            closeModal();
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement.');
        }
    }, [clubName, clubCity, clubCountry, clubCountryCode, clubRegion, clubCategory, clubFederation, clubAddress, clubSchedule, clubCost, clubUrl, clubAtmosphere, createFreePage, onClubCreated, closeModal]);

    return (
        <div className="flex flex-col gap-4" data-testid="world-venues-map-directory">
            {isModalOpen && (
                <form onSubmit={(e) => void handleCreateClub(e)} data-testid="submit-club-modal" className="rounded-2xl border border-emerald-400/50 bg-[#0b1320] p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                        <div>
                            <h4 className="font-serif text-base font-bold text-white">🏛️ Référencer un Club ou Salon de Backgammon</h4>
                            <p className="text-xs text-slate-400">Ajout immédiat sur la carte du monde et dans l’annuaire des joueurs.</p>
                        </div>
                        <button type="button" onClick={closeModal} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 hover:text-white">✕ Fermer</button>
                    </div>
                    {submitError && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{submitError}</div>}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input type="text" required placeholder="Nom du Club (ex: Club Backgammon Lyon) *" value={clubName} onChange={(e) => setClubName(e.target.value)} data-testid="club-input-name" className={inputCls} />
                        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                            <input type="text" required placeholder="Ville (ex: Lyon, Antibes) *" value={clubCity} onChange={(e) => setClubCity(e.target.value)} data-testid="club-input-city" className={inputCls} />
                            <div className="flex gap-1.5">
                                <input type="text" required placeholder="Pays *" value={clubCountry} onChange={(e) => setClubCountry(e.target.value)} data-testid="club-input-country" className={inputCls} />
                                <input type="text" maxLength={2} placeholder="FR" value={clubCountryCode} onChange={(e) => setClubCountryCode(e.target.value.toUpperCase())} className="w-12 rounded-xl border border-white/15 bg-[#070b13] px-1.5 py-2 text-center text-xs text-white uppercase" />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <select value={clubRegion} onChange={(e) => setClubRegion(e.target.value as TournamentRegion)} className={inputCls}>
                            <option value="europe">Europe</option><option value="north_america">Amérique du Nord</option>
                            <option value="middle_east">Moyen-Orient</option><option value="asia_pacific">Asie-Pacifique</option><option value="latin_america">Amérique Latine</option>
                        </select>
                        <select value={clubCategory} onChange={(e) => setClubCategory(e.target.value as VenueCategory)} className={inputCls}>
                            <option value="federation_club">🏆 Club Fédéral / Asso</option><option value="social_lounge">🍸 Lounge &amp; Soirée</option>
                            <option value="traditional_cafe">☕ Café Traditionnel</option><option value="prestige_palace">🏛️ Cercle &amp; Palace</option>
                        </select>
                        <input type="text" placeholder="Fédération (FFB, WBGF, Libre)" value={clubFederation} onChange={(e) => setClubFederation(e.target.value)} className={`${inputCls} col-span-2 sm:col-span-1`} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input type="text" placeholder="Adresse ou Lieu de RDV (ex: Brasserie Le Central)" value={clubAddress} onChange={(e) => setClubAddress(e.target.value)} data-testid="club-input-address" className={inputCls} />
                        <input type="text" placeholder="Horaires (ex: Tous les jeudis dès 19h30)" value={clubSchedule} onChange={(e) => setClubSchedule(e.target.value)} data-testid="club-input-schedule" className={inputCls} />
                        <input type="text" placeholder="Site web, page Facebook, Instagram, WhatsApp (optionnel)" value={clubUrl} onChange={(e) => setClubUrl(e.target.value)} data-testid="club-input-url" className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                        <input type="text" placeholder="Tarif / Adhésion (ex: Entrée libre)" value={clubCost} onChange={(e) => setClubCost(e.target.value)} className={inputCls} />
                        <input type="text" placeholder="Ambiance & niveaux acceptés" value={clubAtmosphere} onChange={(e) => setClubAtmosphere(e.target.value)} className={inputCls} />
                    </div>
                    <label data-testid="club-free-page-offer" className="flex items-start gap-2.5 rounded-xl border border-[#d4af37]/70 bg-gradient-to-r from-[#d4af37]/20 via-amber-500/10 to-[#d4af37]/20 p-3 shadow-[0_0_18px_rgba(212,175,55,0.2)] cursor-pointer select-none">
                        <input type="checkbox" checked={createFreePage} onChange={(e) => setCreateFreePage(e.target.checked)} data-testid="club-free-page-checkbox" className="mt-0.5 accent-[#d4af37] rounded" />
                        <div className="text-xs">
                            <span className="font-bold text-amber-200">🎁 Page Club Officielle Offerte : </span>
                            <span className="text-slate-200">Pas de site internet ? Nous créons et hébergeons gratuitement une page dédiée pour votre club sur Backgammon Tour (adresse Google Maps, horaires, présentation et lien d'entraînement partageable).</span>
                        </div>
                    </label>
                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={closeModal} className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">Annuler</button>
                        <button type="submit" data-testid="submit-club-confirm-btn" className="rounded-xl border border-emerald-400 bg-emerald-500/25 px-5 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/35">✓ Publier mon Club sur la Carte</button>
                    </div>
                </form>
            )}

            <div className="relative rounded-2xl border border-white/10 bg-[#070b13] p-3 shadow-2xl overflow-hidden">
                {/* BARRE UNIQUE FUSIONNÉE (1 SEULE LIGNE COMPACTE : Recherche + 2 Bascules + 5 Pilules de Zoom) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 mb-3 px-1">
                    {/* a) Champ de recherche */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchQueryChange?.(e.target.value)}
                            placeholder="Rechercher par ville, pays, club"
                            data-testid="tournament-search-input"
                            className="w-full rounded-xl border border-white/15 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none"
                        />
                        <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                    </div>

                    {/* b) Les deux bascules actives avec compteur intégré */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-bold transition ${clubsChecked ? 'border-emerald-400/70 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                            <input type="checkbox" checked={clubsChecked} onChange={handleToggleClubs} data-testid="map-toggle-clubs" className="accent-emerald-400 rounded" />
                            <span>✓ Clubs &amp; Salons ({venues.length})</span>
                        </label>
                        <label className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 cursor-pointer select-none font-bold transition ${tournamentsChecked ? 'border-[#d4af37]/80 bg-[#d4af37]/15 text-amber-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                            <input type="checkbox" checked={tournamentsChecked} onChange={handleToggleTournaments} data-testid="map-toggle-tournaments" className="accent-[#d4af37] rounded" />
                            <span>✓ Tournois ({tournaments.length})</span>
                        </label>
                    </div>

                    {/* c) Pilules de zoom rapide */}
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

                {/* COMPOSANT VISUEL <InteractiveWorldMap /> (520px, 35 pions interactifs, zoom & popup flottante) */}
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
                />
            </div>

            {tournamentsChecked && tournaments.length > 0 && (
                <section className="flex flex-col gap-3" data-testid="map-tournaments-section">
                    <div className="flex items-center justify-between">
                        <h4 className="font-serif text-sm sm:text-base font-bold text-amber-300">🏆 Tournois sur la Carte ({tournaments.length})</h4>
                        <span className="text-xs text-slate-400">Cliquez sur un tournoi pour le localiser ou vous entraîner</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {tournaments.slice(0, 6).map((t) => (
                            <div key={t.id} onClick={() => handleSelectTournament(t.id)} className="rounded-xl border border-[#d4af37]/30 bg-[#0b101b] p-3.5 hover:border-[#d4af37] transition cursor-pointer flex flex-col justify-between gap-2">
                                <div>
                                    <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold uppercase">
                                        <span>{t.federation} • {t.tier}</span>
                                        <span>{t.startDate}</span>
                                    </div>
                                    <div className="mt-1 font-serif text-sm font-bold text-white">{t.name}</div>
                                    <div className="text-xs text-slate-400">{getCountryFlagEmoji(t.countryCode)} {t.city}, {t.countryName}</div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                    <Link href={`/tournaments/${t.slug}`} className="text-amber-300 font-semibold hover:underline">Fiche Tournoi →</Link>
                                    <span className="text-emerald-400 font-semibold">{t.matchLengthMain} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {clubsChecked && (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
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
                        <button type="button" onClick={openModal} className="text-xs font-bold text-emerald-300 hover:underline">
                            + Mon club n'est pas dans la liste ? L'enregistrer
                        </button>
                    </div>

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
                                            <a href={venue.officialUrl} target={venue.officialUrl.startsWith('/') ? undefined : '_blank'} rel={venue.officialUrl.startsWith('/') ? undefined : 'noopener noreferrer'} className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-300 hover:text-white transition">
                                                {venue.officialUrl.startsWith('/') ? '🎁 Page Offerte' : '🌐 Site / Réseau'}
                                            </a>
                                        </div>
                                        <Link href={`/?matchLength=7&tournament=${venue.slug}`} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:border-amber-400 transition">🎲 S'entraîner (7 pts)</Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export const WorldVenuesMapDirectoryView = React.memo(WorldVenuesMapDirectoryViewComponent);
export default WorldVenuesMapDirectoryView;
