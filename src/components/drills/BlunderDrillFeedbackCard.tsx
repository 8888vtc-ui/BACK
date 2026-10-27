'use client';

import React from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';

export interface BlunderDrillFeedbackCardProps {
    currentBlunder: PlayerBlunderRecord;
    currentIndex: number;
    totalBlunders: number;
    showHint: boolean;
    onToggleHint: () => void;
    onResetAttempt: () => void;
    validationResult: DrillValidationResult | null;
    onNextBlunder: () => void;
}

export const BlunderDrillFeedbackCard: React.FC<BlunderDrillFeedbackCardProps> = ({
    currentBlunder,
    currentIndex,
    totalBlunders,
    showHint,
    onToggleHint,
    onResetAttempt,
    validationResult,
    onNextBlunder,
}) => {
    return (
        <section data-testid="drill-position-card" className="w-full rounded-2xl border border-white/10 bg-[#0e121b]/95 p-3.5 sm:p-4 shadow-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-[#f3c65f]">Erreur {currentIndex + 1} sur {totalBlunders}</span>
                    <span className="rounded border border-rose-500/40 bg-rose-950/80 px-2 py-0.5 text-xs font-bold text-rose-200">{currentBlunder.conceptName}</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1 text-xs">
                    <span className="text-[#a5b0c4] font-semibold">Jet à rejouer :</span>
                    <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[0]}</span>
                    <span className="rounded border border-white/10 bg-[#180c06] px-2 py-0.5 font-mono font-bold text-[#fdf8eb]">{currentBlunder.dice[1]}</span>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-[#e2d2b5]">
                    <span className="text-[#a5b0c4]">Votre coup passé : </span>
                    <span className="font-mono font-bold text-rose-400 underline decoration-rose-500/50">{currentBlunder.playedMove}</span>
                    <span className="ml-2 font-mono text-xs text-rose-300">(-{currentBlunder.equityLoss.toFixed(3)} ΔEq)</span>
                </p>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onToggleHint} className="rounded-xl border border-white/10 bg-[#1a1109] px-3 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-white/25 transition" data-testid="drill-hint-toggle">💡 {showHint ? 'Masquer indice' : 'Indice'}</button>
                    <button type="button" onClick={onResetAttempt} className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-[#e2d2b5] hover:border-white/25 transition" data-testid="drill-reset-btn">↺ Réinitialiser</button>
                </div>
            </div>
            {showHint && currentBlunder.hint && (
                <div className="rounded-xl border border-white/10 bg-[#180c06]/90 p-3 text-xs text-[#fdf8eb] leading-relaxed" data-testid="drill-hint-box">
                    <span className="font-bold text-[#f3c65f]">💡 Conseil pédagogique : </span>{currentBlunder.hint}
                </div>
            )}
            {validationResult && (
                <div className={`w-full rounded-xl border p-3.5 text-xs ${validationResult.isCorrect ? 'border-emerald-500/50 bg-emerald-950/60 text-emerald-100' : 'border-rose-500/50 bg-rose-950/60 text-rose-100'}`} data-testid="drill-feedback-banner">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base">{validationResult.isCorrect ? '👑' : '❌'}</span>
                                <h3 className="text-sm font-bold">{validationResult.feedbackMessage}</h3>
                            </div>
                            <p className="text-xs text-slate-200">
                                <span>Coup joué : <strong className="font-mono text-white">{validationResult.playedNotation}</strong></span>
                                <span className="mx-2 text-slate-500">|</span>
                                <span>Coup optimal certifié : <strong className="font-mono text-emerald-300">{validationResult.optimalNotation}</strong></span>
                            </p>
                            {validationResult.isCorrect && currentBlunder.explanation && (
                                <p className="text-xs text-slate-200 pt-1"><strong className="text-emerald-300">Pourquoi c&apos;est optimal : </strong>{currentBlunder.explanation}</p>
                            )}
                        </div>
                        <div className="shrink-0">
                            {validationResult.isCorrect ? (
                                <button type="button" onClick={onNextBlunder} className="rounded-xl border border-emerald-400 bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition" data-testid="drill-next-btn">Erreur suivante →</button>
                            ) : (
                                <button type="button" onClick={onResetAttempt} className="rounded-xl border border-rose-400 bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition" data-testid="drill-retry-btn">↺ Réessayer ce coup</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default React.memo(BlunderDrillFeedbackCard);
