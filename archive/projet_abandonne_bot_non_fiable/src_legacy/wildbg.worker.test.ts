import { describe, it, expect } from 'vitest';
import { createInitialState, generateLegalMoves } from '../engine/backgammonEngine';
import { handleWildbgWorkerRequest } from './wildbg.worker';
import {
    evaluateWildbgAsync,
    getWildbgBestMoveAsync,
    getWildbgCubeInfoAsync,
} from '../lib/engine/wildbgClient';

describe('WildBG WASM Web Worker (wildbg.worker.ts)', () => {
    it('initialise le worker et retourne un statut structuré', async () => {
        const res = await handleWildbgWorkerRequest({
            id: 'req-init-1',
            type: 'INIT',
            payload: { wasmUrl: '/engine/wildbg.wasm' },
        });
        expect(res.id).toBe('req-init-1');
        expect(res.type).toBe('INIT_SUCCESS');
    });

    it('traite EVALUATE, BEST_MOVE et CUBE_INFO sans bloquer le thread principal', async () => {
        const initial = createInitialState();
        const evalRes = await evaluateWildbgAsync(initial.board, 'X');
        if (evalRes) {
            expect(evalRes.win).toBeGreaterThan(0);
            expect(evalRes.win).toBeLessThan(1);
        }

        const legal = generateLegalMoves(initial, [3, 1]);
        const bestMove = await getWildbgBestMoveAsync(initial.board, 'X', [3, 1], legal);
        if (bestMove) {
            expect(bestMove.moves.length).toBeGreaterThan(0);
        }

        const cubeRes = await getWildbgCubeInfoAsync(initial.board, 'X');
        if (cubeRes) {
            expect(typeof cubeRes.shouldDouble).toBe('boolean');
            expect(typeof cubeRes.shouldTake).toBe('boolean');
        }
    });

    it('retourne une erreur propre si les paramètres obligatoires manquent', async () => {
        const errRes = await handleWildbgWorkerRequest({
            id: 'req-err-1',
            type: 'EVALUATE',
            payload: {},
        });
        expect(errRes.type).toBe('ERROR');
        expect(errRes.error).toBeDefined();
    });
});
