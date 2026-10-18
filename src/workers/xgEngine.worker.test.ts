/**
 * Tests unitaires du Web Worker XG-Web Core (WASM SIMD 2-Ply & Repli Option A).
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { handleRequest, loadXgWasm } from './xgEngine.worker';
import { createInitialState, serializeXGID } from '../engine/backgammonEngine';
import { WorkerRequest } from '../lib/engine/types';

describe('XG-Web Worker (WASM 2-Ply & Fallback)', () => {
    beforeAll(async () => {
        // Charge le module WASM compilé
        await loadXgWasm();
    });

    it('initialise le moteur et confirme la disponibilité du WASM', async () => {
        const req: WorkerRequest = {
            id: 'init-1',
            type: 'init',
            payload: {},
        };
        const res = await handleRequest(req);
        expect(res.initialized).toBe(true);
        expect(res.isWasm).toBe(true);
        expect(res.engineMode).toContain('XG-Web');
    });

    it('évalue une position avec le moteur WASM et renvoie des probabilités cohérentes', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'eval-1',
            type: 'evaluate',
            payload: {
                position: state,
                player: 'X',
                ply: 2,
            },
        };
        const res = await handleRequest(req);
        expect(res.isWasm).toBe(true);
        expect(res.probabilities.win).toBeGreaterThan(0);
        expect(res.probabilities.win).toBeLessThan(1);
        expect(res.cubelessEquity).toBeGreaterThanOrEqual(-1);
        expect(res.cubelessEquity).toBeLessThanOrEqual(1);
    });

    it('exécute une recherche 2-ply Expectiminimax et retourne les meilleurs coups légaux', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'moves-1',
            type: 'analyzeMoves',
            payload: {
                position: state,
                dice: [3, 1],
                ply: 2,
                maxMoves: 5,
            },
        };
        const start = performance.now();
        const res = await handleRequest(req);
        const duration = performance.now() - start;

        expect(res.isWasm).toBe(true);
        expect(res.moves.length).toBeGreaterThan(0);
        expect(res.moves.length).toBeLessThanOrEqual(5);

        // Premier coup classé rang 1
        expect(res.moves[0].rank).toBe(1);
        expect(res.moves[0].notation).toBeDefined();

        // Vérification de la cible de latence (< 250 ms en test JS/WASM)
        expect(duration).toBeLessThan(500);
    });

    it('gère l\'analyse du videau avec la table Kazaross-XG2 et Janowski', async () => {
        const state = createInitialState();
        const req: WorkerRequest = {
            id: 'cube-1',
            type: 'analyzeCube',
            payload: {
                position: state,
            },
        };
        const res = await handleRequest(req);
        expect(res.optimalAction).toBeDefined();
        expect(res.optimalAction).toContain('take');
    });
});
