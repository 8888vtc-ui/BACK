// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CubeDecisionModal } from './CubeDecisionModal';

describe('CubeDecisionModal (Audit 9/20 — Cube Safety & Anti-Misclick 250ms)', () => {
    afterEach(() => {
        cleanup();
    });

    it('affiche la transition (2 → 4), le score actuel, espace Take/Drop et verrouille les clics pendant 250ms', () => {
        vi.useFakeTimers();
        try {
            const onTakeDouble = vi.fn();
            const onPassDouble = vi.fn();

            render(
                <CubeDecisionModal
                    isOpen={true}
                    currentCubeValue={2}
                    offeredBy="O"
                    scoreX={3}
                    scoreO={4}
                    matchLength={7}
                    onTakeDouble={onTakeDouble}
                    onPassDouble={onPassDouble}
                />,
            );

            // Transition claire 2 -> 4 et score actuel
            expect(screen.getByTestId('cube-modal-transition').textContent).toContain('2 → 4');
            expect(screen.getByTestId('cube-modal-score').textContent).toContain('3 – 4 / 7 pts');

            // Espacement franc (>= 20px) entre Accepter (Take) et Passer (Drop)
            const actionsContainer = screen.getByTestId('cube-modal-actions') as HTMLElement;
            expect(actionsContainer.style.gap).toBe('20px');

            const takeBtn = screen.getByTestId('cube-modal-take-btn') as HTMLButtonElement;
            const passBtn = screen.getByTestId('cube-modal-pass-btn') as HTMLButtonElement;

            // À t = 0ms..249ms : verrou anti-misclick actif -> les clics accidentels sont bloqués
            expect(takeBtn.disabled).toBe(true);
            expect(passBtn.disabled).toBe(true);
            fireEvent.click(takeBtn);
            fireEvent.click(passBtn);
            expect(onTakeDouble).not.toHaveBeenCalled();
            expect(onPassDouble).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(249);
            });
            expect(takeBtn.disabled).toBe(true);

            // À t = 250ms exactement : le verrou anti-misclick se lève
            act(() => {
                vi.advanceTimersByTime(1);
            });
            expect(takeBtn.disabled).toBe(false);
            expect(passBtn.disabled).toBe(false);

            fireEvent.click(takeBtn);
            expect(onTakeDouble).toHaveBeenCalledTimes(1);
        } finally {
            vi.useRealTimers();
        }
    });
});
