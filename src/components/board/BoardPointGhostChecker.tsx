'use client';

/**
 * @file src/components/board/BoardPointGhostChecker.tsx
 * @description Rendu des pions fantômes (Ghost Checkers) stratifiés à 3 niveaux sur une flèche.
 * Strictement < 130 lignes, 0 `any`.
 */

import React from 'react';

export interface BoardPointGhostCheckerProps {
    readonly pointNumber: number;
    readonly isTargetDestination: boolean;
    readonly showLevel1: boolean;
    readonly showLevel2: boolean;
    readonly showLevel3: boolean;
    readonly targetDieValue?: number | null;
    readonly secondaryTargetDieValue?: number | null;
    readonly combinedTargetDieValue?: number | null;
}

const GHOST_CHECKER_SIZE = 'clamp(21px, min(6.8vw, calc((100dvh - 105px) / 11.4)), 46px)';

export const BoardPointGhostChecker: React.FC<BoardPointGhostCheckerProps> = ({
    pointNumber,
    isTargetDestination,
    showLevel1,
    showLevel2,
    showLevel3,
    targetDieValue = null,
    secondaryTargetDieValue = null,
    combinedTargetDieValue = null,
}) => {
    if (showLevel1) {
        return (
            <div
                data-testid={isTargetDestination ? `ghost-checker-${pointNumber}` : `hover-target-primary-${pointNumber}`}
                data-ghost-level="1"
                className="relative z-20 rounded-full pointer-events-none flex items-center justify-center shrink-0"
                style={{
                    width: GHOST_CHECKER_SIZE,
                    height: GHOST_CHECKER_SIZE,
                    opacity: 0.38,
                    border: '2px solid #38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.38)',
                    boxShadow: '0 0 12px rgba(56, 189, 248, 0.45)',
                }}
            >
                <span
                    data-testid={`ghost-badge-${pointNumber}`}
                    className="flex items-center justify-center rounded-full bg-slate-950/90 text-[#38BDF8] text-[10px] font-black leading-none border border-[#38BDF8]/80"
                    style={{ width: '18px', height: '18px' }}
                >
                    {targetDieValue ?? ''}
                </span>
            </div>
        );
    }
    if (showLevel2) {
        return (
            <div
                data-testid={isTargetDestination ? `ghost-checker-${pointNumber}` : `hover-target-secondary-${pointNumber}`}
                data-ghost-level="2"
                className="relative z-20 rounded-full pointer-events-none flex items-center justify-center shrink-0"
                style={{
                    width: GHOST_CHECKER_SIZE,
                    height: GHOST_CHECKER_SIZE,
                    opacity: 0.22,
                    border: '1.5px dashed #38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.22)',
                }}
            >
                <span
                    data-testid={`ghost-badge-secondary-${pointNumber}`}
                    className="flex items-center justify-center rounded-full bg-slate-950/90 text-[#38BDF8] text-[10px] font-black leading-none border border-[#38BDF8]/70"
                    style={{ width: '18px', height: '18px' }}
                >
                    {secondaryTargetDieValue ?? targetDieValue ?? ''}
                </span>
            </div>
        );
    }
    if (showLevel3) {
        return (
            <div
                data-testid={isTargetDestination ? `ghost-checker-${pointNumber}` : `hover-target-combined-${pointNumber}`}
                data-ghost-level="3"
                className="relative z-20 rounded-full pointer-events-none flex items-center justify-center shrink-0"
                style={{
                    width: GHOST_CHECKER_SIZE,
                    height: GHOST_CHECKER_SIZE,
                    opacity: 0.45,
                    border: '1.5px dotted #38BDF8',
                    background: 'none',
                }}
            >
                <span
                    data-testid={`ghost-badge-combined-${pointNumber}`}
                    className="flex items-center justify-center rounded-full bg-slate-950/90 text-[#38BDF8] text-[10px] font-black leading-none px-1.5 border border-[#38BDF8]/70"
                    style={{ minWidth: '22px', height: '18px' }}
                >
                    {combinedTargetDieValue ?? ''}
                </span>
            </div>
        );
    }
    return null;
};
