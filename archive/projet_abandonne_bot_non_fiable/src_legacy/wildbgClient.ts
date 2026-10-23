/**
 * Client WildBG (moteur neuronal Rust → WASM, licence MIT/Apache-2.0).
 *
 * Charge le binaire `public/engine/wildbg.wasm` (compilé depuis le crate
 * `wildbg-cabi`, API C ABI sans wasm-bindgen) et expose :
 * - Interface synchrone directe (`initWildbg`, `evaluateWildbg`, `getWildbgBestMove`, `getWildbgCubeInfo`)
 * - Interface asynchrone isolée dans un Web Worker (`initWildbgWorker`, `evaluateWildbgAsync`,
 *   `getWildbgBestMoveAsync`, `getWildbgCubeInfoAsync`) pour ne jamais bloquer le fil UI 60 FPS.
 *
 * Convention de plateau (identique à `backgammonEngine.ts`) :
 * - `board[0]`     : barre X (positif)
 * - `board[1..24]` : points 1..24 (positif = X, négatif = O)
 * - `board[25]`    : barre O (négatif)
 */

import { Player, MoveSequence, applyMove } from '../../engine/backgammonEngine';

export interface WildbgEvaluation {
    win: number;
    winGammon: number;
    winBackgammon: number;
    lose: number;
    loseGammon: number;
    loseBackgammon: number;
    cubelessEquity: number;
}

export interface WildbgCubeDecision {
    shouldDouble: boolean;
    shouldTake: boolean;
    equityCubeless: number;
}

interface WildbgWasmExports {
    memory: WebAssembly.Memory;
    wildbg_init: () => number;
    wildbg_evaluate: (boardPtr: number, turn: number, outPtr: number) => number;
    wildbg_best_move: (boardPtr: number, turn: number, d1: number, d2: number, outPtr: number) => number;
    wildbg_cube_info: (boardPtr: number, turn: number, outPtr: number) => number;
}

let wasmInstance: WildbgWasmExports | null = null;
let isReady = false;
let loadingPromise: Promise<boolean> | null = null;

const BOARD_PTR = 4096;
const OUT_PTR = 8192;

function areMovesEqual(m1: Array<{ from: number; to: number }>, m2: Array<{ from: number; to: number }>): boolean {
    if (m1.length !== m2.length) return false;
    for (let i = 0; i < m1.length; i++) {
        if (m1[i].from !== m2[i].from || m1[i].to !== m2[i].to) return false;
    }
    return true;
}

function areBoardsEqual(b1: number[], b2: number[]): boolean {
    if (b1.length !== b2.length) return false;
    for (let i = 0; i < b1.length; i++) {
        if (b1[i] !== b2[i]) return false;
    }
    return true;
}

/**
 * Construit l'objet d'imports wasm-bindgen nécessaire pour instancier le WASM
 * WildBG sans `wasm-bindgen-cli`.
 */
function createWildbgImports(): WebAssembly.Imports {
    const cryptoObj = (globalThis as Record<string, any>).crypto;
    const getRandomValues = (ptr: number, len: number): number => {
        const bytes = new Uint8Array(len);
        cryptoObj?.getRandomValues?.(bytes);
        return ptr;
    };

    const placeholder: WebAssembly.ModuleImports = {
        __wbg_crypto_ed58b8e10a292839: () => cryptoObj,
        __wbindgen_is_object: (v: unknown) => (typeof v === 'object' && v !== null ? 1 : 0),
        __wbg_process_5c1d670bc53614b8: () => 0,
        __wbg_versions_c71aa1626a93e0a1: () => 0,
        __wbindgen_object_drop_ref: () => {},
        __wbg_node_02999533c4ea02e3: () => 0,
        __wbindgen_is_string: (v: unknown) => (typeof v === 'string' ? 1 : 0),
        __wbg_require_79b1e9274cde3c87: () => 0,
        __wbindgen_is_function: (v: unknown) => (typeof v === 'function' ? 1 : 0),
        __wbindgen_string_new: () => 0,
        __wbg_msCrypto_0a36e2ec3a343d26: () => 0,
        __wbg_randomFillSync_ab2cfe79ebbf2740: () => 0,
        __wbg_getRandomValues_bcb4912f16000dc4: getRandomValues,
        __wbindgen_describe: () => {},
        __wbindgen_object_clone_ref: () => 0,
        __wbg_call_672a4d21634d4a24: () => 0,
        __wbg_newnoargs_105ed471475aaf50: () => 0,
        __wbg_call_7cccdd69e0791ae2: () => 0,
        __wbg_buffer_609cc3eee51ed158: () => 0,
        __wbg_newwithbyteoffsetandlength_d97e637ebe145a9a: () => 0,
        __wbg_new_a12002a7f91c75be: () => 0,
        __wbg_set_65595bdd868b3009: () => 0,
        __wbg_newwithlength_a381634e90c276d4: () => 0,
        __wbg_subarray_aa9065fa9dc5df96: () => 0,
        __wbindgen_is_undefined: (v: unknown) => (v === undefined ? 1 : 0),
        __wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0: () => globalThis,
        __wbg_static_accessor_SELF_37c5d418e4bf5819: () => globalThis,
        __wbg_static_accessor_GLOBAL_88a902d13a557d07: () => globalThis,
        __wbg_static_accessor_WINDOW_5de37043a91a9c40: () => globalThis,
        __wbindgen_memory: () => 0,
        __wbindgen_throw: () => {},
    };

    return {
        __wbindgen_placeholder__: placeholder,
        __wbindgen_externref_xform__: {
            __wbindgen_externref_table_grow: () => {},
            __wbindgen_externref_table_set_null: () => {},
        },
    };
}

