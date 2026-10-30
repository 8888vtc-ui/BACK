// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MoveErrorPopToast from './MoveErrorPopToast';
import type { LastMoveFeedback } from '../../hooks/coach/coachTypes';

afterEach(() => {
    cleanup();
});

describe('MoveErrorPopToast — Pop Erreur Tactique & Détection de Type', () => {
    it('ne rend rien lorsque le coup est optimal ou que la perte est négligeable', () => {
        const feedback: LastMoveFeedback = {
            verdict: 'optimal',
            equityLoss: 0.000,
            playedMove: '24/20 13/9',
            optimalMove: '24/20 13/9',
        };
        const { container } = render(
            React.createElement(MoveErrorPopToast, { feedback }),
        );
        expect(container.firstChild).toBeNull();
    });

    it('affiche le pop-up rouge sur un Blunder majeur avec son type et sa perte', () => {
        const feedback: LastMoveFeedback = {
            verdict: 'blunder',
            equityLoss: -0.145,
            playedMove: '13/9 13/11',
            optimalMove: '24/20 13/11',
        };
        render(
            React.createElement(MoveErrorPopToast, {
                feedback,
                onReplayMove: vi.fn(),
                onOpenCoach: vi.fn(),
            }),
        );

        expect(screen.getByTestId('move-error-pop-toast')).toBeDefined();
        expect(screen.getByText('GAFFE / BLUNDER MAJEUR')).toBeDefined();
        expect(screen.getByText(/-0.145 EMG/)).toBeDefined();
        expect(screen.getByText('Type :')).toBeDefined();
        expect(screen.getByText('13/9 13/11')).toBeDefined();
        expect(screen.getByText('24/20 13/11')).toBeDefined();
    });

    it('déclenche onReplayMove lors du clic sur le bouton Rejouer', () => {
        const onReplay = vi.fn();
        const feedback: LastMoveFeedback = {
            verdict: 'blunder',
            equityLoss: -0.095,
            playedMove: '8/2 6/2',
        };
        render(
            React.createElement(MoveErrorPopToast, {
                feedback,
                onReplayMove: onReplay,
            }),
        );

        const replayBtn = screen.getByTestId('error-toast-replay-btn');
        fireEvent.click(replayBtn);
        expect(onReplay).toHaveBeenCalledTimes(1);
    });

    it('ferme le pop-up lors du clic sur le bouton fermer [✕]', () => {
        const feedback: LastMoveFeedback = {
            verdict: 'inaccuracy',
            equityLoss: -0.035,
        };
        const { queryByTestId } = render(
            React.createElement(MoveErrorPopToast, { feedback }),
        );

        expect(screen.getByTestId('move-error-pop-toast')).toBeDefined();
        fireEvent.click(screen.getByTestId('error-toast-close-btn'));
        expect(queryByTestId('move-error-pop-toast')).toBeNull();
    });

    it('affiche le type Erreur de Videau (et non Erreur positionnelle) lors d’un Blunder de Cube', () => {
        const feedback: LastMoveFeedback = {
            verdict: 'blunder',
            equityLoss: -0.180,
            playedMove: 'Videau : Doubler (×2)',
            optimalMove: 'No double, take',
            decisionType: 'cube',
            errorCategoryLabel: 'Erreur de Videau — Double prématuré',
            errorAdvice: 'Double prématuré : votre position n’est pas assez forte pour justifier le videau.',
        };
        render(
            React.createElement(MoveErrorPopToast, { feedback }),
        );

        expect(screen.getByText('BLUNDER DE VIDEAU (CUBE)')).toBeDefined();
        expect(screen.getByText('Erreur de Videau — Double prématuré')).toBeDefined();
        expect(screen.queryByText(/Erreur positionnelle/i)).toBeNull();
    });
});
