'use client';

/**
 * Conteneur du panneau d'analyse du Coach IA (< 285 lignes, 0 any).
 *
 * Rôle :
 *   Orchestre l'état et délègue le rendu à `CoachPanelView` :
 *     - préférences utilisateur (`useCoachPreferences`) ;
 *     - contexte de match MET (`resolveMatchContext`) ;
 *     - statistiques PR et compteurs des 4 paliers (`deriveDecisionCounters`) ;
 *     - explication pédagogique (`useCoachExplanation`).
 */

import React, { useEffect, useMemo, useRef } from 'react';
import CoachPanelSkeleton from './CoachPanelSkeleton';
import CoachPanelView from './CoachPanelView';
import { useCoachExplanation } from './useCoachExplanation';
import { useCoachPreferences } from './useCoachPreferences';
import {
    computePerformanceRating,
    parseStreamedExplanation,
    resolveMatchContext,
    buildCandidateRows,
    deriveDecisionCounters,
    shouldAutoTriggerExplanation,
    buildCoachViewLabels,
    type CandidateMove,
    type MatchStats,
    type ParsedExplanation,
    type CoachPanelProps,
    type CoachDisplayVerdict,
} from './coachPanelHelpers';
import { useI18n } from '../../lib/i18n';
import { soundEngine } from '../../lib/sound/soundEngine';
import { useCoachVoice } from '../../hooks/useCoachVoice';

// Ré-exports pour compatibilité ascendante (tests et consommateurs existants).
export {
    computePerformanceRating,
    getPRBadge,
    getPRColor,
    getMasterBookRecommendation,
    parseStreamedExplanation,
    formatGammonPrice,
    formatPercent,
    resolveMatchContext,
    buildCandidateRows,
    deriveDecisionCounters,
    shouldAutoTriggerExplanation,
    buildCoachViewLabels,
} from './coachPanelHelpers';
export type {
    MatchStats,
    CandidateMove,
    ParsedExplanation,
    CoachPanelProps,
    CoachDisplayVerdict,
} from './coachPanelHelpers';

