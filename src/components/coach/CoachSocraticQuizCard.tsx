'use client';

/**
 * Carte interactive « Question du Grand-Maître » (Socratic Challenge — Méthode Michy / Magriel).
 *
 * Rôle :
 *   - S'affiche en haut du diagnostic lorsqu'un joueur commet une Imprécision ou un Blunder (`equityLoss > 0.020`).
 *   - Propose 3 boutons de Plan de Jeu interactifs + un bouton discret « Voir directement l'analyse ».
 *   - Révèle instantanément le feedback (Correct ✅ / Incorrect ❌ + raison stratégique) et déroule
 *     l'analyse structurée en 3 Piliers Grands-Maîtres (Connectivity, Timing/Race, Duplication/Purity).
 *
 * Strictement < 180 lignes, 0 `any`, mémoïsé (`React.memo`).
 */

import React, { useCallback, useEffect, useState } from 'react';
import type { SocraticChallenge, SocraticGamePlanId } from '../../lib/coach/socraticQuestionBuilder';

export interface CoachSocraticQuizCardProps {
    readonly challenge: SocraticChallenge;
    readonly locale?: string;
    readonly onPlanRevealed?: (choice: SocraticGamePlanId | 'skipped') => void;
}

const CoachSocraticQuizCardComponent: React.FC<CoachSocraticQuizCardProps> = ({
    challenge,
    locale = 'fr',
    onPlanRevealed,
}) => {
    const isEn = locale.toLowerCase().startsWith('en');
    const [selectedPlanId, setSelectedPlanId] = useState<SocraticGamePlanId | null>(null);
    const [isSkipped, setIsSkipped] = useState<boolean>(false);

    useEffect(() => {
        setSelectedPlanId(null);
        setIsSkipped(false);
    }, [challenge.question, challenge.optimalPlanId]);

    const handleSelectPlan = useCallback(
        (planId: SocraticGamePlanId) => {
            setSelectedPlanId(planId);
            onPlanRevealed?.(planId);
        },
        [onPlanRevealed],
    );

    const handleSkip = useCallback(() => {
        setIsSkipped(true);
        onPlanRevealed?.('skipped');
    }, [onPlanRevealed]);

    if (!challenge.shouldTrigger) return null;

    const selectedOption = challenge.options.find((opt) => opt.id === selectedPlanId) ?? null;
    const isRevealed = selectedOption !== null || isSkipped;

    return (
        <div
            data-testid="coach-socratic-quiz-card"
            className="rounded-xl border border-amber-500/45 bg-gradient-to-b from-amber-950/35 to-slate-950/90 p-3 space-y-2.5 shadow-md"
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="text-sm">🎓</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                        {isEn ? 'Grandmaster Question' : 'Question du Grand-Maître'}
                    </span>
                    <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-200">
                        Michy / Magriel
                    </span>
                </div>
                {!isRevealed && (
                    <button
                        type="button"
                        data-testid="socratic-skip-btn"
                        onClick={handleSkip}
                        className="text-[10px] font-semibold text-slate-400 underline decoration-slate-600 underline-offset-2 hover:text-slate-200 transition cursor-pointer"
                    >
                        {isEn ? 'View analysis directly' : "Voir directement l'analyse"}
                    </button>
                )}
            </div>

            <p data-testid="socratic-quiz-question" className="text-xs font-bold leading-snug text-amber-50">
                {challenge.question}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5" role="group" aria-label={isEn ? 'Game plan choices' : 'Choix du plan de jeu'}>
                {challenge.options.map((opt, idx) => {
                    const isSelected = selectedPlanId === opt.id;
                    const btnStyle = !selectedOption
                        ? 'border-amber-500/40 bg-slate-900/85 text-amber-100 hover:border-amber-400 hover:bg-amber-900/30'
                        : opt.isOptimal
                          ? 'border-emerald-400 bg-emerald-950/70 text-emerald-100 ring-1 ring-emerald-400/50'
                          : isSelected
                            ? 'border-rose-400 bg-rose-950/70 text-rose-100'
                            : 'border-slate-800 bg-slate-950/50 text-slate-400 opacity-75';

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            data-testid={`socratic-plan-btn-${idx}`}
                            data-plan-id={opt.id}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectPlan(opt.id)}
                            className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 cursor-pointer text-left sm:text-center ${btnStyle}`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {selectedOption && (
                <div
                    data-testid="socratic-quiz-feedback"
                    role="status"
                    className={`rounded-lg border p-2 text-[11px] leading-relaxed ${
                        selectedOption.isOptimal
                            ? 'border-emerald-500/50 bg-emerald-950/45 text-emerald-100'
                            : 'border-rose-500/50 bg-rose-950/45 text-rose-100'
                    }`}
                >
                    <p className="font-bold">
                        {selectedOption.isOptimal
                            ? `${isEn ? 'Correct ✅' : 'Correct ✅'} — ${selectedOption.feedback}`
                            : selectedOption.feedback}
                    </p>
                </div>
            )}

            {isRevealed && (
                <div
                    data-testid="socratic-three-pillars"
                    className="grid grid-cols-1 gap-1.5 pt-1 border-t border-amber-500/25 text-[11px]"
                >
                    <div
                        data-testid="socratic-pillar-connectivity"
                        className="rounded-lg border border-indigo-500/30 bg-indigo-950/30 p-2 text-indigo-100"
                    >
                        <strong className="text-indigo-300">🔗 Connectivity :</strong> {challenge.threePillars.connectivity}
                    </div>
                    <div
                        data-testid="socratic-pillar-timing"
                        className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 p-2 text-cyan-100"
                    >
                        <strong className="text-cyan-300">⏱️ Timing / Race :</strong> {challenge.threePillars.timingAndRace}
                    </div>
                    <div
                        data-testid="socratic-pillar-duplication"
                        className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2 text-emerald-100"
                    >
                        <strong className="text-emerald-300">🛡️ Duplication / Purity :</strong> {challenge.threePillars.duplicationAndPurity}
                    </div>
                </div>
            )}
        </div>
    );
};

export const CoachSocraticQuizCard = React.memo(CoachSocraticQuizCardComponent);
export default CoachSocraticQuizCard;
