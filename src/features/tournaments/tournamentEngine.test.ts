import { describe, it, expect } from 'vitest';
import { WORLD_TOURNAMENTS_CATALOG } from './worldTournamentsCatalog';
import {
    filterTournaments,
    sortTournaments,
    groupTournamentsByMonth,
    computeTournamentStats,
    generateTournamentIcs,
    generateMultiTournamentIcs,
    buildGoogleCalendarUrl,
    validateTournamentSubmission,
    getCountryFlagEmoji,
    TOURNAMENT_FX_RATES_TO_EUR,
} from './tournamentEngine';
import type { TournamentRecord, TournamentSubmissionInput } from './tournamentTypes';

describe('WORLD_TOURNAMENTS_CATALOG Integrity', () => {
    it('contains exactly 18 verified tournaments across the 3 tiers', () => {
        expect(WORLD_TOURNAMENTS_CATALOG).toHaveLength(18);

        const mega = WORLD_TOURNAMENTS_CATALOG.filter((t) => t.tier === 'mega');
        const grand = WORLD_TOURNAMENTS_CATALOG.filter((t) => t.tier === 'grand');
        const moyen = WORLD_TOURNAMENTS_CATALOG.filter((t) => t.tier === 'moyen');

        expect(mega).toHaveLength(6);
        expect(grand).toHaveLength(6);
        expect(moyen).toHaveLength(6);
    });

    it('has unique IDs and slugs for every tournament', () => {
        const ids = new Set(WORLD_TOURNAMENTS_CATALOG.map((t) => t.id));
        const slugs = new Set(WORLD_TOURNAMENTS_CATALOG.map((t) => t.slug));
        expect(ids.size).toBe(18);
        expect(slugs.size).toBe(18);
    });

    it('has valid dates scheduled between 2026-11 and 2027-10', () => {
        for (const t of WORLD_TOURNAMENTS_CATALOG) {
            expect(t.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(t.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(t.startDate <= t.endDate).toBe(true);

            expect(t.startDate >= '2026-11-01').toBe(true);
            expect(t.endDate <= '2027-10-31').toBe(true);
        }
    });

    it('has valid official URLs starting with https:// or http://', () => {
        for (const t of WORLD_TOURNAMENTS_CATALOG) {
            expect(t.officialUrl.startsWith('http://') || t.officialUrl.startsWith('https://')).toBe(true);
            if (t.registrationUrl) {
                expect(t.registrationUrl.startsWith('http://') || t.registrationUrl.startsWith('https://')).toBe(true);
            }
        }
    });

    it('contains the mandatory flagship tournaments with expected properties', () => {
        const monteCarlo = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'wbgf-monte-carlo-2027');
        expect(monteCarlo).toBeDefined();
        expect(monteCarlo?.countryCode).toBe('MC');
        expect(monteCarlo?.region).toBe('europe');
        expect(monteCarlo?.federation).toBe('WBGF');
        expect(monteCarlo?.matchLengthMain).toBe(17);
        expect(monteCarlo?.clockRules).toBe('Fischer 12s/move + 2min/pt');
        expect(monteCarlo?.entryFeeMain).toBe(1000);
        expect(monteCarlo?.estimatedPrizePool).toBe(180000);
        expect(monteCarlo?.currency).toBe('EUR');

        const merit = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'wba-merit-open-2026');
        expect(merit?.countryCode).toBe('CY');
        expect(merit?.federation).toBe('WBA');
        expect(merit?.matchLengthMain).toBe(15);
        expect(merit?.entryFeeMain).toBe(850);
        expect(merit?.estimatedPrizePool).toBe(150000);

        const lasVegas = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'usbgf-las-vegas-open-2026');
        expect(lasVegas?.city).toBe('Las Vegas');
        expect(lasVegas?.currency).toBe('USD');
        expect(lasVegas?.entryFeeMain).toBe(600);
        expect(lasVegas?.estimatedPrizePool).toBe(120000);

        const parisMasters = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'ffb-paris-masters-2026');
        expect(parisMasters?.tier).toBe('grand');
        expect(parisMasters?.countryCode).toBe('FR');
        expect(parisMasters?.federation).toBe('FFB');
        expect(parisMasters?.entryFeeMain).toBe(250);
        expect(parisMasters?.estimatedPrizePool).toBe(28000);

        const riviera = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'ffb-riviera-cup-nice-2027');
        expect(riviera?.tier).toBe('moyen');
        expect(riviera?.matchLengthMain).toBe(11);
        expect(riviera?.entryFeeMain).toBe(90);
    });
});

