'use client';

/**
 * Vue de présentation du panneau Coach Zéro-Scroll (3 Onglets + « 🧠 Analyse Profonde » Open Sage Max, < 295 lignes, 0 any).
 * Composant 100 % orienté présentation : conserve l'ordre DOM strict pour le SSR et les tests tout en isolant chaque onglet.
 */

import React, { useState } from 'react';
import CoachMoveComparisonCard from './CoachMoveComparisonCard';
import CoachPrDashboard, { type DecisionCounters } from './CoachPrDashboard';
import CoachCandidatesTable, { type CandidateRow } from './CoachCandidatesTable';
import CoachDiagnosticBox from './CoachDiagnosticBox';
import CoachDeepAnalysisSection from './CoachDeepAnalysisSection';
import CoachFooterTabs from './CoachFooterTabs';
import CoachPanelActions from './CoachPanelActions';
import type { ExplanationSource } from './useCoachExplanation';
import type { CoachDisplayVerdict, MatchStats, ParsedExplanation } from './coachPanelHelpers';
import type { StrategicFeatures } from '../../features/coach/featureExtractor';
import { getDeepAnalysisCopyLabels } from '../../features/coach/deepAnalysisQuota';
import type { RawGameTurn } from '../../features/rating';
import type { RolloutResult } from '../../lib/engine/rolloutClient';
import type { ZareTiltEvaluation } from '../../lib/coach/zareTiltEngine';

