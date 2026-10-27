// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { MobileThumbDock } from './MobileThumbDock';
import { AutoConfirmControl } from './BoardActions';

afterEach(() => {
    cleanup();
});

describe('MobileThumbDock & BoardActions — Ergonomie Mobile-First Thumb-Dock', () => {
    const baseProps = {
        gamePhase: 'HUMAN_WAITING_ROLL' as const,
        isHumanTurn: true,
        hasDice: false,
        canUndo: false,
        canConfirm: false,
        isBlockedTurn: false,
        canDouble: true,
        cubeValue: 1,
        doublingOfferedBy: null,
        coachQuotaBadge: '3/3',
        isVip: false,
        isAnalyzingCoach: false,
        isTilted: false,
        onRoll: vi.fn(),
        onConfirm: vi.fn(),
        onUndo: vi.fn(),
        onOpenCubeSheet: vi.fn(),
        onTakeDouble: vi.fn(),
        onPassDouble: vi.fn(),
        onOpenCoachDrawer: vi.fn(),
    };

    it('applique touch-action: manipulation et supporte le mode gaucher/droitier', () => {
        const { getByTestId, rerender } = render(
            <MobileThumbDock {...baseProps} handedness="right" />,
        );
        const dock = getByTestId('monte-carlo-thumb-dock');
        expect(dock.getAttribute('data-handedness')).toBe('right');
        expect(dock.style.touchAction).toBe('manipulation');

        rerender(<MobileThumbDock {...baseProps} handedness="left" />);
        expect(dock.getAttribute('data-handedness')).toBe('left');
        expect(dock.className).toContain('flex-row-reverse');
    });

    it('affiche le badge Coach animé en cours d’analyse et l’indicateur de Tilt Zare', () => {
        const { getByTestId } = render(
            <MobileThumbDock {...baseProps} isAnalyzingCoach={true} isTilted={true} />,
        );
        const badge = getByTestId('thumb-dock-coach-badge');
        expect(badge.textContent).toBe('…');
        expect(badge.className).toContain('animate-pulse');

        const coachBtn = getByTestId('thumb-dock-coach-btn');
        expect(coachBtn.textContent).toContain('🔥');
    });

    it('affiche les boutons Prendre / Passer lors d’un videau adverse (RESPOND_DOUBLE)', () => {
        const onTakeDouble = vi.fn();
        const onPassDouble = vi.fn();
        const { getByTestId } = render(
            <MobileThumbDock
                {...baseProps}
                doublingOfferedBy="O"
                cubeValue={2}
                onTakeDouble={onTakeDouble}
                onPassDouble={onPassDouble}
            />,
        );

        const takeBtn = getByTestId('thumb-dock-take-btn');
        const passBtn = getByTestId('thumb-dock-pass-btn');
        expect(takeBtn.textContent).toContain('Prendre ×4');

        fireEvent.click(takeBtn);
        expect(onTakeDouble).toHaveBeenCalledTimes(1);

        fireEvent.click(passBtn);
        expect(onPassDouble).toHaveBeenCalledTimes(1);
    });

    it('rend AutoConfirmControl (BoardActions) avec menu de sélection des 4 modes', () => {
        const onToggleAutoConfirm = vi.fn();
        const onSelectAutoConfirmMode = vi.fn();

        const { getByTestId } = render(
            <AutoConfirmControl
                resolvedMode="forced_only"
                isAutoActive={true}
                autoConfirmMode="forced_only"
                onToggleAutoConfirm={onToggleAutoConfirm}
                onSelectAutoConfirmMode={onSelectAutoConfirmMode}
            />,
        );

        const toggleBtn = getByTestId('toggle-auto-confirm-btn');
        expect(toggleBtn.textContent).toContain('FORCÉ');
        fireEvent.click(toggleBtn);
        expect(onToggleAutoConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('auto-confirm-mode-menu-btn'));
        fireEvent.click(getByTestId('auto-confirm-mode-option-always'));
        expect(onSelectAutoConfirmMode).toHaveBeenCalledWith('always');
    });
});
