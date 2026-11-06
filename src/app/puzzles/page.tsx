import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { BeginnerAcademyFlow } from '../../components/beginner/BeginnerAcademyFlow';
import AppNavbar from '../../components/nav/AppNavbar';
import { LobbyLeftSidebar } from '../../components/lobby/LobbySidebarAndWidgets';

export interface PuzzlesPageProps {
    searchParams?: Promise<{ mode?: string; filter?: string; concept?: string; type?: string; gate?: string }>;
}

export async function generateMetadata({ searchParams }: PuzzlesPageProps): Promise<Metadata> {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const isBeginner = resolvedParams?.mode === 'beginner-academy' || resolvedParams?.gate === 'beginner' || resolvedParams?.filter === 'beginner';
    if (isBeginner) {
        return {
            title: "Académie d'Initiation — Backgammon Tour",
            description: "10 leçons et quiz interactifs sur l'échiquier réel pour maîtriser les bases du Backgammon.",
        };
    }
    return {
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
}

export default async function PuzzlesPage({ searchParams }: PuzzlesPageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const isBeginnerAcademy = resolvedParams?.mode === 'beginner-academy' || resolvedParams?.gate === 'beginner';
    const initialMode =
        resolvedParams?.filter === 'personal-blunders' || resolvedParams?.mode === 'personal_blunders'
            ? 'personal_blunders'
            : 'pr_math';
    const initialConceptId =
        resolvedParams?.concept ??
        (resolvedParams?.type === 'cube' || resolvedParams?.filter === 'cube'
            ? 'cube_decision'
            : undefined);

    return (
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col bg-slate-950 text-slate-100">
            <AppNavbar activeTab="puzzles" />
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    <ErrorBoundary name="Quizz Adaptatifs">
                        {isBeginnerAcademy ? (
                            <BeginnerAcademyFlow />
                        ) : (
                            <BlunderDrillView
                                initialMode={initialMode}
                                initialConceptId={initialConceptId}
                            />
                        )}
                    </ErrorBoundary>
                </div>
            </div>
        </main>
    );
}
