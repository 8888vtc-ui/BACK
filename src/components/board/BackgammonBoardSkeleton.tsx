'use client';

import React from 'react';
/**
 * Skeleton / État de chargement du plateau de Backgammon.
 * Conserve rigoureusement le ratio 16:10 (viewBox 1120x700) et la structure géométrique.
 */

const VB_W = 1120;
const VB_H = 700;
const BORDER_TB = 44;
const BORDER_LR = 30;
const TRAY_W = 120;
const BAR_W = 76;

const PLAY_X0 = BORDER_LR; // 30
const PLAY_X1 = VB_W - BORDER_LR; // 1090
const PLAY_Y0 = BORDER_TB; // 44
const PLAY_Y1 = VB_H - BORDER_TB; // 656
const PLAY_H = PLAY_Y1 - PLAY_Y0; // 612

const TRAY_X0 = PLAY_X1 - TRAY_W; // 970
const PTS_X0 = PLAY_X0; // 30
const PTS_X1 = TRAY_X0; // 970
const PTS_W = PTS_X1 - PTS_X0; // 940

const BAR_CX = PTS_X0 + PTS_W / 2; // 500
const BAR_X0 = BAR_CX - BAR_W / 2; // 462
const BAR_X1 = BAR_CX + BAR_W / 2; // 538

const HALF_W = BAR_X0 - PTS_X0; // 432
const POINT_W = HALF_W / 6; // 72

const POINT_H = 264;
const RIVER_H = PLAY_H - 2 * POINT_H; // 84
const TOP_BASE = PLAY_Y0; // 44
const TOP_APEX = TOP_BASE + POINT_H; // 308
const RIVER_Y0 = TOP_APEX; // 308
const RIVER_Y1 = RIVER_Y0 + RIVER_H; // 392
const BOT_APEX = RIVER_Y1; // 392
const BOT_BASE = PLAY_Y1; // 656

function pointLayout(point: number): { x: number; top: boolean } {
    if (point >= 13 && point <= 18) return { x: PTS_X0 + (point - 13) * POINT_W, top: true };
    if (point >= 19 && point <= 24) return { x: BAR_X1 + (point - 19) * POINT_W, top: true };
    if (point >= 7 && point <= 12) return { x: PTS_X0 + (12 - point) * POINT_W, top: false };
    return { x: BAR_X1 + (6 - point) * POINT_W, top: false };
}

function trianglePoints(point: number): string {
    const { x, top } = pointLayout(point);
    return top
        ? `${x},${TOP_BASE} ${x + POINT_W},${TOP_BASE} ${x + POINT_W / 2},${TOP_APEX}`
        : `${x},${BOT_BASE} ${x + POINT_W},${BOT_BASE} ${x + POINT_W / 2},${BOT_APEX}`;
}

export type SkeletonTheme = 'snowie_classic' | 'tournament' | 'midnight';

