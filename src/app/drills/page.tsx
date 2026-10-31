import React from 'react';
import type { Metadata } from 'next';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export const metadata: Metadata = {
    title: 'Quizz ERH Backgammon, Revoir Mes Blunders & Défi Éclair 60s',
    description:
        'Entraînement adaptatif par la Méthode ERH (Exploitation du Risque et de l’Erreur Humaine) : corrigez vos propres blunders de match, écoutez le Coach Vocal IA et gagnez des Sceaux d’Or.',
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
        <main className="flex h-dvh max-h-dvh w-screen overflow-hidden flex-col items-center bg-slate-950 text-slate-100">
            <ErrorBoundary name="Parcours Adaptatif de Quizz">
                <BlunderDrillView />
            </ErrorBoundary>
        </main>
    );
}
