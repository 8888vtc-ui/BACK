'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, KeyRound, Zap, Compass, Dices, Trophy, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { PlayerTierGate } from '../../hooks/usePlayerTierGate';

export const ONBOARDING_COMPLETED_KEY = 'bgtour_onboarding_completed_v1';
export const OPEN_ONBOARDING_EVENT = 'bgtour-open-onboarding';

export function openClubOnboardingModal(initialStep: 'entry' | 'experience' = 'experience'): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<'entry' | 'experience'>(OPEN_ONBOARDING_EVENT, { detail: initialStep }));
}

interface PlayerTierGateSwitchProps {
    readonly currentGate: PlayerTierGate;
    readonly onSelectGate: (gate: PlayerTierGate) => void;
    readonly compact?: boolean;
}

const GATES: ReadonlyArray<{ readonly id: PlayerTierGate; readonly labelFr: string; readonly labelEn: string }> = [
    { id: 'BEGINNER', labelFr: 'Débutant', labelEn: 'Beginner' },
    { id: 'INTERMEDIATE', labelFr: 'Intermédiaire', labelEn: 'Intermediate' },
    { id: 'EXPERT', labelFr: 'Expert / Pro', labelEn: 'Expert / Pro' },
];

export const PlayerTierGateSwitch: React.FC<PlayerTierGateSwitchProps> = React.memo(({
    currentGate, onSelectGate, compact = false,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    return (
        <div data-testid="player-tier-gate-switch" role="group" aria-label={isEn ? 'Select player level' : 'Sélection du niveau de jeu'} className={`inline-flex items-center rounded-xl border border-white/10 bg-black/60 p-0.5 backdrop-blur-md shadow-inner ${compact ? 'gap-0.5' : 'gap-1'}`}>
            {GATES.map((g) => {
                const isActive = currentGate === g.id;
                return (
                    <button key={g.id} type="button" data-testid={`tier-gate-btn-${g.id.toLowerCase()}`} onClick={() => onSelectGate(g.id)} aria-pressed={isActive} className={`relative rounded-lg font-sans transition-all duration-150 touch-manipulation select-none whitespace-nowrap px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm ${isActive ? 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/50 font-semibold shadow-sm' : 'text-zinc-300 hover:text-white hover:bg-white/[0.04] border border-transparent'}`}>
                        <span>{isEn ? g.labelEn : g.labelFr}</span>
                    </button>
                );
            })}
        </div>
    );
});
PlayerTierGateSwitch.displayName = 'PlayerTierGateSwitch';

export interface ClubOnboardingOverlayProps {
    readonly currentGate: PlayerTierGate;
    readonly onSelectGate: (gate: PlayerTierGate) => void;
    readonly onContinueAsGuest: () => void;
    readonly onOpenAuthModal: () => void;
}

export const ClubOnboardingOverlay: React.FC<ClubOnboardingOverlayProps> = ({
    currentGate,
    onSelectGate,
    onContinueAsGuest,
    onOpenAuthModal,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'entry' | 'experience'>('entry');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('onboarding') === '1') {
            setStep('entry');
            setIsOpen(true);
            return;
        }
        const hasDirectAction = Boolean(
            params.get('setup') || params.get('mode') || params.get('start') || params.get('lang') || params.get('invite'),
        );
        const isAutomated = typeof navigator !== 'undefined' && navigator.webdriver === true;
        const completed = localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
        if (!completed && !hasDirectAction && !isAutomated) {
            setStep('entry');
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<'entry' | 'experience'>).detail;
            setStep(detail === 'entry' ? 'entry' : 'experience');
            setIsOpen(true);
        };
        window.addEventListener(OPEN_ONBOARDING_EVENT, handler);
        return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, handler);
    }, []);

    if (!isOpen) return null;

    const handleChooseExperience = (gate: PlayerTierGate) => {
        try {
            localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        } catch { /* ignore */ }
        onSelectGate(gate);
        onContinueAsGuest();
        setIsOpen(false);
    };

    const handleClose = () => {
        try {
            localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
        } catch { /* ignore */ }
        setIsOpen(false);
    };

    return (
        <div
            data-testid="club-onboarding-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
        >
            <div className="relative w-full max-w-xl rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#111520] to-[#07090e] p-6 sm:p-7 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.9)]">
                <button
                    type="button"
                    data-testid="close-onboarding-overlay-btn"
                    onClick={handleClose}
                    aria-label={isEn ? 'Close' : 'Fermer'}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-white transition"
                >
                    <X className="w-4 h-4" />
                </button>

                {step === 'entry' ? (
                    <div className="flex flex-col gap-5 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f3d27a]">
                                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>{isEn ? 'CERCLE MONTE-CARLO • OFFICIAL CLUB' : 'CERCLE MONTE-CARLO • SALON OFFICIEL'}</span>
                            </span>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                {isEn ? 'Welcome to Backgammon Tour' : 'Bienvenue au Cercle Backgammon Tour'}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                                {isEn
                                    ? 'Enter the tables immediately as a Guest or sign in to your official account to track your Elo & PR.'
                                    : 'Accédez immédiatement aux tables en tant qu’Invité, ou connectez votre compte officiel pour suivre votre classement Elo & PR.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                data-testid="onboarding-enter-guest-btn"
                                onClick={() => {
                                    onContinueAsGuest();
                                    setStep('experience');
                                }}
                                className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#f5d98b] to-[#b88924] px-5 py-3.5 text-slate-950 shadow-lg hover:brightness-105 active:scale-[0.99] transition"
                            >
                                <span className="inline-flex items-center gap-2 text-sm sm:text-base font-black uppercase tracking-wider">
                                    <Zap className="w-4 h-4 fill-slate-950" />
                                    <span>{isEn ? 'Enter & Play as Guest' : 'Entrer et Jouer en tant qu’Invité'}</span>
                                </span>
                                <span className="text-xs font-semibold text-slate-900">
                                    {isEn ? 'Immediate access without registration' : 'Accès immédiat aux tables et à l’initiation sans inscription'}
                                </span>
                            </button>

                            <button
                                type="button"
                                data-testid="onboarding-open-auth-btn"
                                onClick={() => {
                                    handleClose();
                                    onOpenAuthModal();
                                }}
                                className="w-full flex flex-col items-center justify-center gap-1 rounded-2xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#D4AF37]/40 px-5 py-3 text-white transition"
                            >
                                <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold">
                                    <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                                    <span>{isEn ? 'Sign In / Create My Official Account' : 'Se connecter / Créer mon Compte Officiel'}</span>
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    {isEn ? 'Save your Elo rating, 3-Ply PR & match history' : 'Activez votre classement Elo, votre PR 3-Ply et votre historique'}
                                </span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1 pr-6">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                                <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>{isEn ? 'TAILORED CLUB EXPERIENCE' : 'ACCUEIL SUR MESURE'}</span>
                            </span>
                            <h2 className="text-lg sm:text-xl font-black text-white">
                                {isEn ? 'Have you played Backgammon before?' : 'Avez-vous déjà joué au Backgammon ?'}
                            </h2>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {isEn
                                    ? 'We adapt your lounge according to your familiarity with the game (you can change this anytime in Settings).'
                                    : 'Nous adaptons votre salon selon votre habitude du jeu (modifiable à tout moment dans vos Réglages).'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                type="button"
                                data-testid="experience-choice-beginner"
                                onClick={() => handleChooseExperience('BEGINNER')}
                                className={`w-full flex items-start gap-3.5 rounded-2xl border p-3.5 text-left transition ${
                                    currentGate === 'BEGINNER'
                                        ? 'border-[#D4AF37]/60 bg-[#D4AF37]/12 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 mt-0.5">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                        {isEn ? 'I am discovering the game (or want to review the rules step by step)' : 'Je découvre le jeu (ou je souhaite revoir les règles pas à pas)'}
                                    </span>
                                    <span className="text-xs text-slate-400 leading-snug">
                                        {isEn ? '3-minute interactive initiation & live guidance from The Professor.' : 'Initiation interactive en 3 minutes et partie accompagnée par Le Professeur.'}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                data-testid="experience-choice-intermediate"
                                onClick={() => handleChooseExperience('INTERMEDIATE')}
                                className={`w-full flex items-start gap-3.5 rounded-2xl border p-3.5 text-left transition ${
                                    currentGate === 'INTERMEDIATE'
                                        ? 'border-[#D4AF37]/60 bg-[#D4AF37]/12 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 mt-0.5">
                                    <Dices className="w-4 h-4" />
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                        {isEn ? 'Yes, I know the rules and want to play matches' : 'Oui, je connais les règles et je veux jouer des parties'}
                                    </span>
                                    <span className="text-xs text-slate-400 leading-snug">
                                        {isEn ? 'Direct access to club tables, online matchmaking & tactical challenges.' : 'Accès direct aux tables de club, recherche d’adversaire et défis tactiques.'}
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                data-testid="experience-choice-expert"
                                onClick={() => handleChooseExperience('EXPERT')}
                                className={`w-full flex items-start gap-3.5 rounded-2xl border p-3.5 text-left transition ${
                                    currentGate === 'EXPERT'
                                        ? 'border-[#D4AF37]/60 bg-[#D4AF37]/12 text-white'
                                        : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.06]'
                                }`}
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/20 text-[#f3d27a] border border-[#D4AF37]/40 mt-0.5">
                                    <Trophy className="w-4 h-4" />
                                </span>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs sm:text-sm font-bold text-white">
                                        {isEn ? 'Yes, I play in clubs or tournaments (Match, Cube & PR Analysis)' : 'Oui, je joue en club ou en tournoi (Match, Videau & Analyse PR)'}
                                    </span>
                                    <span className="text-xs text-slate-400 leading-snug">
                                        {isEn ? 'WBGF tournament tables, Bronstein clock, Analysis Studio & 3-Ply bank.' : 'Tables compétition WBGF, pendule Bronstein, Studio d’Analyse et banque 3-Ply.'}
                                    </span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

