'use client';

/**
 * Hook de Drag-and-Drop et Magnétisme des pions (Snapping Physics).
 * Normes Backgammon Galaxy / eXtreme Gammon :
 *   - Détection pointerdown / pointermove / pointerup universelle (souris + tactile)
 *   - Seuil de déplacement (dragThreshold) pour distinguer un clic d'un glissement
 *   - Magnétisme temps réel par distance euclidienne avec hystérésis et hitbox ≥ 44×44 px
 *   - Retour élastique fluide en 150ms `cubic-bezier(0.2, 0.8, 0.2, 1)` sans altération de l'état
 *     initial si le lâcher est hors-zone
 *   - Strictement 0 `any`, < 300 lignes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    findNearestLegalTarget,
    ensureMinimumHitbox,
    MIN_HITBOX_SIZE,
    type PointRect,
    type SnappingConfig,
    DEFAULT_SNAPPING_CONFIG,
} from '../lib/board/snappingPhysics';

/** Durée du retour élastique lors d'un lâcher hors-zone (ms). */
export const ELASTIC_RETURN_DURATION_MS = 150;

/** Courbe d'accélération du retour élastique hors-zone. */
export const ELASTIC_RETURN_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export interface DragState {
    isDragging: boolean;
    /** Vrai pendant les 150ms du retour élastique vers l'origine après un lâcher hors-zone. */
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
    /** Liste des cibles légales pour le point actuellement sélectionné/glissé. */
    legalDestinations: ReadonlySet<number>;
    /** Callback de validation quand un pion est déposé sur une cible légale. */
    onDropMove: (fromPoint: number, toPoint: number) => void;
    /** Callback si un simple clic/tap a été effectué (distance < seuil de drag). */
    onTapPoint?: (pointNumber: number) => void;
    /** Callback optionnel déclenché lors d'un lâcher hors-zone (sans altérer l'état du jeu). */
    onCancelDrag?: () => void;
    /** Configuration optionnelle de magnétisme. */
    config?: SnappingConfig;
}

