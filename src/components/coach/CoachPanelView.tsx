'use client';

/**
 * Vue de présentation du panneau Coach (structure analytique XG / Snowie, < 240 lignes, 0 any).
 *
 * Composant 100 % muet (LOI 5) : tout l'état vit dans `CoachPanel`.
 */

import React from 'react';
import CoachMoveComparisonCard from './CoachMoveComparisonCard';
import CoachPrDashboard, { type DecisionCounters } from './CoachPrDashboard';
import CoachCandidatesTable, { type CandidateRow } from './CoachCandidatesTable';
import CoachDiagnosticBox from './CoachDiagnosticBox';
import CoachFooterTabs from './CoachFooterTabs';
import CoachPanelActions from './CoachPanelActions';
import type { ExplanationSource } from './useCoachExplanation';
import type { CoachDisplayVerdict, MatchStats, ParsedExplanation } from './coachPanelHelpers';
import type { RawGameTurn } from '../../features/rating';
import type { RolloutResult } from '../../lib/engine/rolloutClient';

export interface CoachPanelViewProps {
    verdict: CoachDisplayVerdict;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    parsed: ParsedExplanation;
    hasContent: boolean;
    isStreaming: boolean;
    streamError: string | null;
    explanationSource: ExplanationSource;
    performanceRating: number;
    decisionCounters: DecisionCounters;
    candidateRows: CandidateRow[];
    matchStats?: MatchStats;
    matchStatsO?: MatchStats;
    tacticalSummary?: string | null;
    propSummary?: string | null;
    propWhyFailed?: string | null;
    propWhyOptimal?: string | null;
    onReplayMove?: () => void;
    onDismiss: () => void;
    onExplainClick: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void;
    turnsHistory?: RawGameTurn[] | unknown[];
    board?: number[];
    xgid?: string | null;
    candidateMoves?: string[];
    onRolloutCompleted?: (result: RolloutResult) => void;
    isVoiceEnabled?: boolean;
    isSpeaking?: boolean;
    onToggleVoice?: () => void;
    onReplayVoice?: () => void;
    locale: string;
    labels: {
        title: string;
        close: string;
        sourceCache: string;
        sourceRuleBased: string;
        sourceLlm: string;
        retry: string;
        explainError: string;
    };
}

