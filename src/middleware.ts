/**
 * Middleware Next.js — Application globale des en-têtes de sécurité HTTP & Défense en profondeur.
 *
 * Applique :
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options (Anti-Clickjacking)
 * - X-Content-Type-Options (Anti-MIME Sniffing)
 * - Referrer-Policy
 * - Permissions-Policy (Désactivation des API invasives : caméra, micro, géolocalisation)
 * - X-XSS-Protection
 */

import { NextResponse, type NextRequest } from 'next/server';

export const SECURITY_HEADERS = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=()',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' http://localhost:8000 ws://localhost:8000 https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://api.openai.com https://*.run.app",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; '),
};

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Application de l'ensemble des en-têtes de sécurité sur la réponse
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Appliquer sur toutes les routes à l'exception :
         * - des fichiers statiques internes Next.js (_next/static, _next/image)
         * - des fichiers d'icônes et manifestes (favicon.ico, sitemap.xml, robots.txt)
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/).*)',
    ],
};
