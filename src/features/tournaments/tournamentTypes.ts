/**
 * Types centraux et immuables de la Base de Données Mondiale des Tournois Backgammon Tour.
 *
 * Classification officielle en 3 paliers :
 * - 'mega'  : Majors mondiaux (150+ joueurs ou Prize Pool >= 50 000 €/$ ou Championnat du Monde/Continental)
 * - 'grand' : Nationaux & Masters de prestige (50 à 150 joueurs, étapes majeures WBGF/USBGF/FFB/UKBGF)
 * - 'moyen' : Régionaux & Opens de clubs certifiés (15 à 50 joueurs, tournois week-end officiels)
 *
 * Strictement 0 `any` (Règle 3 GOVERNANCE.md).
 */

export type TournamentTier = 'moyen' | 'grand' | 'mega';

export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type TournamentRegion =
    | 'europe'
    | 'north_america'
    | 'middle_east'
    | 'asia_pacific'
    | 'latin_america';

export type TournamentFederation =
    | 'WBGF'
    | 'USBGF'
    | 'FFB'
    | 'UKBGF'
    | 'EUBGF'
    | 'WBA'
    | 'Independent';

export type TournamentCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'JPY';

export type TournamentSpeedVariant = 'classic' | 'blitz' | 'doubles' | 'chouette';

export interface TournamentRecord {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly tier: TournamentTier;
    readonly status: TournamentStatus;
    readonly startDate: string; // ISO YYYY-MM-DD
    readonly endDate: string; // ISO YYYY-MM-DD
    readonly timezone: string; // IANA ex: 'Europe/Monaco'
    readonly registrationDeadline: string | null; // ISO YYYY-MM-DD
    readonly countryCode: string; // ISO 3166-1 alpha-2 ex: 'MC', 'FR', 'US'
    readonly countryName: string;
    readonly city: string;
    readonly venueName: string;
    readonly region: TournamentRegion;
    readonly federation: TournamentFederation;
    readonly entryFeeMain: number;
    readonly currency: TournamentCurrency;
    readonly estimatedPrizePool: number | null;
    readonly expectedPlayersMin: number;
    readonly expectedPlayersMax: number;
    readonly matchLengthMain: number; // ex: 13, 15, 17 points
    readonly clockRules: string; // ex: 'Fischer 12s/move + 2min/pt'
    readonly speedVariant: TournamentSpeedVariant;
    readonly sideEvents: ReadonlyArray<string>;
    readonly officialUrl: string;
    readonly registrationUrl: string | null;
    readonly organizerName: string;
    readonly descriptionFr: string;
    readonly descriptionEn: string;
    readonly isVerified: boolean;
    readonly isFeatured: boolean;
}

export interface TournamentFilterCriteria {
    readonly searchQuery?: string;
    readonly tier?: TournamentTier | 'all';
    readonly region?: TournamentRegion | 'all';
    readonly federation?: TournamentFederation | 'all';
    readonly countryCode?: string | 'all';
    readonly monthKey?: string | 'all'; // Format 'YYYY-MM'
    readonly maxEntryFee?: number | null;
    readonly onlyBookmarked?: boolean;
    readonly bookmarkedIds?: ReadonlySet<string>;
}

export type TournamentSortField = 'startDate' | 'prizePool' | 'entryFee' | 'tier';

export interface TournamentMonthGroup {
    readonly monthKey: string; // 'YYYY-MM'
    readonly year: number;
    readonly monthIndex: number; // 1..12
    readonly tournaments: ReadonlyArray<TournamentRecord>;
}

export interface TournamentGlobalStats {
    readonly totalCount: number;
    readonly megaCount: number;
    readonly grandCount: number;
    readonly moyenCount: number;
    readonly countriesCount: number;
    readonly totalPrizePoolEstimateEur: number;
}

export interface TournamentSubmissionInput {
    readonly name: string;
    readonly tier: TournamentTier;
    readonly startDate: string;
    readonly endDate: string;
    readonly countryCode: string;
    readonly countryName: string;
    readonly city: string;
    readonly venueName: string;
    readonly region: TournamentRegion;
    readonly federation: TournamentFederation;
    readonly entryFeeMain: number;
    readonly currency: TournamentCurrency;
    readonly estimatedPrizePool: number | null;
    readonly matchLengthMain: number;
    readonly clockRules: string;
    readonly officialUrl: string;
    readonly organizerName: string;
    readonly descriptionFr: string;
}

