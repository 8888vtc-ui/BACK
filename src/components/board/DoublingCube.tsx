'use client';

/**
 * Videau (doubling cube) Haute-Horlogerie Cercle Monte-Carlo — Bloc d'Onyx & Laiton Or 24k.
 * Éradique définitivement le violet/indigo Galaxy au profit de la charte Or Champagne & Ébène.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { getCubePositionZone } from '../../engine/cubeRules';

export interface DoublingCubeProps {
    /** Valeur du videau (1, 2, 4, 8…). */
    cubeValue: number;
    /** Possesseur du videau, ou null si centré. */
    cubeOwner: Player | null;
    /** Le double est-il possible pour le joueur au trait ? */
    canDouble?: boolean;
    /** Clic direct sur le videau pour proposer le double. */
    onOfferDouble?: () => void;
}

const DoublingCubeComponent: React.FC<DoublingCubeProps> = ({
    cubeValue,
    cubeOwner,
    canDouble = false,
    onOfferDouble,
}) => {
    const display = cubeValue === 1 ? '64' : cubeValue;

    const positionClass =
        cubeOwner === 'O'
            ? 'self-start'
            : cubeOwner === 'X'
              ? 'self-end'
              : 'self-center';

    return (
        <div
            className={`flex flex-col items-center justify-center gap-1 py-1 max-w-full select-none ${positionClass}`}
            data-testid="doubling-cube"
            data-cube-zone={getCubePositionZone(cubeOwner)}
            data-no-overlap="true"
            onClick={(e) => {
                if (canDouble && onOfferDouble) {
                    e.stopPropagation();
                    onOfferDouble();
                }
            }}
        >
            <div
                className={`relative w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-150 overflow-hidden ${
                    canDouble
                        ? 'ring-2 sm:ring-4 ring-amber-400/90 shadow-[0_0_22px_rgba(212,175,55,0.75)] cursor-pointer hover:scale-105 active:scale-95'
                        : 'hover:scale-105'
                }`}
                style={{
                    background: canDouble
                        ? 'linear-gradient(135deg, #f5dfa0 0%, #d4af37 55%, #9a6f18 100%)'
                        : 'linear-gradient(145deg, #241a10 0%, #140e08 60%, #0b0805 100%)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 240, 195, 0.35)',
                    border: canDouble
                        ? '1.5px solid #fff7d6'
                        : '1.5px solid rgba(212, 175, 55, 0.75)',
                }}
                title={
                    cubeOwner === null
                        ? `Videau centré (x${cubeValue})`
                        : `Videau possédé par ${cubeOwner} (x${cubeValue})`
                }
            >
                <span
                    className={`relative z-10 font-display text-xs sm:text-lg md:text-xl font-bold tabular-nums tracking-tight ${
                        canDouble ? 'text-[#090806]' : 'text-[#f5dfa0]'
                    }`}
                >
                    {display}
                </span>
            </div>
        </div>
    );
};

export const DoublingCube = React.memo(DoublingCubeComponent);

export default DoublingCube;
