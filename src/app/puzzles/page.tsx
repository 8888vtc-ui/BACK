import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DailyPuzzleScreen } from '../../components/puzzle/DailyPuzzleScreen';
import { BackToLobbyButton } from '../../components/nav/PageTransition';

export const metadata: Metadata = {
    title: 'Puzzles Quotidiens & Défis Tactiques 3-Ply',
    description:
        'Chaque jour, résolvez un puzzle tactique ou stratégique de backgammon certifié par le moteur neuronal Monte-Carlo 3-Ply. Mesurez votre série et progressez.',
};

export default function PuzzlesPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-3 sm:p-5 space-y-4 bg-slate-950 text-slate-100">
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
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm">
                        <span>🧩</span>
                        <span>Puzzles</span>
                    </span>
                    <Link
                        href="/progression"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        <span>📊</span>
                        <span>Progression</span>
                    </Link>
                </nav>
            </div>

            <DailyPuzzleScreen />
        </main>
    );
}
