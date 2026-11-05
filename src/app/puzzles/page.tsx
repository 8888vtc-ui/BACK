import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { BeginnerAcademyFlow } from '../../components/beginner/BeginnerAcademyFlow';

export const metadata: Metadata = {
    title: 'Quiz ER Backgammon — 18 613 Problèmes Tactiques 3-Ply Certifiés GNU (Équité Réelle)',
    description:
        'Quiz ER (Équité Réelle) certifié par GNU Backgammon [world class] : travaillez les 9 piliers mathématiques (Ouvertures, Prime, Blitz, Backgame, Course et Videau).',
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

export interface PuzzlesPageProps {
    searchParams?: Promise<{ mode?: string; filter?: string }>;
}

export default async function PuzzlesPage({ searchParams }: PuzzlesPageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const isBeginnerAcademy = resolvedParams?.mode === 'beginner-academy';
    const initialMode =
        resolvedParams?.filter === 'personal-blunders' || resolvedParams?.mode === 'personal_blunders'
            ? 'personal_blunders'
            : 'pr_math';

    return (
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col items-center bg-slate-950 text-slate-100">
            <ErrorBoundary name="Quizz Adaptatifs">
                {isBeginnerAcademy ? (
                    <BeginnerAcademyFlow />
                ) : (
                    <BlunderDrillView initialMode={initialMode} />
                )}
            </ErrorBoundary>
        </main>
    );
}
