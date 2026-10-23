'use client';

/**
 * Hook React pour la gestion du cycle de vie PWA.
 *
 * Gère :
 * - L'enregistrement du Service Worker et la notification de mise à jour sécurisée sans perte de partie.
 * - La détection de connectivité (online/offline).
 * - L'interception de 'beforeinstallprompt' et prompt d'installation.
 * - La détection du mode autonome (standalone) et des spécificités iOS.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const DISMISS_KEY = 'backgammon_pwa_dismissed_until';
export const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
export const SW_BEFORE_RELOAD_EVENT = 'backgammon:before-sw-reload';

export interface StandaloneWindowCandidate {
    matchMedia?: (query: string) => {
        matches: boolean;
        addEventListener?: (type: string, listener: (e: { matches: boolean }) => void) => void;
        removeEventListener?: (type: string, listener: (e: { matches: boolean }) => void) => void;
    };
    navigator?: Navigator | { standalone?: boolean };
}

export function isStandaloneMode(windowObj?: StandaloneWindowCandidate | null): boolean {
    if (!windowObj) return false;
    try {
        const mediaMatch = windowObj.matchMedia?.('(display-mode: standalone)')?.matches;
        const nav = windowObj.navigator;
        const isStandaloneSafari = Boolean(
            nav && 'standalone' in nav && (nav as { standalone?: boolean }).standalone === true,
        );
        return Boolean(mediaMatch || isStandaloneSafari);
    } catch {
        return false;
    }
}

export function isIosDevice(
    userAgent: string,
    windowObj?: { MSStream?: unknown } | null,
): boolean {
    const ua = (userAgent || '').toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !windowObj?.MSStream;
}

export function isPromptTemporarilyDismissed(
    storage: Storage | null,
    now: number = Date.now(),
): boolean {
    if (!storage) return false;
    try {
        const val = storage.getItem(DISMISS_KEY);
        if (!val) return false;
        const parsed = parseInt(val, 10);
        return !Number.isNaN(parsed) && now < parsed;
    } catch {
        return false;
    }
}

export function savePromptDismissal(
    storage: Storage | null,
    durationMs: number = DISMISS_DURATION_MS,
    now: number = Date.now(),
): void {
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

export const OFFLINE_CORE_ASSETS = [
    '/',
    '/progression',
    '/drills',
    '/puzzles',
    '/history',
    '/manifest.json',
    '/icons/icon-192.svg',
    '/icons/icon-512.svg',
    '/engine/wildbg.wasm',
    '/wasm/wildbg_wasm_bg.wasm',
] as const;

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface UsePWAResult {
    isOnline: boolean;
    isInstallable: boolean;
    isInstalled: boolean;
    isIOS: boolean;
    isOfflineReady: boolean;
    wasmCached: boolean;
    hasUpdate: boolean;
    promptInstall: () => Promise<boolean>;
    dismissPrompt: () => void;
    applyUpdate: (options?: { deferReload?: boolean }) => void;
    prewarmOfflineAssets: () => Promise<boolean>;
}

export async function checkWasmCached(cachesApi?: CacheStorage): Promise<boolean> {
    if (!cachesApi) return false;
    try {
        const matchEngine = await cachesApi.match('/engine/wildbg.wasm');
        if (matchEngine) return true;
        const matchLegacy = await cachesApi.match('/wasm/wildbg_wasm_bg.wasm');
        return Boolean(matchLegacy);
    } catch {
        return false;
    }
}

export function usePWA(): UsePWAResult {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState<boolean>(false);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const [isOfflineReady, setIsOfflineReady] = useState<boolean>(false);
    const [wasmCached, setWasmCached] = useState<boolean>(false);
    const [hasUpdate, setHasUpdate] = useState<boolean>(false);
    const waitingWorkerRef = useRef<ServiceWorker | null>(null);

    const prewarmOfflineAssets = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('caches' in window)) return false;
        try {
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'PREWARM_ASSETS',
                    urls: [...OFFLINE_CORE_ASSETS],
                });
            }
            const cache = await window.caches.open('backgammon-pwa-v3');
            await Promise.allSettled(OFFLINE_CORE_ASSETS.map((url) => cache.add(url)));
            const hasWasm = await checkWasmCached(window.caches);
            setWasmCached(hasWasm);
            setIsOfflineReady(true);
            return true;
        } catch {
            return false;
        }
    }, []);

    const applyUpdate = useCallback((options?: { deferReload?: boolean }) => {
        const worker = waitingWorkerRef.current;
        if (!worker) return;
        setHasUpdate(false);
        worker.postMessage({ type: 'SKIP_WAITING' });
        worker.addEventListener('statechange', (e) => {
            const target = e.target as ServiceWorker;
            if (target.state === 'activated' && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(SW_BEFORE_RELOAD_EVENT));
                if (!options?.deferReload) {
                    window.location.reload();
                }
            }
        });
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const isStandalone = isStandaloneMode(window);
        setIsInstalled(isStandalone);
        setIsIOS(isIosDevice(window.navigator.userAgent, window as { MSStream?: unknown }) && !isStandalone);

        if ('caches' in window) {
            checkWasmCached(window.caches).then((cached) => {
                setWasmCached(cached);
                if (cached) setIsOfflineReady(true);
            });
        }

        if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'test') {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

            if (process.env.NODE_ENV !== 'production' || isLocalhost) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const reg of registrations) reg.unregister();
                }).catch(() => {});
            } else {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then((reg) => {
                        setIsOfflineReady(true);
                        if (reg.waiting) {
                            waitingWorkerRef.current = reg.waiting;
                            setHasUpdate(true);
                        }
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        waitingWorkerRef.current = newWorker;
                                        setHasUpdate(true);
                                    }
                                });
                            }
                        });
                        if (reg.active) {
                            reg.active.postMessage({ type: 'PREWARM_ASSETS', urls: [...OFFLINE_CORE_ASSETS] });
                        }
                        if ('caches' in window) checkWasmCached(window.caches).then(setWasmCached);
                    }).catch((err) => {
                        console.warn('[PWA] Échec d’enregistrement SW:', err);
                    });
                });
            }
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            if (!isPromptTemporarilyDismissed(localStorage) && !isStandaloneMode(window)) {
                setIsInstallable(true);
            }
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            clearPromptDismissal(localStorage);
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
        if (!deferredPrompt) return false;
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
        } catch {
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
        isOfflineReady,
        wasmCached,
        hasUpdate,
        promptInstall,
        dismissPrompt,
        applyUpdate,
        prewarmOfflineAssets,
    };
}
