'use client';

/**
 * Carte « Erreurs récurrentes » — agrégation des erreurs répétées par concept.
 *
 * Rôle :
 *   Lit les erreurs récurrentes de l'utilisateur connecté depuis Supabase
 *   (table `recurring_errors`) avec fallback transparent sur IndexedDB local
 *   (`recurrent_mistakes`) pour les invités ou le mode hors-ligne.
 */

import React, { useState, useEffect } from 'react';
import { getRecurringErrors } from '../../lib/supabase/db';
import { getCurrentUser } from '../../lib/supabase/auth';
import { loadAggregatedLocalRecurringErrors } from '../../lib/stats/statsAggregator';
import type { RecurringErrorRecord } from '../../lib/supabase/types';

export interface RecurringErrorsCardProps {
    /** Nombre maximal d'erreurs à afficher */
    limit?: number;
    /** Callback optionnel pour lancer directement un drill ciblé */
    onStartDrill?: (conceptId: string) => void;
}

export function RecurringErrorsCard({ limit = 5, onStartDrill }: RecurringErrorsCardProps) {
    const [errors, setErrors] = useState<RecurringErrorRecord[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLocalFallback, setIsLocalFallback] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    const localRecords = await loadAggregatedLocalRecurringErrors(limit);
                    if (mounted) {
                        setIsAuthenticated(false);
                        setErrors(localRecords);
                        setIsLocalFallback(localRecords.length > 0);
                        setIsLoading(false);
                    }
                    return;
                }

                if (mounted) setIsAuthenticated(true);

                let records = await getRecurringErrors(user.id, limit);
                let usedLocal = false;
                if (records.length === 0) {
                    const localRecords = await loadAggregatedLocalRecurringErrors(limit);
                    if (localRecords.length > 0) {
                        records = localRecords;
                        usedLocal = true;
                    }
                }
                if (mounted) {
                    setErrors(records);
                    setIsLocalFallback(usedLocal);
                    setIsLoading(false);
                }
            } catch (err) {
                console.warn('[RecurringErrorsCard] Erreur chargement, repli IndexedDB :', err);
                const localRecords = await loadAggregatedLocalRecurringErrors(limit).catch(() => []);
                if (mounted) {
                    setErrors(localRecords);
                    setIsLocalFallback(localRecords.length > 0);
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [limit]);

    if (isLoading) {
        return (
            <div data-testid="recurring-errors-loading" className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-3 animate-pulse">
                <div className="h-5 w-1/2 rounded bg-slate-700/60" />
                <div className="h-4 w-full rounded bg-slate-700/40" />
                <div className="h-4 w-5/6 rounded bg-slate-700/40" />
            </div>
        );
    }

    if (!isAuthenticated && errors.length === 0) {
        return (
            <div
                data-testid="recurring-errors-guest"
                className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl text-center"
            >
                <p className="text-sm text-slate-400">
                    🔒 Connecte-toi pour suivre tes erreurs récurrentes et tes axes de progression.
                </p>
            </div>
        );
    }

    if (errors.length === 0) {
        return (
            <div
                data-testid="recurring-errors-empty"
                className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl text-center"
            >
                <p className="text-sm text-slate-400">
                    ✨ Aucune erreur récurrente détectée pour le moment. Continue à jouer !
                </p>
            </div>
        );
    }

    const topConceptId = errors[0]?.concept_id || 'positional';

    return (
        <div
            data-testid="recurring-errors-card"
            className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl space-y-4"
        >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>🔁</span>
                        <span>Erreurs Récurrentes</span>
                        {isLocalFallback && (
                            <span
                                data-testid="recurring-errors-local-badge"
                                className="rounded-full bg-amber-950/70 border border-white/10 px-2 py-0.5 text-[11px] font-bold text-amber-300"
                            >
                                Local / Invité
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Les concepts que tu répètes le plus souvent — à travailler en priorité.
                    </p>
                </div>
                <span className="rounded-full bg-indigo-950/80 border border-indigo-600 px-3 py-1 text-xs font-bold text-indigo-300">
                    {errors.length} concept(s)
                </span>
            </div>

            <ul className="space-y-2">
                {errors.map((err) => (
                    <li
                        key={err.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/40 px-3 py-2.5"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-100 truncate">{err.concept_label}</p>
                            <p className="text-[11px] text-slate-400">
                                Perte cumulée : {Number(err.total_equity_loss).toFixed(3)} ΔEq
                            </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-rose-950/80 border border-rose-600/50 px-2.5 py-1 text-xs font-bold text-rose-300">
                            ×{err.occurrence_count}
                        </span>
                    </li>
                ))}
            </ul>

            <div className="pt-1 border-t border-slate-800/80 flex justify-end">
                {onStartDrill ? (
                    <button
                        type="button"
                        onClick={() => onStartDrill(topConceptId)}
                        data-testid="recurring-errors-train-btn"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:from-amber-300 hover:to-amber-400 transition"
                    >
                        <span>🎯</span>
                        <span>S&apos;entraîner sur mes points faibles</span>
                    </button>
                ) : (
                    <a
                        href={`/drills?concept=${encodeURIComponent(topConceptId)}`}
                        data-testid="recurring-errors-train-btn"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:from-amber-300 hover:to-amber-400 transition"
                    >
                        <span>🎯</span>
                        <span>S&apos;entraîner sur mes points faibles</span>
                    </a>
                )}
            </div>
        </div>
    );
}

export default RecurringErrorsCard;
