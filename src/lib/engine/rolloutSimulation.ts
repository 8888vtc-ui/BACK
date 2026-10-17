/**
 * Simulateur haute fidélité du pool de workers GNUBG pour les environnements de test / hors-ligne.
 *
 * Reproduit fidèlement le comportement du moteur backend-engine FastAPI (ThreadPoolExecutor + SSE)
 * lorsque le service distant Python n'est pas démarré en local.
 */

import {
    RolloutJobResponse,
    RolloutMoveResult,
    RolloutProgress,
    RolloutRequest,
    RolloutResult,
    PoolStats,
} from './rolloutClient';

interface SimulatedJobState {
    job: RolloutJobResponse;
    request: RolloutRequest;
    isCancelled: boolean;
    listeners: Set<(data: any) => void>;
    timer?: ReturnType<typeof setInterval>;
}

class SimulatedRolloutManager {
    private jobs = new Map<string, SimulatedJobState>();
    private completedCount = 0;
    private maxWorkers = 4;

    getStats(): PoolStats {
        let busy = 0;
        let queued = 0;
        for (const state of this.jobs.values()) {
            if (state.job.status === 'running') busy++;
            else if (state.job.status === 'queued') queued++;
        }
        return {
            poolSize: this.maxWorkers,
            idleWorkers: Math.max(0, this.maxWorkers - busy),
            busyWorkers: busy,
            queuedJobs: queued,
            completedJobs: this.completedCount,
        };
    }

    createJob(request: RolloutRequest): RolloutJobResponse {
        const jobId = `sim-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const totalTrials = request.trials ?? 1296;
        const initialProgress: RolloutProgress = {
            jobId,
            status: 'queued',
            progress: 0.0,
            trialsDone: 0,
            totalTrials,
            currentMove: request.candidateMoves[0] || '8/5 6/5',
            etaSeconds: 4.5,
        };

        const job: RolloutJobResponse = {
            jobId,
            status: 'queued',
            progress: initialProgress,
            result: null,
            error: null,
            createdAt: Date.now(),
        };

        const state: SimulatedJobState = {
            job,
            request,
            isCancelled: false,
            listeners: new Set(),
        };

        this.jobs.set(jobId, state);

        // Lancement asynchrone du traitement
        setTimeout(() => this.runSimulation(jobId), 10);

        return job;
    }

    getJob(jobId: string): RolloutJobResponse | null {
        return this.jobs.get(jobId)?.job || null;
    }

    cancelJob(jobId: string): boolean {
        const state = this.jobs.get(jobId);
        if (!state) return false;
        if (state.job.status === 'completed' || state.job.status === 'cancelled') {
            return false;
        }

        state.isCancelled = true;
        if (state.timer) clearInterval(state.timer);
        state.job.status = 'cancelled';
        state.job.progress.status = 'cancelled';

        const cancelPayload = {
            jobId,
            status: 'cancelled',
            progress: state.job.progress,
            error: 'Rollout annulé par l’utilisateur',
        };

        for (const listener of state.listeners) {
            listener(cancelPayload);
        }

        return true;
    }

    subscribe(jobId: string, listener: (data: any) => void): () => void {
        const state = this.jobs.get(jobId);
        if (!state) {
            listener({ status: 'failed', error: 'Job introuvable' });
            return () => {};
        }

        state.listeners.add(listener);
        // Émettre immédiatement l'état courant
        listener(state.job.status === 'completed' ? state.job : state.job.progress);

        return () => {
            state.listeners.delete(listener);
        };
    }

    private runSimulation(jobId: string) {
        const state = this.jobs.get(jobId);
        if (!state || state.isCancelled) return;

        state.job.status = 'running';
        state.job.progress.status = 'running';

        const totalTrials = state.request.trials ?? 1296;
        const candidateMoves = state.request.candidateMoves.length > 0
            ? state.request.candidateMoves
            : ['8/5 6/5', '24/20 13/10'];

        let currentStep = 0;
        const totalSteps = 10;
        const stepInterval = 40; // ms

        state.timer = setInterval(() => {
            if (state.isCancelled) {
                if (state.timer) clearInterval(state.timer);
                return;
            }

            currentStep++;
            const pct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
            const trialsDone = Math.round(totalTrials * (pct / 100));
            const moveIdx = currentStep <= 5 ? 0 : Math.min(1, candidateMoves.length - 1);
            const remainingSteps = totalSteps - currentStep;
            const eta = Math.max(0, (remainingSteps * stepInterval) / 1000);

            state.job.progress = {
                jobId,
                status: 'running',
                progress: pct,
                trialsDone,
                totalTrials,
                currentMove: candidateMoves[moveIdx] || candidateMoves[0],
                etaSeconds: parseFloat(eta.toFixed(1)),
            };

            for (const listener of state.listeners) {
                listener(state.job.progress);
            }

            if (currentStep >= totalSteps) {
                if (state.timer) clearInterval(state.timer);
                this.finishJob(jobId, candidateMoves, totalTrials);
            }
        }, stepInterval);
    }

    private finishJob(jobId: string, candidateMoves: string[], totalTrials: number) {
        const state = this.jobs.get(jobId);
        if (!state || state.isCancelled) return;

        const se1 = parseFloat((0.42 / Math.sqrt(totalTrials)).toFixed(4));
        const se2 = parseFloat((0.44 / Math.sqrt(totalTrials)).toFixed(4));

        const move1: RolloutMoveResult = {
            rank: 1,
            notation: candidateMoves[0] || '8/5 6/5',
            equity: 0.158,
            standardError: se1,
            confidenceInterval: parseFloat((1.96 * se1).toFixed(3)),
            probabilities: {
                win: 0.540,
                winGammon: 0.162,
                winBackgammon: 0.006,
                loseWin: 0.460,
                loseGammon: 0.122,
                loseBackgammon: 0.004,
            },
            isConfirmed: true,
            trials: totalTrials,
        };

        const move2: RolloutMoveResult = {
            rank: 2,
            notation: candidateMoves[1] || '24/20 13/10',
            equity: 0.072,
            standardError: se2,
            confidenceInterval: parseFloat((1.96 * se2).toFixed(3)),
            probabilities: {
                win: 0.518,
                winGammon: 0.144,
                winBackgammon: 0.005,
                loseWin: 0.482,
                loseGammon: 0.133,
                loseBackgammon: 0.005,
            },
            isConfirmed: false,
            trials: totalTrials,
        };

        const moves = candidateMoves.length === 1 ? [move1] : [move1, move2];
        const result: RolloutResult = {
            jobId,
            xgid: state.request.xgid,
            trials: totalTrials,
            ply: state.request.ply ?? 2,
            durationSeconds: 0.45,
            moves,
            confirmedBestMove: moves[0].notation,
            equityDifference: moves.length > 1 ? parseFloat((moves[0].equity - moves[1].equity).toFixed(3)) : 0.0,
        };

        state.job.status = 'completed';
        state.job.progress.status = 'completed';
        state.job.progress.progress = 100;
        state.job.progress.trialsDone = totalTrials;
        state.job.progress.etaSeconds = 0;
        state.job.result = result;
        state.job.completedAt = Date.now();
        this.completedCount++;

        const completionPayload = {
            status: 'completed',
            progress: state.job.progress,
            result,
        };

        for (const listener of state.listeners) {
            listener(completionPayload);
        }
    }
}

export const simulatedRolloutManager = new SimulatedRolloutManager();
