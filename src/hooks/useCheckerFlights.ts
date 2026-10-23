'use client';

/**
 * Hook cinématique FLIP & vol WAAPI des pions (`useCheckerFlights`).
 *
 * Algorithme FLIP en 4 temps (100 % hors main thread JS) :
 *   1. FIRST  : `prepareFlipForStep` (ou snapshot pré-commit) capture le `DOMRect` d'origine.
 *   2. LAST   : dans `useLayoutEffect` après le commit React, mesure le `DOMRect` d'arrivée.
 *   3. INVERT : calcule Δx = first.left - last.left, Δy = first.top - last.top, D_px = √(Δx²+Δy²).
 *   4. PLAY   : déclenche `element.animate(...)` via WAAPI + piste `FlyingCheckerOverlay`.
 *
 * Strictement 0 `any`.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { borneOffCount, O_BAR, O_OFF, X_BAR, X_OFF, type Player } from '../engine/backgammonEngine';
import {
    BEAR_OFF_DURATION_MS,
    BEAR_OFF_EASING,
    BEAR_OFF_END_SCALE_Y,
    CATCH_UP_FACTOR,
    CATCH_UP_THRESHOLD,
    CONVERGENCE_STAGGER_MS,
    HIT_ATTACKER_EASING,
    HIT_ATTACKER_SCALE,
    HIT_TO_BAR_DURATION_MS,
    HIT_TO_BAR_EASING,
    INTERMEDIATE_TOUCH_PAUSE_MS,
    NORMAL_APEX_DROP_SHADOW,
    NORMAL_APEX_OFFSET,
    NORMAL_APEX_SCALE,
    NORMAL_FLIGHT_EASING,
    buildFlipElementKeyframes,
    computeArcHeight,
    computeContractedFirstHopMs,
    computeFlipInvertVector,
    computeHitAttackerDurationPx,
    computeHitEjectDelayMs,
    computeNormalFlightDurationPx,
    distance,
    getFlightTotalMs,
    type FlightSpec,
    type RectLike,
    type Vec2,
} from '../lib/gameFeel/flightPhysics';
import { getSpeedPreset, type GameSpeed } from '../lib/gameFeel/speedPresets';
import {
    BOT_BASE,
    CHECKER_D,
    MAX_VISIBLE,
    POINT_W,
    TOP_BASE,
    pointLayout,
} from '../components/board/boardGeometry';
import { getOrientedRows, type BoardOrientation } from '../components/board/boardOrientation';

/** Clés virtuelles dans `hiddenAt` pour les pions expulsés vers la barre centrale. */
export const HIDDEN_X_BAR_KEY = -1;
export const HIDDEN_O_BAR_KEY = -25;

export interface DetectedMoveDelta {
    readonly player: Player;
    /** Liste ordonnée des points parcourus (`[from, to]` ou `[from, mid, to]`). */
    readonly waypoints: readonly number[];
    /** Vrai si la destination finale est le sabot de sortie (`X_OFF` ou `O_OFF`). */
    readonly isBearOff: boolean;
    /** Décalage temporel initial (ms) pour échelonner une convergence à 2 pions (Make a Point). */
    readonly delayMs: number;
    /** Point (1..24) où un blot adverse a été frappé par ce déplacement. */
    readonly hitOpponentAt?: number;
}

function ownAt(board: ReadonlyArray<number>, point: number, player: Player): number {
    const val = board[point] ?? 0;
    if (player === 'X') return point === X_BAR || (point >= 1 && point <= 24) ? Math.max(0, val) : 0;
    return point === O_BAR || (point >= 1 && point <= 24) ? Math.max(0, -val) : 0;
}

