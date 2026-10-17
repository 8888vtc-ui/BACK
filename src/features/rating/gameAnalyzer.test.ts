import { describe, it, expect } from 'vitest';
import { analyzeCompleteGame } from './gameAnalyzer';
import type { RawGameTurn } from './types';
import { createInitialState } from '../../engine/backgammonEngine';

describe('gameAnalyzer Module', () => {
    it('calcule une analyse parfaite avec PR=0 quand tous les coups sont optimaux', () => {
        const initial = createInitialState(7);

        const turns: RawGameTurn[] = [
            {
                turnNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: initial.board,
                boardAfter: initial.board,
                moves: [
                    { from: 8, to: 5 },
                    { from: 6, to: 5 },
                ],
            },
        ];

        const analysis = analyzeCompleteGame(turns, {
            targetPlayer: 'X',
            gameId: 'game_test_optimal',
            winner: 'X',
            winType: 'single',
        });

        expect(analysis.gameId).toBe('game_test_optimal');
        expect(analysis.totalMovesCount).toBe(1);
        expect(analysis.unforcedDecisionsCount).toBe(1);
        expect(analysis.totalEquityLoss).toBe(0);
        expect(analysis.performanceRating).toBe(0);
        expect(analysis.prCategory).toBe('Grand-Maître');
        expect(analysis.estimatedRating).toBeGreaterThanOrEqual(2100);
        expect(analysis.breakdown.optimal).toBe(1);
        expect(analysis.breakdown.blunder).toBe(0);
    });

    it('détecte et pénalise un coup fautif (blunder)', () => {
        const initial = createInitialState(7);

        const turns: RawGameTurn[] = [
            {
                turnNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: initial.board,
                boardAfter: initial.board,
                // Mauvais coup d'ouverture : 24/21 13/12 au lieu de 8/5 6/5
                moves: [
                    { from: 24, to: 21 },
                    { from: 13, to: 12 },
                ],
            },
        ];

        const analysis = analyzeCompleteGame(turns, {
            targetPlayer: 'X',
            gameId: 'game_test_blunder',
        });

        expect(analysis.unforcedDecisionsCount).toBe(1);
        expect(analysis.totalEquityLoss).toBeGreaterThan(0.08);
        expect(analysis.performanceRating).toBeGreaterThan(3.0);
        expect(['blunder', 'howler']).toContain(analysis.evaluatedMoves[0].verdict);
        expect(analysis.breakdown.blunder + analysis.breakdown.howler).toBe(1);
    });

    it('ignore les coups de l’adversaire lors de l’analyse du joueur X', () => {
        const initial = createInitialState(7);

        const turns: RawGameTurn[] = [
            {
                turnNumber: 1,
                player: 'X',
                dice: [3, 1],
                boardBefore: initial.board,
                boardAfter: initial.board,
                moves: [
                    { from: 8, to: 5 },
                    { from: 6, to: 5 },
                ],
            },
            {
                turnNumber: 2,
                player: 'O',
                dice: [6, 5],
                boardBefore: initial.board,
                boardAfter: initial.board,
                moves: [{ from: 1, to: 12 }],
            },
        ];

        const analysis = analyzeCompleteGame(turns, { targetPlayer: 'X' });
        expect(analysis.totalMovesCount).toBe(1);
        expect(analysis.evaluatedMoves[0].player).toBe('X');
    });
});
