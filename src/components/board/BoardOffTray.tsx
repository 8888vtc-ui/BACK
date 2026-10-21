'use client';

/**
 * Sabot de sortie (bear-off tray) — compteur de pions sortis.
 *
 * Rôle :
 *   Isole le rendu d'un sabot de sortie hors de `Board.tsx` (LOI 5).
 *   Composant 100 % muet : état visuel déjà calculé par le parent.
 *
 * Dépendances :
 *   `boardAria` (`getTrayAriaLabel`).
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le JSX dans `Board.tsx`.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { getTrayAriaLabel } from './boardAria';

export interface BoardOffTrayProps {
    /** Index absolu du sabot (0 = sortie X, 25 = sortie O). */
    offPoint: number;
    /** Nombre de pions déjà sortis dans ce sabot. */
    count: number;
    /** Plateau complet (pour le calcul du libellé ARIA). */
    board: number[];
    /** Joueur au trait. */
    player: Player;
    /** Ce sabot est-il une destination légale du pion sélectionné ? */
    isTarget: boolean;
    /** Le dernier coup adverse sort-il un pion dans ce sabot ? */
    isOpponentToOff: boolean;
    /** Identifiant de zone pour l'accessibilité clavier. */
    trayZoneId: string;
    onClick: (offPoint: number) => void;
}

export const BoardOffTray: React.FC<BoardOffTrayProps> = ({
    offPoint,
    count,
    board,
    player,
    isTarget,
    isOpponentToOff,
    trayZoneId,
    onClick,
}) => (
    <div
        data-testid={trayZoneId}
        data-off-tray={offPoint}
        role="button"
        tabIndex={0}
        aria-label={getTrayAriaLabel(board, player, isTarget)}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-2 min-h-[64px] transition-colors ${isTarget
            ? 'border-emerald-400 bg-emerald-400/10 cursor-pointer'
            : isOpponentToOff
                ? 'border-indigo-400 bg-indigo-950/40 ring-2 ring-indigo-400/80 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
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

export default BoardOffTray;
