import React from 'react';
import type { Metadata } from 'next';
import TournamentWorldHubView from '../../components/tournaments/TournamentWorldHubView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { WORLD_TOURNAMENTS_CATALOG } from '../../features/tournaments/worldTournamentsCatalog';
import { buildTournamentsStructuredData } from '../../lib/seo/structuredData';

export const metadata: Metadata = {
    title: 'Backgammon Tour — Base Mondiale des Tournois & Carte Où Jouer au Backgammon (Clubs & Salons)',
    description:
        'Calendrier mondial officiel des tournois de Backgammon (WBGF, USBGF, FFB, UKBGF, WBA) et carte interactive des clubs, salons et cafés mythiques où jouer en direct avec pendule Fischer.',
    alternates: {
        canonical: '/tournaments',
        languages: {
            'fr-FR': '/tournaments',
            'en-US': '/tournaments?lang=en',
            'es-ES': '/tournaments?lang=es',
            'pt-BR': '/tournaments?lang=pt',
            'de-DE': '/tournaments?lang=de',
            'ar-SA': '/tournaments?lang=ar',
        },
    },
};

export default function TournamentsPage() {
    const jsonLd = buildTournamentsStructuredData(WORLD_TOURNAMENTS_CATALOG);

    return (
        <ErrorBoundary name="Backgammon Tour — Tournois Mondiaux">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <TournamentWorldHubView initialTournaments={WORLD_TOURNAMENTS_CATALOG} />
        </ErrorBoundary>
    );
}

