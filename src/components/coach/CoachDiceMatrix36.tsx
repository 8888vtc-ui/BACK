'use client';

/**
 * Matrice Interactive 6x6 « Grille 36 » — Rayon X des 36 lancers de l'IA (< 170 lignes, 0 any).
 *
 * Rôle :
 *   Visualise géométriquement les 36 combinaisons de dés (d1, d2) de l'IA au prochain tour :
 *     - 🟢 Sûr (aucune frappe possible)
 *     - 🔴 Tir direct (1 dé atteint un blot)
 *     - 🟠 Tir indirect (somme des 2 dés atteint un blot via relais légal)
 */

import React, { useMemo, useState } from 'react';
import { computeDiceMatrix36, type DiceCell36 } from '../../lib/engine/shotCounter';

export interface CoachDiceMatrix36Props {
    board?: ReadonlyArray<number>;
    locale?: string;
}

const DEFAULT_BOARD: readonly number[] = [
    0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
];

const CoachDiceMatrix36Component: React.FC<CoachDiceMatrix36Props> = ({
    board,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [selectedCell, setSelectedCell] = useState<DiceCell36 | null>(null);

    const matrix = useMemo(() => {
        const targetBoard = board && board.length >= 25 ? board : DEFAULT_BOARD;
        return computeDiceMatrix36(targetBoard, 'X');
    }, [board]);

    const totalHits = matrix.directHitsCount + matrix.indirectHitsCount;
    const hitRiskPct = ((totalHits / 36) * 100).toFixed(1);

    return (
        <div
            data-testid="coach-dice-matrix-36"
            className="space-y-2.5 rounded-xl border border-indigo-900/50 bg-slate-950/90 p-2.5 text-xs"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                    <h4 className="font-bold text-indigo-200 text-[11px] uppercase tracking-wider">
                        {isEn ? '🎲 AI 36-Roll Matrix (Next Turn)' : "🎲 Grille 36 des Lancers de l'IA"}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                        {matrix.exposedBlots.length > 0
                            ? isEn
                                ? `Exposed blot(s) on point(s): ${matrix.exposedBlots.join(', ')}`
                                : `Blot(s) exposé(s) sur flèche(s) : ${matrix.exposedBlots.join(', ')}`
                            : isEn
                              ? 'Zero exposed blots — 100% immune to AI hits!'
                              : "Aucun blot exposé — 100 % intouchable au prochain tour de l'IA !"}
                    </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span
                        data-testid="matrix-safe-count"
                        className="rounded bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.5 text-emerald-300 font-bold"
                    >
                        🟢 {matrix.safeRollsCount}/36
                    </span>
                    <span
                        data-testid="matrix-direct-count"
                        className="rounded bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.5 text-rose-300 font-bold"
                    >
                        🔴 {matrix.directHitsCount}/36
                    </span>
                    {matrix.indirectHitsCount > 0 && (
                        <span
                            data-testid="matrix-indirect-count"
                            className="rounded bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 text-amber-300 font-bold"
                        >
                            🟠 {matrix.indirectHitsCount}/36
                        </span>
                    )}
                    <span className="text-slate-400 font-bold">({hitRiskPct}%)</span>
                </div>
            </div>

            {/* Grille 6x6 */}
            <div className="grid grid-cols-6 gap-1">
                {matrix.cells.map((cell) => {
                    const isSelected = selectedCell?.d1 === cell.d1 && selectedCell?.d2 === cell.d2;
                    const cellStyle =
                        cell.status === 'direct_hit'
                            ? 'bg-rose-900/70 border-rose-500/70 text-rose-100 hover:bg-rose-800/80'
                            : cell.status === 'indirect_hit'
                              ? 'bg-amber-900/70 border-amber-500/70 text-amber-100 hover:bg-amber-800/80'
                              : 'bg-emerald-950/50 border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/60';

                    return (
                        <button
                            key={`${cell.d1}-${cell.d2}`}
                            type="button"
                            data-testid={`matrix-cell-${cell.d1}-${cell.d2}`}
                            data-status={cell.status}
                            onClick={() => setSelectedCell(cell)}
                            onMouseEnter={() => setSelectedCell(cell)}
                            className={`flex flex-col items-center justify-center rounded border py-1 font-mono text-[10px] font-bold transition ${cellStyle} ${
                                isSelected ? 'ring-2 ring-white/80 scale-[1.03]' : ''
                            }`}
                        >
                            <span>
                                {cell.d1}-{cell.d2}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Détail du lancer survolé / sélectionné */}
            <div
                data-testid="matrix-cell-detail"
                className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center justify-between"
            >
                {selectedCell ? (
                    <>
                        <span className="font-mono font-bold text-[#f3c65f]">
                            🎲 {isEn ? `AI Roll ${selectedCell.d1}-${selectedCell.d2}:` : `Tirage IA ${selectedCell.d1}-${selectedCell.d2} :`}
                        </span>
                        <span>
                            {selectedCell.status === 'direct_hit'
                                ? isEn
                                    ? `❌ Direct hit on point(s) ${selectedCell.hitBlots.join(', ')}`
                                    : `❌ Frappe directe sur flèche(s) ${selectedCell.hitBlots.join(', ')}`
                                : selectedCell.status === 'indirect_hit'
                                  ? isEn
                                      ? `⚠️ Indirect combined hit on point(s) ${selectedCell.hitBlots.join(', ')}`
                                      : `⚠️ Frappe indirecte combinée sur flèche(s) ${selectedCell.hitBlots.join(', ')}`
                                  : isEn
                                    ? '✅ Safe roll — no blot hit'
                                    : '✅ Tirage inoffensif — aucune frappe'}
                        </span>
                    </>
                ) : (
                    <span className="text-slate-400 italic">
                        {isEn
                            ? 'Hover or tap any dice roll (1-1 to 6-6) to inspect AI hitting lines.'
                            : "Survolez ou touchez un lancer (1-1 à 6-6) pour voir la menace de l'IA."}
                    </span>
                )}
            </div>
        </div>
    );
};

export const CoachDiceMatrix36 = React.memo(CoachDiceMatrix36Component);
export default CoachDiceMatrix36;
