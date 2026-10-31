/**
 * Web Worker du moteur d'évaluation Backgammon — 100 % TypeScript pur.
 *
 * Fonctionnalités :
 * - Moteur d'évaluation tri-phase embarqué (Contact / Crashed / Race-BearOff),
 *   exécuté localement en moins de 1 ms (aucun fetch réseau, aucun WASM).
 * - File d'attente avec priorisation des requêtes (ex: 'high' pour l'analyse du coup du joueur).
 * - Implémentation complète de l'API JSON :
 *     - evaluate
 *     - analyzeMoves
 *     - analyzeCube
 *     - bestMove
 *
 * NOTE : l'ancien chargement WASM (`/engine/gnubg.wasm`) a été supprimé car le
 * binaire n'existait pas et générait un 404 inutile dans la console réseau.
 */

import { serializeXGID } from '../engine/backgammonEngine';
import {
    analyzeBoardCube,
    analyzeBoardMoves,
    evaluateBoard,
    findBestBoardMove,
    resolveBoardState,
} from '../lib/engine/evaluator';
import {
    AnalyzeCubeParams,
    AnalyzeMovesParams,
    BestMoveParams,
    CubeDecisionResult,
    EngineInitConfig,
    EvaluateParams,
    EvaluateResult,
    WorkerRequest,
    WorkerResponse,
} from '../lib/engine/types';

// File de traitement avec priorité
interface QueuedTask {
    request: WorkerRequest;
    priorityValue: number;
}
const taskQueue: QueuedTask[] = [];
let isProcessingQueue = false;

/**
 * Initialisation (no-op) : le moteur tri-phase est embarqué et ne nécessite
 * aucun chargement externe. Conservée pour la compatibilité de l'API `init`.
 */
export async function loadWasmAndWeights(_config: EngineInitConfig = {}): Promise<void> {
    return Promise.resolve();
}

/**
 * Traite une requête individuelle.
 */
export async function handleRequest(request: WorkerRequest): Promise<unknown> {
    switch (request.type) {
        case 'init': {
            return {
                initialized: true,
                isWasm: false,
                hasWeights: false,
            };
        }

        case 'evaluate': {
            const params = request.payload as EvaluateParams;
            const state = resolveBoardState(params.position, params.player);
            const xgid = serializeXGID(state);
            const evalResult = evaluateBoard(state, params.ply ?? 2);

            const result: EvaluateResult = {
                xgid,
                cubelessEquity: evalResult.cubelessEquity,
                cubefulEquity: evalResult.cubefulEquity,
                probabilities: evalResult.probabilities,
                isWasm: false,
            };
            return result;
        }

        case 'analyzeMoves': {
            const params = request.payload as AnalyzeMovesParams;
            const state = resolveBoardState(params.position);
            const result = analyzeBoardMoves(state, params.dice, {
                candidateMoves: params.candidateMoves,
                ply: params.ply ?? 2,
                maxMoves: params.maxMoves ?? 5,
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
                isWasm: false,
            };
        }

        case 'bestMove': {
            const params = request.payload as BestMoveParams;
            const state = resolveBoardState(params.position);
            const result = findBestBoardMove(state, params.dice, params.ply ?? 2);
            if (!result) {
                return null;
            }
            return {
                ...result,
                isWasm: false,
            };
        }

        default:
            throw new Error(`Type de requête GNUBG inconnu : "${(request as { type?: unknown }).type}"`);
    }
}

/**
 * Évalue la priorité d'une tâche (plus grand = prioritaire).
 */
function getPriorityValue(priority?: string): number {
    if (priority === 'high') return 2;
    if (priority === 'low') return 0;
    return 1; // 'normal'
}

/**
 * Dépile et exécute les tâches dans l'ordre de priorité.
 */
async function processQueue(): Promise<void> {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    try {
        while (taskQueue.length > 0) {
            // Trie par priorité descendante
            taskQueue.sort((a, b) => b.priorityValue - a.priorityValue);
            const task = taskQueue.shift();
            if (!task) break;

            const { request } = task;
            try {
                const data = await handleRequest(request);
                const response: WorkerResponse = {
                    id: request.id,
                    type: 'success',
                    data,
                };
                if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
                    self.postMessage(response);
                }
            } catch (err: unknown) {
                const response: WorkerResponse = {
                    id: request.id,
                    type: 'error',
                    error: err instanceof Error ? err.message : String(err),
                };
                if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
                    self.postMessage(response);
                }
            }
        }
    } finally {
        isProcessingQueue = false;
    }
}

/**
 * Enregistre une tâche dans la file.
 */
export function enqueueTask(request: WorkerRequest): void {
    taskQueue.push({
        request,
        priorityValue: getPriorityValue(request.priority),
    });
    void processQueue();
}

// Initialisation de l'écouteur du Worker dans l'environnement Web Worker
if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
    self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
        if (!event.data || !event.data.id || !event.data.type) return;
        enqueueTask(event.data);
    });
}