describe('getCountryFlagEmoji', () => {
    it('converts 2-letter country codes to correct regional flags', () => {
        expect(getCountryFlagEmoji('FR')).toBe('🇫🇷');
        expect(getCountryFlagEmoji('mc')).toBe('🇲🇨');
        expect(getCountryFlagEmoji('US')).toBe('🇺🇸');
        expect(getCountryFlagEmoji('GB')).toBe('🇬🇧');
        expect(getCountryFlagEmoji('CY')).toBe('🇨🇾');
        expect(getCountryFlagEmoji('JP')).toBe('🇯🇵');
    });

    it('returns a globe emoji for invalid or empty codes', () => {
        expect(getCountryFlagEmoji('')).toBe('🌐');
        expect(getCountryFlagEmoji('FRA')).toBe('🌐');
        expect(getCountryFlagEmoji('12')).toBe('🌐');
    });
});

describe('filterTournaments', () => {
    it('filters by tier', () => {
        const megaOnly = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { tier: 'mega' });
        expect(megaOnly).toHaveLength(6);
        expect(megaOnly.every((t) => t.tier === 'mega')).toBe(true);

        const all = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { tier: 'all' });
        expect(all).toHaveLength(18);
    });

    it('filters by region', () => {
        const northAmerica = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { region: 'north_america' });
        expect(northAmerica).toHaveLength(3); // Las Vegas, Texas, Chicago
        expect(northAmerica.every((t) => t.region === 'north_america')).toBe(true);
    });

    it('filters by federation', () => {
        const ffb = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { federation: 'FFB' });
        expect(ffb).toHaveLength(3); // Paris, Riviera Cup Nice, Grand Prix Lyon
        expect(ffb.every((t) => t.federation === 'FFB')).toBe(true);
    });

    it('filters by countryCode', () => {
        const france = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { countryCode: 'FR' });
        expect(france).toHaveLength(3);
        const us = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { countryCode: 'us' });
        expect(us).toHaveLength(3);
    });

    it('filters by monthKey', () => {
        const nov2026 = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { monthKey: '2026-11' });
        expect(nov2026).toHaveLength(3); // Merit, Las Vegas, London Weekend
        expect(nov2026.every((t) => t.startDate.startsWith('2026-11'))).toBe(true);
    });

    it('filters by maxEntryFee', () => {
        const cheap = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { maxEntryFee: 100 });
        expect(cheap.length).toBeGreaterThan(0);
        expect(cheap.every((t) => t.entryFeeMain <= 100)).toBe(true);
    });

    it('filters by searchQuery case-insensitively across fields', () => {
        const searchMonte = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { searchQuery: 'monaco' });
        expect(searchMonte).toHaveLength(1);
        expect(searchMonte[0].id).toBe('wbgf-monte-carlo-2027');

        const searchNice = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { searchQuery: 'nice' });
        expect(searchNice).toHaveLength(1);
        expect(searchNice[0].city).toBe('Nice');

        const searchHotel = filterTournaments(WORLD_TOURNAMENTS_CATALOG, { searchQuery: 'hotel' });
        expect(searchHotel.length).toBeGreaterThan(1);
    });

    it('filters by onlyBookmarked with bookmarkedIds set', () => {
        const bookmarkedIds = new Set(['wbgf-monte-carlo-2027', 'ffb-paris-masters-2026']);
        const bookmarked = filterTournaments(WORLD_TOURNAMENTS_CATALOG, {
            onlyBookmarked: true,
            bookmarkedIds,
        });
        expect(bookmarked).toHaveLength(2);
        expect(bookmarked.map((t) => t.id).sort()).toEqual(['ffb-paris-masters-2026', 'wbgf-monte-carlo-2027']);

        const emptyBookmarks = filterTournaments(WORLD_TOURNAMENTS_CATALOG, {
            onlyBookmarked: true,
            bookmarkedIds: new Set(),
        });
        expect(emptyBookmarks).toHaveLength(0);
    });
});

