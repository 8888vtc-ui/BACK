import type React from 'react';
import type { MutableRefObject } from 'react';
import { toPointerKind } from '../../lib/gameFeel/pointerGestureMachine';
import {
    getBiomechanicalDragThresholdPx,
    resolveMagneticTarget,
    SNAP_RADIUS_PX,
    SNAP_HYSTERESIS_PX,
    MAGNETIC_ATTRACTION_STRENGTH,
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
    TAP_MAX_DURATION_MS,
} from './checkerSnappingPhysics';
import {
    INITIAL_DRAG_STATE,
    type DragState,
    type MutableDragSession,
    type UseCheckerDragAndDropParams,
} from './checkerDragTypes';
import { getLegalTargetRects } from './checkerTargetHitbox';

export interface DragGestureContext {
    sessionRef: MutableRefObject<MutableDragSession>;
    overlayRef: MutableRefObject<HTMLDivElement | null>;
    setDragState: (state: DragState | ((prev: DragState) => DragState)) => void;
    cancelPendingRaf: () => void;
    clearReturnTimer: () => void;
    scheduleOverlayRaf: () => void;
    returnTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
    params: UseCheckerDragAndDropParams;
}

export function processPointerMove(
    e: React.PointerEvent,
    ctx: DragGestureContext,
): void {
    const s = ctx.sessionRef.current;
    if (s.pointerId !== e.pointerId || s.fromPoint === null) return;

    const { config, legalDestinations, resolveLegalDestinations, onDragStart } = ctx.params;
    const kind = e.pointerType ? toPointerKind(e.pointerType) : s.pointerKind;
    const threshold = config?.dragThreshold ?? getBiomechanicalDragThresholdPx(kind);
    const dist = Math.hypot(e.clientX - s.originX, e.clientY - s.originY);

    if (!s.isDragging && dist < threshold) return;

    const justStartedDragging = !s.isDragging;
    if (justStartedDragging) {
        s.isDragging = true;
        s.legalSet = resolveLegalDestinations ? resolveLegalDestinations(s.fromPoint) : legalDestinations;
        onDragStart?.(s.fromPoint);
        s.cachedRects = getLegalTargetRects(s.legalSet, config?.minHitboxSize);
    }

    const legalRects = s.cachedRects ?? getLegalTargetRects(s.legalSet, config?.minHitboxSize);
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

    ctx.scheduleOverlayRaf();

    if (justStartedDragging) {
        ctx.setDragState({
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
}

export function processFinishGesture(
    e: React.PointerEvent,
    isCancel: boolean,
    ctx: DragGestureContext,
): void {
    const s = ctx.sessionRef.current;
    if (s.pointerId !== e.pointerId) return;
    ctx.cancelPendingRaf();
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

    const { onDropMove, onCancelDrag, onTapPoint } = ctx.params;

    if (wasDragging) {
        if (!isCancel && fromPoint !== null && snappedTarget !== null && legalSet.has(snappedTarget)) {
            ctx.setDragState(INITIAL_DRAG_STATE);
            onDropMove(fromPoint, snappedTarget);
        } else {
            ctx.clearReturnTimer();
            ctx.setDragState({
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
            ctx.returnTimerRef.current = setTimeout(() => {
                ctx.returnTimerRef.current = null;
                ctx.setDragState(INITIAL_DRAG_STATE);
            }, ELASTIC_RETURN_DURATION_MS);
            onCancelDrag?.();
        }
    } else if (!isCancel && fromPoint !== null) {
        const upTime = typeof e.timeStamp === 'number' && e.timeStamp > 0 ? e.timeStamp : downTimeMs;
        if (upTime - downTimeMs <= TAP_MAX_DURATION_MS) {
            onTapPoint?.(fromPoint);
        }
    }
}
