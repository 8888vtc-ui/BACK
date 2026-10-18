'use client';

/**
 * Videau (doubling cube) dynamique.
 *
 * Affiche le videau avec sa valeur, déplacé vers le camp du possesseur
 * (haut si O, bas si X, centré si null), et un halo lumineux quand le
 * double est possible (`canDouble`).
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';

export interface DoublingCubeProps {
    /** Valeur du videau (1, 2, 4, 8…). */
    cubeValue: number;
    /** Possesseur du videau, ou null si centré. */
    cubeOwner: Player | null;
    /** Le double est-il possible pour le joueur au trait ? */
    canDouble?: boolean;
}

const DoublingCubeComponent: React.FC<DoublingCubeProps> = ({
    cubeValue,
    cubeOwner,
    canDouble = false,
}) => {
    const display = cubeValue === 1 ? '64' : cubeValue;

    // Position verticale : haut (O), bas (X), centré (null).
    const positionClass =
        cubeOwner === 'O'
            ? 'self-start'
            : cubeOwner === 'X'
                ? 'self-end'
                : 'self-center';

    return (
        <div
            className={`flex flex-col items-center justify-center gap-1 py-1 ${positionClass}`}
            data-testid="doubling-cube"
        >
            <div
                className={`w-11 h-11 rounded-md bg-[#fdfaf2] text-slate-900 flex items-center justify-center text-lg font-extrabold shadow-lg border transition-all duration-300 ${canDouble
                        ? 'border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.7)] animate-pulse'
                        : 'border-slate-700'
                    }`}
                title={
                    cubeOwner === null
                        ? `Videau centré (x${cubeValue})`
                        : `Videau possédé par ${cubeOwner} (x${cubeValue})`
                }
            >
                {display}
            </div>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const DoublingCube = React.memo(DoublingCubeComponent);

export default DoublingCube;
