import { describe, it, expect } from 'vitest';
import { X_BAR, O_BAR } from './backgammonEngine';
import {
    BAR_FANNED_AUTO_PASS_MS,
    BAR_DANCED_MESSAGE,
    getPlayerBarPoint,
    getPlayerBarCount,
    hasCheckerOnBar,
    isOpponentInnerBoardPoint,
    getBarEntryPointForDie,
    isBarEntryOpenForDie,
    getLegalBarEntryPoints,
    isPointLockedByBar,
    isDancedOnBar,
} from './barRules';

describe('barRules (Audit 3/20 — Sortie de la Barre)', () => {
    it('expose BAR_FANNED_AUTO_PASS_MS = 800ms et un message de danse explicite', () => {
        expect(BAR_FANNED_AUTO_PASS_MS).toBe(800);
        expect(BAR_DANCED_MESSAGE).toContain('Aucun coup possible');
    });

    it('détecte les pions sur la barre pour X (index 0) et O (index 25)', () => {
        const board = new Array<number>(26).fill(0);
        expect(hasCheckerOnBar(board, 'X')).toBe(false);
        expect(hasCheckerOnBar(board, 'O')).toBe(false);

        board[X_BAR] = 2;
        board[O_BAR] = -1;
        expect(getPlayerBarPoint('X')).toBe(X_BAR);
        expect(getPlayerBarPoint('O')).toBe(O_BAR);
        expect(getPlayerBarCount(board, 'X')).toBe(2);
        expect(getPlayerBarCount(board, 'O')).toBe(1);
        expect(hasCheckerOnBar(board, 'X')).toBe(true);
        expect(hasCheckerOnBar(board, 'O')).toBe(true);
    });

    it('identifie strictement le jan intérieur adverse (19..24 pour X, 1..6 pour O)', () => {
        expect(isOpponentInnerBoardPoint(24, 'X')).toBe(true);
        expect(isOpponentInnerBoardPoint(19, 'X')).toBe(true);
        expect(isOpponentInnerBoardPoint(18, 'X')).toBe(false);
        expect(isOpponentInnerBoardPoint(1, 'X')).toBe(false);

        expect(isOpponentInnerBoardPoint(1, 'O')).toBe(true);
        expect(isOpponentInnerBoardPoint(6, 'O')).toBe(true);
        expect(isOpponentInnerBoardPoint(7, 'O')).toBe(false);
        expect(isOpponentInnerBoardPoint(24, 'O')).toBe(false);
    });

    it('calcule uniquement les points d’entrée légaux dans le jan intérieur adverse', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        board[24] = -2; // Porte fermée pour l'as (25 - 1 = 24)
        board[21] = -1; // Blot adverse prenable pour le 4 (25 - 4 = 21)

        expect(getBarEntryPointForDie('X', 1)).toBe(24);
        expect(getBarEntryPointForDie('X', 4)).toBe(21);
        expect(isBarEntryOpenForDie(board, 'X', 1)).toBe(false);
        expect(isBarEntryOpenForDie(board, 'X', 4)).toBe(true);

        const entries = getLegalBarEntryPoints(board, 'X', undefined, undefined, [1, 4], [false, false]);
        expect(Array.from(entries)).toEqual([21]);
    });

    it('verrouille tous les autres pions du joueur (1..24) tant que bar[player] > 0', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        board[13] = 5; // Pions de X sur le point 13
        board[6] = -3; // Pions de O sur le point 6

        expect(isPointLockedByBar(board, 'X', 13)).toBe(true);
        expect(isPointLockedByBar(board, 'X', 6)).toBe(false);
        expect(isPointLockedByBar(board, 'X', X_BAR)).toBe(false);

        board[X_BAR] = 0;
        expect(isPointLockedByBar(board, 'X', 13)).toBe(false);
    });

    it('détecte l’état Danced / Fanned quand aucun dé ne permet de rentrer', () => {
        const board = new Array<number>(26).fill(0);
        board[X_BAR] = 1;
        board[23] = -2; // Bloque le 2
        board[20] = -3; // Bloque le 5

        expect(isDancedOnBar(board, 'X', [2, 5])).toBe(true);
        expect(isDancedOnBar(board, 'X', [2, 4])).toBe(false); // 21 est ouvert
    });
});
