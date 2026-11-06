'use client';

import React, { useEffect } from 'react';
import { Trophy, Swords, Lock, Shield, RotateCcw, Search, Target, BarChart3 } from 'lucide-react';
import type {
    PlayerEloProfile,
    MultiplayerMatchInfo,
    EloCalculationResult,
} from '../../features/multiplayer/types';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import { getEloTier } from '../../features/multiplayer/elo';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';

export interface MultiplayerResultModalProps {
    isOpen: boolean;
    matchInfo: MultiplayerMatchInfo;
    localProfile: PlayerEloProfile;
    opponentProfile: PlayerEloProfile;
    eloResult: EloCalculationResult;
    latestGameAnalysis?: CompleteGameAnalysis | null;
    onRematch: () => void;
    onFindNewOpponent?: () => void;
    onOpenReview?: () => void;
    onTrainBlunders?: () => void;
    onClose: () => void;
    theme?: ThemeName;
}

export default function MultiplayerResultModal({
    isOpen,
    matchInfo,
    localProfile,
    opponentProfile,
    eloResult,
    latestGameAnalysis,
    onRematch,
    onFindNewOpponent,
    onOpenReview,
    onTrainBlunders,
    onClose,
    theme,
}: MultiplayerResultModalProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isLocalX = matchInfo.localRole === 'X';
    const localDelta = isLocalX ? eloResult.deltaX : eloResult.deltaO;
    const isWinner = localDelta > 0;
    const isGuest = Boolean(localProfile.isGuest);

    const oldRating = isLocalX
        ? eloResult.playerXNewRating - eloResult.deltaX
        : eloResult.playerONewRating - eloResult.deltaO;

    const newRating = isLocalX ? eloResult.playerXNewRating : eloResult.playerONewRating;
    const tier = getEloTier(newRating);

    return (
        <div
            role="dialog"
            aria-modal="true"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in ${modalClasses.overlay}`}
            data-testid="multiplayer-result-modal"
        >
            <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#17110b]/98 via-[#0d121d]/98 to-[#070a10]/98 p-5 sm:p-6 shadow-2xl text-center transition-all text-[#fdf8eb]">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 shadow-inner">
                    {isWinner ? (
                        <Trophy className="w-8 h-8 text-[#D4AF37]" strokeWidth={1.5} />
                    ) : (
                        <Swords className="w-8 h-8 text-stone-300" strokeWidth={1.5} />
                    )}
                </div>

                <h2
                    className={`text-2xl font-black tracking-tight ${
                        isWinner
                            ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent'
                            : 'text-slate-300'
                    }`}
                >
                    {isWinner ? 'VICTOIRE !' : 'DÉFAITE'}
                </h2>

                <p className="text-xs text-slate-300 mt-1 mb-5">
                    Match contre <span className="font-semibold text-white">{opponentProfile.displayName}</span> ({matchInfo.matchLength} pts)
                </p>

                {isGuest ? (
                    <div className="mb-6 rounded-2xl border border-amber-500/35 bg-amber-950/30 p-4 space-y-2.5 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                            <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
                            <span>PR Verrouillé (Compte requis — Clause CGU §4)</span>
                        </div>
                        <p className="text-[11px] text-stone-300 leading-relaxed">
                            Les sessions Invité sont réservées à la découverte : aucun PR ni classement Elo n&apos;est attribué sans compte personnel.
                        </p>
                        <button
                            type="button"
                            data-testid="multiplayer-result-guest-activate-pr-btn"
                            onClick={openTermsAndPrPolicyModal}
                            className="w-full rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 px-3 py-2 text-xs font-bold text-[#F3E5AB] transition"
                        >
                            Créer mon compte / Me connecter pour activer et sauvegarder mon PR →
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Évolution Classement Elo
                        </div>

                        <div className="flex items-center justify-center gap-3 my-2">
                            <span className="text-sm font-mono text-slate-400">{oldRating}</span>
                            <span className="text-slate-500">→</span>
                            <span className="text-2xl font-extrabold font-mono text-white">{newRating}</span>

                            <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                                    localDelta >= 0
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                }`}
                            >
                                {localDelta >= 0 ? `+${localDelta}` : localDelta} Elo
                            </span>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                            <span className={`font-semibold ${tier.colorClass}`}>{tier.title}</span>
                        </div>

                        {eloResult.prBlockedGain && (eloResult.escrowEloPoints ?? 0) > 0 && (
                            <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-950/50 px-3 py-1.5 text-[11px] font-semibold text-amber-200">
                                <Lock className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                                <span>+{eloResult.escrowEloPoints} Elo en séquestre (PR adverse meilleur) — réussissez 2 Quiz au 1er essai pour les débloquer !</span>
                            </div>
                        )}
                        {!isWinner && eloResult.prShieldActivated && (
                            <div className="mt-2.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-950/50 px-3 py-1.5 text-[11px] font-semibold text-emerald-200">
                                <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                                <span>Bouclier de Maîtrise PR activé : vous avez mieux joué que votre adversaire (0 Elo perdu) !</span>
                            </div>
                        )}

                        {latestGameAnalysis && (
                            <div className="mt-3 rounded-xl border border-amber-400/30 bg-black/40 px-3 py-2 text-[11px] text-slate-200">
                                <span className="font-bold text-amber-300">
                                    Compte-Rendu Live : PR {latestGameAnalysis.performanceRating.toFixed(2)}
                                </span>
                                {' · '}
                                <span>
                                    {latestGameAnalysis.breakdown.blunder + latestGameAnalysis.breakdown.howler + latestGameAnalysis.breakdown.doubtful} erreur(s) ajoutée(s) dans vos derniers Blunders
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2.5">
                    <button
                        type="button"
                        onClick={onRematch}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] py-3 text-sm font-bold uppercase tracking-wider text-black shadow-lg hover:brightness-105 transition-all"
                        data-testid="rematch-button"
                    >
                        <RotateCcw className="w-4 h-4 text-black" strokeWidth={1.75} />
                        <span>Proposer une Revanche ({matchInfo.matchLength} pts)</span>
                    </button>

                    {onFindNewOpponent && (
                        <button
                            type="button"
                            onClick={onFindNewOpponent}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-950/50 py-2.5 text-xs font-extrabold text-emerald-200 hover:border-emerald-300 hover:bg-emerald-900/50 transition-colors"
                            data-testid="find-new-opponent-button"
                        >
                            <Search className="w-4 h-4" strokeWidth={1.5} />
                            <span>Trouver un nouvel adversaire</span>
                        </button>
                    )}

                    {onTrainBlunders && (
                        <button
                            type="button"
                            onClick={onTrainBlunders}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/50 bg-amber-950/60 py-2.5 text-xs font-extrabold text-amber-200 hover:border-amber-300 hover:bg-amber-900/60 transition-colors"
                            data-testid="multiplayer-train-blunders-btn"
                        >
                            <Target className="w-4 h-4" strokeWidth={1.5} />
                            <span>Comprendre &amp; S&apos;entraîner sur mes Blunders</span>
                        </button>
                    )}

                    {onOpenReview && (
                        <button
                            type="button"
                            onClick={onOpenReview}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#26160c] py-2.5 text-xs font-bold text-[#fce8b2] hover:border-[#f3c65f] transition-colors"
                            data-testid="multiplayer-open-review-btn"
                        >
                            <BarChart3 className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.5} />
                            <span>Compte-Rendu Complet &amp; Courbe PR</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition-colors"
                        data-testid="close-result-button"
                    >
                        Retour au menu principal
                    </button>
                </div>
            </div>
        </div>
    );
}
