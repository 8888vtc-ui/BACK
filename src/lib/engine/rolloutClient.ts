/**
 * Client d'orchestration pour les rollouts profonds asynchrones GNUBG.
 *
 * Se connecte au pool de workers GNU Backgammon et à la file de tâches asynchrone :
 * - Soumission d'une tâche de rollout (trials: 324, 1296, 2592) avec réponse 202 Accepted.
 * - Suivi de la progression en temps réel via Server-Sent Events (SSE) :
 *   pourcentage (0-100%), parties jouées/total, coup en cours, ETA restant.
 * - Réception du verdict statistique final : équité cubeful, intervalle de confiance ±CI,
 *   écart-type σ, distributions de victoires/gammons et confirmation du meilleur coup.
 * - Annulation coopérative de tâche en cours.
 * - Statistiques d'occupation du pool de workers en temps réel.
 */

export interface Probabilities {
    win: number;
    winGammon: number;
    winBackgammon: number;
    loseWin: number;
    loseGammon: number;
    loseBackgammon: number;
}

export interface RolloutRequest {
    xgid: string;
    trials?: number;
    ply?: number;
    candidateMoves: string[];
}

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RolloutProgress {
    jobId: string;
    status: JobStatus;
    progress: number;
    trialsDone: number;
    totalTrials: number;
    currentMove: string;
    etaSeconds: number;
}

export interface RolloutMoveResult {
    rank: number;
    notation: string;
    equity: number;
    standardError: number;
    confidenceInterval: number;
    probabilities: Probabilities;
    isConfirmed: boolean;
    trials: number;
}

export interface RolloutResult {
    jobId: string;
    xgid: string;
    trials: number;
    ply: number;
    durationSeconds: number;
    moves: RolloutMoveResult[];
    confirmedBestMove: string;
    equityDifference: number;
}

export interface PoolStats {
    poolSize: number;
    idleWorkers: number;
    busyWorkers: number;
    queuedJobs: number;
    completedJobs: number;
}

export interface RolloutJobResponse {
    jobId: string;
    status: JobStatus;
    progress: RolloutProgress;
    result: RolloutResult | null;
    error: string | null;
    createdAt: number;
    completedAt?: number | null;
}

export interface RolloutStreamCallbacks {
    onProgress?: (progress: RolloutProgress) => void;
    onComplete?: (result: RolloutResult) => void;
    onError?: (error: Error) => void;
}

const DEFAULT_API_BASE = '';

/**
 * Soumet une tâche de rollout profond asynchrone au pool.
 */
export async function submitRollout(
    request: RolloutRequest,
    apiBase: string = DEFAULT_API_BASE
): Promise<{ jobId: string; status: JobStatus }> {
    const url = `${apiBase}/api/rollout`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            xgid: request.xgid,
            trials: request.trials ?? 1296,
            ply: request.ply ?? 2,
            candidateMoves: request.candidateMoves,
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => resp.statusText);
        throw new Error(`Erreur soumission rollout (${resp.status}): ${errText}`);
    }

    const data = await resp.json();
    return {
        jobId: data.jobId,
        status: data.status,
    };
}

/**
 * Récupère l'état et le résultat éventuel d'une tâche de rollout par polling.
 */
export async function getRolloutJob(
    jobId: string,
    apiBase: string = DEFAULT_API_BASE
): Promise<RolloutJobResponse> {
    const url = `${apiBase}/api/rollout/${encodeURIComponent(jobId)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Erreur récupération job ${jobId} (${resp.status})`);
    }
    return resp.json();
}

/**
 * Annule une tâche de rollout en cours ou en attente.
 */
export async function cancelRollout(
    jobId: string,
    apiBase: string = DEFAULT_API_BASE
): Promise<boolean> {
    const url = `${apiBase}/api/rollout/${encodeURIComponent(jobId)}/cancel`;
    const resp = await fetch(url, { method: 'POST' });
    if (!resp.ok) {
        return false;
    }
    const data = await resp.json().catch(() => ({ cancelled: true }));
    return data.cancelled ?? true;
}

/**
 * Récupère les métriques d'occupation du pool de workers GNUBG.
 */
export async function getPoolStats(
    apiBase: string = DEFAULT_API_BASE
): Promise<PoolStats> {
    const url = `${apiBase}/api/rollout?stats=true`;
    const resp = await fetch(url);
    if (!resp.ok) {
        return {
            poolSize: 4,
            idleWorkers: 4,
            busyWorkers: 0,
            queuedJobs: 0,
            completedJobs: 0,
        };
    }
    return resp.json();
}

/**
 * S'abonne aux événements Server-Sent Events (SSE) de progression en temps réel pour un job.
 * Retourne une fonction de désabonnement pour libérer les ressources.
 */
export function subscribeRolloutProgress(
    jobId: string,
    callbacks: RolloutStreamCallbacks,
    apiBase: string = DEFAULT_API_BASE
): () => void {
    const url = `${apiBase}/api/rollout/${encodeURIComponent(jobId)}/stream`;
    let isAborted = false;

    // Prise en charge standard EventSource (Navigateur)
    if (typeof EventSource !== 'undefined') {
        const es = new EventSource(url);

        es.onmessage = (event) => {
            if (isAborted) return;
            try {
                const payload = JSON.parse(event.data);
                if (payload.status === 'completed' && payload.result) {
                    callbacks.onProgress?.(payload.progress || payload);
                    callbacks.onComplete?.(payload.result);
                    es.close();
                } else if (payload.status === 'failed') {
                    callbacks.onError?.(new Error(payload.error || 'Échec du rollout'));
                    es.close();
                } else if (payload.status === 'cancelled') {
                    callbacks.onError?.(new Error('Rollout annulé'));
                    es.close();
                } else {
                    callbacks.onProgress?.(payload);
                }
            } catch (err: unknown) {
                callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
            }
        };

        es.onerror = () => {
            if (isAborted) return;
            // Si la connexion se coupe ou termine, vérifions par un poll final
            getRolloutJob(jobId, apiBase)
                .then((job) => {
                    if (job.status === 'completed' && job.result) {
                        callbacks.onComplete?.(job.result);
                    } else if (job.status === 'failed') {
                        callbacks.onError?.(new Error(job.error || 'Échec du rollout'));
                    }
                })
                .catch(() => { })
                .finally(() => {
                    es.close();
                });
        };

        return () => {
            isAborted = true;
            es.close();
        };
    }

    // Adaptateur fetch / ReadableStream pour environnements sans EventSource (tests / SSR)
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
        .then(async (resp) => {
            if (!resp.ok) {
                throw new Error(`SSE stream HTTP ${resp.status}`);
            }
            if (!resp.body) return;
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (!isAborted) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;
                    const jsonStr = trimmed.replace(/^data:\s*/, '');
                    try {
                        const payload = JSON.parse(jsonStr);
                        if (payload.status === 'completed' && payload.result) {
                            callbacks.onProgress?.(payload.progress || payload);
                            callbacks.onComplete?.(payload.result);
                            return;
                        } else if (payload.status === 'failed') {
                            callbacks.onError?.(new Error(payload.error || 'Échec du rollout'));
                            return;
                        } else if (payload.status === 'cancelled') {
                            callbacks.onError?.(new Error('Rollout annulé'));
                            return;
                        } else {
                            callbacks.onProgress?.(payload);
                        }
                    } catch {
                        // ignore malformed lines
                    }
                }
            }
        })
        .catch((err) => {
            if (!isAborted && err.name !== 'AbortError') {
                callbacks.onError?.(err);
            }
        });

    return () => {
        isAborted = true;
        controller.abort();
    };
}
