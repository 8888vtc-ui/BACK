import type { PointRect, SnappingConfig } from '../../lib/board/snappingPhysics';
import type { PointerKind } from '../../lib/gameFeel/pointerGestureMachine';
import { ELASTIC_RETURN_DURATION_MS, ELASTIC_RETURN_EASING } from './checkerSnappingPhysics';

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

export interface MutableDragSession {
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

export const INITIAL_DRAG_STATE: DragState = {
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
