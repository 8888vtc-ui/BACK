'use client';

/**
 * Sabot de sortie (bear-off tray).
 *
 * Affiche le compteur de pions sortis d'un joueur, avec un état « cible »
 * (bordure émeraude) lorsque le bear-off est une destination légale.
 *
 * Composant isolé : pour le retirer, supprimer ce fichier et son usage dans `Board`.
 */

import React from 'react';

export interface OffTrayProps {
    /** Point de sortie : `X_BAR` (0) ou `O_BAR` (25). */
    offPoint: number;
    /** Nombre de pions sortis. */
    count: number;
    /** Le bear-off est une destination légale. */
    isTarget: boolean;
    /** Clic sur le sabot. */
    onClick: (offPoint: number) => void;
}

export const OffTray: React.FC<OffTrayProps> = ({ offPoint, count, isTarget, onClick }) => (
    <div
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2 min-h-[64px] ${isTarget
                ? 'border-emerald-400 bg-emerald-400/10 cursor-pointer'
                : 'border-slate-700 bg-slate-900/40'
            }`}
        onClick={(e) => {
            e.stopPropagation();
            onClick(offPoint);
        }}
    >
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sortie</span>
        <span className="text-2xl font-extrabold text-slate-200">{count}</span>
    </div>
);

export default OffTray;
