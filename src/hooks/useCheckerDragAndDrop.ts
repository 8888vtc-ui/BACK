'use client';

/**
 * Machine à états Drag & Drop "Zéro Re-Render" (Chantier 2 — Pointer Events + rAF + GPU).
 *
 * Spécifications techniques :
 *   - Élimination stricte des re-renders React en cours de mouvement : écriture directe
 *     dans `sessionRef` (`useRef` muable) et coalescence via `requestAnimationFrame`.
 *   - Injection directe des variables CSS `--drag-x` et `--drag-y` + `transform` GPU sur
 *     le nœud DOM de l'overlay (`element.style.setProperty('--drag-x', ...)`).
 *   - Capture matérielle impérative : `setPointerCapture` sur `pointerdown` et
 *     `releasePointerCapture` sur `pointerup` / `pointercancel`.
 *   - Seuils biomécaniques différenciés : souris = 5 px, tactile = 12 px, tap max = 220 ms.
 *   - Magnétisme et hystérésis : `SNAP_RADIUS_PX = 36 px`, `SNAP_HYSTERESIS_PX = 44 px`.
 *   - Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ensureMinimumHitbox,
    isPointInsideRect,
    MIN_HITBOX_SIZE,
    type PointRect,
    type SnappingConfig,
} from '../lib/board/snappingPhysics';
import { toPointerKind, type PointerKind } from '../lib/gameFeel/pointerGestureMachine';
import { formatTranslate3d } from '../lib/board/gpuAnimation';

/** Seuil de déclenchement du drag à la souris / trackpad (5 px). */
export const MOUSE_DRAG_THRESHOLD_PX = 5;
/** Seuil de déclenchement du drag au stylet (6 px). */
export const PEN_DRAG_THRESHOLD_PX = 6;
/** Seuil de déclenchement du drag sur écran tactile (12 px). */
export const TOUCH_DRAG_THRESHOLD_PX = 12;
/** Durée maximale d'un tap franc (220 ms). */
export const TAP_MAX_DURATION_MS = 220;
/** Rayon d'attraction magnétique autour de l'axe de la flèche légale (36 px). */
export const SNAP_RADIUS_PX = 36;
/** Hystérésis de décrochage une fois la flèche accrochée (44 px). */
export const SNAP_HYSTERESIS_PX = 44;
/** Durée du retour élastique lors d'un lâcher hors-zone (ms). */
export const ELASTIC_RETURN_DURATION_MS = 150;
/** Courbe d'accélération du retour élastique hors-zone. */
export const ELASTIC_RETURN_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
/** Force d'attraction magnétique visuelle vers le centre de la flèche aimantée (0..1). */
export const MAGNETIC_ATTRACTION_STRENGTH = 0.26;

export function getBiomechanicalDragThresholdPx(pointerType?: string | null): number {
    const kind = toPointerKind(pointerType);
    if (kind === 'touch') return TOUCH_DRAG_THRESHOLD_PX;
    if (kind === 'pen') return PEN_DRAG_THRESHOLD_PX;
    return MOUSE_DRAG_THRESHOLD_PX;
}

export interface MagneticSnapEval {
    readonly targetPoint: number | null;
    readonly isDirectHit: boolean;
    readonly axisDistance: number;
    readonly snapCenter: { readonly x: number; readonly y: number } | null;
}

/**
 * Évalue le magnétisme autour de l'axe de chaque flèche légale avec hystérésis :
 * - Accrochage initial si distance à l'axe <= `snapRadiusPx` (36 px)
 * - Maintien de la cible accrochée tant que distance à l'axe <= `hysteresisPx` (44 px)
 */
