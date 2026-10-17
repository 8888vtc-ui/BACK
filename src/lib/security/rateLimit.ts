/**
 * Rate Limiter en mémoire (Sliding Window Counter) pour les API Routes Next.js.
 * 
 * Permet de protéger les endpoints sensibles (/api/coach, /api/evaluate, /api/rollout)
 * contre les abus, attaques par déni de service (DoS) et surconsommation de quotas LLM/GNUBG.
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
    /** Durée de la fenêtre glissante en millisecondes (défaut : 60 000 ms = 1 min) */
    windowMs: number;
    /** Nombre maximal de requêtes autorisées par fenêtre (défaut : 30) */
    max: number;
    /** Identifiant de la ressource ou endpoint (ex: 'coach', 'evaluate') */
    prefix?: string;
}

export interface RateLimitResult {
    /** True si la requête est autorisée, false si elle est bloquée */
    success: boolean;
    /** Nombre maximum de requêtes permises dans la fenêtre */
    limit: number;
    /** Nombre de requêtes restantes */
    remaining: number;
    /** Timestamp Unix (ms) auquel la fenêtre se réinitialise */
    reset: number;
    /** Nombre de secondes à attendre avant de réessayer si bloqué */
    retryAfter: number;
}

interface RequestLog {
    timestamps: number[];
}

/**
 * Stockage en mémoire des requêtes par clé IP/client.
 * Les entrées expirées sont nettoyées automatiquement à intervalle régulier.
 */
class MemoryRateLimiter {
    private store = new Map<string, RequestLog>();
    private lastCleanup = Date.now();
    private readonly CLEANUP_INTERVAL = 30_000; // Nettoyage toutes les 30s

    /**
     * Vérifie et consomme un jeton pour une clé donnée selon la fenêtre glissante.
     */
    public check(key: string, limit: number, windowMs: number): RateLimitResult {
        const now = Date.now();
        this.maybeCleanup(now, windowMs);

        let record = this.store.get(key);
        if (!record) {
            record = { timestamps: [] };
            this.store.set(key, record);
        }

        // Filtrer les timestamps tombés hors de la fenêtre glissante
        const windowStart = now - windowMs;
        record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

        const currentCount = record.timestamps.length;
        const resetTime = (record.timestamps[0] ?? now) + windowMs;
        const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

        if (currentCount >= limit) {
            return {
                success: false,
                limit,
                remaining: 0,
                reset: resetTime,
                retryAfter: retryAfterSeconds,
            };
        }

        // Ajouter le timestamp de la requête actuelle
        record.timestamps.push(now);

        return {
            success: true,
            limit,
            remaining: Math.max(0, limit - record.timestamps.length),
            reset: resetTime,
            retryAfter: 0,
        };
    }

    /**
     * Réinitialise le store (utile principalement pour les tests unitaires).
     */
    public reset(): void {
        this.store.clear();
        this.lastCleanup = Date.now();
    }

    private maybeCleanup(now: number, windowMs: number): void {
        if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
            return;
        }
        this.lastCleanup = now;
        const threshold = now - windowMs;

        for (const [key, record] of this.store.entries()) {
            record.timestamps = record.timestamps.filter((ts) => ts > threshold);
            if (record.timestamps.length === 0) {
                this.store.delete(key);
            }
        }
    }
}

export const rateLimiter = new MemoryRateLimiter();

/**
 * Extrait l'adresse IP du client depuis les en-têtes HTTP standard.
 */
export function getClientIp(req: NextRequest | Request): string {
    const headers = req.headers;
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) return cfConnectingIp.trim();

    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // En cas de proxies multiples, la première adresse est celle du client d'origine
        const firstIp = xForwardedFor.split(',')[0]?.trim();
        if (firstIp) return firstIp;
    }

    const xRealIp = headers.get('x-real-ip');
    if (xRealIp) return xRealIp.trim();

    return '127.0.0.1';
}

/**
 * Configurations de rate limiting pré-établies pour les différents endpoints.
 */
export const RATE_LIMIT_PROFILES = {
    /** Coach LLM : 20 requêtes par minute (coûteux en calcul et tokens) */
    COACH: {
        windowMs: 60_000,
        max: 20,
        prefix: 'coach',
    },
    /** Moteur d'évaluation GNUBG : 60 requêtes par minute */
    EVALUATE: {
        windowMs: 60_000,
        max: 60,
        prefix: 'evaluate',
    },
    /** Rollout profond asynchrone : 10 soumissions par minute */
    ROLLOUT: {
        windowMs: 60_000,
        max: 10,
        prefix: 'rollout',
    },
    /** Validation d'action multijoueur (anti-flood) : 120 requêtes par minute */
    MULTIPLAYER_ACTION: {
        windowMs: 60_000,
        max: 120,
        prefix: 'multiplayer-action',
    },
} as const;

/**
 * Applique le rate limiting à une requête Next.js.
 * Retourne une Response HTTP 429 avec en-têtes standard si la limite est atteinte,
 * ou null si la requête est autorisée.
 */
export function checkRateLimit(
    req: NextRequest | Request,
    config: RateLimitConfig,
): { allowed: boolean; response?: Response; result: RateLimitResult } {
    const ip = getClientIp(req);
    const key = `${config.prefix || 'api'}:${ip}`;
    const result = rateLimiter.check(key, config.max, config.windowMs);

    const headers = new Headers({
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
    });

    if (!result.success) {
        headers.set('Retry-After', String(result.retryAfter));
        headers.set('Content-Type', 'application/json');

        const body = JSON.stringify({
            error: 'Trop de requêtes (Rate limit dépassé)',
            message: `Vous avez dépassé le quota autorisé (${config.max} requêtes par minute). Veuillez réessayer dans ${result.retryAfter} seconde(s).`,
            retryAfter: result.retryAfter,
            limit: result.limit,
        });

        return {
            allowed: false,
            response: new Response(body, {
                status: 429,
                statusText: 'Too Many Requests',
                headers,
            }),
            result,
        };
    }

    return { allowed: true, result };
}