export default function BackgammonBoardSkeleton({
    message = 'Chargement du plateau de jeu...',
    theme = 'snowie_classic',
}: {
    message?: string;
    theme?: SkeletonTheme;
}) {
    const isSnowie = theme === 'snowie_classic';
    const isTour = theme === 'tournament';
    const frameColor = isSnowie ? '#2b170c' : isTour ? '#5c3a21' : '#0b1220';
    const innerColor = isSnowie ? '#422413' : isTour ? '#7a4f2e' : '#1e293b';
    const surfaceColor = isSnowie ? '#0f3d26' : isTour ? '#14532d' : '#0f172a';
    const riverColor = isSnowie ? '#0b331f' : isTour ? '#115e3e' : '#0d1526';
    const ptA = isSnowie ? '#f4ecd8' : isTour ? '#e7dcc3' : '#1e293b';
    const ptB = isSnowie ? '#831b28' : isTour ? '#1f6f4a' : '#172554';
    const barColor = isSnowie ? '#241207' : isTour ? '#3e2714' : '#1e293b';
    const barLine = isSnowie ? '#d4af37' : isTour ? '#5c3a21' : '#334155';
    const trayColor = isSnowie ? '#241207' : isTour ? '#3e2714' : '#0b1220';

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={message}
            className="relative h-full max-h-full aspect-[16/10] w-auto max-w-6xl select-none flex items-center justify-center"
            style={{ width: 'auto' }}
        >
            <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="h-full w-full max-h-full block animate-pulse opacity-90 object-contain"
                style={{ touchAction: 'none' }}
            >
                {/* Cadre externe */}
                <rect x={0} y={0} width={VB_W} height={VB_H} rx={18} fill={frameColor} />
                <rect x={10} y={10} width={VB_W - 20} height={VB_H - 20} rx={12} fill={innerColor} />

                {/* Surface de jeu */}
                <rect x={PLAY_X0} y={PLAY_Y0} width={PLAY_X1 - PLAY_X0} height={PLAY_H} fill={surfaceColor} />

                {/* Rivière centrale */}
                <rect x={PTS_X0} y={RIVER_Y0} width={PTS_W} height={RIVER_H} fill={riverColor} />

                {/* 24 flèches / triangles avec alternance de teintes feutrées */}
                {Array.from({ length: 24 }, (_, i) => i + 1).map((p) => {
                    const { top } = pointLayout(p);
                    const idx = top ? (p >= 19 ? p - 19 : p - 13) : (p >= 7 ? 12 - p : 6 - p);
                    return (
                        <polygon
                            key={`s-pt${p}`}
                            points={trianglePoints(p)}
                            fill={idx % 2 === 0 ? ptA : ptB}
                            opacity={0.65}
                        />
                    );
                })}

                {/* Barre centrale texturée */}
                <rect x={BAR_X0} y={PLAY_Y0} width={BAR_W} height={PLAY_H} fill={barColor} opacity={0.8} />
                <line x1={BAR_X0} y1={PLAY_Y0} x2={BAR_X0} y2={PLAY_Y1} stroke={barLine} strokeWidth={3} />
                <line x1={BAR_X1} y1={PLAY_Y0} x2={BAR_X1} y2={PLAY_Y1} stroke={barLine} strokeWidth={3} />

                {/* Sabots de sortie */}
                <rect x={TRAY_X0} y={PLAY_Y0} width={TRAY_W} height={PLAY_H / 2 - 4} rx={8} fill={trayColor} opacity={0.5} />
                <rect x={TRAY_X0} y={PLAY_Y0 + PLAY_H / 2 + 4} width={TRAY_W} height={PLAY_H / 2 - 4} rx={8} fill={trayColor} opacity={0.35} />

                {/* Emplacements dés skeleton dans la rivière */}
                <rect x={BAR_CX + 140} y={323} width={54} height={54} rx={10} fill="#1e293b" stroke="#334155" strokeWidth={2} />
                <rect x={BAR_CX + 210} y={323} width={54} height={54} rx={10} fill="#1e293b" stroke="#334155" strokeWidth={2} />

                {/* Badges pip count skeleton */}
                <rect x={TRAY_X0 + 6} y={6} width={TRAY_W - 12} height={32} rx={8} fill="#1e293b" opacity={0.7} />
                <rect x={TRAY_X0 + 6} y={VB_H - 38} width={TRAY_W - 12} height={32} rx={8} fill="#1e293b" opacity={0.7} />
            </svg>

            {/* Overlay central avec spinner et message */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/40 backdrop-blur-[2px]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/80 p-3 shadow-xl ring-2 ring-blue-500/30">
                    <svg className="h-8 w-8 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                </div>
                <p className="rounded-full bg-slate-900/80 px-4 py-1.5 text-sm font-medium tracking-wide text-slate-200 shadow-lg ring-1 ring-slate-700/60">
                    {message}
                </p>
            </div>
        </div>
    );
}
