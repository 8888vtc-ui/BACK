'use client';

/**
 * Briefing Pré-Match Personnalisé du Grand-Maître Coach (Lobby).
 *
 * Rôle :
 *   Synthétise avant le coup d'envoi l'erreur récurrente n°1 du joueur
 *   (lue depuis Supabase `recurring_errors` ou le fallback IndexedDB local
 *   `recurrent_mistakes` pour les invités) et propose un accès direct aux Drills.
 */

import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../lib/supabase/auth';
import { getRecurringErrors } from '../../lib/supabase/db';
import {
    STRATEGIC_CONCEPTS_CATALOG,
    loadAggregatedLocalRecurringErrors,
} from '../../lib/stats/statsAggregator';
import type { RecurringErrorRecord } from '../../lib/supabase/types';

export interface CoachPreMatchBriefingCardProps {
    onOpenDrills?: (conceptId?: string) => void;
}

export const CoachPreMatchBriefingCard: React.FC<CoachPreMatchBriefingCardProps> = ({
    onOpenDrills,
}) => {
    const [topError, setTopError] = useState<RecurringErrorRecord | null>(null);
    const [isLocalGuest, setIsLocalGuest] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;

        async function loadBriefing() {
            try {
                const user = await getCurrentUser().catch(() => null);
                if (user) {
                    const remote = await getRecurringErrors(user.id, 1);
                    if (remote.length > 0) {
                        if (mounted) {
                            setTopError(remote[0]);
                            setIsLocalGuest(false);
                        }
                        return;
                    }
                }
                const local = await loadAggregatedLocalRecurringErrors(1);
                if (mounted && local.length > 0) {
                    setTopError(local[0]);
                    setIsLocalGuest(!user);
                }
            } catch {
                // Silencieux en cas d'erreur de lecture
            }
        }

        void loadBriefing();
        return () => {
            mounted = false;
        };
    }, []);

    const matchedConcept = topError
        ? STRATEGIC_CONCEPTS_CATALOG.find(
              (c) =>
                  c.id === topError.concept_id ||
                  c.id.replace('_', '-') === topError.concept_id,
          )
        : STRATEGIC_CONCEPTS_CATALOG[0];

    const adviceText =
        matchedConcept?.recommendation ??
        'Comptez systématiquement les tirs directs (1 à 6) et surveillez votre fenêtre de videau (Market Window) avant chaque décision.';

    return (
        <section
            data-testid="lobby-prematch-briefing"
            aria-label="Briefing pré-match du Coach"
            className="w-full rounded-2xl border border-white/10 bg-[#0c111d]/75 px-4 py-3 shadow-md"
        >
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                            🎓 Conseil du Coach
                        </span>
                        {topError ? (
                            <span
                                data-testid="lobby-briefing-error-badge"
                                className="rounded-full border border-white/10 bg-rose-950/70 px-2.5 py-0.5 text-[11px] font-bold text-rose-200"
                            >
                                Point faible n°1 : {topError.concept_label} (×{topError.occurrence_count} · -
                                {Math.abs(Number(topError.total_equity_loss)).toFixed(3)} ΔEq)
                            </span>
                        ) : (
                            <span className="rounded-full border border-white/10 bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                                Focus du jour : {matchedConcept?.name}
                            </span>
                        )}
                        {isLocalGuest && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                                Profil Local
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{adviceText}</p>
                </div>

                {onOpenDrills && (
                    <button
                        type="button"
                        data-testid="lobby-briefing-drill-btn"
                        onClick={() => onOpenDrills(topError?.concept_id)}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-bold text-[#f3c65f] transition hover:border-white/25 hover:bg-white/10 hover:text-amber-100"
                    >
                        🎯 {topError ? 'Corriger en Drill' : 'Lancer un Drill'}
                    </button>
                )}
            </div>
        </section>
    );
};

export default CoachPreMatchBriefingCard;
