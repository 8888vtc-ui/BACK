'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'network';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastOptions {
    duration?: number;
    action?: ToastAction;
}

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: ToastAction;
    createdAt: number;
}

type ToastListener = (toasts: Toast[]) => void;

// Gestionnaire global singleton pour permettre de déclencher des toasts même hors du cycle React (ex. interceptors fetch)
class ToastManager {
    private toasts: Toast[] = [];
    private listeners = new Set<ToastListener>();

    subscribe(listener: ToastListener): () => void {
        this.listeners.add(listener);
        listener(this.toasts);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        const copy = [...this.toasts];
        this.listeners.forEach((listener) => listener(copy));
    }

    add(type: ToastType, title: string, message?: string, options?: ToastOptions): string {
        const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        const toast: Toast = {
            id,
            type,
            title,
            message,
            duration: options?.duration ?? (type === 'error' || type === 'network' ? 7000 : 4500),
            action: options?.action,
            createdAt: Date.now(),
        };
        this.toasts = [...this.toasts, toast];
        this.notify();
        return id;
    }

    remove(id: string): void {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.notify();
    }

    clear(): void {
        this.toasts = [];
        this.notify();
    }

    getAll(): Toast[] {
        return [...this.toasts];
    }
}

export const toastManager = new ToastManager();

/**
 * Fonctions de déclenchement globales utilisables partout dans l'application.
 */
export const toast = {
    info: (title: string, message?: string, options?: ToastOptions): string =>
        toastManager.add('info', title, message, options),
    success: (title: string, message?: string, options?: ToastOptions): string =>
        toastManager.add('success', title, message, options),
    warning: (title: string, message?: string, options?: ToastOptions): string =>
        toastManager.add('warning', title, message, options),
    error: (title: string, message?: string, options?: ToastOptions): string =>
        toastManager.add('error', title, message, options),
    networkError: (message = 'Impossible de contacter le serveur distant.', onRetry?: () => void): string =>
        toastManager.add('network', 'Erreur réseau', message, {
            duration: 8000,
            action: onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined,
        }),
    dismiss: (id: string): void => toastManager.remove(id),
    clear: (): void => toastManager.clear(),
};

interface ToastContextValue {
    toasts: Toast[];
    toast: typeof toast;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({
    children,
    listenNetworkEvents = true,
}: {
    children: React.ReactNode;
    listenNetworkEvents?: boolean;
}) {
    const [toasts, setToasts] = useState<Toast[]>(() => toastManager.getAll());

    useEffect(() => {
        return toastManager.subscribe((updated) => setToasts(updated));
    }, []);

    // Intercepteur d'événements réseau globaux (navigateur)
    useEffect(() => {
        if (!listenNetworkEvents || typeof window === 'undefined') return;

        const handleOffline = () => {
            toast.networkError(
                'Connexion Internet perdue. Vous êtes actuellement en mode hors-ligne.',
            );
        };

        const handleOnline = () => {
            toast.success(
                'Connexion rétablie',
                'Le réseau est de nouveau disponible.',
            );
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = String(reason?.message ?? reason ?? '');
            const isNetwork =
                message.includes('Failed to fetch') ||
                message.includes('NetworkError') ||
                message.includes('Network request failed') ||
                message.includes('ERR_CONNECTION') ||
                message.includes('ERR_INTERNET_DISCONNECTED');

            if (isNetwork) {
                toast.networkError(
                    'Échec de requête réseau. Vérifiez votre connexion ou l’état du serveur.',
                );
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [listenNetworkEvents]);

    const removeToast = useCallback((id: string) => {
        toastManager.remove(id);
    }, []);

    const clearToasts = useCallback(() => {
        toastManager.clear();
    }, []);

    const value = useMemo(
        () => ({
            toasts,
            toast,
            removeToast,
            clearToasts,
        }),
        [toasts, removeToast, clearToasts],
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback sûr hors provider
        return {
            toasts: toastManager.getAll(),
            toast,
            removeToast: (id: string) => toastManager.remove(id),
            clearToasts: () => toastManager.clear(),
        };
    }
    return context;
}