export function resolveMagneticTarget(
    pointerX: number,
    pointerY: number,
    legalRects: ReadonlyArray<PointRect>,
    currentSnappedPoint: number | null,
    snapRadiusPx: number = SNAP_RADIUS_PX,
    hysteresisPx: number = SNAP_HYSTERESIS_PX,
): MagneticSnapEval {
    if (legalRects.length === 0) {
        return { targetPoint: null, isDirectHit: false, axisDistance: Infinity, snapCenter: null };
    }

    const hysteresisBonus = Math.max(0, hysteresisPx - snapRadiusPx);
    let bestRect: PointRect | null = null;
    let bestEffectiveDist = Infinity;
    let bestRawDist = Infinity;
    let bestDirect = false;

    for (const rect of legalRects) {
        const clampedY = Math.min(rect.bottom, Math.max(rect.top, pointerY));
        const axisDist = Math.hypot(pointerX - rect.centerX, pointerY - clampedY);
        const direct = isPointInsideRect(pointerX, pointerY, rect);
        const isCurrent = currentSnappedPoint === rect.pointNumber;
        const maxAllowed = isCurrent ? hysteresisPx : snapRadiusPx;

        if (axisDist <= maxAllowed || direct) {
            const effectiveDist = isCurrent ? Math.max(0, axisDist - hysteresisBonus) : axisDist;
            if (effectiveDist < bestEffectiveDist) {
                bestEffectiveDist = effectiveDist;
                bestRawDist = axisDist;
                bestRect = rect;
                bestDirect = direct;
            }
        }
    }

    if (!bestRect) {
        return { targetPoint: null, isDirectHit: false, axisDistance: Infinity, snapCenter: null };
    }

    return {
        targetPoint: bestRect.pointNumber,
        isDirectHit: bestDirect,
        axisDistance: bestRawDist,
        snapCenter: { x: bestRect.centerX, y: bestRect.centerY },
    };
}

export interface DragState {
    isDragging: boolean;
    isReturning: boolean;
    fromPoint: number | null;
    checkerColor: 'white' | 'black' | null;
    originX: number;
    originY: number;
    currentX: number;
    currentY: number;
    snappedTarget: number | null;
    isDirectHit: boolean;
    returnDurationMs: number;
    returnEasing: string;
}

export interface UseCheckerDragAndDropParams {
    legalDestinations: ReadonlySet<number>;
    resolveLegalDestinations?: (fromPoint: number) => ReadonlySet<number>;
    onDragStart?: (fromPoint: number) => void;
    onDropMove: (fromPoint: number, toPoint: number) => void;
    onTapPoint?: (pointNumber: number) => void;
    onCancelDrag?: () => void;
    config?: Partial<SnappingConfig>;
}

export interface UseCheckerDragAndDropResult {
    dragState: DragState;
    overlayRef: React.RefObject<HTMLDivElement | null>;
    handlePointerDown: (pointNumber: number, color: 'white' | 'black', e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (e: React.PointerEvent) => void;
    handlePointerCancel: (e: React.PointerEvent) => void;
}

interface MutableDragSession {
    pointerId: number | null;
    pointerKind: PointerKind;
    fromPoint: number | null;
    checkerColor: 'white' | 'black' | null;
    originX: number;
    originY: number;
    currentX: number;
    currentY: number;
    drawX: number;
    drawY: number;
    downTimeMs: number;
    isDragging: boolean;
    snappedTarget: number | null;
    isDirectHit: boolean;
    legalSet: ReadonlySet<number>;
    cachedRects: PointRect[] | null;
}

const INITIAL_DRAG_STATE: DragState = {
    isDragging: false,
    isReturning: false,
    fromPoint: null,
    checkerColor: null,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    snappedTarget: null,
    isDirectHit: false,
    returnDurationMs: ELASTIC_RETURN_DURATION_MS,
    returnEasing: ELASTIC_RETURN_EASING,
};

export function useCheckerDragAndDrop({
    legalDestinations,
    resolveLegalDestinations,
    onDragStart,
    onDropMove,
    onTapPoint,
    onCancelDrag,
    config,
}: UseCheckerDragAndDropParams): UseCheckerDragAndDropResult {
    const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);
    const overlayRef = useRef<HTMLDivElement | null>(null);
    const rafIdRef = useRef<number | null>(null);
    const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionRef = useRef<MutableDragSession>({
        pointerId: null,
        pointerKind: 'mouse',
        fromPoint: null,
        checkerColor: null,
        originX: 0,
        originY: 0,
        currentX: 0,
        currentY: 0,
        drawX: 0,
        drawY: 0,
        downTimeMs: 0,
        isDragging: false,
        snappedTarget: null,
        isDirectHit: false,
        legalSet: legalDestinations,
        cachedRects: null,
    });
    sessionRef.current.legalSet = legalDestinations;

