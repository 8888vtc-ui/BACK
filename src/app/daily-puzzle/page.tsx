'use client';

/**
 * Route App Router `/daily-puzzle` — Puzzle du Jour, Streaks, Validation Open Sage 3T & FSRS.
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), bordures épurées border-white/10,
 * objectif, validation et verdict visibles au premier coup d'œil sans scroller.
 */

import React from 'react';
import Link from 'next/link';
import { BackToLobbyButton } from '../../components/nav/PageTransition';
import { DailyPuzzleScreen } from '../../components/puzzle/DailyPuzzleScreen';

export default function DailyPuzzlePage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-2 sm:p-3 space-y-2 bg-[radial-gradient(ellipse_at_top,#241109_0%,#0b0e16_65%,#05070b_100%)] text-[#fdf8eb]">
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
