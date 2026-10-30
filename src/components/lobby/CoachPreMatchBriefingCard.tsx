'use client';

/**
 * Briefing Pré-Match Personnalisé du Coach (Lobby — Barre compacte 1 ligne).
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

    const humanConceptTitle =
        matchedConcept?.name ??
        (topError?.concept_label
            ? topError.concept_label.replace(/_/g, ' ')
            : 'Sécurité des pions isolés');

    const humanWinLossPct = topError
        ? Math.max(1, Math.min(49, Math.round(Math.abs(Number(topError.total_equity_loss)) * 50)))
        : 4;

    const adviceText =
        matchedConcept?.recommendation ??
        'Ne laissez pas de pion isolé à portée directe (1 à 6 cases) devant le jan adverse.';

    return (
        <section
            data-testid="lobby-prematch-briefing"
            aria-label="Briefing pré-match du Coach"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-3.5 py-2"
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 shrink-0">
                        🎓 Conseil du Coach
                    </span>
                    {topError ? (
                        <span
                            data-testid="lobby-briefing-error-badge"
                            className="rounded-md border border-rose-400/30 bg-rose-950/60 px-2 py-0.5 text-[11px] font-bold text-rose-200 shrink-0"
                        >
                            À surveiller : {humanConceptTitle} (-{humanWinLossPct}% de chances)
                        </span>
                    ) : (
                        <span className="rounded-md border border-emerald-400/30 bg-emerald-950/40 px-2 py-0.5 text-[11px] font-bold text-emerald-200 shrink-0">
                            Point clé : {humanConceptTitle}
                        </span>
                    )}
                    <p className="text-xs text-slate-300 truncate flex-1 min-w-[180px]">{adviceText}</p>
                </div>

                {onOpenDrills && (
                    <button
                        type="button"
                        data-testid="lobby-briefing-drill-btn"
                        onClick={() => onOpenDrills(topError?.concept_id)}
                        className="shrink-0 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200 transition hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-white"
                    >
                        🎯 {topError ? 'Corriger en 2 min' : 'S’entraîner'}
                    </button>
                )}
            </div>
        </section>
    );
};

export default CoachPreMatchBriefingCard;