export default function CoachPanel({
    verdict,
    equityLoss,
    playedMove,
    optimalMove,
    explanation,
    whyFailed: propWhyFailed,
    whyOptimal: propWhyOptimal,
    summary: propSummary,
    tacticalSummary: propTacticalSummary,
    onExplain,
    onDismiss,
    onOpenKnowledgeConcept,
    isLoading = false,
    features,
    matchStats,
    matchContext: rawMatchContext,
    playerLevel = 'intermediate',
    apiUrl = '/api/coach',
    triggerMode: propTriggerMode,
    onTriggerModeChange,
    autoThreshold: propAutoThreshold,
    onAutoThresholdChange,
    isOffline: propIsOffline,
    onOfflineToggle,
    positionKey,
    gameId,
    dice,
    board,
    xgid,
    candidateMoves,
    topMoves,
    onReplayMove,
    onRolloutCompleted,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    matchStatsO,
}: CoachPanelProps) {
    const { t, locale } = useI18n();
    const { isVoiceEnabled, isSpeaking, speak, stop, toggleVoice } = useCoachVoice();

    const { triggerMode, autoThreshold, isOffline } = useCoachPreferences({
        triggerMode: propTriggerMode,
        onTriggerModeChange,
        autoThreshold: propAutoThreshold,
        onAutoThresholdChange,
        isOffline: propIsOffline,
        onOfflineToggle,
    });

    const matchCtx = useMemo(() => resolveMatchContext(rawMatchContext), [rawMatchContext]);

    const performanceRating = useMemo(
        () => computePerformanceRating(matchStats ?? { decisionsCount: 0, totalEquityLoss: 0, blundersCount: 0 }),
        [matchStats],
    );

    const candidateRows = useMemo(() => buildCandidateRows(topMoves), [topMoves]);
    const decisionCounters = useMemo(() => deriveDecisionCounters(matchStats), [matchStats]);

    const {
        streamedText,
        isStreaming,
        streamError,
        explanationSource,
        cachedExplanation,
        executeExplain,
        abort,
    } = useCoachExplanation({
        verdict,
        equityLoss,
        playedMove,
        optimalMove,
        features,
        matchCtx,
        playerLevel,
        apiUrl,
        locale,
        isOffline,
        positionKey,
        xgid,
        gameId,
        board,
        dice,
        onExplain,
    });

    // Réinitialise le survol de flèche candidate lors d'un changement de position pour éviter tout scintillement
    useEffect(() => {
        onCandidateHover?.(null);
    }, [positionKey, xgid, playedMove, optimalMove, onCandidateHover]);

    const lastAutoTriggeredMoveRef = useRef<string | null>(null);
    useEffect(() => {
        if (!shouldAutoTriggerExplanation(verdict, playedMove, triggerMode, autoThreshold)) return;

        const currentMoveKey = `${positionKey ?? ''}::${playedMove}::${optimalMove}::${verdict}`;
        if (lastAutoTriggeredMoveRef.current === currentMoveKey) return;
        lastAutoTriggeredMoveRef.current = currentMoveKey;

        void executeExplain(true);
    }, [positionKey, verdict, playedMove, optimalMove, triggerMode, autoThreshold, isOffline, executeExplain]);

    function handleExplainClick() {
        manualExplainRef.current = true;
        void executeExplain(false);
    }

    function handleDismissClick() {
        stop();
        soundEngine.stopCoachVoice();
        onCandidateHover?.(null);
        abort();
        onDismiss();
    }

    const currentRawExplanation = cachedExplanation?.rawText || streamedText || explanation;
    const parsed: ParsedExplanation = cachedExplanation || parseStreamedExplanation(currentRawExplanation || '');
    const hasContent = Boolean(currentRawExplanation || isStreaming || cachedExplanation);
    const speechText = parsed.summary || propTacticalSummary || propSummary || parsed.explanation || currentRawExplanation || '';

    const lastSpokenKeyRef = useRef<string | null>(null);
    const manualExplainRef = useRef(false);
    useEffect(() => {
        if (!verdict || isStreaming || !speechText) return;
        if (verdict !== 'blunder' && !manualExplainRef.current) return;
        const spokenKey = `${playedMove}::${optimalMove}::${verdict}::${speechText.slice(0, 60)}`;
        if (lastSpokenKeyRef.current === spokenKey && !manualExplainRef.current) return;
        lastSpokenKeyRef.current = spokenKey;
        manualExplainRef.current = false;
        speak(speechText);
    }, [verdict, isStreaming, speechText, playedMove, optimalMove, speak]);

    function handleReplayVoice() {
        if (!speechText) return;
        speak(speechText, { force: true });
    }

    if (isLoading) {
        return <CoachPanelSkeleton />;
    }

    if (!verdict) return null;

    return (
        <CoachPanelView
            verdict={verdict}
            equityLoss={equityLoss}
            playedMove={playedMove}
            optimalMove={optimalMove}
            parsed={parsed}
            hasContent={hasContent}
            isStreaming={isStreaming}
            streamError={streamError}
            explanationSource={explanationSource}
            performanceRating={performanceRating}
            decisionCounters={decisionCounters}
            candidateRows={candidateRows}
            matchStats={matchStats}
            matchStatsO={matchStatsO}
            tacticalSummary={propTacticalSummary}
            propSummary={propSummary}
            propWhyFailed={propWhyFailed}
            propWhyOptimal={propWhyOptimal}
            onReplayMove={onReplayMove}
            onDismiss={handleDismissClick}
            onExplainClick={handleExplainClick}
            onOpenKnowledgeConcept={onOpenKnowledgeConcept}
            onBlunderClick={onBlunderClick}
            onCandidateHover={onCandidateHover}
            turnsHistory={turnsHistory}
            board={board}
            xgid={xgid}
            candidateMoves={candidateMoves}
            onRolloutCompleted={onRolloutCompleted}
            isVoiceEnabled={isVoiceEnabled}
            isSpeaking={isSpeaking}
            onToggleVoice={toggleVoice}
            onReplayVoice={speechText ? handleReplayVoice : undefined}
            locale={locale}
            labels={buildCoachViewLabels(t)}
        />
    );
}
