import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleRequest, loadWasmAndWeights } from './gnubg.worker';
import { createInitialState } from '../engine/backgammonEngine';
import { WorkerRequest } from '../lib/engine/types';

describe('gnubg.worker', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('exécute une commande init et retourne l\'état du moteur', async () => {
        const req: WorkerRequest = {
            id: 'req_1',
            type: 'init',
            payload: { wasmUrl: '/engine/gnubg.wasm' },
        };
        const res = await handleRequest(req);
        expect(res).toBeDefined();
        expect(res.initialized).toBe(true);
    });

    it('traite une requête evaluate en lazy-loading', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'req_eval',
            type: 'evaluate',
            payload: { position: state, ply: 2 },
        };
        const res = await handleRequest(req);
        expect(res).toBeDefined();
        expect(res.xgid).toContain('XGID=');
        expect(res.probabilities.win).toBeGreaterThan(0.4);
    });

    it('traite une requête analyzeMoves et retourne les coups classés', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'req_moves',
            type: 'analyzeMoves',
            payload: { position: state, dice: [3, 1], maxMoves: 3 },
        };
        const res = await handleRequest(req);
        expect(res.moves.length).toBeLessThanOrEqual(3);
        expect(res.moves[0].rank).toBe(1);
        expect(res.moves[0].equityLoss).toBe(0.0);
    });

    it('traite une requête analyzeCube', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'req_cube',
            type: 'analyzeCube',
            payload: { position: state },
        };
        const res = await handleRequest(req);
        expect(res.optimalAction).toBeTruthy();
        expect(typeof res.noDouble).toBe('number');
    });

    it('traite une requête bestMove', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'req_best',
            type: 'bestMove',
            payload: { position: state, dice: [6, 1] },
        };
        const res = await handleRequest(req);
        expect(res).not.toBeNull();
        expect(res.rank).toBe(1);
        expect(res.notation).toBeTruthy();
        expect(res.sequence.moves.length).toBeGreaterThan(0);
    });

    it('lève une erreur pour un type de requête inconnu', async () => {
        const req: any = {
            id: 'req_unknown',
            type: 'unknown_command',
            payload: {},
        };
        await expect(handleRequest(req)).rejects.toThrow('Type de requête GNUBG inconnu');
    });
});
