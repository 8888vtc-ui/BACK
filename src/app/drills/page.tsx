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
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-3 sm:p-6 md:p-8 space-y-6 bg-[radial-gradient(ellipse_at_top,#1f120b_0%,#0b0e16_65%,#05070b_100%)] text-[#fdf8eb]">
            <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/academy"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🏛️</span>
                        <span>Gammon Academy</span>
                    </Link>
                    <Link
                        href="/puzzles"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">🧩</span>
                        <span>Puzzles</span>
                    </Link>
                    <Link
                        href="/progression"
                        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#150c07]/90 px-3.5 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-[#fdf8eb] transition shadow-sm"
                    >
                        <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">📊</span>
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
