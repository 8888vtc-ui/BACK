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
        className={`grid grid-cols-[1fr_auto_1fr_auto] items-center h-[15px] sm:h-[16px] [@media(max-height:540px)]:!h-[13px] [@media(max-height:540px)]:!py-0 px-1 sm:px-2.5 [@media(max-height:540px)]:!px-0.5 shrink-0 overflow-hidden ${
            padding === 'top' ? 'pb-0.5 sm:pb-0.5' : 'pt-0.5 sm:pt-0.5'
        }`}
    >
        <div className="grid grid-cols-6 min-w-0 gap-0">
            {row.slice(0, 6).map((p) => (
                <span
                    key={`num-${p}`}
                    className="text-[11px] sm:text-[13px] [@media(max-height:540px)]:!text-[11px] font-sans font-bold tabular-nums tracking-tight text-[#FFF8E7] drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] leading-none select-none min-w-0 text-center overflow-hidden"
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
                    className="text-[11px] sm:text-[13px] [@media(max-height:540px)]:!text-[11px] font-sans font-bold tabular-nums tracking-tight text-[#FFF8E7] drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)] leading-none select-none min-w-0 text-center overflow-hidden"
                >
                    {p}
                </span>
            ))}
        </div>
        <div className="w-7 sm:w-12 md:w-14 [@media(max-height:600px)]:!w-10 pl-0.5 ml-0.5 sm:pl-1 sm:ml-1 shrink-0 flex items-center justify-center" />
    </div>
);

export default BoardNumberRow;
