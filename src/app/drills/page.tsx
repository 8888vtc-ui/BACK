import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import AppNavbar from '../../components/nav/AppNavbar';
import { LobbyLeftSidebar } from '../../components/lobby/LobbySidebarAndWidgets';

export const metadata: Metadata = {
    title: 'Quizz ER / PR Backgammon, Revoir Mes Blunders & Défi Éclair 60s',
    description:
        'Entraînement adaptatif par la Méthode ER / PR : corrigez vos propres blunders de match, écoutez le Coach Vocal IA et gagnez des Sceaux d’Or.',
    alternates: {
        canonical: '/drills',
        languages: {
            'fr-FR': '/drills',
            'en-US': '/drills?lang=en',
            'es-ES': '/drills?lang=es',
            'pt-BR': '/drills?lang=pt',
            'de-DE': '/drills?lang=de',
            'ar-SA': '/drills?lang=ar',
        },
    },
};

export default function DrillsPage() {
    return (
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col bg-slate-950 text-slate-100">
            <AppNavbar activeTab="drills" />
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
                    <ErrorBoundary name="Parcours Adaptatif de Quizz">
                        <BlunderDrillView initialMode="pr_math" />
                    </ErrorBoundary>
                </div>
            </div>
        </main>
    );
}
