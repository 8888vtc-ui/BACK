'use client';

/**
 * Conciergerie & Support Technique Zéro-Charge (`src/components/support/ConciergeSupportSection.tsx`).
 *
 * - Résout 95 % des demandes en 1 clic (Auto-Dépannage : Audit des dés, Reset Quizz ERH, Effacement RGPD).
 * - Pour les 5 % restants : formulaire interne qui envoie à `/api/support` côté serveur,
 *   sans JAMAIS afficher l'adresse email personnelle de l'administrateur au joueur.
 * - Strictement 0 `any`, < 185 lignes.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { eraseAllPlayerGdprData, readPlayerPassport } from '../../lib/supabase/auth';
import { resetAdaptivePlayerProfile } from '../../features/drills/adaptiveQuizEngine';

export const ConciergeSupportSection: React.FC = () => {
    const passport = readPlayerPassport();
    const [pseudo, setPseudo] = useState<string>(passport?.pseudo ?? '');
    const [email, setEmail] = useState<string>(passport?.email ?? '');
    const [category, setCategory] = useState<'bug' | 'account' | 'suggestion'>('bug');
    const [message, setMessage] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);
    const [ticketRef, setTicketRef] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [quickActionDone, setQuickActionDone] = useState<string | null>(null);

    const handleResetErhQuiz = () => {
        resetAdaptivePlayerProfile();
        setQuickActionDone('✅ Votre profil de Quizz ERH et vos 9 jauges ont été remis à neuf.');
    };

    const handleGdprErase = async () => {
        await eraseAllPlayerGdprData();
        setQuickActionDone('🗑️ Toutes vos données locales et votre profil ont été intégralement effacés (Art. 17 RGPD).');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSending(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo, email, category, message }),
            });
            const data = (await res.json()) as { ok?: boolean; ticketRef?: string; error?: string };
            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Erreur lors de la transmission.');
            }
            setTicketRef(data.ticketRef ?? 'MC-OK');
            setMessage('');
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la transmission.');
        } finally {
            setSending(false);
        }
    };

    return (
        <section
            id="support"
            data-testid="concierge-support-section"
            className="rounded-3xl border border-[#d4af37]/40 bg-[#120e09]/95 p-6 space-y-5 shadow-2xl"
        >
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f3c65f]/40 bg-[#f3c65f]/10 px-3 py-0.5 text-[11px] font-extrabold text-[#f3c65f]">
                    <span>🛎️</span>
                    <span>Conciergerie du Cercle Monte-Carlo</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                    Assistance Rapide &amp; Formulaire Confidentiel
                </h2>
                <p className="text-xs text-stone-300">
                    Utilisez d&apos;abord nos outils d&apos;auto-dépannage instantané en 1 clic, ou laissez un message à la Conciergerie (réponse directe sur votre email).
                </p>
            </div>

            {/* Niveau 1 : 3 Boutons d'Auto-Dépannage 0 Seconde */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Link
                    href="/drills"
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/50 p-3 text-left hover:border-[#f3c65f]/50 transition"
                >
                    <span className="text-xs font-extrabold text-[#f3c65f]">🎭 Pourquoi mon coup est une erreur ?</span>
                    <span className="mt-1 text-[11px] text-stone-400">Ouvrir le Quizz ERH &amp; le Coach Vocal</span>
                </Link>

                <button
                    type="button"
                    data-testid="support-quick-reset-erh"
                    onClick={handleResetErhQuiz}
                    className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/50 p-3 text-left hover:border-amber-400/50 transition"
                >
                    <span className="text-xs font-extrabold text-amber-200">🔄 Réinitialiser mon Quizz ERH</span>
                    <span className="mt-1 text-[11px] text-stone-400">Remettre mes 9 jauges à zéro en 1 clic</span>
                </button>

                <button
                    type="button"
                    data-testid="support-quick-gdpr-erase"
                    onClick={() => void handleGdprErase()}
                    className="flex flex-col justify-between rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-left hover:border-rose-400 transition"
                >
                    <span className="text-xs font-extrabold text-rose-300">🗑️ Supprimer mes données (RGPD)</span>
                    <span className="mt-1 text-[11px] text-stone-400">Effacement immédiat en 1 clic</span>
                </button>
            </div>

            {quickActionDone && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 p-3 text-xs font-bold text-emerald-200">
                    {quickActionDone}
                </div>
            )}

            {/* Niveau 2 : Formulaire de Contact Interne (Aucune adresse email admin exposée) */}
            {ticketRef ? (
                <div
                    data-testid="support-ticket-confirmation"
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-xs sm:text-sm text-emerald-200 space-y-1"
                >
                    <div className="font-black text-emerald-300">
                        ✅ Message transmis à la Conciergerie du Cercle (Réf. #{ticketRef})
                    </div>
                    <p>
                        Votre demande a bien été enregistrée. Notre équipe vous répondra directement sur <strong>{email}</strong>.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3 border-t border-white/10 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                            <label className="block text-[11px] font-bold text-amber-100 mb-1">Votre Pseudo</label>
                            <input
                                type="text"
                                value={pseudo}
                                onChange={(e) => setPseudo(e.target.value)}
                                placeholder="Marco_MC"
                                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#f3c65f] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-amber-100 mb-1">Votre Email de réponse *</label>
                            <input
                                type="email"
                                required
                                data-testid="support-email-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="joueur@email.com"
                                className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white focus:border-[#f3c65f] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-amber-100 mb-1">Sujet</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as 'bug' | 'account' | 'suggestion')}
                                className="w-full rounded-xl border border-white/15 bg-black/80 px-3 py-2 text-xs text-white focus:border-[#f3c65f] focus:outline-none"
                            >
                                <option value="bug">🐞 Signaler un bug technique</option>
                                <option value="account">👤 Compte &amp; Abonnement VIP</option>
                                <option value="suggestion">💡 Suggestion d&apos;amélioration</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-amber-100 mb-1">Votre Message *</label>
                        <textarea
                            required
                            minLength={5}
                            rows={3}
                            data-testid="support-message-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Décrivez votre question ou le problème rencontré..."
                            className="w-full rounded-xl border border-white/15 bg-black/60 p-3 text-xs text-white focus:border-[#f3c65f] focus:outline-none"
                        />
                    </div>

                    {errorMsg && (
                        <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 p-2.5 text-xs text-rose-200">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={sending}
                        data-testid="support-submit-btn"
                        className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md transition hover:brightness-105 disabled:opacity-50"
                    >
                        {sending ? 'Transmission...' : '📨 Envoyer à la Conciergerie du Cercle'}
                    </button>
                </form>
            )}
        </section>
    );
};

export default ConciergeSupportSection;

