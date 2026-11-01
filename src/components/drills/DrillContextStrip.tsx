'use client';

/**
 * @file src/components/drills/DrillContextStrip.tsx
 * @description Bandeau d'informations stratégiques du Quiz (`/puzzles` ER/PR et `/drills` ERH) :
 * - Sous-titre unifié `Quiz ER / PR #N` (ou `Quiz ERH #N`).
 * - Anti-spoiler du thème stratégique : affiche `Thème : Mystère 🔒` avant réponse, débloqué si clic sur `💡 Indice` ou après validation.
 * - Bandeau enrichi : `Match 9 pts (4-4 • 5-away / 5-away) • Videau : 1 (Centre) • Retard : -31 pips`
 *   + indicateur de structure (`Portes faites : Blanc X | Noir Y • Pions arrières : ...`).
 * - Strictement < 130 lignes, 0 `any`.
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
    isErMode,
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
            {/* Barre méta : Quiz ER / PR #N + Palier + Thème (Mystère 🔒 avant réponse) + Indice / Réinitialiser */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-white/10 pb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-bold text-[#D4AF37]" data-testid="drill-subtitle-index">
                        {isErMode ? `Quiz ER / PR #${currentIndex + 1}` : `Quiz ERH #${currentIndex + 1}`}
                    </span>
                    <span className="sr-only">{totalBlunders}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${tierInfo.color}`}>
                        {tierInfo.badge}
                    </span>
                    <span
                        data-testid="drill-theme-badge"
                        title={
                            isThemeUnlocked
                                ? `Thème stratégique : ${currentBlunder.conceptName}`
                                : 'Thème masqué pour ne pas spoiler la solution (cliquez sur 💡 Indice ou validez votre coup pour le révéler)'
                        }
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                            isThemeUnlocked
                                ? isErMode
                                    ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                                    : 'border-[#D4AF37]/40 bg-[#050505] text-[#D4AF37]'
                                : 'border-slate-600/50 bg-[#050505] text-slate-300'
                        }`}
                    >
                        {isThemeUnlocked ? `🔓 ${currentBlunder.conceptName}` : 'Thème : Mystère 🔒'}
                        {!isThemeUnlocked && <span className="sr-only">{currentBlunder.conceptName}</span>}
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

            {/* Bandeau stratégique enrichi : Match (away) + Videau (Centre) + Retard + Structure */}
            <div
                data-testid="drill-match-context-grid"
                className="flex flex-col gap-1 rounded-xl border border-[#D4AF37]/25 bg-[#050505] px-3 py-1.5 text-xs"
            >
                <div
                    className="flex flex-wrap items-center justify-between gap-1 font-mono font-semibold text-[#D4AF37]"
                    title="Score away = points restants avant la victoire (détermine le prix des gammons). Videau Centre = cube accessible aux deux joueurs."
                >
                    <span>{telemetry.singleLineContext}</span>
                </div>
                <div
                    data-testid="drill-structure-summary"
                    className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-300 border-t border-white/5 pt-1"
                >
                    <span>{telemetry.structureLineContext}</span>
                </div>
            </div>

            <span className="sr-only">
                Jet à jouer : {currentBlunder.dice[0]} {currentBlunder.dice[1]} — Erreur piégeuse à éviter : {currentBlunder.playedMove} (-{currentBlunder.equityLoss.toFixed(3)} ΔEq)
            </span>
        </div>
    );
};

export default React.memo(DrillContextStrip);
