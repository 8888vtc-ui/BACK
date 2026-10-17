import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    submitRollout,
    getRolloutJob,
    cancelRollout,
    getPoolStats,
    subscribeRolloutProgress,
    RolloutProgress,
    RolloutResult,
} from './rolloutClient';

describe('rolloutClient', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('submitRollout envoie les paramètres et retourne jobId et status', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 202,
            json: async () => ({
                jobId: 'job-1234',
                status: 'queued',
            }),
        } as any);

        const res = await submitRollout({
            xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
            trials: 1296,
            ply: 2,
            candidateMoves: ['8/5 6/5', '24/20 13/10'],
        });

        expect(res.jobId).toBe('job-1234');
        expect(res.status).toBe('queued');
        expect(global.fetch).toHaveBeenCalledWith(
            '/api/rollout',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
        );
    });

    it('submitRollout lève une erreur si la requête échoue', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'Internal Server Error',
        } as any);

        await expect(
            submitRollout({
                xgid: 'XGID=...',
                candidateMoves: ['8/5 6/5'],
            })
        ).rejects.toThrow('Erreur soumission rollout (500)');
    });

    it('getRolloutJob interroge le statut et le résultat', async () => {
        const mockJob = {
            jobId: 'job-1234',
            status: 'completed',
            progress: { progress: 100, trialsDone: 1296, totalTrials: 1296 },
            result: { confirmedBestMove: '8/5 6/5', equityDifference: 0.086 },
        };
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockJob,
        } as any);

        const job = await getRolloutJob('job-1234');
        expect(job.status).toBe('completed');
        expect(job.result?.confirmedBestMove).toBe('8/5 6/5');
    });

    it('cancelRollout envoie un POST sur l endpoint de cancel', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ cancelled: true }),
        } as any);

        const cancelled = await cancelRollout('job-1234');
        expect(cancelled).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('/api/rollout/job-1234/cancel', { method: 'POST' });
    });

    it('getPoolStats retourne les métriques du pool de workers', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                poolSize: 4,
                idleWorkers: 3,
                busyWorkers: 1,
                queuedJobs: 0,
                completedJobs: 12,
            }),
        } as any);

        const stats = await getPoolStats();
        expect(stats.poolSize).toBe(4);
        expect(stats.busyWorkers).toBe(1);
    });

    it('subscribeRolloutProgress streame les événements SSE et termine sur completed', async () => {
        const encoder = new TextEncoder();
        const fakeChunks = [
            'data: ' + JSON.stringify({ progress: 50, trialsDone: 648, totalTrials: 1296 }) + '\n\n',
            'data: ' + JSON.stringify({
                status: 'completed',
                progress: { progress: 100, trialsDone: 1296, totalTrials: 1296 },
                result: {
                    jobId: 'job-stream-1',
                    confirmedBestMove: '8/5 6/5',
                    equityDifference: 0.086,
                    moves: [],
                },
            }) + '\n\n',
        ];

        let index = 0;
        const readableStream = new ReadableStream({
            pull(controller) {
                if (index < fakeChunks.length) {
                    controller.enqueue(encoder.encode(fakeChunks[index++]));
                } else {
                    controller.close();
                }
            },
        });

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            body: readableStream,
        } as any);

        const onProgress = vi.fn();
        const onComplete = vi.fn();
        const onError = vi.fn();

        const unsubscribe = subscribeRolloutProgress('job-stream-1', {
            onProgress,
            onComplete,
            onError,
        });

        // Attente de lecture du stream
        await new Promise((r) => setTimeout(r, 50));

        expect(onProgress).toHaveBeenCalled();
        expect(onComplete).toHaveBeenCalledWith(
            expect.objectContaining({ confirmedBestMove: '8/5 6/5' })
        );
        expect(onError).not.toHaveBeenCalled();

        unsubscribe();
    });
});
