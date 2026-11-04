'use client';

/**
 * @file src/components/drills/DrillContextStrip.tsx
 * @description Bandeau d'informations stratégiques épuré du Quiz (`Quiz ER / PR`) :
 * - Sous-titre unifié `Quiz ER / PR #N`.
 * - Masquage du badge de thème avant que le joueur ait cliqué pour ne pas lui souffler la réponse.
 * - 1 seule ligne de contexte stratégique : `Match 9 pts (4-4 • 5-away / 5-away) • Videau : 1 (Centre) • Retard : -31 pips`.
 * - Strictement < 120 lignes, 0 `any`.
 */

import React, { useMemo } from 'react';
import type { PlayerBlunderRecord } from '../../features/drills/types';
import { computePositionTelemetry } from './DrillPositionContextAndReading';

export interface DrillContextStripProps {
    readonly currentBlunder: PlayerBlunderRecord;
    readonly currentIndex: number;
    readonly totalBlunders: number;
    readonly isErMode?: boolean;
    readonly showHint: boolean;
    readonly isRevealed?: boolean;
    readonly onToggleHint: () => void;
    readonly onResetAttempt: () => void;
}

const TIER_LABELS: Record<number, { badge: string; color: string }> = {
    1: { badge: '🌱 Palier 1 · Débutant', color: 'border-emerald-500/40 bg-emerald-950/70 text-emerald-200' },
    2: { badge: '⚔️ Palier 2 · Intermédiaire', color: 'border-amber-500/40 bg-amber-950/70 text-amber-200' },
    3: { badge: '🏆 Palier 3 · Club', color: 'border-sky-500/40 bg-sky-950/70 text-sky-200' },
    4: { badge: '👑 Palier 4 · Grand-Maître', color: 'border-purple-500/40 bg-purple-950/70 text-purple-200' },
};

export const DrillContextStrip: React.FC<DrillContextStripProps> = ({
    currentBlunder,
    currentIndex,
    totalBlunders,
    showHint,
    isRevealed = false,
    onToggleHint,
    onResetAttempt,
}) => {
    const telemetry = useMemo(() => computePositionTelemetry(currentBlunder), [currentBlunder]);
    const tierInfo = TIER_LABELS[currentBlunder.tier ?? 1] ?? TIER_LABELS[1];
    const isThemeUnlocked = showHint || isRevealed;

    return (
        <div className="flex flex-col gap-1.5">
            {/* Barre méta : Quiz ER / PR #N + Palier + Thème (masqué avant clic) + Indice / Réinitialiser */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-[#D4AF37]" data-testid="drill-subtitle-index">
                        {`Quiz ER / PR #${currentIndex + 1}`}
                    </span>
                    <span className="sr-only">{totalBlunders}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                        {tierInfo.badge}
                    </span>
                    {isThemeUnlocked ? (
                        <span
                            data-testid="drill-theme-badge"
                            title={`Thème stratégique : ${currentBlunder.conceptName}`}
                            className="rounded border border-emerald-500/40 bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200"
                        >
                            🔓 {currentBlunder.conceptName}
                        </span>
                    ) : (
                        <span data-testid="drill-theme-badge" className="sr-only">
                            Thème : Mystère 🔒
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[11px]">
                    <button
                        type="button"
                        onClick={onToggleHint}
                        data-testid="drill-hint-toggle"
                        className="rounded-lg border border-white/10 bg-[#050505] px-2 py-0.5 text-[11px] font-bold text-[#D4AF37] hover:border-[#D4AF37]/50 transition"
                    >
                        💡 {showHint ? 'Masquer' : 'Indice'}
                    </button>
                    <button
                        type="button"
                        onClick={onResetAttempt}
                        data-testid="drill-reset-btn"
                        className="rounded-lg border border-white/10 bg-[#050505] px-2 py-0.5 text-[11px] font-semibold text-[#e2d2b5] hover:border-white/25 transition"
                    >
                        ↺ Réinitialiser
                    </button>
                </div>
            </div>

            {/* 1 seule ligne de contexte stratégique (Zéro sous-ligne verbeuse "Portes faites...") */}
            <div
                data-testid="drill-match-context-grid"
                className="flex items-center justify-between gap-1 rounded-xl border border-[#D4AF37]/25 bg-[#050505] px-3 py-1.5 text-xs font-mono font-semibold text-[#D4AF37]"
                title="Score away = points restants avant la victoire (détermine le prix des gammons). Videau Centre = cube accessible aux deux joueurs."
            >
                <span>{telemetry.singleLineContext}</span>
            </div>

            <span data-testid="drill-structure-summary" className="sr-only">
                {telemetry.structureLineContext}
            </span>
        </div>
    );
};

export default React.memo(DrillContextStrip);
