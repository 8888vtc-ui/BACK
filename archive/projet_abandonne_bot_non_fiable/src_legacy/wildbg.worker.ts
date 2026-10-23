/**
 * Web Worker dédié au moteur neuronal WildBG WASM (`public/engine/wildbg.wasm`).
 *
 * Exécute l'instanciation WebAssembly (14 Mo) et les inférences réseau de neurones
 * hors du thread principal UI pour garantir un rendu 60 FPS sans micro-freeze.
 *
 * Supporte également l'invocation directe via `handleWildbgWorkerRequest`
 * pour les environnements Node / SSR / Vitest sans Worker global.
 */

import type { Player, MoveSequence } from '../engine/backgammonEngine';
import {
    initWildbg,
    isWildbgReady,
    evaluateWildbg,
    getWildbgBestMove,
    getWildbgCubeInfo,
    type WildbgEvaluation,
    type WildbgCubeDecision,
} from '../lib/engine/wildbgClient';

export type WildbgWorkerRequestType = 'INIT' | 'EVALUATE' | 'BEST_MOVE' | 'CUBE_INFO';

export interface WildbgWorkerRequest {
    id: string;
    type: WildbgWorkerRequestType;
    payload?: {
        wasmUrl?: string;
        board?: number[];
        player?: Player;
        dice?: [number, number];
        legalSeqs?: MoveSequence[];
    };
}

export interface WildbgWorkerResponse<T = unknown> {
    id: string;
    type: string;
    data?: T;
    error?: string;
}

/**
 * Traite une requête adressée au Worker WildBG WASM.
 */
export async function handleWildbgWorkerRequest(
    request: WildbgWorkerRequest,
): Promise<WildbgWorkerResponse> {
    const { id, type, payload } = request;

    try {
        switch (type) {
            case 'INIT': {
                const ready = await initWildbg(payload?.wasmUrl ?? '/engine/wildbg.wasm');
                return {
                    id,
                    type: 'INIT_SUCCESS',
                    data: { ready, isWasm: isWildbgReady() },
                };
            }

            case 'EVALUATE': {
                if (!payload?.board || !payload?.player) {
                    return { id, type: 'ERROR', error: 'Paramètres board et player requis pour EVALUATE' };
                }
                if (!isWildbgReady()) {
                    await initWildbg(payload?.wasmUrl ?? '/engine/wildbg.wasm');
                }
                const evaluation: WildbgEvaluation | null = evaluateWildbg(payload.board, payload.player);
                return {
                    id,
                    type: 'EVALUATE_RESULT',
                    data: evaluation,
                };
            }

            case 'BEST_MOVE': {
                if (!payload?.board || !payload?.player || !payload?.dice || !payload?.legalSeqs) {
                    return {
                        id,
                        type: 'ERROR',
                        error: 'Paramètres board, player, dice et legalSeqs requis pour BEST_MOVE',
                    };
                }
                if (!isWildbgReady()) {
                    await initWildbg(payload?.wasmUrl ?? '/engine/wildbg.wasm');
                }
                const bestMove: MoveSequence | null = getWildbgBestMove(
                    payload.board,
                    payload.player,
                    payload.dice,
                    payload.legalSeqs,
                );
                return {
                    id,
                    type: 'BEST_MOVE_RESULT',
                    data: bestMove,
                };
            }

            case 'CUBE_INFO': {
                if (!payload?.board || !payload?.player) {
                    return { id, type: 'ERROR', error: 'Paramètres board et player requis pour CUBE_INFO' };
                }
                if (!isWildbgReady()) {
                    await initWildbg(payload?.wasmUrl ?? '/engine/wildbg.wasm');
                }
                const cubeDecision: WildbgCubeDecision | null = getWildbgCubeInfo(
                    payload.board,
                    payload.player,
                );
                return {
                    id,
                    type: 'CUBE_INFO_RESULT',
                    data: cubeDecision,
                };
            }

            default:
                return {
                    id,
                    type: 'ERROR',
                    error: `Type de requête WildBG Worker inconnu : ${String(type)}`,
                };
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur interne du Worker WildBG';
        return {
            id,
            type: 'ERROR',
            error: message,
        };
    }
}

// Attachement de l'écouteur global dans un contexte Web Worker dédié
if (
    typeof self !== 'undefined' &&
    typeof (self as unknown as { postMessage?: unknown }).postMessage === 'function' &&
    typeof window === 'undefined'
) {
    self.onmessage = async (event: MessageEvent<WildbgWorkerRequest>) => {
        const response = await handleWildbgWorkerRequest(event.data);
        self.postMessage(response);
    };
}
