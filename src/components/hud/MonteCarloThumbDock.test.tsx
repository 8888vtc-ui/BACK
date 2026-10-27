// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import MonteCarloThumbDock from './MonteCarloThumbDock';
import CubeBottomSheet from '../modals/CubeBottomSheet';

afterEach(() => {
    cleanup();
});

describe('MonteCarloThumbDock & CubeBottomSheet — Ergonomie Mobile 1 Main', () => {
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
        onRoll: vi.fn(),
        onConfirm: vi.fn(),
        onUndo: vi.fn(),
        onOpenCubeSheet: vi.fn(),
        onTakeDouble: vi.fn(),
        onPassDouble: vi.fn(),
        onOpenCoachDrawer: vi.fn(),
    };

    it('affiche l’état 1 (LANCER) avec bouton principal doré et déclenche onRoll au clic', () => {
        const onRoll = vi.fn();
        const { getByTestId } = render(<MonteCarloThumbDock {...baseProps} onRoll={onRoll} />);

        const primaryBtn = getByTestId('thumb-dock-primary-btn');
        expect(primaryBtn.getAttribute('data-primary-state')).toBe('ROLL');
        expect(primaryBtn.textContent).toContain('Lancer');

        fireEvent.click(primaryBtn);
        expect(onRoll).toHaveBeenCalledTimes(1);
    });

    it('affiche l’état 2 (VALIDER) en vert émeraude quand tous les dés légaux sont joués', () => {
        const onConfirm = vi.fn();
        const { getByTestId } = render(
            <MonteCarloThumbDock
                {...baseProps}
                gamePhase="HUMAN_READY_TO_COMMIT"
                hasDice={true}
                canUndo={true}
                canConfirm={true}
                onConfirm={onConfirm}
            />,
        );

        const primaryBtn = getByTestId('thumb-dock-primary-btn');
        expect(primaryBtn.getAttribute('data-primary-state')).toBe('CONFIRM');
        expect(primaryBtn.textContent).toContain('Valider');

        fireEvent.click(primaryBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('affiche l’état 3 (PAS DE COUP / Passer) quand le joueur est bloqué', () => {
        const onConfirm = vi.fn();
        const { getByTestId } = render(
            <MonteCarloThumbDock
                {...baseProps}
                gamePhase="HUMAN_READY_TO_COMMIT"
                hasDice={true}
                isBlockedTurn={true}
                onConfirm={onConfirm}
            />,
        );

        const primaryBtn = getByTestId('thumb-dock-primary-btn');
        expect(primaryBtn.getAttribute('data-primary-state')).toBe('NO_MOVE');
        expect(primaryBtn.textContent).toContain('Passer');

        fireEvent.click(primaryBtn);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('active les boutons satellites Undo, Videau (2x) et Coach IA avec quota [3/3] ou [VIP ∞]', () => {
        const onUndo = vi.fn();
        const onOpenCubeSheet = vi.fn();
        const onOpenCoachDrawer = vi.fn();

        const { getByTestId } = render(
            <MonteCarloThumbDock
                {...baseProps}
                canUndo={true}
                coachQuotaBadge="VIP ∞"
                isVip={true}
                onUndo={onUndo}
                onOpenCubeSheet={onOpenCubeSheet}
                onOpenCoachDrawer={onOpenCoachDrawer}
            />,
        );

        expect(getByTestId('thumb-dock-coach-badge').textContent).toBe('VIP ∞');

        fireEvent.click(getByTestId('thumb-dock-undo-btn'));
        expect(onUndo).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('thumb-dock-cube-btn'));
        expect(onOpenCubeSheet).toHaveBeenCalledTimes(1);

        fireEvent.click(getByTestId('thumb-dock-coach-btn'));
        expect(onOpenCoachDrawer).toHaveBeenCalledTimes(1);
    });

    it('ouvre CubeBottomSheet et permet de doubler en 1 touche', () => {
        const onOfferDouble = vi.fn();
        const onClose = vi.fn();

        const { getByTestId } = render(
            <CubeBottomSheet
                isOpen={true}
                cubeValue={2}
                canDouble={true}
                doublingOfferedBy={null}
                scoreX={3}
                scoreO={2}
                matchLength={7}
                onClose={onClose}
                onOfferDouble={onOfferDouble}
                onTakeDouble={vi.fn()}
                onPassDouble={vi.fn()}
            />,
        );

        const confirmDoubleBtn = getByTestId('cube-sheet-confirm-double-btn');
        expect(confirmDoubleBtn.textContent).toContain('Doubler à ×4');

        fireEvent.click(confirmDoubleBtn);
        expect(onOfferDouble).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
