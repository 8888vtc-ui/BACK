/**
 * @file src/lib/i18n/tournamentsDict.ts
 * @description Dictionnaire bilingue FR/EN dédié à la page /tournaments (Carte Mondiale des Clubs & Tournois).
 * Strictement <= 200 lignes, 0 any.
 */

export interface TournamentsDict {
    readonly heroTitle: string;
    readonly registerClubBtn: string;
    readonly submitTournamentBtn: string;
    readonly searchPlaceholder: string;
    readonly clubsToggle: (count: number) => string;
    readonly tournamentsToggle: (count: number) => string;
    readonly presetWorld: string;
    readonly presetFrance: string;
    readonly presetEurope: string;
    readonly presetAmericas: string;
    readonly presetAsia: string;
    readonly resetView: string;
    readonly zoomInTitle: string;
    readonly zoomOutTitle: string;
    readonly clusterClubsLabel: (count: number) => string;
    readonly emptyPanelTitle: string;
    readonly emptyPanelDesc: string;
    readonly clubBadgePrefix: string;
    readonly tournamentBadgePrefix: string;
    readonly cityAddressLabel: string;
    readonly cityCountryLabel: string;
    readonly venueLabel: string;
    readonly openingHoursLabel: string;
    readonly feesAccessLabel: string;
    readonly officialDatesLabel: string;
    readonly prizePoolLabel: string;
    readonly officialPrizeFallback: string;
    readonly formatLabel: string;
    readonly mainMatchPts: (pts: number) => string;
    readonly officialClubCta: string;
    readonly playClubLoungeCta: string;
    readonly officialTournamentCta: string;
    readonly trainTournamentCta: (pts: number) => string;
    readonly bottomTournamentsTitle: (count: number) => string;
    readonly bottomTournamentsHint: string;
    readonly prevPageAria: string;
    readonly nextPageAria: string;
}

export const TOURNAMENTS_DICT: Readonly<Record<'fr' | 'en', TournamentsDict>> = {
    fr: {
        heroTitle: 'CARTE MONDIALE DES CLUBS & TOURNOIS',
        registerClubBtn: '+ Enregistrer mon Club',
        submitTournamentBtn: '+ Référencer un Tournoi',
        searchPlaceholder: 'Rechercher par ville, pays, club...',
        clubsToggle: (count) => `Clubs (${count})`,
        tournamentsToggle: (count) => `Tournois (${count})`,
        presetWorld: 'Monde',
        presetFrance: 'France & Riviera',
        presetEurope: 'Europe',
        presetAmericas: 'Amériques',
        presetAsia: 'Asie & Dubaï',
        resetView: 'Réinitialiser la vue',
        zoomInTitle: 'Zoomer (+)',
        zoomOutTitle: 'Dézoomer (-)',
        clusterClubsLabel: (count) => `+${count} clubs`,
        emptyPanelTitle: 'Sélectionnez un Club ou Tournoi',
        emptyPanelDesc: 'Cliquez sur un marqueur de la carte pour afficher ses horaires, son adresse et ses liens officiels.',
        clubBadgePrefix: 'CLUB & SALON',
        tournamentBadgePrefix: 'TOURNOI',
        cityAddressLabel: 'Ville / Adresse :',
        cityCountryLabel: 'Ville & Pays :',
        venueLabel: 'Lieu :',
        openingHoursLabel: 'Horaires d’Ouverture :',
        feesAccessLabel: 'Tarif / Accès :',
        officialDatesLabel: 'Dates Officielles :',
        prizePoolLabel: 'Dotation (Prize Pool) :',
        officialPrizeFallback: 'Officiel FFB / WBGF',
        formatLabel: 'Format Compétition :',
        mainMatchPts: (pts) => `Match en ${pts} pts`,
        officialClubCta: 'SITE OFFICIEL / S’INSCRIRE AU CLUB',
        playClubLoungeCta: 'Jouer au Salon en ligne du Club',
        officialTournamentCta: 'VOIR LES DÉTAILS / S’INSCRIRE AU TOURNOI',
        trainTournamentCta: (pts) => `S’entraîner au format ${pts} pts`,
        bottomTournamentsTitle: (count) => `Tournois sur la Carte (${count})`,
        bottomTournamentsHint: 'Cliquez sur un tournoi pour le localiser ou vous entraîner',
        prevPageAria: 'Tournois précédents',
        nextPageAria: 'Tournois suivants',
    },
    en: {
        heroTitle: 'WORLD MAP OF CLUBS & TOURNAMENTS',
        registerClubBtn: '+ Register my Club',
        submitTournamentBtn: '+ Submit a Tournament',
        searchPlaceholder: 'Search by city, country, club...',
        clubsToggle: (count) => `Clubs (${count})`,
        tournamentsToggle: (count) => `Tournaments (${count})`,
        presetWorld: 'World',
        presetFrance: 'France & Riviera',
        presetEurope: 'Europe',
        presetAmericas: 'Americas',
        presetAsia: 'Asia & Dubai',
        resetView: 'Reset view',
        zoomInTitle: 'Zoom in (+)',
        zoomOutTitle: 'Zoom out (-)',
        clusterClubsLabel: (count) => `+${count} clubs`,
        emptyPanelTitle: 'Select a Club or Tournament',
        emptyPanelDesc: 'Click any marker on the map to view its opening hours, address, and official links.',
        clubBadgePrefix: 'CLUB & LOUNGE',
        tournamentBadgePrefix: 'TOURNAMENT',
        cityAddressLabel: 'City / Address:',
        cityCountryLabel: 'City & Country:',
        venueLabel: 'Venue:',
        openingHoursLabel: 'Opening Hours:',
        feesAccessLabel: 'Fees / Access:',
        officialDatesLabel: 'Official Dates:',
        prizePoolLabel: 'Prize Pool:',
        officialPrizeFallback: 'Official WBGF / Federation',
        formatLabel: 'Competition Format:',
        mainMatchPts: (pts) => `${pts}-pt Match`,
        officialClubCta: 'OFFICIAL WEBSITE / JOIN CLUB',
        playClubLoungeCta: 'Play in Club Online Lounge',
        officialTournamentCta: 'VIEW DETAILS / REGISTER FOR TOURNAMENT',
        trainTournamentCta: (pts) => `Train in ${pts}-pt Format`,
        bottomTournamentsTitle: (count) => `Tournaments on Map (${count})`,
        bottomTournamentsHint: 'Click a tournament to locate or train',
        prevPageAria: 'Previous tournaments',
        nextPageAria: 'Next tournaments',
    },
};

export function getTournamentsDict(locale: string): TournamentsDict {
    return locale === 'en' ? TOURNAMENTS_DICT.en : TOURNAMENTS_DICT.fr;
}

