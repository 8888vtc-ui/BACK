'use client';

/**
 * MiniBoardDiagram — Diagramme vectoriel ultra-léger de position Backgammon avec flèches comparatives (< 300 lignes, 0 any).
 */

import React, { useMemo } from 'react';
import {
    BOT_Y1,
    DIE_PIPS,
    LEFT_QUAD_X0,
    MINI_VB_H,
    MINI_VB_W,
    POINT_W,
    RIGHT_QUAD_X0,
    RIVER_Y,
    TOP_Y0,
    buildMiniCurvedPath,
    computeMiniPointCoords,
    parseDiagramMoveNotation,
    type MiniBoardDiagramProps,
    type MiniBoardMoveArrow,
} from './miniBoardGeometry';
import { MiniBoardPointCheckers } from './MiniBoardPointCheckers';

export {
    MINI_VB_H,
    MINI_VB_W,
    buildMiniCurvedPath,
    computeMiniPointCoords,
    parseDiagramMoveNotation,
    type MiniBoardDiagramProps,
    type MiniBoardMoveArrow,
};

const MiniBoardDiagramComponent: React.FC<MiniBoardDiagramProps> = ({
    board,
    dice = null,
    turn = 'X',
    playedMove,
    optimalMove,
    orientation = 'normal',
    hideOptimalArrow = false,
    hidePlayedArrow = false,
    highlightedPoints = [],
    onPointClick,
    showLegend = true,
    locale = 'fr',
    className = '',
}) => {
    const isEn = locale === 'en';

    const topPoints = useMemo(
        () =>
            orientation === 'normal'
                ? [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
                : [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        [orientation],
    );

    const botPoints = useMemo(
        () =>
            orientation === 'normal'
                ? [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
                : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        [orientation],
    );

    const playedArrows = useMemo(
        () => (hidePlayedArrow ? [] : parseDiagramMoveNotation(playedMove, turn)),
        [playedMove, turn, hidePlayedArrow],
    );

    const optimalArrows = useMemo(
        () => (hideOptimalArrow ? [] : parseDiagramMoveNotation(optimalMove, turn)),
        [optimalMove, turn, hideOptimalArrow],
    );

    const { barX, barO, offX, offO } = useMemo(() => {
        let onBoardX = 0;
        let onBoardO = 0;
        for (let p = 1; p <= 24; p++) {
            const v = board?.[p] ?? 0;
            if (v > 0) onBoardX += v;
            else if (v < 0) onBoardO += Math.abs(v);
        }
        const bx = Math.max(0, board?.[0] ?? 0);
        const bo = Math.abs(Math.min(0, board?.[25] ?? 0));
        return {
            barX: bx,
            barO: bo,
            offX: Math.max(0, 15 - onBoardX - bx),
            offO: Math.max(0, 15 - onBoardO - bo),
        };
    }, [board]);

    return (
        <div
            data-testid="mini-board-diagram"
            className={`rounded-2xl border border-white/10 bg-[#120a06] p-2 shadow-[0_14px_34px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,245,205,0.12)] ${className}`}
        >
            <svg
                viewBox={`0 0 ${MINI_VB_W} ${MINI_VB_H}`}
                role="img"
                aria-label={isEn ? `Backgammon position diagram, turn ${turn}` : `Diagramme de position Backgammon, trait à ${turn}`}
                data-testid="mini-board-svg"
                className="h-auto w-full select-none overflow-visible rounded-xl"
            >
                <defs>
                    <radialGradient id="mini-checker-x" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#fffdf9" />
                        <stop offset="65%" stopColor="#efe2c6" />
                        <stop offset="100%" stopColor="#c7b083" />
                    </radialGradient>
                    <radialGradient id="mini-checker-o" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#4a2512" />
                        <stop offset="60%" stopColor="#261107" />
                        <stop offset="100%" stopColor="#120703" />
                    </radialGradient>
                    <filter id="mini-glow-played" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.75" />
                    </filter>
                    <filter id="mini-glow-optimal" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
                    </filter>
                    <marker id="mini-arrowhead-played" markerWidth="9" markerHeight="7" refX="7.5" refY="3.5" orient="auto">
                        <polygon points="0 0, 9 3.5, 0 7, 2.2 3.5" fill="#ef4444" />
                    </marker>
                    <marker id="mini-arrowhead-optimal" markerWidth="9" markerHeight="7" refX="7.5" refY="3.5" orient="auto">
                        <polygon points="0 0, 9 3.5, 0 7, 2.2 3.5" fill="#10b981" />
                    </marker>
                </defs>

                {/* Cadre extérieur en acajou & filet laiton */}
                <rect x="1" y="1" width={MINI_VB_W - 2} height={MINI_VB_H - 2} rx="14" fill="#190e08" stroke="#d4af37" strokeOpacity="0.55" strokeWidth="1.5" />

                {/* Tapis de jeu gauche et droit */}
                <rect x={LEFT_QUAD_X0} y={TOP_Y0} width={6 * POINT_W} height={BOT_Y1 - TOP_Y0} rx="4" fill="#23140b" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1" />
                <rect x={RIGHT_QUAD_X0} y={TOP_Y0} width={6 * POINT_W} height={BOT_Y1 - TOP_Y0} rx="4" fill="#23140b" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1" />

                {/* 24 Flèches, Pions, Barre et Sabot */}
                <MiniBoardPointCheckers
                    board={board}
                    turn={turn}
                    topPoints={topPoints}
                    botPoints={botPoints}
                    barX={barX}
                    barO={barO}
                    offX={offX}
                    offO={offO}
                    highlightedPoints={highlightedPoints}
                    onPointClick={onPointClick}
                />

                {/* Dés du tour au centre de la rivière */}
                {dice && dice[0] >= 1 && dice[1] >= 1 && (
                    <g data-testid="mini-board-dice">
                        {[dice[0], dice[1]].map((dieVal, dIdx) => {
                            const dieSize = 28;
                            const dieX = LEFT_QUAD_X0 + 3 * POINT_W - dieSize - 4 + dIdx * (dieSize + 8);
                            const dieY = RIVER_Y - dieSize / 2;
                            const pips = DIE_PIPS[dieVal] ?? DIE_PIPS[1];

                            return (
                                <g key={`die-${dIdx}`} data-testid={`mini-board-die-${dIdx}`}>
                                    <rect x={dieX} y={dieY} width={dieSize} height={dieSize} rx="6" fill="#fdf8eb" stroke="#d4af37" strokeWidth="1.5" />
                                    {pips.map(([px, py], pIdx) => (
                                        <circle
                                            key={pIdx}
                                            cx={dieX + dieSize / 2 + px * (dieSize * 0.52)}
                                            cy={dieY + dieSize / 2 + py * (dieSize * 0.52)}
                                            r="2.4"
                                            fill="#1a0f07"
                                        />
                                    ))}
                                </g>
                            );
                        })}
                    </g>
                )}

                {/* SURIMPRESSION 1 : Flèches du coup joué (Rouge / Pointillé) */}
                {playedArrows.map((arrow, idx) => {
                    const start = computeMiniPointCoords(arrow.from, turn, false, orientation);
                    const end = computeMiniPointCoords(arrow.to, turn, true, orientation);
                    const path = buildMiniCurvedPath(start.x, start.y, end.x, end.y, idx);

                    return (
                        <g key={`played-arrow-${idx}-${arrow.from}-${arrow.to}`} data-testid="mini-board-arrow-played" filter="url(#mini-glow-played)">
                            <path d={path} fill="none" stroke="#ef4444" strokeWidth="3.2" strokeLinecap="round" strokeDasharray="7 5" markerEnd="url(#mini-arrowhead-played)" opacity="0.95" />
                            <circle cx={start.x} cy={start.y} r="4" fill="#ef4444" />
                        </g>
                    );
                })}

                {/* SURIMPRESSION 2 : Flèches du coup optimal (Vert / Or plein) */}
                {optimalArrows.map((arrow, idx) => {
                    const start = computeMiniPointCoords(arrow.from, turn, false, orientation);
                    const end = computeMiniPointCoords(arrow.to, turn, true, orientation);
                    const path = buildMiniCurvedPath(start.x, start.y, end.x, end.y, idx);

                    return (
                        <g key={`optimal-arrow-${idx}-${arrow.from}-${arrow.to}`} data-testid="mini-board-arrow-optimal" filter="url(#mini-glow-optimal)">
                            <path d={path} fill="none" stroke="#f3c65f" strokeWidth="5.2" strokeLinecap="round" opacity="0.35" />
                            <path d={path} fill="none" stroke="#10b981" strokeWidth="3.4" strokeLinecap="round" markerEnd="url(#mini-arrowhead-optimal)" opacity="0.98" />
                            <circle cx={start.x} cy={start.y} r="4.2" fill="#10b981" stroke="#f3c65f" strokeWidth="1" />
                        </g>
                    );
                })}
            </svg>

            {showLegend && (
                <div data-testid="mini-board-legend" className="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1.5 text-[10px] text-[#e8dcc6]/85">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-rose-300">
                            <span aria-hidden="true" className="inline-block h-0.5 w-4 border-b-2 border-dashed border-rose-400" />
                            <span>
                                {isEn ? 'Played' : 'Coup joué'}
                                {typeof playedMove === 'string' && playedMove ? ` (${playedMove})` : ''}
                            </span>
                        </span>
                        {!hideOptimalArrow && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                                <span aria-hidden="true" className="inline-block h-1 w-4 rounded-full bg-gradient-to-r from-[#f3c65f] to-emerald-400" />
                                <span>
                                    Optimal
                                    {typeof optimalMove === 'string' && optimalMove ? ` (${optimalMove})` : ''}
                                </span>
                            </span>
                        )}
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#f3c65f]/85">
                        {turn === 'X' ? (isEn ? 'Direction: 24 ➔ 1' : 'Sens : 24 ➔ 1') : isEn ? 'Direction: 1 ➔ 24' : 'Sens : 1 ➔ 24'}
                    </span>
                </div>
            )}
        </div>
    );
};

export const MiniBoardDiagram = React.memo(MiniBoardDiagramComponent);
export default MiniBoardDiagram;
