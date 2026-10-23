'use client';

/**
 * Hook de feedback sonore et haptique des déplacements de pions (Audit 11 / 20 — LOI 5).
 *
 * Rôle :
 *   Enveloppe un handler `onPlayMove` pour déclencher avec latence < 10 ms :
 *     1. `BLOT_HIT`    : `playHit()` + `impactHeavy()` (50 ms)
 *     2. `BEAR_OFF`    : `playMove()` + `impactMedium()` (25 ms)
 *     3. `STACK_CLACK` : `playMove()` + `impactLight()` (10 ms — empilement sur pile existante)
 *     4. `FELT_LAND`   : `playMove()` + `impactLight()` (10 ms — pose normale sur le feutre)
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect } from 'react';
import type { Player } from '../engine/backgammonEngine';
import { useSoundManager } from './useSoundManager';
import { impactHeavy, impactMedium, impactLight } from '../lib/capacitor/haptics';
import {
    classifyMoveSensoryNuance,
    sensoryAudioEngine,
    type MoveSensoryNuance,
} from '../lib/sound/sensoryAudioHaptics';

export interface UseCheckerSoundFeedbackParams {
    board: number[];
    turn: Player;
    onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    onNuancePlayed?: (nuance: MoveSensoryNuance) => void;
}

export function useCheckerSoundFeedback({
    board,
    turn,
    onPlayMove,
    onNuancePlayed,
}: UseCheckerSoundFeedbackParams): (from: number, to: number, die?: 0 | 1) => void {
    const { isMuted, playMove, playHit } = useSoundManager();

    useEffect(() => {
        sensoryAudioEngine.prewarm();
    }, []);

    return useCallback(
        (from: number, to: number, die?: 0 | 1) => {
            const nuance = classifyMoveSensoryNuance(board, turn, from, to);

            onPlayMove(from, to, die);
            sensoryAudioEngine.playNuance(nuance, isMuted);
            onNuancePlayed?.(nuance);

            if (nuance === 'BLOT_HIT') {
                playHit();
                void impactHeavy();
            } else if (nuance === 'BEAR_OFF') {
                playMove();
                void impactMedium();
            } else {
                playMove();
                void impactLight();
            }
        },
        [board, turn, isMuted, onPlayMove, onNuancePlayed, playHit, playMove],
    );
}

export default useCheckerSoundFeedback;
