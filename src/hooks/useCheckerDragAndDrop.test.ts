// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    useCheckerDragAndDrop,
    ELASTIC_RETURN_DURATION_MS,
    ELASTIC_RETURN_EASING,
} from './useCheckerDragAndDrop';

describe('useCheckerDragAndDrop', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('initialise l’état de drag au repos', () => {
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

    it('traite un faible déplacement (< seuil) comme un tap sans déclencher de drag', () => {
        const onDropMove = vi.fn();
        const onTapPoint = vi.fn();
        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5, 6]),
                onDropMove,
                onTapPoint,
                config: { dragThreshold: 10, maxSnapDistance: 90, hysteresisMargin: 18 },
            }),
        );

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        // Pointer down
        act(() => {
            result.current.handlePointerDown(12, 'white', {
                button: 0,
                clientX: 100,
                clientY: 100,
                pointerId: 1,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        // Déplacement de seulement 3px (< seuil de 10)
        act(() => {
            result.current.handlePointerMove({
                clientX: 103,
                clientY: 100,
                pointerId: 1,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(false);

        // Pointer up
        act(() => {
            result.current.handlePointerUp({
                pointerId: 1,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(false);
        expect(onDropMove).not.toHaveBeenCalled();
        expect(onTapPoint).toHaveBeenCalledWith(12);
    });

    it('active le drag et déclenche onDropMove lors du lâcher sur cible', () => {
        const onDropMove = vi.fn();
        const { result } = renderHook(() =>
            useCheckerDragAndDrop({
                legalDestinations: new Set([5]),
                onDropMove,
                config: { dragThreshold: 5, maxSnapDistance: 90, hysteresisMargin: 18 },
            }),
        );

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        // Simuler un élément DOM pour la cible 5
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
            toJSON: () => {},
        });
        document.body.appendChild(div);

        // Pointer down
        act(() => {
            result.current.handlePointerDown(8, 'black', {
                button: 0,
                clientX: 50,
                clientY: 50,
                pointerId: 2,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        // Pointer move au dessus de la cible 5 (x=220, y=250)
        act(() => {
            result.current.handlePointerMove({
                clientX: 220,
                clientY: 250,
                pointerId: 2,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(true);
        expect(result.current.dragState.snappedTarget).toBe(5);

        // Pointer up
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
                config: { dragThreshold: 5, maxSnapDistance: 90, hysteresisMargin: 18 },
            }),
        );

        const mockTarget = {
            setPointerCapture: vi.fn(),
            releasePointerCapture: vi.fn(),
        };

        // Départ en (80, 120)
        act(() => {
            result.current.handlePointerDown(13, 'white', {
                button: 0,
                clientX: 80,
                clientY: 120,
                pointerId: 3,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        // Déplacement hors de toute cible (x=600, y=600)
        act(() => {
            result.current.handlePointerMove({
                clientX: 600,
                clientY: 600,
                pointerId: 3,
            } as unknown as React.PointerEvent);
        });

        expect(result.current.dragState.isDragging).toBe(true);
        expect(result.current.dragState.snappedTarget).toBeNull();

        // Lâcher hors-zone
        act(() => {
            result.current.handlePointerUp({
                pointerId: 3,
                currentTarget: mockTarget,
            } as unknown as React.PointerEvent);
        });

        // L'état initial du jeu ne doit subir aucune altération
        expect(onDropMove).not.toHaveBeenCalled();
        expect(onTapPoint).not.toHaveBeenCalled();
        expect(onCancelDrag).toHaveBeenCalledTimes(1);

        // Retour élastique actif vers (originX=80, originY=120) en 150ms cubic-bezier
        expect(result.current.dragState.isDragging).toBe(false);
        expect(result.current.dragState.isReturning).toBe(true);
        expect(result.current.dragState.currentX).toBe(80);
        expect(result.current.dragState.currentY).toBe(120);
        expect(result.current.dragState.returnDurationMs).toBe(ELASTIC_RETURN_DURATION_MS);
        expect(result.current.dragState.returnDurationMs).toBe(150);
        expect(result.current.dragState.returnEasing).toBe(ELASTIC_RETURN_EASING);

        // Fin du retour élastique après 150ms
        act(() => {
            vi.advanceTimersByTime(150);
        });

        expect(result.current.dragState.isReturning).toBe(false);
        expect(result.current.dragState.checkerColor).toBeNull();
    });
});
