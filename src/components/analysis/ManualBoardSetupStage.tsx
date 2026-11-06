'use client';

/**
 * @file src/components/analysis/ManualBoardSetupStage.tsx
 * @description Barre d'édition manuelle compacte h-10 en une seule ligne :
 * [⚪ Poser Blanc (X/15)] | [⚫ Poser Noir (Y/15)] | [🗑️ Gomme] | [🧹 Vider le plateau] | [♟️ Départ] | [✨ Compléter Sortie] | [🔄 Inverser].
 * Strictement <= 140 lignes, 0 any.
 */

import React from 'react';
import type { CheckerPlacementStats } from '../../lib/analysis/analysisStudioEngine';

export type BrushTool = 'white' | 'black' | 'remove';

export interface ManualBoardSetupStageProps {
    readonly stats: CheckerPlacementStats;
    readonly activeBrush: BrushTool;
    readonly onSelectBrush: (brush: BrushTool) => void;
    readonly onClearBoard: () => void;
    readonly onResetStartingBoard: () => void;
    readonly onCompleteRemainingToOff: () => void;
    readonly onInvertColors: () => void;
}

export const ManualBoardSetupStage: React.FC<ManualBoardSetupStageProps> = ({
    stats,
    activeBrush,
    onSelectBrush,
    onClearBoard,
    onResetStartingBoard,
    onCompleteRemainingToOff,
    onInvertColors,
}) => {
    return (
        <div
            className="w-full h-10 flex items-center justify-between gap-1.5 px-2 rounded-xl border border-white/10 bg-[#070a10] shrink-0 select-none overflow-x-auto scrollbar-none"
            data-testid="manual-board-setup-stage"
        >
            {/* Pinceaux de pose avec compteurs intégrés */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span data-testid="white-checker-tray" className="sr-only">
                    {15 - stats.whiteOnBoard} / 15 disponibles
                </span>
                <span data-testid="black-checker-tray" className="sr-only">
                    {15 - stats.blackOnBoard} / 15 disponibles
                </span>
                <button
                    type="button"
                    data-testid="brush-white-btn"
                    onClick={() => onSelectBrush('white')}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        activeBrush === 'white'
                            ? 'border-emerald-400 bg-white text-black shadow-md'
                            : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                    }`}
                >
                    <span className="inline-block h-3 w-3 rounded-full bg-white border border-stone-400 shadow-sm" />
                    <span>Poser Blanc ({stats.whiteOnBoard}/15)</span>
                </button>

                <button
                    type="button"
                    data-testid="brush-black-btn"
                    onClick={() => onSelectBrush('black')}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                        activeBrush === 'black'
                            ? 'border-[#D4AF37] bg-stone-900 text-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/50'
                            : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                    }`}
                >
                    <span className="inline-block h-3 w-3 rounded-full bg-stone-950 border border-white/40 shadow-sm" />
                    <span>Poser Noir ({stats.blackOnBoard}/15)</span>
                </button>

                <button
                    type="button"
                    data-testid="brush-remove-btn"
                    onClick={() => onSelectBrush('remove')}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition ${
                        activeBrush === 'remove'
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300 shadow-md'
                            : 'border-white/15 bg-white/5 text-stone-400 hover:border-white/30 hover:text-stone-200'
                    }`}
                    title="Gomme : retire un pion au clic sur une flèche"
                >
                    <span>🗑️ Gomme</span>
                </button>
            </div>

            {/* Actions rapides de tablier */}
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <button
                    type="button"
                    data-testid="clear-board-btn"
                    onClick={onClearBoard}
                    className="rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-bold text-stone-300 hover:border-rose-400/50 hover:text-rose-200 transition"
                    title="Vider les 24 flèches pour poser vos pions un par un"
                >
                    🧹 Vider le plateau
                </button>

                <button
                    type="button"
                    data-testid="reset-starting-board-btn"
                    onClick={onResetStartingBoard}
                    className="rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-bold text-stone-300 hover:border-[#D4AF37] hover:text-white transition"
                    title="Position initiale standard de tournoi"
                >
                    ♟️ Départ
                </button>

                <button
                    type="button"
                    data-testid="complete-to-off-btn"
                    onClick={onCompleteRemainingToOff}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-900 transition"
                    title="Place automatiquement les pions restants en sortie"
                >
                    ✨ Compléter Sortie
                </button>

                <button
                    type="button"
                    data-testid="invert-colors-btn"
                    onClick={onInvertColors}
                    className="rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-white/30 transition"
                    title="Inverser les couleurs"
                >
                    🔄 Inverser
                </button>
            </div>
        </div>
    );
};

export default React.memo(ManualBoardSetupStage);
