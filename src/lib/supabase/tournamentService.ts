/**
 * Service Supabase & LocalStorage pour la Base Mondiale des Tournois & Clubs.
 * Conforme GOVERNANCE.md (Règle 2 & 3 : 0 any) et SCALABILITY.md (<= 240 lignes).
 */

import { isSupabaseConfigured, getSupabaseClient } from './client';
import type { TournamentRow } from './types';
import type { TournamentRecord, TournamentSubmissionInput, TournamentRegion } from '../../features/tournaments/tournamentTypes';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import { validateTournamentSubmission } from '../../features/tournaments/tournamentEngine';
import { WORLD_BACKGAMMON_VENUES, type VenueCategory, type WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';

export const BOOKMARKS_STORAGE_KEY = 'bg_tour_bookmarked_tournaments_v1';
export const SUBMITTED_STORAGE_KEY = 'bg_tour_submitted_tournaments_v1';
export const SUBMITTED_CLUBS_STORAGE_KEY = 'bg_tour_submitted_clubs_v1';

export interface ClubSubmissionInput {
    readonly name: string;
    readonly city: string;
    readonly countryName: string;
    readonly countryCode: string;
    readonly region: TournamentRegion;
    readonly category: VenueCategory;
    readonly federation: string;
    readonly address: string;
    readonly scheduleFr: string;
    readonly entryCostLabel: string;
    readonly officialUrl: string;
    readonly atmosphereFr: string;
    readonly createFreeHostedPage?: boolean;
}

const CITY_MAP_COORDS: Readonly<Record<string, { lat: number; lng: number; mapX: number; mapY: number }>> = {
    paris: { lat: 48.85, lng: 2.35, mapX: 49.5, mapY: 27.5 },
    lyon: { lat: 45.76, lng: 4.83, mapX: 50.2, mapY: 29.8 },
    marseille: { lat: 43.29, lng: 5.36, mapX: 50.5, mapY: 31.5 },
    nice: { lat: 43.71, lng: 7.26, mapX: 51.0, mapY: 31.2 },
    'monte-carlo': { lat: 43.74, lng: 7.42, mapX: 51.2, mapY: 31.0 },
    monaco: { lat: 43.74, lng: 7.42, mapX: 51.2, mapY: 31.0 },
    bordeaux: { lat: 44.83, lng: -0.57, mapX: 48.2, mapY: 30.2 },
    londres: { lat: 51.5, lng: -0.12, mapX: 48.5, mapY: 25.0 },
    london: { lat: 51.5, lng: -0.12, mapX: 48.5, mapY: 25.0 },
    bruxelles: { lat: 50.85, lng: 4.35, mapX: 50.1, mapY: 26.0 },
    geneve: { lat: 46.2, lng: 6.14, mapX: 50.8, mapY: 29.2 },
    istanbul: { lat: 41.0, lng: 28.97, mapX: 57.5, mapY: 33.0 },
    athenes: { lat: 37.98, lng: 23.72, mapX: 55.5, mapY: 35.0 },
    dubai: { lat: 25.2, lng: 55.27, mapX: 65.0, mapY: 42.5 },
    tokyo: { lat: 35.67, lng: 139.65, mapX: 86.0, mapY: 36.5 },
    sydney: { lat: -33.86, lng: 151.21, mapX: 89.5, mapY: 74.0 },
    'new york': { lat: 40.71, lng: -74.0, mapX: 28.5, mapY: 32.5 },
    'las vegas': { lat: 36.16, lng: -115.13, mapX: 18.5, mapY: 35.0 },
    chicago: { lat: 41.87, lng: -87.62, mapX: 24.5, mapY: 31.5 },
    montreal: { lat: 45.5, lng: -73.56, mapX: 29.0, mapY: 29.0 },
};

const REGION_DEFAULT_COORDS: Readonly<Record<TournamentRegion, { lat: number; lng: number; mapX: number; mapY: number }>> = {
    europe: { lat: 47.0, lng: 6.0, mapX: 51.5, mapY: 28.5 },
    north_america: { lat: 39.0, lng: -95.0, mapX: 24.0, mapY: 33.5 },
    middle_east: { lat: 29.0, lng: 45.0, mapX: 62.0, mapY: 40.0 },
    asia_pacific: { lat: 34.0, lng: 135.0, mapX: 84.0, mapY: 39.0 },
    latin_america: { lat: -23.5, lng: -46.6, mapX: 33.5, mapY: 66.0 },
};

export function resolveCityMapCoordinates(city: string, region: TournamentRegion): { lat: number; lng: number; mapX: number; mapY: number } {
    const clean = city.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, coords] of Object.entries(CITY_MAP_COORDS)) {
        if (clean.includes(key)) return coords;
    }
    return REGION_DEFAULT_COORDS[region] ?? REGION_DEFAULT_COORDS.europe;
}

