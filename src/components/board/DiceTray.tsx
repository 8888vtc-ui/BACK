'use client';

/**
 * Plateau de dés (deux dés cliquables).
 *
 * Affiche les deux dés avec leurs états : consommé (grisé), actif (ring bleu),
 * ou normal. Gère le clic (sélection) et le double-clic (auto-move).
 *
 * Composant isolé : pour le retirer, supprimer ce fichier et son usage dans `Board`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';

export interface DiceTrayProps {
    /** Valeurs des deux dés. */
    dice: [number, number];
    /** Dés déjà consommés ce tour. */
    usedDice: boolean[];
    /** Dé sélectionné (0 = gauche, 1 = droit). */
    selectedDie: 0 | 1 | null;
    /** Clic sur un dé (sélection). */
    onSelectDie: (die: 0 | 1) => void;
    /** Double-clic sur un dé (auto-move). */
    onDoubleClickDie?: (die: 0 | 1) => void;
}

const DiceTrayComponent: React.FC<DiceTrayProps> = ({
    dice,
    usedDice,
    selectedDie,
    onSelectDie,
    onDoubleClickDie,
}) => (
    <div className="flex items-center gap-3">
        {dice.map((value, i) => {
            const die = i as 0 | 1;
            const used = Boolean(usedDice[i]);
            const active = selectedDie === die;
            return (
                <button
                    key={i}
                    type="button"
                    data-testid={`board-die-${i}`}
                    disabled={used}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelectDie(die);
                    }}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onDoubleClickDie?.(die);
                    }}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-extrabold shadow-md border-2 transition ${used
                        ? 'bg-slate-700 text-slate-500 border-slate-600 opacity-60'
                        : active
                            ? 'bg-white text-slate-900 border-sky-400 ring-2 ring-sky-400'
                            : 'bg-white text-slate-900 border-slate-300 hover:border-sky-300'
                        }`}
                >
                    {value}
                </button>
            );
        })}
    </div>
);

/** Dés mémoïsés : ne re-rend que si ses props changent. */
export const DiceTray = React.memo(DiceTrayComponent);

export default DiceTray;