type CoachZeroScrollTab = 'diagnostic' | 'candidates' | 'questions';

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
    onDeepExplainClick?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void;
    turnsHistory?: RawGameTurn[] | unknown[];
    board?: number[];
    dice?: [number, number] | null;
    xgid?: string | null;
    positionKey?: string | null;
    features?: StrategicFeatures;
    candidateMoves?: string[];
    onRolloutCompleted?: (result: RolloutResult) => void;
    isVoiceEnabled?: boolean;
    isSpeaking?: boolean;
    onToggleVoice?: () => void;
    onReplayVoice?: () => void;
    tiltEvaluation?: ZareTiltEvaluation;
    showTiltAlert?: boolean;
    onDismissTiltAlert?: () => void;
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
    onDeepExplainClick,
    onOpenKnowledgeConcept,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    board,
    dice,
    xgid,
    positionKey,
    features,
    candidateMoves,
    onRolloutCompleted,
    isVoiceEnabled = false,
    isSpeaking = false,
    onToggleVoice,
    onReplayVoice,
    tiltEvaluation,
    showTiltAlert = false,
    onDismissTiltAlert,
    locale,
    labels,
}) => {
    const [activeMainTab, setActiveMainTab] = useState<CoachZeroScrollTab>('diagnostic');
    const isBlunder = verdict === 'blunder';
    const isEn = Boolean(locale && locale !== 'fr');
    const deepCopy = getDeepAnalysisCopyLabels(locale);
    const moveKey = `${positionKey ?? xgid ?? 'pos'}::${playedMove ?? 'move'}::${optimalMove ?? 'opt'}`;
    const accent = isBlunder
        ? 'border-rose-500/60 bg-slate-950/95 text-rose-300 shadow-[0_12px_32px_rgba(0,0,0,0.8)]'
        : 'border-white/15 bg-slate-950/95 text-amber-300 shadow-[0_12px_32px_rgba(0,0,0,0.8)]';

    return (
        <div role="region" aria-live="polite" className={`w-full max-w-5xl rounded-xl border p-2.5 backdrop-blur-md transition-all ${accent}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isBlunder ? 'bg-rose-400' : 'bg-amber-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isBlunder ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                    </span>
                    <h2 className="font-sans text-base font-bold tracking-tight text-white">{labels.title}</h2>
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
                                    ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                                    : 'border-white/10 bg-slate-900 text-slate-400 hover:border-white/25 hover:text-slate-200'
                            }`}
                        >
                            <span>{isVoiceEnabled ? '🔊 Voix Coach' : '🔇 Voix muette'}</span>
                            {isSpeaking && (
                                <span data-testid="coach-voice-wave" aria-hidden="true" className="inline-flex items-end gap-0.5 h-2.5 ml-0.5 animate-pulse">
                                    <span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                                    <span className="w-0.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                                    <span className="w-0.5 h-1 bg-amber-400 rounded-full animate-pulse" />
                                </span>
                            )}
                        </button>
                    )}
                    {onReplayVoice && (
                        <button
                            type="button"
                            onClick={onReplayVoice}
                            data-testid="coach-voice-replay-btn"
                            aria-label={isEn ? 'Replay explanation' : "Réécouter l'explication"}
                            title={isEn ? 'Listen to explanation' : "Réécouter l'explication à la demande"}
                            className={`inline-flex items-center gap-1 rounded-lg border border-indigo-400/40 bg-indigo-950/60 px-2 py-0.5 text-[11px] font-bold text-indigo-200 hover:border-indigo-300 hover:text-white transition active:scale-95 ${
                                isSpeaking ? 'animate-pulse border-indigo-300 text-white' : ''
                            }`}
                        >
                            <span aria-hidden="true">🔈</span>
                            <span>{isEn ? 'Listen' : 'Réécouter'}</span>
                        </button>
                    )}
                    <button
                        onClick={onDismiss}
                        className="rounded-lg border border-white/10 bg-slate-900 p-1 text-slate-300 hover:border-amber-400/50 hover:text-white transition"
                        aria-label={labels.close}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {showTiltAlert && tiltEvaluation && (
                <div
                    data-testid="coach-tilt-alert-banner"
                    role="alert"
                    className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-amber-400/50 bg-amber-950/60 px-3 py-2 text-xs text-amber-100"
                >
                    <span>
                        🧘 <strong>{isEn ? 'Anti-Tilt Pause:' : 'Pause Anti-Tilt :'}</strong>{' '}
                        {isEn ? tiltEvaluation.recommendationEn : tiltEvaluation.recommendationFr}
                    </span>
                    {onDismissTiltAlert && (
                        <button type="button" onClick={onDismissTiltAlert} className="shrink-0 rounded border border-amber-400/40 px-1.5 py-0.5 text-[10px] font-bold hover:bg-amber-800/50">
                            OK
                        </button>
                    )}
                </div>
            )}

            {/* Barre de navigation Zéro-Scroll en 3 Onglets */}
            <div
                role="tablist"
                data-testid="coach-zero-scroll-tabs"
                aria-label={isEn ? 'Coach sections' : 'Sections du Coach'}
                className="mt-2.5 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-slate-900/90 p-1"
            >
                <button
                    type="button"
                    role="tab"
                    data-testid="coach-tab-diagnostic"
                    aria-selected={activeMainTab === 'diagnostic'}
                    onClick={() => setActiveMainTab('diagnostic')}
                    className={`rounded-lg py-1 text-[11px] font-extrabold transition ${
                        activeMainTab === 'diagnostic' ? 'bg-[#d4af37] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                    }`}
                >
                    {deepCopy.tabDiagnostic}
                </button>
                <button
                    type="button"
                    role="tab"
                    data-testid="coach-tab-candidates"
                    aria-selected={activeMainTab === 'candidates'}
                    onClick={() => setActiveMainTab('candidates')}
                    className={`rounded-lg py-1 text-[11px] font-extrabold transition ${
                        activeMainTab === 'candidates' ? 'bg-[#d4af37] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                    }`}
                >
                    {deepCopy.tabCandidates} {candidateRows.length > 0 ? `(${candidateRows.length})` : ''}
                </button>
                <button
                    type="button"
                    role="tab"
                    data-testid="coach-tab-questions"
                    aria-selected={activeMainTab === 'questions'}
                    onClick={() => setActiveMainTab('questions')}
                    className={`rounded-lg py-1 text-[11px] font-extrabold transition ${
                        activeMainTab === 'questions' ? 'bg-[#d4af37] text-slate-950 shadow' : 'text-slate-300 hover:text-white'
                    }`}
                >
                    {deepCopy.tabQuestions}
                </button>
            </div>

            {/* 1. PRIORITÉ N°1 : Verdict immédiat & Comparaison des coups tout en haut */}
            <div className="mt-2.5">
                <CoachMoveComparisonCard
                    verdict={verdict}
                    equityLoss={equityLoss}
                    playedMove={playedMove}
                    optimalMove={optimalMove}
                    whyFailed={parsed.whyFailed || propWhyFailed}
                    whyOptimal={parsed.whyOptimal || propWhyOptimal}
                    summary={parsed.summary || propSummary}
                    onReplayMove={onReplayMove}
                    locale={locale}
                    board={board}
                    dice={dice}
                    keyConcept={parsed.keyConcept}
                />
            </div>

            {/* ONGLET 1 : Diagnostic & Analyse Profonde (1 offerte / jour) */}
            <div className={activeMainTab === 'diagnostic' ? 'mt-2.5 space-y-2.5' : 'hidden'}>
                <CoachDeepAnalysisSection
                    moveKey={moveKey}
                    playedMove={playedMove}
                    optimalMove={optimalMove}
                    equityLoss={equityLoss}
                    features={features}
                    symbolicAudit={parsed.symbolicAudit}
                    pedagogicalExplanation={parsed.pedagogicalExplanation}
                    whyFailed={parsed.whyFailed || propWhyFailed}
                    whyOptimal={parsed.whyOptimal || propWhyOptimal}
                    explanation={parsed.explanation || parsed.rawText}
                    isStreaming={isStreaming}
                    onTriggerDeepAnalysis={onDeepExplainClick ?? onExplainClick}
                    locale={locale}
                />

                <CoachDiagnosticBox
                    tacticalSummary={tacticalSummary && tacticalSummary !== (parsed.summary || propSummary) ? tacticalSummary : null}
                    explanation={parsed.explanation || parsed.rawText}
                    advice={parsed.advice}
                    keyConcept={parsed.keyConcept}
                    conceptId={parsed.conceptId}
                    symbolicAudit={parsed.symbolicAudit}
                    pedagogicalExplanation={parsed.pedagogicalExplanation}
                    equityLoss={equityLoss}
                    bestMoveNotation={optimalMove}
                    playedMoveNotation={playedMove}
                    onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                    onRetryMove={onReplayMove}
                    isStreaming={isStreaming}
                    locale={locale}
                    board={board}
                    dice={dice}
                />

                <CoachPanelActions
                    explanationSource={explanationSource}
                    streamError={streamError}
                    hasContent={hasContent}
                    isStreaming={isStreaming}
                    onExplainClick={onExplainClick}
                    onOpenKnowledgeConcept={parsed.keyConcept ? undefined : onOpenKnowledgeConcept}
                    conceptId={parsed.conceptId}
                    locale={locale}
                    labels={labels}
                />
            </div>

            {/* ONGLET 2 : Top 5 Candidats Open Sage Max & Bilan PR */}
            <div className={activeMainTab === 'candidates' ? 'mt-2.5 space-y-2.5' : 'hidden'}>
                {candidateRows.length > 0 && (
                    <CoachCandidatesTable
                        candidates={candidateRows}
                        playedMove={playedMove}
                        onCandidateHover={onCandidateHover}
                        maxRows={5}
                        locale={locale}
                    />
                )}
                <CoachPrDashboard
                    pr={performanceRating}
                    decisionsCount={matchStats?.decisionsCount ?? 0}
                    totalEquityLoss={matchStats?.totalEquityLoss ?? 0}
                    counters={decisionCounters}
                    onBlunderClick={onBlunderClick}
                />
            </div>

            {/* ONGLET 3 : Questions & Outils Avancés (Grille 36 / Feuille de Match / Rollout) */}
            <div className={activeMainTab === 'questions' ? 'mt-2.5 space-y-2.5' : 'hidden'}>
                <CoachDeepAnalysisSection
                    moveKey={moveKey}
                    playedMove={playedMove}
                    optimalMove={optimalMove}
                    equityLoss={equityLoss}
                    features={features}
                    symbolicAudit={parsed.symbolicAudit}
                    pedagogicalExplanation={parsed.pedagogicalExplanation}
                    whyFailed={parsed.whyFailed || propWhyFailed}
                    whyOptimal={parsed.whyOptimal || propWhyOptimal}
                    explanation={parsed.explanation || parsed.rawText}
                    isStreaming={isStreaming}
                    onTriggerDeepAnalysis={onDeepExplainClick ?? onExplainClick}
                    locale={locale}
                />
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
        </div>
    );
};

export const CoachPanelView = React.memo(CoachPanelViewComponent);
export default CoachPanelView;
