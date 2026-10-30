'use client';

/**
 * Flèche (point) du plateau — Marqueterie triangulaire de tournoi (style Backgammon Galaxy)
 * + pile de pions 3D alignés bord à bord + Ghost Checkers stratifiés à 3 niveaux
 * + cibles tactiles élargies (touch-action: manipulation, min 44x44px) (< 260 lignes, 0 any).
 */

import React from 'react';
import { computeCheckerStackLayout } from './boardGeometry';
import { Checker, type CheckerColor } from './Checker';
import { getBoardThemeTokens } from './boardThemes';
import { BoardPointGhostChecker } from './BoardPointGhostChecker';

export interface BoardPointProps {
    pointNumber: number;
    isTopRow: boolean;
    checkerColor: CheckerColor | null;
    checkerCount: number;
    isTargetDestination?: boolean;
    isBlotTarget?: boolean;
    isHoverPrimaryTarget?: boolean;
    isHoverSecondaryTarget?: boolean;
    isHoverCombinedTarget?: boolean;
    targetDieValue?: number | null;
    secondaryTargetDieValue?: number | null;
    combinedTargetDieValue?: number | null;
    isMovable?: boolean;
    isForcedOrigin?: boolean;
    isLockedByBar?: boolean;
    isSelected?: boolean;
    isOpponentFrom?: boolean;
    isOpponentTo?: boolean;
    isFocused?: boolean;
    ariaLabel?: string;
    theme?: string;
    onClickPoint: (pointNumber: number, e: React.MouseEvent) => void;
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
    isHoverCombinedTarget = false,
    targetDieValue = null,
    secondaryTargetDieValue = null,
    combinedTargetDieValue = null,
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

    const showLevel1 =
        isHoverPrimaryTarget ||
        (isTargetDestination && !isHoverSecondaryTarget && !isHoverCombinedTarget);
    const showLevel2 = !showLevel1 && isHoverSecondaryTarget;
    const showLevel3 = !showLevel1 && !showLevel2 && isHoverCombinedTarget;
    const isAnyTarget = isTargetDestination || showLevel1 || showLevel2 || showLevel3;

    const mainPoints = isTopRow ? '1,0 99,0 50,292' : '1,300 99,300 50,8';

    const ghostNode = (
        <BoardPointGhostChecker
            pointNumber={pointNumber}
            isTargetDestination={isTargetDestination}
            showLevel1={showLevel1}
            showLevel2={showLevel2}
            showLevel3={showLevel3}
            targetDieValue={targetDieValue}
            secondaryTargetDieValue={secondaryTargetDieValue}
            combinedTargetDieValue={combinedTargetDieValue}
        />
    );

