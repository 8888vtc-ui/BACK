'use client';

/**
 * @file src/components/coach/MoveErrorPopToast.tsx
 * @description Notification pop-up immédiate déclenchée lors d'une erreur de jeu (Imprécision, Blunder).
 * Passe-plat 100 % déterministe bgsage 3-ply + verifiedFacts (Zéro pattern spéculatif).
 * Strictly < 280 lignes, 0 `any`, textes >= 11px.
 */

import React, { useState, useMemo } from 'react';
import { isCubeDecisionNotation, type LastMoveFeedback } from '../../hooks/coach/coachTypes';
import { extractVerifiedCoachFacts, type CoachVerifiedFacts } from '../../features/coach/turnSnapshot';

export interface MoveErrorPopToastProps {
    readonly feedback?: LastMoveFeedback | null;
    readonly boardBefore?: readonly number[];
    readonly boardAfter?: readonly number[];
    readonly onReplayMove?: () => void;
    readonly onOpenCoach?: () => void;
    readonly isBeginner?: boolean;
    readonly locale?: string;
}

export const MoveErrorPopToast: React.FC<MoveErrorPopToastProps> = React.memo(({
    feedback,
    boardBefore: propBoardBefore,
    boardAfter: propBoardAfter,
    onReplayMove,
    onOpenCoach,
    isBeginner = false,
    locale = 'fr',
}) => {
    const [dismissedFeedback, setDismissedFeedback] = useState<LastMoveFeedback | null>(null);

    const errorDetails = useMemo(() => {
        if (!feedback) return null;
        const absLoss = Math.abs(feedback.equityLoss);
        if (absLoss <= 0.020 || feedback.verdict === 'optimal') {
            return null;
        }

        const effectiveBoardBefore = feedback.boardBefore ?? propBoardBefore;
        const effectiveBoardAfter = feedback.boardAfter ?? propBoardAfter;

        const facts: CoachVerifiedFacts | null = feedback.verifiedFacts
            ? feedback.verifiedFacts
            : (effectiveBoardBefore && effectiveBoardAfter && effectiveBoardBefore.length >= 25 && effectiveBoardAfter.length >= 25)
              ? extractVerifiedCoachFacts(effectiveBoardBefore, effectiveBoardAfter)
              : null;

        const isBlunder = feedback.verdict === 'blunder' || absLoss >= 0.080;
        const isCubeError =
            feedback.decisionType === 'cube' ||
            isCubeDecisionNotation(feedback.playedMove) ||
            isCubeDecisionNotation(feedback.optimalMove);

        const deltaWin = feedback.winProbability !== undefined && feedback.optimalWinProbability !== undefined
            ? Math.max(1, Math.round((feedback.optimalWinProbability - feedback.winProbability) * 100))
            : Math.max(1, Math.round(absLoss * 50));

        const optWinPct = feedback.optimalWinProbability !== undefined
            ? Math.round(feedback.optimalWinProbability * 100)
            : Math.min(99, Math.round(50 + deltaWin / 2));

        const playedWinPct = feedback.winProbability !== undefined
            ? Math.round(feedback.winProbability * 100)
            : Math.max(1, optWinPct - deltaWin);

        const optGammonPct = feedback.optimalGammonProbability !== undefined
            ? Math.round(feedback.optimalGammonProbability * 100)
            : 18;

        const lossStr = absLoss.toFixed(3);
        const playedNotation = feedback.playedMove || 'Coup joué';
        const optimalNotation = feedback.optimalMove || 'Coup optimal';
        const isEn = locale === 'en';

        // 1. Titre factuel
        let title: string;
        if (isCubeError) {
            title = isBeginner
                ? (isEn ? 'CUBE ADVICE' : 'CONSEIL DU VIDEAU')
                : isBlunder
                  ? (isEn ? '3-PLY CUBE BLUNDER' : 'BLUNDER DE VIDEAU (CUBE)')
                  : (isEn ? '3-PLY CUBE INACCURACY' : 'IMPRÉCISION DE VIDEAU (CUBE)');
        } else if (isBeginner) {
            title = isEn ? `COACH ADVICE (-${deltaWin}% WIN CHANCE)` : `CONSEIL DU COACH (-${deltaWin}% DE CHANCES)`;
        } else {
            title = isBlunder ? 'BLUNDER 3-PLY' : 'IMPRÉCISION 3-PLY';
        }

        // 2. Texte factuel selon les 3 cas stricts
        let adviceText: string;
        if (isCubeError) {
            adviceText = isEn
                ? (isBeginner
                    ? `The engine recommends ${optimalNotation} instead of ${playedNotation} (~${deltaWin}% win probability diff).`
                    : `The engine recommends ${optimalNotation} instead of ${playedNotation} (-${lossStr} EMG).`)
                : (isBeginner
                    ? `Le moteur recommande ${optimalNotation} au lieu de ${playedNotation} (écart de ~${deltaWin}% de chances).`
                    : `Le moteur recommande ${optimalNotation} au lieu de ${playedNotation} (-${lossStr} EMG).`);
        } else {
            const newGates = facts?.realPointsMadeByBest ?? [];
            const realBlots = facts?.realBlotsAfterPlayed ?? [];
            const shotsPlayed = facts?.directShotsOnPlayerAfterPlayed ?? 0;
            const shotsBest = facts?.directShotsOnPlayerAfterBest ?? 0;

            if (newGates.length > 0) {
                // Cas A : Porte fermée par le coup optimal
                const gate = newGates[0];
                adviceText = isEn
                    ? (isBeginner
                        ? `The optimal move makes point ${gate} and secures ${optWinPct}% win chances (vs ${playedWinPct}% with ${playedNotation}).`
                        : `Optimal move ${optimalNotation} makes point ${gate} and raises win probability to ${optWinPct}% (vs ${playedWinPct}% for ${playedNotation}, -${lossStr} EMG).`)
                    : (isBeginner
                        ? `Le coup optimal ferme la porte ${gate} et sécurise ${optWinPct} % de chances de victoire (contre ${playedWinPct} % avec ${playedNotation}).`
                        : `Le coup optimal ${optimalNotation} ferme la porte ${gate} et porte vos chances à ${optWinPct} % (contre ${playedWinPct} % pour ${playedNotation}, -${lossStr} EMG).`);
            } else if (realBlots.length > 0 && shotsPlayed > shotsBest) {
                // Cas B : Vrai blot laissé par le joueur avec tirs supérieurs
                const blot = realBlots[0];
                adviceText = isEn
                    ? (isBeginner
                        ? `Caution: ${playedNotation} leaves an isolated blot on point ${blot}, allowing ${shotsPlayed} opponent rolls out of 36 to hit.`
                        : `Playing ${playedNotation} exposes a blot on point ${blot} (${shotsPlayed} shots/36 vs ${shotsBest}/36 for ${optimalNotation}, -${lossStr} EMG).`)
                    : (isBeginner
                        ? `Attention : ${playedNotation} laisse un pion isolé sur la flèche ${blot}, concédant ${shotsPlayed} lancers adverses sur 36 pour frapper.`
                        : `En jouant ${playedNotation}, vous exposez un blot sur la flèche ${blot} (${shotsPlayed} tirs/36 contre ${shotsBest}/36 pour ${optimalNotation}, -${lossStr} EMG).`);
            } else {
                // Cas C : Passe-plat mathématique pur 3-ply (Zéro mention de pion isolé si realBlots.length === 0)
                adviceText = isEn
                    ? (isBeginner
                        ? `The engine recommends ${optimalNotation} (${optWinPct}% win probability vs ${playedWinPct}% with ${playedNotation}).`
                        : `${optimalNotation} brings your winning chances to ${optWinPct}% (Gammon: ${optGammonPct}%) vs ${playedWinPct}% for ${playedNotation} (-${lossStr} EMG).`)
                    : (isBeginner
                        ? `Le moteur recommande ${optimalNotation} (${optWinPct} % de chances de victoire contre ${playedWinPct} % avec ${playedNotation}).`
                        : `${optimalNotation} porte vos chances de gain à ${optWinPct} % (Gammon : ${optGammonPct} %) contre ${playedWinPct} % pour ${playedNotation} (-${lossStr} EMG).`);
            }
        }

        return {
            isBlunder,
            absLoss,
            deltaWin,
            title,
            adviceText,
            badgeBg: isBlunder
                ? 'border-rose-500/80 bg-rose-950/95 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.35)]'
                : 'border-yellow-400/80 bg-yellow-950/95 text-yellow-100 shadow-[0_0_24px_rgba(234,179,8,0.25)]',
            icon: isBlunder ? '🔴' : '🟡',
        };
    }, [feedback, propBoardBefore, propBoardAfter, isBeginner, locale]);

    if (!errorDetails || dismissedFeedback === feedback) {
        return null;
    }

    return (
        <aside
            role="alert"
            aria-live="assertive"
            data-testid="move-error-pop-toast"
            className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-xl animate-in fade-in slide-in-from-top-3 duration-300"
        >
            <div className="flex items-start gap-2.5 sm:gap-3">
                {/* Médaillon du Vieux Professeur */}
                <div className="relative w-12 h-12 rounded-full border-2 border-[#D4AF37] shadow-lg overflow-hidden shrink-0 bg-stone-900 mt-0.5">
                    <img src="/avatars/einstein-quiz-coach.jpg" alt="Le Professeur" className="w-full h-full object-cover" />
                    <span className="absolute inset-0 rounded-full border border-amber-300/40 animate-ping pointer-events-none opacity-40" />
                </div>

                {/* Bulle BD avec queue triangulaire */}
                <div className="relative flex-1 bg-[#0B0E14]/95 backdrop-blur-md border border-[#D4AF37]/50 rounded-2xl p-3.5 text-zinc-100 shadow-2xl">
                    {/* Pointe triangulaire de bulle BD */}
                    <div className="absolute top-4 -left-2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#D4AF37]/50" />
                    <div className="absolute top-4 -left-[6px] w-0 h-0 border-y-[6px] border-y-transparent border-r-[8px] border-r-[#0B0E14]" />

                    {/* En-tête : Sévérité + Indicateur de perte + Bouton Fermer */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm" aria-hidden="true">{errorDetails.icon}</span>
                            <span className="font-display font-extrabold tracking-wider text-xs uppercase text-[#D4AF37]">
                                {errorDetails.title}
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {isBeginner ? (
                                <span data-testid="error-toast-loss-badge" className="font-mono text-[11px] font-black tabular-nums text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                    Chances de victoire : -{errorDetails.deltaWin}%
                                </span>
                            ) : (
                                <span data-testid="error-toast-loss-badge" className="font-mono text-[11px] font-black tabular-nums text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                    -{errorDetails.deltaWin}% chances · -{errorDetails.absLoss.toFixed(3)} EMG
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => feedback && setDismissedFeedback(feedback)}
                                data-testid="error-toast-close-btn"
                                aria-label="Fermer l'alerte d'erreur"
                                className="h-6 px-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 flex items-center justify-center text-[11px] font-semibold transition"
                            >
                                Continuer ✕
                            </button>
                        </div>
                    </div>

                    {/* Corps : Conseil factuel 3-ply + Rappel des coups */}
                    <div className="space-y-1">
                        {feedback?.errorCategoryLabel && (
                            <div className="text-xs font-bold text-amber-300 mb-0.5">
                                {feedback.errorCategoryLabel}
                            </div>
                        )}
                        {isBeginner && (
                            <span className="text-xs font-extrabold text-[#f3c65f] uppercase tracking-wide block">
                                {locale === 'en' ? 'Coach Tip :' : 'Astuce du Professeur :'}
                            </span>
                        )}
                        <p className="text-[12px] text-slate-100 font-medium leading-snug">
                            {errorDetails.adviceText}
                        </p>

                        {(feedback?.playedMove || feedback?.optimalMove) && (
                            <div className="mt-1.5 flex items-center justify-between rounded-xl bg-black/50 px-2.5 py-1.5 text-xs font-mono border border-white/10">
                                {feedback.playedMove && (
                                    <div className="text-rose-300">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans font-bold">
                                            {isBeginner ? 'Ton coup' : 'Joué'}
                                        </span>
                                        {feedback.playedMove}
                                    </div>
                                )}
                                {feedback.optimalMove && (
                                    <div className="text-right text-emerald-300">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans font-bold">
                                            {isBeginner ? 'Coup conseillé' : 'Recommandé 3-ply'}
                                        </span>
                                        {feedback.optimalMove}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions 1-Tap : Rejouer ce coup & Analyse Coach */}
                    <div className="mt-2.5 flex items-center gap-2 pt-1.5 border-t border-white/10">
                        {onReplayMove && (
                            <button
                                type="button"
                                data-testid="error-toast-replay-btn"
                                onClick={() => {
                                    onReplayMove();
                                    if (feedback) setDismissedFeedback(feedback);
                                }}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] text-slate-950 font-black text-xs uppercase tracking-wider shadow hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5"
                            >
                                <span>↺</span>
                                <span>Rejouer ce coup</span>
                            </button>
                        )}

                        {onOpenCoach && !isBeginner && (
                            <button
                                type="button"
                                data-testid="error-toast-coach-btn"
                                onClick={() => {
                                    onOpenCoach();
                                    if (feedback) setDismissedFeedback(feedback);
                                }}
                                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                            >
                                <span>Coach IA</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
});

MoveErrorPopToast.displayName = 'MoveErrorPopToast';
export default MoveErrorPopToast;
