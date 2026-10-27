import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { rateLimiter } from '../../../lib/security/rateLimit';
import { getSharedCoachExplanation, saveCoachExplanationRecord } from '../../../lib/supabase/db';

vi.mock('../../../lib/supabase/db', () => ({
    getSharedCoachExplanation: vi.fn().mockResolvedValue(null),
    saveCoachExplanationRecord: vi.fn().mockResolvedValue(null),
}));

const MOCK_REQUEST_BODY = {
    verdict: 'blunder',
    equityLoss: -0.125,
    playedMove: '13/7',
    optimalMove: '8/4 6/4',
    features: {
        player: 'X',
        pipCountDiff: { player: 140, opponent: 155, leader: 'X', diff: -15 },
        blotsAndShots: {
            user: [{ point: 7, directShots: 6, indirectShots: 0, totalShots: 6 }],
            best: [],
        },
        boardStructure: {
            innerBoardPoints: 3,
            advancedAnchor: true,
            goldenPoint: false,
            barPoint: true,
            longestPrime: 3,
        },
        contactStatus: 'contact',
    },
    matchContext: {
        scoreX: 2,
        scoreO: 1,
        matchLength: 5,
        cubeValue: 1,
        cubeOwner: null,
    },
};

async function readStreamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
    }
    return result;
}

