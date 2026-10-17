'use client';

/**
 * Pion 3D concave — style Crisloid / Hector Saxe.
 *
 * Rendu d'un pion de backgammon en résine nacrée avec un creux central concave
 * (finger-dish) à lumière inversée. Affiche un badge numérique sur le 5ème pion
 * lorsque la pile dépasse 5 pions.
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et ses usages dans `BoardPoint` / `BarSection`.
 */

import React from 'react';
import type { CheckerColor } from './boardTypes';

export interface CheckerProps {
    /** Couleur du pion : blanc (X) ou noir (O). */
    color: CheckerColor;
    /** Affiche 6, 7, 8... sur le 5ème pion si la pile > 5. */
    countBadge?: number;
    /** Active le curseur et l'effet de survol (pion jouable). */
    isPlayable?: boolean;
    /** Pion « du dessus » de la pile (reçoit l'effet de survol). */
    isTopChecker?: boolean;
}

export const LuxuryChecker: React.FC<CheckerProps> = ({
    color,
    countBadge,
    isPlayable = false,
    isTopChecker = false,
}) => {
    const isWhite = color === 'white';

    return (
        <div
            className={`relative w-[42px] h-[42px] xl:w-[46px] xl:h-[46px] rounded-full flex items-center justify-center select-none transition-all duration-300 ease-out ${isPlayable && isTopChecker
                    ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 hover:ring-2 hover:ring-amber-400/90'
                    : ''
                }`}
            style={{
                // Corps externe bombé en résine nacrée.
                background: isWhite
                    ? 'radial-gradient(circle at 30% 28%, #ffffff 0%, #f5ebd6 45%, #cbb894 82%, #8c7651 100%)'
                    : 'radial-gradient(circle at 30% 28%, #52525b 0%, #27272a 42%, #141417 82%, #050507 100%)',
                boxShadow: isWhite
                    ? '0 6px 12px rgba(0,0,0,0.65), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(120,95,60,0.6)'
                    : '0 6px 12px rgba(0,0,0,0.85), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.9)',
                border: isWhite ? '1px solid #dfd1b4' : '1px solid #3f3f46',
            }}
        >
            {/* Creux central concave (finger-dish avec lumière inversée). */}
            <div
                className="w-[68%] h-[68%] rounded-full flex items-center justify-center"
                style={{
                    background: isWhite
                        ? 'radial-gradient(circle at 72% 72%, #ffffff 0%, #e6d8bc 58%, #b39d76 100%)'
                        : 'radial-gradient(circle at 72% 72%, #3f3f46 0%, #18181b 60%, #09090b 100%)',
                    boxShadow: isWhite
                        ? 'inset 0 3px 6px rgba(90,70,40,0.45), 0 1px 1px rgba(255,255,255,0.8)'
                        : 'inset 0 4px 7px rgba(0,0,0,0.9), 0 1px 1px rgba(255,255,255,0.12)',
                }}
            >
                {countBadge !== undefined && countBadge > 5 && (
                    <span
                        className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full shadow-md ${isWhite
                                ? 'bg-amber-900 text-amber-100 border border-amber-300/40'
                                : 'bg-amber-400 text-slate-950'
                            }`}
                    >
                        {countBadge}
                    </span>
                )}
            </div>
        </div>
    );
};

export default LuxuryChecker;
