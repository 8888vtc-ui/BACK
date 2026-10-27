'use client';

/**
 * Sous-composant SVG des 24 flèches, pions, barre centrale et sabot de sortie pour MiniBoardDiagram (< 300 lignes, 0 any).
 */

import React from 'react';
import {
    BAR_W,
    BAR_X0,
    BOT_Y1,
    CHECKER_R,
    LEFT_QUAD_X0,
    MAX_STACK_VISIBLE,
    POINT_H,
    POINT_W,
    RIGHT_QUAD_X0,
    RIVER_Y,
    TOP_Y0,
    TRAY_W,
    TRAY_X0,
} from './miniBoardGeometry';

export interface MiniBoardPointCheckersProps {
    board: ReadonlyArray<number>;
    turn: 'X' | 'O';
    topPoints: ReadonlyArray<number>;
    botPoints: ReadonlyArray<number>;
    barX: number;
    barO: number;
    offX: number;
    offO: number;
    highlightedPoints: ReadonlyArray<number>;
    onPointClick?: (point: number) => void;
}

export const MiniBoardPointCheckers: React.FC<MiniBoardPointCheckersProps> = ({
    board,
    turn,
    topPoints,
    botPoints,
    barX,
    barO,
    offX,
    offO,
    highlightedPoints,
    onPointClick,
}) => {
    const renderPointColumn = (pt: number, idx: number, isTop: boolean) => {
        const x0 = idx < 6 ? LEFT_QUAD_X0 + idx * POINT_W : RIGHT_QUAD_X0 + (idx - 6) * POINT_W;
        const cx = x0 + POINT_W / 2;
        const baseY = isTop ? TOP_Y0 : BOT_Y1;
        const apexY = isTop ? TOP_Y0 + POINT_H : BOT_Y1 - POINT_H;
        const isDarkTriangle = pt % 2 === 1;
        const fillTriangle = isDarkTriangle ? '#5c2c16' : '#c89d54';
        const strokeTriangle = isDarkTriangle ? '#7c3f23' : '#dfba73';

        const rawVal = board?.[pt] ?? 0;
        const count = Math.abs(rawVal);
        const isXChecker = rawVal > 0;
        const visibleCount = Math.min(count, MAX_STACK_VISIBLE);
        const stepY = visibleCount >= 5 ? 23.5 : 26;

        const isHighlighted = highlightedPoints.includes(pt);
        const isInteractive = Boolean(onPointClick);

        return (
            <g
                key={`pt-${pt}`}
                data-testid={`mini-board-point-${pt}`}
                onClick={onPointClick ? () => onPointClick(pt) : undefined}
                className={isInteractive ? 'cursor-pointer' : undefined}
            >
                <rect
                    x={x0}
                    y={isTop ? TOP_Y0 : BOT_Y1 - POINT_H}
                    width={POINT_W}
                    height={POINT_H}
                    fill={isHighlighted ? 'rgba(243, 198, 95, 0.22)' : 'transparent'}
                    stroke={isHighlighted ? '#f3c65f' : 'none'}
                    strokeWidth={isHighlighted ? 1.5 : 0}
                    rx={4}
                />

                <polygon
                    points={`${x0 + 2},${baseY} ${x0 + POINT_W - 2},${baseY} ${cx},${apexY}`}
                    fill={fillTriangle}
                    stroke={strokeTriangle}
                    strokeWidth="0.8"
                    opacity="0.92"
                />

                <text
                    x={cx}
                    y={isTop ? TOP_Y0 - 7 : BOT_Y1 + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fill={isHighlighted ? '#f3c65f' : '#e8dcc6'}
                    opacity={isHighlighted ? 1 : 0.8}
                >
                    {pt}
                </text>

                {Array.from({ length: visibleCount }).map((_, stackIdx) => {
                    const cy = isTop
                        ? TOP_Y0 + CHECKER_R + 2 + stackIdx * stepY
                        : BOT_Y1 - CHECKER_R - 2 - stackIdx * stepY;
                    const isApex = stackIdx === visibleCount - 1;
                    const showBadge = isApex && count > MAX_STACK_VISIBLE;

                    return (
                        <g
                            key={`checker-${pt}-${stackIdx}`}
                            data-testid={isApex ? `mini-board-checker-${pt}` : undefined}
                        >
                            <circle
                                cx={cx}
                                cy={cy}
                                r={CHECKER_R}
                                fill={isXChecker ? 'url(#mini-checker-x)' : 'url(#mini-checker-o)'}
                                stroke={isXChecker ? '#fff8e7' : '#d4af37'}
                                strokeWidth={isXChecker ? '1.3' : '1.1'}
                            />
                            <circle
                                cx={cx}
                                cy={cy}
                                r={CHECKER_R - 4}
                                fill="none"
                                stroke={isXChecker ? 'rgba(180,145,80,0.35)' : 'rgba(243,198,95,0.28)'}
                                strokeWidth="0.9"
                            />
                            {showBadge && (
                                <text
                                    x={cx}
                                    y={cy + 3.5}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fontWeight="900"
                                    fontFamily="ui-monospace, SFMono-Regular, monospace"
                                    fill={isXChecker ? '#1a0f07' : '#fdf8eb'}
                                >
                                    ×{count}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        );
    };

    return (
        <>
            {/* Barre centrale */}
            <rect
                x={BAR_X0}
                y={TOP_Y0}
                width={BAR_W}
                height={BOT_Y1 - TOP_Y0}
                fill="#140b06"
                stroke="#d4af37"
                strokeOpacity="0.35"
                strokeWidth="1"
            />
            <text
                x={BAR_X0 + BAR_W / 2}
                y={RIVER_Y + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="800"
                letterSpacing="1"
                fill="#d4af37"
                opacity="0.65"
            >
                BAR
            </text>

            {/* Sabot de sortie (Bear-off Tray) à droite */}
            <g
                data-testid="mini-board-off-tray"
                onClick={onPointClick ? () => onPointClick(turn === 'X' ? 0 : 25) : undefined}
                className={onPointClick ? 'cursor-pointer' : undefined}
            >
                <rect
                    x={TRAY_X0}
                    y={TOP_Y0}
                    width={TRAY_W}
                    height={BOT_Y1 - TOP_Y0}
                    rx="6"
                    fill="#120904"
                    stroke="#d4af37"
                    strokeOpacity="0.4"
                    strokeWidth="1"
                />
                <text x={TRAY_X0 + TRAY_W / 2} y={TOP_Y0 + 22} textAnchor="middle" fontSize="8" fontWeight="700" fill="#e8dcc6" opacity="0.65">
                    OFF O
                </text>
                <text x={TRAY_X0 + TRAY_W / 2} y={TOP_Y0 + 40} textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#f3c65f">
                    {offO}
                </text>
                <text x={TRAY_X0 + TRAY_W / 2} y={RIVER_Y + 4} textAnchor="middle" fontSize="10" fontWeight="900" fill="#f3c65f" data-testid="mini-board-direction">
                    {turn === 'X' ? '24↓1' : '1↑24'}
                </text>
                <text x={TRAY_X0 + TRAY_W / 2} y={BOT_Y1 - 28} textAnchor="middle" fontSize="8" fontWeight="700" fill="#e8dcc6" opacity="0.65">
                    OFF X
                </text>
                <text x={TRAY_X0 + TRAY_W / 2} y={BOT_Y1 - 12} textAnchor="middle" fontSize="12" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#fdf8eb">
                    {offX}
                </text>
            </g>

            {/* Rendu des 24 flèches et de leurs pions */}
            {topPoints.map((pt, idx) => renderPointColumn(pt, idx, true))}
            {botPoints.map((pt, idx) => renderPointColumn(pt, idx, false))}

            {/* Pions sur la barre centrale */}
            {barO > 0 && (
                <g data-testid="mini-board-bar-o">
                    <circle cx={BAR_X0 + BAR_W / 2} cy={TOP_Y0 + 62} r={CHECKER_R - 1} fill="url(#mini-checker-o)" stroke="#d4af37" strokeWidth="1.2" />
                    <text x={BAR_X0 + BAR_W / 2} y={TOP_Y0 + 66} textAnchor="middle" fontSize="10" fontWeight="900" fill="#fdf8eb">
                        {barO > 1 ? `×${barO}` : 'O'}
                    </text>
                </g>
            )}
            {barX > 0 && (
                <g data-testid="mini-board-bar-x">
                    <circle cx={BAR_X0 + BAR_W / 2} cy={BOT_Y1 - 62} r={CHECKER_R - 1} fill="url(#mini-checker-x)" stroke="#fff8e7" strokeWidth="1.2" />
                    <text x={BAR_X0 + BAR_W / 2} y={BOT_Y1 - 58} textAnchor="middle" fontSize="10" fontWeight="900" fill="#1a0f07">
                        {barX > 1 ? `×${barX}` : 'X'}
                    </text>
                </g>
            )}
        </>
    );
};

export default MiniBoardPointCheckers;
