'use client';

/**
 * Hook de spatialisation sonore au point culminant (Apex) des vols de pions heurtés (Blots).
 * Déclenche l'impact physique au sommet de la trajectoire FLIP (75% du vol de l'attaquant).
 */

import { useEffect, useRef } from 'react';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';
import type { FlightSpec } from '../../lib/gameFeel/flightPhysics';

export function useBoardFlightSound(flights: readonly FlightSpec[]): void {
    const seenHitFlightIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        for (const f of flights) {
            if (f.id.startsWith('flight-hit-') && !seenHitFlightIdsRef.current.has(f.id)) {
                seenHitFlightIdsRef.current.add(f.id);
                sensoryFeedbackController.scheduleBlotHitAtFlightApex(Math.round(f.delayMs / 0.75));
            }
        }
    }, [flights]);
}
