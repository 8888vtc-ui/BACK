import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import BlunderDrillView from '../../components/drills/BlunderDrillView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { BackToLobbyButton } from '../../components/nav/PageTransition';

export const metadata: Metadata = {
    title: 'Drills de Blunders & Rejeu des Erreurs',
    description:
        'Rejouez automatiquement vos erreurs passées jusqu’à trouver le coup optimal certifié par Monte-Carlo 3-Ply. Corrigez vos faiblesses stratégiques.',
};

export default function DrillsPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-3 sm:p-6 md:p-8 space-y-6 bg-slate-950 text-slate-100">
            <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <nav aria-label="Modules d'entraînement" className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-1">
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm">
                        <span>🎯</span>
                        <span>Drills</span>
                    </span>
                    <Link
                        href="/puzzles"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <span>🧩</span>
                        <span>Puzzles</span>
                    </Link>
                    <Link
                        href="/progression"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <span>📊</span>
                        <span>Progression</span>
                    </Link>
                </nav>
            </div>

            <ErrorBoundary name="Drills de Blunders">
                <BlunderDrillView />
            </ErrorBoundary>
        </main>
    );
}
