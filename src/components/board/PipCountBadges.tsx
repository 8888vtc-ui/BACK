'use client';

/**
 * Badges de pip count (comptage des pips).
 *
 * Affiche le pip count de chaque joueur (O et X) en bas du plateau.
 *
 * Composant isolé : pour le retirer, supprimer ce fichier et son usage dans `Board`.
 */

import React from 'react';

export interface PipCountBadgesProps {
    /** Pip counts des deux joueurs. */
    pipCounts: { X: number; O: number };
}

export const PipCountBadges: React.FC<PipCountBadgesProps> = ({ pipCounts }) => (
    <div className="flex items-center justify-between px-2 pt-3 text-xs font-semibold text-slate-300">
        <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
            O : {pipCounts.O}
        </span>
        <span className="px-2 py-1 rounded bg-slate-900/70 border border-slate-700">
            X : {pipCounts.X}
        </span>
    </div>
);

export default PipCountBadges;
