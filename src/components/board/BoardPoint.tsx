'use client';

/**
 * Flèche (point) du plateau — Marqueterie triangulaire de tournoi (style Backgammon Galaxy)
 * + pile de pions 3D alignés bord à bord sans écrasement (< 300 lignes, 0 any).
 */

import React from 'react';
import { computeCheckerStackLayout } from './boardGeometry';
import { Checker, type CheckerColor } from './Checker';
import { getBoardThemeTokens } from './boardThemes';

export interface BoardPointProps {
    pointNumber: number;
    isTopRow: boolean;
    checkerColor: CheckerColor | null;
    checkerCount: number;
    isTargetDestination?: boolean;
    isBlotTarget?: boolean;
    isHoverPrimaryTarget?: boolean;
    isHoverSecondaryTarget?: boolean;
    targetDieValue?: number | null;
    secondaryTargetDieValue?: number | null;
    isMovable?: boolean;
    /** Vrai si cette flèche est l'unique point de départ d'un coup forcé (Audit 13/20). */
    isForcedOrigin?: boolean;
    /** Vrai si les pions de cette flèche sont verrouillés car un pion ami est sur la barre (Audit 3/20). */
    isLockedByBar?: boolean;
    isSelected?: boolean;
    isOpponentFrom?: boolean;
    isOpponentTo?: boolean;
    isFocused?: boolean;
    ariaLabel?: string;
    theme?: string;
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
    onDoubleClickPoint?: (pointNumber: number) => void;
    onRightClickPoint?: (pointNumber: number, e: React.MouseEvent) => void;
    onKeyDownPoint?: (pointNumber: number, e: React.KeyboardEvent) => void;
    onFocusPoint?: (pointNumber: number) => void;
    onMouseEnterPoint?: (pointNumber: number) => void;
    onMouseLeavePoint?: (pointNumber: number) => void;
    onCheckerPointerDown?: (pointNumber: number, color: CheckerColor, e: React.PointerEvent) => void;
}

