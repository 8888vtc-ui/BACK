import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
    status: 'ok' | 'degraded';
    service: string;
    version: string;
    uptimeSeconds: number;
    timestamp: string;
    checks: {
        backendEngine: {
            status: 'ok' | 'unreachable' | 'degraded';
            latencyMs?: number;
            error?: string;
        };
        supabase: {
            status: 'configured' | 'not_configured';
        };
        memory: {
            rssMb: number;
            heapUsedMb: number;
        };
    };
}

const startTime = Date.now();

export async function GET() {
    const rawBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://127.0.0.1:8000').trim();
    const cleanBackendUrl = rawBackendUrl.replace(/\/+$/, '');
    const healthUrl = `${cleanBackendUrl}/health`;

    let backendStatus: 'ok' | 'unreachable' | 'degraded' = 'unreachable';
    let backendLatency: number | undefined;
    let backendError: string | undefined;

    const startPing = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(healthUrl, {
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeoutId);

        backendLatency = Date.now() - startPing;
        if (res.ok) {
            backendStatus = 'ok';
        } else {
            backendStatus = 'degraded';
            backendError = `HTTP ${res.status}`;
        }
    } catch (err) {
        backendLatency = Date.now() - startPing;
        backendStatus = 'unreachable';
        backendError = err instanceof Error ? err.message : String(err);
    }

    const hasSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const mem = process.memoryUsage ? process.memoryUsage() : { rss: 0, heapUsed: 0 };
    const overallStatus: 'ok' | 'degraded' = backendStatus === 'ok' ? 'ok' : 'degraded';

    const result: HealthCheckResult = {
        status: overallStatus,
        service: 'backgammon-frontend',
        version: process.env.npm_package_version || '0.1.0',
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        checks: {
            backendEngine: {
                status: backendStatus,
                latencyMs: backendLatency,
                error: backendError,
            },
            supabase: {
                status: hasSupabase ? 'configured' : 'not_configured',
            },
            memory: {
                rssMb: Math.round(mem.rss / 1024 / 1024),
                heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
            },
        },
    };

    return NextResponse.json(result, {
        status: overallStatus === 'ok' ? 200 : 207, // 207 Multi-Status if backend degraded
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });
}
