/**
 * Route App Router `/daily-puzzle` — Puzzle Backgammon du Jour & Quizz ERH Adaptatif.
 */

import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export const metadata: Metadata = {
    title: 'Puzzle Backgammon du Jour & Défi Tactique ERH | Backgammon Tour',
    description:
        'Résolvez gratuitement le Puzzle Backgammon du Jour certifié par le moteur neuronal Open Sage 3-Ply et testez votre Indice ERH (Exploitation du Risque Humain).',
    alternates: {
        canonical: '/daily-puzzle',
        languages: {
            'fr-FR': '/daily-puzzle',
            'en-US': '/daily-puzzle?lang=en',
            'es-ES': '/daily-puzzle?lang=es',
            'pt-BR': '/daily-puzzle?lang=pt',
            'de-DE': '/daily-puzzle?lang=de',
            'ar-SA': '/daily-puzzle?lang=ar',
        },
    },
};

export default function DailyPuzzlePage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-2 sm:p-5 bg-slate-950 text-slate-100">
            <ErrorBoundary name="Défi Quotidien & Parcours Adaptatif">
                <BlunderDrillView />
            </ErrorBoundary>
        </main>
    );
}
