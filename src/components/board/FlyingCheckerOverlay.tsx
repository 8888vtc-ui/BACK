'use client';

/**
 * Overlay d'animation spatiale FLIP / WAAPI des pions en vol (`FlyingCheckerOverlay`).
 *
 * Rôle :
 *   Exécute sur le compositeur GPU (60/120 FPS, 0 Layout Shift) les deux pistes
 *   synchronisées produites par `buildFlightKeyframes` (`flightPhysics.ts`) :
 *   - Groupe externe (`pathRef`) : translation 2D le long des waypoints + paliers de contact.
 *   - Groupe interne (`liftRef`) : arc parabolique + soulèvement `scale(1.08)` + écrasement bear-off.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Checker } from './Checker';
import { buildFlightKeyframes, type FlightSpec } from '../../lib/gameFeel/flightPhysics';

export interface FlyingCheckerItemProps {
    readonly flight: FlightSpec;
    readonly onComplete?: (id: string) => void;
}

export const FlyingCheckerItem: React.FC<FlyingCheckerItemProps> = React.memo(({ flight, onComplete }) => {
    const pathRef = useRef<HTMLDivElement | null>(null);
    const liftRef = useRef<HTMLDivElement | null>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const { pathFrames, liftFrames, totalMs } = useMemo(
        () => buildFlightKeyframes(flight),
        [flight],
    );

    useEffect(() => {
        const pathEl = pathRef.current;
        const liftEl = liftRef.current;
        if (!pathEl || typeof pathEl.animate !== 'function' || totalMs <= 0) {
            return;
        }

        const options: KeyframeAnimationOptions = {
            duration: totalMs,
            delay: flight.delayMs,
            fill: 'both',
        };

        const pathAnim = pathEl.animate(pathFrames, options);
        const liftAnim = liftEl && typeof liftEl.animate === 'function' ? liftEl.animate(liftFrames, options) : null;

        pathAnim.onfinish = () => {
            onCompleteRef.current?.(flight.id);
        };

        return () => {
            try {
                pathAnim.cancel();
                liftAnim?.cancel();
            } catch {
                // Ignorer si l'animation est déjà terminée
            }
        };
    }, [flight.id, flight.delayMs, pathFrames, liftFrames, totalMs]);

    const initialTransform =
        typeof pathFrames[0]?.transform === 'string'
            ? pathFrames[0].transform
            : `translate(${flight.waypoints[0]?.x ?? 0}px, ${flight.waypoints[0]?.y ?? 0}px)`;

    const isWhite = flight.color === 'white';

    return (
        <div
            ref={pathRef}
            data-testid={`flying-checker-${flight.id}`}
            data-flight-id={flight.id}
            data-arrival-point={flight.arrivalPoint}
            data-checker-color={flight.color}
            className="pointer-events-none absolute left-0 top-0 z-40 select-none"
            style={{
                transform: initialTransform,
                willChange: 'transform',
            }}
        >
            <div className="-translate-x-1/2 -translate-y-1/2">
                <div
                    ref={liftRef}
                    style={{
                        willChange: 'transform',
                        filter: isWhite
                            ? 'drop-shadow(0 10px 16px rgba(0,0,0,0.45))'
                            : 'drop-shadow(0 12px 20px rgba(0,0,0,0.75))',
                    }}
                >
                    <Checker color={flight.color} isPlayable={false} isTopChecker={true} isActiveMotion={true} />
                </div>
            </div>
        </div>
    );
});
FlyingCheckerItem.displayName = 'FlyingCheckerItem';

export interface FlyingCheckerOverlayProps {
    readonly flights: ReadonlyArray<FlightSpec>;
    readonly onFlightComplete?: (id: string) => void;
}

export const FlyingCheckerOverlay: React.FC<FlyingCheckerOverlayProps> = React.memo(({ flights, onFlightComplete }) => {
    if (flights.length === 0) return null;

    return (
        <div
            data-testid="flying-checker-overlay"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-40 overflow-hidden select-none"
        >
            {flights.map((flight) => (
                <FlyingCheckerItem key={flight.id} flight={flight} onComplete={onFlightComplete} />
            ))}
        </div>
    );
});
FlyingCheckerOverlay.displayName = 'FlyingCheckerOverlay';

export default FlyingCheckerOverlay;
