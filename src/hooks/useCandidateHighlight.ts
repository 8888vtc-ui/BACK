'use client';

import { useMemo } from 'react';
import type { CoachState } from './useCoach';
import { parseCoachNotationMoves } from '../features/coach/coachMoveNotation';

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
        if (hoveredCandidate === '__HIDE__') {
            return null;
        }

        // Prévisualisation d'un candidat ou recommandation du Professeur (mode guidé / débutant) :
        if (hoveredCandidate) {
            const parsedMoves = parseCoachNotationMoves(hoveredCandidate, 'X');
            if (parsedMoves.length > 0) {
                return { optimal: parsedMoves, played: coachHighlight?.played ?? [] };
            }
        }

        if (openingEntry && isOpeningHighlightActive) {
            return { optimal: openingEntry.bestMoves, played: [] };
        }

        if (!coach) return null;

        return coachHighlight;
    }, [openingEntry, isOpeningHighlightActive, coach, coachHighlight, hoveredCandidate]);
}
