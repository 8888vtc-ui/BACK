'use client';

/**
 * Onboarding léger (3 écrans) affiché au premier lancement.
 *
 * Rôle :
 *   Présente les 3 gestes essentiels du jeu en 3 écrans simples,
 *   puis disparaît définitivement (localStorage).
 *
 * Composant 100 % muet (LOI 5) : ne dépend que de ses props.
 */

import React, { useState } from 'react';

const ONBOARDING_KEY = 'backgammon_onboarding_done';

const STEPS = [
    {
        icon: '🎲',
        title: 'Lance les dés',
        text: 'Touche le bouton central pour lancer les dés et commencer ton tour.',
    },
    {
        icon: '👆',
        title: 'Joue en 1 tap',
        text: 'Touche une flèche pour jouer le dé actif. Touche les dés pour inverser leur ordre.',
    },
    {
        icon: '🧠',
        title: 'Apprends avec le Coach',
        text: 'Le Coach IA analyse tes coups en temps réel et t\'explique tes erreurs simplement.',
    },
] as const;

export interface OnboardingProps {
    /** Callback appelé quand l'onboarding est terminé. */
    onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const current = STEPS[step];
    const isLast = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            if (typeof window !== 'undefined') {
                localStorage.setItem(ONBOARDING_KEY, '1');
            }
            onComplete();
        } else {
            setStep((s) => s + 1);
        }
    };

    return (
        <div
            data-testid="onboarding"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8 bg-slate-950/95 text-slate-100"
        >
            {/* Icône */}
            <span className="text-6xl leading-none" aria-hidden>{current.icon}</span>

            {/* Titre + texte */}
            <div className="text-center space-y-2 max-w-xs">
                <h2 className="text-2xl font-black text-amber-300">{current.title}</h2>
                <p className="text-sm text-slate-300 leading-relaxed">{current.text}</p>
            </div>

            {/* Indicateur de progression */}
            <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                    <span
                        key={i}
                        className={`h-1.5 w-6 rounded-full ${i === step ? 'bg-amber-400' : 'bg-slate-700'}`}
                    />
                ))}
            </div>

            {/* Bouton suivant / commencer */}
            <button
                type="button"
                data-testid="onboarding-next"
                onClick={handleNext}
                className="px-8 py-3 rounded-xl font-bold text-slate-900 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 active:scale-95 transition-all"
            >
                {isLast ? 'Commencer 🎲' : 'Suivant →'}
            </button>
        </div>
    );
}

/** Vérifie si l'onboarding a déjà été vu. */
export function hasSeenOnboarding(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export default Onboarding;
