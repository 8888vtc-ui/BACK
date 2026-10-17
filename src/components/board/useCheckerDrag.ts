'use client';

/**
 * Hook de drag-and-drop des pions (pointer events).
 *
 * Encapsule la logique de deplacement d'un pion vers une destination legale :
 * detection du point source via `data-point`, suivi du curseur, hit-testing au
 * relachement, et appel de `onPlayMove(from, to)` si la destination est legale.
 *
 * Separe du composant `Board` pour la maintenabilite et la testabilite.
 */

import { useCallback, useRef, useState } from 'react';

interface DragState {
    fromPoint: number;
    startX: number;
    startY: number;
    hasDragged: boolean;
}

interface UseCheckerDragOptions {
    /** Plateau courant (pour vérifier la présence d'un pion du joueur). */
    board: number[];
    /** Le joueur est X (blanc). */
    isX: boolean;
    /** Destinations légales pour le dé gauche. */
    leftDieTargets: Map<number, number[]>;
    /** Destinations légales pour le dé droit. */
    rightDieTargets: Map<number, number[]>;
    /** Callback de déplacement (from -> to). */
    onPlayMove?: (from: number, to: number, die?: 0 | 1) => void;
}

interface UseCheckerDragResult {
    /** Handler à brancher sur `onPointerDown` du conteneur. */
    onPointerDown: (e: React.PointerEvent) => void;
    /** Handler à brancher sur `onPointerMove` du conteneur. */
    onPointerMove: (e: React.PointerEvent) => void;
    /** Handler à brancher sur `onPointerUp` du conteneur. */
    onPointerUp: (e: React.PointerEvent) => void;
    /** Handler à brancher sur `onPointerCancel` du conteneur. */
    onPointerCancel: () => void;
    /** Réf indiquant qu'un drag vient de se terminer (pour ignorer le clic suivant). */
    didDragRef: React.MutableRefObject<boolean>;
}

/** Seuil de déplacement (px) au-delà duquel un drag est considéré comme actif. */
const DRAG_THRESHOLD_PX = 12;

export function useCheckerDrag({
    board,
    isX,
    leftDieTargets,
    rightDieTargets,
    onPlayMove,
}: UseCheckerDragOptions): UseCheckerDragResult {
    const [dragState, setDragState] = useState<DragState | null>(null);
    const didDragRef = useRef(false);

    const onPointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (e.button !== 0) return;
            const target = (e.target as HTMLElement).closest('[data-point]');
            if (!target) return;

            const fromPoint = Number(target.getAttribute('data-point'));
            const count = board[fromPoint];
            const hasPlayerChecker = isX ? count > 0 : count < 0;
            if (!hasPlayerChecker) return;

            setDragState({
                fromPoint,
                startX: e.clientX,
                startY: e.clientY,
                hasDragged: false,
            });
            didDragRef.current = false;
        },
        [board, isX],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
            if (dist > DRAG_THRESHOLD_PX && !dragState.hasDragged) {
                setDragState((prev) => (prev ? { ...prev, hasDragged: true } : null));
                didDragRef.current = true;
            }
        },
        [dragState],
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent) => {
            if (!dragState) return;
            const { fromPoint, hasDragged } = dragState;
            setDragState(null);

            if (!hasDragged) return;

            // Hit-testing : trouve la flèche sous le curseur.
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const target = el?.closest('[data-point]');
            if (!target) return;
            const toPoint = Number(target.getAttribute('data-point'));

            const validDestinations = new Set([
                ...(leftDieTargets.get(fromPoint) ?? []),
                ...(rightDieTargets.get(fromPoint) ?? []),
            ]);
            if (validDestinations.has(toPoint)) {
                onPlayMove?.(fromPoint, toPoint);
            }
        },
        [dragState, leftDieTargets, rightDieTargets, onPlayMove],
    );

    const onPointerCancel = useCallback(() => {
        setDragState(null);
    }, []);

    return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, didDragRef };
}
