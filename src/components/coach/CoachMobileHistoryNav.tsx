'use client';

/**
 * Navigation temporelle des coups analysés pour le tiroir mobile du Coach.
 * Conforme à SCALABILITY.md (< 80 lignes).
 */

import React from 'react';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoach';

export interface CoachMobileHistoryNavProps {
    totalHistory: number;
    activeHistIdx: number;
    selectedCoachHistoryIndex: number | null;
    coachHistory: ReadonlyArray<CoachAnalysisHistoryEntry>;
    onSelectCoachHistoryIndex: (index: number | null) => void;
}

export const CoachMobileHistoryNav: React.FC<CoachMobileHistoryNavProps> = ({
    totalHistory,
    activeHistIdx,
    selectedCoachHistoryIndex,
    coachHistory,
    onSelectCoachHistoryIndex,
}) => {
    if (totalHistory <= 0) return null;

    return (
        <div className="mt-2 flex items-center justify-between gap-1 text-[11px] pt-1.5 border-t border-[#d4af37]/20 select-none">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={activeHistIdx <= 0}
                    onClick={() => onSelectCoachHistoryIndex(0)}
                    className="rounded border border-[#d4af37]/30 bg-black/50 px-1.5 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                    title="Premier coup analysé"
                >
                    ⏮
                </button>
                <button
                    type="button"
                    disabled={activeHistIdx <= 0}
                    onClick={() => onSelectCoachHistoryIndex(Math.max(0, activeHistIdx - 1))}
                    className="rounded border border-[#d4af37]/30 bg-black/50 px-2 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                    title="Coup précédent"
                >
                    ◀ Préc.
                </button>
            </div>
            <span className="font-mono font-bold text-[#f3c65f] truncate">
                Coup #{coachHistory[activeHistIdx]?.turnIndex ?? activeHistIdx + 1} ({activeHistIdx + 1}/{totalHistory})
            </span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={activeHistIdx >= totalHistory - 1 && selectedCoachHistoryIndex === null}
                    onClick={() => {
                        if (activeHistIdx + 1 >= totalHistory - 1) {
                            onSelectCoachHistoryIndex(null);
                        } else {
                            onSelectCoachHistoryIndex(activeHistIdx + 1);
                        }
                    }}
                    className="rounded border border-[#d4af37]/30 bg-black/50 px-2 py-0.5 font-bold text-amber-200 hover:border-[#f3c65f] disabled:opacity-35"
                    title="Coup suivant"
                >
                    Suiv. ▶
                </button>
                <button
                    type="button"
                    disabled={selectedCoachHistoryIndex === null}
                    onClick={() => onSelectCoachHistoryIndex(null)}
                    className="rounded border border-emerald-500/40 bg-emerald-950/60 px-1.5 py-0.5 font-bold text-emerald-300 hover:border-emerald-400 disabled:opacity-35"
                    title="Retour au jeu direct"
                >
                    Direct
                </button>
            </div>
        </div>
    );
};

export default React.memo(CoachMobileHistoryNav);
