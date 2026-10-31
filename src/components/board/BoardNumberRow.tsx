'use client';

/**
 * Bordure de numérotation du plateau (13..24 en haut, 12..1 en bas) — Gravure sur Laiton & Noyer.
 */

import React from 'react';

export interface BoardNumberRowProps {
    /** 12 numéros de la rangée (ordre gauche → droite). */
    row: number[];
    /** Espacement vertical : 'top' (pb-1) ou 'bottom' (pt-1). */
    padding: 'top' | 'bottom';
    /** Bouton d'inversion d'orientation (affiché uniquement en haut). */
    onToggleOrientation?: () => void;
}

export const BoardNumberRow: React.FC<BoardNumberRowProps> = ({
    row,
    padding,
    onToggleOrientation,
}) => (
    <div
        className={`grid grid-cols-[1fr_auto_1fr_auto] items-center h-[16px] sm:h-auto [@media(max-height:500px)]:!h-[10px] [@media(max-height:500px)]:!py-0 px-1 sm:px-2.5 [@media(max-height:500px)]:!px-0.5 shrink-0 ${
            padding === 'top' ? 'pb-0.5 sm:pb-1' : 'pt-0.5 sm:pt-1'
        }`}
    >
        <div className="grid grid-cols-6 min-w-0 gap-0">
            {row.slice(0, 6).map((p) => (
                <span
                    key={`num-${p}`}
                    className="text-[10px] sm:text-xs [@media(max-height:500px)]:!text-[8px] font-sans font-bold tabular-nums tracking-normal text-slate-300 leading-none select-none min-w-0 text-center overflow-hidden"
                >
                    {p}
                </span>
            ))}
        </div>
        <div className="w-8 sm:w-12 md:w-14 [@media(max-height:600px)]:!w-9 shrink-0" />
        <div className="grid grid-cols-6 min-w-0 gap-0">
            {row.slice(6).map((p) => (
                <span
                    key={`num-${p}`}
                    className="text-[10px] sm:text-xs [@media(max-height:500px)]:!text-[8px] font-sans font-bold tabular-nums tracking-normal text-slate-300 leading-none select-none min-w-0 text-center overflow-hidden"
                >
                    {p}
                </span>
            ))}
        </div>
        <div className="w-7 sm:w-12 md:w-14 [@media(max-height:600px)]:!w-8 pl-0.5 ml-0.5 sm:pl-1 sm:ml-1 shrink-0 flex items-center justify-center">
            {onToggleOrientation && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleOrientation();
                    }}
                    aria-label="Inverser l'orientation du plateau"
                    title="Inverser l'orientation (sortie à gauche ou à droite)"
                    data-testid="orientation-toggle"
                    className="[@media(max-height:500px)]:hidden px-1.5 py-0.5 rounded-md bg-[#1c0e06]/90 border border-[#d4af37]/45 text-[#f3c65f] hover:border-[#f3c65f] hover:text-white text-[10px] sm:text-xs font-serif font-bold shadow-inner transition-colors shrink-0"
                >
                    ⇄
                </button>
            )}
        </div>
    </div>
);

export default BoardNumberRow;
