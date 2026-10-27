'use client';

import React from 'react';
import type {
    HeatmapCell,
    TacticalHeatmapCell,
    TacticalTheme,
    GamePhase,
} from '../../features/analytics/types';
import { TACTICAL_THEME_CONFIGS } from '../../features/analytics/analyticsCalculator';
import { STRATEGIC_CONCEPTS_CATALOG } from '../../lib/stats/statsAggregator';
import type { SelectedHeatmapCellDetail } from './ConceptsHeatmapDetailCard';

export interface HeatmapPhaseInfo {
    phase: GamePhase;
    label: string;
    enLabel: string;
    icon: string;
}

export interface ConceptsHeatmapTableBodyProps {
    viewMode: 'tactical' | 'concepts';
    phases: HeatmapPhaseInfo[];
    tacticalThemesOrder: TacticalTheme[];
    tacticalLookup: Map<string, TacticalHeatmapCell>;
    cellLookup: Map<string, HeatmapCell>;
    onSelectCell: (cell: SelectedHeatmapCellDetail | null) => void;
}

function getCellStyles(
    cell: { errorCount: number; blunderCount: number; intensity: number } | undefined,
) {
    if (!cell || cell.errorCount === 0) {
        return {
            bg: 'bg-emerald-950/15 hover:bg-emerald-950/30',
            border: 'border-white/10',
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

export const ConceptsHeatmapTableBody: React.FC<ConceptsHeatmapTableBodyProps> = ({
    viewMode,
    phases,
    tacticalThemesOrder,
    tacticalLookup,
    cellLookup,
    onSelectCell,
}) => {
    return (
        <tbody className="divide-y divide-white/10">
            {viewMode === 'tactical'
                ? tacticalThemesOrder.map((themeKey) => {
                      const cfg = TACTICAL_THEME_CONFIGS[themeKey];
                      return (
                          <tr
                              key={themeKey}
                              className="hover:bg-slate-800/30 transition-colors"
                              data-testid={`tactical-row-${themeKey}`}
                          >
                              <td className="py-3 px-3">
                                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                                      <span>{cfg.icon}</span>
                                      <span>{cfg.label}</span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">
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
                                                      ? onSelectCell({
                                                            title: `${cfg.icon} ${cfg.label}`,
                                                            description: cfg.description,
                                                            phaseLabel: `${p.enLabel} (${p.label})`,
                                                            errorCount: cell.errorCount,
                                                            blunderCount: cell.blunderCount,
                                                            totalEquityLoss: cell.totalEquityLoss,
                                                        })
                                                      : onSelectCell(null)
                                              }
                                              className={`w-full py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${styles.bg} ${styles.border}`}
                                              title={`${cfg.label} en ${p.enLabel} : ${styles.label}`}
                                          >
                                              <div className={`text-xs font-mono font-bold ${styles.badgeText}`}>
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
                                                      <span className="text-slate-500 font-normal">0</span>
                                                  )}
                                              </div>
                                              <div className="text-xs text-slate-300 mt-0.5 font-mono">
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
                                  <div className="font-bold text-white text-xs sm:text-sm">
                                      {concept.name}
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5">
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
                                                      ? onSelectCell({
                                                            title: concept.name,
                                                            phaseLabel: p.label,
                                                            errorCount: cell.errorCount,
                                                            blunderCount: cell.blunderCount,
                                                            totalEquityLoss: cell.totalEquityLoss,
                                                        })
                                                      : onSelectCell(null)
                                              }
                                              className={`w-full py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${styles.bg} ${styles.border}`}
                                              title={`${concept.name} en ${p.label} : ${styles.label}`}
                                          >
                                              <div className={`text-xs font-mono font-bold ${styles.badgeText}`}>
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
                                                      <span className="text-slate-500 font-normal">0</span>
                                                  )}
                                              </div>
                                              <div className="text-xs text-slate-300 mt-0.5 font-mono">
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
    );
};

export default React.memo(ConceptsHeatmapTableBody);
