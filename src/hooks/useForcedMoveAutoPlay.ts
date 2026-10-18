/**
 * Hook d'auto-play du coup forcé unique.
 *
 * Rôle :
 *   Si le joueur ne dispose que d'un seul coup légal sur l'ensemble du plateau,
 *   ce coup est joué automatiquement après un délai de 600 ms.
 *
 * Dépendances :
 *   `react`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `useCheckerInteractions`.
 */

import { useEffect } from 'react';

export interface UseForcedMoveAutoPlayOptions {
    phase: string;
    turn: 'X' | 'O';
    dice: [number, number] | null;
    leftDieTargets: Map<number, number[]>;
    rightDieTargets: Map<number, number[]>;
    onPlayMove: (from: number, to: number, die: 0 | 1) => void;
}

export function useForcedMoveAutoPlay({
    phase,
    turn,
    dice,
    leftDieTargets,
    rightDieTargets,
    onPlayMove,
}: UseForcedMoveAutoPlayOptions) {
    useEffect(() => {
        if (phase !== 'PLAYING_MOVES' || turn !== 'X' || !dice) return;

        let totalMoves = 0;
        let singleFrom: number | null = null;
        let singleTo: number | null = null;
        let singleDie: 0 | 1 | null = null;

        for (const [from, dests] of leftDieTargets) {
            for (const to of dests) {
                totalMoves++;
                singleFrom = from;
                singleTo = to;
                singleDie = 0;
            }
        }
        for (const [from, dests] of rightDieTargets) {
            for (const to of dests) {
                totalMoves++;
                singleFrom = from;
                singleTo = to;
                singleDie = 1;
            }
        }

        if (totalMoves === 1 && singleFrom !== null && singleTo !== null && singleDie !== null) {
            const timer = window.setTimeout(() => {
                onPlayMove(singleFrom!, singleTo!, singleDie!);
            }, 600);
            return () => window.clearTimeout(timer);
        }
    }, [phase, turn, dice, leftDieTargets, rightDieTargets, onPlayMove]);
}
