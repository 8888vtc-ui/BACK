'use client';

/**
 * Diagnostic pédagogique Neuro-Symbolique du Grand-Maître — encadré explicatif du Coach dédié au jeu contre l'IA.
 * Intègre en haut du diagnostic le défi interactif « Question du Grand-Maître » (`CoachSocraticQuizCard`)
 * dès qu'une Imprécision ou un Blunder (`equityLoss > 0.020`) est détecté.
 * Strictement 0 `any`, < 275 lignes.
 */

import React, { useMemo, useState } from 'react';
import type { PedagogicalExplanation, SymbolicAudit } from '../../lib/coach/symbolicAudit';
import { buildSocraticQuestion } from '../../lib/coach/socraticQuestionBuilder';
import { CoachSocraticQuizCard } from './CoachSocraticQuizCard';

export interface CoachDiagnosticBoxProps {
    tacticalSummary?: string | null;
    explanation?: string | null;
    summary?: string | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    advice?: string | null;
    keyConcept?: string | null;
    conceptId?: string | null;
    symbolicAudit?: SymbolicAudit | null;
    pedagogicalExplanation?: PedagogicalExplanation | null;
    equityLoss?: number | null;
    bestMoveNotation?: string | null;
    playedMoveNotation?: string | null;
    gamePhase?: string | null;
    playerPips?: number | null;
    opponentPips?: number | null;
    pipDiff?: number | null;
    concepts?: ReadonlyArray<string> | null;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    isStreaming?: boolean;
    locale?: string;
}

type DiagnosticViewMode = 'flash' | 'socratic' | 'zare';

function formatPlayfulTheme(theme: SymbolicAudit['dominant_theme'], isEn: boolean): string {
    const labels: Record<SymbolicAudit['dominant_theme'], [string, string]> = {
        RACE: ['🏇 RACE · Course pure', '🏇 RACE · Pure Speed'],
        BLITZ: ['⚡ BLITZ · Attaque', '⚡ BLITZ · Attack'],
        PRIME: ['🧱 PRIME · Muraille', '🧱 PRIME · Wall'],
        HOLDING: ['🛡️ HOLDING · Ancre', '🛡️ HOLDING · Anchor'],
        BEAROFF: ['🏁 BEAROFF · Sprint final', '🏁 BEAROFF · Final Sprint'],
    };
    return labels[theme][isEn ? 1 : 0];
}

