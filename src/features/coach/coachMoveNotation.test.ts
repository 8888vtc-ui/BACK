/**
 * Tests de non-régression — notation ABSOLUE du plateau pour le Coach.
 *
 * Bug d'origine : la carte « Analyse de votre coup précédent » affichait
 * `13/9` alors que le pion blanc avait réellement été joué en case 11
 * (`13/11`). Cause : la notation affichée provenait d'un moteur en perspective
 * joueur (miroir `25 - p` pour O) au lieu de la numérotation absolue du plateau.
 */

import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    applyMove,
    X_BAR,
    O_BAR,
    X_OFF,
    O_OFF,
} from '../../engine/backgammonEngine';
import {
    formatCoachPoint,
    formatCoachSingleMove,
    formatCoachMoveSequence,
    formatCoachMoveSequenceFromBoard,
    movesFromBoardDiff,
    normalizeCoachNotation,
    relativeNotationToAbsolute,
} from './coachMoveNotation';

function makeBoard(
    xPoints: Record<number, number> = {},
    oPoints: Record<number, number> = {},
    xBar = 0,
    oBar = 0,
): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    board[X_BAR] = xBar;
    board[O_BAR] = -oBar;
    return board;
}

describe('formatCoachPoint / formatCoachSingleMove', () => {
    it('utilise la numérotation absolue 1..24, identique au plateau', () => {
        expect(formatCoachPoint(13)).toBe('13');
        expect(formatCoachPoint(11)).toBe('11');
        // En `from`, l'index 0/25 désigne la barre.
        expect(formatCoachPoint(X_BAR, false)).toBe('bar');
        expect(formatCoachPoint(O_BAR, false)).toBe('bar');
        // En `to`, le même index désigne la sortie (bear-off).
        expect(formatCoachPoint(X_OFF, true)).toBe('off');
        expect(formatCoachPoint(O_OFF, true)).toBe('off');
    });

    it('formate un sous-mouvement sans miroir, quel que soit le joueur', () => {
        expect(formatCoachSingleMove({ from: 13, to: 11 })).toBe('13/11');
        expect(formatCoachSingleMove({ from: 8, to: 5 })).toBe('8/5');
        expect(formatCoachSingleMove({ from: X_BAR, to: 20 })).toBe('bar/20');
        expect(formatCoachSingleMove({ from: 6, to: X_OFF })).toBe('6/off');
    });
});

describe('RÉGRESSION — le coup joué 13/11 ne doit JAMAIS s\'afficher 13/9', () => {
    it('concatène TOUS les sous-mouvements en numérotation absolue', () => {
        const board = createInitialState().board;
        // X joue 13 → 11 (dé 2) puis 8 → 5 (dé 3).
        const moves = [
            { from: 13, to: 11 },
            { from: 8, to: 5 },
        ];
        const notation = formatCoachMoveSequence(moves, 'X', board);
        expect(notation).toBe('13/11 8/5');
        expect(notation).not.toContain('13/9');
    });

    it('reproduit exactement le plateau final annoncé', () => {
        const board = createInitialState().board;
        const moves = [
            { from: 13, to: 11 },
            { from: 8, to: 5 },
        ];
        let expected = [...board];
        for (const m of moves) expected = applyMove(expected, m, 'X');

        const notation = formatCoachMoveSequence(moves, 'X', board);
        // Rejoue la notation absolue : chaque token est `from/to` absolu.
        let replay = [...board];
        for (const token of notation.split(' ')) {
            const [fromStr, toStr] = token.replace('*', '').split('/');
            const from = fromStr === 'bar' ? X_BAR : Number(fromStr);
            const to = toStr === 'off' ? X_OFF : Number(toStr);
            replay = applyMove(replay, { from, to }, 'X');
        }
        expect(replay).toEqual(expected);
        // La case 9 doit rester VIDE (le pion est bien allé en 11).
        expect(replay[9]).toBe(0);
        expect(replay[11]).toBe(board[11] + 1);
    });

    it('marque les frappes d\'un astérisque en numérotation absolue', () => {
        const board = makeBoard({ 13: 1 }, { 7: 1 });
        const notation = formatCoachMoveSequence([{ from: 13, to: 7 }], 'X', board);
        expect(notation).toBe('13/7*');
    });

    it('gère la sortie (bear-off) et la barre', () => {
        const board = makeBoard({ 6: 1 }, {}, 1, 0);
        expect(formatCoachMoveSequence([{ from: X_BAR, to: 20 }], 'X', board)).toBe('bar/20');
        expect(formatCoachMoveSequence([{ from: 6, to: X_OFF }], 'X', board)).toBe('6/off');
    });
});

