// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInitialState, X_BAR } from './backgammonEngine';
import {
    calculatePlayerPips,
    buildPipDifferentialSnapshot,
    calculateBoardPipSnapshot,
} from './pipCalculator';
import { PipCountBadge } from '../components/board/PipCountBadge';

describe('pipCalculator & PipCountBadge (Audit 10/20 — Pip Count & Différentiel Dynamique)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
    });

    it('calcule instantanément les pips exacts (167 au départ, +25 par pion sur la barre) après chaque sous-dé', () => {
        const initial = createInitialState().board;
        expect(calculatePlayerPips(initial, 'X')).toBe(167);
        expect(calculatePlayerPips(initial, 'O')).toBe(167);

        // Sous-dé joué : X avance 1 pion de 24 vers 20 (-4 pips -> 163 pips)
        const afterSubDie = [...initial];
        afterSubDie[24] -= 1;
        afterSubDie[20] += 1;
        const snap = calculateBoardPipSnapshot(afterSubDie, 'X');
        expect(snap.pipX).toBe(163);
        expect(snap.pipO).toBe(167);
        expect(snap.status).toBe('ahead');
        expect(snap.formattedDifferential).toBe('+4');
        expect(snap.colorTone).toBe('emerald');

        // Pion sur la barre = 25 pips
        const barBoard = new Array<number>(26).fill(0);
        barBoard[X_BAR] = 2;
        expect(calculatePlayerPips(barBoard, 'X')).toBe(50);
    });

    it('affiche le différentiel (+X en émeraude si en avance, -Y en rose si en retard) et supporte le mode Live Board (masquage tournoi)', () => {
        const aheadSnap = buildPipDifferentialSnapshot(110, 125, 'X');
        expect(aheadSnap.formattedDifferential).toBe('+15');
        expect(aheadSnap.colorTone).toBe('emerald');

        const behindSnap = buildPipDifferentialSnapshot(140, 128, 'X');
        expect(behindSnap.formattedDifferential).toBe('-12');
        expect(behindSnap.colorTone).toBe('rose');

        const { getByTestId, queryByTestId, rerender } = render(
            React.createElement(PipCountBadge, {
                pipX: 110,
                pipO: 125,
                turn: 'X',
            }),
        );

        expect(getByTestId('pip-value-x').textContent).toBe('110');
        expect(getByTestId('pip-value-o').textContent).toBe('125');
        expect(getByTestId('pip-diff-badge').textContent).toContain('+15');
        expect(getByTestId('pip-diff-badge').className).toContain('emerald');

        // Si X passe en retard (140 vs 125) au sous-dé suivant -> rose (-15)
        rerender(
            React.createElement(PipCountBadge, {
                pipX: 140,
                pipO: 125,
                turn: 'X',
            }),
        );
        expect(getByTestId('pip-diff-badge').textContent).toContain('-15');
        expect(getByTestId('pip-diff-badge').className).toContain('rose');

        // Activation du mode tournoi strict "Live Board" (masquage du Pip Count)
        fireEvent.click(getByTestId('pip-count-toggle'));
        expect(getByTestId('pip-count-bar').getAttribute('data-live-board-mode')).toBe('true');
        expect(getByTestId('pip-value-x').textContent).toBe('•••');
        expect(getByTestId('pip-value-o').textContent).toBe('•••');
        expect(queryByTestId('pip-diff-badge')).toBeNull();
    });
});
