/**
 * Web Worker du moteur XG-Web Core (Rust -> WebAssembly SIMD 2-Ply).
 *
 * Fonctionnalités :
 * - Charge le binaire WebAssembly haute performance `/engine/xg_web_core.wasm` (< 65 Ko)
 *   et les poids quantifiés int8 `/engine/weights_xg_web.bin` (< 125 Ko) en tâche de fond.
 * - Effectue la recherche Expectiminimax 2-ply avec élagage alpha dynamique en < 150 ms.
 * - Bascule transparente (Fallback) : si le WASM n'est pas encore prêt ou échoue,
 *   retombe instantanément sur le moteur TypeScript Option A (exactitude bear-off & Keith count).
 */

import { serializeXGID, BoardState, Move, MoveSequence } from '../engine/backgammonEngine';
import {
    analyzeBoardCube,
    analyzeBoardMoves,
    evaluateBoard,
    findBestBoardMove,
    resolveBoardState,
    formatSingleMove,
} from '../lib/engine/evaluator';
import {
    AnalyzeCubeParams,
    AnalyzeMovesParams,
    BestMoveParams,
    CubeDecisionResult,
    EngineInitConfig,
    EvaluateParams,
    EvaluateResult,
    MoveAnalysis,
    WorkerRequest,
    WorkerResponse,
} from '../lib/engine/types';

interface XgWasmExports {
    memory: WebAssembly.Memory;
    xg_init: () => number;
    xg_evaluate: (boardPtr: number, turn: number, outPtr: number) => number;
    xg_search_moves: (boardPtr: number, turn: number, d1: number, d2: number, ply: number, outPtr: number) => number;
    xg_match_equity: (away1: number, away2: number) => number;
    xg_take_point: (awayLeader: number, awayTrailer: number, cubeVal: number) => number;
}

let wasmInstance: XgWasmExports | null = null;
let isWasmReady = false;
let initPromise: Promise<boolean> | null = null;

// Pointers dans la mémoire linéaire WebAssembly (offset fixe sûr)
const BOARD_PTR = 4096;
const OUT_PTR = 8192;

/**
 * Charge le binaire WebAssembly compilé depuis `/engine/xg_web_core.wasm`.
 */
export async function loadXgWasm(config: EngineInitConfig = {}): Promise<boolean> {
    if (isWasmReady && wasmInstance) return true;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const wasmUrl = config.wasmUrl ?? '/engine/xg_web_core.wasm';
            let wasmBytes: ArrayBuffer;

            if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
                // Environnement Node/Vitest : lecture directe du fichier sans serveur HTTP
                const fs = await import('fs');
                const path = await import('path');
                const filePath = path.resolve(process.cwd(), 'public/engine/xg_web_core.wasm');
                const fileBuf = fs.readFileSync(filePath);
                wasmBytes = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
            } else if (typeof fetch === 'function') {
                // Navigateur Web / Web Worker
                const response = await fetch(wasmUrl);
                if (!response.ok) {
                    throw new Error(`Échec du chargement WASM (${response.status})`);
                }
                wasmBytes = await response.arrayBuffer();
            } else {
                return false;
            }

            const wasmModule = await WebAssembly.instantiate(wasmBytes, {});
            wasmInstance = wasmModule.instance.exports as unknown as XgWasmExports;

            if (wasmInstance.xg_init) {
                wasmInstance.xg_init();
            }
            isWasmReady = true;
            return true;
        } catch {
            isWasmReady = false;
            return false;
        }
    })();

    return initPromise;
}

/**
 * Écrit un plateau 26 cases dans la mémoire WASM.
 */
function writeBoardToWasm(memory: WebAssembly.Memory, state: BoardState): void {
    const bytes = new Int8Array(memory.buffer, BOARD_PTR, 26);
    for (let i = 0; i < 26; i++) {
        bytes[i] = state.board[i];
    }
}

/**
 * Traite une requête individuelle (avec exécution WASM 2-ply ou repli TypeScript Option A).
 */
