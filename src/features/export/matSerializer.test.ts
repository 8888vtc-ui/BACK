import { describe, it, expect } from 'vitest';
import { serializeToMAT, parseMAT } from './matSerializer';
import { createInitialState } from '../../engine/backgammonEngine';
import type { MatchExportData } from './types';

describe('JellyFish / Backgammon Galaxy (.mat) Serializer & Parser', () => {
    const initialState = createInitialState(7);

    it('sérialise et parse un match complet au format .mat sans perte', () => {
        const exportData: MatchExportData = {
            gameId: 'mat_test_1',
            playerX: 'Mochy',
            playerO: 'Sander',
            matchLength: 7,
            scoreX: 4,
            scoreO: 2,
            winner: 'X',
            pointsWon: 2,
            currentState: initialState,
            turnsHistory: [
                {
                    turnNumber: 1,
                    player: 'X',
                    dice: [3, 1],
                    boardBefore: initialState.board,
                    boardAfter: initialState.board,
                    moves: [
                        { from: 8, to: 5 },
                        { from: 6, to: 5 },
                    ],
                },
                {
                    turnNumber: 2,
                    player: 'O',
                    dice: [6, 5],
                    boardBefore: initialState.board,
                    boardAfter: initialState.board,
                    moves: [{ from: 24, to: 13 }],
                },
                {
                    turnNumber: 3,
                    player: 'X',
                    dice: [4, 2],
                    boardBefore: initialState.board,
                    boardAfter: initialState.board,
                    moves: [
                        { from: 8, to: 4 },
                        { from: 6, to: 4 },
                    ],
                },
            ],
        };

        const matText = serializeToMAT(exportData);
        expect(matText).toContain('7 point match');
        expect(matText).toContain('Mochy : 4');
        expect(matText).toContain('Sander : 2');
        expect(matText).toContain('31: 8/5 6/5');
        expect(matText).toContain('65: 1/12');
        expect(matText).toContain('Wins 2 points');

        const parsed = parseMAT(matText);
        expect(parsed.matchLength).toBe(7);
        expect(parsed.playerX).toBe('Mochy');
        expect(parsed.playerO).toBe('Sander');
        expect(parsed.scoreX).toBe(4);
        expect(parsed.scoreO).toBe(2);
        expect(parsed.winner).toBe('X');
        expect(parsed.pointsWon).toBe(2);
        expect(parsed.moves).toHaveLength(3);
        expect(parsed.moves[0]).toEqual({ player: 'X', dice: [3, 1], notation: '8/5 6/5' });
        expect(parsed.moves[1]).toEqual({ player: 'O', dice: [6, 5], notation: '1/12' });
        expect(parsed.moves[2]).toEqual({ player: 'X', dice: [4, 2], notation: '8/4 6/4' });
    });

    it('rejette un fichier .mat vide ou dépourvu de structure', () => {
        expect(() => parseMAT('')).toThrow();
        expect(() => parseMAT('texte quelconque invalide')).toThrow();
    });
});
