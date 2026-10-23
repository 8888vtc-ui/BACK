'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
} from '../../lib/supabase/auth';

export interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setInfoMsg(null);
        setLoading(true);

        try {
            if (mode === 'signin') {
                const { error } = await signInWithEmail({ email, password });
                if (error) throw error;
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const { error, data } = await signUpWithEmail({
                    email,
                    password,
                    displayName,
                });
                if (error) throw error;

                if (data.session) {
                    if (onSuccess) onSuccess();
                    onClose();
                } else {
                    setInfoMsg('Compte créé ! Vérifiez vos emails pour confirmer votre inscription.');
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'authentification.';
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setErrorMsg(null);
        setLoading(true);
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Échec de la connexion avec Google.';
            setErrorMsg(message);
            setLoading(false);
        }
    }

    async function handleAppleLogin() {
        setErrorMsg(null);
        setLoading(true);
        try {
            const { error } = await signInWithApple();
            if (error) throw error;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Échec de la connexion avec Apple.';
            setErrorMsg(message);
            setLoading(false);
        }
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
        >
            <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/95 p-6 shadow-2xl shadow-blue-950/40 text-slate-100">
                {/* Bouton fermeture */}
                <button
                    onClick={onClose}
                    data-testid="auth-modal-close-btn"
                    className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    aria-label="Fermer la boîte de dialogue"
                >
                    ✕
                </button>

                {/* Titre & Sous-titre */}
                <div className="text-center mb-6">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 mb-3">
                        <span className="text-2xl">🎲</span>
                    </div>
                    <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight text-white">
                        {mode === 'signin' ? 'Connexion au Tournoi' : 'Créer un Compte Joueur'}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                        Sauvegardez vos parties, vos analyses de coach et votre classement ELO.
                    </p>
                </div>

                {/* Boutons OAuth Google & Apple */}
                <div className="space-y-2.5">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        data-testid="oauth-google-btn"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-750 hover:border-slate-600 hover:text-white transition active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </svg>
                        <span>Continuer avec Google</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleAppleLogin}
                        disabled={loading}
                        data-testid="oauth-apple-btn"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-750 hover:border-slate-600 hover:text-white transition active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.66-2.87 1.47-.61.71-1.14 1.88-1 3 .02.01.07.02.1.02 1.01 0 2.12-.57 2.78-1.39z" />
                        </svg>
                        <span>Continuer avec Apple</span>
                    </button>
                </div>

                {/* Séparateur */}
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-900 px-3 text-slate-500">ou avec votre email</span>
                    </div>
                </div>

                {/* Onglets Connexion / Inscription */}
                <div className="flex rounded-xl bg-slate-950/60 p-1 mb-4 border border-slate-800">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('signin');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                            mode === 'signin'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Connexion
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('signup');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                            mode === 'signup'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        Créer un compte
                    </button>
                </div>

                {/* Messages Erreur / Info */}
                {errorMsg && (
                    <div className="mb-4 rounded-lg bg-red-950/50 border border-red-800/60 p-2.5 text-xs text-red-300">
                        ⚠️ {errorMsg}
                    </div>
                )}
                {infoMsg && (
                    <div className="mb-4 rounded-lg bg-emerald-950/50 border border-emerald-800/60 p-2.5 text-xs text-emerald-300">
                        ✅ {infoMsg}
                    </div>
                )}

                {/* Formulaire Email + Mot de passe */}
                <form onSubmit={handleEmailSubmit} className="space-y-3.5">
                    {mode === 'signup' && (
                        <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                Pseudo / Nom de joueur
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="GrandMaître_77"
                                className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Adresse email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joueur@backgammon.pro"
                            className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-xl bg-slate-950/80 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="email-submit-btn"
                        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Chargement...' : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
                    </button>
                </form>
            </div>
        </div>
    );

    if (mounted && typeof document !== 'undefined') {
        return createPortal(modalContent, document.body);
    }

    return modalContent;
}
