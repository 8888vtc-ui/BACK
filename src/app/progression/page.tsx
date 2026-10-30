import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressionDashboard from '../../components/stats/ProgressionDashboard';
import { BackToLobbyButton } from '../../components/nav/PageTransition';

export const metadata: Metadata = {
    title: 'Progression & Performance Rating (PR)',
    description:
        'Analyse du Performance Rating (PR), taux d’erreur Monte-Carlo 3-Ply et concepts stratégiques de backgammon à travailler.',
};

export default function ProgressionPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-4 md:p-8 space-y-6 bg-slate-950 text-slate-100">
            <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <nav aria-label="Modules d'entraînement" className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-1">
                    <Link
                        href="/drills"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <span>🎯</span>
                        <span>Drills</span>
                    </Link>
                    <Link
                        href="/puzzles"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <span>🧩</span>
                        <span>Puzzles</span>
                    </Link>
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm">
                        <span>📊</span>
                        <span>Progression</span>
                    </span>
                </nav>
            </div>
            <ProgressionDashboard />
        </main>
    );
}
