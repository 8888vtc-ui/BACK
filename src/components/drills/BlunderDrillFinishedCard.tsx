'use client';

/**
 * @file src/components/drills/BlunderDrillFinishedCard.tsx
 * @description Carte affichée lors de la complétion du parcours d'entraînement adaptatif (< 50 lignes, 0 any).
 */

import React from 'react';
import Link from 'next/link';

export interface BlunderDrillFinishedCardProps {
    readonly xp: number;
    readonly onResetCycle: () => void;
}

export const BlunderDrillFinishedCard: React.FC<BlunderDrillFinishedCardProps> = React.memo(({
    xp,
    onResetCycle,
}) => {
    return (
        <div className="w-full m-auto max-w-md rounded-2xl border border-white/10 bg-[#12151C] p-6 text-center shadow-2xl space-y-3">
            <h2 className="text-lg font-black text-[#fdf8eb]">Parcours terminé ! (+{xp} XP)</h2>
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <button
                    type="button"
                    onClick={onResetCycle}
                    className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] shadow-md transition hover:brightness-105"
                >
                    Nouveau cycle adaptatif
                </button>
                <Link
                    href="/progression"
                    className="rounded-xl border border-white/10 bg-[#150c07] px-4 py-2 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition"
                >
                    Voir ma progression
                </Link>
            </div>
        </div>
    );
});

BlunderDrillFinishedCard.displayName = 'BlunderDrillFinishedCard';
export default BlunderDrillFinishedCard;
