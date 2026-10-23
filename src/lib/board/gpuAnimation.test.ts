// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
    formatTranslate3d,
    getScopedWillChange,
    buildGpuFlightStyle,
    isCompositeOnlyTransition,
} from './gpuAnimation';
import { Checker } from '../../components/board/Checker';
import { DraggedCheckerOverlay } from '../../components/board/DraggedCheckerOverlay';

afterEach(() => {
    cleanup();
});

describe('gpuAnimation — Micro-Animations 60/120 FPS & Transitions CSS (Audit 12 / 20)', () => {
    it('génère exclusivement des transformations 3D GPU (translate3d / scale3d) sans propriétés de layout', () => {
        const transformStr = formatTranslate3d(240.556, 180.123, 1.15, true);
        expect(transformStr).toBe(
            'translate3d(240.56px, 180.12px, 0) translate3d(-50%, -50%, 0) scale3d(1.15, 1.15, 1)',
        );

        const flightStyle = buildGpuFlightStyle({
            xPx: 320,
            yPx: 410,
            scale: 1.2,
            centerOffset: true,
            isActivePhase: true,
        });

        expect(flightStyle.left).toBe('0px');
        expect(flightStyle.top).toBe('0px');
        expect(flightStyle.transform).toContain('translate3d(320px, 410px, 0)');
        expect(flightStyle.willChange).toBe('transform, opacity');
        expect(isCompositeOnlyTransition(flightStyle.transition)).toBe(true);
    });

    it('rejette toute transition CSS animant des propriétés de layout (top, left, width, height, all)', () => {
        expect(isCompositeOnlyTransition('transform 150ms ease, opacity 150ms ease')).toBe(true);
        expect(isCompositeOnlyTransition('left 150ms ease, top 150ms ease')).toBe(false);
        expect(isCompositeOnlyTransition('all 200ms cubic-bezier(0.2, 0.8, 0.2, 1)')).toBe(false);
        expect(isCompositeOnlyTransition('width 100ms linear, transform 100ms linear')).toBe(false);
    });

    it('applique will-change: transform, opacity uniquement pendant le mouvement actif et auto au repos', () => {
        expect(getScopedWillChange(false)).toBe('auto');
        expect(getScopedWillChange(true)).toBe('transform, opacity');

        const { container: restContainer } = render(
            React.createElement(Checker, {
                color: 'white',
                isPlayable: true,
                isTopChecker: true,
                isActiveMotion: false,
            }),
        );
        const restNode = restContainer.querySelector('[data-gpu-will-change]') as HTMLElement;
        expect(restNode.getAttribute('data-gpu-will-change')).toBe('auto');
        expect(restNode.style.willChange).toBe('auto');

        cleanup();

        render(
            React.createElement(DraggedCheckerOverlay, {
                dragState: {
                    isDragging: true,
                    isReturning: false,
                    fromPoint: 5,
                    checkerColor: 'white',
                    currentX: 250,
                    currentY: 310,
                    snappedTarget: 3,
                    returnDurationMs: 0,
                    returnEasing: '',
                    originX: 200,
                    originY: 200,
                    isDirectHit: false,
                },
            }),
        );

        const overlay = screen.getByTestId('dragged-checker-overlay');
        expect(overlay.style.left).toBe('0px');
        expect(overlay.style.top).toBe('0px');
        expect(overlay.style.transform).toContain('translate3d(250px, 310px, 0)');
        expect(overlay.style.willChange).toBe('transform, opacity');
    });
});
