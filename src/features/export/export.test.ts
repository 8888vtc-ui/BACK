import { describe, it, expect } from 'vitest';
import {
    serializeToSGF,
    parseSGF,
    serializeToXGID,
    parseFromXGID,
    isValidXGID,
    generateShareUrl,
} from './index';
import { createInitialState } from '../../engine/backgammonEngine';
import type { MatchExportData } from './types';

describe('Export / Import Feature', () => {
    const initialState = createInitialState(7);

    describe('XGID', () => {
        it('sérialise et parse un état initial avec exactitude', () => {
            const xgid = serializeToXGID(initialState);
            expect(xgid).toBe('XGID=-b----E-C---eE---c-e----B-:0:0:1:00:0:0:0:0:7');
            expect(isValidXGID(xgid)).toBe(true);

            const parsed = parseFromXGID(xgid);
            expect(parsed.turn).toBe('X');
            expect(parsed.cubeValue).toBe(1);
            expect(parsed.matchLength).toBe(7);
            expect(parsed.board[1]).toBe(-2);
            expect(parsed.board[6]).toBe(5);
            expect(parsed.board[24]).toBe(2);
        });

        it('valide et rejette les chaînes XGID incorrectes', () => {
            expect(isValidXGID('XGID=invalid')).toBe(false);
            expect(isValidXGID('')).toBe(false);
        });
    });

    describe('SGF (Smart Game Format GM[6])', () => {
        it('sérialise une partie complète au format SGF officiel', () => {
            const exportData: MatchExportData = {
                gameId: 'game_test_123',
                playerX: 'Alice',
                playerO: 'Bob',
                matchLength: 7,
                scoreX: 3,
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
                ],
            };

            const sgf = serializeToSGF(exportData);
            expect(sgf).toContain('GM[6]');
            expect(sgf).toContain('PB[Alice]');
            expect(sgf).toContain('PW[Bob]');
            expect(sgf).toContain('RE[X+2]');
            expect(sgf).toContain(';B[31]8/5 6/5');
            expect(sgf).toContain(';W[65]1/12');

            // Vérification du parsing
            const parsed = parseSGF(sgf);
            expect(parsed.playerX).toBe('Alice');
            expect(parsed.playerO).toBe('Bob');
            expect(parsed.matchLength).toBe(7);
            expect(parsed.moves).toHaveLength(2);
            expect(parsed.moves[0].player).toBe('X');
            expect(parsed.moves[0].dice).toEqual([3, 1]);
            expect(parsed.moves[0].notation).toBe('8/5 6/5');
            expect(parsed.moves[1].player).toBe('O');
            expect(parsed.moves[1].dice).toEqual([6, 5]);
            expect(parsed.moves[1].notation).toBe('1/12');
        });

        it('lève une erreur sur un SGF vide ou corrompu', () => {
            expect(() => parseSGF('invalid')).toThrow();
        });
    });

    describe('Share Link', () => {
        it('génère une URL de partage valide contenant le paramètre xgid', () => {
            const url = generateShareUrl(initialState, 'https://mybackgammon.com');
            expect(url).toContain('https://mybackgammon.com/?xgid=XGID%3D');

            const urlObj = new URL(url);
            const xgidParam = urlObj.searchParams.get('xgid');
            expect(xgidParam).toBeDefined();
            expect(isValidXGID(xgidParam!)).toBe(true);
        });
    });
});
