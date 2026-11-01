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
                className={`relative w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 [@media(max-height:600px)]:!w-7 [@media(max-height:600px)]:!h-7 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 overflow-hidden ${
                    canDouble
                        ? 'ring-1 sm:ring-2 [@media(max-height:600px)]:!ring-1 ring-amber-400/90 shadow-[0_0_16px_rgba(212,175,55,0.75)] cursor-pointer hover:scale-105 active:scale-95'
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
                    className={`relative z-10 font-sans text-[13px] sm:text-base md:text-lg [@media(max-height:600px)]:!text-[13px] font-extrabold tabular-nums tracking-tight leading-none ${
                        canDouble
                            ? 'text-[#090806] font-black drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]'
                            : 'text-[#FFF8E7] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
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