    const cancelPendingRaf = useCallback(() => {
        if (rafIdRef.current !== null && typeof cancelAnimationFrame === 'function') {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
    }, []);

    const clearReturnTimer = useCallback(() => {
        if (returnTimerRef.current !== null) {
            clearTimeout(returnTimerRef.current);
            returnTimerRef.current = null;
        }
    }, []);

    useEffect(() => () => {
        cancelPendingRaf();
        clearReturnTimer();
    }, [cancelPendingRaf, clearReturnTimer]);

    const flushOverlayGpuDom = useCallback(() => {
        const el = overlayRef.current;
        if (!el) return;
        const s = sessionRef.current;
        const isSnapped = s.snappedTarget !== null;
        const scale = isSnapped ? 1.2 : 1.15;
        el.style.setProperty('--drag-x', `${s.drawX}px`);
        el.style.setProperty('--drag-y', `${s.drawY}px`);
        el.style.transform = formatTranslate3d(s.drawX, s.drawY, scale, true);
        el.setAttribute('data-snapped-target', s.snappedTarget !== null ? String(s.snappedTarget) : '');
    }, []);

    const scheduleOverlayRaf = useCallback(() => {
        flushOverlayGpuDom();
        if (typeof requestAnimationFrame !== 'function' || rafIdRef.current !== null) return;
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            if (!sessionRef.current.isDragging) return;
            flushOverlayGpuDom();
        });
    }, [flushOverlayGpuDom]);

    const getLegalTargetRects = useCallback(
        (targetSet: ReadonlySet<number>): PointRect[] => {
            if (typeof document === 'undefined') return [];
            const rects: PointRect[] = [];
            const minHitbox = config?.minHitboxSize ?? MIN_HITBOX_SIZE;
            targetSet.forEach((pt) => {
                const touchZone = document.querySelector(`[data-testid="point-touch-zone-${pt}"]`);
                const pointEl = document.querySelector(`[data-point="${pt}"], [data-off-tray="${pt}"]`);
                const el = touchZone ?? pointEl;
                if (el) {
                    const domRect = el.getBoundingClientRect();
                    const r = domRect.width === 0 && domRect.height === 0 && pointEl && pointEl !== el
                        ? pointEl.getBoundingClientRect()
                        : domRect;
                    rects.push(
                        ensureMinimumHitbox(
                            {
                                pointNumber: pt,
                                left: r.left,
                                top: r.top,
                                right: r.right,
                                bottom: r.bottom,
                                centerX: r.left + r.width / 2,
                                centerY: r.top + r.height / 2,
                            },
                            minHitbox,
                        ),
                    );
                }
            });
            return rects;
        },
        [config?.minHitboxSize],
    );

    const handlePointerDown = useCallback(
        (pointNumber: number, color: 'white' | 'black', e: React.PointerEvent) => {
            if (e.button !== 0) return;
            cancelPendingRaf();
            clearReturnTimer();
            try {
                (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
            } catch {
                // Capture non disponible sur certaines cibles synthétiques
            }
            const now = typeof e.timeStamp === 'number' && e.timeStamp > 0 ? e.timeStamp : Date.now();
            const s = sessionRef.current;
            s.pointerId = e.pointerId;
            s.pointerKind = toPointerKind(e.pointerType);
            s.fromPoint = pointNumber;
            s.checkerColor = color;
            s.originX = e.clientX;
            s.originY = e.clientY;
            s.currentX = e.clientX;
            s.currentY = e.clientY;
            s.drawX = e.clientX;
            s.drawY = e.clientY;
            s.downTimeMs = now;
            s.isDragging = false;
            s.snappedTarget = null;
            s.isDirectHit = false;
            s.cachedRects = null;
        },
        [cancelPendingRaf, clearReturnTimer],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            const s = sessionRef.current;
            if (s.pointerId !== e.pointerId || s.fromPoint === null) return;

            const kind = e.pointerType ? toPointerKind(e.pointerType) : s.pointerKind;
            const threshold = config?.dragThreshold ?? getBiomechanicalDragThresholdPx(kind);
            const dist = Math.hypot(e.clientX - s.originX, e.clientY - s.originY);

            if (!s.isDragging && dist < threshold) return;

            const justStartedDragging = !s.isDragging;
            if (justStartedDragging) {
                s.isDragging = true;
                s.legalSet = resolveLegalDestinations ? resolveLegalDestinations(s.fromPoint) : legalDestinations;
                onDragStart?.(s.fromPoint);
                s.cachedRects = getLegalTargetRects(s.legalSet);
            }

            const legalRects = s.cachedRects ?? getLegalTargetRects(s.legalSet);
            const snapRadius = config?.maxSnapDistance ?? SNAP_RADIUS_PX;
            const hysteresis = config?.hysteresisMargin ?? Math.max(SNAP_HYSTERESIS_PX, snapRadius);
            const snap = resolveMagneticTarget(e.clientX, e.clientY, legalRects, s.snappedTarget, snapRadius, hysteresis);

            s.currentX = e.clientX;
            s.currentY = e.clientY;
            s.snappedTarget = snap.targetPoint;
            s.isDirectHit = snap.isDirectHit;
            s.drawX = snap.snapCenter
                ? e.clientX + (snap.snapCenter.x - e.clientX) * MAGNETIC_ATTRACTION_STRENGTH
                : e.clientX;
            s.drawY = snap.snapCenter
                ? e.clientY + (snap.snapCenter.y - e.clientY) * MAGNETIC_ATTRACTION_STRENGTH
                : e.clientY;

            scheduleOverlayRaf();

            // ZÉRO setDragState pendant le mouvement continu : uniquement au franchissement initial du seuil
            if (justStartedDragging) {
                setDragState({
                    isDragging: true,
                    isReturning: false,
                    fromPoint: s.fromPoint,
                    checkerColor: s.checkerColor,
                    originX: s.originX,
                    originY: s.originY,
                    currentX: s.currentX,
                    currentY: s.currentY,
                    snappedTarget: s.snappedTarget,
                    isDirectHit: s.isDirectHit,
                    returnDurationMs: ELASTIC_RETURN_DURATION_MS,
                    returnEasing: ELASTIC_RETURN_EASING,
                });
            }
        },
        [config, getLegalTargetRects, legalDestinations, onDragStart, resolveLegalDestinations, scheduleOverlayRaf],
    );

    const finishGesture = useCallback(
        (e: React.PointerEvent, isCancel: boolean) => {
            const s = sessionRef.current;
            if (s.pointerId !== e.pointerId) return;
            cancelPendingRaf();
            try {
                (e.currentTarget as HTMLElement | null)?.releasePointerCapture?.(e.pointerId);
            } catch {
                // Ignore
            }
            const { fromPoint, checkerColor, originX, originY, isDragging: wasDragging, snappedTarget, legalSet, downTimeMs } = s;
            s.pointerId = null;
            s.fromPoint = null;
            s.checkerColor = null;
            s.isDragging = false;
            s.snappedTarget = null;
            s.isDirectHit = false;
            s.cachedRects = null;

            if (wasDragging) {
                if (!isCancel && fromPoint !== null && snappedTarget !== null && legalSet.has(snappedTarget)) {
                    setDragState(INITIAL_DRAG_STATE);
                    onDropMove(fromPoint, snappedTarget);
                } else {
                    clearReturnTimer();
                    setDragState({
                        isDragging: false,
                        isReturning: true,
                        fromPoint,
                        checkerColor,
                        originX,
                        originY,
                        currentX: originX,
                        currentY: originY,
                        snappedTarget: null,
                        isDirectHit: false,
                        returnDurationMs: ELASTIC_RETURN_DURATION_MS,
                        returnEasing: ELASTIC_RETURN_EASING,
                    });
                    returnTimerRef.current = setTimeout(() => {
                        returnTimerRef.current = null;
                        setDragState(INITIAL_DRAG_STATE);
                    }, ELASTIC_RETURN_DURATION_MS);
                    onCancelDrag?.();
                }
            } else if (!isCancel && fromPoint !== null) {
                const upTime = typeof e.timeStamp === 'number' && e.timeStamp > 0 ? e.timeStamp : downTimeMs;
                if (upTime - downTimeMs <= TAP_MAX_DURATION_MS) {
                    onTapPoint?.(fromPoint);
                }
            }
        },
        [cancelPendingRaf, clearReturnTimer, onCancelDrag, onDropMove, onTapPoint],
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => finishGesture(e, false), [finishGesture]);
    const handlePointerCancel = useCallback((e: React.PointerEvent) => finishGesture(e, true), [finishGesture]);

    const exposedDragState = useMemo<DragState>(() => {
        if (!dragState.isDragging) return dragState;
        return {
            ...dragState,
            get currentX() { return sessionRef.current.currentX; },
            get currentY() { return sessionRef.current.currentY; },
            get snappedTarget() { return sessionRef.current.snappedTarget; },
            get isDirectHit() { return sessionRef.current.isDirectHit; },
        };
    }, [dragState]);

    return {
        dragState: exposedDragState,
        overlayRef,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
    };
}
