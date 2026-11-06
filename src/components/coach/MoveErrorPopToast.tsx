'use client';

/**
 * @file src/components/coach/MoveErrorPopToast.tsx
 * @description Notification pop-up immédiate déclenchée lors d'une erreur de jeu (Imprécision, Erreur, Blunder).
 * Affiche la sévérité, la perte d'équité, le TYPE d'erreur tactique détecté et permet de rejouer en 1-tap.
 * Strictly < 220 lignes, 0 `any`, textes >= 11px.
 */

import React, { useState, useMemo } from 'react';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { isCubeDecisionNotation, type LastMoveFeedback } from '../../hooks/coach/coachTypes';
import {
    detectClassicalBlunderPattern,
    type ClassicalBlunderPattern,
} from '../../features/personas/botEcosystemEngine';
import {
    pickVariedCheckerErrorCopy,
    pickVariedCubeErrorCopy,
    type VariedCheckerCategory,
} from '../../features/coach/coachVariedMessagesBank';

export interface MoveErrorPopToastProps {
    readonly feedback?: LastMoveFeedback | null;
    readonly boardBefore?: readonly number[];
    readonly boardAfter?: readonly number[];
    readonly onReplayMove?: () => void;
    readonly onOpenCoach?: () => void;
    readonly isBeginner?: boolean;
}

interface PatternLabel { name: string; advice: string; }
const PATTERN_LABELS: Record<ClassicalBlunderPattern, PatternLabel> = {
    PREMATURE_PRIME_BREAKUP: { name: 'Rupture prématurée de prime', advice: 'Maintenez la prime de 5 ou 6 portes pour asphyxier les dames arrières adverses.' },
    BAR_REENTRY_MISCALCULATION: { name: 'Calcul de rentrée de barre adverse', advice: 'Attention aux tirs directs depuis la barre adverse sur vos pions isolés.' },
    RECKLESS_HIT_EXPOSURE: { name: 'Frappe inconsidérée (Blot exposé)', advice: 'Frapper laisse un blot vulnérable sans couverture immédiate.' },
    RACE_VS_CONTACT_CONFUSION: { name: 'Confusion Course vs Contact', advice: 'Préservez la flexibilité de vos constructeurs avant de libérer les ancres.' },
    GENERAL_POSITIONAL_LOSS: { name: 'Erreur positionnelle & Perte d’ancrage', advice: 'Ce coup affaiblit la cohésion de vos blocs sans compenser la course.' },
};

function sanitizeErrorAdviceWithRealBoardFacts(advice: string, boardAfter?: readonly number[]): string {
    if (!boardAfter) return advice;
    const realBlots: number[] = [];
    for (let p = 1; p <= 24; p++) {
        if (boardAfter[p] === 1) realBlots.push(p);
    }
    return advice.replace(
        /\s*\((?:pion\(s\)\s+isolé\(s\)\s+sur\s+|exposed\s+blot\(s\)\s+on\s+)?(?:flèches?|cases?|points?)\s*[\d,\s et]+\)/gi,
        (match) => {
            const nums = match.match(/\d+/g)?.map(Number) ?? [];
            const validNums = nums.filter((n) => realBlots.includes(n));
            if (validNums.length === 0) {
                return realBlots.length > 0
                    ? ` (pion(s) isolé(s) sur flèche${realBlots.length > 1 ? 's' : ''} ${realBlots.slice(0, 3).join(', ')})`
                    : '';
            }
            return ` (pion(s) isolé(s) sur flèche${validNums.length > 1 ? 's' : ''} ${validNums.slice(0, 3).join(', ')})`;
        },
    );
}

