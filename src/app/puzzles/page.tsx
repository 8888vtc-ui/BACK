import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export const metadata: Metadata = {
    title: '19 413 Problèmes Tactiques Backgammon 3-Ply Certifiés GNU & Exercices ER/ERH',
    description:
        '19 413 problèmes tactiques de Backgammon (18 613 ER + 800 ERH) certifiés par GNU Backgammon [world class] : travaillez les 9 piliers (Ouvertures, Prime, Blitz, Backgame, Course et Videau).',
    alternates: {
        canonical: '/puzzles',
        languages: {
            'fr-FR': '/puzzles',
            'en-US': '/puzzles?lang=en',
            'es-ES': '/puzzles?lang=es',
            'pt-BR': '/puzzles?lang=pt',
            'de-DE': '/puzzles?lang=de',
            'ar-SA': '/puzzles?lang=ar',
        },
    },
};

export default function PuzzlesPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-2 sm:p-5 bg-slate-950 text-slate-100">
            <ErrorBoundary name="Quizz Adaptatifs">
                <BlunderDrillView initialMode="pr_math" />
            </ErrorBoundary>
        </main>
    );
}