describe('sortTournaments', () => {
    it('sorts by startDate ascending', () => {
        const sorted = sortTournaments(WORLD_TOURNAMENTS_CATALOG, 'startDate');
        expect(sorted[0].startDate).toBe('2026-11-03'); // Merit Open
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].startDate >= sorted[i - 1].startDate).toBe(true);
        }
    });

    it('sorts by prizePool descending', () => {
        const sorted = sortTournaments(WORLD_TOURNAMENTS_CATALOG, 'prizePool');
        // Tokyo JPY is 4,500,000 raw, Monte Carlo is 180,000 EUR
        expect(sorted[0].estimatedPrizePool).toBe(4500000);
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1].estimatedPrizePool ?? 0;
            const curr = sorted[i].estimatedPrizePool ?? 0;
            expect(prev >= curr).toBe(true);
        }
    });

    it('sorts by entryFee ascending', () => {
        const sorted = sortTournaments(WORLD_TOURNAMENTS_CATALOG, 'entryFee');
        // London Weekend is 75 GBP, Lyon is 80 EUR
        expect(sorted[0].entryFeeMain).toBe(75);
        for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].entryFeeMain >= sorted[i - 1].entryFeeMain).toBe(true);
        }
    });

    it('sorts by tier (mega first, then grand, then moyen)', () => {
        const sorted = sortTournaments(WORLD_TOURNAMENTS_CATALOG, 'tier');
        const tiers = sorted.map((t) => t.tier);
        expect(tiers.slice(0, 6).every((tier) => tier === 'mega')).toBe(true);
        expect(tiers.slice(6, 12).every((tier) => tier === 'grand')).toBe(true);
        expect(tiers.slice(12, 18).every((tier) => tier === 'moyen')).toBe(true);
    });
});

describe('groupTournamentsByMonth', () => {
    it('groups tournaments chronologically with correct year and month index', () => {
        const groups = groupTournamentsByMonth(WORLD_TOURNAMENTS_CATALOG);
        expect(groups.length).toBeGreaterThanOrEqual(8);

        expect(groups[0].monthKey).toBe('2026-11');
        expect(groups[0].year).toBe(2026);
        expect(groups[0].monthIndex).toBe(11);
        expect(groups[0].tournaments).toHaveLength(3);

        for (let i = 1; i < groups.length; i++) {
            expect(groups[i].monthKey > groups[i - 1].monthKey).toBe(true);
        }
    });
});

describe('computeTournamentStats', () => {
    it('computes correct statistics and currency conversion to EUR', () => {
        const stats = computeTournamentStats(WORLD_TOURNAMENTS_CATALOG);
        expect(stats.totalCount).toBe(18);
        expect(stats.megaCount).toBe(6);
        expect(stats.grandCount).toBe(6);
        expect(stats.moyenCount).toBe(6);
        expect(stats.countriesCount).toBeGreaterThanOrEqual(10);
        expect(stats.totalPrizePoolEstimateEur).toBeGreaterThan(600000);
    });

    it('returns zeroes for an empty catalog', () => {
        const stats = computeTournamentStats([]);
        expect(stats).toEqual({
            totalCount: 0,
            megaCount: 0,
            grandCount: 0,
            moyenCount: 0,
            countriesCount: 0,
            totalPrizePoolEstimateEur: 0,
        });
    });

    it('applies FX rates deterministically', () => {
        const mockTournaments: TournamentRecord[] = [
            {
                ...WORLD_TOURNAMENTS_CATALOG[0],
                id: 'mock-1',
                currency: 'EUR',
                estimatedPrizePool: 10000,
            },
            {
                ...WORLD_TOURNAMENTS_CATALOG[0],
                id: 'mock-2',
                currency: 'USD',
                estimatedPrizePool: 10000, // 10000 * 0.92 = 9200
            },
            {
                ...WORLD_TOURNAMENTS_CATALOG[0],
                id: 'mock-3',
                currency: 'GBP',
                estimatedPrizePool: 10000, // 10000 * 1.17 = 11700
            },
        ];
        const stats = computeTournamentStats(mockTournaments);
        // 10000 + 9200 + 11700 = 30900
        expect(stats.totalPrizePoolEstimateEur).toBe(30900);
    });
});

