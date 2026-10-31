/**
 * Page Politique de Confidentialité, Minimisation des Données & Conformité RGPD / CNIL (`/privacy`).
 * Strictement 0 `any`, < 160 lignes.
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import ConciergeSupportSection from '../../components/support/ConciergeSupportSection';

export const metadata: Metadata = {
    title: 'Politique de Confidentialité & Conformité RGPD (0 Cookie Publicitaire) | Backgammon Tour',
    description:
        'Charte RGPD et CNIL de Backgammon Tour (Cercle Monte-Carlo) : collecte minimale (Pseudo, Email et parties jouées), zéro traceur publicitaire, zéro revente de données et suppression en 1 clic.',
    alternates: {
        canonical: '/privacy',
    },
};

export default function PrivacyGdprPage() {
    return (
        <main
            data-testid="gdpr-privacy-page"
            className="h-dvh max-h-dvh w-full overflow-y-auto bg-[#090806] text-[#f7f3e8] px-4 py-6 sm:px-8 sm:py-10"
        >
            <div className="mx-auto max-w-3xl space-y-6 pb-12">
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="rounded-xl border border-white/10 bg-[#140e09] px-4 py-2 text-xs font-bold text-[#f3c65f] hover:border-[#f3c65f]/50 transition"
                    >
                        ← Retour au Salon Principal
                    </Link>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-300">
                        🔒 100 % Conforme RGPD &amp; CNIL
                    </span>
                </div>

                <header className="rounded-3xl border border-[#d4af37]/35 bg-[#120e09] p-6 space-y-2 shadow-xl">
                    <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
                        Politique de Confidentialité &amp; Charte RGPD
                    </h1>
                    <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                        Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et aux directives de la CNIL, Backgammon Tour applique le principe strict de <strong>minimisation des données</strong>.
                    </p>
                </header>

                <section className="rounded-2xl border border-white/10 bg-[#120e09]/90 p-5 space-y-2.5">
                    <h2 className="text-base font-black text-[#f3c65f]">
                        1. Quelles données sont enregistrées ? (Principe de Minimisation — Art. 5 RGPD)
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                        Nous ne collectons que le strict minimum nécessaire pour vous permettre de jouer et de suivre vos progrès :
                    </p>
                    <ul className="list-disc pl-5 text-xs sm:text-sm text-stone-300 space-y-1">
                        <li><strong>Votre Passeport Joueur</strong> : votre Pseudo de table, votre adresse Email et votre niveau choisi (Débutant, Club ou Compétiteur).</li>
                        <li><strong>Vos Parties &amp; Quizz ERH</strong> : vos positions de Backgammon jouées, votre Performance Rating (PR), votre Indice ERH et vos Sceaux d’Or afin de générer automatiquement le Quizz de vos propres Blunders.</li>
                        <li><strong>Zéro revente, zéro profilage publicitaire</strong> : vos données ne sont jamais vendues, louées ou cédées à des courtiers publicitaires.</li>
                    </ul>
                </section>

                <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-5 space-y-2">
                    <h2 className="text-base font-black text-emerald-300">
                        2. Pourquoi n’y a-t-il pas de bandeau de cookies intrusif ? (Exemption CNIL Art. 82)
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        Backgammon Tour n’utilise <strong>aucun cookie publicitaire tiers</strong> (ni Google Ads, ni Facebook Pixel, ni traqueur de reciblage). Le stockage local de votre navigateur (<code>localStorage</code>) sert exclusivement à mémoriser votre langue, la couleur de votre tablier, votre session et vos exercices en cours. En vertu de l’Article 82 de la Loi Informatique et Libertés et des recommandations de la CNIL, ce stockage purement fonctionnel est <strong>exempté de bandeau de consentement</strong>.
                    </p>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#120e09]/90 p-5 space-y-2">
                    <h2 className="text-base font-black text-[#f3c65f]">
                        3. Hébergement Sécurisé &amp; Durée de Conservation
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                        Les comptes et statistiques sont hébergés de manière chiffrée (TLS / AES-256) sur <strong>Supabase Cloud</strong> et l’application web est servie par <strong>Netlify</strong>. Vos données de progression sont conservées tant que votre compte joueur reste actif.
                    </p>
                </section>

                <section className="rounded-2xl border border-rose-500/30 bg-rose-950/15 p-5 space-y-2">
                    <h2 className="text-base font-black text-rose-300">
                        4. Votre Droit à l’Effacement en 1 Clic (Art. 17 RGPD — Droit à l’Oubli)
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        Vous pouvez à tout moment supprimer intégralement votre Passeport Joueur, votre profil et l’historique de vos parties en <strong>1 seul clic</strong> directement depuis votre menu utilisateur en haut à droite de l’écran via le bouton <strong>« 🗑️ Supprimer mes données (RGPD) »</strong> ou ci-dessous.
                    </p>
                </section>

                <ConciergeSupportSection />
            </div>
        </main>
    );
}

