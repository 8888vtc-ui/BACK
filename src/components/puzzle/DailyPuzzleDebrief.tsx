'use client';

/**
 * Panneau de Débriefing & Explication IA Gemini (`DailyPuzzleDebrief.tsx`).
 *
 * Affiche :
 * - Comparatif visuel du meilleur coup (Flèches Or) vs coup joué (Flèches Rouges).
 * - Explication synthétique en langage clair (Gemini) expliquant le principe stratégique sous-jacent.
 * - Tableau complet des candidats Open Sage 3-Ply / Rollout.
 * - Échéancier de répétition espacée FSRS (J+1, J+3, J+7, J+14, J+30) si raté au 1er essai.
 */

import React from 'react';
import {
    FSRS_INTERVALS_DAYS,
    type DailyPuzzleDefinition,
    type DailyPuzzleVerdictEvaluation,
    type LocalFsrsErrorEntry,
} from '../../lib/puzzle/puzzleService';

export interface DailyPuzzleDebriefProps {
    readonly puzzle: DailyPuzzleDefinition;
    readonly verdict: DailyPuzzleVerdictEvaluation | null;
    readonly showDebrief: boolean;
    readonly fsrsScheduledEntry: LocalFsrsErrorEntry | null;
}

export const DailyPuzzleDebrief: React.FC<DailyPuzzleDebriefProps> = ({
    puzzle,
    verdict,
    showDebrief,
    fsrsScheduledEntry,
}) => {
    if (!showDebrief) return null;

    return (
        <section
            data-testid="daily-puzzle-debrief"
            className="w-full rounded-3xl border border-[#d4af37]/45 bg-gradient-to-b from-[#1f0e08] via-[#10131d] to-[#080a0f] p-5 sm:p-6 shadow-[0_28px_70px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(243,198,95,0.22)] space-y-5"
        >
            {/* En-tête Débriefing */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d4af37]/20 pb-3.5">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4af37]/50 bg-[#2d140a] text-base">
                        🎓
                    </span>
                    <div>
                        <h3 className="font-serif text-base sm:text-lg font-black text-[#fdf8eb]">
                            Débriefing Grand-Maître &amp; Explication IA Gemini
                        </h3>
                        <p className="text-xs text-[#c7b89c]">
                            Concept stratégique :{' '}
                            <strong className="text-[#f3c65f]">{puzzle.conceptLabel}</strong>
                        </p>
                    </div>
                </div>

                <span className="rounded-full border border-[#d4af37]/40 bg-[#140a05] px-3 py-1 font-mono text-[11px] font-bold text-[#f3c65f]">
                    Vérité Open Sage 3-Ply · Équité Max : +{puzzle.bestEquity.toFixed(3)}
                </span>
            </div>

            {/* 1. Comparatif visuel Meilleur Coup (Flèches Or) vs Coup Joué (Flèches Rouges) */}
            <div
                data-testid="debrief-arrows-comparison"
                className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
            >
                <div className="rounded-2xl border border-[#f3c65f]/55 bg-gradient-to-br from-[#2d1a09]/95 to-[#140b05]/95 p-4 shadow-inner space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[#f3c65f]">
                            <span aria-hidden="true">🟡</span> Flèches Or · Meilleur Coup Open Sage
                        </span>
                        <span className="rounded bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-300">
                            ΔE = 0.000
                        </span>
                    </div>
                    <div className="font-mono text-lg font-black text-[#fdf8eb]">
                        {puzzle.bestMoveNotation}
                    </div>
                    <p className="text-xs text-[#e2d2b5]">
                        Plan : <strong>{puzzle.candidates[0]?.gamePlan}</strong> · Équité :{' '}
                        <span className="font-mono text-[#f3c65f]">+{puzzle.bestEquity.toFixed(3)}</span>
                    </p>
                </div>

                <div className="rounded-2xl border border-rose-500/45 bg-gradient-to-br from-[#2b0d10]/90 to-[#13080a]/95 p-4 shadow-inner space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-rose-300">
                            <span aria-hidden="true">🔴</span> Flèches Rouges · Coup Joué
                        </span>
                        <span className="rounded bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-200">
                            ΔE ={' '}
                            {verdict
                                ? verdict.deltaEquity === 0
                                    ? '0.000'
                                    : `-${verdict.deltaEquity.toFixed(3)}`
                                : '—'}
                        </span>
                    </div>
                    <div className="font-mono text-lg font-black text-white">
                        {verdict?.playedNotation ?? 'Solution consultée'}
                    </div>
                    <p className="text-xs text-rose-200/85">
                        {verdict?.code === 'BEST'
                            ? 'Identique à la recommandation optimale du moteur.'
                            : `Écart de performance : -${(verdict?.deltaEquity ?? 0).toFixed(3)} Eq face au coup #1.`}
                    </p>
                </div>
            </div>

            {/* 2. Explication IA Gemini & Principe Stratégique */}
            <div
                data-testid="debrief-gemini-explanation"
                className="rounded-2xl border border-[#d4af37]/40 bg-[#150b06]/95 p-4 sm:p-5 space-y-3"
            >
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#f3c65f]">
                    <span>✨ Synthèse Coach IA Gemini</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-[#fdf8eb]">
                    {puzzle.geminiExplanation}
                </p>
                <div className="rounded-xl border border-[#d4af37]/30 bg-black/40 p-3 text-xs text-[#e2d2b5]">
                    <strong className="text-[#f3c65f]">Principe directeur : </strong>
                    {puzzle.strategicPrinciple}
                </div>
            </div>

            {/* 3. Table des Candidats Open Sage 3-Ply */}
            <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#e2d2b5]">
                    📊 Vérité Précalculée Open Sage 3-Ply / Rollout
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-[#d4af37]/25 bg-[#0b0e15]">
                    <table
                        data-testid="debrief-candidates-table"
                        className="w-full text-left text-xs text-[#fdf8eb]"
                    >
                        <thead className="border-b border-[#d4af37]/20 bg-[#160b06] text-[10px] uppercase tracking-wider text-[#c7b89c]">
                            <tr>
                                <th className="px-3 py-2">Rang</th>
                                <th className="px-3 py-2">Coup</th>
                                <th className="px-3 py-2">Plan Stratégique</th>
                                <th className="px-3 py-2 text-right">Équité</th>
                                <th className="px-3 py-2 text-right">ΔE</th>
                                <th className="px-3 py-2 text-right">Gain % (G%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono">
                            {puzzle.candidates.map((cand) => (
                                <tr
                                    key={cand.rank}
                                    className={
                                        cand.rank === 1
                                            ? 'bg-emerald-950/25 text-emerald-200 font-bold'
                                            : 'hover:bg-white/5'
                                    }
                                >
                                    <td className="px-3 py-2">#{cand.rank}</td>
                                    <td className="px-3 py-2 font-bold text-[#f3c65f]">
                                        {cand.notation}
                                    </td>
                                    <td className="px-3 py-2 font-sans text-[#e2d2b5]">
                                        {cand.gamePlan}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        +{cand.equity.toFixed(3)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-rose-300">
                                        {cand.equityLoss === 0
                                            ? '0.000'
                                            : `-${cand.equityLoss.toFixed(3)}`}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#c7b89c]">
                                        {cand.winPct.toFixed(1)}% ({cand.gammonPct.toFixed(1)}%)
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 4. Ordonnanceur FSRS (J+1, J+3, J+7, J+14, J+30) si raté au 1er essai */}
            {fsrsScheduledEntry && (
                <div
                    data-testid="debrief-fsrs-scheduler-card"
                    className="rounded-2xl border border-[#d4af37]/50 bg-gradient-to-r from-[#271209] to-[#130a06] p-4 space-y-2.5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#f3c65f]">
                            🗓️ File de Répétition Espacée FSRS (recurring_errors)
                        </span>
                        <span className="font-mono text-[11px] text-[#e2d2b5]">
                            Ease Factor : {fsrsScheduledEntry.ease_factor.toFixed(2)} · Répétition :{' '}
                            {fsrsScheduledEntry.repetition_count}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {FSRS_INTERVALS_DAYS.map((dayInterval, idx) => {
                            const isCurrentStage = idx === 0;
                            return (
                                <span
                                    key={dayInterval}
                                    data-testid={`fsrs-interval-pill-${dayInterval}`}
                                    className={`rounded-xl border px-3 py-1 font-mono text-xs font-bold ${
                                        isCurrentStage
                                            ? 'border-[#f3c65f] bg-[#42200d] text-[#fff3c4] shadow-[0_0_12px_rgba(243,198,95,0.35)]'
                                            : 'border-[#d4af37]/25 bg-black/40 text-[#c7b89c]'
                                    }`}
                                >
                                    J+{dayInterval}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
};

export default DailyPuzzleDebrief;
