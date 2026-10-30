/**
 * Page SEO & Fiche Officielle d'un Tournoi de Backgammon (`/tournaments/[slug]`).
 *
 * Générée statiquement à la compilation pour 100 % de rapidité SSR & compatibilité Capacitor.
 * Conforme GOVERNANCE.md (Règle 3 : 0 any) et SCALABILITY.md (<= 110 lignes).
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WORLD_TOURNAMENTS_CATALOG } from '../../../features/tournaments/worldTournamentsCatalog';
import TournamentDetailView from '../../../components/tournaments/TournamentDetailView';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

export function generateStaticParams(): Array<{ slug: string }> {
    return WORLD_TOURNAMENTS_CATALOG.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const tournament = WORLD_TOURNAMENTS_CATALOG.find((t) => t.slug === slug);
    if (!tournament) return { title: 'Tournoi Non Trouvé — Backgammon Tour' };

    return {
        title: `${tournament.name} (${tournament.city}, ${tournament.countryCode}) — Calendrier Officiel Backgammon`,
        description: `${tournament.descriptionFr} Dates: ${tournament.startDate} au ${tournament.endDate}. Format: ${tournament.matchLengthMain} pts, buy-in: ${tournament.entryFeeMain} ${tournament.currency}.`,
        alternates: {
            canonical: `/tournaments/${tournament.slug}`,
            languages: {
                'fr-FR': `/tournaments/${tournament.slug}`,
                'en-US': `/tournaments/${tournament.slug}?lang=en`,
                'es-ES': `/tournaments/${tournament.slug}?lang=es`,
                'pt-BR': `/tournaments/${tournament.slug}?lang=pt`,
                'de-DE': `/tournaments/${tournament.slug}?lang=de`,
                'ar-SA': `/tournaments/${tournament.slug}?lang=ar`,
            },
        },
    };
}

export default async function TournamentDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
    const { slug } = await params;
    const tournament = WORLD_TOURNAMENTS_CATALOG.find((t) => t.slug === slug);
    if (!tournament) notFound();

    const related = WORLD_TOURNAMENTS_CATALOG
        .filter((t) => t.id !== tournament.id && (t.tier === tournament.tier || t.region === tournament.region))
        .slice(0, 3);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: tournament.name,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        description: tournament.descriptionFr,
        location: {
            '@type': 'Place',
            name: tournament.venueName,
            address: {
                '@type': 'PostalAddress',
                addressLocality: tournament.city,
                addressCountry: tournament.countryCode,
            },
        },
        organizer: {
            '@type': 'Organization',
            name: tournament.organizerName,
            url: tournament.officialUrl,
        },
        offers: {
            '@type': 'Offer',
            price: tournament.entryFeeMain,
            priceCurrency: tournament.currency,
            url: tournament.officialUrl,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ErrorBoundary name="Fiche Tournoi">
                <TournamentDetailView tournament={tournament} relatedTournaments={related} />
            </ErrorBoundary>
        </>
    );
}
