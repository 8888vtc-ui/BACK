// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CoachDiceMatrix36 from './CoachDiceMatrix36';
import CoachLiveAiRadar from './CoachLiveAiRadar';
import CoachFooterTabs from './CoachFooterTabs';
import CoachCandidatesTable, { type CandidateRow } from './CoachCandidatesTable';
import { createInitialState } from '../../engine/backgammonEngine';

describe('Modules Coach IA dédiés au jeu contre l’IA (Grille 36, Contrefactuel, Seconde Chance, Radar)', () => {
    afterEach(() => {
        cleanup();
    });

    it('Module 1 — CoachDiceMatrix36 calcule et affiche la Grille 36 des lancers de l’IA avec détection exacte des frappes', () => {
        const { board } = createInitialState();
        // Exposons un blot de X sur la flèche 2 (devant les 2 pions O sur la flèche 1)
        board[2] = 1;

        render(<CoachDiceMatrix36 board={board} locale="fr" />);

        expect(screen.getByTestId('coach-dice-matrix-36')).toBeDefined();
        const cell11 = screen.getByTestId('matrix-cell-1-1');
        expect(cell11.getAttribute('data-status')).toBe('direct_hit');

        fireEvent.click(cell11);
        expect(screen.getByTestId('matrix-cell-detail').textContent).toContain('Frappe directe');
    });

    it('Module 1bis — CoachFooterTabs ouvre l’onglet Grille 36 en 1 clic', () => {
        const { board } = createInitialState();
        render(<CoachFooterTabs board={board} locale="fr" />);

        const matrixTab = screen.getByTestId('coach-footer-tab-matrix36');
        fireEvent.click(matrixTab);

        expect(screen.getByTestId('coach-footer-panel-matrix36')).toBeDefined();
        expect(screen.getByTestId('coach-dice-matrix-36')).toBeDefined();
    });

    it('Module 2 — CoachCandidatesTable affiche le comparateur contrefactuel « Pourquoi pas ce coup ? » au clic sur une ligne', () => {
        const candidates: CandidateRow[] = [
            { rank: 1, notation: '8/5 6/5', equity: 0.42, equityLoss: 0, winProbability: 0.61, gammonProbability: 0.18 },
            { rank: 2, notation: '24/20 13/11', equity: 0.31, equityLoss: -0.11, winProbability: 0.56, gammonProbability: 0.14 },
        ];

        render(<CoachCandidatesTable candidates={candidates} playedMove="24/20 13/11" locale="fr" />);

        const row2 = screen.getByTestId('coach-candidate-row-2');
        fireEvent.click(row2);

        const counterfactual = screen.getByTestId('coach-counterfactual-box');
        expect(counterfactual.textContent).toContain('Pourquoi pas 24/20 13/11');
        expect(counterfactual.textContent).toContain('-0.110');
        expect(counterfactual.textContent).toContain('Point 5');
    });

    it('Modules 3 & 4 — CoachLiveAiRadar affiche l’EPC de Trice, la posture Magriel, le Take Point GTO et le bouton Seconde Chance sur Blunder', () => {
        const { board } = createInitialState();
        const onReplayMove = vi.fn();

        render(
            <CoachLiveAiRadar
                board={board}
                verdict="blunder"
                equityLoss={-0.125}
                onReplayMove={onReplayMove}
                locale="fr"
            />,
        );

        expect(screen.getByTestId('coach-live-ai-radar')).toBeDefined();
        expect(screen.getByTestId('radar-trice-epc').textContent).toContain('vs');
        expect(screen.getByTestId('radar-magriel-posture')).toBeDefined();
        expect(screen.getByTestId('radar-janowski-tp').textContent).toContain('TP');

        const secondChanceBanner = screen.getByTestId('coach-second-chance-banner');
        expect(secondChanceBanner.textContent).toContain('-0.125 Eq');

        const replayBtn = screen.getByTestId('coach-second-chance-replay-btn');
        fireEvent.click(replayBtn);
        expect(onReplayMove).toHaveBeenCalledTimes(1);
    });
});
