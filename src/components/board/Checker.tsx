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
            className={`relative w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] xl:w-[40px] xl:h-[40px] rounded-full flex items-center justify-center select-none transition-all duration-300 ease-out ${isPlayable && isTopChecker
                ? 'cursor-pointer hover:-translate-y-1 hover:scale-105 hover:ring-2 hover:ring-amber-400/90 shadow-[0_8px_16px_rgba(0,0,0,0.6)]'
                : 'shadow-[0_4px_8px_rgba(0,0,0,0.5)]'
                }`}
            style={{
                background: isWhite
                    ? 'radial-gradient(circle at 32% 28%, #ffffff 0%, #f7f0e1 45%, #cfbe9e 82%, #947e5b 100%)'
                    : 'radial-gradient(circle at 32% 28%, #52525b 0%, #27272a 44%, #141417 84%, #08080a 100%)',
                boxShadow: isWhite
                    ? '0 4px 8px rgba(0,0,0,0.55), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -2px 3px rgba(120,95,60,0.5)'
                    : '0 4px 8px rgba(0,0,0,0.75), inset 0 1.5px 2px rgba(255,255,255,0.35), inset 0 -2px 3px rgba(0,0,0,0.9)',
                border: isWhite ? '1px solid #dfd1b4' : '1px solid #3f3f46',
            }}
        >
            <div
                className="w-[66%] h-[66%] rounded-full flex items-center justify-center ring-1 ring-black/10"
                style={{
                    background: isWhite
                        ? 'radial-gradient(circle at 70% 70%, #ffffff 0%, #ece0c8 58%, #b8a37f 100%)'
                        : 'radial-gradient(circle at 70% 70%, #3f3f46 0%, #1c1c1f 60%, #0d0d0f 100%)',
                    boxShadow: isWhite
                        ? 'inset 0 2.5px 5px rgba(90,70,40,0.4), 0 1px 1px rgba(255,255,255,0.8)'
                        : 'inset 0 3px 6px rgba(0,0,0,0.85), 0 1px 1px rgba(255,255,255,0.12)',
                }}
            >
                {countBadge !== undefined && countBadge >= BADGE_MIN_COUNT && (
                    <span
                        className={`text-[11px] font-black px-1.5 py-0.2 rounded-full shadow-md leading-none ${isWhite
                            ? 'bg-amber-950 text-amber-100 border border-amber-300/40'
                            : 'bg-amber-400 text-slate-950 font-bold'
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
