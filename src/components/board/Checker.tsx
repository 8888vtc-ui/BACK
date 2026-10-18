'use client';

/**
 * Pion 3D concave (style Crisloid / Hector Saxe) avec badge numérique.
 *
 * Affiche un pion de backgammon avec un badge numérique sur tous les points
 * ayant ≥ 2 pions (lecture instantanée, confort blitz).
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';

export type CheckerColor = 'white' | 'black';

/** Seuil minimal de pions pour afficher le badge numérique. */
export const BADGE_MIN_COUNT = 2;

export interface CheckerProps {
    color: CheckerColor;
    countBadge?: number;
    isPlayable?: boolean;
    isTopChecker?: boolean;
}

const CheckerComponent: React.FC<CheckerProps> = ({
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
                background: isWhite
                    ? 'radial-gradient(circle at 30% 28%, #ffffff 0%, #f5ebd6 45%, #cbb894 82%, #8c7651 100%)'
                    : 'radial-gradient(circle at 30% 28%, #52525b 0%, #27272a 42%, #141417 82%, #050507 100%)',
                boxShadow: isWhite
                    ? '0 6px 12px rgba(0,0,0,0.65), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(120,95,60,0.6)'
                    : '0 6px 12px rgba(0,0,0,0.85), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.9)',
                border: isWhite ? '1px solid #dfd1b4' : '1px solid #3f3f46',
            }}
        >
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
                {countBadge !== undefined && countBadge >= BADGE_MIN_COUNT && (
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

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const Checker = React.memo(CheckerComponent);

export default Checker;
