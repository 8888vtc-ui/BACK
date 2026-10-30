import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { rateLimiter } from '../../../lib/security/rateLimit';

describe('POST /api/scan-position — Reconnaissance Photo Tournoi (Règle 2 Zéro Donnée Factice)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        rateLimiter.reset();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    it('retourne 400 INVALID_IMAGE si imageDataUrl est manquant ou non data:image/*', async () => {
        const req = new Request('http://localhost/api/scan-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageDataUrl: 'https://example.com/not-data-url.jpg' }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = (await res.json()) as { ok: boolean; error: string };
        expect(json.ok).toBe(false);
        expect(json.error).toBe('INVALID_IMAGE');
    });

    it('retourne 503 VISION_API_UNCONFIGURED sans inventer de position si GEMINI_API_KEY est absente (Règle 2)', async () => {
        delete process.env.GEMINI_API_KEY;
        delete process.env.OPENAI_API_KEY;
        delete process.env.LLM_API_KEY;

        const req = new Request('http://localhost/api/scan-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
                orientation: 'bottom-right',
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(503);
        const json = (await res.json()) as { ok: boolean; error: string };
        expect(json.ok).toBe(false);
        expect(json.error).toBe('VISION_API_UNCONFIGURED');
    });

    it('retourne 200 avec le BoardState et le XGID validés lorsque Gemini Vision renvoie les 24 flèches', async () => {
        process.env.GEMINI_API_KEY = 'test-gemini-key';

        const mockVisionJson = JSON.stringify({
            topRowVisual: [5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2],
            bottomRowVisual: [-5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2],
            barX: 0,
            barO: 0,
            cubeValue: 4,
            cubeOwner: 'O',
            dice: [6, 5],
            turn: 'X',
        });

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    choices: [{ message: { content: '```json\n' + mockVisionJson + '\n```' } }],
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } },
            ),
        );

        const req = new Request('http://localhost/api/scan-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
                orientation: 'bottom-right',
                matchLength: 7,
                scoreX: 3,
                scoreO: 2,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        const json = (await res.json()) as {
            ok: boolean;
            result: { xgid: string; totalCheckersX: number; totalCheckersO: number };
        };
        expect(json.ok).toBe(true);
        expect(json.result.totalCheckersX).toBe(15);
        expect(json.result.totalCheckersO).toBe(15);
        expect(json.result.xgid).toContain('XGID=');
    });
});
