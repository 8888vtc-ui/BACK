/**
 * Abstraction & utilitaires de monitoring Sentry (Frontend Client, SSR & API Routes)
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryContext {
    tags?: Record<string, string | number | boolean>;
    extra?: Record<string, unknown>;
    user?: {
        id?: string;
        username?: string;
        email?: string;
    };
    level?: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';
}

/**
 * Indique si Sentry est configuré et actif
 */
export function isSentryEnabled(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN);
}

/**
 * Capture une exception avec tags et métadonnées contextuelles
 */
export function captureException(error: unknown, context?: SentryContext): string {
    if (!isSentryEnabled() && process.env.NODE_ENV === 'test') {
        return 'test-mock-event-id';
    }

    return Sentry.captureException(error, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level || 'error',
    });
}

/**
 * Capture un message informatif ou d'avertissement dans Sentry
 */
export function captureMessage(message: string, context?: SentryContext): string {
    if (!isSentryEnabled() && process.env.NODE_ENV === 'test') {
        return 'test-mock-message-id';
    }

    return Sentry.captureMessage(message, {
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        level: context?.level || 'info',
    });
}

/**
 * Associe l'utilisateur connecté aux traces et erreurs Sentry
 */
export function setMonitoringUser(user: { id: string; username?: string; email?: string } | null): void {
    if (!isSentryEnabled() && process.env.NODE_ENV === 'test') return;
    Sentry.setUser(user);
}

/**
 * Définit un tag global pour les contextes d'erreurs (ex: matchId, mode de jeu, version)
 */
export function setMonitoringTag(key: string, value: string | number | boolean): void {
    if (!isSentryEnabled() && process.env.NODE_ENV === 'test') return;
    Sentry.setTag(key, String(value));
}

/**
 * Enregistre un fil d'Ariane (breadcrumb) pour suivre la chronologie des actions avant crash
 */
export function addMonitoringBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    data?: Record<string, unknown>;
}): void {
    if (!isSentryEnabled() && process.env.NODE_ENV === 'test') return;
    Sentry.addBreadcrumb({
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: breadcrumb.level || 'info',
        data: breadcrumb.data,
    });
}
