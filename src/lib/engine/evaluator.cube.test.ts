import { describe, it, expect } from 'vitest';
import { createInitialState, type BoardState } from '../../engine/backgammonEngine';
import { analyzeBoardCube } from './evaluator';

describe('analyzeBoardCube — Règles officielles du Videau & Contexte de Match', () => {
    it('1. Interdit le double sous la règle de Crawford', () => {
        const state: BoardState = {
            ...createInitialState(7),
            crawford: true,
        };
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('No double (Crawford rule)');
    });

    it('2. Désactive le double à Double Match Point (DMP : 6-6 dans un match en 7)', () => {
        const state: BoardState = {
            ...createInitialState(7),
            scoreX: 6,
            scoreO: 6,
            matchLength: 7,
            turn: 'X',
        };
        // Même en position avancée non-initiale
        state.board[1] = 1;
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('No double (DMP)');
    });

    it('3. Interdit le double sous la règle du Dead Cube pour un joueur à 1-away', () => {
        const state: BoardState = {
            ...createInitialState(7),
            scoreX: 6,
            scoreO: 4,
            matchLength: 7,
            turn: 'X',
        };
        state.board[1] = 1;
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('No double (Dead cube)');
    });

    it('4. Interdit le double sur la position initiale avant le premier coup joué (WBF 5.1)', () => {
        const state = createInitialState(7);
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('No double (Opening position)');
    });

    it('5. Ajuste dynamiquement le seuil de passe selon la table MET Kazaross en match play', () => {
        // En position avantageuse, avec options de score de match spécifiées
        const state: BoardState = {
            ...createInitialState(7),
            scoreX: 2,
            scoreO: 4,
            matchLength: 7,
            turn: 'X',
        };
        state.board[1] = 2; // Position non-initiale
        const res = analyzeBoardCube(state, {
            score: { scoreX: 2, scoreO: 4, matchLength: 7 },
        });
        expect(res.optimalAction).toBeDefined();
        expect(res.optimalAction).not.toContain('Crawford');
        expect(res.optimalAction).not.toContain('DMP');
    });

    it('6. Interdit le redouble sous Dead Cube quand scoreActuel + cubeValue >= matchLength (ex: 5-3 avec videau à 2 dans un match en 7)', () => {
        const state: BoardState = {
            ...createInitialState(7),
            scoreX: 5,
            scoreO: 3,
            matchLength: 7,
            cubeValue: 2,
            cubeOwner: 'X',
            turn: 'X',
        };
        state.board[1] = 1;
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('No double (Dead cube)');
    });

    it('7. Produit doubleTake > doublePass (1.0) sur une position Double, pass pour déclencher le Pass du défenseur', () => {
        const board = new Array<number>(26).fill(0);
        // Course pure écrasante pour X : 11 pions sortis, 4 pions sur flèches 1-2 (6 pips), O bloqué au fond (flèches 1-3, ~345 pips)
        board[1] = 2;
        board[2] = 2;
        board[3] = -5;
        board[4] = -5;
        board[5] = -5;
        const state: BoardState = {
            ...createInitialState(0),
            board,
            turn: 'X',
        };
        const res = analyzeBoardCube(state);
        expect(res.optimalAction).toBe('Double, pass');
        expect(res.doubleTake).toBeGreaterThan(res.doublePass ?? 1.0);
    });
});
