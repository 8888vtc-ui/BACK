'use client';

/**
 * @file src/components/analysis/ManualBoardSetupStage.tsx
 * @description Barre d'édition manuelle compacte h-10 en une seule ligne :
 * [⚪ Poser Blanc (X/15)] | [⚫ Poser Noir (Y/15)] | [🗑️ Gomme] | [🧹 Vider le plateau] | [♟️ Départ] | [✨ Compléter Sortie] | [🔄 Inverser].
 * Strictement <= 140 lignes, 0 any.
 */

import React from 'react';
import { Eraser, Trash2, RotateCcw, Sparkles, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from '../../i18n';
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
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    return (
        <div
            className="w-full h-10 flex items-center justify-between gap-1.5 px-2 rounded-xl border border-white/10 bg-[#070a10] shrink-0 select-none overflow-x-auto scrollbar-none"
            data-testid="manual-board-setup-stage"
        >
            {/* Pinceaux de pose avec compteurs intégrés */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span data-testid="white-checker-tray" className="sr-only">
                    {15 - stats.whiteOnBoard} / 15 {isEn ? 'available' : 'disponibles'}
                </span>
                <span data-testid="black-checker-tray" className="sr-only">
                    {15 - stats.blackOnBoard} / 15 {isEn ? 'available' : 'disponibles'}
                </span>
                <button
                    type="button"
                    data-testid="brush-white-btn"
                    onClick={() => onSelectBrush('white')}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold transition whitespace-nowrap ${
                        activeBrush === 'white'
                            ? 'border-emerald-400 bg-white text-black shadow-md'
                            : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                    }`}
                >
                    <span className="inline-block h-3 w-3 rounded-full bg-white border border-stone-400 shadow-sm shrink-0" />
                    <span>{isEn ? `Place White (${stats.whiteOnBoard}/15)` : `Poser Blanc (${stats.whiteOnBoard}/15)`}</span>
                </button>

                <button
                    type="button"
                    data-testid="brush-black-btn"
                    onClick={() => onSelectBrush('black')}
                    className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold transition whitespace-nowrap ${
                        activeBrush === 'black'
                            ? 'border-[#D4AF37] bg-stone-900 text-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/50'
                            : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                    }`}
                >
                    <span className="inline-block h-3 w-3 rounded-full bg-stone-950 border border-white/40 shadow-sm shrink-0" />
                    <span>{isEn ? `Place Black (${stats.blackOnBoard}/15)` : `Poser Noir (${stats.blackOnBoard}/15)`}</span>
                </button>

                <button
                    type="button"
                    data-testid="brush-remove-btn"
                    onClick={() => onSelectBrush('remove')}
                    className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition whitespace-nowrap ${
                        activeBrush === 'remove'
                            ? 'border-rose-400 bg-rose-500/20 text-rose-300 shadow-md'
                            : 'border-white/15 bg-white/5 text-stone-400 hover:border-white/30 hover:text-stone-200'
                    }`}
                    title={isEn ? 'Eraser: remove a checker on click' : 'Gomme : retire un pion au clic sur une flèche'}
                >
                    <Eraser className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{isEn ? 'Eraser' : 'Gomme'}</span>
                </button>
            </div>

            {/* Actions rapides de tablier */}
            <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <button
                    type="button"
                    data-testid="clear-board-btn"
                    onClick={onClearBoard}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-bold text-stone-300 hover:border-rose-400/50 hover:text-rose-200 transition whitespace-nowrap"
                    title={isEn ? 'Clear all 24 points' : 'Vider les 24 flèches pour poser vos pions un par un'}
                >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{isEn ? 'Clear Board' : 'Vider le plateau'}</span>
                </button>

                <button
                    type="button"
                    data-testid="reset-starting-board-btn"
                    onClick={onResetStartingBoard}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-bold text-stone-300 hover:border-[#D4AF37] hover:text-white transition whitespace-nowrap"
                    title={isEn ? 'Standard starting position' : 'Position initiale standard de tournoi'}
                >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{isEn ? 'Start Pos' : 'Départ'}</span>
                </button>

                <button
                    type="button"
                    data-testid="complete-to-off-btn"
                    onClick={onCompleteRemainingToOff}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-900 transition whitespace-nowrap"
                    title={isEn ? 'Auto-complete remaining checkers to bear-off' : 'Place automatiquement les pions restants en sortie'}
                >
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{isEn ? 'Complete Off' : 'Compléter Sortie'}</span>
                </button>

                <button
                    type="button"
                    data-testid="invert-colors-btn"
                    onClick={onInvertColors}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-white/30 transition whitespace-nowrap"
                    title={isEn ? 'Invert checker colors' : 'Inverser les couleurs'}
                >
                    <ArrowLeftRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{isEn ? 'Invert' : 'Inverser'}</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(ManualBoardSetupStage);
