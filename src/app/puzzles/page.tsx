import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import DailyPuzzleView from '../../components/puzzles/DailyPuzzleView';

export const metadata: Metadata = {
    title: 'Puzzles Quotidiens & Défis Tactiques | Backgammon Coach',
    description: 'Chaque jour, résolvez un puzzle tactique ou stratégique de backgammon certifié par le moteur GNUBG. Mesurez votre série et progressez.',
};

export default function PuzzlesPage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-3 sm:p-6 md:p-8 space-y-6">
            <div className="w-full max-w-6xl flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                >
                    <span>←</span>
                    <span>Retour au Plateau Principal</span>
                </Link>

                <Link
                    href="/progression"
                    className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition shadow-sm"
                >
                    <span>📊</span>
                    <span>Progression &amp; Concepts</span>
                </Link>
            </div>

            <DailyPuzzleView />
        </main>
    );
}
