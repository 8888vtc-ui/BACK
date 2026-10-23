'use client';

import React, { useState, useMemo } from 'react';
import type {
    HeatmapCell,
    TacticalHeatmapCell,
    TacticalTheme,
    GamePhase,
} from '../../features/analytics/types';
import { TACTICAL_THEME_CONFIGS } from '../../features/analytics/analyticsCalculator';
import { STRATEGIC_CONCEPTS_CATALOG } from '../../lib/stats/statsAggregator';

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

export default function ConceptsHeatmap({ cells, tacticalCells = [] }: ConceptsHeatmapProps) {
    const [viewMode, setViewMode] = useState<'tactical' | 'concepts'>(
        tacticalCells.length > 0 ? 'tactical' : 'concepts',
    );
    const [selectedCell, setSelectedCell] = useState<{
        title: string;
        description?: string;
        phaseLabel: string;
        errorCount: number;
        blunderCount: number;
        totalEquityLoss: number;
    } | null>(null);

    const phases: Array<{ phase: GamePhase; label: string; enLabel: string; icon: string }> = [
        { phase: 'opening', label: 'Ouverture', enLabel: 'Opening', icon: '📖' },
        { phase: 'middle_game', label: 'Milieu de jeu', enLabel: 'Midgame', icon: '⚔️' },
        { phase: 'endgame', label: 'Sortie / Course', enLabel: 'Bearing off', icon: '🏁' },
    ];

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

    function getCellStyles(
        cell:
            | { errorCount: number; blunderCount: number; intensity: number }
            | undefined,
    ) {
        if (!cell || cell.errorCount === 0) {
            return {
                bg: 'bg-emerald-950/15 hover:bg-emerald-950/30',
                border: 'border-slate-800',
                badgeText: 'text-emerald-400',
                label: 'Propre (0 faute)',
            };
        }

        if (cell.intensity > 0.65 || cell.blunderCount >= 2) {
            return {
                bg: 'bg-rose-950/60 hover:bg-rose-900/70 ring-1 ring-rose-500/40',
                border: 'border-rose-500/50',
                badgeText: 'text-rose-200',
                label: `${cell.errorCount} faute${cell.errorCount > 1 ? 's' : ''} (${cell.blunderCount} blunder)`,
            };
        }

        if (cell.intensity > 0.3 || cell.blunderCount === 1) {
            return {
                bg: 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-500/40',
                border: 'border-amber-500/40',
                badgeText: 'text-amber-200',
                label: `${cell.errorCount} faute${cell.errorCount > 1 ? 's' : ''}`,
            };
        }

        return {
            bg: 'bg-yellow-950/30 hover:bg-yellow-900/40 border-yellow-600/30',
            border: 'border-yellow-600/30',
            badgeText: 'text-yellow-300',
            label: `${cell.errorCount} faute`,
        };
    }

    return (
        <div
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4"
            data-testid="concepts-heatmap"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>🔥</span>
                        <span>Blunder Heatmap — Phases × Thèmes Tactiques</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Cartographie de densité des bévues par phase (Opening, Midgame, Bearing off) et thème (Slotting, Priming, Blitz, Holding, Racing).
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {tacticalCells.length > 0 && (
                        <div
                            className="inline-flex rounded-lg border border-slate-700 bg-slate-950/80 p-0.5 text-[11px]"
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
                                        : 'text-slate-400 hover:text-white'
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
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Concepts (8×3)
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
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
                <table className="w-full border-collapse text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-2.5 px-3 font-semibold w-1/3">
                                {viewMode === 'tactical' ? 'Thème Tactique' : 'Concept Stratégique'}
                            </th>
                            {phases.map((p) => (
                                <th key={p.phase} className="py-2.5 px-3 text-center font-semibold">
                                    <span className="flex flex-col items-center justify-center">
                                        <span className="flex items-center gap-1">
                                            <span>{p.icon}</span>
                                            <span className="text-slate-200">{p.enLabel}</span>
                                        </span>
                                        <span className="text-[10px] font-normal text-slate-400">
                                            {p.label}
                                        </span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {viewMode === 'tactical'
                            ? TACTICAL_THEMES_ORDER.map((themeKey) => {
                                  const cfg = TACTICAL_THEME_CONFIGS[themeKey];
                                  return (
                                      <tr
                                          key={themeKey}
                                          className="hover:bg-slate-800/30 transition-colors"
                                          data-testid={`tactical-row-${themeKey}`}
                                      >
                                          <td className="py-3 px-3">
                                              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                                  <span>{cfg.icon}</span>
                                                  <span>{cfg.label}</span>
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                                  {cfg.description}
                                              </div>
                                          </td>

                                          {phases.map((p) => {
                                              const cell = tacticalLookup.get(`${themeKey}_${p.phase}`);
                                              const styles = getCellStyles(cell);

                                              return (
                                                  <td key={p.phase} className="p-1.5 text-center">
                                                      <button
                                                          type="button"
                                                          data-testid={`tactical-cell-${themeKey}-${p.phase}`}
                                                          onClick={() =>
                                                              cell
                                                                  ? setSelectedCell({
                                                                        title: `${cfg.icon} ${cfg.label}`,
                                                                        description: cfg.description,
                                                                        phaseLabel: `${p.enLabel} (${p.label})`,
                                                                        errorCount: cell.errorCount,
                                                                        blunderCount: cell.blunderCount,
                                                                        totalEquityLoss: cell.totalEquityLoss,
                                                                    })
                                                                  : setSelectedCell(null)
                                                          }
                                                          className={`w-full py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${styles.bg} ${styles.border}`}
                                                          title={`${cfg.label} en ${p.enLabel} : ${styles.label}`}
                                                      >
                                                          <div
                                                              className={`text-xs font-mono font-bold ${styles.badgeText}`}
                                                          >
                                                              {cell && cell.errorCount > 0 ? (
                                                                  <span>
                                                                      {cell.errorCount}
                                                                      {cell.blunderCount > 0 && (
                                                                          <span className="text-rose-400 ml-1">
                                                                              ({cell.blunderCount}B)
                                                                          </span>
                                                                      )}
                                                                  </span>
                                                              ) : (
                                                                  <span className="text-slate-600 font-normal">
                                                                      0
                                                                  </span>
                                                              )}
                                                          </div>
                                                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                                              {cell && cell.totalEquityLoss > 0
                                                                  ? `-${cell.totalEquityLoss}Δ`
                                                                  : '0.00'}
                                                          </div>
                                                      </button>
                                                  </td>
                                              );
                                          })}
                                      </tr>
                                  );
                              })
                            : STRATEGIC_CONCEPTS_CATALOG.map((concept) => {
                                  return (
                                      <tr
                                          key={concept.id}
                                          className="hover:bg-slate-800/30 transition-colors"
                                      >
                                          <td className="py-3 px-3">
                                              <div className="font-bold text-white text-xs">
                                                  {concept.name}
                                              </div>
                                              <div className="text-[10px] text-slate-400 mt-0.5">
                                                  {concept.category}
                                              </div>
                                          </td>

                                          {phases.map((p) => {
                                              const cell = cellLookup.get(`${concept.id}_${p.phase}`);
                                              const styles = getCellStyles(cell);

                                              return (
                                                  <td key={p.phase} className="p-1.5 text-center">
                                                      <button
                                                          type="button"
                                                          onClick={() =>
                                                              cell
                                                                  ? setSelectedCell({
                                                                        title: concept.name,
                                                                        phaseLabel: p.label,
                                                                        errorCount: cell.errorCount,
                                                                        blunderCount: cell.blunderCount,
                                                                        totalEquityLoss: cell.totalEquityLoss,
                                                                    })
                                                                  : setSelectedCell(null)
                                                          }
                                                          className={`w-full py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${styles.bg} ${styles.border}`}
                                                          title={`${concept.name} en ${p.label} : ${styles.label}`}
                                                      >
                                                          <div
                                                              className={`text-xs font-mono font-bold ${styles.badgeText}`}
                                                          >
                                                              {cell && cell.errorCount > 0 ? (
                                                                  <span>
                                                                      {cell.errorCount}
                                                                      {cell.blunderCount > 0 && (
                                                                          <span className="text-rose-400 ml-1">
                                                                              ({cell.blunderCount}B)
                                                                          </span>
                                                                      )}
                                                                  </span>
                                                              ) : (
                                                                  <span className="text-slate-600 font-normal">
                                                                      0
                                                                  </span>
                                                              )}
                                                          </div>
                                                          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                                              {cell && cell.totalEquityLoss > 0
                                                                  ? `-${cell.totalEquityLoss}Δ`
                                                                  : '0.00'}
                                                          </div>
                                                      </button>
                                                  </td>
                                              );
                                          })}
                                      </tr>
                                  );
                              })}
                    </tbody>
                </table>
            </div>

            {/* Volet détail de la cellule sélectionnée */}
            {selectedCell && selectedCell.errorCount > 0 && (
                <div
                    className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-slate-900 p-4 space-y-2 animate-in fade-in"
                    data-testid="heatmap-selected-detail"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                                    Phase : {selectedCell.phaseLabel}
                                </span>
                                <h4 className="text-sm font-black text-white">
                                    {selectedCell.title}
                                </h4>
                            </div>
                            {selectedCell.description && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {selectedCell.description}
                                </p>
                            )}
                            <p className="text-xs text-slate-300 mt-1">
                                {selectedCell.errorCount} faute(s) dont {selectedCell.blunderCount} blunder(s) relevé(s) — Perte cumulée de {selectedCell.totalEquityLoss} ΔEq.
                            </p>
                        </div>

                        <a
                            href="/drills"
                            className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-black text-slate-950 shadow-md hover:from-amber-400 hover:to-yellow-400 transition shrink-0"
                        >
                            🎯 Entraîner en Drill
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
