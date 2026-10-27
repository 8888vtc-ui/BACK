'use client';

/**
 * Résumé des derniers matchs joués dans le Hub Joueur (Audit 3 / 5 — RecentMatchesSummary).
 *
 * Affiche :
 *   - Les 3 à 5 derniers matchs enregistrés (Supabase / IndexedDB) avec badge Victoire/Défaite,
 *     adversaire, score final, PR et date relative.
 *   - Raccourci en 1 clic pour ouvrir la revue de partie ou l'import/export horloger.
 *   - Strictement 0 `any`, < 300 lignes.
 */

import React from 'react';
import type { RecentMatchEntry } from '../../features/progression/userProgressionService';

export interface RecentMatchesSummaryProps {
    matches: ReadonlyArray<RecentMatchEntry>;
    onReviewMatch: (matchId?: string) => void;
    onOpenImportExport?: () => void;
}

const RecentMatchesSummaryComponent: React.FC<RecentMatchesSummaryProps> = ({
    matches,
    onReviewMatch,
    onOpenImportExport,
}) => {
    if (matches.length === 0) {
        if (!onOpenImportExport) return null;
        return (
            <section
                aria-label="Importation de partie"
                data-testid="recent-matches-summary-empty"
                className="w-full rounded-2xl border border-white/10 bg-black/25 p-3 flex items-center justify-between"
            >
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-base">⏱️</span>
                    <span>Revue de match externe (.mat / XGID)</span>
                </div>
                {onOpenImportExport && (
                    <button
                        type="button"
                        onClick={onOpenImportExport}
                        data-testid="recent-matches-empty-import-btn"
                        className="rounded-xl border border-[#d4af37]/40 bg-[#25180c] px-3 py-1.5 text-xs font-bold text-amber-200 hover:border-[#f3c65f] hover:text-white transition"
                    >
                        Importer une partie
                    </button>
                )}
            </section>
        );
    }

    return (
        <section
            aria-label="Derniers matchs joués"
            data-testid="recent-matches-summary"
            className="w-full rounded-2xl border border-white/10 bg-black/35 p-3.5"
        >
            <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400/85">
                    Historique Récent ({matches.length})
                </span>
                <div className="flex items-center gap-3">
                    {onOpenImportExport && (
                        <button
                            type="button"
                            onClick={onOpenImportExport}
                            data-testid="recent-matches-import-btn"
                            className="rounded-lg border border-[#d4af37]/35 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-amber-200 hover:border-[#f3c65f] hover:text-white transition flex items-center gap-1"
                        >
                            <span>⏱️</span>
                            <span>Importer (.mat)</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onReviewMatch()}
                        data-testid="recent-matches-view-all-btn"
                        className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 transition"
                    >
                        Revoir les analyses →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {matches.slice(0, 3).map((match) => {
                    const isWin = match.isVictory === true;
                    const prDisplay = match.pr !== null ? match.pr.toFixed(1) : '—';
                    const relativeTime = match.relativeDate || match.dateIso;

                    return (
                        <button
                            key={match.id}
                            type="button"
                            data-testid={`review-match-btn-${match.id}`}
                            onClick={() => onReviewMatch(match.id)}
                            className="flex flex-col items-start gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-2.5 text-left transition hover:border-[#f3c65f]/50 hover:bg-white/[0.06] active:scale-[0.98]"
                        >
                            <div className="flex w-full items-center justify-between">
                                <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                        isWin
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : 'bg-rose-500/20 text-rose-300'
                                    }`}
                                >
                                    {isWin ? 'Victoire' : 'Défaite'}
                                </span>
                                <span className="text-[10px] text-slate-400">{relativeTime}</span>
                            </div>

                            <div className="mt-1 flex w-full items-center justify-between font-mono text-xs">
                                <span className="truncate font-sans font-semibold text-slate-200">
                                    vs {match.opponentLabel}
                                </span>
                                <span className="font-bold text-amber-300">{`${match.scoreX} – ${match.scoreO}`}</span>
                            </div>

                            <div className="flex w-full items-center justify-between text-[10px] text-slate-400">
                                <span>Longueur: {match.matchLength} pts</span>
                                <span className="font-mono text-slate-300">PR {prDisplay}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

function formatRelativeTime(dateIso: string): string {
    const diffMs = Date.now() - new Date(dateIso).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'À l’instant';
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j`;
}

export const RecentMatchesSummary = React.memo(RecentMatchesSummaryComponent);
export default RecentMatchesSummary;
