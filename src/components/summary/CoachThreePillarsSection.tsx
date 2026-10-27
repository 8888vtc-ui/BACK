'use client';

/**
 * Section des 3 volets pédagogiques du Coach IA (🎯 Diagnostic, 💡 Concept Clé, 🚀 Plan) (< 300 lignes, 0 any).
 */

import React from 'react';
import type { AiSynthesis } from './postMatchReportHelpers';

export interface CoachThreePillarsSectionProps {
    aiSynthesis: AiSynthesis;
    synthesisSource: 'llm' | 'rule-based';
    recurringThemes: string[];
    locale: string;
    onTrainBlunders?: () => void;
}

export const CoachThreePillarsSection: React.FC<CoachThreePillarsSectionProps> = ({
    aiSynthesis,
    synthesisSource,
    recurringThemes,
    locale,
    onTrainBlunders,
}) => {
    const isEn = locale === 'en';

    return (
        <section
            data-testid="gemini-coach-three-pillars"
            aria-label={isEn ? 'Monte-Carlo Coach 3-Part Report' : 'Rapport Pédagogique du Coach IA en 3 volets'}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#1d1109] to-[#110904] p-4 space-y-3 shadow-lg"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-base">
                        🧠
                    </span>
                    <h3 className="font-serif text-xs font-black uppercase tracking-wider text-[#f3c65f] sm:text-sm">
                        {isEn ? 'Grandmaster AI Synthesis (3 Pillars)' : 'Synthèse Pédagogique du Coach Monte-Carlo'}
                    </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {recurringThemes.map((theme, i) => (
                        <span
                            key={i}
                            data-testid={`recurring-theme-badge-${i}`}
                            className="rounded-full border border-white/10 bg-[#28170b] px-2.5 py-0.5 text-[10px] font-semibold text-[#fce8b2]"
                        >
                            {theme}
                        </span>
                    ))}
                    <span
                        data-testid="gemini-coach-source-badge"
                        className="rounded-full border border-white/10 bg-[#140b06] px-2.5 py-0.5 text-[10px] font-bold text-[#f3c65f]"
                    >
                        {synthesisSource === 'llm' ? '✨ Grand-Maître IA' : '⚜ Coach Monte-Carlo'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                {/* Volet 1 : 🎯 Le Diagnostic */}
                <div
                    data-testid="coach-pillar-diagnostic"
                    className="rounded-xl border border-white/10 bg-rose-950/20 p-3 space-y-1"
                >
                    <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-rose-300">
                        <span aria-hidden="true">🎯</span>
                        <span>{isEn ? '1. The Diagnostic' : '1. Le Diagnostic'}</span>
                    </h4>
                    <p className="text-xs leading-relaxed text-[#fdf8eb]/90">{aiSynthesis.diagnostic}</p>
                </div>

                {/* Volet 2 : 💡 Le Concept Clé */}
                <div
                    data-testid="coach-pillar-key-concept"
                    className="rounded-xl border border-white/10 bg-[#26160c]/60 p-3 space-y-1"
                >
                    <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#f3c65f]">
                        <span aria-hidden="true">💡</span>
                        <span>
                            {isEn ? '2. Key Concept: ' : '2. Le Concept Clé : '}
                            {aiSynthesis.keyConcept?.title}
                        </span>
                    </h4>
                    <p className="text-xs leading-relaxed text-[#e8dcc6]">{aiSynthesis.keyConcept?.explanation}</p>
                </div>

                {/* Volet 3 : 🚀 Plan d'entraînement personnalisé */}
                <div
                    data-testid="coach-pillar-training-plan"
                    className="rounded-xl border border-white/10 bg-emerald-950/20 p-3 space-y-1.5"
                >
                    <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                        <span aria-hidden="true">🚀</span>
                        <span>
                            {isEn ? '3. Personalized Training Plan' : '3. Plan d’entraînement personnalisé'}
                        </span>
                    </h4>
                    <ul className="space-y-1 text-xs leading-relaxed text-emerald-100">
                        {aiSynthesis.trainingPlan.slice(0, 2).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                                <span aria-hidden="true" className="text-[#f3c65f]">
                                    ▸
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    {onTrainBlunders && (
                        <button
                            type="button"
                            onClick={onTrainBlunders}
                            data-testid="coach-pillar-start-drills-btn"
                            className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-600/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition hover:bg-emerald-600/50"
                        >
                            <span>🎯</span>
                            <span>{isEn ? 'Launch Personalized Drills' : 'Lancer cet entraînement'}</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CoachThreePillarsSection;