export function getTournamentMapCoords(t: Pick<TournamentRecord, 'city' | 'region'>): { mapX: number; mapY: number } {
    const c = resolveCityMapCoordinates(t.city, t.region);
    return { mapX: c.mapX, mapY: c.mapY };
}

function mapTournamentRowToRecord(row: TournamentRow): TournamentRecord {
    return Object.freeze({
        id: row.id, slug: row.slug, name: row.name, tier: row.tier, status: row.status,
        startDate: row.start_date, endDate: row.end_date, timezone: row.timezone,
        registrationDeadline: row.registration_deadline, countryCode: row.country_code,
        countryName: row.country_name, city: row.city, venueName: row.venue_name,
        region: row.region, federation: row.federation, entryFeeMain: row.entry_fee_main,
        currency: row.currency, estimatedPrizePool: row.estimated_prize_pool,
        expectedPlayersMin: row.expected_players_min, expectedPlayersMax: row.expected_players_max,
        matchLengthMain: row.match_length_main, clockRules: row.clock_rules, speedVariant: row.speed_variant,
        sideEvents: Object.freeze([...row.side_events]), officialUrl: row.official_url,
        registrationUrl: row.registration_url, organizerName: row.organizer_name,
        descriptionFr: row.description_fr, descriptionEn: row.description_en,
        isVerified: row.is_verified, isFeatured: row.is_featured,
    });
}

function loadLocalSubmittedTournaments(): ReadonlyArray<TournamentRecord> {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(SUBMITTED_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ReadonlyArray<TournamentRecord>) : [];
    } catch { return []; }
}

export function loadSubmittedClubs(): ReadonlyArray<WorldBackgammonVenue> {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(SUBMITTED_CLUBS_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ReadonlyArray<WorldBackgammonVenue>) : [];
    } catch { return []; }
}

export function getAllWorldVenues(): ReadonlyArray<WorldBackgammonVenue> {
    const custom = loadSubmittedClubs();
    return Object.freeze([...custom, ...WORLD_BACKGAMMON_VENUES]);
}

export async function submitNewClub(input: ClubSubmissionInput): Promise<WorldBackgammonVenue> {
    if (!input.name.trim() || !input.city.trim() || !input.countryName.trim()) {
        throw new Error('Veuillez renseigner le nom du club, la ville et le pays.');
    }
    const id = `venue-${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${input.city.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const coords = resolveCityMapCoordinates(input.city, input.region);

    const rawUrl = input.officialUrl.trim();
    const normalizedExternalUrl = rawUrl
        ? (/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`)
        : '';
    const freeHostedPageUrl = `/tournaments/clubs/${slug}`;
    const finalOfficialUrl = normalizedExternalUrl || freeHostedPageUrl;
    const usesFreeHostedPage = !normalizedExternalUrl || input.createFreeHostedPage === true;

    const newClub: WorldBackgammonVenue = Object.freeze({
        id,
        slug,
        name: input.name.trim(),
        city: input.city.trim(),
        countryCode: (input.countryCode.trim() || 'FR').toUpperCase().slice(0, 2),
        countryName: input.countryName.trim(),
        region: input.region,
        category: input.category,
        federation: input.federation.trim() || 'Club Affilié',
        coordinates: coords,
        address: input.address.trim() || `${input.city.trim()}, ${input.countryName.trim()}`,
        scheduleFr: input.scheduleFr.trim() || 'Rencontres hebdomadaires (voir fiche club)',
        atmosphereFr: input.atmosphereFr.trim() || 'Club convivial ouvert aux passionnés de tous niveaux.',
        playerBenefitsFr: Object.freeze([
            'Rencontres régulières sur vrais plateaux avec pendule Bronstein',
            'Ouvert aux nouveaux joueurs comme aux compétiteurs de club',
            usesFreeHostedPage
                ? '🎁 Page Club Officielle hébergée et offerte par Backgammon Tour'
                : 'Communauté active avec lien officiel / réseau social vérifié',
        ]),
        seoSummaryFr: `Club de Backgammon ${input.name.trim()} à ${input.city.trim()} (${input.countryName.trim()}).`,
        skillLevels: 'Tous niveaux',
        entryCostLabel: input.entryCostLabel.trim() || 'Entrée libre / Adhésion club',
        officialUrl: finalOfficialUrl,
        googleMapsQuery: `${input.name.trim()} ${input.address.trim()} ${input.city.trim()} ${input.countryName.trim()}`,
        isFeatured: true,
    });

    if (typeof window !== 'undefined') {
        try {
            const existing = loadSubmittedClubs();
            localStorage.setItem(SUBMITTED_CLUBS_STORAGE_KEY, JSON.stringify([newClub, ...existing]));
        } catch { /* ignore quota */ }
    }
    return newClub;
}

