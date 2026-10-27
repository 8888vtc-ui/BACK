'use client';

/**
 * Panneau latéral du Coach (≥ lg) — version épurée TMG / Snowie avec Radar Temps Réel IA (< 275 lignes, 0 any).
 */

import React from 'react';
import type { ThemeName } from '../board/boardThemes';
import CoachPanel, { type CoachPanelProps } from './CoachPanel';
import CoachLiveAiRadar from './CoachLiveAiRadar';
import ErrorBoundary from '../common/ErrorBoundary';
import { useCoachVoice } from '../../hooks/useCoachVoice';
import type { CoachAnalysisHistoryEntry, CoachState, MatchStats } from '../../hooks/useCoach';
import type { MatchContext, BuildMatchContextParams } from '../../features/coach/matchContext';

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
            className="flex flex-col w-full h-full max-h-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-[#d4af37]/50 bg-gradient-to-b from-[#17110b]/98 via-[#0d111a]/98 to-[#07090f]/98 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,245,205,0.22)] transition-all"
        >
            {!activeCoach?.verdict && !isAnalyzing && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d4af37]/25 bg-gradient-to-r from-[#24160b]/90 via-[#150e08]/90 to-[#1e1309]/90 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-[#f3c65f] shadow-[0_0_8px_rgba(243,198,95,0.9)] animate-pulse" />
                        <h2 className="font-serif text-sm font-bold text-[#fdf8eb] tracking-wide">Coach IA &amp; Analyse</h2>
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
                                    ? 'border-[#f3c65f]/70 bg-[#2a1c0b]/90 text-[#fce8b2]'
                                    : 'border-[#d4af37]/30 bg-black/40 text-slate-400 hover:border-[#f3c65f]/50 hover:text-slate-200'
                            }`}
                        >
                            <span>{isVoiceEnabled ? '🔊 Voix Coach' : '🔇 Voix muette'}</span>
                            {isSpeaking && (
                                <span data-testid="coach-voice-wave" aria-hidden="true" className="inline-flex items-end gap-0.5 h-2.5 ml-0.5 animate-pulse">
                                    <span className="w-0.5 h-1.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-2.5 bg-[#f3c65f] rounded-full animate-pulse" />
                                    <span className="w-0.5 h-1 bg-[#f3c65f] rounded-full animate-pulse" />
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="rounded-lg border border-[#d4af37]/30 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-amber-200/80 hover:border-[#f3c65f] hover:text-white transition"
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

                {!activeCoach && !isAnalyzing && (
                    <div
                        data-testid="coach-idle-welcome-card"
                        className="rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#18110b]/95 via-[#0e131e]/95 to-[#080b12]/95 p-4 space-y-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,245,205,0.18)] text-xs text-slate-300 backdrop-blur-md"
                    >
                        <div className="flex items-center justify-between border-b border-[#d4af37]/20 pb-2.5">
                            <div className="flex flex-col">
                                <span className="font-serif font-bold text-sm tracking-wide bg-gradient-to-r from-[#fff5cf] via-[#f3c65f] to-[#d4af37] bg-clip-text text-transparent">
                                    Cercle Monte-Carlo
                                </span>
                                <span className="text-[11px] font-medium text-amber-200/80">
                                    Coach prêt · Grand-Maître
                                </span>
                            </div>
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#24190b] border border-[#d4af37]/45 text-[#f3c65f] font-mono font-bold tracking-tight shadow-inner">
                                Monte-Carlo 3-Ply
                            </span>
                        </div>

                        {/* Piliers d'analyse horlogère */}
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="rounded-lg border border-[#d4af37]/20 bg-black/45 px-1.5 py-1.5 flex flex-col items-center gap-0.5 shadow-inner">
                                <span aria-hidden="true" className="text-xs">♟️</span>
                                <span className="font-mono text-[10px] font-bold text-amber-100">Pip count</span>
                                <span className="text-[9px] text-slate-400">Course &amp; EPC</span>
                            </div>
                            <div className="rounded-lg border border-[#d4af37]/20 bg-black/45 px-1.5 py-1.5 flex flex-col items-center gap-0.5 shadow-inner">
                                <span aria-hidden="true" className="text-xs">📐</span>
                                <span className="font-mono text-[10px] font-bold text-amber-100">Plan de jeu</span>
                                <span className="text-[9px] text-slate-400">Prime &amp; Blitz</span>
                            </div>
                            <div className="rounded-lg border border-[#d4af37]/20 bg-black/45 px-1.5 py-1.5 flex flex-col items-center gap-0.5 shadow-inner">
                                <span aria-hidden="true" className="text-xs">📜</span>
                                <span className="font-mono text-[10px] font-bold text-amber-100">Historique</span>
                                <span className="text-[9px] text-slate-400">Replay tours</span>
                            </div>
                        </div>

                        {matchStats && matchStats.decisionsCount > 0 && (
                            <div data-testid="coach-idle-session-stats" className="flex items-center justify-between rounded-xl border border-[#d4af37]/25 bg-black/60 px-3 py-2 font-mono text-[11px] shadow-inner">
                                <span className="text-[#fdf8eb] font-bold">
                                    PR {((matchStats.totalEquityLoss / matchStats.decisionsCount) * 500).toFixed(1)}
                                </span>
                                <span className="text-slate-400">
                                    {matchStats.decisionsCount} décision{matchStats.decisionsCount > 1 ? 's' : ''}
                                </span>
                                <span className="text-rose-300 font-bold">
                                    {matchStats.blundersCount} blunder{matchStats.blundersCount > 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        <p className="text-slate-300/90 leading-relaxed text-[11px]">
                            Le Coach Monte-Carlo évalue vos coups, pions et décisions de videau en temps réel avec la précision d&apos;un Grand-Maître.
                        </p>

                        {onTriggerCoach && (
                            <button
                                type="button"
                                onClick={onTriggerCoach}
                                className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl border border-[#fef08a]/75 bg-gradient-to-b from-[#fff5cf] via-[#f0c75e] to-[#b87e14] px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#1c1004] shadow-[0_6px_18px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.8)] hover:brightness-105 transition active:scale-95"
                            >
                                <span aria-hidden="true">🎓</span>
                                <span>Demander conseil au Coach</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
};

export const CoachSidebar = React.memo(CoachSidebarComponent);
export default CoachSidebar;
