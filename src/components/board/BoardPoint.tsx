'use client';

/**
 * Flèche (point) du plateau — triangle SVG cousu + pile de pions 3D.
 *
 * Rôle :
 *   Isole le rendu d'une flèche hors de `Board.tsx` (LOI 5 : ≤ 300 lignes).
 *   Composant 100 % muet : il reçoit son état visuel déjà calculé et remonte
 *   les interactions au parent.
 *
 * Dépendances :
 *   `Checker`, `MAX_VISIBLE` (boardGeometry).
 *
 * Retrait :
 *   Supprimer ce fichier et réinliner le composant dans `Board.tsx`.
 */

import React from 'react';
import { MAX_VISIBLE } from './boardGeometry';
import { Checker, type CheckerColor } from './Checker';

export interface BoardPointProps {
    pointNumber: number;
    isTopRow: boolean;
    checkerColor: CheckerColor | null;
    checkerCount: number;
    isTargetDestination?: boolean;
    isBlotTarget?: boolean;
    isSelected?: boolean;
    isOpponentFrom?: boolean;
    isOpponentTo?: boolean;
    isFocused?: boolean;
    ariaLabel?: string;
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
    onDoubleClickPoint?: (pointNumber: number) => void;
    onRightClickPoint?: (pointNumber: number, e: React.MouseEvent) => void;
    onKeyDownPoint?: (pointNumber: number, e: React.KeyboardEvent) => void;
    onFocusPoint?: (pointNumber: number) => void;
}

