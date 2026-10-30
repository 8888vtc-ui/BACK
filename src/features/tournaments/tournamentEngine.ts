/**
 * Moteur pur de filtrage, tri, statistiques et export de calendrier pour Backgammon Tour.
 *
 * Règles :
 * - Purement fonctionnel et déterministe (GOVERNANCE.md Règle 1)
 * - Strictement 0 `any` (GOVERNANCE.md Règle 3)
 * - Budget <= 350 lignes (SCALABILITY.md R1)
 */

import type {
    TournamentRecord,
    TournamentFilterCriteria,
    TournamentSortField,
    TournamentMonthGroup,
    TournamentGlobalStats,
    TournamentSubmissionInput,
    TournamentCurrency,
    TournamentTier,
} from './tournamentTypes';

export const TOURNAMENT_FX_RATES_TO_EUR: Readonly<Record<TournamentCurrency, number>> = Object.freeze({
    EUR: 1.0,
    USD: 0.92,
    GBP: 1.17,
    CHF: 1.05,
    JPY: 0.0061,
});

const TIER_ORDER: Readonly<Record<TournamentTier, number>> = Object.freeze({ mega: 0, grand: 1, moyen: 2 });
const VALID_TIERS: ReadonlySet<string> = new Set(['mega', 'grand', 'moyen']);
const VALID_REGIONS: ReadonlySet<string> = new Set(['europe', 'north_america', 'middle_east', 'asia_pacific', 'latin_america']);
const VALID_FEDERATIONS: ReadonlySet<string> = new Set(['WBGF', 'USBGF', 'FFB', 'UKBGF', 'EUBGF', 'WBA', 'Independent']);
const VALID_CURRENCIES: ReadonlySet<string> = new Set(['EUR', 'USD', 'GBP', 'CHF', 'JPY']);
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Convertit un code pays ISO 3166-1 alpha-2 en emoji drapeau Unicode. */
export function getCountryFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌐';
    const c1 = countryCode.toUpperCase().charCodeAt(0);
    const c2 = countryCode.toUpperCase().charCodeAt(1);
    if (c1 < 65 || c1 > 90 || c2 < 65 || c2 > 90) return '🌐';
    return String.fromCodePoint(0x1f1e6 + c1 - 65, 0x1f1e6 + c2 - 65);
}

/** Filtre les tournois selon les critères multidimensionnels fournis. */
export function filterTournaments(
    tournaments: ReadonlyArray<TournamentRecord>,
    criteria: TournamentFilterCriteria
): ReadonlyArray<TournamentRecord> {
    const query = criteria.searchQuery?.trim().toLowerCase();
    return Object.freeze(
        tournaments.filter((t) => {
            if (criteria.tier && criteria.tier !== 'all' && t.tier !== criteria.tier) return false;
            if (criteria.region && criteria.region !== 'all' && t.region !== criteria.region) return false;
            if (criteria.federation && criteria.federation !== 'all' && t.federation !== criteria.federation) return false;
            if (criteria.countryCode && criteria.countryCode !== 'all' && t.countryCode.toUpperCase() !== criteria.countryCode.toUpperCase()) return false;
            if (criteria.monthKey && criteria.monthKey !== 'all' && !t.startDate.startsWith(criteria.monthKey)) return false;
            if (criteria.maxEntryFee !== undefined && criteria.maxEntryFee !== null && t.entryFeeMain > criteria.maxEntryFee) return false;
            if (criteria.onlyBookmarked && (!criteria.bookmarkedIds || !criteria.bookmarkedIds.has(t.id))) return false;
            if (query && query.length > 0) {
                const text = `${t.name} ${t.city} ${t.countryName} ${t.venueName} ${t.organizerName}`.toLowerCase();
                if (!text.includes(query)) return false;
            }
            return true;
        })
    );
}

