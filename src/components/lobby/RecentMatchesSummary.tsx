'use client';

/**
 * Résumé des derniers matchs joués dans le Hub Joueur (Audit 3 / 5 — RecentMatchesSummary).
 *
 * Affiche :
 *   - Les 3 à 5 derniers matchs enregistrés (Supabase / IndexedDB) avec badge Victoire/Défaite,
 *     adversaire, score final, PR et date relative.
 *   - Raccourci en 1 clic pour ouvrir la revue de partie.
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React from 'react';
import type { RecentMatchEntry } from '../../features/progression/userProgressionService';

export interface RecentMatchesSummaryProps {
    matches: ReadonlyArray<RecentMatchEntry>;
    onReviewMatch: (matchId?: string) => void;
}

const RecentMatchesSummaryComponent: React.FC<RecentMatchesSummaryProps> = ({
    matches,
    onReviewMatch,
}) => {
    if (matches.length === 0) {
        return null;
    }

    return (
        <section
            aria-label="Derniers matchs joués"
            data-testid="recent-matches-summary"
            className="w-full rounded-2xl border border-white/10 bg-black/35 p-3.5"
        >
            <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/85">
                    Historique Récent ({matches.length})
                </span>
                <button
                    type="button"
                    onClick={() => onReviewMatch()}
                    data-testid="recent-matches-view-all-btn"
                    className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 transition"
                >
                    Revoir les analyses →
                </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {matches.slice(0, 3).map((match) => {
                    const statusBadge =
                        match.isVictory === true
                            ? {
                                  label: 'Victoire',
                                  cls: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300',
                              }
                            : match.isVictory === false
                              ? {
                                    label: 'Défaite',
                                    cls: 'border-rose-400/40 bg-rose-500/15 text-rose-300',
                                }
                              : {
                                    label: 'En cours',
                                    cls: 'border-amber-400/40 bg-amber-500/15 text-amber-300',
                                };

                    return (
                        <div
                            key={match.id}
                            data-testid={`recent-match-card-${match.id}`}
                            className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs transition hover:border-amber-400/35 hover:bg-white/10"
                        >
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase border ${statusBadge.cls}`}
                                    >
                                        {statusBadge.label}
                                    </span>
                                    <span className="truncate font-bold text-slate-100">
                                        {match.opponentLabel}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="font-mono font-bold text-amber-200">
                                        {match.scoreX} – {match.scoreO}
                                    </span>
                                    <span>·</span>
                                    <span>
                                        {match.matchLength === 0 ? 'Money' : `${match.matchLength} pts`}
                                    </span>
                                    {match.pr !== null && (
                                        <>
                                            <span>·</span>
                                            <span className="font-mono text-emerald-300">
                                                PR {match.pr.toFixed(1)}
                                            </span>
                                        </>
                                    )}
                                    <span>·</span>
                                    <span>{match.relativeDate}</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onReviewMatch(match.id)}
                                data-testid={`review-match-btn-${match.id}`}
                                className="shrink-0 rounded-lg border border-amber-400/35 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/25 transition"
                            >
                                Revoir
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export const RecentMatchesSummary = React.memo(RecentMatchesSummaryComponent);
export default RecentMatchesSummary;
