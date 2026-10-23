'use client';

import { useMemo } from 'react';
import type { CoachState } from './useCoach';

export interface UseCandidateHighlightParams {
    openingEntry: { bestMoves: Array<{ from: number; to: number }> } | null;
    isOpeningHighlightActive: boolean;
    coach: CoachState | null;
    coachHighlight: { optimal: Array<{ from: number; to: number }>; played: Array<{ from: number; to: number }> } | null;
    hoveredCandidate: string | null;
}

/**
 * Calcule les flèches actives du Coach ou de la prévisualisation d'un candidat au survol.
 */
export function useCandidateHighlight({
    openingEntry,
    isOpeningHighlightActive,
    coach,
    coachHighlight,
    hoveredCandidate,
}: UseCandidateHighlightParams) {
    return useMemo(() => {
        if (openingEntry && isOpeningHighlightActive) {
            return { optimal: openingEntry.bestMoves, played: [] };
        }
        if (!coach) return null;

        // Prévisualisation d'un candidat : on dessine ses flèches à partir de sa notation absolue.
        if (hoveredCandidate) {
            const candidate = coach.candidateMoves?.find((m: { notation: string }) => m.notation === hoveredCandidate);
            if (candidate) {
                const parsedMoves = candidate.notation
                    .trim()
                    .split(/\s+/)
                    .flatMap((token: string) => {
                        const m = token.match(/^(bar|\d+)\/(off|\d+)\*?(\((\d+)\))?$/i);
                        if (!m) return [];
                        const from = m[1].toLowerCase() === 'bar' ? 0 : Number(m[1]);
                        const to = m[2].toLowerCase() === 'off' ? 0 : Number(m[2]);
                        const count = m[4] ? Number(m[4]) : 1;
                        return Array.from({ length: count }, () => ({ from, to }));
                    });
                return { optimal: parsedMoves, played: [] };
            }
        }
        return coachHighlight;
    }, [openingEntry, isOpeningHighlightActive, coach, coachHighlight, hoveredCandidate]);
}