/** Trie les tournois selon le critère demandé (ordre déterministe). */
export function sortTournaments(
    tournaments: ReadonlyArray<TournamentRecord>,
    sortBy: TournamentSortField
): ReadonlyArray<TournamentRecord> {
    return Object.freeze(
        [...tournaments].sort((a, b) => {
            if (sortBy === 'startDate') {
                const cmp = a.startDate.localeCompare(b.startDate);
                return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
            }
            if (sortBy === 'prizePool') {
                const diff = (b.estimatedPrizePool ?? 0) - (a.estimatedPrizePool ?? 0);
                return diff !== 0 ? diff : a.startDate.localeCompare(b.startDate);
            }
            if (sortBy === 'entryFee') {
                const diff = a.entryFeeMain - b.entryFeeMain;
                return diff !== 0 ? diff : a.startDate.localeCompare(b.startDate);
            }
            if (sortBy === 'tier') {
                const diff = (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99);
                return diff !== 0 ? diff : a.startDate.localeCompare(b.startDate);
            }
            return 0;
        })
    );
}

/** Regroupe chronologiquement les tournois par mois (YYYY-MM). */
export function groupTournamentsByMonth(
    tournaments: ReadonlyArray<TournamentRecord>
): ReadonlyArray<TournamentMonthGroup> {
    const sorted = sortTournaments(tournaments, 'startDate');
    const map = new Map<string, TournamentRecord[]>();
    for (const t of sorted) {
        const monthKey = t.startDate.slice(0, 7);
        const list = map.get(monthKey);
        if (list) list.push(t);
        else map.set(monthKey, [t]);
    }
    const groups: TournamentMonthGroup[] = [];
    for (const [monthKey, groupTournaments] of map.entries()) {
        groups.push({
            monthKey,
            year: parseInt(monthKey.slice(0, 4), 10),
            monthIndex: parseInt(monthKey.slice(5, 7), 10),
            tournaments: Object.freeze(groupTournaments),
        });
    }
    return Object.freeze(groups.sort((a, b) => a.monthKey.localeCompare(b.monthKey)));
}

/** Calcule les statistiques globales du catalogue avec conversion EUR. */
export function computeTournamentStats(
    tournaments: ReadonlyArray<TournamentRecord>
): TournamentGlobalStats {
    let megaCount = 0;
    let grandCount = 0;
    let moyenCount = 0;
    let totalPrizePoolEur = 0;
    const countries = new Set<string>();

    for (const t of tournaments) {
        if (t.tier === 'mega') megaCount++;
        else if (t.tier === 'grand') grandCount++;
        else if (t.tier === 'moyen') moyenCount++;
        countries.add(t.countryCode.toUpperCase());
        if (t.estimatedPrizePool !== null && t.estimatedPrizePool > 0) {
            totalPrizePoolEur += t.estimatedPrizePool * (TOURNAMENT_FX_RATES_TO_EUR[t.currency] ?? 1.0);
        }
    }

    return Object.freeze({
        totalCount: tournaments.length,
        megaCount,
        grandCount,
        moyenCount,
        countriesCount: countries.size,
        totalPrizePoolEstimateEur: Math.round(totalPrizePoolEur),
    });
}

function toIcsDate(isoDate: string): string {
    return isoDate.replace(/-/g, '');
}

function addOneDayIcs(isoDate: string): string {
    const parts = isoDate.split('-').map((v) => parseInt(v, 10));
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + 1);
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

function escapeIcsText(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function formatVEvent(t: TournamentRecord): string {
    const location = `${t.venueName}, ${t.city}, ${t.countryName}`;
    const dtstart = toIcsDate(t.startDate);
    const dtend = addOneDayIcs(t.endDate);
    return [
        'BEGIN:VEVENT',
        `UID:${t.id}@backgammon-tour`,
        `DTSTAMP:${dtstart}T000000Z`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `DTEND;VALUE=DATE:${dtend}`,
        `SUMMARY:${escapeIcsText(t.name)}`,
        `LOCATION:${escapeIcsText(location)}`,
        `DESCRIPTION:${escapeIcsText(t.descriptionFr)}`,
        `URL:${t.officialUrl}`,
        'END:VEVENT',
    ].join('\r\n');
}

/** Génère un fichier iCalendar RFC 5545 pour un tournoi unique. */
export function generateTournamentIcs(tournament: TournamentRecord): string {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Backgammon Tour//World Tournaments//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        formatVEvent(tournament),
        'END:VCALENDAR',
    ].join('\r\n');
}

