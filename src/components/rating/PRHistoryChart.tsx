'use client';

import React from 'react';
import type { RatingHistoryPoint } from '../../features/rating/types';

export interface PRHistoryChartProps {
    history: RatingHistoryPoint[];
    onSelectGame?: (gameId: string) => void;
}

export default function PRHistoryChart({ history, onSelectGame }: PRHistoryChartProps) {
    if (history.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-400 text-xs">
                Aucune partie analysée pour le moment. Jouez une partie pour voir votre courbe de PR.
            </div>
        );
    }

    const prValues = history.map((h) => h.performanceRating);
    const minPR = Math.max(0, Math.floor(Math.min(...prValues) - 1));
    const maxPR = Math.ceil(Math.max(...prValues, 12) + 2);
    const range = Math.max(1, maxPR - minPR);

    const width = 600;
    const height = 180;
    const padding = { top: 25, right: 30, bottom: 35, left: 45 };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Calcul des coordonnées SVG pour chaque point
    const points = history.map((item, idx) => {
        const x =
            history.length === 1
                ? padding.left + graphWidth / 2
                : padding.left + (idx / (history.length - 1)) * graphWidth;
        // En PR, plus le score est bas, plus il est haut visuellement (meilleure performance)
        const y = padding.top + ((item.performanceRating - minPR) / range) * graphHeight;
        return { ...item, x, y, index: idx + 1 };
    });

    const pathD = points.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Moyenne
    const avgPR = Number((prValues.reduce((a, b) => a + b, 0) / prValues.length).toFixed(1));
    const avgY = padding.top + ((avgPR - minPR) / range) * graphHeight;

    return (
        <div className="w-full rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl relative overflow-hidden">
            {/* Titre et badges de synthèse */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📈</span>
                        <span>Évolution du Performance Rating (PR)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                        Plus la courbe descend, plus vos décisions s’approchent de la perfection théorique.
                    </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1">
                        <span className="text-slate-400">PR Moyen :</span>
                        <span className="font-mono font-bold text-amber-300">{avgPR}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-2.5 py-1">
                        <span className="text-slate-400">Parties :</span>
                        <span className="font-mono font-bold text-white">{history.length}</span>
                    </div>
                </div>
            </div>

            {/* Graphique SVG responsive */}
            <div className="w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[320px] max-h-48 overflow-visible"
                    data-testid="pr-history-svg"
                >
                    {/* Grille horizontale (seuils de PR) */}
                    {[minPR, Math.round((minPR + maxPR) / 2), maxPR].map((val, i) => {
                        const y = padding.top + ((val - minPR) / range) * graphHeight;
                        return (
                            <g key={i}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="#334155"
                                    strokeDasharray="3 3"
                                    strokeWidth={1}
                                />
                                <text
                                    x={padding.left - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    fill="#94a3b8"
                                    fontSize={10}
                                    fontFamily="monospace"
                                >
                                    {val.toFixed(0)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Ligne moyenne en pointillés ambre */}
                    <line
                        x1={padding.left}
                        y1={avgY}
                        x2={width - padding.right}
                        y2={avgY}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        strokeOpacity={0.6}
                    />
                    <text
                        x={width - padding.right + 5}
                        y={avgY + 3}
                        fill="#f59e0b"
                        fontSize={9}
                        fontFamily="monospace"
                        fontWeight="bold"
                    >
                        Moy.
                    </text>

                    {/* Courbe de tendance du PR */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="url(#pr-gradient)"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Dégradé du trait */}
                    <defs>
                        <linearGradient id="pr-gradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Points individuels interactifs */}
                    {points.map((pt, i) => (
                        <g
                            key={i}
                            className="cursor-pointer group"
                            onClick={() => onSelectGame && onSelectGame(pt.gameId)}
                        >
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={5}
                                fill={pt.isPlayerWinner ? '#10b981' : '#f43f5e'}
                                stroke="#0f172a"
                                strokeWidth={2}
                                className="transition-transform group-hover:scale-125"
                            />
                            {/* Valeur du PR affichée au-dessus */}
                            <text
                                x={pt.x}
                                y={pt.y - 8}
                                textAnchor="middle"
                                fill="#ffffff"
                                fontSize={10}
                                fontFamily="monospace"
                                fontWeight="bold"
                            >
                                {pt.performanceRating}
                            </text>
                            {/* Numéro de manche en bas */}
                            <text
                                x={pt.x}
                                y={height - padding.bottom + 15}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={9}
                            >
                                #{pt.index}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
