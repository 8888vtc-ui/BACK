import React from 'react';
import type { Metadata } from 'next';
import GammonAcademyView from '../../components/academy/GammonAcademyView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export const metadata: Metadata = {
    title: 'Gammon Academy — Les 15 Ouvertures, Videau (21,5 %) & Stratégie 3-Ply',
    description:
        'Encyclopédie officielle Gammon Academy & Backgammon Tour : table d’équité des 15 rouleaux d’ouverture Monte-Carlo 3-Ply, maîtrise du Videau (Take Point 21,5 %, Crawford, Jacoby, MET Kazaross-XG2), Keith Count et Performance Rating (PR).',
    alternates: {
        canonical: '/academy',
        languages: {
            'fr-FR': '/academy',
            'en-US': '/academy?lang=en',
            'es-ES': '/academy?lang=es',
            'pt-BR': '/academy?lang=pt',
            'de-DE': '/academy?lang=de',
            'ar-SA': '/academy?lang=ar',
        },
    },
};

export default function AcademyPage() {
    return (
        <ErrorBoundary name="Gammon Academy">
            <GammonAcademyView />
        </ErrorBoundary>
    );
}
