'use client';

/**
 * Machine à états Drag & Drop "Zéro Re-Render" (Chantier 2 — Pointer Events + rAF + GPU).
 *
 * Découpé selon la doctrine atomique et budgets R1 (SCALABILITY.md, <= 200 lignes).
 * Strictement 0 `any`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPointerKind } from '../lib/gameFeel/pointerGestureMachine';
import { formatTranslate3d } from '../lib/board/gpuAnimation';
import {
    MOUSE_DRAG_THRESHOLD_PX,
    PEN_DRAG_THRESHOLD_PX,
    TOUCH_DRAG_THRESHOLD_PX,
    TAP_MAX_DURATION_MS,
    SNAP_RADIUS_PX,
    SNAP_HYSTERESIS_PX,
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
    MAGNETIC_ATTRACTION_STRENGTH,
    getBiomechanicalDragThresholdPx,
    resolveMagneticTarget,
    type MagneticSnapEval,
} from './dnd/checkerSnappingPhysics';
import {
    INITIAL_DRAG_STATE,
    type DragState,
    type UseCheckerDragAndDropParams,
    type UseCheckerDragAndDropResult,
    type MutableDragSession,
} from './dnd/checkerDragTypes';
import { processPointerMove, processFinishGesture, type DragGestureContext } from './dnd/checkerGestureHandlers';

export {
    MOUSE_DRAG_THRESHOLD_PX,
    PEN_DRAG_THRESHOLD_PX,
    TOUCH_DRAG_THRESHOLD_PX,
    TAP_MAX_DURATION_MS,
    SNAP_RADIUS_PX,
    SNAP_HYSTERESIS_PX,
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
    MAGNETIC_ATTRACTION_STRENGTH,
    getBiomechanicalDragThresholdPx,
    resolveMagneticTarget,
};
export type { MagneticSnapEval, DragState, UseCheckerDragAndDropParams, UseCheckerDragAndDropResult };

export function useCheckerDragAndDrop(params: UseCheckerDragAndDropParams): UseCheckerDragAndDropResult {
    const { legalDestinations } = params;
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

    const gestureCtx: DragGestureContext = useMemo(
        () => ({
            sessionRef,
            overlayRef,
            setDragState,
            cancelPendingRaf,
            clearReturnTimer,
            scheduleOverlayRaf,
            returnTimerRef,
            params,
        }),
        [cancelPendingRaf, clearReturnTimer, scheduleOverlayRaf, params],
    );

    const handlePointerDown = useCallback(
        (pointNumber: number, color: 'white' | 'black', e: React.PointerEvent) => {
            if (e.button !== 0) return;
            cancelPendingRaf();
            clearReturnTimer();
            try {
                (e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
            } catch {
                // Ignore
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
        (e: React.PointerEvent) => processPointerMove(e, gestureCtx),
        [gestureCtx],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => processFinishGesture(e, false, gestureCtx),
        [gestureCtx],
    );

    const handlePointerCancel = useCallback(
        (e: React.PointerEvent) => processFinishGesture(e, true, gestureCtx),
        [gestureCtx],
    );

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
