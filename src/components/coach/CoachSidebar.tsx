'use client';

/**
 * Panneau latéral du Coach (≥ lg) — version épurée TMG / Snowie avec Radar Temps Réel IA (< 275 lignes, 0 any).
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import CoachPanel, { type CoachPanelProps } from './CoachPanel';
import CoachLiveAiRadar from './CoachLiveAiRadar';
import BotPersonaChatCard from './BotPersonaChatCard';
import ErrorBoundary from '../common/ErrorBoundary';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import type { CoachAnalysisHistoryEntry, CoachState, MatchStats } from '../../hooks/useCoach';
import type { MatchContext, BuildMatchContextParams } from '../../features/coach/matchContext';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { BotPersonaTurnLike } from '../../features/personas/botPersonas';

export interface CoachSidebarProps {
    coach: CoachState | null;
    isAnalyzing: boolean;
    onDismiss: () => void;
    onReplayMove?: () => void;
    onOpenKnowledgeConcept?: (conceptId: string) => void;
    onTriggerCoach?: () => void;
    theme: ThemeName;
    matchStats?: MatchStats | null;
    matchStatsO?: MatchStats | null;
    locale?: string;
    matchContext?: MatchContext | Partial<BuildMatchContextParams> | null;
    positionKey?: string;
    gameId?: string;
    dice?: [number, number] | null;
    board?: number[];
    turnsHistory?: unknown[];
    coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    selectedCoachHistoryIndex?: number | null;
    onSelectCoachHistoryIndex?: (index: number | null) => void;
    previewBoardMode?: 'live' | 'before' | 'after';
    onSetPreviewBoardMode?: (mode: 'live' | 'before' | 'after') => void;
    onBlunderClick?: () => void;
    onCandidateHover?: (notation: string | null) => void;
    difficulty?: AIDifficulty;
}

const CoachSidebarComponent: React.FC<CoachSidebarProps> = ({
    coach,
    isAnalyzing,
    onDismiss,
    onReplayMove,
    onOpenKnowledgeConcept,
    onTriggerCoach,
    matchStats,
    matchStatsO,
    locale = 'fr',
    matchContext,
    positionKey,
    gameId,
    dice,
    board,
    onBlunderClick,
    onCandidateHover,
    turnsHistory,
    coachHistory = [],
    selectedCoachHistoryIndex = null,
    difficulty = 'expert',
}) => {
    const { isVoiceEnabled, isSpeaking, toggleVoice, stop } = useCoachVoice();
    const activeCoach =
        selectedCoachHistoryIndex !== null && coachHistory[selectedCoachHistoryIndex]
            ? coachHistory[selectedCoachHistoryIndex].coachState
            : coach;

    const handleDismiss = () => {
        stop();
        onDismiss();
    };

    return (
        <aside
            id="coach-panel"
            className="flex flex-col w-full h-full max-h-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] transition-all"
        >
            {!activeCoach?.verdict && !isAnalyzing && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/90 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                        <h2 className="font-sans text-sm font-bold text-white tracking-tight">Coach IA &amp; Analyse</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={toggleVoice}
                            data-testid="coach-voice-toggle-btn"
                            aria-pressed={isVoiceEnabled}
                            aria-label={isVoiceEnabled ? 'Voix Coach' : 'Voix muette'}
                            title={isVoiceEnabled ? 'Désactiver la voix du Coach' : 'Activer la voix du Coach'}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-bold transition active:scale-95 ${
                                isVoiceEnabled
                                    ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                                    : 'border-white/10 bg-slate-950 text-slate-400 hover:border-white/25 hover:text-slate-200'
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
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="rounded-lg border border-white/10 bg-slate-950 px-2 py-0.5 text-[11px] font-bold text-slate-300 hover:border-amber-400/50 hover:text-white transition"
                            title="Fermer l'analyse"
                        >
                            Fermer ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="p-2 overflow-y-auto flex-1 space-y-2">
                <ErrorBoundary name="Analyse du Coach">
                    <CoachPanel
                        verdict={activeCoach?.verdict ?? null}
                        equityLoss={activeCoach?.equityLoss ?? null}
                        playedMove={activeCoach?.playedMove ?? null}
                        optimalMove={activeCoach?.optimalMove ?? null}
                        explanation={activeCoach?.explanation ?? null}
                        whyFailed={activeCoach?.whyFailed}
                        whyOptimal={activeCoach?.whyOptimal}
                        summary={activeCoach?.summary}
                        tacticalSummary={activeCoach?.tacticalSummary}
                        features={activeCoach?.features}
                        matchStats={matchStats ?? undefined}
                        matchStatsO={matchStatsO ?? undefined}
                        topMoves={activeCoach?.candidateMoves}
                        boardBefore={activeCoach?.boardBefore}
                        onReplayMove={onReplayMove}
                        onDismiss={onDismiss}
                        onOpenKnowledgeConcept={onOpenKnowledgeConcept}
                        isLoading={isAnalyzing}
                        matchContext={matchContext ?? undefined}
                        positionKey={positionKey}
                        gameId={gameId}
                        dice={dice}
                        board={board}
                        onBlunderClick={onBlunderClick}
                        onCandidateHover={onCandidateHover}
                        turnsHistory={turnsHistory as CoachPanelProps['turnsHistory']}
                    />
                </ErrorBoundary>

                {!activeCoach?.verdict && !isAnalyzing && (
                    <CoachLiveAiRadar
                        board={board}
                        matchContext={matchContext}
                        verdict={activeCoach?.verdict}
                        equityLoss={activeCoach?.equityLoss}
                        locale={locale}
                    />
                )}

                {!isAnalyzing && (
                    <BotPersonaChatCard
                        difficulty={difficulty}
                        verdict={activeCoach?.verdict ?? null}
                        equityLoss={activeCoach?.equityLoss ?? null}
                        dice={dice}
                        matchStats={matchStats}
                        turnsHistory={turnsHistory as ReadonlyArray<BotPersonaTurnLike> | undefined}
                        onTriggerCoach={!activeCoach ? onTriggerCoach : undefined}
                        onReplayMove={onReplayMove}
                    />
                )}
            </div>
        </aside>
    );
};

export const CoachSidebar = React.memo(CoachSidebarComponent);
export default CoachSidebar;
