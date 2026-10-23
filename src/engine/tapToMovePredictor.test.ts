import { describe, it, expect } from 'vitest';
import { createInitialState, X_BAR, X_OFF } from './backgammonEngine';
import { predictBestTapMove, scoreDestination } from './tapToMovePredictor';

describe('tapToMovePredictor', () => {
    it('joue immédiatement quand 1 seule destination est possible (1-tap <16ms)', () => {
        const board = createInitialState().board;
        const res = predictBestTapMove({
            fromPoint: 8,
            board,
            player: 'X',
            leftTargets: [5],
            rightTargets: [],
            dice: [3, 1],
            activeDie: 0,
            isSelected: false,
        });

        expect(res.action).toBe('MOVE');
        expect(res.selectedTarget?.to).toBe(5);
        expect(res.selectedTarget?.die).toBe(0);
    });

    it('sélectionne le pion au 1er tap quand 2 destinations distinctes sont possibles', () => {
        const board = createInitialState().board;
        const res = predictBestTapMove({
            fromPoint: 13,
            board,
            player: 'X',
            leftTargets: [7], // dé 6
            rightTargets: [10], // dé 3
            dice: [6, 3],
            activeDie: 0,
            isSelected: false,
        });

        expect(res.action).toBe('SELECT');
        expect(res.destinations).toHaveLength(2);
    });

    it('joue au 2e tap (isSelected: true) la destination la plus haute scorée', () => {
        const board = createInitialState().board;
        const res = predictBestTapMove({
            fromPoint: 13,
            board,
            player: 'X',
            leftTargets: [7],
            rightTargets: [10],
            dice: [6, 3],
            activeDie: 0,
            isSelected: true,
        });

        expect(res.action).toBe('MOVE');
        expect(res.selectedTarget).toBeDefined();
    });

    it('priorise immédiatement la frappe d’un blot adverse sans attendre', () => {
        const board = [...createInitialState().board];
        board[7] = -1; // Blot adverse sur la flèche 7
        board[10] = 0; // Flèche 10 vide

        const res = predictBestTapMove({
            fromPoint: 13,
            board,
            player: 'X',
            leftTargets: [7],
            rightTargets: [10],
            dice: [6, 3],
            activeDie: 0,
            isSelected: false,
        });

        expect(res.action).toBe('MOVE');
        expect(res.selectedTarget?.to).toBe(7);
        expect(res.selectedTarget?.isHit).toBe(true);
    });

    it('attribue un fort score à la sortie de pion (bear-off)', () => {
        const board = new Array(28).fill(0);
        const scored = scoreDestination(3, X_OFF, 0, board, 'X', [3, 1], 0);

        expect(scored.isBearOff).toBe(true);
        expect(scored.score).toBeGreaterThan(70);
    });

    it('attribue un bonus prioritaire à la sortie de la barre (isBarReentry)', () => {
        const board = createInitialState().board;
        const barEntry = scoreDestination(X_BAR, 22, 0, board, 'X', [3, 1], 0);
        const normalAdvance = scoreDestination(13, 10, 0, board, 'X', [3, 1], 0);

        expect(barEntry.isBarReentry).toBe(true);
        expect(barEntry.score).toBeGreaterThan(normalAdvance.score);
    });
});
