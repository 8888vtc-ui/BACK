'use client';

/**
 * Section de la barre centrale (pions frappés).
 *
 * Affiche la pile de pions frappés d'un joueur sur la barre centrale, plafonnée
 * à 5 avec badge. Reçoit ses handlers en props.
 *
 * Composant isolé : pour le retirer, supprimer ce fichier et son usage dans `Board`.
 * Mémoïsé (`React.memo`).
 */

import React from 'react';
import { LuxuryChecker } from './LuxuryChecker';
import { MAX_VISIBLE, type CheckerColor } from './boardTypes';

export interface BarSectionProps {
    /** Point de barre : `X_BAR` (0) ou `O_BAR` (25). */
    barPoint: number;
    /** Couleur des pions frappés. */
    color: CheckerColor;
    /** Nombre de pions frappés. */
    count: number;
    /** Les pions sont jouables (tour du joueur). */
    isPlayable: boolean;
    /** Clic sur la barre. */
    onClick: (barPoint: number) => void;
    /** Clic droit sur la barre. */
    onRightClick: (barPoint: number) => void;
}

const BarSectionComponent: React.FC<BarSectionProps> = ({
    barPoint,
    color,
    count,
    isPlayable,
    onClick,
    onRightClick,
}) => {
    const visible = Math.min(count, MAX_VISIBLE);

    return (
        <div
            className="flex flex-col items-center justify-center gap-[2px] py-2"
            onClick={(e) => {
                e.stopPropagation();
                onClick(barPoint);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClick(barPoint);
            }}
        >
            {count > 0 &&
                Array.from({ length: visible }).map((_, idx) => (
                    <LuxuryChecker
                        key={idx}
                        color={color}
                        countBadge={count > MAX_VISIBLE && idx === visible - 1 ? count : undefined}
                        isPlayable={isPlayable}
                        isTopChecker={idx === visible - 1}
                    />
                ))}
        </div>
    );
};

/** Barre mémoïsée : ne re-rend que si ses props changent. */
export const BarSection = React.memo(BarSectionComponent);

export default BarSection;
