'use client';

/**
 * Composant Blunder Heatmap (Phases × Thèmes Tactiques).
 *
 * Conforme à SCALABILITY.md (< 300 lignes, 0 any, Dumb UI pure).
 */

import React, { useState, useMemo } from 'react';
import type {
    HeatmapCell,
    TacticalHeatmapCell,
    TacticalTheme,
} from '../../features/analytics/types';
import {
    ConceptsHeatmapTableBody,
    type HeatmapPhaseInfo,
} from './ConceptsHeatmapTableBody';
import ConceptsHeatmapDetailCard, {
    type SelectedHeatmapCellDetail,
} from './ConceptsHeatmapDetailCard';

export interface ConceptsHeatmapProps {
    cells: HeatmapCell[];
    tacticalCells?: TacticalHeatmapCell[];
}

const TACTICAL_THEMES_ORDER: TacticalTheme[] = [
    'slotting',
    'priming',
    'blitz',
    'holding',
    'racing',
];

const PHASES: HeatmapPhaseInfo[] = [
    { phase: 'opening', label: 'Ouverture', enLabel: 'Opening', icon: '📖' },
    { phase: 'middle_game', label: 'Milieu de jeu', enLabel: 'Midgame', icon: '⚔️' },
    { phase: 'endgame', label: 'Sortie / Course', enLabel: 'Bearing off', icon: '🏁' },
];

export default function ConceptsHeatmap({ cells, tacticalCells = [] }: ConceptsHeatmapProps) {
    const [viewMode, setViewMode] = useState<'tactical' | 'concepts'>(
        tacticalCells.length > 0 ? 'tactical' : 'concepts',
    );
    const [selectedCell, setSelectedCell] = useState<SelectedHeatmapCellDetail | null>(null);

    const cellLookup = useMemo(() => {
        const map = new Map<string, HeatmapCell>();
        for (const c of cells) {
            map.set(`${c.conceptId}_${c.phase}`, c);
        }
        return map;
    }, [cells]);

    const tacticalLookup = useMemo(() => {
        const map = new Map<string, TacticalHeatmapCell>();
        for (const c of tacticalCells) {
            map.set(`${c.theme}_${c.phase}`, c);
        }
        return map;
    }, [tacticalCells]);

    return (
        <div
            className="rounded-2xl border border-white/10 bg-slate-900/90 p-5 shadow-xl space-y-4"
            data-testid="concepts-heatmap"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>🔥</span>
                        <span>Blunder Heatmap — Phases × Thèmes Tactiques</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                        Cartographie de densité des bévues par phase (Opening, Midgame, Bearing off) et thème (Slotting, Priming, Blitz, Holding, Racing).
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {tacticalCells.length > 0 && (
                        <div
                            className="inline-flex rounded-lg border border-white/10 bg-slate-950/80 p-0.5 text-xs"
                            data-testid="heatmap-mode-switcher"
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode('tactical');
                                    setSelectedCell(null);
                                }}
                                data-testid="heatmap-mode-tactical"
                                className={`rounded-md px-2.5 py-1 font-bold transition ${
                                    viewMode === 'tactical'
                                        ? 'bg-amber-500 text-slate-950 shadow'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                Tactique (5×3)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode('concepts');
                                    setSelectedCell(null);
                                }}
                                data-testid="heatmap-mode-concepts"
                                className={`rounded-md px-2.5 py-1 font-bold transition ${
                                    viewMode === 'concepts'
                                        ? 'bg-amber-500 text-slate-950 shadow'
                                        : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                Concepts (8×3)
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-950/80 border border-emerald-500/40" />
                            <span>0 faute</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded-sm bg-amber-950 border border-amber-500/50" />
                            <span>Moyen</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="h-2.5 w-2.5 rounded-sm bg-rose-950 border border-rose-500/60" />
                            <span>Critique</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Matrice 2D Heatmap */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-300">
                            <th className="py-2.5 px-3 font-semibold w-1/3">
                                {viewMode === 'tactical' ? 'Thème Tactique' : 'Concept Stratégique'}
                            </th>
                            {PHASES.map((p) => (
                                <th key={p.phase} className="py-2.5 px-3 text-center font-semibold">
                                    <span className="flex flex-col items-center justify-center">
                                        <span className="flex items-center gap-1">
                                            <span>{p.icon}</span>
                                            <span className="text-slate-200">{p.enLabel}</span>
                                        </span>
                                        <span className="text-xs font-normal text-slate-400">
                                            {p.label}
                                        </span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <ConceptsHeatmapTableBody
                        viewMode={viewMode}
                        phases={PHASES}
                        tacticalThemesOrder={TACTICAL_THEMES_ORDER}
                        tacticalLookup={tacticalLookup}
                        cellLookup={cellLookup}
                        onSelectCell={setSelectedCell}
                    />
                </table>
            </div>

            {/* Volet détail de la cellule sélectionnée */}
            {selectedCell && <ConceptsHeatmapDetailCard cell={selectedCell} />}
        </div>
    );
}
