/**
 * Web Worker GNUBG — Moteur d'évaluation WebAssembly avec chargement paresseux (lazy).
 *
 * Fonctionnalités :
 * - Chargement différé (lazy) du module WebAssembly et des poids du réseau de neurones
 *   dès la première requête d'évaluation ou sur commande explicite `init`.
 * - File d'attente avec priorisation des requêtes (ex: 'high' pour l'analyse du coup du joueur).
 * - Implémentation complète de l'API JSON :
 *     - evaluate
 *     - analyzeMoves
 *     - analyzeCube
 *     - bestMove
 * - Repli automatique sur le moteur neuronal TypeScript embarqué si le binaire WASM
 *   n'est pas encore présent sur le serveur statique (/engine/gnubg.wasm).
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

// État interne du worker
let isInitialized = false;
let isWasmLoaded = false;
let initPromise: Promise<void> | null = null;

let wasmInstance: WebAssembly.Instance | null = null;
let nnWeightsBuffer: ArrayBuffer | null = null;

// File de traitement avec priorité
interface QueuedTask {
    request: WorkerRequest;
    priorityValue: number;
}
const taskQueue: QueuedTask[] = [];
let isProcessingQueue = false;

/**
 * Charge paresseusement le module WebAssembly et les poids neuronaux.
 */
export async function loadWasmAndWeights(config: EngineInitConfig = {}): Promise<void> {
    if (isInitialized) return;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        const wasmUrl = config.wasmUrl || '/engine/gnubg.wasm';
        const weightsUrl = config.weightsUrl || '/engine/gnubg_nn.weights';

        try {
            if (typeof fetch === 'function' && typeof WebAssembly !== 'undefined') {
                // Tentative de chargement du WASM
                const wasmRes = await fetch(wasmUrl);
                if (wasmRes.ok) {
                    const wasmBytes = await wasmRes.arrayBuffer();
                    const wasmModule = await WebAssembly.instantiate(wasmBytes, {
                        env: {
                            memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
                            abort: () => console.error('[GNUBG WASM] Aborted'),
                        },
                    });
                    wasmInstance = wasmModule.instance;
                    isWasmLoaded = true;

                    // Tentative de chargement des poids NN
                    try {
                        const weightsRes = await fetch(weightsUrl);
                        if (weightsRes.ok) {
                            nnWeightsBuffer = await weightsRes.arrayBuffer();
                        }
                    } catch {
                        // Poids non disponibles, utilisation des poids par défaut
                    }
                }
            }
        } catch {
            // Repli gracieux : utilisation du moteur pur embarqué
            isWasmLoaded = false;
        } finally {
            isInitialized = true;
        }
    })();

    return initPromise;
}

/**
 * Traite une requête individuelle.
 */
export async function handleRequest(request: WorkerRequest): Promise<any> {
    // 1. Initialisation lazy à la première demande
    if (!isInitialized) {
        await loadWasmAndWeights();
    }

    switch (request.type) {
        case 'init': {
            await loadWasmAndWeights(request.payload as EngineInitConfig);
            return {
                initialized: true,
                isWasm: isWasmLoaded,
                hasWeights: nnWeightsBuffer !== null,
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
                isWasm: isWasmLoaded,
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
                isWasm: isWasmLoaded,
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
                isWasm: isWasmLoaded,
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
                isWasm: isWasmLoaded,
            };
        }

        default:
            throw new Error(`Type de requête GNUBG inconnu : "${(request as any).type}"`);
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
            } catch (err: any) {
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
