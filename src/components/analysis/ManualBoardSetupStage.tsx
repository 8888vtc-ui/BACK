'use client';

/**
 * @file src/components/analysis/ManualBoardSetupStage.tsx
 * @description ÉTAPE 1 : « 1. Choisissez ou modifiez la position »
 * - Sources rapides à gauche : Scanner une Photo (IA) + Positions Clés ▾
 * - Outils d'édition du plateau à droite (0 emoji, vraies icônes Lucide 1.5px).
 * Strictement <= 180 lignes, 0 any.
 */

import React from 'react';
import { Camera, Eraser, Trash2, RotateCcw, ArrowUpDown, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { FAMOUS_PRESET_POSITIONS, type CheckerPlacementStats } from '../../lib/analysis/analysisStudioEngine';

export type BrushTool = 'white' | 'black' | 'remove';

export interface ManualBoardSetupStageProps {
    readonly stats: CheckerPlacementStats;
    readonly activeBrush: BrushTool;
    readonly onSelectBrush: (brush: BrushTool) => void;
    readonly onClearBoard: () => void;
    readonly onResetStartingBoard: () => void;
    readonly onCompleteRemainingToOff: () => void;
    readonly onInvertColors: () => void;
    readonly onOpenScanner?: () => void;
    readonly onSelectPreset?: (xgid: string, dice: [number, number], defaultMove?: string) => void;
}

export const ManualBoardSetupStage: React.FC<ManualBoardSetupStageProps> = ({
    stats,
    activeBrush,
    onSelectBrush,
    onClearBoard,
    onResetStartingBoard,
    onCompleteRemainingToOff,
    onInvertColors,
    onOpenScanner,
    onSelectPreset,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (!val) return;
        if (val === 'recent-blunders') {
            if (typeof window !== 'undefined') window.location.assign('/puzzles?filter=personal-blunders');
            return;
        }
        const found = FAMOUS_PRESET_POSITIONS.find((p) => p.xgid === val);
        if (found && onSelectPreset) {
            onSelectPreset(found.xgid, found.dice, found.name.includes('3-1') ? '8/5 6/5' : undefined);
        }
        e.target.value = '';
    };

    return (
        <div
            className="w-full flex flex-col gap-1.5 px-2.5 py-2 rounded-xl border border-white/[0.08] bg-[#070a10] shrink-0 select-none"
            data-testid="manual-board-setup-stage"
        >
            {/* Ligne de titre Étape 1 + Sources rapides */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
                        {isEn ? 'STEP 1' : 'ÉTAPE 1'}
                    </span>
                    <h2 className="text-xs sm:text-sm font-extrabold text-white">
                        {isEn ? '1. Choose or edit the position' : '1. Choisissez ou modifiez la position'}
                    </h2>
                </div>

                {/* Sources rapides : Scanner une Photo (IA) + Positions Clés ▾ */}
                <div className="flex items-center gap-1.5">
                    {onOpenScanner && (
                        <button
                            type="button"
                            data-testid="open-photo-scanner-btn"
                            onClick={onOpenScanner}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-zinc-100 hover:border-[#D4AF37]/50 hover:bg-white/[0.08] transition whitespace-nowrap"
                        >
                            <Camera className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>{isEn ? 'Scan a Photo (AI)' : 'Scanner une Photo (IA)'}</span>
                        </button>
                    )}

                    <select
                        data-testid="analysis-key-positions-select"
                        defaultValue=""
                        onChange={handlePresetSelect}
                        aria-label={isEn ? 'Key Positions' : 'Positions Clés'}
                        className="rounded-lg border border-white/15 bg-[#12151C] px-2.5 py-1 text-xs font-semibold text-zinc-200 hover:border-[#D4AF37]/50 focus:outline-none cursor-pointer"
                    >
                        <option value="" disabled>
                            {isEn ? 'Key Positions ▾' : 'Positions Clés ▾'}
                        </option>
                        {FAMOUS_PRESET_POSITIONS.map((p) => (
                            <option key={p.name} value={p.xgid}>
                                {isEn ? p.nameEn : p.name}
                            </option>
                        ))}
                        <option value="recent-blunders">
                            {isEn ? 'My Recent Blunders' : 'Mes Blunders Récents'}
                        </option>
                    </select>
                </div>
            </div>

            {/* Barre d'outils d'édition du plateau (1 ligne nette, 0 emoji) */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
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
                                ? 'border-emerald-400 bg-white text-black shadow-sm'
                                : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                        }`}
                    >
                        <span className="inline-block h-3 w-3 rounded-full bg-white border border-stone-400 shrink-0" />
                        <span>{isEn ? `Place White (${stats.whiteOnBoard}/15)` : `Poser Blanc (${stats.whiteOnBoard}/15)`}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="brush-black-btn"
                        onClick={() => onSelectBrush('black')}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold transition whitespace-nowrap ${
                            activeBrush === 'black'
                                ? 'border-[#D4AF37] bg-stone-900 text-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/50'
                                : 'border-white/15 bg-white/5 text-stone-200 hover:border-white/30'
                        }`}
                    >
                        <span className="inline-block h-3 w-3 rounded-full bg-stone-950 border border-white/40 shrink-0" />
                        <span>{isEn ? `Place Black (${stats.blackOnBoard}/15)` : `Poser Noir (${stats.blackOnBoard}/15)`}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="brush-remove-btn"
                        onClick={() => onSelectBrush('remove')}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition whitespace-nowrap ${
                            activeBrush === 'remove'
                                ? 'border-rose-400 bg-rose-500/20 text-rose-300'
                                : 'border-white/15 bg-white/5 text-stone-300 hover:border-white/30 hover:text-white'
                        }`}
                    >
                        <Eraser className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isEn ? 'Eraser' : 'Gomme'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                    <button
                        type="button"
                        data-testid="reset-starting-board-btn"
                        onClick={onResetStartingBoard}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-200 hover:border-[#D4AF37]/50 hover:text-white transition whitespace-nowrap"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={1.5} />
                        <span>{isEn ? 'Starting Pos' : 'Position de Départ'}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="clear-board-btn"
                        onClick={onClearBoard}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-rose-400/50 hover:text-rose-200 transition whitespace-nowrap"
                    >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isEn ? 'Clear' : 'Vider'}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="complete-to-off-btn"
                        onClick={onCompleteRemainingToOff}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-emerald-400/50 hover:text-emerald-200 transition whitespace-nowrap"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                        <span>{isEn ? 'Auto-Off' : 'Compléter'}</span>
                    </button>

                    <button
                        type="button"
                        data-testid="invert-colors-btn"
                        onClick={onInvertColors}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-white/30 hover:text-white transition whitespace-nowrap"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isEn ? 'Invert' : 'Inverser'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ManualBoardSetupStage);
