'use client';

/**
 * Hook cinématique FLIP & vol WAAPI des pions (`useCheckerFlights`).
 *
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md, <= 200 lignes).
 * Strictement 0 `any`.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { X_BAR, O_BAR } from '../engine/backgammonEngine';
import {
    CATCH_UP_FACTOR,
    CATCH_UP_THRESHOLD,
    getFlightTotalMs,
    type FlightSpec,
    type RectLike,
} from '../lib/gameFeel/flightPhysics';
import { getSpeedPreset, type GameSpeed } from '../lib/gameFeel/speedPresets';
import type { BoardOrientation } from '../components/board/boardOrientation';
import {
    detectBoardMoveDeltas,
    type DetectedMoveDelta,
    HIDDEN_X_BAR_KEY,
    HIDDEN_O_BAR_KEY,
} from './flights/checkerMoveDeltaDetector';
import { queryPointElement } from './flights/checkerCoordinateResolver';
import { buildFlightSpecs } from './flights/checkerFlightBuilder';

export { detectBoardMoveDeltas, HIDDEN_X_BAR_KEY, HIDDEN_O_BAR_KEY };
export type { DetectedMoveDelta };

export interface UseCheckerFlightsParams {
    readonly board: ReadonlyArray<number>;
    readonly dice?: readonly [number, number] | null;
    readonly gameSpeed?: GameSpeed;
    readonly orientation?: BoardOrientation;
    readonly swapColors?: boolean;
    readonly containerRef?: React.RefObject<HTMLElement | null>;
}

export interface UseCheckerFlightsResult {
    readonly flights: ReadonlyArray<FlightSpec>;
    readonly hiddenAt: ReadonlyMap<number, number>;
    /** Étape FIRST de FLIP : capture le DOMRect du pion avant le dispatch React. */
    readonly prepareFlipForStep: (fromPoint?: number) => void;
    readonly completeFlight: (id: string) => void;
    readonly clearAllFlights: () => void;
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useCheckerFlights({
    board,
    dice = null,
    gameSpeed = 'tournament',
    orientation = 'normal',
    swapColors = false,
    containerRef,
}: UseCheckerFlightsParams): UseCheckerFlightsResult {
    const [flights, setFlights] = useState<FlightSpec[]>([]);
    const prevBoardRef = useRef<ReadonlyArray<number>>(board);
    const flightSeqRef = useRef<number>(0);
    const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const firstRectsRef = useRef<Map<number, RectLike>>(new Map());

    const prepareFlipForStep = useCallback(
        (fromPoint?: number) => {
            if (typeof document === 'undefined') return;
            const containerEl = containerRef?.current ?? document.getElementById('backgammon-board');
            const pointsToCapture =
                fromPoint !== undefined
                    ? [fromPoint]
                    : [X_BAR, ...Array.from({ length: 24 }, (_, i) => i + 1), O_BAR];
            for (const pt of pointsToCapture) {
                const kind: 'point' | 'bar' = pt === X_BAR || pt === O_BAR ? 'bar' : 'point';
                const el = queryPointElement(pt, kind, containerEl);
                if (el) {
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 || r.height > 0 || r.left !== 0 || r.top !== 0) {
                        firstRectsRef.current.set(pt, { left: r.left, top: r.top, width: r.width, height: r.height });
                    }
                }
            }
        },
        [containerRef],
    );

    const completeFlight = useCallback((id: string) => {
        const timer = timersRef.current.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setFlights((prev) => (prev.some((f) => f.id === id) ? prev.filter((f) => f.id !== id) : prev));
    }, []);

    const clearAllFlights = useCallback(() => {
        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current.clear();
        setFlights([]);
    }, []);

    useEffect(() => () => {
        timersRef.current.forEach((t) => clearTimeout(t));
        timersRef.current.clear();
    }, []);

    useIsomorphicLayoutEffect(() => {
        const prevBoard = prevBoardRef.current;
        prevBoardRef.current = board;
        if (prevBoard === board) {
            prepareFlipForStep();
            return;
        }

        const deltas = detectBoardMoveDeltas(prevBoard, board, dice);
        if (deltas.length === 0) {
            prepareFlipForStep();
            return;
        }

        const preset = getSpeedPreset(gameSpeed);
        const containerEl =
            containerRef?.current ?? (typeof document !== 'undefined' ? document.getElementById('backgammon-board') : null);

        setFlights((currentActive) => {
            const isCatchUp = currentActive.length + deltas.length > CATCH_UP_THRESHOLD || gameSpeed === 'blitz';
            const speedFactor = preset.T4_FLIGHT_SPEED_FACTOR * (isCatchUp ? CATCH_UP_FACTOR : 1);

            const spawned = buildFlightSpecs({
                deltas,
                prevBoard,
                board,
                speedFactor,
                containerEl,
                orientation,
                swapColors,
                firstRects: firstRectsRef.current,
                nextFlightId: () => {
                    flightSeqRef.current += 1;
                    return `flight-${flightSeqRef.current}`;
                },
            });

            for (const spec of spawned) {
                const totalLifeMs = spec.delayMs + getFlightTotalMs(spec);
                const t = setTimeout(() => {
                    timersRef.current.delete(spec.id);
                    setFlights((prev) =>
                        prev.some((f) => f.id === spec.id) ? prev.filter((f) => f.id !== spec.id) : prev,
                    );
                }, Math.max(16, totalLifeMs));
                timersRef.current.set(spec.id, t);
            }

            return [...currentActive, ...spawned];
        });

        prepareFlipForStep();
    }, [board, dice, gameSpeed, orientation, swapColors, containerRef, prepareFlipForStep]);

    const hiddenAt = useMemo<ReadonlyMap<number, number>>(() => {
        if (flights.length === 0) return new Map();
        const map = new Map<number, number>();
        for (const f of flights) {
            map.set(f.arrivalPoint, (map.get(f.arrivalPoint) ?? 0) + 1);
        }
        return map;
    }, [flights]);

    return {
        flights,
        hiddenAt,
        prepareFlipForStep,
        completeFlight,
        clearAllFlights,
    };
}

export default useCheckerFlights;
