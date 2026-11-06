import { describe, it, expect, vi } from 'vitest';
import {
    BoardState,
    Player,
    generateLegalMoves,
    computeLegalTargets,
    X_BAR,
    O_BAR,
} from '../backgammonEngine';
import {
    hasCheckerOnBar,
    getPlayerBarCount,
    isPointLockedByBar,
    isDancedOnBar,
    getLegalBarEntryPoints,
    BAR_DANCED_MESSAGE,
    BAR_DANCED_MESSAGE_EN,
    getBarDancedMessage,
} from '../barRules';

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

function makeState(board: number[], turn: Player = 'X'): BoardState {
    return {
        board,
        turn,
        cubeValue: 1,
        cubeOwner: null,
        dice: null,
        matchLength: 0,
        scoreX: 0,
        scoreO: 0,
        crawford: false,
        doubled: false,
        resigned: 0,
    };
}

describe('Mission 27 : Contrôle Intensif Bar Entry, 2 Checkers Lock & Fanning', () => {
    describe('1. Un seul pion sur la barre : interdiction absolue de bouger un autre pion', () => {
        it('Pour X : Tous les pions sur le plateau sont verrouillés tant que bar[X] > 0', () => {
            const board = makeBoard({ 13: 5, 8: 3, 6: 5 }, { 24: 2, 12: 13 }, 1, 0);
            expect(hasCheckerOnBar(board, 'X')).toBe(true);
            expect(getPlayerBarCount(board, 'X')).toBe(1);

            // Vérification du verrouillage de toutes les flèches du plateau
            for (const pt of [13, 8, 6]) {
                expect(isPointLockedByBar(board, 'X', pt)).toBe(true);
            }

            // Génération des coups : le premier coup part OBLIGATOIREMENT de X_BAR
            const moves = generateLegalMoves(makeState(board, 'X'), [6, 2]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves[0].from).toBe(X_BAR);
            }

            // Les cibles légales n'ont QUE la barre comme origine
            const targets = computeLegalTargets(makeState(board, 'X'), [6, 2], [false, false]);
            expect(targets.leftDieTargets.has(13)).toBe(false);
            expect(targets.leftDieTargets.has(8)).toBe(false);
            expect(targets.leftDieTargets.has(6)).toBe(false);
            expect(targets.leftDieTargets.has(X_BAR) || targets.rightDieTargets.has(X_BAR)).toBe(true);
        });

        it('Pour O : Tous les pions sur le plateau sont verrouillés tant que bar[O] < 0', () => {
            const board = makeBoard({ 1: 2, 12: 13 }, { 12: 5, 17: 3, 19: 5 }, 0, 1);
            expect(hasCheckerOnBar(board, 'O')).toBe(true);
            expect(getPlayerBarCount(board, 'O')).toBe(1);

            for (const pt of [12, 17, 19]) {
                expect(isPointLockedByBar(board, 'O', pt)).toBe(true);
            }

            const moves = generateLegalMoves(makeState(board, 'O'), [5, 3]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves[0].from).toBe(O_BAR);
            }
        });
    });

    describe('2. Deux pions sur la barre : rentrée partielle et blocage strict du 2e dé', () => {
        it('Pour X avec 2 pions sur la barre et 1 seul dé ouvert : rentre 1 pion et perd le 2e dé', () => {
            // X a 2 pions sur la barre. Dés [6, 2].
            // Case 25-6 = 19 fermée (2 pions O).
            // Case 25-2 = 23 ouverte (0 pion O).
            // X rentre 1 pion sur 23 avec le 2.
            // Il reste 1 pion sur la barre, la case 19 est fermée => Le dé 6 est PERDU !
            // Aucun pion sur le plateau (y compris celui en 23) ne peut jouer le 6.
            const board = makeBoard({ 8: 5, 6: 8 }, { 19: 2, 12: 13 }, 2, 0);
            expect(getPlayerBarCount(board, 'X')).toBe(2);

            const moves = generateLegalMoves(makeState(board, 'X'), [6, 2]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toHaveLength(1);
            expect(moves[0].moves[0]).toEqual({ from: X_BAR, to: 23 });

            // Après ce coup, le plateau résultant conserve exactement 1 pion sur la barre
            expect(moves[0].board[X_BAR]).toBe(1);
            expect(moves[0].board[23]).toBe(1);
        });

        it('Pour O avec 2 pions sur la barre et 1 seul dé ouvert : rentre 1 pion et perd le 2e dé', () => {
            // O a 2 pions sur la barre. Dés [5, 1].
            // Case 0+5 = 5 fermée (2 pions X).
            // Case 0+1 = 1 ouverte.
            // O rentre 1 pion en 1 avec le 1, et perd le 5.
            const board = makeBoard({ 5: 2, 12: 13 }, { 17: 5, 19: 8 }, 0, 2);
            expect(getPlayerBarCount(board, 'O')).toBe(2);

            const moves = generateLegalMoves(makeState(board, 'O'), [5, 1]);
            expect(moves).toHaveLength(1);
            expect(moves[0].moves).toHaveLength(1);
            expect(moves[0].moves[0]).toEqual({ from: O_BAR, to: 1 });
            expect(moves[0].board[O_BAR]).toBe(-1);
            expect(moves[0].board[1]).toBe(-1);
        });

        it('Pour X avec 2 pions sur la barre et 2 dés ouverts : rentre obligatoirement les 2 pions', () => {
            // Dés [5, 2]. Cases 25-5 = 20 et 25-2 = 23 ouvertes.
            const board = makeBoard({ 6: 13 }, { 12: 15 }, 2, 0);
            const moves = generateLegalMoves(makeState(board, 'X'), [5, 2]);
            expect(moves.length).toBeGreaterThan(0);
            for (const seq of moves) {
                expect(seq.moves).toHaveLength(2);
                expect(seq.moves[0].from).toBe(X_BAR);
                expect(seq.moves[1].from).toBe(X_BAR);
                expect(seq.board[X_BAR]).toBe(0);
            }
        });
    });

    describe('3. Danse sur la barre (Fanning / Portes Fermées) : auto-pass propre sans gel', () => {
        it('Pour X : Danse complète lorsque les 6 portes du jan intérieur adverse sont fermées', () => {
            // Jan intérieur de O (19..24) 100% fermé par des portes de 2 pions O
            const board = makeBoard({ 1: 14 }, { 19: 2, 20: 2, 21: 2, 22: 2, 23: 2, 24: 2, 13: 3 }, 1, 0);
            expect(hasCheckerOnBar(board, 'X')).toBe(true);

            // N'importe quel jet de dés produit 0 coup légal
            for (const dice of [[6, 1], [5, 2], [4, 3], [6, 6]] as [number, number][]) {
                const moves = generateLegalMoves(makeState(board, 'X'), dice);
                expect(moves).toHaveLength(0);

                const entries = getLegalBarEntryPoints(board, 'X', undefined, undefined, dice);
                expect(entries.size).toBe(0);

                expect(isDancedOnBar(board, 'X', dice)).toBe(true);
            }

            expect(BAR_DANCED_MESSAGE).toContain('Portes fermées — Tour passé');
            expect(BAR_DANCED_MESSAGE_EN).toContain('Blocked on the bar — Turn passed');
            expect(getBarDancedMessage('fr')).toContain('Portes fermées — Tour passé');
            expect(getBarDancedMessage('en')).toContain('Blocked on the bar — Turn passed');
        });

        it('Pour O : Danse complète lorsque les 6 portes de X (1..6) sont fermées', () => {
            const board = makeBoard({ 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 13: 3 }, { 24: 14 }, 0, 1);
            expect(hasCheckerOnBar(board, 'O')).toBe(true);

            const moves = generateLegalMoves(makeState(board, 'O'), [4, 2]);
            expect(moves).toHaveLength(0);
            expect(isDancedOnBar(board, 'O', [4, 2])).toBe(true);
        });
    });
});