describe('POST /api/coach (Streaming SSE Route)', () => {
    const originalEnv = process.env;
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        rateLimiter.reset();
        process.env = { ...originalEnv };
        vi.restoreAllMocks();
        vi.mocked(getSharedCoachExplanation).mockResolvedValue(null);
        vi.mocked(saveCoachExplanationRecord).mockResolvedValue(null);
    });

    afterEach(() => {
        process.env = originalEnv;
        globalThis.fetch = originalFetch;
    });

    it('retourne HTTP 400 lorsque le payload viole le schéma Zod', async () => {
        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                verdict: 'invalid-verdict',
                equityLoss: 50,
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const data = await res.json();
        expect(data.error).toBe('Erreur de validation des données');
        expect(data.issues).toBeDefined();
    });

    it('retourne HTTP 429 avec en-têtes standard lorsque le rate limiting est dépassé', async () => {
        const clientHeaders = {
            'Content-Type': 'application/json',
            'x-forwarded-for': '198.51.100.99',
        };

        // Envoi de 20 requêtes autorisées (limite profil COACH)
        for (let i = 0; i < 20; i++) {
            const req = new Request('http://localhost:3000/api/coach', {
                method: 'POST',
                headers: clientHeaders,
                body: JSON.stringify(MOCK_REQUEST_BODY),
            });
            const res = await POST(req);
            expect(res.status).toBe(200);
        }

        // La 21e requête doit être bloquée
        const reqBlocked = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: clientHeaders,
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });
        const resBlocked = await POST(reqBlocked);

        expect(resBlocked.status).toBe(429);
        expect(resBlocked.headers.get('Retry-After')).toBeDefined();
        expect(resBlocked.headers.get('X-RateLimit-Limit')).toBe('20');
        expect(resBlocked.headers.get('X-RateLimit-Remaining')).toBe('0');

        const errorJson = await resBlocked.json();
        expect(errorJson.error).toContain('Rate limit');
    });

    it('retourne les bons en-têtes Server-Sent Events', async () => {
        delete process.env.OPENAI_API_KEY;
        delete process.env.LLM_API_KEY;

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('text/event-stream');
        expect(res.headers.get('Cache-Control')).toBe('no-cache, no-transform');
        expect(res.body).not.toBeNull();
    });

    it('streame le repli heuristique sans clé API configurée', async () => {
        delete process.env.OPENAI_API_KEY;
        delete process.env.LLM_API_KEY;

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        const streamedText = await readStreamToString(res.body!);

        expect(streamedText).toContain('data:');
        expect(streamedText).toContain('rule-based-fallback');
        expect(streamedText).toContain('data: [DONE]');
    });

    it('appelle l\'endpoint OpenAI-compatible et streame les tokens', async () => {
        process.env.OPENAI_API_KEY = 'test-mock-key';
        process.env.OPENAI_BASE_URL = 'https://api.openai.test/v1';

        // Simulation d'un stream OpenAI upstream
        const mockUpstreamSse =
            'data: {"choices":[{"delta":{"content":"{\\"summary\\":\\""}}]}\n\n' +
            'data: {"choices":[{"delta":{"content":"Erreur tactique"}}]}\n\n' +
            'data: {"choices":[{"delta":{"content":"\\"}"}}]}\n\n' +
            'data: [DONE]\n\n';

        const encoder = new TextEncoder();
        const upstreamStream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(mockUpstreamSse));
                controller.close();
            },
        });

        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            body: upstreamStream,
        });
        globalThis.fetch = mockFetch;

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        const [calledUrl, calledInit] = mockFetch.mock.calls[0];
        expect(calledUrl).toBe('https://api.openai.test/v1/chat/completions');
        expect(calledInit.headers.Authorization).toBe('Bearer test-mock-key');

        const streamedText = await readStreamToString(res.body!);
        expect(streamedText).toContain('Erreur tactique');
        expect(streamedText).toContain('data: [DONE]');
    });

    it('bascule sur le repli heuristique si l\'appel LLM échoue avec HTTP 500', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        process.env.OPENAI_API_KEY = 'test-key';

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        });

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const streamedText = await readStreamToString(res.body!);
        expect(streamedText).toContain('rule-based-fallback');
        expect(streamedText).toContain('data: [DONE]');
    });

    it('bascule sur le repli heuristique si l\'appel LLM subit une erreur réseau', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        process.env.OPENAI_API_KEY = 'test-key';

        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error / ECONNREFUSED'));

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const streamedText = await readStreamToString(res.body!);
        expect(streamedText).toContain('rule-based-fallback');
        expect(streamedText).toContain('data: [DONE]');
    });

    it('renvoie immédiatement le flux SSE en cas de HIT dans le cache partagé Supabase (0 ms)', async () => {
        vi.mocked(getSharedCoachExplanation).mockResolvedValueOnce({
            id: 'mock-cache-id',
            position_key: 'mock-pos-key',
            summary: 'Blunder critique en ancre',
            explanation: 'Vous avez laissé un pion exposé au tir direct.',
            key_concept: 'Sécurité du blot',
            advice: 'Consolidez le point 5 au lieu de fendre.',
            played_move: '13/7',
            optimal_move: '8/4 6/4',
            verdict: 'blunder',
            equity_loss: -0.125,
            source: 'llm',
            user_id: null,
            game_id: null,
            move_id: null,
            created_at: new Date().toISOString(),
        });

        const fetchSpy = vi.fn();
        globalThis.fetch = fetchSpy;

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        // Aucun appel réseau externe LLM en cas de cache HIT
        expect(fetchSpy).not.toHaveBeenCalled();

        const streamedText = await readStreamToString(res.body!);
        expect(streamedText).toContain('source":"cache"');
        expect(streamedText).toContain('Blunder critique en ancre');
        expect(streamedText).toContain('data: [DONE]');
    });

    it('sauvegarde l\'explication validée dans public.coach_explanations en cas de MISS LLM', async () => {
        vi.mocked(getSharedCoachExplanation).mockResolvedValueOnce(null);
        process.env.OPENAI_API_KEY = 'test-mock-key';
        process.env.OPENAI_BASE_URL = 'https://api.openai.test/v1';

        const mockUpstreamSse =
            'data: {"choices":[{"delta":{"content":"{\\"summary\\":\\"Erreur de slot\\",\\"explanation\\":\\"Avance risquée sans ancrage\\"}"}}]}\n\n' +
            'data: [DONE]\n\n';

        const encoder = new TextEncoder();
        const upstreamStream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(mockUpstreamSse));
                controller.close();
            },
        });

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            body: upstreamStream,
        });

        const req = new Request('http://localhost:3000/api/coach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(MOCK_REQUEST_BODY),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);

        const streamedText = await readStreamToString(res.body!);
        expect(streamedText).toContain('data: [DONE]');

        // Vérification de la persistance L2
        expect(saveCoachExplanationRecord).toHaveBeenCalledWith(
            expect.objectContaining({
                played_move: '13/7',
                optimal_move: '8/4 6/4',
                verdict: 'blunder',
                source: 'llm',
            }),
        );
    });
});