describe('movesFromBoardDiff — reconstruction déterministe', () => {
    it('reconstruit 13/11 8/5 depuis les plateaux avant/après', () => {
        const before = createInitialState().board;
        let after = [...before];
        after = applyMove(after, { from: 13, to: 11 }, 'X');
        after = applyMove(after, { from: 8, to: 5 }, 'X');

        const moves = movesFromBoardDiff(before, after, 'X');
        expect(moves).toHaveLength(2);

        // La séquence doit reproduire exactement le plateau final.
        let replay = [...before];
        for (const m of moves) replay = applyMove(replay, m, 'X');
        expect(replay).toEqual(after);

        // Et la notation doit contenir 13/11 et 8/5 (ordre indifférent).
        const notation = formatCoachMoveSequenceFromBoard(before, after, 'X');
        expect(normalizeCoachNotation(notation)).toBe(normalizeCoachNotation('13/11 8/5'));
    });

    it('retourne une séquence vide si les plateaux sont identiques', () => {
        const board = createInitialState().board;
        expect(movesFromBoardDiff(board, board, 'X')).toEqual([]);
    });

    it('reconstruit une entrée depuis la barre', () => {
        const before = makeBoard({ 13: 5 }, { 19: 5 }, 1, 0);
        const after = applyMove(before, { from: X_BAR, to: 20 }, 'X');
        const moves = movesFromBoardDiff(before, after, 'X');
        expect(moves).toEqual([{ from: X_BAR, to: 20 }]);
    });

    it('reconstruit une sortie (bear-off)', () => {
        const before = makeBoard({ 6: 1, 5: 1 }, { 19: 5 });
        const after = applyMove(before, { from: 6, to: X_OFF }, 'X');
        const moves = movesFromBoardDiff(before, after, 'X');
        expect(moves).toEqual([{ from: 6, to: X_OFF }]);
    });
});

describe('relativeNotationToAbsolute — réparation des notations miroir', () => {
    it('convertit la notation relative de O vers la numérotation absolue', () => {
        // O joue de la flèche absolue 12 vers 15 (dé 3) : notation relative "13/10".
        expect(relativeNotationToAbsolute('13/10', 'O')).toBe('12/15');
        // O entre depuis la barre sur la flèche absolue 1 : notation relative "bar/24".
        expect(relativeNotationToAbsolute('bar/24', 'O')).toBe('bar/1');
        // O sort depuis la flèche absolue 24 : notation relative "1/off".
        expect(relativeNotationToAbsolute('1/off', 'O')).toBe('24/off');
    });

    it('laisse la notation de X inchangée', () => {
        expect(relativeNotationToAbsolute('13/11 8/5', 'X')).toBe('13/11 8/5');
    });

    it('préserve les astérisques de frappe', () => {
        expect(relativeNotationToAbsolute('13/7*', 'O')).toBe('12/18*');
    });
});

describe('normalizeCoachNotation', () => {
    it('est insensible à l\'ordre et aux astérisques', () => {
        expect(normalizeCoachNotation('13/11 8/5')).toBe(normalizeCoachNotation('8/5 13/11'));
        expect(normalizeCoachNotation('13/7*')).toBe(normalizeCoachNotation('13/7'));
    });

    it('retourne une chaîne vide pour une entrée vide', () => {
        expect(normalizeCoachNotation('')).toBe('');
    });
});
