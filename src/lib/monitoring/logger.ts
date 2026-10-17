/**
 * Logger structuré universel (Serveur Next.js & Client navigateur)
 * Produit des logs JSON structurés en environnement serveur et formatés en environnement client.
 */

import { captureException } from './sentry';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
    timestamp: string;
    level: LogLevel;
    service: string;
    correlationId?: string;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    durationMs?: number;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};

class StructuredLogger {
    private serviceName: string;
    private defaultContext: Record<string, unknown>;
    private minLevel: LogLevel;

    constructor(
        serviceName = 'backgammon-app',
        defaultContext: Record<string, unknown> = {},
        minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
    ) {
        this.serviceName = serviceName;
        this.defaultContext = defaultContext;
        this.minLevel = minLevel;
    }

    /**
     * Crée une instance dérivée avec contexte enrichi (ex: requestId, userId, module)
     */
    child(context: Record<string, unknown>): StructuredLogger {
        return new StructuredLogger(this.serviceName, { ...this.defaultContext, ...context }, this.minLevel);
    }

    private shouldLog(level: LogLevel): boolean {
        if (process.env.NODE_ENV === 'test' && !process.env.DEBUG_TESTS) {
            // Évite de polluer la console de test à moins de spécifier explicitement DEBUG_TESTS
            return level === 'error';
        }
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
    }

    private formatError(err: unknown): { name: string; message: string; stack?: string } | undefined {
        if (!err) return undefined;
        if (err instanceof Error) {
            return {
                name: err.name,
                message: err.message,
                stack: err.stack,
            };
        }
        return {
            name: 'UnknownError',
            message: String(err),
        };
    }

    private emit(level: LogLevel, message: string, context?: Record<string, unknown>, err?: unknown): StructuredLogEntry {
        const mergedContext = { ...this.defaultContext, ...context };
        const correlationId = (mergedContext.correlationId as string) || (mergedContext.requestId as string) || undefined;

        const entry: StructuredLogEntry = {
            timestamp: new Date().toISOString(),
            level,
            service: this.serviceName,
            correlationId,
            message,
            context: Object.keys(mergedContext).length > 0 ? mergedContext : undefined,
            error: this.formatError(err),
        };

        if (this.shouldLog(level)) {
            const isServer = typeof window === 'undefined';

            if (isServer) {
                // Format JSON standard pour ingesteurs de logs (Datadog, Loki, CloudWatch, Vercel)
                const jsonOutput = JSON.stringify(entry);
                if (level === 'error') {
                    console.error(jsonOutput);
                } else if (level === 'warn') {
                    console.warn(jsonOutput);
                } else {
                    console.log(jsonOutput);
                }
            } else {
                // Format lisible navigateur avec horodatage et contexte
                const prefix = `[${entry.timestamp.substring(11, 19)}] [${level.toUpperCase()}] [${entry.service}]`;
                const args: unknown[] = [prefix, message];
                if (entry.context) args.push(entry.context);
                if (entry.error) args.push(entry.error);

                if (level === 'error') {
                    console.error(...args);
                } else if (level === 'warn') {
                    console.warn(...args);
                } else if (level === 'debug') {
                    console.debug(...args);
                } else {
                    console.info(...args);
                }
            }
        }

        // Si niveau ERROR, transfert automatique à Sentry si configuré
        if (level === 'error' && err) {
            captureException(err, {
                tags: {
                    service: this.serviceName,
                    ...(correlationId ? { correlationId } : {}),
                },
                extra: mergedContext,
            });
        }

        return entry;
    }

    debug(message: string, context?: Record<string, unknown>): StructuredLogEntry {
        return this.emit('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): StructuredLogEntry {
        return this.emit('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>, err?: unknown): StructuredLogEntry {
        return this.emit('warn', message, context, err);
    }

    error(message: string, err?: unknown, context?: Record<string, unknown>): StructuredLogEntry {
        return this.emit('error', message, context, err);
    }

    /**
     * Mesure et logue la durée d'une opération asynchrone
     */
    async measure<T>(name: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
        const start = performance.now();
        this.debug(`Début opération: ${name}`, context);
        try {
            const result = await fn();
            const durationMs = Math.round(performance.now() - start);
            this.info(`Succès opération: ${name}`, { ...context, durationMs });
            return result;
        } catch (error) {
            const durationMs = Math.round(performance.now() - start);
            this.error(`Échec opération: ${name}`, error, { ...context, durationMs });
            throw error;
        }
    }
}

export const logger = new StructuredLogger();
export default logger;