/** Génère un fichier iCalendar RFC 5545 contenant une collection de tournois. */
export function generateMultiTournamentIcs(
    tournaments: ReadonlyArray<TournamentRecord>,
    calendarName = 'Backgammon Tournaments'
): string {
    const events = tournaments.map(formatVEvent);
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Backgammon Tour//World Tournaments//FR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    ];
    if (events.length > 0) lines.push(...events);
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

/** Construit une URL d'ajout direct à Google Calendar. */
export function buildGoogleCalendarUrl(tournament: TournamentRecord): string {
    const dtstart = toIcsDate(tournament.startDate);
    const dtend = addOneDayIcs(tournament.endDate);
    const location = `${tournament.venueName}, ${tournament.city}, ${tournament.countryName}`;
    const details = `${tournament.descriptionFr}\n${tournament.officialUrl}`;
    const query = [
        'action=TEMPLATE',
        `text=${encodeURIComponent(tournament.name)}`,
        `dates=${dtstart}/${dtend}`,
        `details=${encodeURIComponent(details)}`,
        `location=${encodeURIComponent(location)}`,
    ].join('&');
    return `https://calendar.google.com/calendar/render?${query}`;
}

/** Valide une soumission de tournoi proposée par un utilisateur ou organisateur. */
export function validateTournamentSubmission(input: TournamentSubmissionInput): {
    readonly valid: boolean;
    readonly errors: ReadonlyArray<string>;
} {
    const errors: string[] = [];
    if (!input.name || input.name.trim().length < 3) errors.push('Le nom du tournoi doit comporter au moins 3 caractères.');
    if (!VALID_TIERS.has(input.tier)) errors.push('Le palier (tier) doit être "mega", "grand" ou "moyen".');
    const startOk = DATE_FORMAT_REGEX.test(input.startDate) && !isNaN(Date.parse(input.startDate));
    if (!startOk) errors.push('La date de début est invalide (format attendu : YYYY-MM-DD).');
    const endOk = DATE_FORMAT_REGEX.test(input.endDate) && !isNaN(Date.parse(input.endDate));
    if (!endOk) errors.push('La date de fin est invalide (format attendu : YYYY-MM-DD).');
    if (startOk && endOk && input.startDate > input.endDate) errors.push('La date de fin doit être postérieure ou égale à la date de début.');
    if (!input.countryCode || !/^[A-Za-z]{2}$/.test(input.countryCode)) errors.push('Le code pays doit comporter 2 lettres (norme ISO 3166-1 alpha-2).');
    if (!input.countryName || input.countryName.trim().length < 2) errors.push('Le nom du pays est requis.');
    if (!input.city || input.city.trim().length < 2) errors.push('La ville est requise.');
    if (!input.venueName || input.venueName.trim().length < 2) errors.push('Le nom du lieu (venue) est requis.');
    if (!VALID_REGIONS.has(input.region)) errors.push('La région géographique est invalide.');
    if (!VALID_FEDERATIONS.has(input.federation)) errors.push('La fédération est invalide.');
    if (typeof input.entryFeeMain !== 'number' || isNaN(input.entryFeeMain) || input.entryFeeMain < 0) {
        errors.push("Les frais d'inscription doivent être un nombre positif ou nul.");
    }
    if (!VALID_CURRENCIES.has(input.currency)) errors.push('La devise est invalide.');
    if (input.estimatedPrizePool !== null && (typeof input.estimatedPrizePool !== 'number' || isNaN(input.estimatedPrizePool) || input.estimatedPrizePool < 0)) {
        errors.push('Le prize pool estimé doit être un nombre positif ou nul, ou null.');
    }
    if (typeof input.matchLengthMain !== 'number' || !Number.isInteger(input.matchLengthMain) || input.matchLengthMain < 1) {
        errors.push('La longueur de match doit être un entier positif.');
    }
    if (!input.clockRules || input.clockRules.trim().length < 2) errors.push('Les règles de pendule sont requises.');
    if (!input.officialUrl || (!input.officialUrl.startsWith('http://') && !input.officialUrl.startsWith('https://'))) {
        errors.push("L'URL officielle doit être une URL valide débutant par http:// ou https://.");
    }
    if (!input.organizerName || input.organizerName.trim().length < 2) errors.push("Le nom de l'organisateur est requis.");
    if (!input.descriptionFr || input.descriptionFr.trim().length < 10) errors.push('La description en français doit comporter au moins 10 caractères.');

    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
