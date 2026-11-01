'use client';

/**
 * @file src/components/drills/DrillContextStrip.tsx
 * @description Bandeau horizontal ultra-compact d'une seule ligne pour `/drills` et `/puzzles` :
 * `Match X pts (Score) • Videau : X • Retard : X pips`
 *
 * Invariants Tesla 3-Secondes / Audit Elon Musk :
 * - ZÉRO doublon de `Jet à jouer : 6 5` (déjà visible sur le plateau).
 * - ZÉRO `Trait aux Blancs...` et ZÉRO `Course : Blanc 96 pips vs Noir 65 pips` (déjà sur la barre centrale).
 * - Strictement < 120 lignes, 0 `any`.
 */

import React, { useMemo } from 'react';
import type { PlayerBlunderRecord } from '../../features/drills/types';
import { computePositionTelemetry } from './DrillPositionContextAndReading';

export interface DrillContextStripProps {
    readonly currentBlunder: PlayerBlunderRecord;
    readonly currentIndex: number;
    readonly totalBlunders: number;
    readonly isErMode: boolean;
    readonly showHint: boolean;
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
    isErMode,
    showHint,
    onToggleHint,
    onResetAttempt,
}) => {
    const telemetry = useMemo(() => computePositionTelemetry(currentBlunder), [currentBlunder]);
    const tierInfo = TIER_LABELS[currentBlunder.tier ?? 1] ?? TIER_LABELS[1];

    return (
        <div className="flex flex-col gap-1.5">
            {/* Barre méta : Quiz #N + Palier + Concept + Indice / Réinitialiser */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-[#D4AF37]">
                        {isErMode ? `Quiz ER #${currentIndex + 1}` : `Quiz ERH #${currentIndex + 1}`}
                    </span>
                    <span className="sr-only">{totalBlunders}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                        {tierInfo.badge}
                    </span>
                    <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                            isErMode
                                ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                                : 'border-[#D4AF37]/40 bg-[#050505] text-[#D4AF37]'
                        }`}
                    >
                        {currentBlunder.conceptName}
                    </span>
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

            {/* Ligne unique ultra-compacte : Match X pts (Score) • Videau : X • Retard : X pips */}
            <div
                data-testid="drill-match-context-grid"
                className="flex items-center justify-between gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#050505] px-3 py-1.5 text-xs font-semibold"
            >
                <span className="truncate font-mono text-[#D4AF37]">{telemetry.singleLineContext}</span>
            </div>

            <span className="sr-only">
                Jet à jouer : {currentBlunder.dice[0]} {currentBlunder.dice[1]} — Erreur piégeuse à éviter : {currentBlunder.playedMove} (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
            </span>
        </div>
    );
};

export default React.memo(DrillContextStrip);

