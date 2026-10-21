'use client';

/**
 * Bordure de numérotation du plateau (13..24 en haut, 12..1 en bas).
 *
 * Rôle :
 *   Isole la rangée de chiffres hors de `Board.tsx` (LOI 5). Affiche
 *   optionnellement le bouton de bascule d'orientation (rangée du haut
 *   uniquement).
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le JSX dans `Board.tsx`.
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
        className={`flex items-center justify-center gap-0 px-1 shrink-0 ${padding === 'top' ? 'pb-1' : 'pt-1'
            }`}
    >
        {onToggleOrientation ? (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleOrientation();
                }}
                aria-label="Inverser l'orientation du plateau"
                title="Inverser l'orientation (sortie à gauche ou à droite)"
                data-testid="orientation-toggle"
                className="mr-1 px-1.5 py-0.5 rounded bg-slate-900/70 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors shrink-0"
            >
                ⇄
            </button>
        ) : (
            <div className="w-8 shrink-0 mr-1" />
        )}
        <div className="flex flex-1 items-center min-w-0">
            <div className="flex flex-1 justify-around min-w-0">
                {row.slice(0, 6).map((p) => (
                    <span
                        key={`num-${p}`}
                        className="text-[9px] sm:text-[11px] font-mono text-amber-200/75 select-none flex-1 min-w-0 text-center"
                    >
                        {p}
                    </span>
                ))}
            </div>
            <div className="w-8 sm:w-16 md:w-20 shrink-0 mx-1" />
            <div className="flex flex-1 justify-around min-w-0">
                {row.slice(6).map((p) => (
                    <span
                        key={`num-${p}`}
                        className="text-[9px] sm:text-[11px] font-mono text-amber-200/75 select-none flex-1 min-w-0 text-center"
                    >
                        {p}
                    </span>
                ))}
            </div>
        </div>
        <div className="w-8 sm:w-16 md:w-20 shrink-0" />
    </div>
);

export default BoardNumberRow;
