'use client';

import React, { useState } from 'react';
import type { EvaluatedTurn } from '../../features/rating/types';

export interface EquityCurveChartProps {
    moves: EvaluatedTurn[];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
}

export default function EquityCurveChart({
    moves,
    selectedIndex,
    onSelectIndex,
}: EquityCurveChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!moves || moves.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400">
                Aucun coup enregistré pour tracer la courbe d'équité.
            </div>
        );
    }

    // Calcul de l'équité cumulée à chaque tour
    let runningLoss = 0;
    const pointsData = moves.map((m, index) => {
        runningLoss += m.equityLoss;
        return {
            index,
            moveNumber: m.moveNumber || index + 1,
            dice: m.dice,
            playedNotation: m.playedNotation,
            optimalNotation: m.optimalNotation,
            equityLoss: m.equityLoss,
            cumulativeLoss: Number(runningLoss.toFixed(4)),
            verdict: m.verdict,
        };
    });

    // Paramètres graphiques du canevas SVG
    const SVG_W = 760;
    const SVG_H = 220;
    const PAD_LEFT = 55;
    const PAD_RIGHT = 30;
    const PAD_TOP = 25;
    const PAD_BOTTOM = 35;

    const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
    const PLOT_H = SVG_H - PAD_TOP - PAD_BOTTOM;

    const minCumLoss = Math.min(...pointsData.map((p) => p.cumulativeLoss), -0.05);
    const maxCumLoss = 0; // Le point de départ idéal est 0.00
    const lossRange = Math.abs(minCumLoss) || 0.1;

    // Coordonnées de chaque point
    const coords = pointsData.map((p, i) => {
        const x = pointsData.length === 1
            ? PAD_LEFT + PLOT_W / 2
            : PAD_LEFT + (i / (pointsData.length - 1)) * PLOT_W;
        // 0.00 est en haut (PAD_TOP), minCumLoss est en bas (PAD_TOP + PLOT_H)
        const y = PAD_TOP + (Math.abs(p.cumulativeLoss) / lossRange) * PLOT_H;
        return { ...p, x, y };
    });

    // Construction du tracé de la ligne SVG
    const linePathD = coords.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Zone ombrée sous la courbe
    const areaPathD = coords.length > 0
        ? `${linePathD} L ${coords[coords.length - 1].x} ${PAD_TOP + PLOT_H} L ${coords[0].x} ${PAD_TOP + PLOT_H} Z`
        : '';

    // Lignes de repère horizontales
    const gridLevels = [0, -lossRange * 0.33, -lossRange * 0.66, -lossRange];

    const activePoint = coords[selectedIndex] || coords[0];
    const displayPoint = hoveredIndex !== null ? coords[hoveredIndex] : activePoint;

    // Couleurs selon verdict
    function getPointColor(verdict: string) {
        switch (verdict) {
            case 'optimal':
                return '#10b981'; // emerald-500
            case 'acceptable':
                return '#14b8a6'; // teal-500
            case 'doubtful':
                return '#f59e0b'; // amber-500
            case 'blunder':
                return '#f43f5e'; // rose-500
            case 'howler':
                return '#ef4444'; // red-500
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
                <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold text-sm">📈 Courbe d'Équité Cumulée</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {moves.length} coups
                    </span>
                </div>

                {/* Info-bulle dynamique du coup pointé / sélectionné */}
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
                            Cumul : {displayPoint.cumulativeLoss.toFixed(3)}
                        </span>
                    </div>
                )}
            </div>

            {/* Canevas SVG interactif */}
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

                    {/* Lignes de niveau horizontales */}
                    {gridLevels.map((lvl, idx) => {
                        const y = PAD_TOP + (Math.abs(lvl) / lossRange) * PLOT_H;
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
                                    {lvl === 0 ? '0.00' : lvl.toFixed(2)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Axe zéro (optimal pur) */}
                    <line
                        x1={PAD_LEFT}
                        y1={PAD_TOP}
                        x2={PAD_LEFT + PLOT_W}
                        y2={PAD_TOP}
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                    />

                    {/* Remplissage de la surface sous la courbe */}
                    {areaPathD && <path d={areaPathD} fill="url(#equityFill)" />}

                    {/* Ligne principale de la courbe d'équité */}
                    <path
                        d={linePathD}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Ligne verticale de repère pour le coup sélectionné */}
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

                    {/* Points cliquables sur la courbe */}
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
                                {/* Zone tactile agrandie */}
                                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                                {/* Anneau de sélection active */}
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

                                {/* Anneau de blunder */}
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

                                {/* Point central */}
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isSelected || isHovered ? 5.5 : isMajorError ? 4.5 : 3.5}
                                    fill={ptColor}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />

                                {/* Numéro du coup sous l'axe X (tous les 5 coups ou aux extrémités) */}
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

            {/* Légende interactive sous la courbe */}
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