export const MoveErrorPopToast: React.FC<MoveErrorPopToastProps> = React.memo(({
    feedback,
    boardBefore: propBoardBefore,
    boardAfter: propBoardAfter,
    onReplayMove,
    onOpenCoach,
    isBeginner = false,
}) => {
    const [dismissedFeedback, setDismissedFeedback] = useState<LastMoveFeedback | null>(null);

    const errorDetails = useMemo(() => {
        if (!feedback) return null;
        const absLoss = Math.abs(feedback.equityLoss);
        if (absLoss <= 0.020) {
            return null;
        }

        const effectiveBoardBefore = feedback.boardBefore ?? propBoardBefore;
        const effectiveBoardAfter = feedback.boardAfter ?? propBoardAfter;

        const isBlunder = feedback.verdict === 'blunder' || absLoss >= 0.080;
        const isError = !isBlunder && absLoss >= 0.040;
        const isInaccuracy = !isBlunder && !isError;
        const isCubeError =
            feedback.decisionType === 'cube' ||
            isCubeDecisionNotation(feedback.playedMove) ||
            isCubeDecisionNotation(feedback.optimalMove);

        let patternName: string;
        let patternAdvice: string;

        if (isCubeError) {
            const playedLower = (feedback.playedMove ?? '').toLowerCase();
            const isMissed = playedLower.includes('non doublé') || playedLower.includes('missed');
            const isTake = playedLower.includes('prendre') || playedLower.includes('take');
            const isPass = playedLower.includes('passer') || playedLower.includes('pass');
            const cubeCat = isMissed
                ? 'MISSED_DOUBLE'
                : isTake
                  ? 'OPTIMISTIC_TAKE'
                  : isPass
                    ? 'TIMID_PASS'
                    : 'PREMATURE_DOUBLE';
            const variedCube = pickVariedCubeErrorCopy(cubeCat, {
                playedMove: feedback.playedMove ?? 'Videau',
                optimalMove: feedback.optimalMove ?? 'No double, take',
                equityLoss: feedback.equityLoss,
                seedExtra: feedback.turnIndex ?? '',
            });
            patternName =
                feedback.errorCategoryLabel ??
                (isMissed
                    ? 'Videau oublié (Missed Double)'
                    : isTake
                      ? 'Erreur de Videau — Take trop optimiste'
                      : isPass
                        ? 'Erreur de Videau — Pass trop frileux'
                        : 'Erreur de Videau — Double prématuré');
            patternAdvice = feedback.errorAdvice ?? variedCube.whyFailed;
        } else {
            const pattern: ClassicalBlunderPattern =
                effectiveBoardBefore && effectiveBoardAfter
                    ? detectClassicalBlunderPattern({ boardBefore: effectiveBoardBefore, boardAfter: effectiveBoardAfter })
                    : 'GENERAL_POSITIONAL_LOSS';
            const patternInfo = PATTERN_LABELS[pattern] ?? PATTERN_LABELS.GENERAL_POSITIONAL_LOSS;
            const catMap: Record<ClassicalBlunderPattern, VariedCheckerCategory> = {
                PREMATURE_PRIME_BREAKUP: 'PRIME_EXTEND', BAR_REENTRY_MISCALCULATION: 'REAR_ESCAPE', RECKLESS_HIT_EXPOSURE: 'SHOT_EXPOSURE', RACE_VS_CONTACT_CONFUSION: 'PURE_RACE', GENERAL_POSITIONAL_LOSS: 'POSITIONAL_FLEXIBILITY',
            };
            const variedChecker = pickVariedCheckerErrorCopy(catMap[pattern], {
                playedMove: feedback.playedMove ?? 'Coup joué',
                optimalMove: feedback.optimalMove ?? 'Coup optimal',
                equityLoss: feedback.equityLoss,
                seedExtra: feedback.turnIndex ?? '',
            });
            patternName = feedback.errorCategoryLabel ?? patternInfo.name;
            const rawAdvice = feedback.errorAdvice ?? variedChecker.whyFailed;
            patternAdvice = sanitizeErrorAdviceWithRealBoardFacts(rawAdvice, effectiveBoardAfter);
        }

        const mwcLossPct = Math.max(1, Math.round(absLoss * 50));
        let computedTitle = isCubeError
            ? isBlunder ? 'BLUNDER DE VIDEAU (CUBE)' : 'IMPRÉCISION DE VIDEAU'
            : isBlunder ? 'GAFFE / BLUNDER MAJEUR' : isError ? 'ERREUR TACTIQUE' : 'IMPRÉCISION';
        if (isBeginner) computedTitle = isBlunder ? 'COUP SOUS-OPTIMAL' : 'PETITE IMPRÉCISION';

        return {
            isBlunder, isError, isInaccuracy, absLoss, mwcLossPct, patternName, patternAdvice,
            title: computedTitle,
            badgeBg: isBlunder
                ? 'border-rose-500/80 bg-rose-950/95 text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.35)]'
                : isError
                  ? 'border-amber-500/80 bg-amber-950/95 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.35)]'
                  : 'border-yellow-400/80 bg-yellow-950/95 text-yellow-100 shadow-[0_0_24px_rgba(234,179,8,0.25)]',
            icon: isBlunder ? '🔴' : isError ? '🟠' : '🟡',
        };
    }, [feedback, propBoardBefore, propBoardAfter, isBeginner]);

    if (!errorDetails || dismissedFeedback === feedback) {
        return null;
    }

    return (
        <aside
            role="alert"
            aria-live="assertive"
            data-testid="move-error-pop-toast"
            className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md animate-in fade-in slide-in-from-top-4 duration-300"
        >
            <div
                className={`relative rounded-2xl border p-4 backdrop-blur-xl ${errorDetails.badgeBg}`}
            >
                {/* En-tête : Sévérité + Perte d'équité + Bouton Fermer */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-base" aria-hidden="true">
                            {errorDetails.icon}
                        </span>
                        <span className="font-display font-black tracking-wider text-xs uppercase text-white">
                            {errorDetails.title}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isBeginner ? (
                            <span data-testid="error-toast-loss-badge" className="font-mono text-xs font-black tabular-nums text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                Chances de victoire : -{errorDetails.mwcLossPct}%
                            </span>
                        ) : (
                            <span data-testid="error-toast-loss-badge" className="font-mono text-xs font-black tabular-nums text-amber-300 bg-black/40 px-2 py-0.5 rounded-lg border border-white/10">
                                -{errorDetails.mwcLossPct}% chances · -{errorDetails.absLoss.toFixed(3)} EMG · -{errorDetails.mwcLossPct}% MWC
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => feedback && setDismissedFeedback(feedback)}
                            data-testid="error-toast-close-btn"
                            aria-label="Fermer l'alerte d'erreur"
                            className="h-6 w-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {errorDetails.isBlunder && !isBeginner && (
                    <div
                        data-testid="error-toast-adaptive-quiz-badge"
                        className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-950/70 px-2.5 py-1 text-[11px] font-bold text-emerald-200"
                    >
                        <span>📌 Ajouté automatiquement à votre Parcours Quizz Adaptatif</span>
                    </div>
                )}

                {/* Corps : Type de l'erreur + Motif géométrique */}
                <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5">
                        <span className="text-xs font-extrabold text-[#f3c65f] uppercase tracking-wide">
                            {isBeginner ? 'Astuce du Professeur :' : 'Type :'}
                        </span>
                        <span className="text-xs font-black text-white">
                            {isBeginner ? `Attention (tu perds ~${errorDetails.mwcLossPct}% de chances)` : errorDetails.patternName}
                        </span>
                    </div>

                    <p className="text-[11px] text-slate-200 leading-snug">
                        {isBeginner
                            ? (errorDetails.patternAdvice ? errorDetails.patternAdvice.replace(/\(.*?\)/g, '').trim() : 'Ce coup affaiblit votre position. Rejouez pour tester le meilleur coup !')
                            : errorDetails.patternAdvice}
                    </p>

                    {(feedback?.playedMove || feedback?.optimalMove) && (
                        <div className="mt-2 flex items-center justify-between rounded-xl bg-black/50 p-2 text-xs font-mono border border-white/10">
                            {feedback.playedMove && (
                                <div className="text-rose-300">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-sans font-bold">
                                        {isBeginner ? 'Ton coup' : 'Joué'}
                                    </span>
                                    {feedback.playedMove}
                                </div>
                            )}
                            {feedback.optimalMove && (
                                <div className="text-right text-emerald-300">
                                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-sans font-bold">
                                        {isBeginner ? 'Coup conseillé' : 'Recommandé'}
                                    </span>
                                    {feedback.optimalMove}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions 1-Tap : Rejouer ce coup & Analyse Coach */}
                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-white/10">
                    {onReplayMove && (
                        <button
                            type="button"
                            data-testid="error-toast-replay-btn"
                            onClick={() => {
                                onReplayMove();
                                if (feedback) setDismissedFeedback(feedback);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#f3c65f] via-[#f7d77e] to-[#e5b548] text-slate-950 font-black text-xs uppercase tracking-wider shadow-md hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5"
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
                            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                        >
                            
                            <span>Coach IA</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
});

MoveErrorPopToast.displayName = 'MoveErrorPopToast';
export default MoveErrorPopToast;