const BoardPointComponent: React.FC<BoardPointProps> = ({
    pointNumber,
    isTopRow,
    checkerColor,
    checkerCount,
    isTargetDestination = false,
    isBlotTarget = false,
    isSelected = false,
    isOpponentFrom = false,
    isOpponentTo = false,
    isFocused = false,
    ariaLabel,
    onClickPoint,
    onDoubleClickPoint,
    onRightClickPoint,
    onKeyDownPoint,
    onFocusPoint,
}) => {
    const isEven = pointNumber % 2 === 0;
    const visibleCheckers = Math.min(checkerCount, MAX_VISIBLE);

    return (
        <div
            data-point={pointNumber}
            data-testid={`point-triangle-${pointNumber}`}
            role="button"
            aria-label={ariaLabel}
            tabIndex={0}
            className={`relative flex-1 min-w-0 h-full flex flex-col items-center select-none group transition-all duration-150 touch-manipulation ${isSelected
                ? 'ring-2 ring-amber-400/80 rounded-lg'
                : isOpponentTo
                    ? 'ring-2 ring-indigo-400/90 bg-indigo-950/40 shadow-[0_0_16px_rgba(129,140,248,0.45)] rounded-lg'
                    : isOpponentFrom
                        ? 'ring-2 ring-indigo-500/50 bg-indigo-950/20 rounded-lg'
                        : ''
                }`}
            onClick={(e) => onClickPoint(pointNumber, e)}
            onDoubleClick={() => onDoubleClickPoint?.(pointNumber)}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClickPoint?.(pointNumber, e);
            }}
            onKeyDown={(e) => onKeyDownPoint?.(pointNumber, e)}
            onFocus={() => onFocusPoint?.(pointNumber)}
        >
            {/* Zone de toucher pleine hauteur (triangle complet) — cible ≥ 44 px WCAG. */}
            <span
                data-testid={`point-touch-zone-${pointNumber}`}
                aria-hidden="true"
                className="absolute inset-0 z-0 min-h-[44px] min-w-[44px] pointer-events-none"
            />
            {isFocused && (
                <div
                    data-testid={`keyboard-focus-indicator-${pointNumber}`}
                    className="absolute inset-0 z-30 rounded-lg ring-4 ring-cyan-400/90 pointer-events-none"
                />
            )}
            <svg
                viewBox="0 0 100 300"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-[86%] pointer-events-none"
                style={{
                    top: isTopRow ? 0 : 'auto',
                    bottom: isTopRow ? 'auto' : 0,
                }}
            >
                <defs>
                    {/* Dégradé à 3 arrêts : reflet haut, corps, ombre basse. */}
                    <linearGradient id={`ivoryPoint-${pointNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#faf3e3" />
                        <stop offset="55%" stopColor="#e8dcc0" />
                        <stop offset="100%" stopColor="#c9b896" />
                    </linearGradient>
                    <linearGradient id={`burgundyPoint-${pointNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#9b1f2a" />
                        <stop offset="55%" stopColor="#6e1219" />
                        <stop offset="100%" stopColor="#3d070c" />
                    </linearGradient>
                </defs>
                {/* Ombre portée décalée sous le triangle (relief) */}
                <polygon
                    points={isTopRow ? '6,4 98,4 52,296' : '6,296 98,296 52,12'}
                    fill="rgba(0,0,0,0.28)"
                    stroke="none"
                />
                <polygon
                    points={isTopRow ? '4,0 96,0 50,292' : '4,300 96,300 50,8'}
                    fill={isEven ? `url(#ivoryPoint-${pointNumber})` : `url(#burgundyPoint-${pointNumber})`}
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
            </svg>

            <div
                className={`relative z-10 flex flex-col items-center w-full py-1 ${isTopRow ? 'justify-start' : 'justify-end mt-auto'
                    }`}
            >
                {checkerColor &&
                    Array.from({ length: visibleCheckers }).map((_, idx) => {
                        // Le badge numérique est porté par le 5e pion (le plus
                        // proche du centre du plateau), jamais par un pion
                        // intermédiaire : lecture nette du total (6, 7, 8…).
                        const isFifthChecker = idx === MAX_VISIBLE - 1;
                        const showCount =
                            checkerCount > MAX_VISIBLE && isFifthChecker
                                ? checkerCount
                                : undefined;

                        // Chevauchement progressif des pions (shingling tournoi).
                        const overlapClass = idx > 0 ? '-mt-2 sm:-mt-2.5 md:-mt-3 xl:-mt-3.5' : '';

                        return (
                            <div
                                key={idx}
                                data-testid={`checker-p${pointNumber}-${idx}`}
                                className={`transition-all duration-150 ${overlapClass} ${isBlotTarget && checkerCount === 1
                                    ? 'rounded-full ring-4 ring-rose-500 animate-pulse'
                                    : ''
                                    }`}
                            >
                                <Checker
                                    color={checkerColor}
                                    countBadge={showCount}
                                    isPlayable
                                    isTopChecker={isFifthChecker}
                                />
                            </div>
                        );
                    })}
            </div>

            {isTargetDestination && (
                <div
                    data-testid={`ghost-checker-${pointNumber}`}
                    className={`absolute z-20 w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399] ring-2 ring-white animate-pulse pointer-events-none ${isTopRow ? 'bottom-[18%]' : 'top-[18%]'
                        }`}
                />
            )}

            {isOpponentTo && (
                <div
                    data-testid={`opp-to-indicator-${pointNumber}`}
                    className={`absolute z-20 w-4 h-4 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8] ring-2 ring-white animate-pulse pointer-events-none flex items-center justify-center text-[10px] font-bold text-slate-900 ${isTopRow ? 'bottom-[18%]' : 'top-[18%]'
                        }`}
                >
                    ▼
                </div>
            )}

            {isOpponentFrom && (
                <div
                    data-testid={`opp-from-indicator-${pointNumber}`}
                    className={`absolute z-20 w-2.5 h-2.5 rounded-full bg-indigo-500/80 ring-2 ring-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.6)] pointer-events-none ${isTopRow ? 'top-[18%]' : 'bottom-[18%]'
                        }`}
                />
            )}
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const BoardPoint = React.memo(BoardPointComponent);

export default BoardPoint;
