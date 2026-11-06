'use client';

/**
 * @file src/components/drills/PersonalBlundersGuestLockView.tsx
 * @description Écran d'aperçu verrouillé unifié (`GuestFeatureLockView`) pour les Joueurs Invités
 * sur `/puzzles`, `/drills`, `/daily-puzzle` et `/progression`.
 * Loi 1 : Un Invité ne peut que jouer une partie (zéro Quiz, zéro Blunder, zéro PR/Elo, zéro Historique).
 * Strictement <= 180 lignes, 0 any, 0 emoji.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Lock, Calendar, Swords, Dices, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { useTranslation } from '../../i18n';
import AuthModal from '../auth/AuthModal';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';
import {
    getPersonalBlunders,
    buildCertifiedDemoPersonalBlunders,
    attachPendingGuestBlundersToUser,
} from '../../lib/blunders/personalBlunderStore';

export type GuestLockFeatureMode = 'quizzes' | 'personal_blunders' | 'progression';

export interface PersonalBlundersGuestLockViewProps {
    readonly featureMode?: GuestLockFeatureMode;
    readonly onUnlockedSuccess?: () => void;
}

export function formatMatchDateTime(iso: string, isEn: boolean): string {
    try {
        const d = new Date(iso);
        const datePart = d.toLocaleDateString(isEn ? 'en-US' : 'fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
        const timePart = d.toLocaleTimeString(isEn ? 'en-US' : 'fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
        return isEn ? `${datePart} at ${timePart}` : `${datePart} à ${timePart}`;
    } catch {
        return iso;
    }
}

export const PersonalBlundersGuestLockView: React.FC<PersonalBlundersGuestLockViewProps> = ({
    featureMode = 'personal_blunders',
    onUnlockedSuccess,
}) => {
    const { locale } = useTranslation();
    const isEn = locale === 'en';
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const capturedGuestBlunders = useMemo(() => getPersonalBlunders(), []);
    const previewItems = useMemo(
        () => (capturedGuestBlunders.length > 0 ? capturedGuestBlunders.slice(0, 3) : buildCertifiedDemoPersonalBlunders('guest_preview')),
        [capturedGuestBlunders],
    );

    const handleAuthSuccess = () => {
        setAuthModalOpen(false);
        attachPendingGuestBlundersToUser('connected_member');
        onUnlockedSuccess?.();
    };

    const titleText =
        featureMode === 'quizzes'
            ? isEn
                ? '50,000 Certified 3-Ply Quizzes & PR Calibration — Connected Account Required'
                : '50 000 Quiz Certifiés 3-Ply & Calibrage PR — Compte Connecté Requis'
            : featureMode === 'progression'
            ? isEn
                ? 'Progression Analytics & PR History — Connected Account Required'
                : 'Suivi de Progression, Historique & Courbe PR — Compte Connecté Requis'
            : isEn
            ? 'Personal Match Blunders Notebook — Connected Account Required'
            : 'Carnet de Blunders Personnels — Compte Connecté Requis';

    const subtitleText =
        featureMode === 'quizzes'
            ? isEn
                ? 'Access to the 50,000 Certified 3-Ply Quizzes & PR Calibration is reserved for connected members. In Guest Mode, you can only play games.'
                : 'Accès aux 50 000 Quiz Certifiés 3-Ply & Calibrage PR réservé aux membres connectés. En mode Invité, vous pouvez uniquement jouer des parties.'
            : featureMode === 'progression'
            ? isEn
                ? 'Match history, PR evolution curve and 9-skill mastery radar are reserved for connected members (ToS §4). In Guest Mode, you can only play games.'
                : 'L’historique des parties, la courbe d’évolution PR et le radar des 9 compétences sont réservés aux membres connectés (Clause CGU §4). En mode Invité, vous pouvez uniquement jouer des parties.'
            : isEn
            ? 'Match history notebook and Personal Blunders correction are reserved for connected members (ToS §4). In Guest Mode, you can only play games.'
            : 'Carnet d’historique et correction de vos Blunders de match réservés aux membres connectés (Clause CGU §4). En mode Invité, vous pouvez uniquement jouer des parties.';

    return (
        <div
            data-testid="personal-blunders-guest-lock-view"
            className="flex-1 min-h-0 w-full flex items-center justify-center p-3 sm:p-5 bg-[#050505] text-[#fdf8eb] overflow-hidden"
        >
            <div
                data-testid="guest-feature-lock-view"
                className="w-full max-w-4xl rounded-2xl border border-[#D4AF37]/35 bg-[#12151C] p-5 sm:p-6 shadow-2xl flex flex-col gap-4"
            >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3.5">
                    <div className="space-y-1 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                            <Lock className="w-3 h-3 text-[#D4AF37]" strokeWidth={2} />
                            <span>
                                {isEn ? 'Registered Account Exclusive — ToS §4' : 'Exclusivité Compte Connecté — Clause CGU §4'}
                            </span>
                        </div>
                        <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">{titleText}</h1>
                        <p className="text-xs text-zinc-300 leading-relaxed">{subtitleText}</p>
                    </div>

                    <button
                        type="button"
                        onClick={openTermsAndPrPolicyModal}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 text-[11px] font-bold text-zinc-300 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] transition shrink-0"
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{isEn ? 'Read ToS §4 Policy' : 'Lire la Clause CGU §4'}</span>
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>
                            {isEn
                                ? 'Preview of Connected Member Training & Match Memory (Locked)'
                                : 'Aperçu de l’Entraînement 3-Ply & de la Mémoire de Match (Verrouillé)'}
                        </span>
                        <span className="text-[#D4AF37]">
                            {isEn ? 'Sign in to unlock' : 'Connectez-vous pour débloquer'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {previewItems.map((item) => (
                            <div
                                key={item.id}
                                data-testid="locked-blunder-preview-row"
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#090B10] px-3.5 py-2.5"
                            >
                                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/35 bg-amber-950/50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                        <Lock className="w-3 h-3 text-amber-400" />
                                        <span>{isEn ? 'Locked' : 'Verrouillé'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                                        <span>{formatMatchDateTime(item.createdAtIso, isEn)}</span>
                                    </span>
                                    <span className="text-zinc-600">•</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-white">
                                        <Swords className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>
                                            {isEn ? `vs ${item.opponentName}` : `Contre ${item.opponentName}`}
                                            {item.opponentElo ? ` (${item.opponentElo} Elo)` : ''}
                                        </span>
                                    </span>
                                    <span className="text-zinc-600">•</span>
                                    <span className="font-mono text-[11px] text-zinc-300">
                                        {item.matchFormatLabel} ({isEn ? 'Score:' : 'Score :'} {item.scoreBeforeMove.player}-{item.scoreBeforeMove.opponent}) • {isEn ? `Turn #${item.turnNumber}` : `Tour #${item.turnNumber}`}
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-[#D4AF37]">
                                        <Dices className="w-3 h-3 text-[#D4AF37]" />
                                        <span>{item.dice[0]}-{item.dice[1]}</span>
                                    </span>
                                </div>
                                <span className="rounded-md border border-rose-500/40 bg-rose-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-200">
                                    -{item.winProbLossPct.toFixed(1)}% {isEn ? 'win' : 'victoire'} ({item.deltaEmg.toFixed(3)} EMG)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/10">
                    <button
                        type="button"
                        data-testid="unlock-personal-blunders-cta"
                        onClick={() => setAuthModalOpen(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[0_6px_22px_rgba(212,175,55,0.3)] hover:brightness-105 transition"
                    >
                        <Lock className="w-4 h-4 text-black" strokeWidth={2.2} />
                        <span>
                            {isEn
                                ? 'SIGN IN / CREATE MY FREE ACCOUNT →'
                                : 'SE CONNECTER / CRÉER MON COMPTE GRATUIT →'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-black" strokeWidth={2.2} />
                    </button>

                    <Link
                        href="/"
                        data-testid="guest-return-play-btn"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-3 text-xs font-bold text-zinc-200 hover:border-white/30 hover:text-white transition shrink-0"
                    >
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isEn ? 'Back to Game Lobby' : 'Retourner jouer une partie'}</span>
                    </Link>
                </div>
            </div>

            <AuthModal
                isOpen={authModalOpen}
                onClose={() => setAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
                requireRegistrationNote={subtitleText}
            />
        </div>
    );
};

export const GuestFeatureLockView = PersonalBlundersGuestLockView;
export default PersonalBlundersGuestLockView;
