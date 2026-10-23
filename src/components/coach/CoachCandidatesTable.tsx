'use client';

/**
 * Tableau analytique des coups candidats — style eXtreme Gammon / Snowie.
 *
 * Rôle :
 *   Affiche le Top 3 à 5 des coups évalués dans un tableau compact de type
 *   logiciel professionnel :
 *     `#` | `Coup` | `Équité` | `Diff (ΔEq)` | `Win % (G% / BG%)`
 *   La ligne réellement jouée par l'utilisateur est surlignée.
 *
 * Interaction :
 *   Survoler (desktop) ou toucher (mobile) une ligne déclenche
 *   `onCandidateHover(notation)` afin que le parent dessine immédiatement les
 *   flèches SVG de cette variante sur le plateau. `onCandidateHover(null)` au
 *   survol sortant restaure l'affichage par défaut.
 *
 * Composant 100 % muet (LOI 5) : aucune évaluation, aucun accès moteur.
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `CoachPanel.tsx`.
 */

import React from 'react';

/** Ligne de candidat affichée dans le tableau. */
export interface CandidateRow {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    /** Probabilité de victoire simple (0..1), optionnelle. */
    winProbability?: number;
    /** Probabilité de gammon (0..1), optionnelle. */
    gammonProbability?: number;
    /** Probabilité de backgammon (0..1), optionnelle. */
    backgammonProbability?: number;
}

export interface CoachCandidatesTableProps {
    /** Coups candidats (déjà triés par équité décroissante). */
    candidates: ReadonlyArray<CandidateRow>;
    /** Notation du coup réellement joué (pour le surlignage). */
    playedMove?: string | null;
    /** Callback de survol / toucher d'une ligne. */
    onCandidateHover?: (notation: string | null) => void;
    /** Nombre maximum de lignes affichées (3 à 5). */
    maxRows?: number;
    /** Langue d'affichage. */
    locale?: string;
}

/** Formate une équité signée sur 3 décimales. */
function formatEquity(value: number): string {
    if (!Number.isFinite(value)) return '—';
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

/** Formate une perte d'équité (toujours négative ou nulle). */
function formatLoss(value: number): string {
    if (!Number.isFinite(value)) return '—';
    const loss = Math.abs(value);
    return loss < 0.0005 ? '±0.000' : `-${loss.toFixed(3)}`;
}

/** Formate un pourcentage (0..1) sur une décimale. */
function formatPercent(value?: number): string {
    if (value === undefined || !Number.isFinite(value)) return '—';
    return `${(value * 100).toFixed(1)}%`;
}

/** Couleur de la perte d'équité selon les paliers du cahier des charges. */
export function lossClass(loss: number): string {
    const abs = Math.abs(loss);
    if (abs <= 0.01) return 'text-emerald-300';
    if (abs <= 0.02) return 'text-cyan-300';
    if (abs <= 0.08) return 'text-amber-300';
    return 'text-rose-300';
}

/** Calcule la jauge visuelle horizontale pour le différentiel d'équité. */
export function computeLossGauge(loss: number): { widthPct: number; barColor: string } {
    const abs = Math.abs(loss);
    if (abs < 0.0005) {
        return { widthPct: 100, barColor: 'bg-emerald-400' };
    }
    const widthPct = Math.max(8, Math.round(100 - (Math.min(0.25, abs) / 0.25) * 85));
    if (abs <= 0.01) return { widthPct, barColor: 'bg-emerald-400' };
    if (abs <= 0.02) return { widthPct, barColor: 'bg-cyan-400' };
    if (abs <= 0.08) return { widthPct, barColor: 'bg-amber-400' };
    return { widthPct, barColor: 'bg-rose-500' };
}

const CoachCandidatesTableComponent: React.FC<CoachCandidatesTableProps> = ({
    candidates,
    playedMove,
    onCandidateHover,
    maxRows = 5,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const rows = candidates.slice(0, Math.max(3, Math.min(5, maxRows)));

    if (rows.length === 0) return null;

    return (
        <section
            data-testid="coach-candidates-table"
            aria-label={isEn ? 'Candidate moves analysis' : 'Analyse des coups candidats'}
            className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2"
        >
            <div className="flex items-center justify-between px-1 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isEn ? 'Move ranking' : 'Classement des coups'}
                </span>
                <span className="font-mono text-[9px] text-slate-500">
                    {isEn ? 'hover to preview' : 'survoler pour prévisualiser'}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="text-[9px] uppercase tracking-wider text-slate-500">
                            <th className="px-1 py-1 font-bold">#</th>
                            <th className="px-1 py-1 font-bold">{isEn ? 'Move' : 'Coup'}</th>
                            <th className="px-1 py-1 text-right font-bold">{isEn ? 'Equity' : 'Équité'}</th>
                            <th className="px-1 py-1 text-right font-bold">ΔEq</th>
                            <th className="px-1 py-1 text-right font-bold">
                                {isEn ? 'Win % (G/BG)' : 'Win % (G% / BG%)'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                        {rows.map((row) => {
                            const isPlayed = Boolean(playedMove) && row.notation === playedMove;
                            const isBest = row.rank === 1;
                            const gauge = computeLossGauge(row.equityLoss);
                            return (
                                <tr
                                    key={`${row.rank}-${row.notation}`}
                                    data-testid={`coach-candidate-row-${row.rank}`}
                                    data-played={isPlayed ? 'true' : 'false'}
                                    onMouseEnter={() => onCandidateHover?.(row.notation)}
                                    onMouseLeave={() => onCandidateHover?.(null)}
                                    onTouchStart={() => onCandidateHover?.(row.notation)}
                                    onFocus={() => onCandidateHover?.(row.notation)}
                                    onBlur={() => onCandidateHover?.(null)}
                                    tabIndex={0}
                                    className={`cursor-pointer text-[10px] transition-colors ${isPlayed
                                        ? 'bg-blue-950/60 ring-1 ring-inset ring-blue-500/60'
                                        : 'hover:bg-slate-800/60'
                                        }`}
                                >
                                    <td className="px-1 py-1 font-mono font-bold text-slate-400">
                                        {isBest ? '🏆' : row.rank}
                                    </td>
                                    <td
                                        className={`px-1 py-1 font-mono font-bold whitespace-nowrap ${isPlayed ? 'text-blue-200' : 'text-white'
                                            }`}
                                    >
                                        {row.notation}
                                        {isPlayed && (
                                            <span className="ml-1 rounded bg-blue-800/80 px-1 text-[8px] font-bold uppercase text-blue-100">
                                                {isEn ? 'played' : 'joué'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-1 py-1 text-right font-mono text-slate-200">
                                        {formatEquity(row.equity)}
                                    </td>
                                    <td className="px-1 py-1 text-right font-mono">
                                        <div className="flex items-center justify-end gap-1">
                                            <div
                                                className="hidden sm:flex h-1.5 w-4 rounded-full bg-slate-800/90 overflow-hidden"
                                                title={`Précision relative : ${gauge.widthPct}%`}
                                            >
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${gauge.barColor}`}
                                                    style={{ width: `${gauge.widthPct}%` }}
                                                />
                                            </div>
                                            <span className={`font-bold ${lossClass(row.equityLoss)}`}>
                                                {formatLoss(row.equityLoss)}
                                            </span>
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
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const CoachCandidatesTable = React.memo(CoachCandidatesTableComponent);
export default CoachCandidatesTable;