const CoachPanelViewComponent: React.FC<CoachPanelViewProps> = ({
    verdict,
    equityLoss,
    playedMove,
    optimalMove,
    parsed,
    hasContent,
    isStreaming,
    streamError,
    explanationSource,
    performanceRating,
    decisionCounters,
    candidateRows,
    matchStats,
    matchStatsO,
    tacticalSummary,
    propSummary,
    propWhyFailed,
    propWhyOptimal,
    onReplayMove,
    onDismiss,
    onExplainClick,
    onOpenKnowledgeConcept,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    board,
    xgid,
    candidateMoves,
    onRolloutCompleted,
    isVoiceEnabled = false,
    isSpeaking = false,
    onToggleVoice,
    onReplayVoice,
    locale,
    labels,
}) => {
    const isBlunder = verdict === 'blunder';
    const accent = isBlunder
        ? 'border-rose-500/75 bg-gradient-to-b from-[#1e0b0f]/95 to-[#0b0e17]/95 text-rose-300 shadow-[0_12px_32px_rgba(0,0,0,0.8)]'
        : 'border-[#d4af37]/65 bg-gradient-to-b from-[#1c150b]/95 to-[#0b0e17]/95 text-[#f3c65f] shadow-[0_12px_32px_rgba(0,0,0,0.8)]';

    return (
        <aside
            role="region"
            aria-live="polite"
            className={`w-full max-w-5xl rounded-2xl border p-4 backdrop-blur-md transition-all ${accent}`}
        >
            {/* Barre de titre, contrôle vocal et bouton fermeture */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBlunder ? 'bg-rose-400' : 'bg-[#f3c65f]'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBlunder ? 'bg-rose-500' : 'bg-[#d4af37]'}`}></span>
                    </span>
                    <h2 className="font-serif text-base font-bold tracking-wide text-[#fdf8eb]">{labels.title}</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    {onToggleVoice && (
                        <button
                            type="button"
                            onClick={onToggleVoice}
                            data-testid="coach-voice-toggle-btn"
                            aria-pressed={isVoiceEnabled}
                            aria-label={isVoiceEnabled ? 'Voix Coach' : 'Voix muette'}
                            title={isVoiceEnabled ? 'Désactiver la voix du Coach' : 'Activer la voix du Coach'}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition active:scale-95 ${
                                isVoiceEnabled
                                    ? 'border-[#f3c65f]/70 bg-[#2a1c0b]/90 text-[#fce8b2] shadow-[0_0_10px_rgba(243,198,95,0.2)]'
                                    : 'border-[#d4af37]/30 bg-black/40 text-slate-400 hover:border-[#f3c65f]/50 hover:text-slate-200'
                            }`}
                        >
                            <span>{isVoiceEnabled ? '🔊 Voix Coach' : '🔇 Voix muette'}</span>
                            {isSpeaking && (
                                <span
                                    data-testid="coach-voice-wave"
                                    aria-hidden="true"
                                    className="inline-flex items-end gap-0.5 h-2.5 ml-0.5 animate-pulse"
                                >
                                    <span className="w-0.5 h-1.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-2.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-1 bg-[#f3c65f] rounded-full animate-pulse" />
                                </span>
                            )}
                        </button>
                    )}
                    {onReplayVoice && (
                        <button
                            type="button"
                            onClick={onReplayVoice}
                            data-testid="coach-voice-replay-btn"
                            aria-label={locale === 'en' ? 'Replay explanation' : "Réécouter l'explication"}
                            title={locale === 'en' ? 'Listen to explanation' : "Réécouter l'explication à la demande"}
                            className={`inline-flex items-center gap-1 rounded-lg border border-indigo-400/40 bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-200 hover:border-indigo-300 hover:text-white transition active:scale-95 ${
                                isSpeaking ? 'animate-pulse border-indigo-300 text-white' : ''
                            }`}
                        >
                            <span aria-hidden="true">🔈</span>
                            <span>{locale === 'en' ? 'Listen' : 'Réécouter'}</span>
                        </button>
                    )}
                    <button
                        onClick={onDismiss}
                        className="rounded-lg border border-[#d4af37]/30 bg-black/40 p-1 text-slate-300 hover:border-[#f3c65f] hover:text-white transition"
                        aria-label={labels.close}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* 0. Tableau de bord PR : jauge visuelle + compteurs des 4 paliers */}
            <div className="mt-3">
                <CoachPrDashboard
                    pr={performanceRating}
                    decisionsCount={matchStats?.decisionsCount ?? 0}
                    totalEquityLoss={matchStats?.totalEquityLoss ?? 0}
                    counters={decisionCounters}
                    onBlunderClick={onBlunderClick}
                />
            </div>

            {/* 1. Carte Verdict & Comparaison (bandeau 4 niveaux + coup joué vs meilleur coup) */}
            <div className="mt-3">
                <CoachMoveComparisonCard
                    verdict={verdict}
                    equityLoss={equityLoss}
                    playedMove={playedMove}
                    optimalMove={optimalMove}
                    whyFailed={propWhyFailed || parsed.whyFailed}
                    whyOptimal={propWhyOptimal || parsed.whyOptimal}
                    summary={propSummary || parsed.summary}
                    onReplayMove={onReplayMove}
                    onClose={onDismiss}
                    locale={locale}
                />
            </div>

            {/* 2. Tableau analytique des candidats (style Snowie / XG) */}
            {candidateRows.length > 0 && (
                <div className="mt-3">
                    <CoachCandidatesTable
                        candidates={candidateRows}
                        playedMove={playedMove}
                        onCandidateHover={onCandidateHover}
                        maxRows={5}
                        locale={locale}
                    />
                </div>
            )}

            {/* 3. Diagnostic pédagogique du Grand-Maître */}
            <div className="mt-3">
                <CoachDiagnosticBox
                    tacticalSummary={tacticalSummary}
                    explanation={parsed.explanation || parsed.rawText}
                    summary={propSummary || parsed.summary}
                    whyFailed={propWhyFailed || parsed.whyFailed}
                    whyOptimal={propWhyOptimal || parsed.whyOptimal}
                    advice={parsed.advice}
                    keyConcept={parsed.keyConcept}
                    conceptId={parsed.conceptId}
                    onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                    isStreaming={isStreaming}
                    locale={locale}
                />
            </div>

            {/* 3bis. Actions : explication LLM, fiche théorique, erreurs de flux */}
            <CoachPanelActions
                explanationSource={explanationSource}
                streamError={streamError}
                hasContent={hasContent}
                isStreaming={isStreaming}
                onExplainClick={onExplainClick}
                onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                conceptId={parsed.conceptId}
                locale={locale}
                labels={{
                    sourceCache: labels.sourceCache,
                    sourceRuleBased: labels.sourceRuleBased,
                    sourceLlm: labels.sourceLlm,
                    retry: labels.retry,
                    explainError: labels.explainError,
                }}
            />

            {/* 4. Pied du Coach à onglets repliables */}
            <div className="mt-3">
                <CoachFooterTabs
                    turnsHistory={turnsHistory}
                    board={board}
                    matchStats={matchStats}
                    matchStatsO={matchStatsO}
                    xgid={xgid}
                    playedMove={playedMove}
                    optimalMove={optimalMove}
                    candidateMoves={candidateMoves}
                    onRolloutCompleted={onRolloutCompleted}
                    locale={locale}
                />
            </div>
        </aside>
    );
};

export const CoachPanelView = React.memo(CoachPanelViewComponent);
export default CoachPanelView;
