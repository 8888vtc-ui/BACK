import React from 'react';
import type { Metadata } from 'next';
import ProgressionDashboard from '../../components/stats/ProgressionDashboard';
import AppNavbar from '../../components/nav/AppNavbar';
import { LobbyLeftSidebar } from '../../components/lobby/LobbySidebarAndWidgets';

export const metadata: Metadata = {
    title: 'Calcul Performance Rating (PR) & Indice ER / PR Backgammon | Progression',
    description:
        'Mesurez votre Performance Rating officiel (PR = Équité perdue × 500), votre indice ER / PR et vos 9 compétences stratégiques de Backgammon.',
    alternates: {
        canonical: '/progression',
        languages: {
            'fr-FR': '/progression',
            'en-US': '/progression?lang=en',
            'es-ES': '/progression?lang=es',
            'pt-BR': '/progression?lang=pt',
            'de-DE': '/progression?lang=de',
            'ar-SA': '/progression?lang=ar',
        },
    },
};

export default function ProgressionPage() {
    return (
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col bg-[#050505] text-slate-100">
            <AppNavbar activeTab="puzzles" />
            <div className="flex flex-1 min-h-0 overflow-hidden w-full">
                <LobbyLeftSidebar />
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto p-3 sm:p-5 items-center">
                    <ProgressionDashboard />
                </div>
            </div>
        </main>
    );
}
