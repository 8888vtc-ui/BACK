'use client';

/**
 * @file src/components/legal/TermsAndPrPolicyModal.tsx
 * @description Modale officielle CGU & Politique d'Attribution du PR & Elo (Article 4).
 * Strictement <= 200 lignes, bilingue FR | EN, 0 emoji, 0 any.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Scale, ShieldCheck, Lock, Cpu, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import AuthModal from '../auth/AuthModal';

export const TERMS_MODAL_OPEN_EVENT = 'bgtour-open-terms-modal';

export function openTermsAndPrPolicyModal(): void {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(TERMS_MODAL_OPEN_EVENT));
}

export interface TermsAndPrPolicyModalProps {
    readonly isOpen?: boolean;
    readonly onClose?: () => void;
    readonly onOpenSignIn?: () => void;
}

const PREAMBLE = [
    { fr: 'Article 1 — Fair-Play', en: 'Section 1 — Fair Play', descFr: 'Dés SHA-256 et règles WBGF appliqués à toutes les tables.', descEn: 'SHA-256 dice and WBGF rules apply to all tables.' },
    { fr: 'Article 2 — Moteur 3-Ply', en: 'Section 2 — 3-Ply Engine', descFr: 'Évaluations et quiz certifiés en équité cubeful 3-ply.', descEn: 'Match reviews and quizzes certified in cubeful 3-ply.' },
    { fr: 'Article 3 — Confidentialité', en: 'Section 3 — Data Privacy', descFr: 'Zéro revente de données. Historique sécurisé par compte.', descEn: 'Zero data resale. History secured by account credentials.' },
];

export const TermsAndPrPolicyModal: React.FC<TermsAndPrPolicyModalProps> = ({
    isOpen: controlledIsOpen,
    onClose,
    onOpenSignIn,
}) => {
    const { locale, setLocale } = useTranslation();
    const isEn = locale === 'en';
    const [internalOpen, setInternalOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setInternalOpen(true);
        window.addEventListener(TERMS_MODAL_OPEN_EVENT, handleOpen);
        return () => window.removeEventListener(TERMS_MODAL_OPEN_EVENT, handleOpen);
    }, []);

    const effectiveOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

    useEffect(() => {
        if (!effectiveOpen) return;
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { setInternalOpen(false); onClose?.(); } };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [effectiveOpen, onClose]);

    if ((!effectiveOpen && !authModalOpen) || typeof document === 'undefined') return null;

    const handleClose = () => { setInternalOpen(false); onClose?.(); };
    const handleSignInClick = () => {
        handleClose();
        if (onOpenSignIn) {
            onOpenSignIn();
        } else {
            setAuthModalOpen(true);
        }
    };

    return (
        <>
            {effectiveOpen && createPortal(
                <div role="dialog" aria-modal="true" aria-labelledby="terms-pr-policy-title" data-testid="terms-and-pr-policy-modal" onClick={handleClose} className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
            <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[88dvh] overflow-y-auto rounded-2xl border border-[#D4AF37]/35 bg-[#0B0E14] p-5 sm:p-6 text-[#f7f3e8] shadow-[0_28px_80px_rgba(0,0,0,0.95)] space-y-4">
                {/* En-tête */}
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3.5">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]">
                            <Scale className="w-5 h-5" strokeWidth={1.5} />
                        </span>
                        <div>
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D4AF37]">{isEn ? 'OFFICIAL CHARTER & TERMS OF SERVICE' : 'CHARTE OFFICIELLE & CONDITIONS GÉNÉRALES D’UTILISATION'}</span>
                            <h2 id="terms-pr-policy-title" className="text-base sm:text-lg font-black text-white">{isEn ? 'Terms of Service & Official PR / Elo Attribution Policy' : 'Conditions Générales d’Utilisation (CGU) & Règlement Officiel du PR'}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" data-testid="terms-modal-locale-toggle" onClick={() => setLocale(isEn ? 'fr' : 'en')} className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-mono font-bold text-stone-200 hover:border-[#D4AF37]/50 hover:text-white transition">FR | EN</button>
                        <button type="button" data-testid="close-terms-modal-btn" onClick={handleClose} aria-label={isEn ? 'Close Terms of Service' : 'Fermer les CGU'} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-stone-300 hover:border-white/25 hover:text-white transition"><X className="w-4 h-4" strokeWidth={1.5} /></button>
                    </div>
                </div>

                {/* Articles 1-3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-stone-300">
                    {PREAMBLE.map((art) => (
                        <div key={art.fr} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
                            <div className="font-bold text-white">{isEn ? art.en : art.fr}</div>
                            <p className="text-[11px] text-stone-400 leading-relaxed">{isEn ? art.descEn : art.descFr}</p>
                        </div>
                    ))}
                </div>

                {/* ARTICLE 4 OFFICIEL : POLITIQUE PR & INVITÉ */}
                <section data-testid="terms-clause-4-pr-policy" className="rounded-2xl border border-[#D4AF37]/45 bg-[#12151E] p-4 sm:p-5 space-y-3.5 shadow-inner">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#D4AF37]">
                        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" strokeWidth={1.75} />
                        <h3>{isEn ? 'Section 4 — Attribution & Integrity of Performance Rating (ER / PR) & Elo Rating' : 'Article 4 — Attribution et Intégrité du Performance Rating (ER / PR) & du Classement Elo'}</h3>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-[13px] text-stone-200 leading-relaxed">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-start gap-2.5">
                            <Lock className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" strokeWidth={1.5} />
                            <p>
                                {isEn ? (
                                    <><strong className="text-white">4.1 Strict Exclusion of Guest Sessions:</strong> A Guest Player can only play games (casual tables and initiation). Holding a PR, an Elo rating, Quiz access, and Blunder history strictly require a connected account. No fictional values (such as 7.25 or 6.3) or default Elo ratings are ever assigned to a Guest.</>
                                ) : (
                                    <><strong className="text-white">4.1 Exclusion stricte des sessions Invité :</strong> Un Joueur Invité peut uniquement jouer des parties (tables amicales et initiation). L&apos;attribution d&apos;un PR, d&apos;un Elo, l&apos;accès aux Quiz et l&apos;historique des Blunders exigent un compte connecté. Aucune valeur fictive (telle que 7.25 ou 6.3) n&apos;est attribuée à un Invité.</>
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                            <p>
                                {isEn ? (
                                    <><strong className="text-white">4.2 Activation on Verified Personal Account:</strong> The activation, tracking, and certification of an official Performance Rating (ER / PR), Elo rating, and personal training memory are strictly reserved for users signed into their verified account.</>
                                ) : (
                                    <><strong className="text-white">4.2 Activation sur Compte Personnel Vérifié :</strong> L&apos;activation, le suivi et la certification d&apos;un indice officiel de Performance Rating (ER / PR), du classement Elo et de la mémoire d&apos;entraînement sont strictement réservés aux utilisateurs connectés à leur compte personnel vérifié.</>
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-start gap-2.5">
                            <Cpu className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" strokeWidth={1.5} />
                            <p>
                                {isEn ? (
                                    <><strong className="text-white">4.3 Open Sage 3-Ply Certified Calculation:</strong> Upon signing into an account, PR is computed exclusively from real unforced decisions played by the account holder (PR = (Σ |ΔEMG| / N) × 500), without any pre-assigned fictional baseline.</>
                                ) : (
                                    <><strong className="text-white">4.3 Calcul certifié Open Sage 3-Ply :</strong> Dès la connexion au compte, le PR est calculé en temps réel exclusivement à partir des décisions réelles non forcées jouées par le titulaire (PR = (Σ |ΔEMG| / N) × 500), sans aucune base de départ fictive.</>
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Actions de pied */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <button type="button" data-testid="terms-modal-signin-btn" onClick={handleSignInClick} className="rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2 text-xs font-bold uppercase tracking-wider text-black shadow hover:brightness-105 transition">
                        {isEn ? 'Sign In / Create Account to Activate My PR →' : 'Se connecter / Créer mon compte pour activer mon PR →'}
                    </button>
                    <button type="button" data-testid="terms-modal-understood-btn" onClick={handleClose} className="ml-auto rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition">
                        {isEn ? 'Understood' : 'J’ai compris'}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )}
    <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        requireRegistrationNote={isEn ? 'ToS §4: Account required to activate PR and Elo' : 'Clause CGU §4 : Compte requis pour activer le PR et l’Elo'}
    />
    </>
    );
};

export default TermsAndPrPolicyModal;
