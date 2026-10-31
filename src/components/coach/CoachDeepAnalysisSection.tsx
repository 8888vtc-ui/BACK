'use client';

/**
 * @file src/components/coach/CoachDeepAnalysisSection.tsx
 * @description Module « 🧠 Analyse Profonde » (1 offerte / jour en mode Gratuit, puis Pass Club / Grand-Maître)
 * exploitant 100 % des métriques Open Sage Max (vecteur 6 probabilités, Cubeful vs Cubeless, Videau,
 * Top Candidats et 3 Questions Socratiques en 1 clic). Zéro mention de numéro de modèle technique, 0 `any`.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { StrategicFeatures } from '../../features/coach/featureExtractor';
import type { PedagogicalExplanation, SymbolicAudit } from '../../lib/coach/symbolicAudit';
import {
    buildDeepSocraticQuestions,
    consumeDeepAnalysisQuota,
    getDeepAnalysisCopyLabels,
    getDeepAnalysisQuotaState,
    type DeepQuestionId,
} from '../../features/coach/deepAnalysisQuota';

export interface CoachDeepAnalysisSectionProps {
    moveKey: string;
    playedMove?: string | null;
    optimalMove?: string | null;
    equityLoss?: number | null;
    features?: StrategicFeatures;
    symbolicAudit?: SymbolicAudit | null;
    pedagogicalExplanation?: PedagogicalExplanation | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    explanation?: string | null;
    isStreaming?: boolean;
    onTriggerDeepAnalysis: () => void;
    locale?: string;
}

const CoachDeepAnalysisSectionComponent: React.FC<CoachDeepAnalysisSectionProps> = ({
    moveKey,
    playedMove,
    optimalMove,
    equityLoss,
    features,
    symbolicAudit,
    pedagogicalExplanation,
    whyFailed,
    whyOptimal,
    explanation,
    isStreaming = false,
    onTriggerDeepAnalysis,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale.startsWith('en'));
    const copy = useMemo(() => getDeepAnalysisCopyLabels(locale), [locale]);
    const [quotaVersion, setQuotaVersion] = useState(0);
    const [showPaywallPrompt, setShowPaywallPrompt] = useState(false);
    const [selectedQuestionId, setSelectedQuestionId] = useState<DeepQuestionId | null>(null);

    const quotaState = useMemo(() => {
        void quotaVersion;
        return getDeepAnalysisQuotaState(moveKey);
    }, [moveKey, quotaVersion]);

    const questions = useMemo(
        () =>
            buildDeepSocraticQuestions({
                playedMove,
                optimalMove,
                equityLoss,
                features,
                symbolicAudit,
                pedagogicalExplanation,
                whyFailed,
                whyOptimal,
                locale,
            }),
        [playedMove, optimalMove, equityLoss, features, symbolicAudit, pedagogicalExplanation, whyFailed, whyOptimal, locale],
    );

    const handleActivateDeepAnalysis = (questionToSelect?: DeepQuestionId) => {
        const res = consumeDeepAnalysisQuota(moveKey);
        setQuotaVersion((v) => v + 1);
        if (!res.allowed) {
            setShowPaywallPrompt(true);
            return;
        }
        setShowPaywallPrompt(false);
        if (questionToSelect) {
            setSelectedQuestionId(questionToSelect);
        }
        onTriggerDeepAnalysis();
    };

    const optM = features?.bgsage?.optimalMetrics;
    const pldM = features?.bgsage?.playedMetrics;
    const cubeDec = features?.bgsage?.cubeDecision;
    const isUnlocked = quotaState.isCurrentMoveUnlocked;

    const badgeText = quotaState.isVip
        ? isEn
            ? '👑 Unlimited Club Pass'
            : '👑 Pass Club Illimité'
        : isUnlocked
          ? copy.unlockedBadge
          : quotaState.canRunDeepAnalysis
            ? copy.freeBadgeAvailable
            : copy.lockedBadge;

    const activeQuestion = questions.find((q) => q.id === selectedQuestionId) ?? null;

    return (
        <section
            data-testid="coach-deep-analysis-section"
            aria-label={copy.buttonTitle}
            className="rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#17120a]/95 to-slate-950/95 p-2.5 space-y-2 shadow-md"
        >
            {/* En-tête : Titre « 🧠 Analyse Profonde » + Badge Quota Quotidien (1/1 gratuite / jour) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide text-[#f3c65f]">
                        {copy.buttonTitle}
                    </span>
                    <span
                        data-testid="coach-deep-quota-badge"
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isUnlocked || quotaState.canRunDeepAnalysis
                                ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-200'
                                : 'border-amber-500/50 bg-amber-950/60 text-amber-200'
                        }`}
                    >
                        {badgeText}
                    </span>
                </div>

                {!isUnlocked && (
                    <button
                        type="button"
                        data-testid="coach-deep-analysis-trigger-btn"
                        disabled={isStreaming}
                        onClick={() => handleActivateDeepAnalysis('why_equity')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4af37]/70 bg-gradient-to-r from-[#d4af37] to-[#f3c65f] px-2.5 py-1 text-[11px] font-black text-slate-950 shadow-sm transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                        <span>
                            {quotaState.canRunDeepAnalysis
                                ? isEn
                                    ? '✨ Run Deep Analysis (Free 1/1)'
                                    : "✨ Lancer l'Analyse Profonde (1/1)"
                                : isEn
                                  ? '🔒 Unlock Deep Analysis'
                                  : "🔒 Débloquer l'Analyse Profonde"}
                        </span>
                    </button>
                )}
            </div>

            {/* Questions Socratiques en 1 Clic (interrogent l'Analyse Profonde) */}
            <div className="flex flex-wrap gap-1.5" data-testid="coach-deep-questions-row">
                {questions.map((q) => {
                    const isSelected = selectedQuestionId === q.id && isUnlocked;
                    return (
                        <button
                            key={q.id}
                            type="button"
                            data-testid={`coach-deep-question-${q.id}`}
                            onClick={() => {
                                if (isUnlocked) {
                                    setSelectedQuestionId((prev) => (prev === q.id ? null : q.id));
                                } else {
                                    handleActivateDeepAnalysis(q.id);
                                }
                            }}
                            className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition text-left ${
                                isSelected
                                    ? 'border-[#f3c65f] bg-[#d4af37]/20 text-[#f3c65f]'
                                    : 'border-white/10 bg-slate-900/90 text-slate-300 hover:border-amber-400/50 hover:text-white'
                            }`}
                        >
                            {q.label}
                        </button>
                    );
                })}
            </div>

            {/* Panneau déverrouillé : Télémétrie Open Sage Max + Réponse Profonde */}
            {isUnlocked && (
                <div
                    data-testid="coach-deep-sage-max-panel"
                    className="rounded-lg border border-amber-500/30 bg-slate-900/85 p-2.5 space-y-2 text-[11px] text-slate-200"
                >
                    {activeQuestion && (
                        <div
                            data-testid="coach-deep-question-answer"
                            className="rounded-lg border border-amber-400/40 bg-amber-950/30 p-2 text-amber-100 leading-relaxed"
                        >
                            <div className="font-bold text-[#f3c65f] mb-0.5">{activeQuestion.label}</div>
                            <p>{activeQuestion.answer}</p>
                        </div>
                    )}

                    {/* Vecteur à 6 probabilités Open Sage Max (si présent) */}
                    {optM && (
                        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
                            <div className="rounded border border-emerald-500/30 bg-emerald-950/25 p-1.5">
                                <div className="font-sans font-bold text-emerald-300">
                                    ⭐ {optimalMove ?? 'Optimal'} ({features?.bgsage?.evalLevel ?? '3-ply'})
                                </div>
                                <div>
                                    W {(optM.winProb * 100).toFixed(1)}% · G {(optM.winGammonProb * 100).toFixed(1)}% · BG{' '}
                                    {(optM.winBackgammonProb * 100).toFixed(1)}%
                                </div>
                                <div className="text-slate-400">
                                    Eq {optM.equity.toFixed(3)} (Cubeless {optM.cubelessEquity.toFixed(3)})
                                </div>
                            </div>
                            {pldM && (
                                <div className="rounded border border-rose-500/30 bg-rose-950/25 p-1.5">
                                    <div className="font-sans font-bold text-rose-300">
                                        🎯 {playedMove ?? (isEn ? 'Played' : 'Joué')}
                                    </div>
                                    <div>
                                        W {(pldM.winProb * 100).toFixed(1)}% · G {(pldM.winGammonProb * 100).toFixed(1)}% · OppG{' '}
                                        {(pldM.loseGammonProb * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-slate-400">
                                        Eq {pldM.equity.toFixed(3)} (Cubeless {pldM.cubelessEquity.toFixed(3)})
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {cubeDec && typeof cubeDec.noDouble === 'number' && typeof cubeDec.doubleTake === 'number' && (
                        <div className="flex flex-wrap items-center justify-between gap-1 rounded border border-indigo-500/30 bg-indigo-950/30 px-2 py-1 font-mono text-[10px] text-indigo-200">
                            <span>ND: {cubeDec.noDouble.toFixed(3)}</span>
                            <span>DT: {cubeDec.doubleTake.toFixed(3)}</span>
                            <span>DP: {(cubeDec.doublePass ?? 1).toFixed(3)}</span>
                            <span className="font-bold text-amber-300">{cubeDec.optimalAction ?? 'No Double'}</span>
                        </div>
                    )}

                    {explanation && (
                        <p className="text-[11px] leading-relaxed text-slate-200 whitespace-pre-line">
                            {explanation}
                        </p>
                    )}
                </div>
            )}

            {/* Carte Soft Paywall lorsque l'Analyse Profonde gratuite du jour (1/1) est épuisée */}
            {showPaywallPrompt && !isUnlocked && (
                <div
                    data-testid="coach-deep-paywall-card"
                    className="rounded-xl border border-[#d4af37]/60 bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-950 p-3 space-y-2 text-xs text-amber-100"
                >
                    <div className="font-extrabold text-[#f3c65f]">{copy.paywallHeadline}</div>
                    <p className="text-[11px] leading-relaxed text-slate-300">{copy.paywallSubtext}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Link
                            href="/pricing"
                            data-testid="coach-deep-paywall-cta"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f3c65f] px-3 py-1.5 text-[11px] font-black text-slate-950 shadow transition hover:brightness-110"
                        >
                            {copy.paywallCta}
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowPaywallPrompt(false)}
                            className="rounded-lg border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:text-white"
                        >
                            {isEn ? 'Continue in Free Mode' : 'Continuer en mode Gratuit'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export const CoachDeepAnalysisSection = React.memo(CoachDeepAnalysisSectionComponent);
export default CoachDeepAnalysisSection;

