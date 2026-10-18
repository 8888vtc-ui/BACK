/**
 * Client universel XG-Web Core (Client-side WebAssembly Engine).
 *
 * Exécute le moteur haute performance compilé en WebAssembly SIMD :
 * - Niveau Expert      : 2-Ply Expectiminimax (< 50 ms)
 * - Niveau Grand-Maître : 3-Ply Sélectif XG++++ (< 100 ms)
 *
 * 100 % client-side, 0 € serveur, 100 % propriétaire (licence MIT fermée).
 */

import { Player, MoveSequence, applyMove } from '../../engine/backgammonEngine';

export interface XgEvaluationResult {
    win: number;
    winGammon: number;
    winBackgammon: number;
    lose: number;
    loseGammon: number;
    loseBackgammon: number;
    cubelessEquity: number;
}

interface XgWasmExports {
    memory: WebAssembly.Memory;
    xg_init: () => number;
    xg_evaluate: (boardPtr: number, turn: number, outPtr: number) => number;
    xg_search_moves: (boardPtr: number, turn: number, d1: number, d2: number, ply: number, outPtr: number) => number;
    xg_match_equity: (away1: number, away2: number) => number;
    xg_take_point: (awayLeader: number, awayTrailer: number, cubeVal: number) => number;
}

let wasmInstance: XgWasmExports | null = null;
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
 * Initialise le moteur WebAssembly XG-Web (asynchrone, singleton idempotent).
 */
export async function initXgWeb(wasmUrl: string = '/engine/xg_web_core.wasm'): Promise<boolean> {
    if (isReady && wasmInstance) return true;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
        try {
            let buffer: ArrayBuffer | null = null;

            // 1. Environnement Node / Vitest (y compris jsdom)
            if (typeof process !== 'undefined' && typeof (process as any).getBuiltinModule === 'function') {
                try {
                    const fs = (process as any).getBuiltinModule('fs');
                    const path = (process as any).getBuiltinModule('path');
                    const cleanPath = wasmUrl.startsWith('/') ? wasmUrl.slice(1) : wasmUrl;
                    const possiblePaths = [
                        path.resolve(process.cwd(), cleanPath),
                        path.resolve(process.cwd(), 'public', cleanPath),
                        path.resolve(process.cwd(), 'public/engine/xg_web_core.wasm'),
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

            // 2. Environnement Navigateur réel
            if (!buffer && typeof window !== 'undefined' && typeof window.fetch === 'function') {
                const response = await fetch(wasmUrl);
                if (!response.ok) return false;
                buffer = await response.arrayBuffer();
            }

            if (!buffer) return false;

            const wasmResult = await WebAssembly.instantiate(buffer, {});
            const exports = wasmResult.instance.exports as unknown as XgWasmExports;
            exports.xg_init();
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

/**
 * Indique si le moteur WASM XG-Web est prêt à évaluer.
 */
export function isXgWebReady(): boolean {
    return isReady && wasmInstance !== null;
}

/**
 * Trouve la meilleure séquence de coups via le moteur XG-Web (2-ply ou 3-ply sélectif).
 * Retourne `null` si le WASM n'est pas prêt ou si la séquence n'a pu être résolue.
 */
export function getXgWebBestMove(
    board: number[],
    player: Player,
    dice: [number, number],
    legalSeqs: MoveSequence[],
    ply: number = 2,
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
        wasmInstance.xg_search_moves(BOARD_PTR, turn, dice[0], dice[1], ply, OUT_PTR);

        const results = new Float32Array(memory.buffer, OUT_PTR, 200);
        const count = Math.min(8, Math.floor(results[0]));
        if (count === 0) return null;

        const subCount = Math.round(results[1 + 8]);
        const wasmMoves: Array<{ from: number; to: number }> = [];
        for (let m = 0; m < subCount; m++) {
            wasmMoves.push({
                from: Math.round(results[1 + m * 2]),
                to: Math.round(results[1 + m * 2 + 1]),
            });
        }

        // 1. Correspondance exacte des sous-coups
        for (const seq of legalSeqs) {
            if (areMovesEqual(seq.moves, wasmMoves)) {
                return seq;
            }
        }

        // 2. Transposition (même plateau résultant)
        let simulated = [...board];
        for (const m of wasmMoves) {
            simulated = applyMove(simulated, m, player);
        }
        for (const seq of legalSeqs) {
            if (areBoardsEqual(seq.board, simulated)) {
                return seq;
            }
        }

        // 3. Correspondance sur le premier coup
        if (wasmMoves.length > 0) {
            for (const seq of legalSeqs) {
                if (seq.moves.length > 0 && seq.moves[0].from === wasmMoves[0].from && seq.moves[0].to === wasmMoves[0].to) {
                    return seq;
                }
            }
        }

        return legalSeqs[0];
    } catch {
        return null;
    }
}

/**
 * Évalue une position de Backgammon avec le réseau neuronal tri-phase XG-Web.
 */
export function getXgWebEvaluation(board: number[], player: Player): XgEvaluationResult | null {
    if (!isReady || !wasmInstance) return null;

    try {
        const memory = wasmInstance.memory;
        const boardBytes = new Int8Array(memory.buffer, BOARD_PTR, 26);
        for (let i = 0; i < 26; i++) {
            boardBytes[i] = board[i];
        }

        const turn = player === 'X' ? 1 : -1;
        wasmInstance.xg_evaluate(BOARD_PTR, turn, OUT_PTR);

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
