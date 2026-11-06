'use client';

/**
 * Panneau latéral du Coach (≥ lg) — version épurée TMG / Snowie avec Radar Temps Réel IA (< 295 lignes, 0 any).
 */

import React, { useState } from 'react';
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
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import { pipCount } from '../../engine/backgammonEngine';

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
    isOnlinePvpMatch?: boolean;
    challengerProfile?: PlayerEloProfile | null;
    onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
    scoreX?: number;
    scoreO?: number;
    matchLength?: number;
    prX?: number | null;
    prO?: number | null;
}

interface ChatMsg {
    id: string;
    sender: 'you' | 'opp';
    text: string;
}

const QUICK_ACTIONS: ReadonlyArray<{ id: string; label: string; reply: string; apiId: 'gg' | 'nice_move' | 'unlucky' | 'thanks' }> = [
    { id: 'hello', label: '👋 Salut, bonne partie !', reply: 'Salut ! Bonne partie à toi.', apiId: 'thanks' },
    { id: 'nice_move', label: '👏 Bien joué !', reply: 'Merci ! Bien vu.', apiId: 'nice_move' },
    { id: 'unlucky', label: '🎲 Quelle chance !', reply: 'Ah ah, les dés tournent !', apiId: 'unlucky' },
    { id: 'gg', label: '🤝 Merci pour la partie (GG)', reply: 'Merci pour la partie, GG !', apiId: 'gg' },
];

