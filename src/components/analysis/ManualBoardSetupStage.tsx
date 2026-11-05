'use client';

/**
 * @file src/components/analysis/ManualBoardSetupStage.tsx
 * @description Éditeur Visuel du Studio d'Analyse :
 * - Réserves latérales de 15 dames Blanches et 15 dames Noires,
 * - Outils rapides : Vider, Position de départ, Ranger le reste dans la sortie, Inverser,
 * - Sélecteur de pinceau (⚪ Blanc / ⚫ Noir / 🗑️ Retirer).
 * Strictement <= 280 lignes, 0 any.
 */

import React from 'react';
import type { TrayCount, CheckerPlacementStats } from '../../lib/analysis/analysisStudioEngine';

export type BrushTool = 'white' | 'black' | 'remove';

export interface ManualBoardSetupStageProps {
    readonly tray: TrayCount;
    readonly stats: CheckerPlacementStats;
    readonly activeBrush: BrushTool;
    readonly onSelectBrush: (brush: BrushTool) => void;
    readonly onClearBoard: () => void;
    readonly onResetStartingBoard: () => void;
    readonly onCompleteRemainingToOff: () => void;
    readonly onInvertColors: () => void;
    readonly onOpenScannerModal: () => void;
}

export const ManualBoardSetupStage: React.FC<ManualBoardSetupStageProps> = ({
    tray,
    stats,
    activeBrush,
    onSelectBrush,
    onClearBoard,
    onResetStartingBoard,
    onCompleteRemainingToOff,
    onInvertColors,
    onOpenScannerModal,
}) => {
    return (
        <div className="w-full flex flex-col gap-2 shrink-0" data-testid="manual-board-setup-stage">
            {/* 1. Réserves Latérales et Bouton Scanner Photo */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0B1015] p-2">
                {/* Réserves de Dames */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div
                        data-testid="white-checker-tray"
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-2.5 py-1"
                        title="Dames blanches disponibles dans la réserve"
                    >
                        <span className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow" />
                        <span className="font-bold text-white">Réserve Blancs :</span>
                        <span className="font-mono font-black text-emerald-300">
                            {tray.white} / 15 disponibles
                        </span>
                    </div>

                    <div
                        data-testid="black-checker-tray"
                        className="flex items-center gap-1.5 rounded-lg border border-stone-500/40 bg-stone-900/60 px-2.5 py-1"
                        title="Dames noires disponibles dans la réserve"
                    >
                        <span className="inline-block h-3.5 w-3.5 rounded-full bg-stone-950 border border-white/30 shadow" />
                        <span className="font-bold text-stone-200">Réserve Noirs :</span>
                        <span className="font-mono font-black text-amber-300">
                            {tray.black} / 15 disponibles
                        </span>
                    </div>
                </div>

                {/* Bouton Scanner Photo IA Vision */}
                <button
                    type="button"
                    data-testid="open-photo-scanner-btn"
                    onClick={onOpenScannerModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-3 py-1 text-xs font-black uppercase text-[#1a0f08] shadow hover:brightness-105 transition"
                >
                    <span>📸 Scanner une Photo de Plateau (Vision IA)</span>
                </button>
            </div>

            {/* 2. Barre d'Outils et Sélecteur de Pinceau */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#070a10] px-2.5 py-1.5">
                {/* Pinceaux de pose */}
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-bold text-stone-400 uppercase">Outil :</span>
                    <button
                        type="button"
                        data-testid="brush-white-btn"
                        onClick={() => onSelectBrush('white')}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold transition ${
                            activeBrush === 'white'
                                ? 'border-emerald-400 bg-white text-black shadow'
                                : 'border-white/15 bg-white/5 text-stone-300 hover:border-white/30'
                        }`}
                    >
                        ⚪ Poser Blanc
                    </button>
                    <button
                        type="button"
                        data-testid="brush-black-btn"
                        onClick={() => onSelectBrush('black')}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold transition ${
                            activeBrush === 'black'
                                ? 'border-[#D4AF37] bg-stone-900 text-[#D4AF37] shadow'
                                : 'border-white/15 bg-white/5 text-stone-300 hover:border-white/30'
                        }`}
                    >
                        ⚫ Poser Noir
                    </button>
                    <button
                        type="button"
                        data-testid="brush-remove-btn"
                        onClick={() => onSelectBrush('remove')}
                        className={`rounded-lg border px-2 py-1 text-xs font-bold transition ${
                            activeBrush === 'remove'
                                ? 'border-rose-400 bg-rose-500/20 text-rose-300 shadow'
                                : 'border-white/15 bg-white/5 text-stone-300 hover:border-white/30'
                        }`}
                    >
                        🗑️ Retirer
                    </button>
                </div>

                {/* Actions rapides de tablier */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <button
                        type="button"
                        data-testid="clear-board-btn"
                        onClick={onClearBoard}
                        className="rounded-lg border border-white/15 bg-[#12151C] px-2.5 py-1 text-[11px] font-bold text-stone-300 hover:border-rose-400/50 hover:text-rose-200 transition"
                        title="Retire tous les pions et remplit les réserves de 15 Blancs et 15 Noirs"
                    >
                        🧹 Vider le plateau
                    </button>

                    <button
                        type="button"
                        data-testid="reset-starting-board-btn"
                        onClick={onResetStartingBoard}
                        className="rounded-lg border border-white/15 bg-[#12151C] px-2.5 py-1 text-[11px] font-bold text-stone-300 hover:border-[#D4AF37] hover:text-white transition"
                        title="Position initiale standard de tournoi"
                    >
                        ♟️ Position de départ
                    </button>

                    <button
                        type="button"
                        data-testid="complete-to-off-btn"
                        onClick={onCompleteRemainingToOff}
                        className="rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-900 transition"
                        title="Place automatiquement les pions restants de la réserve dans les sabots de Sortie"
                    >
                        ✨ Ranger le reste en Sortie
                    </button>

                    <button
                        type="button"
                        data-testid="invert-colors-btn"
                        onClick={onInvertColors}
                        className="rounded-lg border border-white/15 bg-[#12151C] px-2 py-1 text-[11px] font-semibold text-stone-300 hover:border-white/30 transition"
                        title="Inverser les couleurs et le point de vue"
                    >
                        🔄 Inverser
                    </button>
                </div>
            </div>

            {/* 3. Statut de Placement & Indication Temps Réel */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-mono">
                <div>
                    Pions placés sur le tablier :{' '}
                    <span className="font-bold text-white">⚪ {stats.whiteOnBoard}/15</span>
                    {' · '}
                    <span className="font-bold text-amber-200">⚫ {stats.blackOnBoard}/15</span>
                    {stats.whiteOff > 0 || stats.blackOff > 0 ? (
                        <span className="text-emerald-400 font-semibold">
                            {' '}(Sortis : ⚪ {stats.whiteOff} · ⚫ {stats.blackOff})
                        </span>
                    ) : null}
                </div>
                {!stats.isComplete15 && (
                    <span className="text-amber-300 font-bold animate-pulse">
                        💡 Cliquez sur « Ranger le reste en Sortie » ou placez tous les pions avant d&apos;analyser
                    </span>
                )}
            </div>
        </div>
    );
};

export default React.memo(ManualBoardSetupStage);

