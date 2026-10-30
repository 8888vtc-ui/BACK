'use client';

/**
 * Hook unifié de chorégraphie haptique mobile (`useHaptic.ts`).
 *
 * Rôle :
 *   Encapsule l'API Web Vibration (`navigator.vibrate`) et la passerelle native
 *   Capacitor (`@capacitor/haptics`) avec dégradation gracieuse sur iOS Safari PWA
 *   et annulation défensive (`cancelHaptics()` -> `navigator.vibrate(0)`).
 *
 * Dépendances :
 *   - `src/lib/capacitor/haptics.ts`
 *   - `src/lib/gameFeel/sensoryPresets.ts`
 *
 * Comment retirer :
 *   Supprimer ce fichier et remplacer ses appels par des appels directs à `haptics.ts`.
 *
 * Strictement 0 `any`, ≤ 200 lignes.
 */

import { useCallback } from 'react';
import {
    cancelHaptics as cancelNativeOrWebHaptics,
    triggerSensoryEventHaptics,
} from '../lib/capacitor/haptics';
import type { GameEventType } from '../lib/gameFeel/sensoryPresets';

export type HapticPattern =
    | GameEventType
    | 'pickup'
    | 'place'
    | 'blotHit'
    | 'diceRoll'
    | 'cubeDrop'
    | 'bearOff'
    | 'swapDice'
    | 'brilliant'
    | 'blunder';

const PATTERN_TO_EVENT: Readonly<Record<HapticPattern, GameEventType>> = Object.freeze({
    checkerPickup: 'checkerPickup',
    checkerSlideAndPlace: 'checkerSlideAndPlace',
    blotHit: 'blotHit',
    diceRollAndBounce: 'diceRollAndBounce',
    doublingCubeDrop: 'doublingCubeDrop',
    bearOff: 'bearOff',
    swapDice: 'swapDice',
    reviewBrilliantMove: 'reviewBrilliantMove',
    reviewBlunderMove: 'reviewBlunderMove',
    pickup: 'checkerPickup',
    place: 'checkerSlideAndPlace',
    diceRoll: 'diceRollAndBounce',
    cubeDrop: 'doublingCubeDrop',
    brilliant: 'reviewBrilliantMove',
    blunder: 'reviewBlunderMove',
});

export interface UseHapticResult {
    readonly triggerHaptic: (pattern: HapticPattern) => Promise<void>;
    readonly cancelHaptics: () => void;
}

export function useHaptic(): UseHapticResult {
    const triggerHaptic = useCallback(async (pattern: HapticPattern): Promise<void> => {
        const mappedEvent = PATTERN_TO_EVENT[pattern];
        if (!mappedEvent) return;
        await triggerSensoryEventHaptics(mappedEvent);
    }, []);

    const cancelHaptics = useCallback((): void => {
        cancelNativeOrWebHaptics();
    }, []);

    return { triggerHaptic, cancelHaptics };
}

export default useHaptic;
