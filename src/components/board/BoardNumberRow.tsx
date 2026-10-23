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
        className={`grid grid-cols-[1fr_auto_1fr_auto] items-center px-1 sm:px-2.5 shrink-0 ${
            padding === 'top' ? 'pb-0.5 sm:pb-1' : 'pt-0.5 sm:pt-1'
        }`}
    >
        <div className="flex min-w-0">
            {row.slice(0, 6).map((p) => (
                <span
                    key={`num-${p}`}
                    className="text-[10px] sm:text-xs font-serif font-bold tracking-wider text-[#f3c65f]/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] select-none flex-1 min-w-0 text-center"
                >
                    {p}
                </span>
            ))}
        </div>
        <div className="w-8 sm:w-14 md:w-20 mx-0.5 sm:mx-1 shrink-0" />
        <div className="flex min-w-0">
            {row.slice(6).map((p) => (
                <span
                    key={`num-${p}`}
                    className="text-[10px] sm:text-xs font-serif font-bold tracking-wider text-[#f3c65f]/85 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] select-none flex-1 min-w-0 text-center"
                >
                    {p}
                </span>
            ))}
        </div>
        <div className="w-9 sm:w-14 md:w-20 pl-1 ml-0.5 sm:pl-1.5 sm:ml-1 shrink-0 flex items-center justify-center">
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
                    className="px-1.5 py-0.5 rounded-md bg-[#1c0e06]/90 border border-[#d4af37]/45 text-[#f3c65f] hover:border-[#f3c65f] hover:text-white text-[10px] sm:text-xs font-serif font-bold shadow-inner transition-colors shrink-0"
                >
                    ⇄
                </button>
            )}
        </div>
    </div>
);

export default BoardNumberRow;
