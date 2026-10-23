'use client';

/**
 * Résultats d'un Rollout Profond — verdict de confirmation + tableau comparatif.
 *
 * Rôle :
 *   Affiche, après un rollout terminé :
 *     - le verdict (coup confirmé ou renversé) ;
 *     - le tableau `#` | `Coup` | `Équité` | `Win %` | `Gammon %` ;
 *     - la synthèse (durée) et le bouton de relance.
 *
 * Composant 100 % muet (LOI 5).
 *
 * Dépendances :
 *   `rolloutClient` (types uniquement).
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer le bloc dans `DeepRolloutSection.tsx`.
 */

import React from 'react';
import type { RolloutResult } from '../../lib/engine/rolloutClient';

export interface RolloutResultsTableProps {
    /** Résultat du rollout. */
    result: RolloutResult;
    /** Coup optimal de référence. */
    optimalMove?: string | null;
    /** Premier coup candidat (repli). */
    fallbackMove: string;
    /** Relance le rollout. */
    onRerun: () => void;
    /** Traducteur i18n. */
    t: (key: string, vars?: Record<string, any>) => string;
}

const RolloutResultsTableComponent: React.FC<RolloutResultsTableProps> = ({
    result,
    optimalMove,
    fallbackMove,
    onRerun,
    t,
}) => {
    const referenceMove = optimalMove || fallbackMove;
    const isConfirmed = result.confirmedBestMove === referenceMove;

    return (
        <div data-testid="rollout-results" className="mt-4 space-y-3">
            {/* Verdict de confirmation */}
            <div
                data-testid="rollout-verdict"
                className={`rounded-lg p-2.5 border text-xs font-medium flex items-center gap-2 ${isConfirmed
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                    : 'bg-amber-950/60 border-amber-800 text-amber-200'
                    }`}
            >
                <span className="text-base">{isConfirmed ? '✅' : '⚠️'}</span>
                <div>
                    <strong>
                        {isConfirmed ? t('rollout.verdictConfirmed') : t('rollout.verdictReversed')}
                    </strong>{' '}
                    <span>
                        {t('rollout.confirmedDesc', {
                            trials: result.trials,
                            move: result.confirmedBestMove,
                            diff: result.equityDifference.toFixed(3),
                        })}
                    </span>
                </div>
            </div>

            {/* Tableau comparatif des coups */}
            <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/60 text-[10px] uppercase tracking-wider text-slate-400">
                        <tr>
                            <th className="py-2 px-3">{t('rollout.tableRank')}</th>
                            <th className="py-2 px-3">{t('rollout.tableMove')}</th>
                            <th className="py-2 px-3">{t('rollout.tableEquity')}</th>
                            <th className="py-2 px-3">{t('rollout.tableWin')}</th>
                            <th className="py-2 px-3">{t('rollout.tableGammon')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                        {result.moves.map((m) => (
                            <tr
                                key={m.notation}
                                className={m.isConfirmed ? 'bg-emerald-950/20 text-emerald-200' : 'text-slate-300'}
                            >
                                <td className="py-2 px-3 font-bold">
                                    #{m.rank} {m.isConfirmed && '🏆'}
                                </td>
                                <td className="py-2 px-3 font-semibold text-white">{m.notation}</td>
                                <td className="py-2 px-3 font-bold">
                                    {m.equity > 0 ? `+${m.equity.toFixed(3)}` : m.equity.toFixed(3)}
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                        (±{m.confidenceInterval.toFixed(3)})
                                    </span>
                                </td>
                                <td className="py-2 px-3">{(m.probabilities.win * 100).toFixed(1)}%</td>
                                <td className="py-2 px-3">{(m.probabilities.winGammon * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Synthèse du pool */}
            <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{t('rollout.calculatedIn', { duration: result.durationSeconds.toFixed(2) })}</span>
                <button
                    type="button"
                    onClick={onRerun}
                    className="text-indigo-400 hover:text-indigo-300 hover:underline"
                >
                    {t('rollout.rerunBtn')}
                </button>
            </div>
        </div>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const RolloutResultsTable = React.memo(RolloutResultsTableComponent);
export default RolloutResultsTable;