function collectPlayerDiff(prev: ReadonlyArray<number>, next: ReadonlyArray<number>, player: Player) {
    const sources: number[] = [];
    const dests: { point: number; isBearOff: boolean }[] = [];
    const pointsToScan =
        player === 'X'
            ? [X_BAR, ...Array.from({ length: 24 }, (_, i) => i + 1)]
            : [...Array.from({ length: 24 }, (_, i) => i + 1), O_BAR];

    for (const pt of pointsToScan) {
        const before = ownAt(prev, pt, player);
        const after = ownAt(next, pt, player);
        if (before > after) {
            for (let i = 0; i < before - after; i++) sources.push(pt);
        } else if (after > before) {
            for (let i = 0; i < after - before; i++) dests.push({ point: pt, isBearOff: false });
        }
    }

    const offBefore = borneOffCount(prev as number[], player);
    const offAfter = borneOffCount(next as number[], player);
    if (offAfter > offBefore) {
        const offPt = player === 'X' ? X_OFF : O_OFF;
        for (let i = 0; i < offAfter - offBefore; i++) dests.push({ point: offPt, isBearOff: true });
    }
    return { sources, dests };
}

function inferCombinedWaypoints(
    from: number,
    to: number,
    player: Player,
    prevBoard: ReadonlyArray<number>,
    dice: readonly [number, number] | null | undefined,
    hitPoints: readonly number[],
): number[] {
    const intermediateHit = hitPoints.find((hp) => hp !== to && hp >= 1 && hp <= 24);
    if (intermediateHit !== undefined) return [from, intermediateHit, to];
    if (!dice) return [from, to];

    const startPip = from === X_BAR && player === 'X' ? 25 : from === O_BAR && player === 'O' ? 0 : from;
    const dist = player === 'X' ? startPip - to : to - startPip;
    if (dist <= 0) return [from, to];

    const [d1, d2] = dice;
    const dir = player === 'X' ? -1 : 1;
    const isLandingLegal = (pt: number): boolean => {
        if (pt < 1 || pt > 24) return false;
        const v = prevBoard[pt] ?? 0;
        return player === 'X' ? v >= -1 : v <= 1;
    };

    if (d1 !== d2 && dist === d1 + d2) {
        const midHigh = startPip + dir * Math.max(d1, d2);
        const midLow = startPip + dir * Math.min(d1, d2);
        if (isLandingLegal(midHigh)) return [from, midHigh, to];
        if (isLandingLegal(midLow)) return [from, midLow, to];
    } else if (d1 === d2 && dist > d1 && dist % d1 === 0) {
        const steps = dist / d1;
        if (steps >= 2 && steps <= 4) {
            const chain = [from];
            for (let s = 1; s < steps; s++) {
                const mid = startPip + dir * d1 * s;
                if (mid >= 1 && mid <= 24) chain.push(mid);
            }
            chain.push(to);
            return chain;
        }
    }
    return [from, to];
}

/**
 * Détecte de façon pure les déplacements de pions entre deux états consécutifs du plateau.
 * Ignore les réinitialisations complètes de partie (> 4 pions déplacés simultanément).
 */
