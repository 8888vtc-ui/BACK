/**
 * Constructeurs purs de données structurées Schema.org (JSON-LD `@graph`) pour le SEO & GEO international.
 *
 * Génère les 9 schémas interconnectés :
 * - `WebSite` (6 langues : FR, EN, ES, PT, DE, AR)
 * - `VideoGame` & `SoftwareApplication` (Backgammon Tour & Open Sage 3-Ply)
 * - `Course` (Gammon Academy — Les 15 Ouvertures, Videau & Stratégie 3-Ply)
 * - `FAQPage` (Questions/Réponses stratégiques à fort volume de recherche)
 * - `BreadcrumbList` (Arborescence canonique du site)
 * - `ItemList` (Classement ordonné des 15 Rouleaux d'Ouverture par équité 3-Ply)
 * - `DefinedTermSet` (Glossaire officiel des termes techniques XG / WBGF)
 * - `HowTo` (Guide pas-à-pas du calcul du Keith Count et de la décision de Videau)
 * Strictement 0 any.
 */

import { ACADEMY_CONTENT } from '../../features/academy/academyTranslations';
import { OPENING_ROLLS_15 } from '../../features/academy/academyData';
import { BACKGAMMON_TERMINOLOGY_MATRIX, type BackgammonTermKey } from '../i18n/terminologyMatrix';
import type { TournamentRecord } from '../../features/tournaments/tournamentTypes';
import { WORLD_BACKGAMMON_VENUES, type WorldBackgammonVenue } from '../../features/tournaments/worldBackgammonVenues';

export const DEFAULT_SITE_URL = 'https://backgammontour.com';

export const SUPPORTED_HREFLANGS: ReadonlyArray<{ readonly lang: string; readonly urlSuffix: string }> = [
    { lang: 'fr', urlSuffix: '' },
    { lang: 'en', urlSuffix: '?lang=en' },
    { lang: 'es', urlSuffix: '?lang=es' },
    { lang: 'pt', urlSuffix: '?lang=pt' },
    { lang: 'de', urlSuffix: '?lang=de' },
    { lang: 'ar', urlSuffix: '?lang=ar' },
] as const;

const GLOSSARY_SCHEMA_KEYS: readonly BackgammonTermKey[] = [
    'doublingCube',
    'goldenPoint',
    'barPoint',
    'pipCount',
    'prime',
    'blot',
    'bearOff',
    'crawfordRule',
    'doubleMatchPoint',
    'takePoint',
    'gammonPrice',
    'performanceRating',
] as const;

