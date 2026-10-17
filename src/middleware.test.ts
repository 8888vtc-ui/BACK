import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, SECURITY_HEADERS } from './middleware';

describe('Security Middleware', () => {
    it('applique l\'ensemble des en-têtes de sécurité requis', () => {
        const req = new NextRequest('http://localhost:3000/drills');
        const res = middleware(req);

        expect(res.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(res.headers.get('Strict-Transport-Security')).toContain('max-age=63072000');
        expect(res.headers.get('Permissions-Policy')).toContain('camera=()');
        expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });

    it('inclut la directive anti-clickjacking et frame-ancestors', () => {
        const req = new NextRequest('http://localhost:3000/api/coach');
        const res = middleware(req);

        expect(res.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
    });
});