const OnlineMatchSidebarCard: React.FC<{
    matchLength?: number;
    scoreX?: number;
    scoreO?: number;
    board?: number[];
    turnsHistory?: unknown[];
    challengerProfile?: PlayerEloProfile | null;
    matchStats?: MatchStats | null;
    prX?: number | null;
    onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
    onTriggerCoach?: () => void;
}> = ({ matchLength = 5, scoreX = 0, scoreO = 0, board, turnsHistory = [], challengerProfile, matchStats, prX, onSendQuickChat, onTriggerCoach }) => {
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const pips = board && board.length >= 26 ? pipCount(board) : { X: 167, O: 167 };
    const oppName = challengerProfile?.displayName || challengerProfile?.username || 'Adversaire';
    const oppElo = challengerProfile?.rating ?? 1550;
    const oppFlag = challengerProfile?.countryFlag || '🌍';
    const playerPr = typeof prX === 'number' ? prX.toFixed(1) : (matchStats && matchStats.decisionsCount > 0 ? ((matchStats.totalEquityLoss / matchStats.decisionsCount) * 500).toFixed(1) : '—');
    const rawTurns = turnsHistory as ReadonlyArray<{ player: 'X' | 'O'; dice?: [number, number]; moves?: Array<{ from: number; to: number }> }>;

    const handleSend = (action: typeof QUICK_ACTIONS[number]) => {
        setMessages((prev) => [...prev, { id: `u_${Date.now()}`, sender: 'you', text: action.label }]);
        onSendQuickChat?.(action.apiId);
        if (Math.random() < 0.3) {
            setTimeout(() => {
                setMessages((prev) => [...prev, { id: `o_${Date.now()}`, sender: 'opp', text: action.reply }]);
            }, 2200);
        }
    };

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-900/80 p-3 text-white">
            <div className="rounded-lg border border-[#d4af37]/30 bg-[#130e09]/90 p-2.5 shadow">
                <div className="flex items-center justify-between text-xs font-bold text-[#f3c65f]">
                    <span>Match en {matchLength > 0 ? `${matchLength} points` : 'Libre'}</span>
                    <span className="text-stone-300 font-mono text-[11px]">Cadence Club (10:00 +8s)</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-sm">
                    <span className="font-extrabold text-stone-100">Score : <span className="text-[#f3c65f]">{scoreX}</span> — <span className="text-[#f3c65f]">{scoreO}</span></span>
                    <span className="text-[11px] text-stone-400">Pips : {pips.X} vs {pips.O}</span>
                </div>
            </div>
            <div className="flex flex-col rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">Historique des Coups</div>
                <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                    {rawTurns.length === 0 ? (
                        <div className="text-stone-500 italic text-[11px]">Début du match...</div>
                    ) : (
                        rawTurns.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between text-stone-300 border-b border-white/5 pb-0.5">
                                <span className={t.player === 'X' ? 'text-amber-200' : 'text-stone-400'}>
                                    #{idx + 1} {t.player === 'X' ? '⚪ Blanc' : '⚫ Noir'} {t.dice ? `(${t.dice[0]}-${t.dice[1]})` : ''}
                                </span>
                                <span className="font-semibold text-stone-200">
                                    {t.moves && t.moves.length > 0 ? t.moves.map((m) => `${m.from}/${m.to}`).join(' ') : '—'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-black/40 p-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Chat de Match</div>
                {messages.length > 0 && (
                    <div className="max-h-20 overflow-y-auto space-y-1 text-xs mb-1">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'you' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-lg px-2 py-1 text-xs ${m.sender === 'you' ? 'bg-[#d4af37]/20 text-[#f7f3e8] border border-[#d4af37]/30' : 'bg-slate-800 text-stone-200 border border-white/10'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-1">
                    {QUICK_ACTIONS.map((qa) => (
                        <button key={qa.id} type="button" onClick={() => handleSend(qa)} className="rounded border border-white/10 bg-slate-800/80 px-1.5 py-1 text-left text-[11px] font-medium text-stone-300 hover:border-[#d4af37]/50 hover:bg-slate-700 hover:text-white transition">
                            {qa.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/60 px-2.5 py-1.5 text-xs font-mono">
                <span className="text-stone-300">Vous : <span className="text-[#f3c65f] font-bold">PR {playerPr}</span></span>
                <span className="text-stone-300 font-bold">{oppFlag} {oppName} <span className="text-[#f3c65f]">({oppElo} Elo)</span></span>
            </div>
            {onTriggerCoach && (
                <button type="button" onClick={onTriggerCoach} className="w-full rounded-xl border border-[#d4af37]/50 bg-gradient-to-r from-[#d4af37]/20 via-[#f3c65f]/30 to-[#d4af37]/20 py-2 text-xs font-extrabold uppercase tracking-wider text-[#f7f3e8] hover:border-[#d4af37] shadow transition">
                    💡 Demander conseil au Coach
                </button>
            )}
        </div>
    );
};

const CoachSidebarComponent: React.FC<CoachSidebarProps> = ({
    coach, isAnalyzing, onDismiss, onReplayMove, onOpenKnowledgeConcept, onTriggerCoach,
    matchStats, matchStatsO, locale = 'fr', matchContext, positionKey, gameId, dice, board,
    onBlunderClick, onCandidateHover, turnsHistory, coachHistory = [], selectedCoachHistoryIndex = null,
    difficulty = 'expert', isOnlinePvpMatch = false, challengerProfile = null, onSendQuickChat,
    scoreX = 0, scoreO = 0, matchLength = 5, prX = null, prO = null,
}) => {
    const { isVoiceEnabled, isSpeaking, toggleVoice, stop } = useCoachVoice();
    const isOnline = Boolean(isOnlinePvpMatch || challengerProfile);
    const activeCoach = selectedCoachHistoryIndex !== null && coachHistory[selectedCoachHistoryIndex]
        ? coachHistory[selectedCoachHistoryIndex].coachState
        : coach;

    const handleDismiss = () => { stop(); onDismiss(); };

    return (
        <aside id="coach-panel" className="flex flex-col w-full h-full max-h-full min-w-0 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] transition-all">
            {!activeCoach?.verdict && !isAnalyzing && (
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/90 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                        <h2 className="font-sans text-sm font-bold text-white tracking-tight">{isOnline ? 'Match en Ligne' : 'Coach IA & Analyse'}</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {!isOnline && (
                            <button type="button" onClick={toggleVoice} data-testid="coach-voice-toggle-btn" aria-pressed={isVoiceEnabled} aria-label={isVoiceEnabled ? 'Voix Coach' : 'Voix muette'} title={isVoiceEnabled ? 'Désactiver la voix du Coach' : 'Activer la voix du Coach'} className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-bold transition active:scale-95 ${isVoiceEnabled ? 'border-amber-400/60 bg-amber-400/15 text-amber-300' : 'border-white/10 bg-slate-950 text-slate-400 hover:border-white/25 hover:text-slate-200'}`}>
                                <span>{isVoiceEnabled ? '🔊 Voix Coach' : '🔇 Voix muette'}</span>
                                {isSpeaking && <span data-testid="coach-voice-wave" aria-hidden="true" className="inline-flex items-end gap-0.5 h-2.5 ml-0.5 animate-pulse"><span className="w-0.5 h-1.5 bg-amber-400 rounded-full animate-pulse" /><span className="w-0.5 h-2.5 bg-amber-400 rounded-full animate-pulse" /><span className="w-0.5 h-1 bg-amber-400 rounded-full animate-pulse" /></span>}
                            </button>
                        )}
                        <button type="button" onClick={handleDismiss} className="rounded-lg border border-white/10 bg-slate-950 px-2 py-0.5 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:text-white transition" title="Fermer l'analyse">
                            Fermer ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="p-2 overflow-y-auto flex-1 space-y-2">
                <ErrorBoundary name="Analyse du Coach">
                    <CoachPanel verdict={activeCoach?.verdict ?? null} equityLoss={activeCoach?.equityLoss ?? null} playedMove={activeCoach?.playedMove ?? null} optimalMove={activeCoach?.optimalMove ?? null} explanation={activeCoach?.explanation ?? null} whyFailed={activeCoach?.whyFailed} whyOptimal={activeCoach?.whyOptimal} summary={activeCoach?.summary} tacticalSummary={activeCoach?.tacticalSummary} features={activeCoach?.features} matchStats={matchStats ?? undefined} matchStatsO={matchStatsO ?? undefined} topMoves={activeCoach?.candidateMoves} boardBefore={activeCoach?.boardBefore} onReplayMove={onReplayMove} onDismiss={onDismiss} onOpenKnowledgeConcept={onOpenKnowledgeConcept} isLoading={isAnalyzing} matchContext={matchContext ?? undefined} positionKey={positionKey} gameId={gameId} dice={dice} board={board} onBlunderClick={onBlunderClick} onCandidateHover={onCandidateHover} turnsHistory={turnsHistory as CoachPanelProps['turnsHistory']} />
                </ErrorBoundary>

                {!isAnalyzing && (
                    isOnline ? (
                        <OnlineMatchSidebarCard matchLength={matchLength} scoreX={scoreX} scoreO={scoreO} board={board} turnsHistory={turnsHistory} challengerProfile={challengerProfile} matchStats={matchStats} prX={prX} onSendQuickChat={onSendQuickChat} onTriggerCoach={!activeCoach ? onTriggerCoach : undefined} />
                    ) : (
                        <>
                            {!activeCoach?.verdict && <CoachLiveAiRadar board={board} matchContext={matchContext} verdict={activeCoach?.verdict} equityLoss={activeCoach?.equityLoss} locale={locale} />}
                            <BotPersonaChatCard difficulty={difficulty} verdict={activeCoach?.verdict ?? null} equityLoss={activeCoach?.equityLoss ?? null} dice={dice} matchStats={matchStats} turnsHistory={turnsHistory as ReadonlyArray<BotPersonaTurnLike> | undefined} onTriggerCoach={!activeCoach ? onTriggerCoach : undefined} onReplayMove={onReplayMove} />
                        </>
                    )
                )}
            </div>
        </aside>
    );
};

export const CoachSidebar = React.memo(CoachSidebarComponent);
export default CoachSidebar;