export async function fetchWorldTournaments(): Promise<ReadonlyArray<TournamentRecord>> {
    const localSubmitted = loadLocalSubmittedTournaments();
    if (!isSupabaseConfigured()) return Object.freeze([...WORLD_TOURNAMENTS_CATALOG, ...localSubmitted]);

    const { data, error } = await getSupabaseClient()
        .from('tournaments')
        .select('*')
        .eq('is_verified', true)
        .order('start_date', { ascending: true });

    if (error) throw new Error(`Failed to fetch tournaments: ${error.message}`);
    if (!data || data.length === 0) return Object.freeze([...WORLD_TOURNAMENTS_CATALOG, ...localSubmitted]);

    const mapped = (data as TournamentRow[]).map(mapTournamentRowToRecord);
    const seenIds = new Set(mapped.map((t) => t.id));
    const fallbackToAdd = WORLD_TOURNAMENTS_CATALOG.filter((t) => !seenIds.has(t.id));
    const localToAdd = localSubmitted.filter((t) => !seenIds.has(t.id));
    return Object.freeze([...mapped, ...fallbackToAdd, ...localToAdd]);
}

export function loadBookmarkedTournamentIds(): ReadonlySet<string> {
    if (typeof window === 'undefined') return new Set<string>();
    try {
        const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (!raw) return new Set<string>();
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? new Set<string>(parsed as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
}

export function toggleTournamentBookmark(tournamentId: string): ReadonlySet<string> {
    const current = new Set(loadBookmarkedTournamentIds());
    if (current.has(tournamentId)) current.delete(tournamentId);
    else current.add(tournamentId);
    if (typeof window !== 'undefined') {
        try { localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(current))); } catch { /* ignore */ }
    }
    return Object.freeze(current);
}

export async function submitNewTournament(input: TournamentSubmissionInput): Promise<TournamentRecord> {
    const validation = validateTournamentSubmission(input);
    if (!validation.valid) throw new Error(validation.errors.join(' '));
    const id = crypto.randomUUID();
    const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${input.startDate.slice(0, 4)}`;

    const newTournament: TournamentRecord = Object.freeze({
        id, slug, name: input.name.trim(), tier: input.tier, status: 'upcoming',
        startDate: input.startDate, endDate: input.endDate, timezone: 'Europe/Paris',
        registrationDeadline: null, countryCode: input.countryCode.toUpperCase(),
        countryName: input.countryName.trim(), city: input.city.trim(), venueName: input.venueName.trim(),
        region: input.region, federation: input.federation, entryFeeMain: input.entryFeeMain,
        currency: input.currency, estimatedPrizePool: input.estimatedPrizePool,
        expectedPlayersMin: 20, expectedPlayersMax: 60, matchLengthMain: input.matchLengthMain,
        clockRules: input.clockRules.trim(), speedVariant: 'classic', sideEvents: Object.freeze([]),
        officialUrl: input.officialUrl.trim(), registrationUrl: null, organizerName: input.organizerName.trim(),
        descriptionFr: input.descriptionFr.trim(), descriptionEn: input.descriptionFr.trim(),
        isVerified: false, isFeatured: false,
    });

    if (isSupabaseConfigured()) {
        const { error } = await getSupabaseClient().from('tournaments').insert({
            id, slug, name: newTournament.name, tier: newTournament.tier, status: newTournament.status,
            start_date: newTournament.startDate, end_date: newTournament.endDate, timezone: newTournament.timezone,
            country_code: newTournament.countryCode, country_name: newTournament.countryName,
            city: newTournament.city, venue_name: newTournament.venueName, region: newTournament.region,
            federation: newTournament.federation, entry_fee_main: newTournament.entryFeeMain,
            currency: newTournament.currency, estimated_prize_pool: newTournament.estimatedPrizePool,
            match_length_main: newTournament.matchLengthMain, clock_rules: newTournament.clockRules,
            official_url: newTournament.officialUrl, organizer_name: newTournament.organizerName,
            description_fr: newTournament.descriptionFr, description_en: newTournament.descriptionEn,
            is_verified: false, is_featured: false, side_events: [],
        });
        if (error) throw new Error(`Failed to submit tournament: ${error.message}`);
    }

    if (typeof window !== 'undefined') {
        try {
            const existing = loadLocalSubmittedTournaments();
            localStorage.setItem(SUBMITTED_STORAGE_KEY, JSON.stringify([...existing, newTournament]));
        } catch { /* ignore */ }
    }
    return newTournament;
}

export function triggerIcsDownload(icsContent: string, filename: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
