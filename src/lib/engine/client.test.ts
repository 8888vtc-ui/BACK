import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    GnubgEngineClient,
    evaluate,
    analyzeMoves,
    analyzeCube,
    bestMove,
    initEngine,
    terminateEngine,
} from './client';
import { createInitialState } from '../../engine/backgammonEngine';
import { WorkerRequest, WorkerResponse } from './types';

const SAMPLE_XGID = 'XGID=-b----E-C---eE---c-e----B-:1:0:0:42:0:1:0:0:0:10';

describe('GnubgEngineClient & API JSON', () => {
    beforeEach(() => {
        terminateEngine();
    });

    afterEach(() => {
        terminateEngine();
    });

    describe('evaluate', () => {
        it('évalue une position XGID et retourne équités et probabilités', async () => {
            const res = await evaluate({
                position: SAMPLE_XGID,
                ply: 2,
            });

            expect(res).toBeDefined();
            expect(res.xgid).toBe(SAMPLE_XGID);
            expect(typeof res.cubelessEquity).toBe('number');
            expect(typeof res.cubefulEquity).toBe('number');
            expect(res.probabilities).toBeDefined();
            expect(res.probabilities.win).toBeGreaterThan(0);
            expect(res.probabilities.win).toBeLessThan(1);
            expect(res.probabilities.win + res.probabilities.loseWin).toBeCloseTo(1.0, 2);
        });

        it('évalue directement un objet BoardState', async () => {
            const state = createInitialState();
            state.dice = [3, 1];

            const res = await evaluate({
                position: state,
            });

            expect(res).toBeDefined();
            expect(res.xgid).toContain('XGID=');
            expect(res.probabilities.win).toBeGreaterThan(0.3);
        });
    });

    describe('analyzeMoves', () => {
        it('calcule et classe les coups légaux avec notation et équités', async () => {
            const state = createInitialState();
            const res = await analyzeMoves({
                position: state,
                dice: [3, 1],
                maxMoves: 5,
            });

            expect(res).toBeDefined();
            expect(res.moves.length).toBeGreaterThan(0);
            expect(res.moves.length).toBeLessThanOrEqual(5);

            const topMove = res.moves[0];
            expect(topMove.rank).toBe(1);
            expect(topMove.equityLoss).toBe(0.0);
            expect(topMove.notation).toBeTruthy();
            expect(topMove.probabilities).toBeDefined();
            expect(res.bestMove).toEqual(topMove);

            // Vérifie que les pertes d'équités sont négatives ou nulles
            for (let i = 1; i < res.moves.length; i++) {
                expect(res.moves[i].rank).toBe(i + 1);
                expect(res.moves[i].equityLoss).toBeLessThanOrEqual(0.001);
            }
        });
    });

    describe('analyzeCube', () => {
        it('retourne une décision de videau cohérente', async () => {
            const state = createInitialState();
            const res = await analyzeCube({
                position: state,
            });

            expect(res).toBeDefined();
            expect(res.xgid).toContain('XGID=');
            expect(typeof res.noDouble).toBe('number');
            expect(typeof res.doubleTake).toBe('number');
            expect(res.doublePass).toBe(1.0);
            expect(res.optimalAction).toBeTruthy();
        });

        it('respecte la règle de Crawford (aucun double)', async () => {
            const state = createInitialState(5);
            state.crawford = true;

            const res = await analyzeCube({
                position: state,
            });

            expect(res.optimalAction).toContain('Crawford');
        });
    });

    describe('bestMove', () => {
        it('retourne la séquence optimale et sa notation', async () => {
            const state = createInitialState();
            const res = await bestMove({
                position: state,
                dice: [4, 2],
                priority: 'high',
            });

            expect(res).toBeDefined();
            expect(res.rank).toBe(1);
            expect(res.notation).toMatch(/\d+\/\d+/);
            expect(res.sequence.moves.length).toBeGreaterThan(0);
            expect(res.sequence.board.length).toBe(26);
        });
    });

    describe('Cycle de vie & Worker personnalisé', () => {
        it('gère l\'initialisation explicite (initEngine)', async () => {
            await initEngine({
                wasmUrl: '/engine/gnubg.wasm',
                weightsUrl: '/engine/gnubg_nn.weights',
            });
            const client = new GnubgEngineClient();
            await client.init();
            expect(client.isReady()).toBe(true);
            const status = client.getStatus();
            expect(status.initialized).toBe(true);
            expect(status.pendingRequests).toBe(0);
        });

        it('communique correctement avec un Web Worker mocké', async () => {
            // Création d'un mock Worker simulant les échanges postMessage
            class MockWorker {
                onmessage: ((ev: MessageEvent<WorkerResponse>) => void) | null = null;
                onerror: ((ev: ErrorEvent) => void) | null = null;

                postMessage(req: WorkerRequest) {
                    setTimeout(() => {
                        if (this.onmessage) {
                            if (req.type === 'evaluate') {
                                this.onmessage(
                                    new MessageEvent('message', {
                                        data: {
                                            id: req.id,
                                            type: 'success',
                                            data: {
                                                xgid: SAMPLE_XGID,
                                                cubelessEquity: 0.12,
                                                cubefulEquity: 0.15,
                                                probabilities: {
                                                    win: 0.53,
                                                    winGammon: 0.14,
                                                    winBackgammon: 0.01,
                                                    loseWin: 0.47,
                                                    loseGammon: 0.12,
                                                    loseBackgammon: 0.01,
                                                },
                                                isWasm: true,
                                            },
                                        },
                                    }),
                                );
                            } else if (req.type === 'init') {
                                this.onmessage(
                                    new MessageEvent('message', {
                                        data: {
                                            id: req.id,
                                            type: 'success',
                                            data: { initialized: true, isWasm: true },
                                        },
                                    }),
                                );
                            }
                        }
                    }, 5);
                }

                terminate() { }
            }

            const clientWithWorker = new GnubgEngineClient({
                workerFactory: () => new MockWorker() as unknown as Worker,
            });

            await clientWithWorker.init();
            expect(clientWithWorker.isReady()).toBe(true);

            const result = await clientWithWorker.evaluate({ position: SAMPLE_XGID });
            expect(result.cubelessEquity).toBe(0.12);
            expect(result.isWasm).toBe(true);

            clientWithWorker.terminate();
            expect(clientWithWorker.isReady()).toBe(false);
        });

        it('gère les timeouts de requête', async () => {
            // Mock worker qui ne répond jamais
            class HangingWorker {
                onmessage: any = null;
                onerror: any = null;
                postMessage() { }
                terminate() { }
            }

            const hangingClient = new GnubgEngineClient({
                workerFactory: () => new HangingWorker() as unknown as Worker,
                defaultTimeoutMs: 50,
            });

            await expect(
                hangingClient.evaluate({ position: SAMPLE_XGID }),
            ).rejects.toThrow(/Timeout/);

            hangingClient.terminate();
        });

        it('gère les erreurs retournées par le worker', async () => {
            class ErrorWorker {
                onmessage: any = null;
                onerror: any = null;
                postMessage(req: WorkerRequest) {
                    setTimeout(() => {
                        if (this.onmessage) {
                            this.onmessage(
                                new MessageEvent('message', {
                                    data: {
                                        id: req.id,
                                        type: 'error',
                                        error: 'Position invalide dans le worker',
                                    },
                                }),
                            );
                        }
                    }, 5);
                }
                terminate() { }
            }

            const errorClient = new GnubgEngineClient({
                workerFactory: () => new ErrorWorker() as unknown as Worker,
            });

            await expect(
                errorClient.evaluate({ position: SAMPLE_XGID }),
            ).rejects.toThrow('Position invalide dans le worker');
        });
    });
});