const BoardPointComponent: React.FC<BoardPointProps> = ({
    pointNumber,
    isTopRow,
    checkerColor,
    checkerCount,
    isTargetDestination = false,
    isBlotTarget = false,
    isHoverPrimaryTarget = false,
    isHoverSecondaryTarget = false,
    targetDieValue = null,
    secondaryTargetDieValue = null,
    isMovable = false,
    isForcedOrigin = false,
    isLockedByBar = false,
    isSelected = false,
    isOpponentFrom = false,
    isOpponentTo = false,
    isFocused = false,
    ariaLabel,
    theme,
    onClickPoint,
    onDoubleClickPoint,
    onRightClickPoint,
    onKeyDownPoint,
    onFocusPoint,
    onMouseEnterPoint,
    onMouseLeavePoint,
    onCheckerPointerDown,
}) => {
    const isEven = pointNumber % 2 === 0;
    const stackLayout = computeCheckerStackLayout(checkerCount, isTopRow);
    const pt = getBoardThemeTokens(theme).points;
    const isHighlightedTarget = isTargetDestination || isHoverPrimaryTarget;

    const mainPoints = isTopRow ? '3,0 97,0 50,288' : '3,300 97,300 50,12';
    const innerInlayPoints = isTopRow ? '6,1 94,1 50,280' : '6,299 94,299 50,20';

    return (
        <div
            data-point={pointNumber}
            data-testid={`point-triangle-${pointNumber}`}
            data-locked-by-bar={isLockedByBar ? 'true' : undefined}
            data-forced-origin={isForcedOrigin ? 'true' : undefined}
            role="button"
            aria-label={ariaLabel}
            aria-disabled={isLockedByBar && !isHighlightedTarget ? true : undefined}
            tabIndex={0}
            className={`relative flex-1 min-w-0 sm:min-w-[36px] md:min-w-[44px] min-h-[44px] h-full flex flex-col items-center select-none group cursor-pointer transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] touch-manipulation ${
                isSelected
                    ? 'ring-2 ring-amber-400/90 rounded-lg bg-amber-400/5 shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                    : isHighlightedTarget
                        ? 'rounded-lg bg-emerald-400/10'
                        : isHoverSecondaryTarget
                            ? 'rounded-lg bg-sky-400/10'
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
            onMouseEnter={() => onMouseEnterPoint?.(pointNumber)}
            onMouseLeave={() => onMouseLeavePoint?.(pointNumber)}
        >
            {/* Hitbox invisible d'au moins 44×44 px centrée sur la flèche (WCAG 2.5.5 / Mobile Touch) */}
            <span
                data-testid={`point-touch-zone-${pointNumber}`}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full h-full min-w-[44px] min-h-[44px]"
                style={{ minWidth: '44px', minHeight: '44px' }}
            />

            {isFocused && (
                <div
                    data-testid={`keyboard-focus-indicator-${pointNumber}`}
                    className="absolute inset-0 z-30 rounded-xl ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.5),inset_0_0_12px_rgba(251,191,36,0.2)] bg-amber-400/10 pointer-events-none transition-all duration-200"
                />
            )}

            {/* Marqueterie SVG de la flèche */}
            <svg
                viewBox="0 0 100 300"
                preserveAspectRatio="none"
                shapeRendering="geometricPrecision"
                className="absolute inset-0 w-full h-[84%] pointer-events-none"
                style={{ top: isTopRow ? 0 : 'auto', bottom: isTopRow ? 'auto' : 0 }}
            >
                <defs>
                    <linearGradient id={`ivoryPoint-${pointNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={pt.light[0]} />
                        <stop offset="30%" stopColor={pt.light[1]} />
                        <stop offset="70%" stopColor={pt.light[2]} />
                        <stop offset="100%" stopColor={pt.light[3]} />
                    </linearGradient>
                    <linearGradient id={`burgundyPoint-${pointNumber}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={pt.dark[0]} />
                        <stop offset="32%" stopColor={pt.dark[1]} />
                        <stop offset="72%" stopColor={pt.dark[2]} />
                        <stop offset="100%" stopColor={pt.dark[3]} />
                    </linearGradient>
                </defs>

                <polygon
                    points={mainPoints}
                    fill={isEven ? `url(#ivoryPoint-${pointNumber})` : `url(#burgundyPoint-${pointNumber})`}
                    stroke={isEven ? pt.lightStroke : pt.darkStroke}
                    strokeWidth="0.9"
                    strokeLinejoin="round"
                />
                <polygon
                    points={innerInlayPoints}
                    fill="none"
                    stroke={isEven ? pt.lightInlay : pt.darkInlay}
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                />

                {isHighlightedTarget && (
                    <polygon points={mainPoints} fill="rgba(52, 211, 153, 0.26)" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
                )}
                {!isHighlightedTarget && isHoverSecondaryTarget && (
                    <polygon points={mainPoints} fill="rgba(56, 189, 248, 0.18)" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" strokeLinejoin="round" />
                )}
                {isOpponentTo && (
                    <polygon points={mainPoints} fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="round" />
                )}
                {isOpponentFrom && (
                    <polygon points={mainPoints} fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="4 2" strokeLinejoin="round" />
                )}
            </svg>

            {/* Piles de pions 3D alignés bord à bord avec tassement adaptatif > 5 (Audit 14/20) */}
            <div
                data-testid={`point-stack-${pointNumber}`}
                data-stack-compressed={stackLayout.isCompressed ? 'true' : 'false'}
                data-stack-overlap={stackLayout.overlapPx}
                className={`relative z-10 flex flex-col items-center w-full max-h-full overflow-hidden py-0.5 pointer-events-none ${
                    isTopRow ? 'justify-start' : 'justify-end mt-auto'
                } ${isLockedByBar ? 'opacity-55 saturate-50' : ''}`}
            >
                {checkerColor &&
                    Array.from({ length: stackLayout.visibleCheckers }).map((_, idx) => {
                        const isTop = idx === stackLayout.apexIndex;
                        const showCount = isTop ? stackLayout.badgeCount : undefined;
                        return (
                            <div
                                key={idx}
                                data-testid={`checker-p${pointNumber}-${idx}`}
                                style={{
                                    marginTop: idx > 0 ? `-${stackLayout.overlapPx}px` : '0px',
                                    zIndex: isTopRow ? idx + 1 : stackLayout.visibleCheckers - idx,
                                }}
                                className={`checker-land pointer-events-auto transition-[transform,opacity] duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] ${
                                    isLockedByBar ? 'cursor-not-allowed' : ''
                                } ${isBlotTarget && checkerCount === 1 ? 'rounded-full ring-4 ring-rose-500 animate-pulse' : ''} ${
                                    isForcedOrigin && isTop ? 'rounded-full ring-2 ring-amber-400 animate-pulse' : ''
                                }`}
                            >
                                <Checker
                                    color={checkerColor}
                                    countBadge={showCount}
                                    isPlayable={!isLockedByBar && isMovable}
                                    isTopChecker={isTop}
                                    onPointerDown={
                                        isLockedByBar ? undefined : (e) => onCheckerPointerDown?.(pointNumber, checkerColor, e)
                                    }
                                />
                            </div>
                        );
                    })}
            </div>

            {isTargetDestination && (
                <div
                    data-testid={`ghost-checker-${pointNumber}`}
                    className={`absolute z-20 w-6 h-6 rounded-full bg-emerald-400 shadow-[0_0_14px_#34d399] ring-2 ring-white animate-pulse pointer-events-none flex items-center justify-center text-[11px] font-black text-slate-950 ${
                        isTopRow ? 'bottom-[15%]' : 'top-[15%]'
                    }`}
                >
                    {targetDieValue ?? ''}
                </div>
            )}

            {!isTargetDestination && isHoverPrimaryTarget && (
                <div
                    data-testid={`hover-target-primary-${pointNumber}`}
                    className={`absolute z-20 w-6 h-6 rounded-full bg-emerald-400/95 shadow-[0_0_12px_#34d399] ring-2 ring-white pointer-events-none flex items-center justify-center text-[11px] font-black text-slate-950 ${
                        isTopRow ? 'bottom-[15%]' : 'top-[15%]'
                    }`}
                >
                    {targetDieValue ?? ''}
                </div>
            )}
            {!isTargetDestination && !isHoverPrimaryTarget && isHoverSecondaryTarget && (
                <div
                    data-testid={`hover-target-secondary-${pointNumber}`}
                    className={`absolute z-20 w-5 h-5 rounded-full bg-sky-400/90 shadow-[0_0_10px_#38bdf8] ring-1.5 ring-white pointer-events-none flex items-center justify-center text-[10px] font-black text-slate-950 ${
                        isTopRow ? 'bottom-[15%]' : 'top-[15%]'
                    }`}
                >
                    {secondaryTargetDieValue ?? ''}
                </div>
            )}

            {isOpponentTo && (
                <div
                    data-testid={`opp-to-indicator-${pointNumber}`}
                    className={`absolute z-20 w-4 h-4 rounded-full bg-indigo-400 shadow-[0_0_12px_#818cf8] ring-2 ring-white animate-pulse pointer-events-none flex items-center justify-center text-[10px] font-bold text-slate-900 ${
                        isTopRow ? 'bottom-[16%]' : 'top-[16%]'
                    }`}
                >
                    ▼
                </div>
            )}

            {isOpponentFrom && (
                <div
                    data-testid={`opp-from-indicator-${pointNumber}`}
                    className={`absolute z-20 w-2.5 h-2.5 rounded-full bg-indigo-500/80 ring-2 ring-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.6)] pointer-events-none ${
                        isTopRow ? 'top-[16%]' : 'bottom-[16%]'
                    }`}
                />
            )}
        </div>
    );
};

export const BoardPoint = React.memo(BoardPointComponent);
export default BoardPoint;
