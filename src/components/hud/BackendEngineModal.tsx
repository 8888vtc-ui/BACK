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
    const [engineStatus, setEngineStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        setEngineStatus('checking');

        fetch('/api/evaluate', { method: 'GET' })
            .then((res) => {
                if (res.ok && isMounted) {
                    setEngineStatus('online');
                } else if (isMounted) {
                    setEngineStatus('offline');
                }
            })
            .catch(() => {
                if (isMounted) setEngineStatus('offline');
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

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
                                Moteur d’Évaluation & Architecture
                            </h2>
                            <p className={`text-xs ${modalClasses.subtitle}`}>
                                Moteur Pro Expert TypeScript (Tri-Phase) — 100 % local, sans serveur
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
                            className={`h-3 w-3 rounded-full ${engineStatus === 'online'
                                    ? 'bg-emerald-400 animate-pulse ring-2 ring-emerald-500/40'
                                    : engineStatus === 'checking'
                                        ? 'bg-amber-400 animate-spin'
                                        : 'bg-amber-500'
                                }`}
                        />
                        <div>
                            <div className="text-xs font-bold text-stone-200">
                                {engineStatus === 'online'
                                    ? '🟢 Moteur Local Haute Performance Actif'
                                    : engineStatus === 'checking'
                                        ? '🟡 Vérification du moteur...'
                                        : '⚡ Moteur Local Intégré Actif (TypeScript Tri-Phase)'}
                            </div>
                            <div className="text-[11px] text-stone-400">
                                Évaluation déterministe exécutée directement dans votre navigateur, sans latence réseau.
                            </div>
                        </div>
                    </div>
                    <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[10px] font-mono font-bold text-amber-300">
                        TypeScript Tri-Phase
                    </span>
                </div>

                {/* Content Sections */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs text-stone-300">
                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>📍</span> Où se trouve le moteur dans le projet ?
                        </h3>
                        <p className="leading-relaxed">
                            Le moteur d’évaluation réside dans <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-amber-200">src/lib/engine/evaluator.ts</code>.
                            C’est un évaluateur <strong>TypeScript pur</strong> à architecture <strong>tri-phase</strong> (Contact / Crashed / Race-BearOff),
                            inspiré des principes de GNU Backgammon et TD-Gammon, sans aucune dépendance externe.
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>🧠</span> Comment fonctionne l’évaluation tri-phase ?
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-stone-400">
                            <li>
                                <strong className="text-stone-200">Régime RACE / Bear-Off</strong> : formule de course de Thorp
                                (Effective Pip Count + wastage), portes et blots neutralisés car l’adversaire ne peut plus frapper.
                            </li>
                            <li>
                                <strong className="text-stone-200">Régime CONTACT</strong> : 16 caractéristiques stratégiques réelles
                                (probabilité de frappe sur 36 combinaisons, force de prime, ancre défensive, contrôle des flèches clés).
                            </li>
                            <li>
                                <strong className="text-stone-200">Régime CRASHED</strong> : positions écrasées (jan intérieur surchargé
                                ou ≤ 6 pions sur le plateau), évaluées avec les règles de contact.
                            </li>
                            <li>
                                <strong className="text-stone-200">Règles WBF exactes</strong> : doubles (4 coups), réentrée prioritaire
                                depuis la barre, bear-off exact et par dépassement.
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border border-amber-900/40 bg-stone-900/40 p-3.5 space-y-2">
                        <h3 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                            <span>🚀</span> Pourquoi 100 % local ?
                        </h3>
                        <p className="leading-relaxed">
                            L’application est <strong>entièrement autonome</strong> : aucune latence réseau, aucun serveur à déployer,
                            aucune clé API. L’évaluation s’exécute en moins de 1 ms directement dans le navigateur, ce qui garantit
                            une expérience instantanée, hors-ligne et gratuite.
                        </p>
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
