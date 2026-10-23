'use client';

/**
 * Hook PWA intelligent pour l'installation native de Backgammon Tour.
 *
 * Spécifications :
 * - Intercepte et conserve 'beforeinstallprompt' pour déclencher l'invite native (Windows, Mac, Android).
 * - Détecte Safari sur iOS / iPadOS pour guider l'utilisateur via une modale dédiée Monte-Carlo.
 * - Détecte l'exécution en mode autonome (display-mode: standalone ou navigator.standalone)
 *   pour masquer complètement le bouton une fois l'application installée.
 * - Strictement 0 `any`, conforme aux règles du projet.
 */

import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface StandaloneWindowCandidate {
    matchMedia?: (query: string) => {
        matches: boolean;
        addEventListener?: (type: string, listener: (e: { matches: boolean }) => void) => void;
        removeEventListener?: (type: string, listener: (e: { matches: boolean }) => void) => void;
    };
    navigator?: Navigator | { standalone?: boolean; maxTouchPoints?: number; userAgent?: string };
}

/**
 * Vérifie si l'application tourne déjà en mode installé / autonome (PWA / PWA-window).
 */
export function isStandaloneMode(win?: StandaloneWindowCandidate | null): boolean {
    if (!win) return false;
    try {
        const mediaMatch = win.matchMedia?.('(display-mode: standalone)')?.matches;
        const nav = win.navigator;
        const isStandaloneSafari = Boolean(
            nav && 'standalone' in nav && (nav as { standalone?: boolean }).standalone === true,
        );
        return Boolean(mediaMatch || isStandaloneSafari);
    } catch {
        return false;
    }
}

/**
 * Détecte si l'appareil est sous iOS ou iPadOS (Safari).
 * Gère les iPhones, iPads standards et iPadOS 13+ (qui se déclare souvent comme Macintosh avec maxTouchPoints > 1).
 */
export function isIosOrIpadOsDevice(win?: StandaloneWindowCandidate | null): boolean {
    if (!win || !win.navigator) return false;
    try {
        const ua = win.navigator.userAgent || '';
        const isStandardIos = /iPhone|iPad|iPod/i.test(ua);
        const maxTouch = 'maxTouchPoints' in win.navigator ? (win.navigator.maxTouchPoints ?? 0) : 0;
        const isIpadOs = /Macintosh/i.test(ua) && maxTouch > 1;
        const isMsStream = Boolean((win as { MSStream?: unknown }).MSStream);
        return (isStandardIos || isIpadOs) && !isMsStream;
    } catch {
        return false;
    }
}

export interface UsePwaInstallResult {
    /** True si l'application tourne déjà en mode PWA autonome */
    isInstalled: boolean;
    /** True si le bouton Installer l'App doit être affiché */
    canInstall: boolean;
    /** True si l'utilisateur est sur iOS / iPadOS Safari non-standalone */
    isIOS: boolean;
    /** True si le prompt natif Chrome/Edge/Android est prêt */
    hasDeferredPrompt: boolean;
    /** État d'ouverture de la modale d'aide iOS */
    showIosModal: boolean;
    /** Contrôle de l'affichage de la modale iOS */
    setShowIosModal: (show: boolean) => void;
    /** Déclenche l'installation native ou ouvre le guide iOS */
    handleInstallClick: () => Promise<boolean>;
}

// Mémoire partagée hors-React pour ne jamais manquer l'événement avant l'hydratation
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
        e.preventDefault();
        globalDeferredPrompt = e as BeforeInstallPromptEvent;
    });
}

export function usePwaInstall(): UsePwaInstallResult {
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
    const [showIosModal, setShowIosModal] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const standalone = isStandaloneMode(window);
        if (standalone) {
            setIsInstalled(true);
        }

        const iosDevice = isIosOrIpadOsDevice(window) && !standalone;
        setIsIOS(iosDevice);

        if (globalDeferredPrompt) {
            setDeferredPrompt(globalDeferredPrompt);
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            const promptEvt = e as BeforeInstallPromptEvent;
            globalDeferredPrompt = promptEvt;
            setDeferredPrompt(promptEvt);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            globalDeferredPrompt = null;
            setShowIosModal(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Écoute dynamique du changement de mode d'affichage
        const mql = window.matchMedia?.('(display-mode: standalone)');
        const handleMediaChange = (e: { matches: boolean }) => {
            if (e.matches) {
                setIsInstalled(true);
                setDeferredPrompt(null);
                globalDeferredPrompt = null;
            }
        };

        mql?.addEventListener?.('change', handleMediaChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
            mql?.removeEventListener?.('change', handleMediaChange);
        };
    }, []);

    const handleInstallClick = useCallback(async (): Promise<boolean> => {
        if (isInstalled) return false;

        if (isIOS) {
            setShowIosModal(true);
            return true;
        }

        const activePrompt = deferredPrompt || globalDeferredPrompt;
        if (activePrompt) {
            try {
                await activePrompt.prompt();
                const choice = await activePrompt.userChoice;
                if (choice.outcome === 'accepted') {
                    setIsInstalled(true);
                    setDeferredPrompt(null);
                    globalDeferredPrompt = null;
                    return true;
                }
                return false;
            } catch {
                return false;
            }
        }

        // Cas de repli si le navigateur n'a pas encore émis 'beforeinstallprompt'
        setShowIosModal(true);
        return false;
    }, [isInstalled, isIOS, deferredPrompt]);

    // Le bouton n'est affiché que si l'app n'est PAS encore installée
    // ET qu'on dispose du prompt natif OU qu'on est sur iOS/iPadOS
    const canInstall = !isInstalled && (Boolean(deferredPrompt || globalDeferredPrompt) || isIOS);

    return {
        isInstalled,
        canInstall,
        isIOS,
        hasDeferredPrompt: Boolean(deferredPrompt || globalDeferredPrompt),
        showIosModal,
        setShowIosModal,
        handleInstallClick,
    };
}

export default usePwaInstall;
