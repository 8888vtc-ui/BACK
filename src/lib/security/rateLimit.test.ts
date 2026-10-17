import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    rateLimiter,
    getClientIp,
    checkRateLimit,
    RATE_LIMIT_PROFILES,
} from './rateLimit';

describe('RateLimiter Module', () => {
    beforeEach(() => {
        rateLimiter.reset();
        vi.useRealTimers();
    });

    it('autorise les requêtes en-dessous du quota maximal', () => {
        const key = 'test-ip';
        const limit = 3;
        const windowMs = 10_000;

        const res1 = rateLimiter.check(key, limit, windowMs);
        expect(res1.success).toBe(true);
        expect(res1.remaining).toBe(2);

        const res2 = rateLimiter.check(key, limit, windowMs);
        expect(res2.success).toBe(true);
        expect(res2.remaining).toBe(1);

        const res3 = rateLimiter.check(key, limit, windowMs);
        expect(res3.success).toBe(true);
        expect(res3.remaining).toBe(0);
    });

    it('bloque les requêtes lorsque le quota maximal est dépassé', () => {
        const key = 'test-ip-blocked';
        const limit = 2;
        const windowMs = 10_000;

        rateLimiter.check(key, limit, windowMs);
        rateLimiter.check(key, limit, windowMs);

        const blockedRes = rateLimiter.check(key, limit, windowMs);
        expect(blockedRes.success).toBe(false);
        expect(blockedRes.remaining).toBe(0);
        expect(blockedRes.retryAfter).toBeGreaterThan(0);
    });

    it('isole les quotas entre différentes adresses IP', () => {
        const limit = 1;
        const windowMs = 5_000;

        const ipA = rateLimiter.check('ip-a', limit, windowMs);
        expect(ipA.success).toBe(true);

        const ipABlocked = rateLimiter.check('ip-a', limit, windowMs);
        expect(ipABlocked.success).toBe(false);

        const ipB = rateLimiter.check('ip-b', limit, windowMs);
        expect(ipB.success).toBe(true);
    });

    it('extrait correctement l\'adresse IP depuis les en-têtes proxy', () => {
        const reqCf = new Request('http://localhost', {
            headers: { 'cf-connecting-ip': '203.0.113.195' },
        });
        expect(getClientIp(reqCf)).toBe('203.0.113.195');

        const reqXff = new Request('http://localhost', {
            headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
        });
        expect(getClientIp(reqXff)).toBe('198.51.100.1');

        const reqReal = new Request('http://localhost', {
            headers: { 'x-real-ip': '192.0.2.42' },
        });
        expect(getClientIp(reqReal)).toBe('192.0.2.42');

        const reqNone = new Request('http://localhost');
        expect(getClientIp(reqNone)).toBe('127.0.0.1');
    });

    it('retourne une réponse HTTP 429 avec en-têtes standard via checkRateLimit', () => {
        const req = new Request('http://localhost/api/test', {
            headers: { 'x-forwarded-for': '10.10.10.10' },
        });

        const config = { windowMs: 10_000, max: 2, prefix: 'unit-test' };

        const r1 = checkRateLimit(req, config);
        expect(r1.allowed).toBe(true);
        expect(r1.response).toBeUndefined();

        const r2 = checkRateLimit(req, config);
        expect(r2.allowed).toBe(true);

        const r3 = checkRateLimit(req, config);
        expect(r3.allowed).toBe(false);
        expect(r3.response).toBeDefined();
        expect(r3.response?.status).toBe(429);
        expect(r3.response?.headers.get('Retry-After')).toBeDefined();
        expect(r3.response?.headers.get('X-RateLimit-Limit')).toBe('2');
        expect(r3.response?.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
});
