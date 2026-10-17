'use client';

/**
 * Affichage du videau (doubling cube).
 *
 * Affiche la valeur du videau (ou « 64 » pour la valeur initiale 1).
 *
 * Composant isolé : pour le retirer, supprimer ce fichier et son usage dans `Board`.
 */

import React from 'react';

export interface CubeDisplayProps {
    /** Valeur du videau (1, 2, 4, 8...). */
    cubeValue: number;
}

export const CubeDisplay: React.FC<CubeDisplayProps> = ({ cubeValue }) => (
    <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Videau</span>
        <div className="w-11 h-11 rounded-md bg-[#fdfaf2] text-slate-900 flex items-center justify-center text-lg font-extrabold shadow-lg border border-slate-700">
            {cubeValue === 1 ? '64' : cubeValue}
        </div>
    </div>
);

export default CubeDisplay;
