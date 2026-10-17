'use client';

import React, { useState, useEffect } from 'react';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export interface BackendEngineModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme?: ThemeName;
}

export default function BackendEngineModal({ isOpen, onClose, theme }: BackendEngineModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);
    const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        setBackendStatus('checking');

        fetch('/api/evaluate', { method: 'GET' })
            .then((res) => {
                if (res.ok && isMounted) {
                    setBackendStatus('online');
                } else if (isMounted) {
                    setBackendStatus('offline');
                }
            })
            .catch(() => {
                if (isMounted) setBackendStatus('offline');
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCmd(id);
        setTimeout(() => setCopiedCmd(null), 2000);
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="backend-modal-title"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${modalClasses.overlay} animate-in fade-in`}
        >
            <div className={`relative w-full max-w-2xl rounded-2xl p-6 shadow-2xl transition-all ${modalClasses.container}`}>
                {/* Header */}
                <div className={`flex items-center justify-between border-b pb-4 ${modalClasses.border}`}>
                    <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${modalClasses.badge}`}>
                            ⚙️
                        </div>
                        <div>
                            <h2 id="backend-modal-title" className={`text-lg font-bold ${modalClasses.title}`}>
                                Architecture de l’Intelligence Artificielle & Back-End
                            </h2>
                            <p className={`text-xs ${modalClasses.subtitle}`}>
                                Moteur Hybride : Client TypeScript 2-ply + Microservice GNU Backgammon
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`rounded-lg p-1.5 transition ${modalClasses.closeBtn}`}
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                {/* Status Card */}
                <div className="my-4 flex items-center justify-between rounded-xl border border-amber-900/60 bg-stone-950/60 p-3">
                    <div className="flex items-center gap-2.5">
                        <span
                            className={`h-3 w-3 rounded-full ${
                                backendStatus === 'online'
                                    ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-500/40'
                                    : backendStatus === 'checking'
                                    ? 'bg-amber-400 animate-spin'
                                    : 'bg-amber-500'
                            }`}
                        />
                        <div>
                            <div className="text-xs font-bold text-stone-200">
                                {backendStatus === 'online'
                                    ? '🟢 Back-End GNUBG Détecté & Opérationnel'
                                    : backendStatus === 'checking'
                                    ? '🟡 Vérification de la connexion...'
                                    : '⚡ Moteur Local Intégré Actif (TypeScript Expectimax 2-ply)'}
                            </div>
                            <div className="text-[11px] text-stone-400">
                                {backendStatus === 'online'
                                    ? 'Les analyses profondes sont calculées par le binaire officiel GNU Backgammon.'
                                    : 'Fonctionne immédiatement sans aucun serveur requis (100% hors-ligne & Web).'}
                            </div>
                        </div>
                    </div>
                    <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-mono font-bold text-amber-300">
                        {backendStatus === 'online' ? 'Port 8000' : 'Client WASM/TS'}
                    </span>
                </div>

                {/* Content Sections */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs text-stone-300">
                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>📍</span> Où se trouve le Back-End dans le projet ?
                        </h3>
                        <p className="leading-relaxed">
                            Le back-end réside dans le dossier <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-amber-200">/backend-engine</code> à la racine du projet.
                            C’est une application <strong>FastAPI (Python)</strong> qui pilote directement le binaire CLI de référence mondiale <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-amber-200">gnubg -t</code> via un pool de processus workers.
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>🚀</span> Comment lancer le Back-End GNUBG ?
                        </h3>
                        <p className="text-stone-400">
                            Deux méthodes simples au choix pour activer l’analyse neuronale de niveau Maître International :
                        </p>

                        <div className="space-y-2 pt-1">
                            <div>
                                <div className="text-[11px] font-semibold text-stone-300 mb-1 flex items-center justify-between">
                                    <span>Option A : Avec Docker (Recommandé, gnubg déjà compilé)</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard('docker build -t backgammon-engine ./backend-engine && docker run -p 8000:8000 backgammon-engine', 'docker')}
                                        className="text-[10px] text-amber-400 hover:underline"
                                    >
                                        {copiedCmd === 'docker' ? '✓ Copié !' : 'Copier'}
                                    </button>
                                </div>
                                <pre className="rounded bg-black/70 p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
docker build -t backgammon-engine ./backend-engine
docker run -p 8000:8000 backgammon-engine
                                </pre>
                            </div>

                            <div>
                                <div className="text-[11px] font-semibold text-stone-300 mb-1 flex items-center justify-between">
                                    <span>Option B : En Python local (Uvicorn)</span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard('cd backend-engine && pip install -r requirements.txt && uvicorn app.main:app --port 8000', 'pip')}
                                        className="text-[10px] text-amber-400 hover:underline"
                                    >
                                        {copiedCmd === 'pip' ? '✓ Copié !' : 'Copier'}
                                    </button>
                                </div>
                                <pre className="rounded bg-black/70 p-2 font-mono text-[11px] text-emerald-300 overflow-x-auto">
cd backend-engine
pip install -r requirements.txt
uvicorn app.main:app --port 8000
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>🧠</span> Comment joue l’adversaire en mode Web / Déconnecté ?
                        </h3>
                        <p className="leading-relaxed">
                            Si le backend Python n’est pas allumé, le jeu <strong>ne plante jamais</strong> : il exécute le moteur <strong>TypeScript Expectimax 2-ply</strong> directement dans votre navigateur :
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-stone-400">
                            <li><strong className="text-stone-200">Génération exacte des règles WBF</strong> : Prise en compte stricte des doubles (4 coups consécutifs) et réentrée prioritaire depuis la barre.</li>
                            <li><strong className="text-stone-200">Arbre Expectimax</strong> : Évalue l’espérance mathématique sur les 21 lancers possibles de Blanc.</li>
                            <li><strong className="text-stone-200">Animation cadencée à 750 ms</strong> : Visualisation étape par étape de chaque pion, avec dés consommés en direct et arcs de vol dorés.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex justify-end border-t border-amber-800/50 pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-amber-900/50 hover:from-amber-600 hover:to-amber-500 transition active:scale-95"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
}