    return (
        <div
            data-point={pointNumber}
            data-testid={`point-triangle-${pointNumber}`}
            data-locked-by-bar={isLockedByBar ? 'true' : undefined}
            data-forced-origin={isForcedOrigin ? 'true' : undefined}
            role="button"
            aria-label={ariaLabel}
            aria-disabled={isLockedByBar && !isAnyTarget ? true : undefined}
            tabIndex={0}
            style={{ touchAction: 'none' }}
            className={`relative flex-1 min-w-0 min-h-[44px] [@media(max-height:540px)]:min-h-0 h-full flex flex-col items-center select-none group cursor-pointer transition-all duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] touch-none ${
                isSelected
                    ? 'ring-2 ring-amber-400/90 rounded-lg bg-amber-400/5 shadow-[0_0_16px_rgba(251,191,36,0.4)]'
                    : showLevel1
                      ? 'rounded-lg bg-sky-400/10'
                      : showLevel2 || showLevel3
                        ? 'rounded-lg bg-sky-400/5'
                        : ''
            }`}
            onClick={(e) => onClickPoint(pointNumber, e)}
            onContextMenu={(e) => {
                e.preventDefault();
                onRightClickPoint?.(pointNumber, e);
            }}
            onKeyDown={(e) => onKeyDownPoint?.(pointNumber, e)}
            onFocus={() => onFocusPoint?.(pointNumber)}
            onMouseEnter={() => onMouseEnterPoint?.(pointNumber)}
            onMouseLeave={() => onMouseLeavePoint?.(pointNumber)}
        >
            <span
                data-testid={`point-touch-zone-${pointNumber}`}
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full h-full min-w-[44px] min-h-[44px] touch-none"
                style={{ minWidth: '44px', minHeight: '44px', touchAction: 'none' }}
            />

            {isFocused && (
                <div
                    data-testid={`keyboard-focus-indicator-${pointNumber}`}
                    className="absolute inset-0 z-30 rounded-xl ring-2 ring-amber-400/90 shadow-[0_0_24px_rgba(251,191,36,0.5),inset_0_0_12px_rgba(251,191,36,0.2)] bg-amber-400/10 pointer-events-none transition-all duration-200"
                />
            )}

            <svg
                viewBox="0 0 100 300"
                preserveAspectRatio="none"
                shapeRendering="geometricPrecision"
                className="absolute inset-0 w-full h-[90%] pointer-events-none"
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
                    strokeWidth="0.6"
                    strokeLinejoin="round"
                />
                {showLevel1 && (
                    <polygon points={mainPoints} fill="rgba(56, 189, 248, 0.18)" stroke="#38BDF8" strokeWidth="2" strokeLinejoin="round" />
                )}
                {showLevel2 && (
                    <polygon points={mainPoints} fill="rgba(56, 189, 248, 0.10)" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 2" strokeLinejoin="round" />
                )}
                {showLevel3 && (
                    <polygon points={mainPoints} fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 3" strokeLinejoin="round" />
                )}
            </svg>

            <div
                data-testid={`point-stack-${pointNumber}`}
                data-stack-compressed={stackLayout.isCompressed ? 'true' : 'false'}
                data-stack-overlap={stackLayout.overlapPx}
                className={`relative z-10 flex flex-col items-center w-full max-h-full overflow-hidden py-0.5 pointer-events-none ${
                    isTopRow ? 'justify-start' : 'justify-end mt-auto'
                } ${isLockedByBar ? 'opacity-55 saturate-50' : ''}`}
            >
                {!isTopRow && ghostNode}

                {checkerColor &&
                    Array.from({ length: stackLayout.visibleCheckers }).map((_, idx) => {
                        const isTop = idx === stackLayout.apexIndex;
                        const showCount = isTop ? stackLayout.badgeCount : undefined;
                        const showBlotRing = isBlotTarget && checkerCount === 1;
                        return (
                            <div
                                key={idx}
                                data-testid={`checker-p${pointNumber}-${idx}`}
                                style={{
                                    marginTop: idx > 0 ? `-${stackLayout.overlapPx}px` : '0px',
                                    zIndex: isTopRow ? idx + 1 : stackLayout.visibleCheckers - idx,
                                }}
                                className={`relative checker-land pointer-events-auto transition-[transform,opacity] duration-150 [transition-timing-function:cubic-bezier(0.2,0.8,0.2,1)] ${
                                    isLockedByBar ? 'cursor-not-allowed' : ''
                                } ${isForcedOrigin && isTop ? 'rounded-full ring-2 ring-amber-400 animate-pulse' : ''}`}
                            >
                                {showBlotRing && (
                                    <span
                                        data-testid={`blot-alert-ring-${pointNumber}`}
                                        aria-hidden="true"
                                        className="absolute -inset-1 rounded-full pointer-events-none z-20"
                                        style={{
                                            border: '2.5px solid #EF4444',
                                            opacity: 0.7,
                                        }}
                                    />
                                )}
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

                {isTopRow && ghostNode}
            </div>

            {isOpponentTo && (
                <div
                    data-testid={`opp-to-indicator-${pointNumber}`}
                    className={`absolute z-20 w-4 h-4 rounded-full bg-slate-400/80 ring-1 ring-slate-200 pointer-events-none flex items-center justify-center text-[11px] font-bold text-slate-900 ${
                        isTopRow ? 'bottom-[16%]' : 'top-[16%]'
                    }`}
                >
                    ▼
                </div>
            )}

            {isOpponentFrom && (
                <div
                    data-testid={`opp-from-indicator-${pointNumber}`}
                    className={`absolute z-20 w-2.5 h-2.5 rounded-full bg-slate-400/70 ring-1 ring-slate-300 pointer-events-none ${
                        isTopRow ? 'top-[16%]' : 'bottom-[16%]'
                    }`}
                />
            )}
        </div>
    );
};

export const BoardPoint = React.memo(BoardPointComponent);
export default BoardPoint;