/**
 * Initialise le moteur WildBG (asynchrone, singleton idempotent).
 */
export async function initWildbg(wasmUrl: string = '/engine/wildbg.wasm'): Promise<boolean> {
    if (isReady && wasmInstance) return true;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            let buffer: ArrayBuffer | null = null;

            // 1. Environnement Node / Vitest
            if (typeof process !== 'undefined' && typeof (process as any).getBuiltinModule === 'function') {
                try {
                    const fs = (process as any).getBuiltinModule('fs');
                    const path = (process as any).getBuiltinModule('path');
                    const cleanPath = wasmUrl.startsWith('/') ? wasmUrl.slice(1) : wasmUrl;
                    const possiblePaths = [
                        path.resolve(process.cwd(), cleanPath),
                        path.resolve(process.cwd(), 'public', cleanPath),
                        path.resolve(process.cwd(), 'public/engine/wildbg.wasm'),
                    ];
                    for (const p of possiblePaths) {
                        if (fs.existsSync(p)) {
                            const file = fs.readFileSync(p);
                            buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
                            break;
                        }
                    }
                } catch {
                    // Repli navigateur
                }
            }

            // 2. Environnement Navigateur / Web Worker
            if (!buffer && typeof fetch === 'function') {
                const response = await fetch(wasmUrl);
                if (!response.ok) return false;
                buffer = await response.arrayBuffer();
            }

            if (!buffer) return false;

            const imports = createWildbgImports();
            const wasmResult = await WebAssembly.instantiate(buffer, imports);
            const exports = wasmResult.instance.exports as unknown as WildbgWasmExports;
            exports.wildbg_init();
            wasmInstance = exports;
            isReady = true;
            return true;
        } catch {
            return false;
        } finally {
            loadingPromise = null;
        }
    })();

    return loadingPromise;
}

export function isWildbgReady(): boolean {
    return isReady && wasmInstance !== null;
}

export function evaluateWildbg(board: number[], player: Player): WildbgEvaluation | null {
    if (!isReady || !wasmInstance) return null;

    try {
        const memory = wasmInstance.memory;
        const boardBytes = new Int8Array(memory.buffer, BOARD_PTR, 26);
        for (let i = 0; i < 26; i++) {
            boardBytes[i] = board[i];
        }

        const turn = player === 'X' ? 1 : -1;
        wasmInstance.wildbg_evaluate(BOARD_PTR, turn, OUT_PTR);

        const results = new Float32Array(memory.buffer, OUT_PTR, 7);
        return {
            win: results[0],
            winGammon: results[1],
            winBackgammon: results[2],
            lose: results[3],
            loseGammon: results[4],
            loseBackgammon: results[5],
            cubelessEquity: results[6],
        };
    } catch {
        return null;
    }
}

export function getWildbgBestMove(
    board: number[],
    player: Player,
    dice: [number, number],
    legalSeqs: MoveSequence[],
): MoveSequence | null {
    if (!isReady || !wasmInstance || legalSeqs.length === 0) {
        return null;
    }
    if (legalSeqs.length === 1) {
        return legalSeqs[0];
    }

    try {
        const memory = wasmInstance.memory;
        const boardBytes = new Int8Array(memory.buffer, BOARD_PTR, 26);
        for (let i = 0; i < 26; i++) {
            boardBytes[i] = board[i];
        }

        const turn = player === 'X' ? 1 : -1;
        wasmInstance.wildbg_best_move(BOARD_PTR, turn, dice[0], dice[1], OUT_PTR);

        const results = new Float32Array(memory.buffer, OUT_PTR, 20);
        const count = Math.min(4, Math.floor(results[0]));
        if (count === 0) return null;

        const wasmMoves: Array<{ from: number; to: number }> = [];
        for (let m = 0; m < count; m++) {
            wasmMoves.push({
                from: Math.round(results[1 + m * 2]),
                to: Math.round(results[1 + m * 2 + 1]),
            });
        }

        for (const seq of legalSeqs) {
            if (areMovesEqual(seq.moves, wasmMoves)) return seq;
        }

        let simulated = [...board];
        for (const m of wasmMoves) {
            simulated = applyMove(simulated, m, player);
        }
        for (const seq of legalSeqs) {
            if (areBoardsEqual(seq.board, simulated)) return seq;
        }

        if (wasmMoves.length > 0) {
            for (const seq of legalSeqs) {
                if (
                    seq.moves.length > 0 &&
                    seq.moves[0].from === wasmMoves[0].from &&
                    seq.moves[0].to === wasmMoves[0].to
                ) {
                    return seq;
                }
            }
        }

        return legalSeqs[0];
    } catch {
        return null;
    }
}

