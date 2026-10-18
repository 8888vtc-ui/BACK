import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET, POST } from './route';
import { rateLimiter } from '../../../lib/security/rateLimit';
import { NextRequest } from 'next/server';

const VALID_XGID = 'XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10';

describe('GET and POST /api/evaluate Route', () => {
    beforeEach(() => {
        rateLimiter.reset();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('GET retourne les informations de service et de statut', async () => {
        const res = await GET();
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.service).toBe('backgammon-evaluate');
        expect(data.status).toBe('online');
        expect(data.engine).toBe('typescript-tri-phase');
    });

    it('POST valide un payload correct et renvoie chequerPlay et cubeDecision', async () => {
        const req = new NextRequest('http://localhost:3000/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xgid: VALID_XGID, ply: 2 }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const data = await res.json();
        expect(Array.isArray(data.chequerPlay)).toBe(true);
        expect(data.cubeDecision).toBeDefined();
        expect(res.headers.get('X-RateLimit-Limit')).toBe('60');
    });

    it('POST rejette un payload avec un format XGID invalide (Zod validation)', async () => {
        const req = new NextRequest('http://localhost:3000/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xgid: 'bad', ply: 2 }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.error).toBe('Erreur de validation des données');
        expect(data.issues).toBeDefined();
    });

    it('POST rejette un ply non conforme (ex: ply 5 > 4)', async () => {
        const req = new NextRequest('http://localhost:3000/api/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xgid: VALID_XGID, ply: 5 }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('POST applique le rate limiting strict (60 requêtes max) et renvoie HTTP 429', async () => {
        const headers = {
            'Content-Type': 'application/json',
            'x-forwarded-for': '198.51.100.88',
        };

        for (let i = 0; i < 60; i++) {
            const req = new NextRequest('http://localhost:3000/api/evaluate', {
                method: 'POST',
                headers,
                body: JSON.stringify({ xgid: VALID_XGID, ply: 2 }),
            });
            const res = await POST(req);
            expect(res.status).toBe(200);
        }

        // 61e requête
        const reqBlocked = new NextRequest('http://localhost:3000/api/evaluate', {
            method: 'POST',
            headers,
            body: JSON.stringify({ xgid: VALID_XGID, ply: 2 }),
        });
        const resBlocked = await POST(reqBlocked);

        expect(resBlocked.status).toBe(429);
        expect(resBlocked.headers.get('Retry-After')).toBeDefined();
        expect(resBlocked.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
});
