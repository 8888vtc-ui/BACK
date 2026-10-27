'use client';

/**
 * Tableau analytique des coups candidats & Comparateur Contrefactuel en 1 Clic (« Pourquoi pas ce coup ? »).
 *
 * Rôle :
 *   - Affiche le Top 3 à 5 des coups évalués (`# | Coup | Équité | ΔEq | Win %`).
 *   - Survoler prévisualise les flèches SVG sur le plateau (`onCandidateHover`).
 *   - Cliquer sur une ligne ouvre le comparateur contrefactuel expliquant l'écart exact face au coup #1.
 *
 * Strictement 0 `any`, < 250 lignes.
 */

import React, { useState } from 'react';

export interface CandidateRow {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    winProbability?: number;
    gammonProbability?: number;
    backgammonProbability?: number;
}

export interface CoachCandidatesTableProps {
    candidates: ReadonlyArray<CandidateRow>;
    playedMove?: string | null;
    onCandidateHover?: (notation: string | null) => void;
    maxRows?: number;
    locale?: string;
}

function formatEquity(value: number): string {
    if (!Number.isFinite(value)) return '—';
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

function formatLoss(value: number): string {
    if (!Number.isFinite(value)) return '—';
    const loss = Math.abs(value);
    return loss < 0.0005 ? '±0.000' : `-${loss.toFixed(3)}`;
}

function formatPercent(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

export function lossClass(loss: number): string {
    const abs = Math.abs(loss);
    if (abs <= 0.01) return 'text-emerald-300';
    if (abs <= 0.02) return 'text-cyan-300';
    if (abs <= 0.08) return 'text-amber-300';
    return 'text-rose-300';
}

export function computeLossGauge(loss: number): { widthPct: number; barColor: string } {
    const abs = Math.abs(loss);
    if (abs < 0.0005) return { widthPct: 100, barColor: 'bg-emerald-400' };
    const widthPct = Math.max(8, Math.round(100 - (Math.min(0.25, abs) / 0.25) * 85));
    if (abs <= 0.01) return { widthPct, barColor: 'bg-emerald-400' };
    if (abs <= 0.02) return { widthPct, barColor: 'bg-cyan-400' };
    if (abs <= 0.08) return { widthPct, barColor: 'bg-amber-400' };
    return { widthPct, barColor: 'bg-rose-500' };
}

function buildCounterfactualRationale(candidate: CandidateRow, best: CandidateRow, isEn: boolean): string {
    const loss = Math.abs(candidate.equityLoss);
    if (candidate.rank === 1 || loss < 0.001) {
        return isEn
            ? `${best.notation} is the canonical #1 engine play (${formatEquity(best.equity)} Eq), maximizing board structure and minimizing AI counter-shots.`
            : `${best.notation} est le coup canonique n°1 du moteur (${formatEquity(best.equity)} Eq) : il maximise votre structure et minimise les contre-attaques de l'IA.`;
    }

    const winDelta =
        best.winProbability !== undefined && candidate.winProbability !== undefined
            ? ((best.winProbability - candidate.winProbability) * 100).toFixed(1)
            : null;
    const gammonDelta =
        best.gammonProbability !== undefined && candidate.gammonProbability !== undefined
            ? ((best.gammonProbability - candidate.gammonProbability) * 100).toFixed(1)
            : null;

    const bestHasHit = best.notation.includes('*');
    const candHasHit = candidate.notation.includes('*');
    const bestMakes5 = /\b(?:\d+|bar)\/5\*?(?:\(\d+\))?(?:\s|$)/i.test(best.notation);
    const candMakes5 = /\b(?:\d+|bar)\/5\*?(?:\(\d+\))?(?:\s|$)/i.test(candidate.notation);

    const tacticalDiffFr = bestMakes5 && !candMakes5
        ? `contrairement à ${best.notation}, il renonce au verrouillage stratégique du Point 5 (Golden Point)`
        : bestHasHit && !candHasHit
          ? `il joue passivement au lieu de saisir le tempo par la frappe ${best.notation}`
          : !bestHasHit && candHasHit
            ? `il frappe de manière téméraire alors que ${best.notation} privilégie la pureté de structure`
            : `il disperse l'efficacité de vos bâtisseurs par rapport à la géométrie de ${best.notation}`;

    const tacticalDiffEn = bestMakes5 && !candMakes5
        ? `unlike ${best.notation}, it misses locking the strategic 5-point (Golden Point)`
        : bestHasHit && !candHasHit
          ? `it plays passively instead of seizing tempo with the hit in ${best.notation}`
          : !bestHasHit && candHasHit
            ? `it hits loosely whereas ${best.notation} preserves pure structure`
            : `it scatters builder coordination compared to the geometry of ${best.notation}`;

    const probClauseFr = winDelta ? ` (-${winDelta}% de victoires${gammonDelta ? `, ΔGammon ${gammonDelta}%` : ''})` : '';
    const probClauseEn = winDelta ? ` (-${winDelta}% win rate${gammonDelta ? `, ΔGammon ${gammonDelta}%` : ''})` : '';

    return isEn
        ? `Why not ${candidate.notation}? It concedes -${loss.toFixed(3)} equity${probClauseEn}: ${tacticalDiffEn}.`
        : `Pourquoi pas ${candidate.notation} ? Ce choix cède -${loss.toFixed(3)} d'équité${probClauseFr} : ${tacticalDiffFr}.`;
}

const CoachCandidatesTableComponent: React.FC<CoachCandidatesTableProps> = ({
    candidates,
    playedMove,
    onCandidateHover,
    maxRows = 5,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [selectedRank, setSelectedRank] = useState<number | null>(null);
    const rows = candidates.slice(0, Math.max(3, Math.min(5, maxRows)));

    if (rows.length === 0) return null;

    const bestRow = rows[0];
    const selectedRow = rows.find((r) => r.rank === selectedRank) ?? null;

    return (
        <section
            data-testid="coach-candidates-table"
            aria-label={isEn ? 'Candidate moves analysis' : 'Analyse des coups candidats'}
            className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2 space-y-2"
        >
            <div className="flex items-center justify-between px-1 pb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {isEn ? 'Move ranking' : 'Classement des coups'}
                </span>
                <span className="font-mono text-[11px] text-indigo-300/80">
                    {isEn ? 'click a move for "Why not?"' : 'cliquez un coup pour « Pourquoi pas ? »'}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                            <th className="px-1 py-1 font-bold">#</th>
                            <th className="px-1 py-1 font-bold">{isEn ? 'Move' : 'Coup'}</th>
                            <th className="px-1 py-1 text-right font-bold">{isEn ? 'Equity' : 'Équité'}</th>
                            <th className="px-1 py-1 text-right font-bold">ΔEq</th>
                            <th className="px-1 py-1 text-right font-bold">{isEn ? 'Win % (G/BG)' : 'Win % (G% / BG%)'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                        {rows.map((row) => {
                            const isPlayed = Boolean(playedMove) && row.notation === playedMove;
                            const isBest = row.rank === 1;
                            const isSelected = selectedRank === row.rank;
                            const gauge = computeLossGauge(row.equityLoss);
                            return (
                                <tr
                                    key={`${row.rank}-${row.notation}`}
                                    data-testid={`coach-candidate-row-${row.rank}`}
                                    data-played={isPlayed ? 'true' : 'false'}
                                    onClick={() => {
                                        setSelectedRank((prev) => (prev === row.rank ? null : row.rank));
                                        onCandidateHover?.(row.notation);
                                    }}
                                    onMouseEnter={() => onCandidateHover?.(row.notation)}
                                    onMouseLeave={() => onCandidateHover?.(null)}
                                    onTouchStart={() => onCandidateHover?.(row.notation)}
                                    onFocus={() => onCandidateHover?.(row.notation)}
                                    onBlur={() => onCandidateHover?.(null)}
                                    tabIndex={0}
                                    className={`cursor-pointer text-[11px] transition-colors ${
                                        isSelected
                                            ? 'bg-indigo-950/75 ring-1 ring-inset ring-indigo-400/70'
                                            : isPlayed
                                              ? 'bg-blue-950/60 ring-1 ring-inset ring-blue-500/60'
                                              : 'hover:bg-slate-800/60'
                                    }`}
                                >
                                    <td className="px-1 py-1 font-mono font-bold text-slate-400">{isBest ? '🏆' : row.rank}</td>
                                    <td className={`px-1 py-1 font-mono font-bold whitespace-nowrap ${isPlayed ? 'text-blue-200' : 'text-white'}`}>
                                        {row.notation}
                                        {isPlayed && (
                                            <span className="ml-1 rounded bg-blue-800/80 px-1 text-[11px] font-bold uppercase text-blue-100">
                                                {isEn ? 'played' : 'joué'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-1 py-1 text-right font-mono text-slate-200">{formatEquity(row.equity)}</td>
                                    <td className="px-1 py-1 text-right font-mono">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="hidden sm:flex h-1.5 w-4 rounded-full bg-slate-800/90 overflow-hidden" title={`Précision relative : ${gauge.widthPct}%`}>
                                                <div className={`h-full rounded-full transition-all duration-300 ${gauge.barColor}`} style={{ width: `${gauge.widthPct}%` }} />
                                            </div>
                                            <span className={`font-bold ${lossClass(row.equityLoss)}`}>{formatLoss(row.equityLoss)}</span>
                                        </div>
                                    </td>
                                    <td className="px-1 py-1 text-right font-mono text-slate-300 whitespace-nowrap">
                                        {formatPercent(row.winProbability)}
                                        <span className="text-slate-500">
                                            {' '}
                                            ({formatPercent(row.gammonProbability)} / {formatPercent(row.backgammonProbability)})
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedRow && bestRow && (
                <div
                    data-testid="coach-counterfactual-box"
                    className="rounded-lg border border-indigo-500/40 bg-indigo-950/40 px-2.5 py-2 text-[11px] leading-relaxed text-indigo-100 flex items-start justify-between gap-2"
                >
                    <span>
                        💬 <strong>{isEn ? 'Counterfactual Analysis:' : 'Comparaison Contrefactuelle :'}</strong>{' '}
                        {buildCounterfactualRationale(selectedRow, bestRow, isEn)}
                    </span>
                    <button
                        type="button"
                        onClick={() => setSelectedRank(null)}
                        aria-label={isEn ? 'Close comparison' : 'Fermer la comparaison'}
                        className="shrink-0 text-[10px] text-indigo-300 hover:text-white font-bold px-1"
                    >
                        ✕
                    </button>
                </div>
            )}
        </section>
    );
};

export const CoachCandidatesTable = React.memo(CoachCandidatesTableComponent);
export default CoachCandidatesTable;
