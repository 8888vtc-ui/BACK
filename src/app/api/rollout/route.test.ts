import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getRollout, POST as postRollout } from './route';
import { GET as getJob } from './[jobId]/route';
import { POST as cancelJob } from './[jobId]/cancel/route';
import { GET as streamJob } from './[jobId]/stream/route';

describe('Rollout API Routes', () => {
    beforeEach(() => {
        // Environnement test
    });

    it('POST /api/rollout rejette si xgid est manquant', async () => {
        const req = new NextRequest('http://localhost:3000/api/rollout', {
            method: 'POST',
            body: JSON.stringify({}),
        });
        const resp = await postRollout(req);
        expect(resp.status).toBe(400);
        const data = await resp.json();
        expect(data.error).toBeDefined();
    });

    it('POST /api/rollout accepte la tâche avec statut 202', async () => {
        const req = new NextRequest('http://localhost:3000/api/rollout', {
            method: 'POST',
            body: JSON.stringify({
                xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                trials: 144,
                ply: 2,
                candidateMoves: ['8/5 6/5', '24/20 13/10'],
            }),
        });
        const resp = await postRollout(req);
        expect(resp.status).toBe(202);
        const data = await resp.json();
        expect(data.jobId).toBeDefined();
        expect(data.status).toBeDefined();
    });

    it('GET /api/rollout?stats=true renvoie les statistiques du pool', async () => {
        const req = new NextRequest('http://localhost:3000/api/rollout?stats=true');
        const resp = await getRollout(req);
        expect(resp.status).toBe(200);
        const data = await resp.json();
        expect(data.poolSize).toBeGreaterThanOrEqual(1);
        expect(data.idleWorkers).toBeDefined();
    });

    it('GET /api/rollout/[jobId] et cancel /api/rollout/[jobId]/cancel fonctionnent', async () => {
        // 1. Création
        const req = new NextRequest('http://localhost:3000/api/rollout', {
            method: 'POST',
            body: JSON.stringify({
                xgid: 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10',
                trials: 324,
                candidateMoves: ['8/5 6/5'],
            }),
        });
        const resp = await postRollout(req);
        const { jobId } = await resp.json();

        // 2. Consultation
        const getReq = new NextRequest(`http://localhost:3000/api/rollout/${jobId}`);
        const getResp = await getJob(getReq, { params: Promise.resolve({ jobId }) });
        expect(getResp.status).toBe(200);
        const job = await getResp.json();
        expect(job.jobId).toBe(jobId);

        // 3. Annulation
        const cancelReq = new NextRequest(`http://localhost:3000/api/rollout/${jobId}/cancel`, {
            method: 'POST',
        });
        const cancelResp = await cancelJob(cancelReq, { params: Promise.resolve({ jobId }) });
        expect(cancelResp.status).toBe(200);
        const cancelData = await cancelResp.json();
        expect(cancelData.cancelled).toBe(true);
    });

    it('GET /api/rollout/[jobId]/stream retourne un stream SSE text/event-stream', async () => {
        const req = new NextRequest('http://localhost:3000/api/rollout', {
            method: 'POST',
            body: JSON.stringify({
                xgid: 'XGID=...',
                trials: 144,
                candidateMoves: ['8/5 6/5'],
            }),
        });
        const resp = await postRollout(req);
        const { jobId } = await resp.json();

        const streamReq = new NextRequest(`http://localhost:3000/api/rollout/${jobId}/stream`);
        const streamResp = await streamJob(streamReq, { params: Promise.resolve({ jobId }) });

        expect(streamResp.headers.get('content-type')).toContain('text/event-stream');
        expect(streamResp.body).toBeDefined();
    });
});
