'use client';

/**
 * Overlay visuel du pion flottant en cours de Drag-and-Drop (Chantier 2 — Zéro Re-render).
 * Suit le pointeur exclusivement sur le compositeur GPU via `--drag-x`, `--drag-y` et
 * `translate3d(x, y, 0)` (left: 0px, top: 0px — 0 Layout Shift) piloté par `requestAnimationFrame`
 * via `overlayRef` avec `will-change: transform, opacity` ciblé uniquement pendant la phase active.
 */

import React from 'react';
import { Checker, type CheckerColor } from './Checker';
import {
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
    type DragState,
} from '../../hooks/useCheckerDragAndDrop';
import { buildGpuFlightStyle } from '../../lib/board/gpuAnimation';

export interface DraggedCheckerOverlayProps {
    readonly dragState: DragState;
    /** Ref DOM pilotée par `requestAnimationFrame` dans `useCheckerDragAndDrop` pour le suivi à 0 re-render. */
    readonly overlayRef?: React.Ref<HTMLDivElement>;
}

export const DraggedCheckerOverlay: React.FC<DraggedCheckerOverlayProps> = ({ dragState, overlayRef }) => {
    const isActive = dragState.isDragging || dragState.isReturning;
    if (!isActive || !dragState.checkerColor) {
        return null;
    }

    const isWhite = dragState.checkerColor === 'white';
    const durationMs = dragState.isReturning
        ? dragState.returnDurationMs || ELASTIC_RETURN_DURATION_MS
        : 0;
    const easing = dragState.returnEasing || ELASTIC_RETURN_EASING;
    const isSnapped = dragState.isDragging && dragState.snappedTarget !== null;
    const scale = dragState.isReturning ? 1 : isSnapped ? 1.2 : 1.15;

    const gpuStyle = buildGpuFlightStyle({
        xPx: dragState.currentX,
        yPx: dragState.currentY,
        scale,
        centerOffset: true,
        isActivePhase: isActive,
        durationMs,
        easing,
    });

    const overlayStyle: React.CSSProperties & Record<'--drag-x' | '--drag-y', string> = {
        ...gpuStyle,
        '--drag-x': `${dragState.currentX}px`,
        '--drag-y': `${dragState.currentY}px`,
        transition: dragState.isReturning ? gpuStyle.transition : 'none',
        filter: isWhite
            ? 'drop-shadow(0 12px 20px rgba(0,0,0,0.45)) drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            : 'drop-shadow(0 14px 24px rgba(0,0,0,0.75)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
    };

    return (
        <div
            ref={overlayRef}
            data-testid="dragged-checker-overlay"
            data-snapped-target={dragState.snappedTarget ?? ''}
            data-returning={dragState.isReturning ? 'true' : 'false'}
            className={`fixed pointer-events-none z-[9999] select-none rounded-full ${
                isSnapped ? 'ring-4 ring-emerald-400/90 shadow-[0_0_20px_rgba(52,211,153,0.75)]' : ''
            }`}
            style={overlayStyle}
            aria-hidden="true"
        >
            <Checker
                color={dragState.checkerColor as CheckerColor}
                isPlayable
                isTopChecker
                isActiveMotion={isActive}
            />
        </div>
    );
};

export default DraggedCheckerOverlay;