export function getWildbgCubeInfo(board: number[], player: Player): WildbgCubeDecision | null {
    if (!isReady || !wasmInstance) return null;

    try {
        const memory = wasmInstance.memory;
        const boardBytes = new Int8Array(memory.buffer, BOARD_PTR, 26);
        for (let i = 0; i < 26; i++) {
            boardBytes[i] = board[i];
        }

        const turn = player === 'X' ? 1 : -1;
        wasmInstance.wildbg_cube_info(BOARD_PTR, turn, OUT_PTR);

        const results = new Float32Array(memory.buffer, OUT_PTR, 3);
        return {
            shouldDouble: results[0] >= 0.5,
            shouldTake: results[1] >= 0.5,
            equityCubeless: results[2],
        };
    } catch {
        return null;
    }
}

// ============================================================================
// Orchestration asynchrone non-bloquante via Web Worker (`wildbg.worker.ts`)
// ============================================================================

let workerInstance: Worker | null = null;
let workerReqCounter = 0;
const pendingWorkerRequests = new Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void }
>();

function getOrCreateWildbgWorker(): Worker | null {
    if (workerInstance) return workerInstance;
    if (typeof Worker !== 'undefined') {
        try {
            workerInstance = new Worker(new URL('../../workers/wildbg.worker.ts', import.meta.url), {
                type: 'module',
            });
            workerInstance.onmessage = (event: MessageEvent) => {
                const { id, data, error } = event.data || {};
                const pending = pendingWorkerRequests.get(id);
                if (!pending) return;
                pendingWorkerRequests.delete(id);
                if (error) pending.reject(new Error(error));
                else pending.resolve(data);
            };
            return workerInstance;
        } catch {
            return null;
        }
    }
    return null;
}

async function dispatchToWildbgWorker<T>(
    type: 'INIT' | 'EVALUATE' | 'BEST_MOVE' | 'CUBE_INFO',
    payload: Record<string, unknown>,
): Promise<T> {
    const worker = getOrCreateWildbgWorker();
    const id = `wbg-${++workerReqCounter}-${Date.now()}`;

    if (worker) {
        return new Promise<T>((resolve, reject) => {
            pendingWorkerRequests.set(id, { resolve, reject });
            worker.postMessage({ id, type, payload });
        });
    }

    // Repli in-process transparent pour Node / SSR / Vitest
    const { handleWildbgWorkerRequest } = await import('../../workers/wildbg.worker');
    const resp = await handleWildbgWorkerRequest({ id, type, payload });
    if (resp.error) throw new Error(resp.error);
    return resp.data as T;
}

export async function initWildbgWorker(wasmUrl: string = '/engine/wildbg.wasm'): Promise<boolean> {
    try {
        const res = await dispatchToWildbgWorker<{ ready: boolean }>('INIT', { wasmUrl });
        return Boolean(res?.ready);
    } catch {
        return false;
    }
}

export async function evaluateWildbgAsync(
    board: number[],
    player: Player,
): Promise<WildbgEvaluation | null> {
    try {
        return await dispatchToWildbgWorker<WildbgEvaluation | null>('EVALUATE', { board, player });
    } catch {
        return null;
    }
}

export async function getWildbgBestMoveAsync(
    board: number[],
    player: Player,
    dice: [number, number],
    legalSeqs: MoveSequence[],
): Promise<MoveSequence | null> {
    try {
        return await dispatchToWildbgWorker<MoveSequence | null>('BEST_MOVE', {
            board,
            player,
            dice,
            legalSeqs,
        });
    } catch {
        return null;
    }
}

export async function getWildbgCubeInfoAsync(
    board: number[],
    player: Player,
): Promise<WildbgCubeDecision | null> {
    try {
        return await dispatchToWildbgWorker<WildbgCubeDecision | null>('CUBE_INFO', { board, player });
    } catch {
        return null;
    }
}

export function terminateWildbgWorker(): void {
    if (workerInstance) {
        workerInstance.terminate();
        workerInstance = null;
    }
    pendingWorkerRequests.clear();
}
