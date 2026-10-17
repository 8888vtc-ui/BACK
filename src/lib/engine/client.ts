/**
 * Client d'orchestration pour le moteur GNUBG WebAssembly.
 *
 * Fournit une interface Promise-based typée au-dessus du Web Worker GNUBG :
 * - evaluate : probabilités win/gammon/backgammon et équités cubeless/cubeful
 * - analyzeMoves : classement des coups légaux avec pertes d'équité
 * - analyzeCube : analyse des choix de videau (no double, take, pass)
 * - bestMove : sélection du coup optimal pour l'IA ou le coach
 *
 * Gère le cycle de vie du Web Worker (instanciation paresseuse, corrélation des requêtes,
 * timeout, file prioritaire et repli in-process pour SSR / tests).
 */

import {
    WorkerRequest,
    WorkerResponse,
    WorkerRequestType,
    EngineInitConfig,
    EvaluateParams,
    EvaluateResult,
    AnalyzeMovesParams,
    AnalyzeMovesResult,
    AnalyzeCubeParams,
    CubeDecisionResult,
    BestMoveParams,
    BestMoveResult,
    EngineStatus,
    RequestPriority,
} from './types';
import { handleRequest } from '../../workers/gnubg.worker';

export interface EngineClientOptions {
    /** Fabrique de Worker personnalisée (utile pour tests / environnements isolés). */
    workerFactory?: () => Worker;
    /** Timeout par défaut en millisecondes (défaut: 8000ms). */
    defaultTimeoutMs?: number;
}

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

export class GnubgEngineClient {
    private worker: Worker | null = null;
    private pendingRequests = new Map<string, PendingRequest>();
    private isInitialized = false;
    private isWasm = false;
    private options: EngineClientOptions;
    private requestCounter = 0;

    constructor(options: EngineClientOptions = {}) {
        this.options = options;
    }

    /**
     * Initialise ou récupère l'instance du Web Worker.
     * En environnement Node / SSR / Test où Worker n'est pas disponible,
     * fournit un adaptateur in-process transparent.
     */
    private getOrCreateWorker(): Worker | null {
        if (this.worker) return this.worker;

        if (this.options.workerFactory) {
            this.worker = this.options.workerFactory();
            this.attachListeners(this.worker);
            return this.worker;
        }

        if (typeof Worker !== 'undefined') {
            try {
                this.worker = new Worker(new URL('../../workers/gnubg.worker.ts', import.meta.url), {
                    type: 'module',
                });
                this.attachListeners(this.worker);
                return this.worker;
            } catch (err) {
                console.warn('[GnubgEngineClient] Échec de création du Worker, bascule in-process :', err);
                return null;
            }
        }

        // Pas d'environnement Worker disponible (ex: SSR / Vitest sans Worker)
        return null;
    }

    private attachListeners(worker: Worker): void {
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { id, type, data, error } = event.data;
            const pending = this.pendingRequests.get(id);
            if (!pending) return;

            clearTimeout(pending.timeoutId);
            this.pendingRequests.delete(id);

            if (type === 'success') {
                pending.resolve(data);
            } else {
                pending.reject(new Error(error || 'Erreur moteur GNUBG inconnue'));
            }
        };