export function detectBoardMoveDeltas(
    prevBoard: ReadonlyArray<number>,
    nextBoard: ReadonlyArray<number>,
    dice?: readonly [number, number] | null,
): DetectedMoveDelta[] {
    if (prevBoard.length < 26 || nextBoard.length < 26) return [];
    let anyDiff = false;
    for (let i = 0; i < 26; i++) {
        if (prevBoard[i] !== nextBoard[i]) {
            anyDiff = true;
            break;
        }
    }
    if (!anyDiff) return [];

    const diffX = collectPlayerDiff(prevBoard, nextBoard, 'X');
    const diffO = collectPlayerDiff(prevBoard, nextBoard, 'O');

    const xMoved =
        diffX.sources.length > 0 &&
        diffX.sources.length <= 4 &&
        diffX.sources.length === diffX.dests.length &&
        diffO.dests.every((d) => !d.isBearOff && d.point === O_BAR);

    const oMoved =
        diffO.sources.length > 0 &&
        diffO.sources.length <= 4 &&
        diffO.sources.length === diffO.dests.length &&
        diffX.dests.every((d) => !d.isBearOff && d.point === X_BAR);

    if (!xMoved && !oMoved) return [];

    const mover: Player = xMoved ? 'X' : 'O';
    const { sources, dests } = xMoved ? diffX : diffO;
    const oppDiff = xMoved ? diffO : diffX;
    const hitPoints = oppDiff.sources.filter((pt) => pt >= 1 && pt <= 24);

    const sortedSources = [...sources].sort((a, b) =>
        mover === 'X' ? (b === X_BAR ? 25 : b) - (a === X_BAR ? 25 : a) : a - b,
    );
    const sortedDests = [...dests].sort((a, b) => {
        const pa = a.isBearOff ? (mover === 'X' ? 0 : 25) : a.point;
        const pb = b.isBearOff ? (mover === 'X' ? 0 : 25) : b.point;
        return mover === 'X' ? pb - pa : pa - pb;
    });

    const usedHits = new Set<number>();
    return sortedSources.map((from, idx) => {
        const target = sortedDests[idx];
        const waypoints = target.isBearOff
            ? [from, target.point]
            : sortedSources.length === 1
              ? inferCombinedWaypoints(from, target.point, mover, prevBoard, dice, hitPoints)
              : [from, target.point];

        let hitOpponentAt: number | undefined;
        for (const wp of waypoints.slice(1)) {
            if (!target.isBearOff && hitPoints.includes(wp) && !usedHits.has(wp)) {
                hitOpponentAt = wp;
                usedHits.add(wp);
                break;
            }
        }

        return {
            player: mover,
            waypoints,
            isBearOff: target.isBearOff,
            delayMs: idx * CONVERGENCE_STAGGER_MS,
            hitOpponentAt,
        };
    });
}

function queryPointElement(
    point: number,
    kind: 'point' | 'bar' | 'off',
    containerEl: HTMLElement | null,
): HTMLElement | null {
    const root: ParentNode | null = containerEl ?? (typeof document !== 'undefined' ? document : null);
    if (!root) return null;
    if (kind === 'off') {
        return root.querySelector(`[data-off-tray="${point}"]`) as HTMLElement | null;
    }
    if (kind === 'bar') {
        return (
            (root.querySelector(`[data-testid="bar-section-${point}"] [data-checker-top="true"]`) as HTMLElement | null) ??
            (root.querySelector(`[data-testid="bar-section-${point}"]`) as HTMLElement | null)
        );
    }
    return (
        (root.querySelector(`[data-testid="point-stack-${point}"] [data-checker-top="true"]`) as HTMLElement | null) ??
        (root.querySelector(`[data-point="${point}"]:not([data-off-tray])`) as HTMLElement | null)
    );
}

