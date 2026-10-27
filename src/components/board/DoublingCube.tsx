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
                className={`relative w-5 h-5 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-md sm:rounded-xl flex items-center justify-center transition-all duration-150 overflow-hidden ${canDouble
                    ? 'border-amber-400 ring-2 sm:ring-4 ring-amber-400/70 shadow-[0_0_22px_rgba(251,191,36,0.85)] animate-pulse cursor-pointer hover:scale-110 active:scale-95'
                    : 'hover:scale-105'
                    }`}
                style={{
                    // Bloc d'ivoire patiné vintage
                    background:
                        'linear-gradient(145deg, #fffdf8 0%, #fbf5e7 24%, #ede0c6 70%, #d8caa4 100%)',
                    boxShadow: canDouble
                        ? '0 0 24px rgba(251, 191, 36, 0.8), 0 8px 18px -2px rgba(0, 0, 0, 0.7), inset 0 1.5px 1px rgba(255, 255, 255, 0.95), inset 0 -2.5px 5px rgba(120, 95, 50, 0.3)'
                        : '0 8px 18px -2px rgba(0, 0, 0, 0.7), 0 3px 6px rgba(0, 0, 0, 0.4), inset 0 1.5px 1px rgba(255, 255, 255, 0.95), inset 0 -2.5px 5px rgba(120, 95, 50, 0.28), inset 1px 1px 2px rgba(255, 255, 255, 0.6)',
                    border: canDouble
                        ? '2px solid rgba(251, 191, 36, 0.95)'
                        : '1.5px solid rgba(185, 155, 105, 0.65)',
                }}
                title={
                    cubeOwner === null
                        ? `Videau centré (x${cubeValue})`
                        : `Videau possédé par ${cubeOwner} (x${cubeValue})`
                }
            >
                {/* Reflet spéculaire d'arête sur le bloc d'ivoire */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)',
                    }}
                />

                {/* Chiffre sérigraphié rétro encré dans la patine */}
                <span
                    className="relative z-10 text-xs sm:text-xl font-black tabular-nums tracking-tighter"
                    style={{
                        color: '#1a1612',
                        textShadow:
                            '0 1px 0 rgba(255, 255, 255, 0.6), 0 -1px 0 rgba(0, 0, 0, 0.35)',
                    }}
                >
                    {display}
                </span>

                {/* Filet d'or d'angle */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-[1.5px] rounded-[10px]"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.35)',
                    }}
                />
            </div>
        </div>
    );
};

export const DoublingCube = React.memo(DoublingCubeComponent);

export default DoublingCube;
