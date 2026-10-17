'use client';

/**
 * Flèche (point) cousue en SVG + pile de pions plafonnée à 5.
 *
 * Affiche un triangle SVG haute précision (ivoire ou bordeaux selon la parité),
 * une pile de pions strictement plafonnée à 5 (avec badge), et un indicateur
 * discret de destination au survol (remplace les gros cercles fantômes).
 *
 * Composant isolé : reçoit ses handlers en props, aucune logique métier.
 */

import React from 'react';
import { LuxuryChecker } from './LuxuryChecker';
import { MAX_VISIBLE, type CheckerColor } from './boardTypes';

export interface BoardPointProps {
    /** Numéro de la flèche (1 à 24). */
    pointNumber: number;
    /** `true` pour la rangée du haut (13..24), `false` pour le bas (12..1). */
    isTopRow: boolean;
    /** Couleur du pion occupant la flèche, ou `null` si vide. */
    checkerColor: CheckerColor | null;
    /** Nombre absolu de pions sur la flèche. */
    checkerCount: number;
    /** Affiche l'indicateur de destination légale. */
    isTargetDestination?: boolean;
    /** Pion adverse isolé frappable (ring rose pulsé). */
    isBlotTarget?: boolean;
    /** Flèche source sélectionnée (ring ambre). */
    isSelected?: boolean;
    /** Clic sur la flèche. */
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
    /** Double-clic sur la flèche (auto-move). */
    onDoubleClickPoint?: (pointNumber: number) => void;
    /** Clic droit sur la flèche. */
    onRightClickPoint?: (pointNumber: number, e: React.MouseEvent) => void;
}

export const BoardPoint: React.FC<BoardPointProps> = ({
    pointNumber,
    isTopRow,
    checkerColor,
    checkerCount,
    isTargetDestination = false,
    isBlotTarget = false,
    isSelected = false,
    onClickPoint,
    onDoubleClickPoint,
    onRightClickPoint,
}) => {
    const isEven = pointNumber % 2 === 0;
    const visibleCheckers = Math.min(checkerCount, MAX_VISIBLE);

    return (
        <div
            data-point={pointNumber}
            className={`relative flex-1 h-full flex flex-col items-center select-none group ${isSelected ? 'ring-2 ring-amber-400/80 rounded-lg' : ''
                }`}
            onClick={(e) => onClickPoint(pointNumber, e)}
            onDoubleClick={() => onDoubleClickPoint?.(pointNumber)}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClickPoint?.(pointNumber, e);
            }}
        >
            {/* Triangle SVG haute précision avec ombres et dégradés. */}
            <svg
                viewBox="0 0 100 300"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-[86%] pointer-events-none"
                style={{
                    top: isTopRow ? 0 : 'auto',
                    bottom: isTopRow ? 'auto' : 0,
                    filter: 'drop-shadow(0px 3px 5px rgba(0,0,0,0.45))',
                }}
            >
                <defs>
                    <linearGradient id={`ivoryPoint-${pointNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f6eedc" />
                        <stop offset="100%" stopColor="#d4c29e" />
                    </linearGradient>
                    <linearGradient id={`burgundyPoint-${pointNumber}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#861923" />
                        <stop offset="100%" stopColor="#4c0910" />
                    </linearGradient>
                </defs>
                <polygon
                    points={isTopRow ? '4,0 96,0 50,292' : '4,300 96,300 50,8'}
                    fill={isEven ? `url(#ivoryPoint-${pointNumber})` : `url(#burgundyPoint-${pointNumber})`}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>

            {/* Pile de pions (maximum 5 affichés pour ne jamais toucher le centre). */}
            <div
                className={`relative z-10 flex flex-col items-center w-full py-1.5 ${isTopRow ? 'justify-start' : 'justify-end mt-auto'
                    } gap-[2px]`}
            >
                {checkerColor &&
                    Array.from({ length: visibleCheckers }).map((_, idx) => {
                        const isLastRendered = isTopRow
                            ? idx === visibleCheckers - 1
                            : idx === 0;
                        const showCount =
                            checkerCount > MAX_VISIBLE && idx === visibleCheckers - 1
                                ? checkerCount
                                : undefined;

                        return (
                            <div
                                key={idx}
                                className={
                                    isBlotTarget && checkerCount === 1
                                        ? 'rounded-full ring-4 ring-rose-500 animate-pulse'
                                        : ''
                                }
                            >
                                <LuxuryChecker
                                    color={checkerColor}
                                    countBadge={showCount}
                                    isPlayable
                                    isTopChecker={isLastRendered}
                                />
                            </div>
                        );
                    })}
            </div>

            {/* Indicateur discret de destination au survol. */}
            {isTargetDestination && (
                <div
                    className={`absolute z-20 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] ring-2 ring-white animate-pulse pointer-events-none ${isTopRow ? 'bottom-[18%]' : 'top-[18%]'
                        }`}
                />
            )}
        </div>
    );
};

export default BoardPoint;