export function buildGlobalStructuredData(siteUrl: string = DEFAULT_SITE_URL): Record<string, unknown> {
    const cleanUrl = siteUrl.replace(/\/+$/, '');
    const faqEntities = [
        ...ACADEMY_CONTENT.fr.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
        ...ACADEMY_CONTENT.en.faqs.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    ];

    const openingListItems = OPENING_ROLLS_15.map((entry, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: `Ouverture ${entry.roll} (${entry.optimalMove}) — ${entry.nickname.fr} (${entry.equity3Ply})`,
        url: `${cleanUrl}/academy/openings/${entry.roll}`,
    }));

    const definedTerms = GLOSSARY_SCHEMA_KEYS.map((key) => {
        const row = BACKGAMMON_TERMINOLOGY_MATRIX[key];
        return {
            '@type': 'DefinedTerm',
            termCode: key,
            name: `${row.fr} / ${row.en}`,
            description: `FR: ${row.fr} | EN: ${row.en} | ES: ${row.es} | PT: ${row.pt} | DE: ${row.de} | AR: ${row.ar}`,
            inDefinedTermSet: `${cleanUrl}/academy#lexicon-matrix`,
        };
    });

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebSite',
                '@id': `${cleanUrl}/#website`,
                url: cleanUrl,
                name: 'Backgammon Tour — Cercle Monte-Carlo & Gammon Academy',
                alternateName: [
                    'Backgammon Tour',
                    'Gammon Academy',
                    'Cercle Monte-Carlo Backgammon',
                ],
                inLanguage: ['fr-FR', 'en-US', 'es-ES', 'pt-BR', 'de-DE', 'ar-SA'],
            },
            {
                '@type': ['VideoGame', 'SoftwareApplication'],
                '@id': `${cleanUrl}/#application`,
                name: 'Backgammon Tour — Cercle Monte-Carlo & Gammon Academy',
                url: cleanUrl,
                sameAs: [
                    'https://gammonacademy.com',
                    'https://bgmontecarlo.com',
                ],
                applicationCategory: 'GameApplication',
                genre: ['Board Game', 'Strategy Game', 'Educational Game'],
                operatingSystem: 'Web, iOS, Android',
                inLanguage: ['fr', 'en', 'es', 'pt', 'de', 'ar'],
                description:
                    'Plateforme de Backgammon de tournoi avec moteur neuronal Monte-Carlo 3-Ply (PR 0.23), Coach IA en temps réel, Gammon Academy (15 ouvertures, videau, drills, puzzles) et Salon Multijoueur.',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'EUR',
                    availability: 'https://schema.org/InStock',
                },
            },
            {
                '@type': 'Course',
                '@id': `${cleanUrl}/academy#course`,
                name: 'Gammon Academy — Encyclopédie des 15 Ouvertures, Videau & Stratégie Backgammon 3-Ply',
                description:
                    'Formation stratégique complète au Backgammon de tournoi : table d’équité des 15 rouleaux d’ouverture Monte-Carlo 3-Ply, mathématique du Videau (Take Point 21,5 %, Crawford, Jacoby, MET Kazaross-XG2), Keith Count et réduction du Performance Rating (PR).',
                provider: {
                    '@type': 'Organization',
                    name: 'Backgammon Tour & Gammon Academy',
                    sameAs: ['https://backgammontour.com', 'https://gammonacademy.com'],
                },
                url: `${cleanUrl}/academy`,
                inLanguage: ['fr', 'en', 'es', 'pt', 'de', 'ar'],
                educationalLevel: ['Beginner', 'Intermediate', 'Advanced', 'Grandmaster'],
            },
            {
                '@type': 'ItemList',
                '@id': `${cleanUrl}/academy#opening-rolls-list`,
                name: 'Les 15 Rouleaux d’Ouverture au Backgammon (Équité 3-Ply Monte-Carlo)',
                itemListOrder: 'https://schema.org/ItemListOrderDescending',
                numberOfItems: OPENING_ROLLS_15.length,
                itemListElement: openingListItems,
            },
            {
                '@type': 'DefinedTermSet',
                '@id': `${cleanUrl}/academy#lexicon-matrix`,
                name: 'Matrice Terminologique Officielle du Backgammon de Compétition (6 Langues)',
                url: `${cleanUrl}/academy#lexicon-matrix`,
                hasDefinedTerm: definedTerms,
            },
            {
                '@type': 'HowTo',
                '@id': `${cleanUrl}/academy#howto-keith-count`,
                name: 'Comment calculer le Keith Count et prendre une décision de Videau en course au Backgammon',
                description:
                    'Méthode mathématique en 3 étapes pour décider quand doubler, redoubler ou accepter le videau dans une course pure au Backgammon.',
                step: [
                    {
                        '@type': 'HowToStep',
                        position: 1,
                        name: 'Calculer le Pip Count corrigé (Keith Count)',
                        text: 'Additionnez votre Pip Count brut et vos pénalités de structure (+1 par pion au-delà de 3 sur les portes 1 à 3, +1 par flèche vide sur les portes 4 à 6, +1 par pion au-delà de 1 hors du jan intérieur).',
                    },
                    {
                        '@type': 'HowToStep',
                        position: 2,
                        name: 'Déterminer le seuil maximal de prise (Take Limit)',
                        text: 'Multipliez votre Keith Count par 8, divisez par 7 (arrondi à l’entier inférieur), puis retranchez 3 pips : TakeLimit = floor(KeithX * 8 / 7) - 3.',
                    },
                    {
                        '@type': 'HowToStep',
                        position: 3,
                        name: 'Appliquer le verdict Double / Redouble / Take / Pass',
                        text: 'Doublez dès que le Keith Count adverse est supérieur ou égal à (TakeLimit - 4). L’adversaire doit accepter (Take) jusqu’à TakeLimit inclus, et passer (Drop) au-delà.',
                    },
                ],
            },
            {
                '@type': 'FAQPage',
                '@id': `${cleanUrl}/academy#faq`,
                mainEntity: faqEntities,
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${cleanUrl}/#breadcrumbs`,
                itemListElement: [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: 'Salon Privé Backgammon Tour',
                        item: `${cleanUrl}/`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Gammon Academy — Guides & 15 Ouvertures',
                        item: `${cleanUrl}/academy`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: 'Puzzles Quotidiens 3-Ply',
                        item: `${cleanUrl}/puzzles`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 4,
                        name: 'Drills de Blunders',
                        item: `${cleanUrl}/drills`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 5,
                        name: 'Progression & Performance Rating (PR)',
                        item: `${cleanUrl}/progression`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 6,
                        name: 'Base de Données Mondiale & Agenda des Tournois Backgammon',
                        item: `${cleanUrl}/tournaments`,
                    },
                ],
            },
        ],
    };
}

