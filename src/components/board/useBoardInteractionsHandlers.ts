'use client';

/**
 * Hook regroupant les handlers d'événements de clic, confirmation et survol du plateau.
 * Conforme à SCALABILITY.md (< 100 lignes).
 */

import { useCallback, useState } from 'react';
import { sensoryFeedbackController } from '../../lib/sound/SensoryFeedbackController';

export interface UseBoardInteractionsHandlersOptions {
    onRoll?: () => void;
    onConfirm?: () => void;
    onDeselect?: () => void;
    handlePointClick: (pointNumber: number, e: React.MouseEvent) => void;
    suppressClickAfterDragRef: React.MutableRefObject<boolean>;
    areCheckerClicksLocked: boolean;
    isAwaitingRoll: boolean;
}

export function useBoardInteractionsHandlers({
    onRoll,
    onConfirm,
    onDeselect,
    handlePointClick,
    suppressClickAfterDragRef,
    areCheckerClicksLocked,
    isAwaitingRoll,
}: UseBoardInteractionsHandlersOptions) {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    const handleRollWithClick = useCallback(() => {
        sensoryFeedbackController.triggerMechanicalClick();
        onRoll?.();
    }, [onRoll]);

    const handleConfirmWithClick = useCallback(() => {
        sensoryFeedbackController.triggerMechanicalClick();
        onConfirm?.();
    }, [onConfirm]);

    const onPointClick = useCallback(
        (...args: Parameters<typeof handlePointClick>) => {
            if (suppressClickAfterDragRef.current) {
                suppressClickAfterDragRef.current = false;
                return;
            }
            if (areCheckerClicksLocked) return;
            if (isAwaitingRoll) {
                handleRollWithClick();
                return;
            }
            handlePointClick(...args);
        },
        [areCheckerClicksLocked, isAwaitingRoll, handleRollWithClick, handlePointClick, suppressClickAfterDragRef],
    );

    const handleBackgroundClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (suppressClickAfterDragRef.current) {
                suppressClickAfterDragRef.current = false;
                return;
            }
            if (e.target === e.currentTarget) onDeselect?.();
        },
        [onDeselect, suppressClickAfterDragRef],
    );

    const handleMouseEnterPoint = useCallback((pt: number) => {
        if (typeof window === 'undefined' || window.matchMedia?.('(pointer: coarse)').matches) return;
        setHoveredPoint(pt);
    }, []);

    const handleMouseLeavePoint = useCallback(() => setHoveredPoint(null), []);

    return {
        hoveredPoint,
        handleRollWithClick,
        handleConfirmWithClick,
        onPointClick,
        handleBackgroundClick,
        handleMouseEnterPoint,
        handleMouseLeavePoint,
    };
}
