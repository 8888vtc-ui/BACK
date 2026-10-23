/**
 * Constructeurs purs de données structurées Schema.org (JSON-LD `@graph`) pour le SEO international.
 *
 * Génère les schémas :
 * - `WebSite` (6 langues : FR, EN, ES, PT, DE, AR)
 * - `VideoGame` & `SoftwareApplication` (Backgammon Tour & Open Sage 3-Ply)
 * - `Course` (Gammon Academy — Les 15 Ouvertures, Videau & Stratégie 3-Ply)
 * - `FAQPage` (Questions/Réponses stratégiques à fort volume de recherche)
 * - `BreadcrumbList` (Arborescence canonique du site)
 * Strictement 0 any.
 */

import { ACADEMY_CONTENT } from '../../features/academy/academyTranslations';

export const DEFAULT_SITE_URL = 'https://backgammontour.com';

export const SUPPORTED_HREFLANGS: ReadonlyArray<{ readonly lang: string; readonly urlSuffix: string }> = [
    { lang: 'fr', urlSuffix: '' },
    { lang: 'en', urlSuffix: '?lang=en' },
    { lang: 'es', urlSuffix: '?lang=es' },
    { lang: 'pt', urlSuffix: '?lang=pt' },
    { lang: 'de', urlSuffix: '?lang=de' },
    { lang: 'ar', urlSuffix: '?lang=ar' },
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
                    'Plateforme de Backgammon de tournoi avec moteur neuronal Open Sage 3-Ply (PR 0.23), Coach IA en temps réel, Gammon Academy (15 ouvertures, videau, drills, puzzles) et Salon Multijoueur.',
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
                    'Formation stratégique complète au Backgammon de tournoi : table d’équité des 15 rouleaux d’ouverture Open Sage 3-Ply, mathématique du Videau (Take Point 21,5 %, Crawford, Jacoby, MET Kazaross-XG2), Keith Count et réduction du Performance Rating (PR).',
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
                ],
            },
        ],
    };
}
