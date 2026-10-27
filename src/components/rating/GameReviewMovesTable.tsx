'use client';

/**
 * Tableau d'inspection coup par coup pour GameReviewModal (< 200 lignes, 0 any).
 */

import React, { useMemo } from 'react';
import type { EvaluatedTurn, MoveVerdict } from '../../features/rating/types';

export interface GameReviewMovesTableProps {
    evaluatedMoves: EvaluatedTurn[];
    mistakesCount: number;
    filterOnlyMistakes: boolean;
    onSetFilterOnlyMistakes: (onlyMistakes: boolean) => void;
    onInspectMove: (originalIndex: number, drillMode: boolean) => void;
}

const VERDICT_BADGES: Record<MoveVerdict, { label: string; bg: string; text: string; border: string }> = {
    optimal: {
        label: 'Optimal',
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        border: 'border-emerald-600/40',
    },
    acceptable: {
        label: 'Acceptable',
        bg: 'bg-teal-950/60',
        text: 'text-teal-300',
        border: 'border-teal-600/40',
    },
    doubtful: {
        label: 'Douteux',
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        border: 'border-amber-600/40',
    },
    blunder: {
        label: 'Blunder',
        bg: 'bg-rose-950/60',
        text: 'text-rose-300',
        border: 'border-rose-600/40',
    },
    howler: {
        label: 'Howler',
        bg: 'bg-red-950/80',
        text: 'text-red-200',
        border: 'border-red-600/60',
    },
};

export const GameReviewMovesTable: React.FC<GameReviewMovesTableProps> = ({
    evaluatedMoves,
    mistakesCount,
    filterOnlyMistakes,
    onSetFilterOnlyMistakes,
    onInspectMove,
}) => {
    const indexedMoves = useMemo(
        () => evaluatedMoves.map((move, originalIndex) => ({ move, originalIndex })),
        [evaluatedMoves],
    );

    const movesToShow = useMemo(
        () =>
            filterOnlyMistakes
                ? indexedMoves.filter(
                      ({ move }) =>
                          move.verdict === 'doubtful' || move.verdict === 'blunder' || move.verdict === 'howler',
                  )
                : indexedMoves,
        [filterOnlyMistakes, indexedMoves],
    );

    return (
        <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>📋</span>
                    <span>Inspection Coup par Coup ({movesToShow.length})</span>
                </h3>

                <div className="flex items-center gap-1 bg-[#0d0704] p-1 rounded-xl border border-white/10 text-xs">
                    <button
                        type="button"
                        onClick={() => onSetFilterOnlyMistakes(false)}
                        className={`px-3 py-1 rounded-lg font-medium transition ${
                            !filterOnlyMistakes ? 'bg-[#2a180c] text-white shadow' : 'text-[#e8dcc6]/70 hover:text-white'
                        }`}
                    >
                        Tous les coups ({evaluatedMoves.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSetFilterOnlyMistakes(true)}
                        className={`px-3 py-1 rounded-lg font-medium transition ${
                            filterOnlyMistakes
                                ? 'bg-rose-900/60 text-rose-200 border border-rose-700/50 shadow'
                                : 'text-[#e8dcc6]/70 hover:text-white'
                        }`}
                    >
                        Erreurs uniquement ({mistakesCount})
                    </button>
                </div>
            </div>

            {movesToShow.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#140b06]/80 p-6 text-center text-xs text-[#e8dcc6]/70">
                    Aucune faute à afficher dans cette sélection. Jeu exemplaire !
                </div>
            ) : (
                <div className="rounded-2xl border border-white/10 bg-[#140b06]/85 overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#1c1008]/90 text-[11px] text-[#e8dcc6]/75 uppercase tracking-wider border-b border-white/10">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Dés</th>
                                <th className="p-3">Coup Joué</th>
                                <th className="p-3">Optimal 3-Ply</th>
                                <th className="p-3 text-right">Perte (ΔEq)</th>
                                <th className="p-3 text-center">Verdict</th>
                                <th className="p-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {movesToShow.map(({ move: m, originalIndex }) => {
                                const badge = VERDICT_BADGES[m.verdict];
                                const isMistake =
                                    m.verdict === 'doubtful' || m.verdict === 'blunder' || m.verdict === 'howler';
                                return (
                                    <tr
                                        key={`${m.moveNumber}-${m.player}-${originalIndex}`}
                                        className="hover:bg-slate-900/50 transition-colors"
                                    >
                                        <td className="p-3 text-slate-400 font-sans">{m.moveNumber}</td>
                                        <td className="p-3 text-amber-300 font-bold">
                                            [{m.dice[0]}, {m.dice[1]}]
                                        </td>
                                        <td className="p-3 text-white font-bold">{m.playedNotation}</td>
                                        <td className="p-3 text-emerald-400">{m.optimalNotation}</td>
                                        <td
                                            className={`p-3 text-right font-bold ${
                                                m.equityLoss === 0 ? 'text-slate-400' : 'text-rose-400'
                                            }`}
                                        >
                                            {m.equityLoss === 0 ? '0.000' : m.equityLoss.toFixed(3)}
                                        </td>
                                        <td className="p-3 text-center font-sans">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                                            >
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-sans">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {isMistake && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (originalIndex >= 0) onInspectMove(originalIndex, true);
                                                        }}
                                                        data-testid={`drill-row-btn-${m.moveNumber}`}
                                                        className="rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/60 px-2 py-1 text-[11px] font-bold text-amber-300 transition"
                                                    >
                                                        🎯 Drill
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (originalIndex >= 0) onInspectMove(originalIndex, false);
                                                    }}
                                                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition"
                                                >
                                                    Inspecter ➔
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GameReviewMovesTable;