function resolveCoordinate(
    point: number,
    kind: 'point' | 'bar' | 'off',
    stackIndex: number,
    containerEl: HTMLElement | null,
    orientation: BoardOrientation,
    capturedFirstRect?: RectLike | null,
): { pos: Vec2; diameter: number; rect: RectLike; element: HTMLElement | null } {
    const { top: topRow } = getOrientedRows(orientation);
    const clampedSlot = Math.min(MAX_VISIBLE - 1, Math.max(0, stackIndex));
    const targetEl = queryPointElement(point, kind, containerEl);

    if (containerEl && typeof document !== 'undefined') {
        const boardRect = containerEl.getBoundingClientRect();
        if (boardRect.width > 0 && boardRect.height > 0 && targetEl) {
            const rawRect = capturedFirstRect ?? targetEl.getBoundingClientRect();
            const width = rawRect.width ?? CHECKER_D;
            const height = rawRect.height ?? CHECKER_D;
            if (width > 0 && height > 0) {
                const diameter = Math.min(46, Math.max(18, width * 0.78));
                const cx = rawRect.left - boardRect.left + width / 2;
                if (kind === 'off' || kind === 'bar' || targetEl.hasAttribute('data-checker-top')) {
                    const cy = rawRect.top - boardRect.top + height / 2;
                    return { pos: { x: cx, y: cy }, diameter, rect: rawRect, element: targetEl };
                }
                const isTop = topRow.includes(point);
                const step = diameter * 0.85;
                const cy = isTop
                    ? rawRect.top - boardRect.top + (clampedSlot + 0.5) * step
                    : rawRect.top + height - boardRect.top - (clampedSlot + 0.5) * step;
                return { pos: { x: cx, y: cy }, diameter, rect: { left: cx, top: cy, width: diameter, height: diameter }, element: targetEl };
            }
        }
    }

    const layout = pointLayout(point, orientation, kind === 'off');
    const x = layout.x + POINT_W / 2;
    const y = layout.top
        ? TOP_BASE + (clampedSlot + 0.5) * CHECKER_D
        : BOT_BASE - (clampedSlot + 0.5) * CHECKER_D;
    const fallbackRect: RectLike = capturedFirstRect ?? { left: x, top: y, width: CHECKER_D, height: CHECKER_D };
    return { pos: { x, y }, diameter: CHECKER_D, rect: fallbackRect, element: targetEl };
}

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
            const spawned: FlightSpec[] = [];

            for (const delta of deltas) {
                flightSeqRef.current += 1;
                const id = `flight-${flightSeqRef.current}`;
                const moverColor: 'white' | 'black' = (delta.player === 'X') !== swapColors ? 'white' : 'black';
                const isHitMove = delta.hitOpponentAt !== undefined;
                const isCombinedLeap = delta.waypoints.length > 2;

                const vecWaypoints: Vec2[] = [];
                const domElements: (HTMLElement | null)[] = [];
                const stepRects: RectLike[] = [];
                let diameter = CHECKER_D;

                delta.waypoints.forEach((pt, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === delta.waypoints.length - 1;
                    const kind: 'point' | 'bar' | 'off' =
                        isLast && delta.isBearOff
                            ? 'off'
                            : isFirst && (pt === X_BAR || pt === O_BAR)
                              ? 'bar'
                              : 'point';
                    const stackCount = isFirst
                        ? Math.max(0, ownAt(prevBoard, pt, delta.player) - 1)
                        : isLast && !delta.isBearOff
                          ? Math.max(0, ownAt(board, pt, delta.player) - 1)
                          : 0;
                    const capturedFirst = isFirst ? (firstRectsRef.current.get(pt) ?? null) : null;
                    const resolved = resolveCoordinate(pt, kind, stackCount, containerEl, orientation, capturedFirst);
                    vecWaypoints.push(resolved.pos);
                    domElements.push(resolved.element);
                    stepRects.push(resolved.rect);
                    diameter = resolved.diameter;
                });

                const segmentDurationsMs: number[] = [];
                let longestSeg = 0;
                for (let i = 0; i < vecWaypoints.length - 1; i++) {
                    const a = vecWaypoints[i];
                    const b = vecWaypoints[i + 1];
                    const invert = computeFlipInvertVector(
                        stepRects[i] ?? { left: a.x, top: a.y },
                        stepRects[i + 1] ?? { left: b.x, top: b.y },
                    );
                    const distPx = invert.distPx > 0 ? invert.distPx : distance(a, b);
                    if (distPx > longestSeg) longestSeg = distPx;

                    const isLastBearOff = delta.isBearOff && i === vecWaypoints.length - 2;
                    let segMs: number;
                    if (isLastBearOff) {
                        segMs = Math.max(40, Math.round(BEAR_OFF_DURATION_MS * speedFactor));
                    } else if (isHitMove && i === vecWaypoints.length - 2) {
                        segMs = computeHitAttackerDurationPx(distPx, speedFactor);
                    } else {
                        segMs = computeNormalFlightDurationPx(distPx, speedFactor);
                    }
                    // Saut combiné (d1+d2) : 1er saut contracté de 15 % (duration * 0.85)
                    if (isCombinedLeap && i === 0) {
                        segMs = computeContractedFirstHopMs(segMs);
                    }
                    segmentDurationsMs.push(segMs);
                }

                const touchdownMs = isCombinedLeap ? INTERMEDIATE_TOUCH_PAUSE_MS : 0;
                const arrivalPoint = delta.isBearOff
                    ? delta.player === 'X'
                        ? X_OFF
                        : O_OFF
                    : delta.waypoints[delta.waypoints.length - 1];

                const easing = delta.isBearOff
                    ? BEAR_OFF_EASING
                    : isHitMove
                      ? HIT_ATTACKER_EASING
                      : NORMAL_FLIGHT_EASING;
                const peakScale = isHitMove ? HIT_ATTACKER_SCALE : NORMAL_APEX_SCALE;

                const moverSpec: FlightSpec = {
                    id,
                    color: moverColor,
                    waypoints: vecWaypoints,
                    segmentDurationsMs,
                    touchdownMs,
                    delayMs: delta.delayMs,
                    easing,
                    arcHeight: computeArcHeight(longestSeg, diameter),
                    peakScale,
                    apexOffsetRatio: NORMAL_APEX_OFFSET,
                    apexDropShadow: NORMAL_APEX_DROP_SHADOW,
                    endScaleY: delta.isBearOff ? BEAR_OFF_END_SCALE_Y : undefined,
                    arrivalPoint,
                };
                spawned.push(moverSpec);

                // PLAY FLIP WAAPI direct sur l'élément d'arrivée si disponible
                const lastEl = domElements[domElements.length - 1];
                const firstRect = stepRects[0];
                const lastRect = stepRects[stepRects.length - 1];
                if (lastEl && typeof lastEl.animate === 'function' && firstRect && lastRect) {
                    const inv = computeFlipInvertVector(firstRect, lastRect);
                    const flipFrames = buildFlipElementKeyframes({
                        dx: inv.dx !== 0 ? inv.dx : vecWaypoints[0].x - vecWaypoints[vecWaypoints.length - 1].x,
                        dy: inv.dy !== 0 ? inv.dy : vecWaypoints[0].y - vecWaypoints[vecWaypoints.length - 1].y,
                        isHit: isHitMove,
                        isBearOff: delta.isBearOff,
                    });
                    try {
                        lastEl.animate(flipFrames, {
                            duration: getFlightTotalMs(moverSpec),
                            delay: delta.delayMs,
                            easing,
                            fill: 'both',
                        });
                    } catch {
                        // Environnement sans moteur WAAPI complet
                    }
                }

                if (delta.hitOpponentAt !== undefined) {
                    flightSeqRef.current += 1;
                    const hitId = `flight-hit-${flightSeqRef.current}`;
                    const victimColor: 'white' | 'black' = moverColor === 'white' ? 'black' : 'white';
                    const oppBar = delta.player === 'X' ? O_BAR : X_BAR;
                    const fromHit = resolveCoordinate(delta.hitOpponentAt, 'point', 0, containerEl, orientation);
                    const toBar = resolveCoordinate(oppBar, 'bar', 0, containerEl, orientation);
                    const hitDist = distance(fromHit.pos, toBar.pos);
                    const attackerTotalMs = getFlightTotalMs(moverSpec);
                    const hitSpec: FlightSpec = {
                        id: hitId,
                        color: victimColor,
                        waypoints: [fromHit.pos, toBar.pos],
                        segmentDurationsMs: [Math.max(50, Math.round(HIT_TO_BAR_DURATION_MS * speedFactor))],
                        touchdownMs: 0,
                        delayMs: delta.delayMs + computeHitEjectDelayMs(attackerTotalMs),
                        easing: HIT_TO_BAR_EASING,
                        arcHeight: computeArcHeight(hitDist, fromHit.diameter),
                        peakScale: NORMAL_APEX_SCALE,
                        apexOffsetRatio: NORMAL_APEX_OFFSET,
                        apexDropShadow: NORMAL_APEX_DROP_SHADOW,
                        arrivalPoint: delta.player === 'X' ? HIDDEN_O_BAR_KEY : HIDDEN_X_BAR_KEY,
                    };
                    spawned.push(hitSpec);
                }
            }

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