describe('generateTournamentIcs and generateMultiTournamentIcs', () => {
    it('generates a valid RFC 5545 single event iCalendar with exclusive DTEND', () => {
        const mc = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'wbgf-monte-carlo-2027')!;
        const ics = generateTournamentIcs(mc);

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('VERSION:2.0');
        expect(ics).toContain('BEGIN:VEVENT');
        expect(ics).toContain('UID:wbgf-monte-carlo-2027@backgammon-tour');
        expect(ics).toContain('DTSTART;VALUE=DATE:20270725');
        // End date was 2027-08-01, exclusive next day is 20270802
        expect(ics).toContain('DTEND;VALUE=DATE:20270802');
        expect(ics).toContain('SUMMARY:Monte-Carlo Backgammon World Championship');
        expect(ics).toContain('LOCATION:Fairmont Monte Carlo\\, Monte-Carlo\\, Monaco');
        expect(ics).toContain('URL:https://wbgf.info/monte-carlo-2027');
        expect(ics).toContain('END:VEVENT');
        expect(ics).toContain('END:VCALENDAR');
    });

    it('generates a multi-event RFC 5545 iCalendar with custom calendar name', () => {
        const subset = WORLD_TOURNAMENTS_CATALOG.slice(0, 3);
        const ics = generateMultiTournamentIcs(subset, 'Mon Calendrier Backgammon');

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('X-WR-CALNAME:Mon Calendrier Backgammon');
        expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
        expect(ics.match(/END:VEVENT/g)).toHaveLength(3);
        expect(ics).toContain('END:VCALENDAR');
    });
});

describe('buildGoogleCalendarUrl', () => {
    it('builds a valid Google Calendar render template URL', () => {
        const mc = WORLD_TOURNAMENTS_CATALOG.find((t) => t.id === 'wbgf-monte-carlo-2027')!;
        const url = buildGoogleCalendarUrl(mc);

        expect(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE')).toBe(true);
        expect(url).toContain('text=' + encodeURIComponent(mc.name));
        expect(url).toContain('dates=20270725/20270802');
        expect(url).toContain('details=' + encodeURIComponent(`${mc.descriptionFr}\n${mc.officialUrl}`));
        expect(url).toContain('location=' + encodeURIComponent('Fairmont Monte Carlo, Monte-Carlo, Monaco'));
    });
});

describe('validateTournamentSubmission', () => {
    const validSample: TournamentSubmissionInput = {
        name: 'Open International de Bordeaux',
        tier: 'grand',
        startDate: '2027-06-04',
        endDate: '2027-06-06',
        countryCode: 'FR',
        countryName: 'France',
        city: 'Bordeaux',
        venueName: 'Grand Hôtel Bordeaux',
        region: 'europe',
        federation: 'FFB',
        entryFeeMain: 180,
        currency: 'EUR',
        estimatedPrizePool: 15000,
        matchLengthMain: 13,
        clockRules: 'Fischer 12s/move + 2min/pt',
        officialUrl: 'https://ffbg.fr/bordeaux',
        organizerName: 'Bordeaux Backgammon Club',
        descriptionFr: 'Open de prestige au cœur de la région viticole bordelaise.',
    };

    it('accepts a complete and valid submission', () => {
        const result = validateTournamentSubmission(validSample);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('rejects an invalid submission and returns descriptive errors', () => {
        const invalidSample: TournamentSubmissionInput = {
            ...validSample,
            name: 'A',
            startDate: 'invalid-date',
            endDate: '2027-01-01',
            countryCode: 'FRANCE',
            entryFeeMain: -50,
            matchLengthMain: 0,
            officialUrl: 'not-a-valid-url',
            descriptionFr: 'trop court',
        };

        const result = validateTournamentSubmission(invalidSample);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });

    it('rejects submissions where endDate is before startDate', () => {
        const invertedDates: TournamentSubmissionInput = {
            ...validSample,
            startDate: '2027-06-10',
            endDate: '2027-06-05',
        };
        const result = validateTournamentSubmission(invertedDates);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('La date de fin doit être postérieure ou égale à la date de début.');
    });
});
