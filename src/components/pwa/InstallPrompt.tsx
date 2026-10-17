'use client';

/**
 * Composant de prompt d'installation PWA & Indicateur de mode hors-ligne.
 *
 * Affiche :
 * 1. Une bannière discrète d'installation native quand le navigateur le supporte.
 * 2. Un message guidé pour les utilisateurs Safari iOS (« Sur l'écran d'accueil »).
 * 3. Une pastille contextuelle indiquant le mode hors-ligne actif.
 */

import React, { useState } from 'react';
import { usePWA } from '../../hooks/usePWA';

export default function InstallPrompt() {
    const { isOnline, isInstallable, isInstalled, isIOS, promptInstall, dismissPrompt } = usePWA();
    const [isInstalling, setIsInstalling] = useState(false);
    const [showIosTip, setShowIosTip] = useState(false);

    const handleInstallClick = async () => {
        setIsInstalling(true);
        try {
            await promptInstall();
        } finally {
            setIsInstalling(false);
        }
    };

    return (
        <>
            {/* 1. Indicateur d'état Hors-Ligne */}
            {!isOnline && (
                <div
                    data-testid="pwa-offline-indicator"
                    className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-950/90 px-4 py-2 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-300"
                >
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Mode Hors-Ligne · Sauvegarde locale et IA active</span>
                </div>
            )}

            {/* 2. Bannière d'installation PWA pour navigateurs standards (Chrome, Edge, Samsung, etc.) */}
            {isInstallable && !isInstalled && (
                <div
                    data-testid="pwa-install-banner"
                    role="region"
                    aria-label="Installation de l'application"
                    className="fixed bottom-4 left-4 z-30 max-w-sm w-[calc(100vw-2rem)] rounded-2xl border border-blue-500/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-300 ring-1 ring-white/10"
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl shadow-md shadow-blue-500/20">
                            🎲
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-white">
                                Installer Backgammon Pro
                            </h3>
                            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                                Jouez hors-ligne, bénéficiez du plein écran et d’un lancement instantané.
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    type="button"
                                    data-testid="pwa-install-button"
                                    disabled={isInstalling}
                                    onClick={handleInstallClick}
                                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition active:scale-95 disabled:opacity-50"
                                >
                                    {isInstalling ? 'Installation...' : 'Installer'}
                                </button>
                                <button
                                    type="button"
                                    data-testid="pwa-dismiss-button"
                                    onClick={dismissPrompt}
                                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
                                >
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Guide d'installation spécifique pour Safari iOS */}
            {isIOS && !isInstalled && showIosTip && (
                <div
                    data-testid="pwa-ios-banner"
                    className="fixed bottom-4 left-4 z-30 max-w-sm w-[calc(100vw-2rem)] rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg animate-in slide-in-from-bottom-5 duration-300"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🍏</span>
                            <h4 className="text-xs font-bold text-white">Installer sur iOS</h4>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowIosTip(false)}
                            className="text-slate-400 hover:text-white text-xs"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                        Pour installer l’application sur votre iPhone / iPad, touchez le bouton Partager{' '}
                        <span className="font-bold text-blue-400">⎋</span> puis{' '}
                        <span className="font-bold text-white">« Sur l’écran d’accueil »</span> ➕.
                    </p>
                </div>
            )}
        </>
    );
}
