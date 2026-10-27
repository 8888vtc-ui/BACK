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
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-3 sm:p-5 space-y-4 bg-[radial-gradient(ellipse_at_top,#1f120b_0%,#0b0e16_65%,#05070b_100%)] text-[#fdf8eb]">
            <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/academy"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span>🏛️</span>
                        <span>Gammon Academy</span>
                    </Link>
                    <Link
                        href="/drills"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span>🎯</span>
                        <span>Drills FSRS</span>
                    </Link>
                    <Link
                        href="/progression"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span>📊</span>
                        <span>Progression &amp; Concepts</span>
                    </Link>
                </div>
            </div>

            <DailyPuzzleScreen />
        </main>
    );
}