/**
 * Génère le graphe JSON-LD Schema.org `ItemList` + `SportsEvent` pour la page `/tournaments`.
 */
export function buildTournamentsStructuredData(
    tournaments: ReadonlyArray<TournamentRecord>,
    siteUrl: string = DEFAULT_SITE_URL,
): Record<string, unknown> {
    const cleanUrl = siteUrl.replace(/\/+$/, '');
    const eventEntities = tournaments.map((t, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
            '@type': 'SportsEvent',
            '@id': `${cleanUrl}/tournaments#${t.slug}`,
            name: t.name,
            description: t.descriptionFr,
            startDate: t.startDate,
            endDate: t.endDate,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            sport: 'Backgammon',
            url: t.officialUrl,
            location: {
                '@type': 'Place',
                name: t.venueName,
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: t.city,
                    addressCountry: t.countryCode,
                },
            },
            organizer: {
                '@type': 'Organization',
                name: `${t.organizerName} (${t.federation})`,
                url: t.officialUrl,
            },
            offers: {
                '@type': 'Offer',
                price: String(t.entryFeeMain),
                priceCurrency: t.currency,
                url: t.registrationUrl ?? t.officialUrl,
                availability: 'https://schema.org/InStock',
            },
        },
    }));

    const venueEntities = WORLD_BACKGAMMON_VENUES.map((v) => ({
        '@type': 'SportsActivityLocation',
        '@id': `${cleanUrl}/tournaments#venue-${v.slug}`,
        name: v.name,
        description: v.seoSummaryFr,
        url: v.officialUrl,
        address: {
            '@type': 'PostalAddress',
            streetAddress: v.address,
            addressLocality: v.city,
            addressCountry: v.countryCode,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: v.coordinates.lat,
            longitude: v.coordinates.lng,
        },
    }));

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'ItemList',
                '@id': `${cleanUrl}/tournaments#calendar`,
                name: 'Calendrier Mondial Officiel des Tournois de Backgammon (MEGA, GRAND, MOYEN)',
                description:
                    'Base de données mondiale et agenda officiel des tournois de Backgammon WBGF, USBGF, FFB, UKBGF, EUBGF et WBA classés par catégorie (Mega Majors, Grand Masters, Opens Moyens).',
                numberOfItems: tournaments.length,
                itemListElement: eventEntities,
            },
            {
                '@type': 'ItemList',
                '@id': `${cleanUrl}/tournaments#venues-directory`,
                name: 'Guide & Carte Mondiale des Clubs et Lieux où Jouer au Backgammon',
                description: 'Répertoire mondial des clubs, salons et cafés mythiques pour jouer au backgammon en réel avec pendule.',
                numberOfItems: venueEntities.length,
                itemListElement: venueEntities.map((ve, idx) => ({
                    '@type': 'ListItem',
                    position: idx + 1,
                    item: ve,
                })),
            },
        ],
    };
}
