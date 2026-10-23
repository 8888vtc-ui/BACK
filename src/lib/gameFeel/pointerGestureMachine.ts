/**
 * Machine à états Pointer Events unifiée souris / stylet / tactile (Game Feel Spec §1.3).
 *
 * Réducteur pur : aucun DOM, aucun React. Le hook appelant stocke l'état dans une ref
 * (0 rendu entre pointerdown et pointerup) et applique les intentions produites.
 */

export type PointerKind = 'mouse' | 'pen' | 'touch';

/** 4 px = seuil de drag système Windows ; 10 px ≈ « touch slop » Android / iOS. */
export const DRAG_DISTANCE_THRESHOLD_PX: Readonly<Record<PointerKind, number>> = Object.freeze({ mouse: 4, pen: 6, touch: 10 });
/** À la souris, seule la distance compte : pas de durée maximale de clic. */
export const TAP_MAX_DURATION_MS: Readonly<Record<PointerKind, number>> = Object.freeze({
    mouse: Number.POSITIVE_INFINITY,
    pen: 450,
    touch: 450,
});
/** Appui long tactile = équivalent clic droit (autre dé). */
export const LONG_PRESS_MS = 450;
export const LONG_PRESS_MOVE_TOLERANCE_PX = 8;
export const SNAP_HYSTERESIS_PX: Readonly<Record<PointerKind, number>> = Object.freeze({ mouse: 10, pen: 12, touch: 18 });
export const SNAP_RADIUS_FACTOR = 0.85;
export const SNAP_RADIUS_MIN_PX = 28;
export const SNAP_RADIUS_MAX_PX = 72;
export const HOVER_INTENT_MS = 50;

export function toPointerKind(pointerType: string | undefined | null): PointerKind {
    if (pointerType === 'touch') return 'touch';
    if (pointerType === 'pen') return 'pen';
    return 'mouse';
}

export function getDragThresholdPx(pointerType: string | undefined | null): number {
    return DRAG_DISTANCE_THRESHOLD_PX[toPointerKind(pointerType)];
}

export function getSnapHysteresisPx(pointerType: string | undefined | null): number {
    return SNAP_HYSTERESIS_PX[toPointerKind(pointerType)];
}

export function computeSnapRadiusPx(pointWidthPx: number): number {
    return Math.min(SNAP_RADIUS_MAX_PX, Math.max(SNAP_RADIUS_MIN_PX, pointWidthPx * SNAP_RADIUS_FACTOR));
}

export type GestureState =
    | { readonly tag: 'idle' }
    | {
          readonly tag: 'pressed';
          readonly pointerId: number;
          readonly kind: PointerKind;
          readonly secondary: boolean;
          readonly target: number;
          readonly x0: number;
          readonly y0: number;
          readonly t0: number;
      }
    | { readonly tag: 'longPressed'; readonly pointerId: number; readonly target: number }
    | {
          readonly tag: 'dragging';
          readonly pointerId: number;
          readonly kind: PointerKind;
          readonly target: number;
          readonly x0: number;
          readonly y0: number;
      };

export type GestureEvent =
    | {
          readonly type: 'down';
          readonly pointerId: number;
          readonly kind: PointerKind;
          readonly button: number;
          readonly ctrlKey: boolean;
          readonly isMac: boolean;
          readonly target: number | null;
          readonly x: number;
          readonly y: number;
          readonly t: number;
      }
    | { readonly type: 'move'; readonly pointerId: number; readonly x: number; readonly y: number }
    | { readonly type: 'up'; readonly pointerId: number; readonly t: number; readonly snappedTarget: number | null }
    | { readonly type: 'longPressTimer'; readonly pointerId: number }
    | { readonly type: 'cancel'; readonly pointerId: number };

export type GestureIntent =
    | { readonly type: 'none' }
    | { readonly type: 'tap'; readonly target: number; readonly secondary: boolean }
    | { readonly type: 'longPressFeedback'; readonly target: number }
    | { readonly type: 'dragStart'; readonly target: number }
    | { readonly type: 'dragMove'; readonly x: number; readonly y: number }
    | { readonly type: 'drop'; readonly from: number; readonly to: number }
    | { readonly type: 'dragCancel'; readonly from: number };

export const IDLE_GESTURE: GestureState = Object.freeze({ tag: 'idle' });
const NONE: GestureIntent = Object.freeze({ type: 'none' });

export interface GestureTransition {
    readonly state: GestureState;
    readonly intent: GestureIntent;
}

export function gestureReducer(s: GestureState, e: GestureEvent): GestureTransition {
    switch (e.type) {
        case 'down': {
            if (s.tag !== 'idle' || e.target === null) return { state: s, intent: NONE };
            if (e.button !== 0 && e.button !== 2) return { state: s, intent: NONE };
            const secondary = e.button === 2 || (e.isMac && e.ctrlKey && e.button === 0);
            return {
                state: { tag: 'pressed', pointerId: e.pointerId, kind: e.kind, secondary, target: e.target, x0: e.x, y0: e.y, t0: e.t },
                intent: NONE,
            };
        }
        case 'move': {
            if (s.tag === 'pressed' && s.pointerId === e.pointerId) {
                const dist = Math.hypot(e.x - s.x0, e.y - s.y0);
                if (!s.secondary && dist > DRAG_DISTANCE_THRESHOLD_PX[s.kind]) {
                    return {
                        state: { tag: 'dragging', pointerId: s.pointerId, kind: s.kind, target: s.target, x0: s.x0, y0: s.y0 },
                        intent: { type: 'dragStart', target: s.target },
                    };
                }
                return { state: s, intent: NONE };
            }
            if (s.tag === 'dragging' && s.pointerId === e.pointerId) {
                return { state: s, intent: { type: 'dragMove', x: e.x, y: e.y } };
            }
            return { state: s, intent: NONE };
        }
        case 'longPressTimer': {
            if (s.tag === 'pressed' && s.pointerId === e.pointerId && s.kind !== 'mouse') {
                return {
                    state: { tag: 'longPressed', pointerId: s.pointerId, target: s.target },
                    intent: { type: 'longPressFeedback', target: s.target },
                };
            }
            return { state: s, intent: NONE };
        }
        case 'up': {
            if (s.tag === 'pressed' && s.pointerId === e.pointerId) {
                const tooLong = e.t - s.t0 > TAP_MAX_DURATION_MS[s.kind];
                return { state: IDLE_GESTURE, intent: tooLong ? NONE : { type: 'tap', target: s.target, secondary: s.secondary } };
            }
            if (s.tag === 'longPressed' && s.pointerId === e.pointerId) {
                return { state: IDLE_GESTURE, intent: { type: 'tap', target: s.target, secondary: true } };
            }
            if (s.tag === 'dragging' && s.pointerId === e.pointerId) {
                return {
                    state: IDLE_GESTURE,
                    intent:
                        e.snappedTarget !== null
                            ? { type: 'drop', from: s.target, to: e.snappedTarget }
                            : { type: 'dragCancel', from: s.target },
                };
            }
            return { state: s, intent: NONE };
        }
        case 'cancel': {
            if (s.tag === 'dragging' && s.pointerId === e.pointerId) {
                return { state: IDLE_GESTURE, intent: { type: 'dragCancel', from: s.target } };
            }
            if (s.tag !== 'idle' && s.pointerId === e.pointerId) return { state: IDLE_GESTURE, intent: NONE };
            return { state: s, intent: NONE };
        }
    }
}
