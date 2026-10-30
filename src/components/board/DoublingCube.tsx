'use client';

/**
 * Videau (doubling cube) de tournoi — Bloc d'ivoire patiné vintage avec chiffres
 * sérigraphiés rétro et surbrillance dorée dynamique (style Snowie 4 Pro).
 *
 * Rôle :
 *   Affiche le videau selon sa valeur (64, 2, 4, 8…) et sa position (haut si O,
 *   bas si X, centré si neutre).
 *
 * Dépendances :
 *   Aucune (composant pur). Mémoïsé via React.memo (LOI 5).
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

    // Position verticale selon le propriétaire : haut (O), bas (X), centré (null)
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
                className={`relative w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-150 overflow-hidden ${canDouble
                    ? 'ring-2 sm:ring-4 ring-amber-400/90 shadow-[0_0_20px_rgba(251,191,36,0.75)] cursor-pointer hover:scale-105 active:scale-95'
                    : 'hover:scale-105'
                    }`}
                style={{
                    background: canDouble
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.55)',
                    border: canDouble
                        ? '1.5px solid #fef08a'
                        : '1px solid rgba(255, 255, 255, 0.22)',
                }}
                title={
                    cubeOwner === null
                        ? `Videau centré (x${cubeValue})`
                        : `Videau possédé par ${cubeOwner} (x${cubeValue})`
                }
            >
                <span
                    className="relative z-10 text-xs sm:text-lg md:text-xl font-black tabular-nums tracking-tight text-white"
                >
                    {display}
                </span>
            </div>
        </div>
    );
};

export const DoublingCube = React.memo(DoublingCubeComponent);

export default DoublingCube;