const CoachDiagnosticBoxComponent: React.FC<CoachDiagnosticBoxProps> = ({
    tacticalSummary,
    explanation,
    summary,
    whyFailed,
    whyOptimal,
    advice,
    keyConcept,
    conceptId,
    symbolicAudit,
    pedagogicalExplanation,
    equityLoss,
    bestMoveNotation,
    playedMoveNotation,
    gamePhase,
    playerPips,
    opponentPips,
    pipDiff,
    concepts,
    onOpenKnowledgeConcept,
    isStreaming = false,
    locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const [mode, setMode] = useState<DiagnosticViewMode>('flash');
    const [socraticStep, setSocraticStep] = useState<number>(1);

    const effectiveEquityLoss = Math.abs(equityLoss ?? symbolicAudit?.blunder_delta_equity ?? 0);
    const socraticChallenge = useMemo(
        () =>
            buildSocraticQuestion({
                gamePhase: gamePhase ?? symbolicAudit?.dominant_theme ?? undefined,
                playerPips: playerPips ?? symbolicAudit?.player_pip ?? undefined,
                opponentPips: opponentPips ?? symbolicAudit?.opponent_pip ?? undefined,
                pipDiff: pipDiff ?? undefined,
                equityLoss: effectiveEquityLoss,
                bestMoveNotation: bestMoveNotation ?? pedagogicalExplanation?.correct_play_canonical ?? undefined,
                playedMoveNotation: playedMoveNotation ?? undefined,
                directShotsConceded: symbolicAudit?.direct_shots_conceded,
                concepts: concepts ?? (conceptId ? [conceptId] : keyConcept ? [keyConcept] : undefined),
                locale,
            }),
        [gamePhase, symbolicAudit, playerPips, opponentPips, pipDiff, effectiveEquityLoss, bestMoveNotation, pedagogicalExplanation?.correct_play_canonical, playedMoveNotation, concepts, conceptId, keyConcept, locale],
    );

    const hasTextContent = Boolean(tacticalSummary || explanation || summary || whyFailed || whyOptimal || advice || pedagogicalExplanation);
    const hasSocraticTrigger = Boolean((equityLoss !== undefined && equityLoss !== null && socraticChallenge.shouldTrigger) || (symbolicAudit && socraticChallenge.shouldTrigger));
    if (!hasTextContent && !hasSocraticTrigger && !isStreaming) return null;

    const triptych = pedagogicalExplanation?.idea_problem_solution;
    const socraticHints = pedagogicalExplanation?.socratic_hints ?? [
        isEn ? `Step 1 (Plan): Identify the priority in this ${symbolicAudit?.dominant_theme ?? 'tactical'} structure.` : `Indice 1 (Plan) : Identifiez la priorité dans ce schéma ${symbolicAudit?.dominant_theme ?? 'tactique'}.`,
        whyFailed || (isEn ? 'Step 2 (Weakness): Look at the direct shots conceded to the AI.' : "Indice 2 (Zone) : Observez les tirs directs concédés à l'IA."),
        whyOptimal || summary || (isEn ? 'Step 3 (Solution): Consolidate your key points.' : 'Indice 3 (Solution) : Verrouillez vos portes maîtresses.'),
    ];

    const zareSummary = pedagogicalExplanation?.zare_luck_vs_skill || advice;
    const michyProverb = pedagogicalExplanation?.michy_proverb;
    const modeTabs: Array<{ id: DiagnosticViewMode; label: string; activeCls: string; testId: string }> = [
        { id: 'flash', label: isEn ? '⚡ Coach AI' : '⚡ Coach IA', activeCls: 'bg-indigo-600 text-white shadow-sm', testId: 'coach-mode-flash-btn' },
        { id: 'socratic', label: isEn ? '❓ 3 Hints' : '❓ 3 Indices', activeCls: 'bg-amber-600 text-white shadow-sm', testId: 'coach-mode-socratic-btn' },
        { id: 'zare', label: isEn ? '⚖️ Skill vs Luck' : '⚖️ Niveau vs Dés', activeCls: 'bg-emerald-600 text-white shadow-sm', testId: 'coach-mode-zare-btn' },
    ];

    return (
        <section
            data-testid="coach-diagnostic-box"
            aria-label={isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'}
            className="rounded-xl border border-indigo-800/60 bg-gradient-to-b from-indigo-950/40 to-slate-950/80 p-3 space-y-2.5"
        >
            <header className="flex flex-wrap items-center gap-2 border-b border-indigo-900/50 pb-2">
                <span aria-hidden="true" className="text-sm">🧠</span>
                <h3 className="text-[11px] font-black uppercase tracking-wider text-indigo-300">
                    {isEn ? 'Grandmaster diagnostic' : 'Diagnostic du Grand-Maître'}
                </h3>

                <div role="tablist" aria-label={isEn ? 'Coaching mode' : 'Mode de coaching'} className="ml-auto flex items-center gap-1 rounded-lg bg-slate-900/90 p-0.5 border border-indigo-800/50">
                    {modeTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={mode === tab.id}
                            data-testid={tab.testId}
                            onClick={() => setMode(tab.id)}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition ${mode === tab.id ? tab.activeCls : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {keyConcept &&
                    (onOpenKnowledgeConcept ? (
                        <button
                            type="button"
                            onClick={() => onOpenKnowledgeConcept(conceptId || keyConcept)}
                            data-testid="coach-concept-badge-btn"
                            title={isEn ? `Open theory guide: ${keyConcept}` : `Ouvrir la fiche théorique : ${keyConcept}`}
                            className="flex items-center gap-1 rounded-full border border-indigo-500/70 bg-indigo-900/70 px-2 py-0.5 text-[11px] font-bold text-indigo-200 hover:bg-indigo-700/80 hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
                        >
                            <span aria-hidden="true">📖</span>
                            <span>{keyConcept}</span>
                        </button>
                    ) : (
                        <span className="rounded-full border border-indigo-700/60 bg-indigo-900/60 px-2 py-0.5 text-[11px] font-bold text-indigo-200">
                            {keyConcept}
                        </span>
                    ))}
            </header>

            {socraticChallenge.shouldTrigger && (
                <CoachSocraticQuizCard challenge={socraticChallenge} locale={locale} />
            )}

            {mode === 'flash' && symbolicAudit && (
                <div data-testid="coach-symbolic-telemetry" className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg border border-indigo-700/40 bg-slate-900/75 px-2.5 py-1.5 font-mono text-[10px]">
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-black text-indigo-300 border border-indigo-400/40">
                        {formatPlayfulTheme(symbolicAudit.dominant_theme, isEn)}
                    </span>
                    <span className="text-slate-300">Pips <strong className="text-white">{symbolicAudit.player_pip}</strong>/{symbolicAudit.opponent_pip}</span>
                    <span className="text-rose-300">{isEn ? 'Shots' : 'Tirs'} <strong>{symbolicAudit.direct_shots_conceded}/36</strong></span>
                    <span className="text-amber-300 font-bold">ΔEq -{symbolicAudit.blunder_delta_equity.toFixed(3)}</span>
                </div>
            )}

            {mode === 'flash' && pedagogicalExplanation?.headline && (
                <p data-testid="coach-sweller-headline" className="text-xs font-extrabold tracking-wide text-amber-100">
                    ⚡ {pedagogicalExplanation.headline}
                </p>
            )}

            {mode === 'socratic' && (
                <div data-testid="coach-socratic-panel" className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            {isEn ? `Socratic Training — Step ${socraticStep}/3` : `Entraînement Socratique — Étape ${socraticStep}/3`}
                        </span>
                        <div className="flex gap-1">
                            {[1, 2, 3].map((step) => (
                                <button key={step} type="button" onClick={() => setSocraticStep(step)} className={`h-5 w-5 rounded-full text-[10px] font-black transition ${socraticStep >= step ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                    {step}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5 text-[11px] leading-relaxed text-amber-100">
                        <p className="rounded bg-slate-900/70 p-2 border border-amber-500/20">{socraticHints[0]}</p>
                        {socraticStep >= 2 && <p className="rounded bg-slate-900/70 p-2 border border-amber-500/30">{socraticHints[1]}</p>}
                        {socraticStep >= 3 && <p className="rounded bg-emerald-950/50 p-2 border border-emerald-500/40 text-emerald-200 font-semibold">{socraticHints[2]}</p>}
                    </div>
                    {socraticStep < 3 && (
                        <button type="button" data-testid="coach-socratic-next-btn" onClick={() => setSocraticStep((prev) => Math.min(3, prev + 1))} className="w-full rounded-lg border border-amber-400/50 bg-amber-500/20 py-1 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition">
                            {isEn ? 'Reveal next hint →' : "Dévoiler l'indice suivant →"}
                        </button>
                    )}
                </div>
            )}

            {mode === 'zare' && (
                <div data-testid="coach-zare-panel" className="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                    {symbolicAudit && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800">
                                <div className="text-[11px] uppercase text-slate-400">{isEn ? 'Pip Race' : 'Course Pips'}</div>
                                <div className="text-xs font-bold text-white">{symbolicAudit.player_pip} vs {symbolicAudit.opponent_pip}</div>
                            </div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800">
                                <div className="text-[11px] uppercase text-slate-400">{isEn ? 'Direct Shots' : 'Tirs concédés'}</div>
                                <div className="text-xs font-bold text-rose-300">{symbolicAudit.direct_shots_conceded}/36</div>
                            </div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800">
                                <div className="text-[11px] uppercase text-slate-400">{isEn ? 'Theme' : 'Plan IA / Jeu'}</div>
                                <div className="text-xs font-bold text-indigo-300">{symbolicAudit.dominant_theme}</div>
                            </div>
                            <div className="rounded bg-slate-900/80 p-1.5 border border-slate-800">
                                <div className="text-[11px] uppercase text-slate-400">Magriel</div>
                                <div className="text-xs font-bold text-amber-300">{symbolicAudit.magriel_posture ?? 'SAFE'}</div>
                            </div>
                        </div>
                    )}
                    {zareSummary && (
                        <p className="text-[11px] leading-relaxed text-emerald-200">
                            ⚖️ <span className="font-bold">{isEn ? 'Douglas Zare Equation:' : 'Équation de Douglas Zare :'}</span> {zareSummary}
                        </p>
                    )}
                </div>
            )}

            {(mode === 'flash' || (mode === 'socratic' && socraticStep >= 3)) && (
                <>
                    {tacticalSummary && <p data-testid="coach-tactical-summary" className="text-xs leading-relaxed text-slate-200">{tacticalSummary}</p>}
                    {summary && summary !== tacticalSummary && <p className="text-xs font-semibold leading-snug text-white">{summary}</p>}
                    {triptych?.opponent_intention && (
                        <div className="flex items-start gap-1.5 rounded-lg border border-cyan-900/40 bg-cyan-950/25 p-2">
                            <span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px]">🤖</span>
                            <span className="text-[11px] leading-relaxed text-cyan-200"><strong className="text-cyan-100">{isEn ? 'AI Plan:' : "Plan de l'IA :"}</strong> {triptych.opponent_intention}</span>
                        </div>
                    )}
                    {(whyFailed || whyOptimal) && (
                        <div className="space-y-1.5">
                            {whyFailed && (
                                <div className="flex items-start gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/30 p-2">
                                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-rose-400">❌</span>
                                    <span className="text-[11px] leading-relaxed text-rose-200">{whyFailed}</span>
                                </div>
                            )}
                            {whyOptimal && (
                                <div className="flex items-start gap-1.5 rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-2">
                                    <span aria-hidden="true" className="mt-0.5 shrink-0 text-[10px] text-emerald-400">✅</span>
                                    <span className="text-[11px] leading-relaxed text-emerald-200">{whyOptimal}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {michyProverb && <div className="rounded-md border border-indigo-500/30 bg-indigo-950/30 px-2.5 py-1.5 text-[11px] italic text-indigo-200">📜 {michyProverb}</div>}
                    {explanation && (
                        <div className="whitespace-pre-line text-[11px] leading-relaxed text-slate-300">
                            {explanation}
                            {isStreaming && <span className="ml-1 inline-block animate-pulse font-mono font-bold text-indigo-400">▋</span>}
                        </div>
                    )}
                    {advice && (
                        <div className="rounded-md border border-amber-500/30 bg-amber-950/20 p-2 text-[11px] leading-relaxed text-amber-200">
                            💡 <span className="font-semibold text-amber-100">{isEn ? 'Advice' : 'Conseil'} :</span> {advice}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export const CoachDiagnosticBox = React.memo(CoachDiagnosticBoxComponent);
export default CoachDiagnosticBox;
