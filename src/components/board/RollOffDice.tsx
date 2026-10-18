'use client';

/**
 * Dés de démarrage (roll-off) cliquables.
 *
 * Affiche deux dés (un pour X, un pour O) que le joueur clique pour lancer
 * le roll-off. Le joueur avec le dé le plus élevé commence ; en cas d'égalité,
 * relancer.
 *
 * Composant isolé : ne dépend que de ses props, aucune logique métier.
 * Pour le retirer, supprimer ce fichier et son usage dans `Board.tsx`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';
import { Die } from './Die';

export interface RollOffDiceProps {
    /** Dé de X (null si pas encore lancé). */
    xDie: number | null;
    /** Dé de O (null si pas encore lancé). */
    oDie: number | null;
    /** Callback au clic pour lancer le roll-off. */
    onRollOff: () => void;
}

const RollOffDiceComponent: React.FC<RollOffDiceProps> = ({ xDie, oDie, onRollOff }) => {
    return (
        <div
            className="flex items-center justify-center gap-6 py-3 shrink-0"
            data-testid="roll-off-dice"
        >
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-300">X</span>
                    {xDie !== null ? (
                        <Die value={xDie} label="Dé de X" />
                    ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                            ?
                        </div>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-300">O</span>
                    {oDie !== null ? (
                        <Die value={oDie} label="Dé de O" />
                    ) : (
                        <div className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                            ?
                        </div>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onRollOff();
                }}
                data-testid="roll-off-button"
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
            >
                🎲 Lancer
            </button>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const RollOffDice = React.memo(RollOffDiceComponent);

export default RollOffDice;
