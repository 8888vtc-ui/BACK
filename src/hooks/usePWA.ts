'use client';

/**
 * Hook React pour la gestion de la PWA (Progressive Web App).
 *
 * Gère :
 * - L'enregistrement du Service Worker (/sw.js).
 * - La détection de l'état réseau (en ligne / hors-ligne).
 * - L'interception de l'événement beforeinstallprompt et le déclenchement de l'installation.
 * - La détection du mode autonome (standalone) et des spécificités iOS.
 */

import { useState, useEffect, useCallback } from 'react';

export const DISMISS_KEY = 'backgammon_pwa_dismissed_until';
export const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export function isStandaloneMode(windowObj: any): boolean {
    if (!windowObj) return false;
    const mediaMatch = windowObj.matchMedia?.('(display-mode: standalone)')?.matches;
    return !!(mediaMatch || windowObj.navigator?.standalone === true);
}

export function isIosDevice(userAgent: string, windowObj?: any): boolean {
    const ua = (userAgent || '').toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua) && !(windowObj as any)?.MSStream;
    return isIos;
}

export function isPromptTemporarilyDismissed(storage: Storage | null, now: number = Date.now()): boolean {
    if (!storage) return false;
    try {
        const val = storage.getItem(DISMISS_KEY);
        if (!val) return false;
        return now < parseInt(val, 10);
    } catch {
        return false;
    }
}

export function savePromptDismissal(storage: Storage | null, durationMs: number = DISMISS_DURATION_MS, now: number = Date.now()): void {
    if (!storage) return;
    try {
        storage.setItem(DISMISS_KEY, (now + durationMs).toString());
    } catch {
        // Ignorer
    }
}

export function clearPromptDismissal(storage: Storage | null): void {
    if (!storage) return;
    try {
        storage.removeItem(DISMISS_KEY);
    } catch {
        // Ignorer
    }
}

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UsePWAResult {
    isOnline: boolean;
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    promptInstall: () => Promise<boolean>;
    dismissPrompt: () => void;
}

export function usePWA(): UsePWAResult {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState<boolean>(false);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1. Détection initiale réseau
        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 2. Détection du mode autonome (déjà installé)
        const isStandalone = isStandaloneMode(window);
        setIsInstalled(isStandalone);

        // 3. Détection iOS
        const isIos = isIosDevice(window.navigator.userAgent, window);
        setIsIOS(isIos && !isStandalone);

        // 4. Enregistrement du Service Worker
        if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((reg) => {
                        console.log('[PWA] Service Worker enregistré avec succès:', reg.scope);
                    })
                    .catch((err) => {
                        console.warn('[PWA] Échec d’enregistrement du Service Worker:', err);
                    });
            });
        }

        // 5. Interception du prompt d'installation PWA
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            const pEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(pEvent);

            // Vérifie si l'utilisateur n'a pas masqué le prompt récemment
            const isTemporarilyDismissed = isPromptTemporarilyDismissed(localStorage);

            if (!isTemporarilyDismissed && !isStandalone) {
                setIsInstallable(true);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            clearPromptDismissal(localStorage);
            console.log('[PWA] Application installée avec succès !');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                setIsInstalled(true);
                setIsInstallable(false);
                setDeferredPrompt(null);
                clearPromptDismissal(localStorage);
                return true;
            }
            return false;
        } catch (err) {
            console.error('[PWA] Erreur lors du prompt d’installation:', err);
            return false;
        }
    }, [deferredPrompt]);

    const dismissPrompt = useCallback(() => {
        setIsInstallable(false);
        savePromptDismissal(localStorage);
    }, []);

    return {
        isOnline,
        isInstallable,
        isInstalled,
        isIOS,
        promptInstall,
        dismissPrompt,
    };
}
