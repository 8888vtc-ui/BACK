import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressionDashboard from '../../components/stats/ProgressionDashboard';
import { BackToLobbyButton } from '../../components/nav/PageTransition';

export const metadata: Metadata = {
    title: 'Progression & Performance Rating (PR) | Backgammon Tour',
    description:
        'Analyse du Performance Rating (PR), taux d’erreur Open Sage 3-Ply et concepts stratégiques de backgammon à travailler.',
};

export default function ProgressionPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-4 md:p-8 space-y-6 bg-[radial-gradient(ellipse_at_top,#1f120b_0%,#0b0e16_65%,#05070b_100%)] text-[#fdf8eb]">
            <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/academy"
                        className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-[#f3c65f] hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🏛️</span>
                        <span>Gammon Academy</span>
                    </Link>
                    <Link
                        href="/puzzles"
                        className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-[#f3c65f] hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🧩</span>
                        <span>Puzzles Quotidiens</span>
                    </Link>
                    <Link
                        href="/drills"
                        className="flex items-center gap-1.5 rounded-xl border border-[#d4af37]/30 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-[#f3c65f] hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🎯</span>
                        <span>Drills de Blunders</span>
                    </Link>
                </div>
            </div>
            <ProgressionDashboard />
        </main>
    );
}