        worker.onerror = (event: ErrorEvent) => {
            console.error('[GnubgEngineClient] Erreur du Web Worker :', event.message);
            // Rejette toutes les requêtes en attente
            for (const [id, pending] of this.pendingRequests.entries()) {
                clearTimeout(pending.timeoutId);
                pending.reject(new Error(`Crash du Worker : ${event.message}`));
                this.pendingRequests.delete(id);
            }
        };
    }

    /**
     * Envoie une commande au moteur (via Worker ou in-process) et retourne une Promesse.
     */
    private async sendRequest<TResult>(
        type: WorkerRequestType,
        payload: any,
        priority: RequestPriority = 'normal',
        timeoutMs?: number,
    ): Promise<TResult> {
        const id = `req_${Date.now()}_${++this.requestCounter}`;
        const timeout = timeoutMs ?? this.options.defaultTimeoutMs ?? 8000;

        const request: WorkerRequest = {
            id,
            type,
            payload,
            priority,
        };

        const worker = this.getOrCreateWorker();

        // 1. Exécution via Web Worker si disponible
        if (worker) {
            return new Promise<TResult>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Timeout de la requête moteur GNUBG "${type}" après ${timeout}ms`));
                }, timeout);

                this.pendingRequests.set(id, { resolve, reject, timeoutId });
                worker.postMessage(request);
            });
        }

        // 2. Repli in-process (exécution directe pour Node.js, SSR ou tests sans Worker)
        try {
            const result = await handleRequest(request);
            return result as TResult;
        } catch (error) {
            throw error instanceof Error ? error : new Error(String(error));
        }
    }

    /**
     * Initialise explicitement le moteur et charge les poids en différé.
     */
    public async init(config: EngineInitConfig = {}): Promise<void> {
        const res = await this.sendRequest<{ initialized: boolean; isWasm: boolean }>('init', config, 'high');
        this.isInitialized = res.initialized;
        this.isWasm = res.isWasm;
    }

    /**
     * Évalue une position de jeu : probabilités de gain et équités cubeless/cubeful.
     */
    public async evaluate(params: EvaluateParams): Promise<EvaluateResult> {
        return this.sendRequest<EvaluateResult>('evaluate', params, params.priority ?? 'normal');
    }

    /**
     * Analyse tous les coups légaux pour un jet de dés et les classe par équité.
     */
    public async analyzeMoves(params: AnalyzeMovesParams): Promise<AnalyzeMovesResult> {
        return this.sendRequest<AnalyzeMovesResult>('analyzeMoves', params, params.priority ?? 'normal');
    }

    /**
     * Analyse la décision de videau pour la position courante.
     */
    public async analyzeCube(params: AnalyzeCubeParams): Promise<CubeDecisionResult> {
        return this.sendRequest<CubeDecisionResult>('analyzeCube', params, params.priority ?? 'normal');
    }

    /**
     * Calcule le meilleur coup immédiat pour une position et des dés donnés.
     */
    public async bestMove(params: BestMoveParams): Promise<BestMoveResult> {
        return this.sendRequest<BestMoveResult>('bestMove', params, params.priority ?? 'high');
    }

    /**
     * Termine et libère l'instance du Web Worker.
     */
    public terminate(): void {
        for (const [id, pending] of this.pendingRequests.entries()) {
            clearTimeout(pending.timeoutId);
            pending.reject(new Error('Moteur terminé par appel à terminate()'));
            this.pendingRequests.delete(id);
        }

        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isInitialized = false;
        this.isWasm = false;
    }

    /**
     * Indique si le client a déjà été initialisé.
     */
    public isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Retourne l'état actuel du client moteur.
     */
    public getStatus(): EngineStatus {
        return {
            initialized: this.isInitialized,
            isWasm: this.isWasm,
            pendingRequests: this.pendingRequests.size,
        };
    }
}

// Instance singleton par défaut pour l'application
export const gnubgClient = new GnubgEngineClient();

// Fonctions exportées directes pour une ergonomie optimale
export const evaluate = (params: EvaluateParams): Promise<EvaluateResult> =>
    gnubgClient.evaluate(params);

export const analyzeMoves = (params: AnalyzeMovesParams): Promise<AnalyzeMovesResult> =>
    gnubgClient.analyzeMoves(params);

export const analyzeCube = (params: AnalyzeCubeParams): Promise<CubeDecisionResult> =>
    gnubgClient.analyzeCube(params);

export const bestMove = (params: BestMoveParams): Promise<BestMoveResult> =>
    gnubgClient.bestMove(params);

export const initEngine = (config?: EngineInitConfig): Promise<void> =>
    gnubgClient.init(config);

export const terminateEngine = (): void =>
    gnubgClient.terminate();

export default gnubgClient;
