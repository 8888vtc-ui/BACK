'use client';

import React, { useState, useMemo } from 'react';
import type { ProgressionDataPoint } from '../../features/analytics/types';

export interface ProgressionCurveProps {
    data: ProgressionDataPoint[];
    onSelectGame?: (gameId: string) => void;
}

export default function ProgressionCurve({ data, onSelectGame }: ProgressionCurveProps) {
    const [rangeFilter, setRangeFilter] = useState<'all' | '20' | '5'>('all');
    const [metricType, setMetricType] = useState<'pr' | 'elo'>('pr');
    const [hoveredPoint, setHoveredPoint] = useState<ProgressionDataPoint | null>(null);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        if (rangeFilter === '5') return data.slice(-5);
        if (rangeFilter === '20') return data.slice(-20);
        return data;
    }, [data, rangeFilter]);

    if (!data || data.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400">
                Jouez vos premières parties complètes pour générer la courbe de progression.
            </div>
        );
    }

    // Statistiques clés
    const bestPR = Math.min(...data.map((d) => d.performanceRating));
    const latestPR = data[data.length - 1]?.performanceRating ?? 0;
    const latestElo = data[data.length - 1]?.estimatedElo ?? 1500;
    const initialPR = data[0]?.performanceRating ?? latestPR;
    const prImprovement = Number((initialPR - latestPR).toFixed(1));

    // Paramètres SVG
    const SVG_W = 760;
    const SVG_H = 220;
    const PAD_LEFT = 55;
    const PAD_RIGHT = 30;
    const PAD_TOP = 25;
    const PAD_BOTTOM = 35;
    const PLOT_W = SVG_W - PAD_LEFT - PAD_RIGHT;
    const PLOT_H = SVG_H - PAD_TOP - PAD_BOTTOM;

    // Plages de valeurs selon la métrique choisie
    const isPR = metricType === 'pr';
    const values = filteredData.map((d) => (isPR ? d.performanceRating : d.estimatedElo));
    const maValues = filteredData.map((d) => (isPR ? d.movingAveragePR : d.estimatedElo));

    // Pour le PR, une valeur plus basse est meilleure (0 en haut ou échelle standard)
    const minVal = Math.min(...values, ...maValues);
    const maxVal = Math.max(...values, ...maValues);
    const valRange = maxVal - minVal || (isPR ? 5 : 100);

    const coords = filteredData.map((pt, i) => {
        const x = filteredData.length === 1
            ? PAD_LEFT + PLOT_W / 2
            : PAD_LEFT + (i / (filteredData.length - 1)) * PLOT_W;

        const val = isPR ? pt.performanceRating : pt.estimatedElo;
        const maVal = isPR ? pt.movingAveragePR : pt.estimatedElo;

        // Si PR : inverser pour que le meilleur PR (le plus bas) soit en haut
        const y = isPR
            ? PAD_TOP + ((val - minVal) / valRange) * PLOT_H
            : PAD_TOP + PLOT_H - ((val - minVal) / valRange) * PLOT_H;

        const maY = isPR
            ? PAD_TOP + ((maVal - minVal) / valRange) * PLOT_H
            : PAD_TOP + PLOT_H - ((maVal - minVal) / valRange) * PLOT_H;

        return { ...pt, x, y, maY, val, maVal };
    });

    const rawLineD = coords.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
    const maLineD = coords.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.maY}` : `${acc} L ${pt.x} ${pt.maY}`), '');

    return (
        <div
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4"
            data-testid="progression-curve-container"
        >
            {/* 1. En-tête avec filtres et indicateurs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>📈</span>
                        <span>Courbe de Progression &amp; Tendance Chronologique</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {isPR ? 'Évolution du Performance Rating (PR) — plus bas = plus fort' : 'Évolution du Rating Elo estimé'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Bascule métrique PR vs Elo */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                            type="button"
                            onClick={() => setMetricType('pr')}
                            className={`px-3 py-1 rounded-lg font-bold transition ${
                                isPR ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            PR
                        </button>
                        <button
                            type="button"
                            onClick={() => setMetricType('elo')}
                            className={`px-3 py-1 rounded-lg font-bold transition ${
                                !isPR ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Elo
                        </button>
                    </div>

                    {/* Filtre d'échéance */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                            type="button"
                            onClick={() => setRangeFilter('5')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                rangeFilter === '5' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            5m
                        </button>
                        <button
                            type="button"
                            onClick={() => setRangeFilter('20')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                rangeFilter === '20' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            20m
                        </button>
                        <button
                            type="button"
                            onClick={() => setRangeFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                                rangeFilter === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            Tout ({data.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. KPI Cards compactes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                    <span className="text-[10px] font-sans text-slate-400 uppercase">Dernier PR</span>
                    <div className="text-lg font-black text-white mt-0.5">{latestPR}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                    <span className="text-[10px] font-sans text-slate-400 uppercase">Meilleur PR</span>
                    <div className="text-lg font-black text-emerald-400 mt-0.5">{bestPR}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                    <span className="text-[10px] font-sans text-slate-400 uppercase">Elo Actuel</span>
                    <div className="text-lg font-black text-amber-400 mt-0.5">{latestElo}</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                    <span className="text-[10px] font-sans text-slate-400 uppercase">Tendance</span>
                    <div
                        className={`text-lg font-black mt-0.5 ${
                            prImprovement >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                    >
                        {prImprovement >= 0 ? `+${prImprovement} pts` : `${prImprovement} pts`}
                    </div>
                </div>
            </div>

            {/* 3. Canevas SVG */}
            <div className="relative w-full overflow-x-auto">
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto select-none" data-testid="progression-curve-svg">
                    {/* Ligne de moyenne mobile (Cyan) */}
                    <path
                        d={maLineD}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.85}
                    />

                    {/* Ligne brute (Bleue/Ambre) */}
                    <path
                        d={rawLineD}
                        fill="none"
                        stroke={isPR ? '#3b82f6' : '#f59e0b'}
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        opacity={0.5}
                    />

                    {/* Points cliquables */}
                    {coords.map((pt, i) => {
                        const isHovered = hoveredPoint?.gameId === pt.gameId;
                        return (
                            <g
                                key={pt.gameId || i}
                                className="cursor-pointer"
                                onClick={() => onSelectGame?.(pt.gameId)}
                                onMouseEnter={() => setHoveredPoint(pt)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                data-testid={`progression-point-${i}`}
                            >
                                <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 6 : 4}
                                    fill={pt.winner ? '#10b981' : '#f43f5e'}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                />
                                {isHovered && (
                                    <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r="9"
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2"
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Légende */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 bg-cyan-400" />
                        <span>Moyenne mobile (lissage 3 parties)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Partie Gagnée</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>Partie Perdue</span>
                    </span>
                </div>

                {hoveredPoint && (
                    <div className="text-white font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Match #{hoveredPoint.gameNumber} : PR {hoveredPoint.performanceRating} • Elo {hoveredPoint.estimatedElo}
                    </div>
                )}
            </div>
        </div>
    );
}
