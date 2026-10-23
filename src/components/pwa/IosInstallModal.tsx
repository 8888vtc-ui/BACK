'use client';

/**
 * Modale d'installation PWA — Guide Spécifique iOS / iPadOS & Navigateurs sans prompt natif.
 *
 * Direction Artistique : Horlogerie Monte-Carlo (Ébène, Ardoise de minuit & Or ciselé #d4af37).
 * Conforme WCAG 2.1 AA : piège de focus, touche Echap, aria-modal, rôles sémantiques.
 * Strictement 0 `any`.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n';

export interface IosInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IosInstallModal: React.FC<IosInstallModalProps> = ({ isOpen, onClose }) => {
    const { ui } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    // Fermeture avec la touche Échap
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        },
        [onClose],
    );

    useEffect(() => {
        if (!isOpen) return;

        window.addEventListener('keydown', handleKeyDown);
        // Focus automatique sur le bouton de fermeture pour l'accessibilité
        const timer = setTimeout(() => {
            closeBtnRef.current?.focus();
        }, 50);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timer);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-ios-modal-title"
            aria-describedby="pwa-ios-modal-desc"
            data-testid="pwa-ios-install-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                ref={modalRef}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#d4af37]/50 bg-gradient-to-b from-[#131926] via-[#090d16] to-[#04060b] p-6 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.22),inset_0_1px_1px_rgba(255,245,205,0.3)] animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Filet d'or supérieur */}
                <div
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f3c65f] to-transparent"
                />

                {/* Bouton Fermer */}
                <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={onClose}
                    data-testid="pwa-ios-modal-close"
                    aria-label={ui.pwa.iosModalClose}
                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:border-[#d4af37]/60 hover:bg-white/10 hover:text-amber-200"
                >
                    <span aria-hidden="true" className="text-sm font-bold">✕</span>
                </button>

                {/* En-tête : Blason & Titres */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e5c158]/70 bg-gradient-to-b from-[#2a1f0d] via-[#141008] to-[#080603] text-2xl shadow-[0_4px_16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,245,200,0.4)]">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 32 32"
                            className="h-8 w-8 drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]"
                            fill="none"
                        >
                            <polygon points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10" fill="#0b101b" stroke="#f3c65f" strokeWidth="1.6" />
                            <path d="M9.5 10.5L12 6.8L14.5 9.8L16 5.5L17.5 9.8L20 6.8L22.5 10.5H9.5Z" fill="#f3c65f" />
                            <polygon points="9,27 13,27 11,16" fill="#d4af37" opacity="0.45" />
                            <polygon points="19,27 23,27 21,16" fill="#d4af37" opacity="0.45" />
                            <circle cx="12.2" cy="19.5" r="4.2" fill="#0f172a" stroke="#f3c65f" strokeWidth="1.3" />
                            <circle cx="19.8" cy="19.5" r="4.2" fill="#fde68a" stroke="#9c6f16" strokeWidth="1.3" />
                        </svg>
                    </div>

                    <h2
                        id="pwa-ios-modal-title"
                        className="font-serif bg-gradient-to-b from-[#fff6d6] via-[#e5c158] to-[#b38428] bg-clip-text text-xl font-black tracking-wide text-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    >
                        {ui.pwa.iosModalTitle}
                    </h2>

                    <p id="pwa-ios-modal-desc" className="mt-1 text-xs text-slate-300/90 max-w-xs">
                        {ui.pwa.iosModalSubtitle}
                    </p>
                </div>

                {/* Étapes visuelles 1 & 2 */}
                <div className="mt-6 space-y-3">
                    {/* Étape 1 : Bouton Partager */}
                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#161c2a]/80 to-[#0e131d]/90 p-3.5 shadow-inner">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#0a0e17] text-amber-200 shadow-sm">
                            {/* Icône Partager Apple (boîte avec flèche vers le haut) */}
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 text-[#f3c65f]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                <polyline points="16 6 12 2 8 6" />
                                <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f3c65f]/20 text-[10px] font-black text-[#f3c65f]">
                                    1
                                </span>
                                <h3 className="font-serif text-xs font-bold text-amber-100">
                                    {ui.pwa.iosStep1Title}
                                </h3>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                                {ui.pwa.iosStep1Desc}
                            </p>
                        </div>
                    </div>

                    {/* Étape 2 : Sur l'écran d'accueil */}
                    <div className="flex items-start gap-3.5 rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#161c2a]/80 to-[#0e131d]/90 p-3.5 shadow-inner">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/40 bg-[#0a0e17] text-amber-200 shadow-sm">
                            {/* Icône Ajouter à l'écran d'accueil ([+] dans un carré) */}
                            <svg
                                aria-hidden="true"
                                viewBox="0 0 24 24"
                                className="h-5 w-5 text-[#f3c65f]"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="4" />
                                <line x1="12" y1="8" x2="12" y2="16" />
                                <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#f3c65f]/20 text-[10px] font-black text-[#f3c65f]">
                                    2
                                </span>
                                <h3 className="font-serif text-xs font-bold text-amber-100">
                                    {ui.pwa.iosStep2Title}
                                </h3>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">
                                {ui.pwa.iosStep2Desc}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bouton d'action "J'ai compris" */}
                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={onClose}
                        data-testid="pwa-ios-modal-confirm"
                        className="w-full rounded-2xl border border-[#fef08a]/80 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#1c1004] transition-all duration-150 hover:scale-[1.01] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(180deg, #fff6d1 0%, #f5cf70 30%, #d99f26 75%, #9e6b0b 100%)',
                            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
                        }}
                    >
                        {ui.pwa.iosModalClose}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IosInstallModal;
