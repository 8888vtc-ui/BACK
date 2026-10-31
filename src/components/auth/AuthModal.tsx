'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    registerPlayerPassportLead,
    resetPasswordForEmail,
    savePlayerPassport,
    type PlayerExperienceTier,
} from '../../lib/supabase/auth';
import { useTranslation } from '../../i18n';

export interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    /** Indique si la modale a été ouverte par le barrage obligatoire avant de jouer */
    requireRegistrationNote?: string | null;
}

export default function AuthModal({
    isOpen,
    onClose,
    onSuccess,
    requireRegistrationNote = null,
}: AuthModalProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'passport' | 'signin' | 'signup' | 'forgot'>('passport');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [experienceLevel, setExperienceLevel] = useState<PlayerExperienceTier>('intermediate');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);
    const { locale } = useTranslation();
    const isEn = locale === 'en';

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
            if (mode === 'passport') {
                const { error } = await registerPlayerPassportLead({
                    pseudo: displayName,
                    email,
                    experienceLevel,
                });
                if (error) throw error;
                if (onSuccess) onSuccess();
                onClose();
                return;
            }

            if (mode === 'forgot') {
                const { error } = await resetPasswordForEmail(email);
                if (error) throw error;
                setInfoMsg(
                    isEn
                        ? 'Password reset link sent! Check your inbox.'
                        : 'Lien de réinitialisation envoyé ! Vérifiez votre boîte mail.',
                );
                return;
            }

            if (mode === 'signin') {
                const { error, data } = await signInWithEmail({ email, password });
                if (error) throw error;
                const userPseudo =
                    (typeof data.user?.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name) ||
                    email.split('@')[0] ||
                    'Joueur';
                savePlayerPassport({
                    pseudo: userPseudo,
                    email,
                    experienceLevel,
                    registeredAt: new Date().toISOString(),
                    supabaseSynced: true,
                });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                const { error } = await signUpWithEmail({
                    email,
                    password,
                    displayName,
                });
                if (error) throw error;

                savePlayerPassport({
                    pseudo: displayName.trim() || email.split('@')[0] || 'Joueur',
                    email,
                    experienceLevel,
                    registeredAt: new Date().toISOString(),
                    supabaseSynced: true,
                });

                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : isEn
                      ? 'An authentication error occurred.'
                      : "Une erreur est survenue lors de l'authentification.";
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
            const message =
                err instanceof Error
                    ? err.message
                    : isEn
                      ? 'Google sign-in failed.'
                      : 'Échec de la connexion avec Google.';
            setErrorMsg(message);
            setLoading(false);
        }
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            data-testid="player-passport-auth-modal"
        >
            <div className="relative w-full max-w-md rounded-2xl border border-[#d4af37]/40 bg-[#0e121b] p-5 sm:p-6 shadow-2xl text-slate-100">
                <button
                    type="button"
                    onClick={onClose}
                    data-testid="auth-modal-close-btn"
                    className="absolute top-3.5 right-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                    aria-label={isEn ? 'Close dialog' : 'Fermer la boîte de dialogue'}
                >
                    ✕
                </button>

                <div className="text-center mb-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#f3c65f]/50 bg-[#1a1209] shadow-md mb-2">
                        <span className="text-xl">⚜️</span>
                    </div>
                    <h2 id="auth-modal-title" className="text-lg sm:text-xl font-black tracking-tight text-[#fdf8eb]">
                        {mode === 'passport'
                            ? isEn
                                ? 'Monte-Carlo Player Passport'
                                : 'Passeport Joueur — Cercle Monte-Carlo'
                            : mode === 'signin'
                              ? isEn
                                  ? 'Member Sign In'
                                  : 'Connexion Membre'
                              : mode === 'forgot'
                                ? isEn
                                    ? 'Reset Password'
                                    : 'Mot de passe oublié'
                                : isEn
                                  ? 'Create Full Account'
                                  : 'Créer un Compte Complet'}
                    </h2>
                    <p className="mt-1 text-xs text-amber-200/90 font-medium">
                        {requireRegistrationNote ||
                            (isEn
                                ? 'Required to unlock the board, save your ERH Index & Gold Seals.'
                                : 'Inscription rapide requise pour débloquer le plateau, votre Indice ERH et vos Sceaux d’Or.')}
                    </p>
                </div>

                {/* Bouton OAuth Google 1-Clic */}
                <div className="mb-3.5">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        data-testid="oauth-google-btn"
                        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-slate-800/90 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 hover:border-[#f3c65f]/50 transition active:scale-[0.98] disabled:opacity-50"
                    >
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                        </svg>
                        <span>{isEn ? 'Continue in 1 click with Google' : 'Continuer en 1 clic avec Google'}</span>
                    </button>
                </div>

                {/* Onglets Passeport Express (5s) / Connexion / Mot de passe */}
                <div className="flex rounded-xl bg-black/50 p-1 mb-3.5 border border-white/10">
                    <button
                        type="button"
                        data-testid="auth-tab-passport"
                        onClick={() => {
                            setMode('passport');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-[11px] sm:text-xs font-extrabold transition ${
                            mode === 'passport'
                                ? 'bg-[#f3c65f] text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        ⚡ {isEn ? 'Express (5s)' : 'Accès Rapide (5s)'}
                    </button>
                    <button
                        type="button"
                        data-testid="auth-tab-signin"
                        onClick={() => {
                            setMode('signin');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                            mode === 'signin'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {isEn ? 'Sign In' : 'Connexion'}
                    </button>
                    <button
                        type="button"
                        data-testid="auth-tab-signup"
                        onClick={() => {
                            setMode('signup');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold transition ${
                            mode === 'signup'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        {isEn ? 'Sign Up' : 'Créer un compte'}
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-3 rounded-lg bg-red-950/60 border border-red-700/60 p-2.5 text-xs text-red-200">
                        ⚠️ {errorMsg}
                    </div>
                )}
                {infoMsg && (
                    <div className="mb-3 rounded-lg bg-emerald-950/60 border border-emerald-700/60 p-2.5 text-xs text-emerald-200">
                        ✅ {infoMsg}
                    </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                    {(mode === 'passport' || mode === 'signup') && (
                        <div>
                            <label className="block text-xs font-bold text-amber-100 mb-1">
                                {isEn ? '1. Your Player Nickname *' : '1. Votre Pseudo de Joueur *'}
                            </label>
                            <input
                                type="text"
                                required
                                minLength={2}
                                data-testid="passport-pseudo-input"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={isEn ? 'e.g. Marco_MC' : 'ex: Marco_MonteCarlo'}
                                className="w-full rounded-xl bg-slate-950/90 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c65f]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-amber-100 mb-1">
                            {mode === 'passport' || mode === 'signup'
                                ? isEn
                                    ? '2. Your Email Address *'
                                    : '2. Votre Adresse Email *'
                                : isEn
                                  ? 'Email Address'
                                  : 'Adresse email'}
                        </label>
                        <input
                            type="email"
                            required
                            data-testid="passport-email-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joueur@email.com"
                            className="w-full rounded-xl bg-slate-950/90 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c65f]"
                        />
                    </div>

                    {mode === 'passport' && (
                        <div>
                            <label className="block text-xs font-bold text-amber-100 mb-1">
                                {isEn
                                    ? '3. Your Current Level (calibrates Coach & ERH Quiz)'
                                    : '3. Votre Niveau (calibre le Coach & le Quizz ERH)'}
                            </label>
                            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Niveau joueur">
                                {(
                                    [
                                        { id: 'beginner' as const, label: isEn ? '🌱 Beginner' : '🌱 Débutant' },
                                        { id: 'intermediate' as const, label: isEn ? '⚔️ Club' : '⚔️ Club' },
                                        { id: 'expert' as const, label: isEn ? '👑 Pro' : '👑 Compétiteur' },
                                    ]
                                ).map((lvl) => (
                                    <button
                                        key={lvl.id}
                                        type="button"
                                        data-testid={`passport-level-${lvl.id}`}
                                        aria-pressed={experienceLevel === lvl.id}
                                        onClick={() => setExperienceLevel(lvl.id)}
                                        className={`rounded-xl border py-2 text-xs font-extrabold transition ${
                                            experienceLevel === lvl.id
                                                ? 'border-[#f3c65f] bg-[#f3c65f]/20 text-[#f3c65f] shadow'
                                                : 'border-white/10 bg-black/40 text-slate-300 hover:text-white'
                                        }`}
                                    >
                                        {lvl.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {(mode === 'signin' || mode === 'signup') && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-medium text-slate-300">
                                    {isEn ? 'Password' : 'Mot de passe'}
                                </label>
                                {mode === 'signin' && (
                                    <button
                                        type="button"
                                        data-testid="auth-forgot-password-btn"
                                        onClick={() => {
                                            setMode('forgot');
                                            setErrorMsg(null);
                                        }}
                                        className="text-[11px] font-semibold text-[#f3c65f] hover:underline"
                                    >
                                        {isEn ? 'Forgot password?' : 'Mot de passe oublié ?'}
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full rounded-xl bg-slate-950/90 border border-slate-700 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f3c65f]"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="email-submit-btn"
                        className="w-full rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] px-4 py-2.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-lg transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading
                            ? isEn
                                ? 'Loading...'
                                : 'Validation...'
                            : mode === 'passport'
                              ? isEn
                                  ? '🎲 Unlock & Play Now'
                                  : '🎲 Débloquer & Jouer Maintenant'
                              : mode === 'forgot'
                                ? isEn
                                    ? 'Send Reset Link'
                                    : 'Envoyer le lien de réinitialisation'
                                : mode === 'signin'
                                  ? isEn
                                      ? 'Sign In'
                                      : 'Se connecter'
                                  : isEn
                                    ? 'Create My Account'
                                    : 'Créer mon compte'}
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
