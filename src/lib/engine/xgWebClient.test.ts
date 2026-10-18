import { describe, it, expect, beforeAll } from 'vitest';
import { initXgWeb, isXgWebReady, getXgWebBestMove, getXgWebEvaluation } from './xgWebClient';
import { createInitialState, generateLegalMoves } from '../../engine/backgammonEngine';

describe('XG-Web Client WASM (Niveau Expert & Grand-Maître XG++++)', () => {
    beforeAll(async () => {
        const ok = await initXgWeb('public/engine/xg_web_core.wasm');
        expect(ok).toBe(true);
    });

    it('initialise correctement le runtime WASM XG-Web', () => {
        expect(isXgWebReady()).toBe(true);
    });

    it('évalue la position initiale avec une équité cubeless quasi-nulle', () => {
        const state = createInitialState(0);
        const evalResult = getXgWebEvaluation(state.board, 'X');
        expect(evalResult).not.toBeNull();
        expect(evalResult!.win).toBeGreaterThan(0.40);
        expect(evalResult!.win).toBeLessThan(0.60);
        expect(Math.abs(evalResult!.cubelessEquity)).toBeLessThan(0.15);
    });

    it('trouve un coup valide à 2-ply (Niveau Expert)', () => {
        const state = createInitialState(0);
        const dice: [number, number] = [3, 1];
        const legalSeqs = generateLegalMoves({ ...state, turn: 'X' }, dice);
        expect(legalSeqs.length).toBeGreaterThan(0);

        const bestSeq = getXgWebBestMove(state.board, 'X', dice, legalSeqs, 2);
        expect(bestSeq).not.toBeNull();
        expect(bestSeq!.moves.length).toBeGreaterThan(0);
        expect(legalSeqs.some(seq => seq === bestSeq)).toBe(true);
    });

    it('trouve un coup valide à 3-ply sélectif (Niveau Grand-Maître XG++++)', () => {
        const state = createInitialState(0);
        const dice: [number, number] = [6, 1];
        const legalSeqs = generateLegalMoves({ ...state, turn: 'X' }, dice);
        expect(legalSeqs.length).toBeGreaterThan(0);

        const bestSeq = getXgWebBestMove(state.board, 'X', dice, legalSeqs, 3);
        expect(bestSeq).not.toBeNull();
        expect(bestSeq!.moves.length).toBeGreaterThan(0);
        expect(legalSeqs.some(seq => seq === bestSeq)).toBe(true);
    });
});
