'use client';

/**
 * Grille visuelle du plateau (points 1-24 + BAR avec pions) pour ReviewBoardPreview (< 180 lignes, 0 any).
 */

import React, { useCallback } from 'react';

export interface ReviewBoardGridProps {
    activeBoard: number[];
    dice: [number, number];
    playedMoves: Array<{ from: number; to: number }>;
    optimalMoves: Array<{ from: number; to: number }>;
    isMistake: boolean;
    hideSolution: boolean;
}

export const ReviewBoardGrid: React.FC<ReviewBoardGridProps> = ({
    activeBoard,
    dice,
    playedMoves,
    optimalMoves,
    isMistake,
    hideSolution,
}) => {
    const barXCount = Math.max(0, activeBoard?.[25] ?? 0);
    const barOCount = Math.abs(Math.min(0, activeBoard?.[0] ?? 0));

    const renderPoint = useCallback(
        (pointNum: number, isTop: boolean) => {
            const count = (activeBoard && activeBoard[pointNum]) || 0;
            const isX = count > 0;
            const numCheckers = Math.abs(count);
            const isAltColor = pointNum % 2 === 0;

            const isPlayedDest = !hideSolution && playedMoves.some((m) => m.to === pointNum);
            const isOptimalDest = !hideSolution && optimalMoves.some((m) => m.to === pointNum);

            return (
                <div
                    key={pointNum}
                    className={`relative flex flex-col items-center flex-1 h-32 sm:h-40 border-r border-white/10 last:border-r-0 ${
                        isTop ? 'justify-start pt-1' : 'justify-end pb-1'
                    } ${
                        isPlayedDest
                            ? isMistake
                                ? 'bg-rose-950/20 ring-1 ring-inset ring-rose-500/40'
                                : 'bg-emerald-950/20 ring-1 ring-inset ring-emerald-500/40'
                            : isOptimalDest && isMistake
                              ? 'bg-emerald-950/25 ring-1 ring-inset ring-emerald-400/50'
                              : isAltColor
                                ? 'bg-slate-900/60'
                                : 'bg-slate-950/60'
                    }`}
                >
                    <div
                        className={`text-xs font-mono font-semibold ${
                            isTop ? 'order-first mb-0.5' : 'order-last mt-0.5'
                        } ${
                            isOptimalDest
                                ? 'text-emerald-300 font-bold'
                                : isPlayedDest
                                  ? isMistake
                                      ? 'text-rose-300 font-bold'
                                      : 'text-emerald-300'
                                  : 'text-slate-400'
                        }`}
                    >
                        {pointNum}
                    </div>

                    <div
                        className={`flex flex-col items-center gap-0.5 w-full ${
                            isTop ? 'flex-col' : 'flex-col-reverse'
                        }`}
                    >
                        {Array.from({ length: Math.min(numCheckers, 5) }).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-all ${
                                    isX
                                        ? 'bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 border border-white/80 ring-1 ring-black/20'
                                        : 'bg-gradient-to-b from-amber-700 to-amber-950 text-amber-100 border border-amber-600/60'
                                }`}
                            >
                                {idx === 4 && numCheckers > 5 ? `+${numCheckers - 4}` : ''}
                            </div>
                        ))}
                    </div>

                    {isOptimalDest && isMistake && (
                        <span
                            className={`absolute ${
                                isTop ? 'bottom-1' : 'top-1'
                            } rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950 shadow-sm`}
                            title="Destination optimale GNUBG"
                        >
                            ✓ Opt.
                        </span>
                    )}
                    {isPlayedDest && (
                        <span
                            className={`absolute ${
                                isTop ? 'bottom-6' : 'top-6'
                            } rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${
                                isMistake ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                            }`}
                            title="Destination coup joué"
                        >
                            {isMistake ? '✕ Joué' : '✓ Joué'}
                        </span>
                    )}
                </div>
            );
        },
        [activeBoard, playedMoves, optimalMoves, isMistake, hideSolution],
    );

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-2 sm:p-3 overflow-hidden shadow-inner">
            <div className="flex items-stretch border-b border-white/10">
                <div className="flex flex-1">{[13, 14, 15, 16, 17, 18].map((p) => renderPoint(p, true))}</div>
                <div className="w-8 sm:w-10 bg-slate-950 flex flex-col items-center justify-center gap-1 border-x border-white/10 text-xs font-mono text-slate-400">
                    <span>BAR</span>
                    {barXCount > 0 && (
                        <span
                            data-testid="review-bar-x-count"
                            className="w-5 h-5 rounded-full bg-gradient-to-b from-slate-100 to-slate-300 text-slate-900 text-xs font-bold flex items-center justify-center shadow"
                            title={`${barXCount} pion(s) X sur la barre`}
                        >
                            {barXCount}
                        </span>
                    )}
                </div>
                <div className="flex flex-1">{[19, 20, 21, 22, 23, 24].map((p) => renderPoint(p, true))}</div>
            </div>

            <div className="h-7 sm:h-8 flex items-center justify-between px-3 text-xs text-slate-300 bg-slate-950/70 border-y border-white/10 font-mono">
                <span>JAN EXTÉRIEUR (13-18 / 12-7)</span>
                <span className="text-amber-400 font-bold">
                    Jet [{dice[0]}-{dice[1]}]
                </span>
                <span>JAN INTÉRIEUR (19-24 / 6-1)</span>
            </div>

            <div className="flex items-stretch">
                <div className="flex flex-1">{[12, 11, 10, 9, 8, 7].map((p) => renderPoint(p, false))}</div>
                <div className="w-8 sm:w-10 bg-slate-950 flex flex-col items-center justify-center gap-1 border-x border-white/10 text-xs font-mono text-slate-400">
                    <span>BAR</span>
                    {barOCount > 0 && (
                        <span
                            data-testid="review-bar-o-count"
                            className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-700 to-amber-950 text-amber-100 text-xs font-bold flex items-center justify-center border border-amber-600/60 shadow"
                            title={`${barOCount} pion(s) O sur la barre`}
                        >
                            {barOCount}
                        </span>
                    )}
                </div>
                <div className="flex flex-1">{[6, 5, 4, 3, 2, 1].map((p) => renderPoint(p, false))}</div>
            </div>
        </div>
    );
};

export default ReviewBoardGrid;
