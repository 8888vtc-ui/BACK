'use client';

import React, { useState } from 'react';
import type { EvaluatedTurn } from '../../features/rating/types';

export type EquityChartMode = 'emg' | 'mwc' | 'luck';

export interface EquityCurveChartProps {
    moves: EvaluatedTurn[];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
    initialMode?: EquityChartMode;
}

export default function EquityCurveChart({
    moves,
    selectedIndex,
    onSelectIndex,
    initialMode = 'emg',
}: EquityCurveChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [chartMode, setChartMode] = useState<EquityChartMode>(initialMode);

    if (!moves || moves.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400">
                Aucun coup enregistré pour tracer la courbe d&apos;équité.
            </div>
        );
    }

    let runningLoss = 0;
    let runningLuck = 0;
    const pointsData = moves.map((m, index) => {
        runningLoss += m.equityLoss;
        runningLuck += m.luck ?? 0;
        const mwc = m.mwcAfter ?? Math.max(5, Math.min(95, 50 + runningLoss * 35));
        return {
            index,
            moveNumber: m.moveNumber || index + 1,
            dice: m.dice,
            playedNotation: m.playedNotation,
            optimalNotation: m.optimalNotation,
            equityLoss: m.equityLoss,
            cumulativeLoss: Number(runningLoss.toFixed(4)),
            mwcAfter: Number(mwc.toFixed(1)),
            cumulativeLuck: Number(runningLuck.toFixed(4)),
            verdict: m.verdict,
        };
    });

    const SVG_W = 760;
    const SVG_H = 220;
    const PAD_LEFT = 55;
    const PAD_RIGHT = 30;
    const PAD_TOP = 25;
    const PAD_BOTTOM = 35;
    const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
    const PLOT_H = SVG_H - PAD_TOP - PAD_BOTTOM;

    const minCumLoss = Math.min(...pointsData.map((p) => p.cumulativeLoss), -0.05);
    const lossRange = Math.abs(minCumLoss) || 0.1;

    const maxAbsLuck = Math.max(
        0.2,
        ...pointsData.map((p) => Math.abs(p.cumulativeLuck)),
    );

    const coords = pointsData.map((p, i) => {
        const x =
            pointsData.length === 1
                ? PAD_LEFT + PLOT_W / 2
                : PAD_LEFT + (i / (pointsData.length - 1)) * PLOT_W;

        let y: number;
        if (chartMode === 'mwc') {
            y = PAD_TOP + ((100 - p.mwcAfter) / 100) * PLOT_H;
        } else if (chartMode === 'luck') {
            const norm = (maxAbsLuck - p.cumulativeLuck) / (2 * maxAbsLuck);
            y = PAD_TOP + Math.max(0, Math.min(1, norm)) * PLOT_H;
        } else {
            y = PAD_TOP + (Math.abs(p.cumulativeLoss) / lossRange) * PLOT_H;
        }
        return { ...p, x, y };
    });

    const linePathD = coords.reduce(
        (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
        '',
    );

    const areaPathD =
        coords.length > 0
            ? `${linePathD} L ${coords[coords.length - 1].x} ${PAD_TOP + PLOT_H} L ${coords[0].x} ${PAD_TOP + PLOT_H} Z`
            : '';

    const gridLevels =
        chartMode === 'mwc'
            ? [100, 75, 50, 25, 0]
            : chartMode === 'luck'
                ? [maxAbsLuck, maxAbsLuck / 2, 0, -maxAbsLuck / 2, -maxAbsLuck]
                : [0, -lossRange * 0.33, -lossRange * 0.66, -lossRange];

    const activePoint = coords[selectedIndex] || coords[0];
    const displayPoint = hoveredIndex !== null ? coords[hoveredIndex] : activePoint;

    function getPointColor(verdict: string) {
        switch (verdict) {
            case 'optimal':
                return '#10b981';
            case 'acceptable':
                return '#14b8a6';
            case 'doubtful':
                return '#f59e0b';
            case 'blunder':
                return '#f43f5e';
            case 'howler':
                return '#ef4444';
            default:
                return '#94a3b8';
        }
    }

    return (
        <div
            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl"
            data-testid="equity-curve-container"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm">📈 Courbe d&apos;Équité Cumulée</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {moves.length} coups
                    </span>
                    <div
                        className="flex items-center gap-1 rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-[10px]"
                        data-testid="equity-chart-mode-switcher"
                    >
                        <button
                            type="button"
                            onClick={() => setChartMode('emg')}
                            data-testid="chart-mode-emg"
                            className={`px-2 py-0.5 rounded-lg font-bold transition ${
                                chartMode === 'emg'
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            EMG (ΔEq)
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartMode('mwc')}
                            data-testid="chart-mode-mwc"
                            className={`px-2 py-0.5 rounded-lg font-bold transition ${
                                chartMode === 'mwc'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            MWC %
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartMode('luck')}
                            data-testid="chart-mode-luck"
                            className={`px-2 py-0.5 rounded-lg font-bold transition ${
                                chartMode === 'luck'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Luck 🎲
                        </button>
                    </div>
                </div>

                {displayPoint && (
                    <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-sans">
                            Coup #{displayPoint.moveNumber} [{displayPoint.dice[0]}-{displayPoint.dice[1]}] :
                        </span>
                        <span className="text-white font-bold">{displayPoint.playedNotation}</span>
                        <span
                            className={`font-bold ${
                                displayPoint.equityLoss === 0
                                    ? 'text-emerald-400'
                                    : displayPoint.verdict === 'blunder' || displayPoint.verdict === 'howler'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                            }`}
                        >
                            ({displayPoint.equityLoss.toFixed(3)} ΔEq)
                        </span>
                        <span className="text-slate-400">
                            {chartMode === 'mwc'
                                ? `MWC : ${displayPoint.mwcAfter.toFixed(1)}%`
                                : chartMode === 'luck'
                                ? `Luck : ${displayPoint.cumulativeLuck >= 0 ? '+' : ''}${displayPoint.cumulativeLuck.toFixed(3)}`
                                : `Cumul : ${displayPoint.cumulativeLoss.toFixed(3)}`}
                        </span>
                    </div>
                )}
            </div>

            <div className="relative w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full h-auto select-none overflow-visible"
                    data-testid="equity-curve-svg"
                >
                    <defs>
                        <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {gridLevels.map((lvl, idx) => {
                        const y =
                            chartMode === 'mwc'
                                ? PAD_TOP + ((100 - lvl) / 100) * PLOT_H
                                : chartMode === 'luck'
                                ? PAD_TOP + ((maxAbsLuck - lvl) / (2 * maxAbsLuck)) * PLOT_H
                                : PAD_TOP + (Math.abs(lvl) / lossRange) * PLOT_H;
                        const label =
                            chartMode === 'mwc'
                                ? `${lvl.toFixed(0)}%`
                                : lvl === 0
                                ? '0.00'
                                : lvl.toFixed(2);
                        return (
                            <g key={idx} opacity={0.6}>
                                <line
                                    x1={PAD_LEFT}
                                    y1={y}
                                    x2={PAD_LEFT + PLOT_W}
                                    y2={y}
                                    stroke="#334155"
                                    strokeWidth="1"
                                    strokeDasharray={idx === 0 ? undefined : '4,4'}
                                />
                                <text
                                    x={PAD_LEFT - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#64748b"
                                    fontFamily="monospace"
                                >
                                    {label}
                                </text>
                            </g>
                        );
                    })}

                    {areaPathD && <path d={areaPathD} fill="url(#equityFill)" />}

                    <path
                        d={linePathD}
                        fill="none"
                        stroke={chartMode === 'mwc' ? '#818cf8' : chartMode === 'luck' ? '#fbbf24' : '#38bdf8'}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {activePoint && (
                        <line
                            x1={activePoint.x}
                            y1={PAD_TOP}
                            x2={activePoint.x}
                            y2={PAD_TOP + PLOT_H}
                            stroke="#38bdf8"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                            opacity="0.8"
                        />
                    )}

                    {coords.map((pt) => {
                        const isSelected = pt.index === selectedIndex;
                        const isHovered = pt.index === hoveredIndex;
                        const ptColor = getPointColor(pt.verdict);
                        const isMajorError = pt.verdict === 'blunder' || pt.verdict === 'howler';

                        return (
                            <g
                                key={pt.index}
                                className="cursor-pointer transition-transform"
                                onClick={() => onSelectIndex(pt.index)}
                                onMouseEnter={() => setHoveredIndex(pt.index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                data-testid={`equity-point-${pt.moveNumber}`}
                            >
                                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                                {isSelected && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="9"
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2.5"
                                        className="animate-pulse"
                                    />
                                )}
                                {isMajorError && !isSelected && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="7"
                                        fill="none"
                                        stroke="#f43f5e"
                                        strokeWidth="1.5"
                                        opacity="0.7"
                                    />
                                )}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isSelected || isHovered ? 5.5 : isMajorError ? 4.5 : 3.5}
                                    fill={ptColor}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                {(pt.index === 0 ||
                                    pt.index === coords.length - 1 ||
                                    pt.moveNumber % 5 === 0) && (
                                    <text
                                        x={pt.x}
                                        y={PAD_TOP + PLOT_H + 18}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="#64748b"
                                        fontFamily="monospace"
                                    >
                                        #{pt.moveNumber}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span>Optimal / Acceptable</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span>Douteux (-0.02 à -0.08)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span>Blunder (&lt; -0.08)</span>
                    </span>
                </div>
                <div className="text-slate-400 italic">
                    Astuce : Cliquez sur un point de la courbe pour inspecter la position correspondante.
                </div>
            </div>
        </div>
    );
}
