/**
 * Types et interfaces pour le contrat du moteur GNUBG WebAssembly.
 *
 * Définit la structure des messages JSON échangés entre le client React
 * et le Web Worker (evaluate, analyzeMoves, analyzeCube, bestMove).
 */

import { BoardState, Move, MoveSequence, Player } from '../../engine/backgammonEngine';

export type WorkerRequestType = 'init' | 'evaluate' | 'analyzeMoves' | 'analyzeCube' | 'bestMove';

export type RequestPriority = 'high' | 'normal' | 'low';

export interface WorkerRequest<T = any> {
    id: string;
    type: WorkerRequestType;
    payload: T;
    priority?: RequestPriority;
}

export interface WorkerResponse<T = any> {
    id: string;
    type: 'success' | 'error';
    data?: T;
    error?: string;
}

export interface EngineInitConfig {
    /** URL du binaire gnubg.wasm (défaut: /engine/gnubg.wasm). */
    wasmUrl?: string;
    /** URL des poids du réseau de neurones (défaut: /engine/gnubg_nn.weights). */
    weightsUrl?: string;
    /** Timeout d'initialisation en millisecondes. */
    timeoutMs?: number;
}

export interface Probabilities {
    win: number;
    winGammon: number;
    winBackgammon: number;
    loseWin: number;
    loseGammon: number;
    loseBackgammon: number;
}

export interface EvaluateParams {
    /** Position du plateau : BoardState ou chaîne XGID complète. */
    position: BoardState | string;
    /** Joueur au trait (si position est un string sans tour spécifié). */
    player?: Player;
    /** Profondeur d'évaluation (0 à 4, défaut 2). */
    ply?: number;
    /** Priorité dans la file de calcul du worker. */
    priority?: RequestPriority;
}

export interface EvaluateResult {
    xgid: string;
    cubelessEquity: number;
    cubefulEquity: number;
    probabilities: Probabilities;
    isWasm?: boolean;
}

export interface MoveAnalysis {
    rank: number;
    notation: string;
    equity: number;
    equityLoss: number;
    probabilities?: Probabilities | null;
    moves?: Move[];
    board?: number[];
}

export interface AnalyzeMovesParams {
    /** Position du plateau : BoardState ou chaîne XGID. */
    position: BoardState | string;
    /** Dés lancés [d1, d2]. */
    dice: [number, number];
    /** Séquences de coups candidats à évaluer (optionnel, calculées automatiquement si omises). */
    candidateMoves?: MoveSequence[];
    /** Profondeur d'évaluation (0 à 4, défaut: 2). */
    ply?: number;
    /** Nombre maximal de coups à retourner (défaut: 5). */
    maxMoves?: number;
    /** Priorité dans la file de calcul du worker. */
    priority?: RequestPriority;
}

export interface AnalyzeMovesResult {
    xgid: string;
    moves: MoveAnalysis[];
    bestMove: MoveAnalysis | null;
    isWasm?: boolean;
}

export interface AnalyzeCubeParams {
    /** Position du plateau : BoardState ou chaîne XGID. */
    position: BoardState | string;
    /** Score du match (optionnel). */
    score?: {
        scoreX: number;
        scoreO: number;
        matchLength?: number;
    };
    /** Profondeur d'évaluation (défaut: 2). */
    ply?: number;
    /** Priorité dans la file de calcul du worker. */
    priority?: RequestPriority;
}

export interface CubeDecisionResult {
    xgid: string;
    noDouble: number | null;
    doubleTake: number | null;
    doublePass: number | null;
    optimalAction: string | null;
    isWasm?: boolean;
}

export interface BestMoveParams {
    /** Position du plateau : BoardState ou chaîne XGID. */
    position: BoardState | string;
    /** Dés lancés [d1, d2]. */
    dice: [number, number];
    /** Profondeur d'évaluation (défaut: 2). */
    ply?: number;
    /** Priorité dans la file de calcul du worker. */
    priority?: RequestPriority;
}

export interface BestMoveResult {
    xgid: string;
    notation: string;
    sequence: MoveSequence;
    equity: number;
    rank: number;
    isWasm?: boolean;
}

export interface EngineStatus {
    initialized: boolean;
    isWasm: boolean;
    pendingRequests: number;
}
