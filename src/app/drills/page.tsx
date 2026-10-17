import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';

export const metadata: Metadata = {
    title: 'Drills de Blunders & Rejeu des Erreurs | Backgammon Coach',
    description:
        'Rejouez automatiquement vos erreurs passées du joueur jusqu’à trouver le bon coup certifié par GNUBG. Corrigez vos faiblesses stratégiques.',
};

export default function DrillsPage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-3 sm:p-6 md:p-8 space-y-6 bg-slate-950 text-slate-100">
            <div className="w-full max-w-5xl flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                >
                    <span>←</span>
                    <span>Retour au Plateau</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href="/puzzles"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                    >
                        <span>🧩</span>
                        <span>Puzzles</span>
                    </Link>
                    <Link
                        href="/progression"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                    >
                        <span>📊</span>
                        <span>Progression</span>
                    </Link>
                </div>
            </div>

            <ErrorBoundary name="Drills de Blunders">
                <BlunderDrillView />
            </ErrorBoundary>
        </main>
    );
}
