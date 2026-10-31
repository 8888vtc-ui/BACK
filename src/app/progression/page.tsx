import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ProgressionDashboard from '../../components/stats/ProgressionDashboard';
import { BackToLobbyButton } from '../../components/nav/PageTransition';

export const metadata: Metadata = {
    title: 'Calcul Performance Rating (PR) & Indice ERH Backgammon | Progression',
    description:
        'Mesurez votre Performance Rating officiel (PR = Équité perdue × 500), votre Indice ERH (Exploitation du Risque Humain) et vos 9 compétences stratégiques de Backgammon.',
    alternates: {
        canonical: '/progression',
        languages: {
            'fr-FR': '/progression',
            'en-US': '/progression?lang=en',
            'es-ES': '/progression?lang=es',
            'pt-BR': '/progression?lang=pt',
            'de-DE': '/progression?lang=de',
            'ar-SA': '/progression?lang=ar',
        },
    },
};

export default function ProgressionPage() {
    return (
        <main className="flex h-dvh overflow-y-auto flex-col items-center p-4 md:p-8 space-y-6 bg-slate-950 text-slate-100">
            <div className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-2">
                <BackToLobbyButton label="Retour au Lobby" />

                <Link
                    href="/drills"
                    className="flex items-center gap-2 rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#c69214] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1a0f08] shadow-md transition hover:brightness-105"
                >
                    <span>🎯</span>
                    <span>Lancer le Quizz Adaptatif ERH (9 Compétences)</span>
                </Link>
            </div>
            <ProgressionDashboard />
            <section
                aria-label="Guide de calcul du Performance Rating et de l'Indice ERH"
                className="w-full max-w-6xl rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300 space-y-1.5"
            >
                <h2 className="font-bold text-[#f3c65f] uppercase tracking-wider">
                    📐 Comment sont calculés le Performance Rating (PR) et l&apos;Indice ERH ?
                </h2>
                <p>
                    Le <strong>Performance Rating (PR)</strong> officiel mesure l&apos;équité moyenne perdue par décision non forcée multipliée par 500 : un Grand-Maître joue sous <strong>PR 3.0</strong>, un joueur de Club entre <strong>PR 5.0 et 10.0</strong>. Notre <strong>Indice ERH (Exploitation du Risque &amp; de l&apos;Erreur Humaine)</strong> complète ce score en mesurant votre capacité à adapter vos coups de pions et de videau au profil psychologique réel de votre adversaire.
                </p>
            </section>
        </main>
    );
}
