'use client';

/**
 * @file src/components/auth/AuthModal.tsx
 * @description Modale Bi-Volet de la Carte de Joueur Grand Cercle & Authentification (< 285 lignes, 0 `any`).
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Crown, Dices, ShieldCheck, Sparkles, Sprout, Swords, X, Zap } from 'lucide-react';
import {
    signInWithEmail, signUpWithEmail, signInWithGoogle, registerPlayerPassportLead,
    resetPasswordForEmail, readPlayerPassport, savePlayerPassport,
    STANDARD_USER_AVATARS, PASSPORT_COUNTRY_OPTIONS, type PlayerExperienceTier,
} from '../../lib/supabase/auth';
import { useTranslation } from '../../i18n';
import { CountryFlagSvg } from '../common/CountryFlagSvg';
import { PassportCardPreview } from './PassportCardPreview';

export interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    requireRegistrationNote?: string | null;
}

export default function AuthModal({ isOpen, onClose, onSuccess, requireRegistrationNote = null }: AuthModalProps) {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'passport' | 'signin' | 'signup' | 'forgot'>('passport');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [countryCode, setCountryCode] = useState<string>('FR');
    const [experienceLevel, setExperienceLevel] = useState<PlayerExperienceTier>('intermediate');
    const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(STANDARD_USER_AVATARS[0].url);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);
    const { locale } = useTranslation();
    const isEn = locale === 'en';

    useEffect(() => {
        setMounted(true);
        const existing = readPlayerPassport();
        if (existing) {
            setDisplayName(existing.pseudo);
            setEmail(existing.email);
            setExperienceLevel(existing.experienceLevel);
            if (existing.avatarUrl) setSelectedAvatarUrl(existing.avatarUrl);
            if (existing.countryCode) setCountryCode(existing.countryCode);
        }
    }, []);

    if (!isOpen) return null;

    const selectedCountryObj = PASSPORT_COUNTRY_OPTIONS.find((c) => c.code === countryCode) ?? PASSPORT_COUNTRY_OPTIONS[0];
    const selectedCountryName = selectedCountryObj.nameFr;

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setInfoMsg(null);
        setLoading(true);
        try {
            if (mode === 'passport') {
                const { error } = await registerPlayerPassportLead({
                    pseudo: displayName, email, experienceLevel, avatarUrl: selectedAvatarUrl,
                    countryName: selectedCountryName, countryCode: selectedCountryObj.code,
                });
                if (error) throw error;
                onSuccess?.();
                onClose();
                return;
            }
            if (mode === 'forgot') {
                const { error } = await resetPasswordForEmail(email);
                if (error) throw error;
                setInfoMsg(isEn ? 'Password reset link sent! Check your inbox.' : 'Lien de réinitialisation envoyé ! Vérifiez votre boîte mail.');
                return;
            }
            if (mode === 'signin') {
                const { error, data } = await signInWithEmail({ email, password });
                if (error) throw error;
                const existingPassport = readPlayerPassport();
                const userPseudo = (typeof data.user?.user_metadata?.full_name === 'string' && data.user.user_metadata.full_name) || existingPassport?.pseudo || email.split('@')[0] || 'Joueur';
                const userAvatar = (typeof data.user?.user_metadata?.avatar_url === 'string' && data.user.user_metadata.avatar_url) || existingPassport?.avatarUrl || selectedAvatarUrl;
                savePlayerPassport({
                    pseudo: userPseudo, email, experienceLevel: existingPassport?.experienceLevel || experienceLevel,
                    avatarUrl: userAvatar, countryName: existingPassport?.countryName || selectedCountryName,
                    countryCode: existingPassport?.countryCode || selectedCountryObj.code,
                    registeredAt: existingPassport?.registeredAt || new Date().toISOString(), supabaseSynced: true,
                });
                onSuccess?.();
                onClose();
            } else {
                const { error } = await signUpWithEmail({ email, password, displayName: displayName || email.split('@')[0] });
                if (error) throw error;
                savePlayerPassport({
                    pseudo: displayName || email.split('@')[0] || 'Joueur', email, experienceLevel, avatarUrl: selectedAvatarUrl,
                    countryName: selectedCountryName, countryCode: selectedCountryObj.code, registeredAt: new Date().toISOString(), supabaseSynced: true,
                });
                onSuccess?.();
                onClose();
            }
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : isEn ? 'An error occurred during authentication.' : "Une erreur est survenue lors de l'authentification.");
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
            setErrorMsg(err instanceof Error ? err.message : isEn ? 'Google sign-in failed.' : 'Échec de la connexion avec Google.');
            setLoading(false);
        }
    }

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#05070B]/88 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
            role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" data-testid="player-passport-auth-modal"
        >
            <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-4xl rounded-2xl border border-[#D4AF37]/40 bg-[#0B0E14]/95 p-5 sm:p-6 md:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.92)] text-slate-100">
                <button
                    type="button" onClick={onClose} data-testid="auth-modal-close-btn"
                    className="absolute top-4 right-4 z-20 rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-zinc-400 hover:border-[#D4AF37]/50 hover:text-white transition cursor-pointer"
                    aria-label={isEn ? 'Close dialog' : 'Fermer la boîte de dialogue'}
                >
                    <X size={16} strokeWidth={1.75} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* COLONNE GAUCHE : FORMULAIRE (7 COLONNES SUR DESKTOP) */}
                    <div className="md:col-span-7 flex flex-col justify-between">
                        <div className="mb-3.5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#F3E5AB] mb-2">
                                <Sparkles size={13} strokeWidth={1.5} className="text-[#D4AF37]" />
                                <span>{isEn ? 'PLAYER CARD & AI ANALYSIS' : 'CARTE DE JOUEUR & ANALYSE IA'}</span>
                            </div>
                            <h2 id="auth-modal-title" className="text-lg sm:text-xl font-black tracking-tight text-[#FDF8EB]">
                                {mode === 'passport' ? (isEn ? 'Your Player Card — Grand Cercle' : 'Votre Carte de Joueur — Grand Cercle') : mode === 'signin' ? (isEn ? 'Member Sign In' : 'Connexion Membre') : mode === 'forgot' ? (isEn ? 'Reset Password' : 'Mot de passe oublié') : (isEn ? 'Create Full Account' : 'Créer un Compte Complet')}
                            </h2>
                            <p className="mt-0.5 text-xs text-amber-200/85 font-medium">
                                {requireRegistrationNote || (isEn ? 'Instant registration to unlock game tables, save your ELO and blunder analytics (ER / PR).' : "Création instantanée pour débloquer les tables de jeu, enregistrer votre ELO et vos analyses d'erreurs (ER / PR).")}
                            </p>
                        </div>

                        <div className="mb-3">
                            <button type="button" onClick={handleGoogleLogin} disabled={loading} data-testid="oauth-google-btn" className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-white/[0.09] hover:border-[#D4AF37]/50 transition active:scale-[0.99] disabled:opacity-50">
                                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                                </svg>
                                <span>{isEn ? 'Continue in 1 click with Google' : 'Continuer en 1 clic avec Google'}</span>
                            </button>
                        </div>

                        <div className="flex rounded-xl bg-black/55 p-1 mb-3 border border-white/[0.08]">
                            <button type="button" data-testid="auth-tab-passport" onClick={() => { setMode('passport'); setErrorMsg(null); }} className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] sm:text-xs font-extrabold transition ${mode === 'passport' ? 'bg-[#D4AF37] text-[#050505] shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>
                                <Zap size={13} strokeWidth={2} />
                                <span>{isEn ? 'Express (5s)' : 'Accès Rapide (5s)'}</span>
                            </button>
                            <button type="button" data-testid="auth-tab-signin" onClick={() => { setMode('signin'); setErrorMsg(null); }} className={`flex-1 rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold transition ${mode === 'signin' ? 'bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/50' : 'text-zinc-400 hover:text-zinc-200'}`}>
                                {isEn ? 'Sign In' : 'Connexion'}
                            </button>
                            <button type="button" data-testid="auth-tab-signup" onClick={() => { setMode('signup'); setErrorMsg(null); }} className={`flex-1 rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold transition ${mode === 'signup' ? 'bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/50' : 'text-zinc-400 hover:text-zinc-200'}`}>
                                {isEn ? 'Sign Up' : 'Créer un compte'}
                            </button>
                        </div>

                        {errorMsg && <div className="mb-2.5 rounded-lg bg-red-950/60 border border-red-700/60 p-2 text-xs text-red-200">{errorMsg}</div>}
                        {infoMsg && <div className="mb-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60 p-2 text-xs text-emerald-200">{infoMsg}</div>}

                        <form onSubmit={handleEmailSubmit} className="space-y-2.5">
                            {(mode === 'passport' || mode === 'signup') && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-amber-100 mb-1.5">{isEn ? 'Choose Your Club Avatar (5 Standard Profiles)' : 'Choisissez votre Photo de Profil (5 Avatars Club)'}</label>
                                        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Avatar du joueur">
                                            {STANDARD_USER_AVATARS.map((av) => {
                                                const active = selectedAvatarUrl === av.url;
                                                return (
                                                    <button key={av.id} type="button" data-testid={`passport-avatar-${av.id}`} aria-checked={active} role="radio" onClick={() => setSelectedAvatarUrl(av.url)} className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition cursor-pointer ${active ? 'border border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-[0_0_16px_rgba(212,175,55,0.25)] bg-[#D4AF37]/15' : 'border border-white/10 bg-black/40 hover:border-white/25 hover:bg-white/5'}`}>
                                                        <img src={av.url} alt={isEn ? av.labelEn : av.labelFr} className="h-12 w-12 rounded-xl object-cover object-center border border-[#D4AF37]/45 shadow transition-transform duration-150 group-hover:scale-105" />
                                                        <span className="text-[10.5px] font-bold text-zinc-300 group-hover:text-white truncate max-w-full">{isEn ? av.labelEn : av.labelFr}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                            <label className="block text-xs font-bold text-amber-100 mb-1">{isEn ? '1. Player Nickname *' : '1. Votre Pseudo de Joueur *'}</label>
                                            <input type="text" required minLength={2} data-testid="passport-pseudo-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={isEn ? 'e.g. Alexandre D.' : 'ex: Alexandre D.'} className="w-full rounded-xl bg-black/60 border border-white/15 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-amber-100 mb-1">{isEn ? '2. Country & Flag *' : '2. Pays & Drapeau *'}</label>
                                            <div className="relative flex items-center">
                                                <span className="pointer-events-none absolute left-3 inline-flex items-center"><CountryFlagSvg countryName={selectedCountryName} className="h-3.5 w-5" /></span>
                                                <select data-testid="passport-country-select" aria-label={isEn ? 'Country' : 'Pays'} value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full rounded-xl bg-[#0B0E14] border border-white/15 pl-10 pr-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-[#D4AF37]">
                                                    {PASSPORT_COUNTRY_OPTIONS.map((c) => (<option key={c.code} value={c.code} className="bg-[#0B0E14] text-white">{isEn ? c.nameEn : c.nameFr}</option>))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-amber-100 mb-1">{mode === 'passport' || mode === 'signup' ? (isEn ? '3. Your Email Address *' : '3. Votre Adresse Email *') : (isEn ? 'Email Address' : 'Adresse email')}</label>
                                <input type="email" required data-testid="passport-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joueur@email.com" className="w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]" />
                            </div>

                            {mode === 'passport' && (
                                <div>
                                    <label className="block text-xs font-bold text-amber-100 mb-1">{isEn ? '4. Your Division (calibrates Coach & ER / PR Quizzes)' : '4. Votre Division (calibre le Coach & les Quiz ER / PR)'}</label>
                                    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Division joueur">
                                        {([{ id: 'beginner' as const, label: isEn ? 'Beginner' : 'Débutant', Icon: Sprout }, { id: 'intermediate' as const, label: 'Club', Icon: Swords }, { id: 'expert' as const, label: isEn ? 'Pro' : 'Compétiteur', Icon: Crown }]).map(({ id, label, Icon }) => (
                                            <button key={id} type="button" data-testid={`passport-level-${id}`} aria-pressed={experienceLevel === id} onClick={() => setExperienceLevel(id)} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-extrabold transition ${experienceLevel === id ? 'border-[#D4AF37]/70 bg-[#D4AF37]/15 text-[#F3E5AB] shadow-[0_0_16px_rgba(212,175,55,0.15)]' : 'border-white/[0.08] bg-black/40 text-zinc-400 hover:text-white'}`}>
                                                <Icon size={14} strokeWidth={1.5} className="text-[#D4AF37]" />
                                                <span>{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(mode === 'signin' || mode === 'signup') && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-medium text-zinc-300">{isEn ? 'Password' : 'Mot de passe'}</label>
                                        {mode === 'signin' && (
                                            <button type="button" data-testid="auth-forgot-password-btn" onClick={() => { setMode('forgot'); setErrorMsg(null); }} className="text-[11px] font-semibold text-[#D4AF37] hover:underline">
                                                {isEn ? 'Forgot password?' : 'Mot de passe oublié ?'}
                                            </button>
                                        )}
                                    </div>
                                    <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]" />
                                </div>
                            )}

                            <button type="submit" disabled={loading} data-testid="email-submit-btn" className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#F3C65F] bg-gradient-to-b from-[#E6C665] via-[#D4AF37] to-[#B89225] px-4 py-2.5 text-sm font-black uppercase tracking-wider text-[#050505] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_25px_-4px_rgba(212,175,55,0.35)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-50">
                                <Dices size={17} strokeWidth={1.75} />
                                <span>{loading ? (isEn ? 'Loading...' : 'Validation...') : mode === 'passport' ? (isEn ? 'ENTER GAME SALON' : 'VALIDER ET ENTRER DANS LE SALON') : mode === 'forgot' ? (isEn ? 'Send Reset Link' : 'Envoyer le lien de réinitialisation') : mode === 'signin' ? (isEn ? 'Sign In' : 'Se connecter') : (isEn ? 'Create My Account' : 'Créer mon compte')}</span>
                            </button>

                            <p data-testid="auth-gdpr-notice" className="pt-0.5 text-center text-[10px] leading-snug text-zinc-400">
                                <ShieldCheck size={12} strokeWidth={1.5} className="inline-block mr-1 text-[#10B981] -mt-0.5" />
                                {isEn ? 'GDPR & CNIL: your nickname, email and matches are used solely to save your ER / PR Index & ELO. ' : 'Conformité RGPD & CNIL : vos données (Pseudo, Pays, Email et parties) servent uniquement à sauvegarder votre Indice ER / PR et votre ELO. '}
                                <Link href="/privacy" onClick={onClose} className="font-semibold text-[#D4AF37] underline hover:text-white">{isEn ? 'Privacy Policy' : 'Charte RGPD'}</Link>
                            </p>
                        </form>
                    </div>

                    {/* COLONNE DROITE : APERÇU EN DIRECT DE LA CARTE DE MEMBRE (5 COLONNES SUR DESKTOP) */}
                    <div className="md:col-span-5 flex items-stretch">
                        <PassportCardPreview displayName={displayName} countryName={selectedCountryName} countryCode={selectedCountryObj.code} avatarUrl={selectedAvatarUrl} experienceLevel={experienceLevel} isEn={isEn} />
                    </div>
                </div>
            </div>
        </div>
    );

    if (mounted && typeof document !== 'undefined') return createPortal(modalContent, document.body);
    return modalContent;
}
