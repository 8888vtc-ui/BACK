/**
 * Service Supabase & LocalStorage pour la Base Mondiale des Tournois.
 *
 * Règles :
 * - GOVERNANCE.md Règle 2 / 4.3 : Lorsque Supabase est configuré, tout échec réseau/DB
 *   lève une erreur explicite sans jamais replier silencieusement sur les données locales.
 * - Strictement 0 `any` (GOVERNANCE.md Règle 3).
 * - Persistance hybride : Supabase si configuré + cache/local agenda personnel.
 * - Budget <= 220 lignes (SCALABILITY.md R1).
 */

import { isSupabaseConfigured, getSupabaseClient } from './client';
import type { TournamentRow } from './types';
import type { TournamentRecord, TournamentSubmissionInput } from '../../features/tournaments/tournamentTypes';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import { validateTournamentSubmission } from '../../features/tournaments/tournamentEngine';

export const BOOKMARKS_STORAGE_KEY = 'bg_tour_bookmarked_tournaments_v1';
export const SUBMITTED_STORAGE_KEY = 'bg_tour_submitted_tournaments_v1';

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
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as ReadonlyArray<TournamentRecord>) : [];
    } catch {
        return [];
    }
}

/** Récupère le calendrier mondial des tournois vérifiés. */
export async function fetchWorldTournaments(): Promise<ReadonlyArray<TournamentRecord>> {
    const localSubmitted = loadLocalSubmittedTournaments();
    if (!isSupabaseConfigured()) {
        return Object.freeze([...WORLD_TOURNAMENTS_CATALOG, ...localSubmitted]);
    }

    const { data, error } = await getSupabaseClient()
        .from('tournaments')
        .select('*')
        .eq('is_verified', true)
        .order('start_date', { ascending: true });

    if (error) throw new Error(`Failed to fetch tournaments: ${error.message}`);
    if (!data || data.length === 0) {
        return Object.freeze([...WORLD_TOURNAMENTS_CATALOG, ...localSubmitted]);
    }

    const mapped = (data as TournamentRow[]).map(mapTournamentRowToRecord);
    const seenIds = new Set(mapped.map((t) => t.id));
    const fallbackToAdd = WORLD_TOURNAMENTS_CATALOG.filter((t) => !seenIds.has(t.id));
    const localToAdd = localSubmitted.filter((t) => !seenIds.has(t.id));
    return Object.freeze([...mapped, ...fallbackToAdd, ...localToAdd]);
}

/** Charge les identifiants des tournois mis en favoris par le joueur. */
export function loadBookmarkedTournamentIds(): ReadonlySet<string> {
    if (typeof window === 'undefined') return new Set<string>();
    try {
        const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
        if (!raw) return new Set<string>();
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
    } catch {
        return new Set<string>();
    }
}

/** Bascule l'état de favori d'un tournoi et persiste dans localStorage. */
export function toggleTournamentBookmark(tournamentId: string): ReadonlySet<string> {
    const current = new Set(loadBookmarkedTournamentIds());
    if (current.has(tournamentId)) current.delete(tournamentId);
    else current.add(tournamentId);
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(current)));
        } catch {
            // Ignorer si stockage inaccessible
        }
    }
    return Object.freeze(current);
}

/** Soumet un nouveau tournoi (insère dans Supabase et/ou sauvegarde localement). */
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
        } catch {
            // Ignorer si stockage local restreint
        }
    }

    return newTournament;
}

/** Déclenche le téléchargement d'un fichier .ics dans le navigateur. */
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
