/**
 * Route App Router `/daily-puzzle` — Puzzle Backgammon du Jour & Quizz ER / PR Adaptatif.
 * Layout global unifié : AppNavbar + LobbyLeftSidebar + Verrou Invité Loi 1.
 */

import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import AppNavbar from '../../components/nav/AppNavbar';
import { LobbyLeftSidebar } from '../../components/lobby/LobbySidebarAndWidgets';

export const metadata: Metadata = {
    title: 'Puzzle Backgammon du Jour & Défi Tactique ER / PR | Backgammon Tour',
    description:
        'Résolvez le Puzzle Backgammon du Jour certifié par le moteur neuronal Open Sage 3-Ply et testez votre indice ER / PR.',
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
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col bg-[#050505] text-slate-100">
            <AppNavbar activeTab="puzzles" />
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    <ErrorBoundary name="Défi Quotidien & Parcours Adaptatif">
                        <BlunderDrillView initialMode="pr_math" />
                    </ErrorBoundary>
                </div>
            </div>
        </main>
    );
}
