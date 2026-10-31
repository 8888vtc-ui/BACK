/**
 * Page SEO Programmatique pour chaque Club & Lieu de Backgammon (`/tournaments/clubs/[slug]`).
 *
 * Générée statiquement à la compilation pour un référencement Google optimal.
 * Conforme GOVERNANCE.md (Règle 3 : 0 any) et SCALABILITY.md (<= 110 lignes).
 */

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WORLD_BACKGAMMON_VENUES } from '../../../../features/tournaments/worldBackgammonVenues';
import VenueDetailView from '../../../../components/tournaments/VenueDetailView';
import ErrorBoundary from '../../../../components/common/ErrorBoundary';

export function generateStaticParams(): Array<{ slug: string }> {
    return WORLD_BACKGAMMON_VENUES.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const venue = WORLD_BACKGAMMON_VENUES.find((v) => v.slug === slug);
    if (!venue) return { title: 'Club Non Trouvé — Backgammon Tour' };

    return {
        title: `Où jouer au Backgammon à ${venue.city} : ${venue.name} — Horaires, Adresse & Avantages`,
        description: `${venue.seoSummaryFr} Horaires: ${venue.scheduleFr}. Adresse: ${venue.address}.`,
        alternates: {
            canonical: `/tournaments/clubs/${venue.slug}`,
            languages: {
                'fr-FR': `/tournaments/clubs/${venue.slug}`,
                'en-US': `/tournaments/clubs/${venue.slug}?lang=en`,
                'es-ES': `/tournaments/clubs/${venue.slug}?lang=es`,
                'pt-BR': `/tournaments/clubs/${venue.slug}?lang=pt`,
                'de-DE': `/tournaments/clubs/${venue.slug}?lang=de`,
                'ar-SA': `/tournaments/clubs/${venue.slug}?lang=ar`,
            },
        },
    };
}

export default async function VenueDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
    const { slug } = await params;
    const venue = WORLD_BACKGAMMON_VENUES.find((v) => v.slug === slug);
    const related = WORLD_BACKGAMMON_VENUES
        .filter((v) => v.slug !== slug && (!venue || v.region === venue.region || v.category === venue.category))
        .slice(0, 3);

    if (!venue) {
        return (
            <ErrorBoundary name="Fiche Club">
                <VenueDetailView fallbackSlug={slug} relatedVenues={related} />
            </ErrorBoundary>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SportsActivityLocation',
        name: venue.name,
        description: venue.seoSummaryFr,
        url: venue.officialUrl,
        address: {
            '@type': 'PostalAddress',
            streetAddress: venue.address,
            addressLocality: venue.city,
            addressCountry: venue.countryCode,
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: venue.coordinates.lat,
            longitude: venue.coordinates.lng,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ErrorBoundary name="Fiche Club">
                <VenueDetailView venue={venue} relatedVenues={related} />
            </ErrorBoundary>
        </>
    );
}
