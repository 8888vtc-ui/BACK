// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useCheckerDragAndDrop,
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
    MOUSE_DRAG_THRESHOLD_PX,
    TOUCH_DRAG_THRESHOLD_PX,
    TAP_MAX_DURATION_MS,
    SNAP_RADIUS_PX,
    SNAP_HYSTERESIS_PX,
    getBiomechanicalDragThresholdPx,
    resolveMagneticTarget,
} from './useCheckerDragAndDrop';
import type { PointRect } from '../lib/board/snappingPhysics';

describe('useCheckerDragAndDrop (Chantier 2 — Zéro Re-Render & Magnétisme)', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('initialise l’état de drag au repos et expose les constantes biomécaniques exactes', () => {
        expect(MOUSE_DRAG_THRESHOLD_PX).toBe(5);
        expect(TOUCH_DRAG_THRESHOLD_PX).toBe(12);
        expect(TAP_MAX_DURATION_MS).toBe(220);
        expect(SNAP_RADIUS_PX).toBe(36);
        expect(SNAP_HYSTERESIS_PX).toBe(44);
        expect(getBiomechanicalDragThresholdPx('mouse')).toBe(5);
        expect(getBiomechanicalDragThresholdPx('touch')).toBe(12);

        const onDropMove = vi.fn();
        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5, 6]),
                onDropMove,
            }),
        );

        expect(result.current.dragState.isDragging).toBe(false);
        expect(result.current.dragState.isReturning).toBe(false);
        expect(result.current.dragState.fromPoint).toBeNull();
        expect(result.current.dragState.snappedTarget).toBeNull();
    });

    it('traite un faible déplacement (< seuil) et une durée <= 220ms comme un tap, et ignore un tap > 220ms', () => {
        const onDropMove = vi.fn();
        const onTapPoint = vi.fn();
        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5, 6]),
                onDropMove,
                onTapPoint,
            }),
        );

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        // 1. Tap franc <= 220ms (distance 4px < 5px mouse)
        act(() => {
            result.current.handlePointerDown(12, 'white', {
                button: 0,
                pointerType: 'mouse',
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                timeStamp: 1000,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(mockTarget.setPointerCapture).toHaveBeenCalledWith(1);

        act(() => {
            result.current.handlePointerMove({
                pointerType: 'mouse',
                clientX: 104,
                clientY: 100,
                pointerId: 1,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(false);

        act(() => {
            result.current.handlePointerUp({
                pointerId: 1,
                timeStamp: 1180, // 180ms <= 220ms
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(mockTarget.releasePointerCapture).toHaveBeenCalledWith(1);
        expect(onDropMove).not.toHaveBeenCalled();
        expect(onTapPoint).toHaveBeenCalledWith(12);

        // 2. Appui prolongé > TAP_MAX_DURATION_MS (220ms) sans drag -> pas de tap franc
        onTapPoint.mockClear();
        act(() => {
            result.current.handlePointerDown(12, 'white', {
                button: 0,
                pointerType: 'mouse',
                clientX: 100,
                clientY: 100,
                pointerId: 2,
                timeStamp: 2000,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
            result.current.handlePointerUp({
                pointerId: 2,
                timeStamp: 2250, // 250ms > 220ms
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });
        expect(onTapPoint).not.toHaveBeenCalled();
    });

    it('active le drag, injecte --drag-x / --drag-y sur overlayRef et déclenche onDropMove lors du lâcher sur cible', () => {
        const onDropMove = vi.fn();
        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5]),
                onDropMove,
            }),
        );

        const overlayEl = document.createElement('div');
        (result.current.overlayRef as { current: HTMLDivElement | null }).current = overlayEl;

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        const div = document.createElement('div');
        div.setAttribute('data-point', '5');
        vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
            left: 200,
            top: 200,
            right: 250,
            bottom: 300,
            width: 50,
            height: 100,
            x: 200,
            y: 200,
            toJSON: () => ({}),
        });
        document.body.appendChild(div);

        act(() => {
            result.current.handlePointerDown(8, 'black', {
                button: 0,
                clientX: 50,
                clientY: 50,
                pointerId: 2,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        act(() => {
            result.current.handlePointerMove({
                clientX: 220,
                clientY: 250,
                pointerId: 2,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(true);
        expect(result.current.dragState.snappedTarget).toBe(5);
        expect(overlayEl.style.getPropertyValue('--drag-x')).toContain('px');
        expect(overlayEl.style.getPropertyValue('--drag-y')).toContain('px');
        expect(overlayEl.getAttribute('data-snapped-target')).toBe('5');

        act(() => {
            result.current.handlePointerUp({
                pointerId: 2,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(onDropMove).toHaveBeenCalledWith(8, 5);
        expect(result.current.dragState.isDragging).toBe(false);
        expect(result.current.dragState.isReturning).toBe(false);

        document.body.removeChild(div);
    });

    it('conserve l’état initial sans altération et active un retour élastique 150ms cubic-bezier lors d’un lâcher hors-zone', () => {
        vi.useFakeTimers();
        const onDropMove = vi.fn();
        const onTapPoint = vi.fn();
        const onCancelDrag = vi.fn();

        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5]),
                onDropMove,
                onTapPoint,
                onCancelDrag,
            }),
        );

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        act(() => {
            result.current.handlePointerDown(13, 'white', {
                button: 0,
                clientX: 80,
                clientY: 120,
                pointerId: 3,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        act(() => {
            result.current.handlePointerMove({
                clientX: 600,
                clientY: 600,
                pointerId: 3,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(true);
        expect(result.current.dragState.snappedTarget).toBeNull();

        act(() => {
            result.current.handlePointerUp({
                pointerId: 3,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(onDropMove).not.toHaveBeenCalled();
        expect(onTapPoint).not.toHaveBeenCalled();
        expect(onCancelDrag).toHaveBeenCalledTimes(1);

        expect(result.current.dragState.isDragging).toBe(false);
        expect(result.current.dragState.isReturning).toBe(true);
        expect(result.current.dragState.currentX).toBe(80);
        expect(result.current.dragState.currentY).toBe(120);
        expect(result.current.dragState.returnDurationMs).toBe(ELASTIC_RETURN_DURATION_MS);
        expect(result.current.dragState.returnEasing).toBe(ELASTIC_RETURN_EASING);

        act(() => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.dragState.isReturning).toBe(false);
        expect(result.current.dragState.checkerColor).toBeNull();
    });

    it('applique les seuils biomécaniques (mouse=5px vs touch=12px) et garantit 0 re-render pendant tout le mouvement', () => {
        const onDropMove = vi.fn();
        const onTapPoint = vi.fn();
        let renderCount = 0;

        const { result } = renderHook(() => {
            renderCount += 1;
            return useCheckerDragAndDrop({
                legalDestinations: new Set([5]),
                onDropMove,
                onTapPoint,
            });
        });

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        // 1. Tactile ('touch') : un mouvement de 11px (< 12px) est absorbé et reste un tap
        act(() => {
            result.current.handlePointerDown(13, 'white', {
                button: 0,
                pointerType: 'touch',
                clientX: 100,
                clientY: 100,
                pointerId: 10,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
            result.current.handlePointerMove({
                pointerType: 'touch',
                clientX: 111,
                clientY: 100,
                pointerId: 10,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
            result.current.handlePointerUp({
                pointerType: 'touch',
                pointerId: 10,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(onTapPoint).toHaveBeenCalledWith(13);
        expect(mockTarget.setPointerCapture).toHaveBeenCalledWith(10);
        expect(mockTarget.releasePointerCapture).toHaveBeenCalledWith(10);

        // 2. Souris ('mouse') : 5px déclenche le drag, puis 15 mouvements continus = 0 re-render
        act(() => {
            result.current.handlePointerDown(13, 'white', {
                button: 0,
                pointerType: 'mouse',
                clientX: 100,
                clientY: 100,
                pointerId: 11,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        act(() => {
            result.current.handlePointerMove({
                pointerType: 'mouse',
                clientX: 105,
                clientY: 100,
                pointerId: 11,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(true);
        const rendersAtDragStart = renderCount;

        act(() => {
            for (let step = 1; step <= 15; step++) {
                result.current.handlePointerMove({
                    pointerType: 'mouse',
                    clientX: 105 + step * 4,
                    clientY: 100 + step * 2,
                    pointerId: 11,
                    currentTarget: mockTarget,
                } as unknown as React.PointerEvent);
            }
        });

        expect(renderCount).toBe(rendersAtDragStart);
        expect(result.current.dragState.currentX).toBe(165);
        expect(result.current.dragState.currentY).toBe(130);
    });

    it('applique SNAP_RADIUS_PX = 36px pour l’accrochage et SNAP_HYSTERESIS_PX = 44px pour le décrochage', () => {
        const rect5: PointRect = {
            pointNumber: 5,
            left: 185,
            top: 100,
            right: 215,
            bottom: 300,
            centerX: 200,
            centerY: 200,
        };

        // 1. Sans cible accrochée (currentSnappedPoint = null) :
        //    - à 36 px de l'axe (x = 236) -> accroche la flèche 5
        //    - à 37 px de l'axe (x = 237) -> n'accroche pas
        expect(resolveMagneticTarget(236, 200, [rect5], null).targetPoint).toBe(5);
        expect(resolveMagneticTarget(237, 200, [rect5], null).targetPoint).toBeNull();

        // 2. Une fois la flèche 5 accrochée (currentSnappedPoint = 5) :
        //    - à 40 px de l'axe (x = 240) -> reste accrochée (<= 44 px)
        //    - à 44 px de l'axe (x = 244) -> reste accrochée (<= 44 px)
        //    - à 45 px de l'axe (x = 245) -> décroche (> 44 px)
        expect(resolveMagneticTarget(240, 200, [rect5], 5).targetPoint).toBe(5);
        expect(resolveMagneticTarget(244, 200, [rect5], 5).targetPoint).toBe(5);
        expect(resolveMagneticTarget(245, 200, [rect5], 5).targetPoint).toBeNull();
    });
});
