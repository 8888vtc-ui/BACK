'use client';

/**
 * Barre centrale du plateau — pions frappés (barre) + videau positionné
 * selon son propriétaire.
 *
 * Rôle :
 *   Isole la colonne centrale hors de `Board.tsx` (LOI 5). Affiche les piles
 *   de pions frappés (barre X en bas, barre O en haut) et le videau dans la
 *   zone correspondant à son propriétaire (haut / centre / bas).
 *
 * Dépendances :
 *   `Checker`, `DoublingCube`, `boardGeometry` (`MAX_VISIBLE`).
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le JSX dans `Board.tsx`.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import { MAX_VISIBLE } from './boardGeometry';
import { Checker, type CheckerColor } from './Checker';
import { DoublingCube } from './DoublingCube';

export interface BoardCentralBarProps {
    /** Nombre de pions blancs (X) sur la barre. */
    barX: number;
    /** Nombre de pions noirs (O) sur la barre. */
    barO: number;
    /** Le joueur X est-il au trait (détermine la jouabilité du haut de pile) ? */
    isXTurn: boolean;
    cubeValue: number;
    cubeOwner: Player | null;
    canDouble: boolean;
    onBarClick: (barPoint: number) => void;
    onBarRightClick: (barPoint: number) => void;
    /** Index absolu de la barre X (0) et de la barre O (25) côté moteur. */
    xBarPoint: number;
    oBarPoint: number;
}

/** Rend une pile de pions frappés pour une couleur donnée. */
const BarStack: React.FC<{
    color: CheckerColor;
    count: number;
    isPlayable: boolean;
    barPoint: number;
    onBarClick: (barPoint: number) => void;
    onBarRightClick: (barPoint: number) => void;
}> = ({ color, count, isPlayable, barPoint, onBarClick, onBarRightClick }) => {
    const visible = Math.min(count, MAX_VISIBLE);
    return (
        <div
            data-testid={`bar-section-${barPoint}`}
            className="flex flex-col items-center justify-center py-2"
            onClick={(e) => {
                e.stopPropagation();
                onBarClick(barPoint);
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onBarRightClick(barPoint);
            }}
        >
            {count > 0 &&
                Array.from({ length: visible }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`rounded-full ring-2 ring-rose-400/80 shadow-[0_0_10px_rgba(244,63,94,0.5)] ${idx > 0 ? '-mt-2 sm:-mt-2.5' : ''
                            }`}
                    >
                        <Checker
                            color={color}
                            countBadge={count > MAX_VISIBLE && idx === visible - 1 ? count : undefined}
                            isPlayable={isPlayable}
                            isTopChecker={idx === visible - 1}
                        />
                    </div>
                ))}
        </div>
    );
};

export const BoardCentralBar: React.FC<BoardCentralBarProps> = ({
    barX,
    barO,
    isXTurn,
    cubeValue,
    cubeOwner,
    canDouble,
    onBarClick,
    onBarRightClick,
    xBarPoint,
    oBarPoint,
}) => (
    <div
        className="row-span-2 w-10 sm:w-16 md:w-20 flex flex-col justify-between items-center bg-[#221108] rounded-lg mx-1 border-x-2 border-[#d4af37]/60 py-2"
        data-testid="central-bar-container"
    >
        {/* Zone Haut (Côté Joueur O / Noir) */}
        <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px]" data-testid="bar-zone-top">
            <BarStack
                color="black"
                count={barO}
                isPlayable={!isXTurn}
                barPoint={oBarPoint}
                onBarClick={onBarClick}
                onBarRightClick={onBarRightClick}
            />
            {cubeOwner === 'O' && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} />
            )}
        </div>

        {/* Zone Centre (Neutre au milieu : avant le premier double) */}
        <div className="flex items-center justify-center min-h-[48px]" data-testid="bar-zone-middle">
            {cubeOwner === null && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} />
            )}
        </div>

        {/* Zone Bas (Côté Joueur X / Blanc) */}
        <div className="flex flex-col items-center gap-1.5 w-full min-h-[48px]" data-testid="bar-zone-bottom">
            {cubeOwner === 'X' && (
                <DoublingCube cubeValue={cubeValue} cubeOwner={cubeOwner} canDouble={canDouble} />
            )}
            <BarStack
                color="white"
                count={barX}
                isPlayable={isXTurn}
                barPoint={xBarPoint}
                onBarClick={onBarClick}
                onBarRightClick={onBarRightClick}
            />
        </div>
    </div>
);

export default BoardCentralBar;
