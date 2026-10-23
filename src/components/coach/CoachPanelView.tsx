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
            {/* Barre de titre et bouton fermeture */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBlunder ? 'bg-rose-400' : 'bg-[#f3c65f]'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBlunder ? 'bg-rose-500' : 'bg-[#d4af37]'}`}></span>
                    </span>
                    <h2 className="font-serif text-base font-bold tracking-wide text-[#fdf8eb]">{labels.title}</h2>
                </div>
                <button
                    onClick={onDismiss}
                    className="rounded-lg border border-[#d4af37]/30 bg-black/40 p-1 text-slate-300 hover:border-[#f3c65f] hover:text-white transition"
                    aria-label={labels.close}
                >
                    ✕
                </button>
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
