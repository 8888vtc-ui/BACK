'use client';

/**
 * Hook de feedback sonore des déplacements de pions.
 *
 * Rôle :
 *   Enveloppe un handler `onPlayMove` pour déclencher le son approprié
 *   (clac de pose, ou frappe sèche si un blot adverse est capturé) via
 *   `useSoundManager`. Isole cette logique hors de `page.tsx` (LOI 5).
 *
 * Dépendances :
 *   `useSoundManager`.
 *
 * Retrait :
 *   Supprimer ce fichier et réintégrer la logique dans `page.tsx`.
 */

import { useCallback } from 'react';
import { useSoundManager } from './useSoundManager';

export interface UseCheckerSoundFeedbackParams {
    board: number[];
    turn: 'X' | 'O';
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
}

export function useCheckerSoundFeedback({
    board,
    turn,
    onPlayMove,
}: UseCheckerSoundFeedbackParams): (from: number, to: number, die?: 0 | 1) => void {
    const { playMove, playHit } = useSoundManager();

    return useCallback(
        (from: number, to: number, die?: 0 | 1) => {
            const targetCount = board[to] ?? 0;
            const isHit = turn === 'X' ? targetCount === -1 : targetCount === 1;
            onPlayMove(from, to, die);
            if (isHit) playHit();
            else playMove();
        },
        [board, turn, onPlayMove, playHit, playMove],
    );
}

export default useCheckerSoundFeedback;
