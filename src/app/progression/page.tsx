import React from 'react';
import type { Metadata } from 'next';
import ProgressionDashboard from '../../components/stats/ProgressionDashboard';

export const metadata: Metadata = {
    title: 'Progression & Concepts Stratégiques | Backgammon Coach',
    description: 'Analyse du Performance Rating (PR), taux d\'erreur et concepts stratégiques de backgammon à travailler.',
};

export default function ProgressionPage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
            <ProgressionDashboard />
        </main>
    );
}