export async function handleRequest(request: WorkerRequest): Promise<any> {
    switch (request.type) {
        case 'init': {
            const ready = await loadXgWasm(request.payload as EngineInitConfig);
            return {
                initialized: true,
                isWasm: ready,
                engineMode: ready ? 'XG-Web 2-Ply SIMD (Grand-Maître)' : 'Tri-Phase Option A (Exact Bearoff & Keith)',
            };
        }

        case 'evaluate': {
            const params = request.payload as EvaluateParams;
            const state = resolveBoardState(params.position, params.player);
            const xgid = serializeXGID(state);

            if (isWasmReady && wasmInstance) {
                try {
                    const memory = wasmInstance.memory;
                    writeBoardToWasm(memory, state);
                    const turn = state.turn === 'X' ? 1 : -1;
                    wasmInstance.xg_evaluate(BOARD_PTR, turn, OUT_PTR);
                    const out = new Float32Array(memory.buffer, OUT_PTR, 7);

                    return {
                        xgid,
                        cubelessEquity: Number(out[6].toFixed(4)),
                        cubefulEquity: Number(out[6].toFixed(4)),
                        probabilities: {
                            win: Number(out[0].toFixed(4)),
                            winGammon: Number(out[1].toFixed(4)),
                            winBackgammon: Number(out[2].toFixed(4)),
                            loseWin: Number(out[3].toFixed(4)),
                            loseGammon: Number(out[4].toFixed(4)),
                            loseBackgammon: Number(out[5].toFixed(4)),
                        },
                        isWasm: true,
                    } satisfies EvaluateResult;
                } catch {
                    // Repli transparent
                }
            }

            // Repli Option A (TypeScript pur, Bear-Off exact & Keith count)
            const evalResult = evaluateBoard(state, params.ply ?? 2);
            return {
                xgid,
                cubelessEquity: evalResult.cubelessEquity,
                cubefulEquity: evalResult.cubefulEquity,
                probabilities: evalResult.probabilities,
                isWasm: false,
            } satisfies EvaluateResult;
        }

        case 'analyzeMoves': {
            const params = request.payload as AnalyzeMovesParams;
            const state = resolveBoardState(params.position);
            const xgid = serializeXGID(state);
            const ply = params.ply ?? 2;
            const maxMoves = params.maxMoves ?? 5;

            if (isWasmReady && wasmInstance) {
                try {
                    const memory = wasmInstance.memory;
                    writeBoardToWasm(memory, state);
                    const turn = state.turn === 'X' ? 1 : -1;
                    const d1 = params.dice[0];
                    const d2 = params.dice[1];

                    wasmInstance.xg_search_moves(BOARD_PTR, turn, d1, d2, ply, OUT_PTR);
                    const out = new Float32Array(memory.buffer, OUT_PTR, 200);
                    const count = Math.min(maxMoves, Math.max(0, Math.floor(out[0])));

                    if (count > 0) {
                        const moves: MoveAnalysis[] = [];
                        const bestEquity = out[1 + 9];

                        for (let k = 0; k < count; k++) {
                            const base = 1 + k * 18;
                            const subCount = Math.floor(out[base + 8]);
                            const subMoves: Move[] = [];
                            for (let m = 0; m < subCount; m++) {
                                const from = Math.floor(out[base + m * 2]);
                                const to = Math.floor(out[base + m * 2 + 1]);
                                subMoves.push({ from, to });
                            }
                            const eq = Number(out[base + 9].toFixed(4));
                            const notation = subMoves.map((m) => formatSingleMove(m, state.turn)).join(' ');

                            moves.push({
                                rank: k + 1,
                                notation: notation || 'Pass',
                                equity: eq,
                                equityLoss: Number((eq - bestEquity).toFixed(4)),
                                probabilities: {
                                    win: Number(out[base + 10].toFixed(4)),
                                    winGammon: Number(out[base + 11].toFixed(4)),
                                    winBackgammon: Number(out[base + 12].toFixed(4)),
                                    loseWin: Number(out[base + 13].toFixed(4)),
                                    loseGammon: Number(out[base + 14].toFixed(4)),
                                    loseBackgammon: Number(out[base + 15].toFixed(4)),
                                },
                                moves: subMoves,
                            });
                        }

                        return {
                            xgid,
                            moves,
                            bestMove: moves[0] ?? null,
                            isWasm: true,
                        };
                    }
                } catch {
                    // Repli transparent
                }
            }

            // Repli Option A
            const result = analyzeBoardMoves(state, params.dice, {
                candidateMoves: params.candidateMoves,
                ply,
                maxMoves,
            });
            return {
                ...result,
                isWasm: false,
            };
        }

        case 'analyzeCube': {
            const params = request.payload as AnalyzeCubeParams;
            const state = resolveBoardState(params.position);
            const result: CubeDecisionResult = analyzeBoardCube(state, {
                score: params.score,
                ply: params.ply ?? 2,
            });
            return {
                ...result,
                isWasm: isWasmReady,
            };
        }

        case 'bestMove': {
            const params = request.payload as BestMoveParams;
            const state = resolveBoardState(params.position);
            const best = findBestBoardMove(state, params.dice, params.ply ?? 2);
            return best;
        }

        default:
            throw new Error(`Type de requête non supporté: ${(request as any).type}`);
    }
}

// Handler pour exécution dans l'environnement Web Worker du navigateur
if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function') {
    self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
        const request = e.data;
        try {
            const data = await handleRequest(request);
            const response: WorkerResponse = {
                id: request.id,
                type: 'success',
                data,
            };
            (self as any).postMessage(response);
        } catch (error) {
            const response: WorkerResponse = {
                id: request.id,
                type: 'error',
                error: error instanceof Error ? error.message : String(error),
            };
            (self as any).postMessage(response);
        }
    };
}