export interface UseCheckerDragAndDropResult {
    dragState: DragState;
    handlePointerDown: (pointNumber: number, color: 'white' | 'black', e: React.PointerEvent) => void;
    handlePointerMove: (e: React.PointerEvent) => void;
    handlePointerUp: (e: React.PointerEvent) => void;
    handlePointerCancel: (e: React.PointerEvent) => void;
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
    onDropMove,
    onTapPoint,
    onCancelDrag,
    config = DEFAULT_SNAPPING_CONFIG,
}: UseCheckerDragAndDropParams): UseCheckerDragAndDropResult {
    const [dragState, setDragState] = useState<DragState>(INITIAL_DRAG_STATE);

    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const activePointerIdRef = useRef<number | null>(null);
    const activeFromRef = useRef<number | null>(null);
    const activeColorRef = useRef<'white' | 'black' | null>(null);
    const isDraggingRef = useRef<boolean>(false);
    const snappedTargetRef = useRef<number | null>(null);
    const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearReturnTimer = useCallback(() => {
        if (returnTimerRef.current !== null) {
            clearTimeout(returnTimerRef.current);
            returnTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => clearReturnTimer();
    }, [clearReturnTimer]);

    /**
     * Lit dynamiquement les rectangles englobants des cibles légales dans le DOM
     * et garantit une hitbox minimale d'au moins 44×44 px par flèche.
     */
    const getLegalTargetRects = useCallback((): PointRect[] => {
        if (typeof document === 'undefined') return [];
        const rects: PointRect[] = [];
        const minHitbox = config.minHitboxSize ?? MIN_HITBOX_SIZE;

        legalDestinations.forEach((pt) => {
            const touchZone = document.querySelector(`[data-testid="point-touch-zone-${pt}"]`);
            const pointEl = document.querySelector(`[data-point="${pt}"], [data-off-tray="${pt}"]`);
            const el = touchZone ?? pointEl;
            if (el) {
                const domRect = el.getBoundingClientRect();
                const fallbackRect =
                    domRect.width === 0 && domRect.height === 0 && pointEl && pointEl !== el
                        ? pointEl.getBoundingClientRect()
                        : domRect;
                const centerX = fallbackRect.left + fallbackRect.width / 2;
                const centerY = fallbackRect.top + fallbackRect.height / 2;
                rects.push(
                    ensureMinimumHitbox(
                        {
                            pointNumber: pt,
                            left: fallbackRect.left,
                            top: fallbackRect.top,
                            right: fallbackRect.right,
                            bottom: fallbackRect.bottom,
                            centerX,
                            centerY,
                        },
                        minHitbox,
                    ),
                );
            }
        });

        return rects;
    }, [legalDestinations, config.minHitboxSize]);

    const triggerElasticReturn = useCallback(
        (fromPt: number | null, color: 'white' | 'black' | null, origin: { x: number; y: number }) => {
            clearReturnTimer();
            setDragState({
                isDragging: false,
                isReturning: true,
                fromPoint: fromPt,
                checkerColor: color,
                originX: origin.x,
                originY: origin.y,
                currentX: origin.x,
                currentY: origin.y,
                snappedTarget: null,
                isDirectHit: false,
                returnDurationMs: ELASTIC_RETURN_DURATION_MS,
                returnEasing: ELASTIC_RETURN_EASING,
            });
            returnTimerRef.current = setTimeout(() => {
                returnTimerRef.current = null;
                setDragState(INITIAL_DRAG_STATE);
            }, ELASTIC_RETURN_DURATION_MS);
        },
        [clearReturnTimer],
    );

    const handlePointerDown = useCallback(
        (pointNumber: number, color: 'white' | 'black', e: React.PointerEvent) => {
            if (e.button !== 0) return;

            clearReturnTimer();
            startPosRef.current = { x: e.clientX, y: e.clientY };
            activePointerIdRef.current = e.pointerId;
            activeFromRef.current = pointNumber;
            activeColorRef.current = color;
            isDraggingRef.current = false;
            snappedTargetRef.current = null;
        },
        [clearReturnTimer],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (activePointerIdRef.current !== e.pointerId || !startPosRef.current) return;

            const dx = e.clientX - startPosRef.current.x;
            const dy = e.clientY - startPosRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (!isDraggingRef.current && dist < config.dragThreshold) {
                return;
            }

            if (!isDraggingRef.current) {
                isDraggingRef.current = true;
                try {
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                } catch {
                    // Ignore si capture non supportée par le conteneur
                }
            }
            const legalRects = getLegalTargetRects();
            const snap = findNearestLegalTarget(
                e.clientX,
                e.clientY,
                legalRects,
                snappedTargetRef.current,
                config,
            );

            snappedTargetRef.current = snap.targetPoint;

            setDragState({
                isDragging: true,
                isReturning: false,
                fromPoint: activeFromRef.current,
                checkerColor: activeColorRef.current,
                originX: startPosRef.current.x,
                originY: startPosRef.current.y,
                currentX: e.clientX,
                currentY: e.clientY,
                snappedTarget: snap.targetPoint,
                isDirectHit: snap.isDirectHit,
                returnDurationMs: ELASTIC_RETURN_DURATION_MS,
                returnEasing: ELASTIC_RETURN_EASING,
            });
        },
        [config, getLegalTargetRects],
    );

    const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (activePointerIdRef.current !== e.pointerId) return;

            try {
                (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
            } catch {
                // Ignore
            }

            const fromPt = activeFromRef.current;
            const color = activeColorRef.current;
            const origin = startPosRef.current ?? { x: 0, y: 0 };
            const wasDragging = isDraggingRef.current;
            const target = snappedTargetRef.current;

            activePointerIdRef.current = null;
            startPosRef.current = null;
            activeFromRef.current = null;
            activeColorRef.current = null;
            isDraggingRef.current = false;
            snappedTargetRef.current = null;

            if (wasDragging) {
                if (fromPt !== null && target !== null && legalDestinations.has(target)) {
                    setDragState(INITIAL_DRAG_STATE);
                    onDropMove(fromPt, target);
                } else {
                    // Lâcher hors-zone : retour élastique 150ms cubic-bezier vers l'origine, 0 altération de l'état
                    triggerElasticReturn(fromPt, color, origin);
                    onCancelDrag?.();
                }
            } else {
                setDragState(INITIAL_DRAG_STATE);
                if (fromPt !== null) {
                    onTapPoint?.(fromPt);
                }
            }
        },
        [legalDestinations, onDropMove, onTapPoint, onCancelDrag, triggerElasticReturn],
    );

    const handlePointerCancel = useCallback(
        (e: React.PointerEvent) => {
            if (activePointerIdRef.current === e.pointerId) {
                const fromPt = activeFromRef.current;
                const color = activeColorRef.current;
                const origin = startPosRef.current ?? { x: 0, y: 0 };
                const wasDragging = isDraggingRef.current;

                activePointerIdRef.current = null;
                startPosRef.current = null;
                activeFromRef.current = null;
                activeColorRef.current = null;
                isDraggingRef.current = false;
                snappedTargetRef.current = null;

                if (wasDragging) {
                    triggerElasticReturn(fromPt, color, origin);
                    onCancelDrag?.();
                } else {
                    setDragState(INITIAL_DRAG_STATE);
                }
            }
        },
        [onCancelDrag, triggerElasticReturn],
    );

    return {
        dragState,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
    };
}
