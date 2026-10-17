import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';

describe('GET /api/health (Frontend Healthcheck)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('retourne le statut "ok" lorsque le backend répond correctement', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: 'ok' }),
        } as unknown as Response);

        const response = await GET();
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('ok');
        expect(data.service).toBe('backgammon-frontend');
        expect(data.checks.backendEngine.status).toBe('ok');
        expect(data.checks.memory).toBeDefined();
        expect(data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('retourne le statut "degraded" avec HTTP 207 si le backend est inaccessible', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

        const response = await GET();
        expect(response.status).toBe(207);

        const data = await response.json();
        expect(data.status).toBe('degraded');
        expect(data.checks.backendEngine.status).toBe('unreachable');
        expect(data.checks.backendEngine.error).toContain('Connection refused');
    });
});
