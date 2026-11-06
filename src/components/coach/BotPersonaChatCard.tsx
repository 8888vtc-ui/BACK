'use client';

/**
 * Panneau Sobre de Match : Historique des Coups, Observation Tactique & Chat de Courtoisie.
 * Purge intégrale de Sofia, des 4 bots et du jargon "bot" (< 240 lignes, 0 any, React.memo).
 */

import React, { useState } from 'react';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { MatchStats } from '../../hooks/useCoach';
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import type { BotPersonaTurnLike } from '../../features/personas/botPersonas';
import { buildSilentTutorBotLuckExplanation } from '../../features/coach/tacticalExplainer';
import { getBotRealPr } from '../../features/personas/botRealPr';
import { pipCount } from '../../engine/backgammonEngine';

export interface BotPersonaChatCardProps {
    readonly difficulty?: AIDifficulty;
    readonly verdict?: string | null;
    readonly equityLoss?: number | null;
    readonly dice?: [number, number] | null;
    readonly matchStats?: MatchStats | null;
    readonly turnsHistory?: ReadonlyArray<BotPersonaTurnLike>;
    readonly onTriggerCoach?: () => void;
    readonly onReplayMove?: () => void;
    readonly challengerProfile?: PlayerEloProfile | null;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly matchLength?: number;
    readonly board?: number[];
    readonly prX?: number | null;
    readonly onSendQuickChat?: (id: 'gg' | 'nice_move' | 'unlucky' | 'thanks' | 'thinking') => void;
}

interface ChatMessageItem {
    readonly id: string;
    readonly sender: 'player' | 'opp';
    readonly text: string;
}

const QUICK_GREETINGS: ReadonlyArray<{ label: string; reply: string; apiId: 'gg' | 'nice_move' | 'unlucky' | 'thanks' }> = [
    { label: '👋 Bonne partie !', reply: 'Merci, bonne partie à toi !', apiId: 'thanks' },
    { label: '👏 Bien joué !', reply: 'Merci, bien vu !', apiId: 'nice_move' },
    { label: '🎲 Quelle chance !', reply: 'Ah ah, les dés tournent !', apiId: 'unlucky' },
    { label: '🤝 Merci (GG)', reply: 'Merci pour la partie, GG !', apiId: 'gg' },
];

const BotPersonaChatCardComponent: React.FC<BotPersonaChatCardProps> = ({
    difficulty = 'expert',
    matchStats = null,
    turnsHistory = [],
    onTriggerCoach,
    challengerProfile = null,
    scoreX = 0,
    scoreO = 0,
    matchLength = 3,
    board,
    prX = null,
    onSendQuickChat,
}) => {
    const oppName = challengerProfile?.displayName || challengerProfile?.username || (difficulty === 'beginner' ? 'Le Professeur' : 'Adversaire');
    const oppFlag = challengerProfile?.countryFlag || '🌍';
    const oppElo = challengerProfile?.rating ?? 1548;

    const [chatInput, setChatInput] = useState<string>('');
    const [messages, setMessages] = useState<ReadonlyArray<ChatMessageItem>>([]);

    const pips = board && board.length >= 26 ? pipCount(board) : { X: 167, O: 167 };
    const rawTurns = turnsHistory as unknown as ReadonlyArray<{ player: 'X' | 'O'; dice?: readonly number[]; moves?: ReadonlyArray<{ from: number; to: number }> }>;

    const lastOppTurn = [...(turnsHistory ?? [])].reverse().find((t) => t.player === 'O');
    const silentTutorLuckNote = lastOppTurn
        ? buildSilentTutorBotLuckExplanation({
              boardBeforeBotRoll: lastOppTurn.boardBefore,
              boardAfterBotMove: lastOppTurn.boardAfter,
              botPlayer: 'O',
              opponentName: oppName,
          })
        : null;

    const botLivePr = getBotRealPr().pr;
    const oppPr = botLivePr !== null ? botLivePr.toFixed(1) : (typeof challengerProfile?.averagePr === 'number' ? challengerProfile.averagePr.toFixed(1) : '9.8');
    const playerPr = typeof prX === 'number' ? prX.toFixed(1) : (matchStats && matchStats.decisionsCount > 0 ? ((matchStats.totalEquityLoss / matchStats.decisionsCount) * 500).toFixed(1) : '0.0');

    const handleSend = (text: string, replyText?: string, apiId?: 'gg' | 'nice_move' | 'unlucky' | 'thanks') => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setMessages((prev) => [...prev.slice(-6), { id: `p-${Date.now()}`, sender: 'player', text: trimmed }]);
        setChatInput('');
        if (apiId && onSendQuickChat) onSendQuickChat(apiId);

        const rep = replyText || (trimmed.toLowerCase().includes('merci') || trimmed.toLowerCase().includes('gg') ? 'GG, bien joué !' : 'Bien reçu !');
        if (replyText || Math.random() <= 0.35) {
            setTimeout(() => {
                setMessages((prev) => [...prev.slice(-6), { id: `o-${Date.now()}`, sender: 'opp', text: rep }]);
            }, 2000);
        }
    };

    return (
        <div
            data-testid="coach-idle-welcome-card"
            className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 space-y-2.5 shadow-lg text-xs text-slate-300 backdrop-blur-md"
        >
            {/* 1. En-tête sobre de Match */}
            <div className="rounded-xl border border-[#d4af37]/30 bg-[#130e09]/90 p-2.5 shadow">
                <div className="flex items-center justify-between text-xs font-bold text-[#f3c65f]">
                    <span>{oppFlag} {oppName} • Match en {matchLength > 0 ? `${matchLength} pts` : 'Libre'}</span>
                    <span className="text-stone-300 font-mono text-[11px]">Coach prêt • {oppElo} Elo</span>
                </div>
                <div className="mt-1 flex items-center justify-between font-mono text-xs">
                    <span className="font-extrabold text-stone-100">Score : <span className="text-[#f3c65f]">{scoreX}</span> — <span className="text-[#f3c65f]">{scoreO}</span></span>
                    <span className="text-[11px] text-stone-400">Pips : {pips.X} vs {pips.O}</span>
                </div>
            </div>

            {/* 2. Historique des coups du match & Observation tactique */}
            <div className="flex flex-col rounded-xl border border-white/10 bg-black/40 p-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400 mb-1">Historique des Coups</div>
                <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                    {rawTurns.length === 0 ? (
                        <div className="text-stone-500 italic text-[11px]">Début du match...</div>
                    ) : (
                        rawTurns.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between text-stone-300 border-b border-white/5 pb-0.5">
                                <span className={t.player === 'X' ? 'text-amber-200' : 'text-stone-400'}>
                                    #{idx + 1} {t.player === 'X' ? '⚪ Blanc' : `⚫ ${oppName}`} {t.dice ? `(${t.dice[0]}-${t.dice[1]})` : ''}
                                </span>
                                <span className="font-semibold text-stone-200">
                                    {t.moves && t.moves.length > 0 ? t.moves.map((m) => `${m.from}/${m.to}`).join(' ') : '—'}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {silentTutorLuckNote && (
                <div data-testid="coach-silent-tutor-bot-luck" className="rounded-xl border border-cyan-500/40 bg-cyan-950/35 px-2.5 py-1.5 text-xs font-semibold text-cyan-200">
                    💡 {silentTutorLuckNote}
                </div>
            )}

            {/* 3. Chat de Match sobre (4 salutations + fil + saisie) */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-black/40 p-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-stone-400">Chat de Match</div>
                {messages.length > 0 && (
                    <div data-testid="persona-chat-feed" className="max-h-24 overflow-y-auto space-y-1 text-xs mb-1">
                        {messages.map((m) => (
                            <div key={m.id} className={`flex flex-col ${m.sender === 'player' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-lg px-2.5 py-1 text-xs leading-relaxed ${m.sender === 'player' ? 'bg-amber-400/15 text-amber-100 border border-amber-400/30' : 'bg-slate-800 text-stone-200 border border-white/10'}`}>
                                    <span className="font-bold text-amber-300">{m.sender === 'player' ? 'Vous : ' : `${oppName} : `}</span>
                                    <span>{m.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="grid grid-cols-2 gap-1">
                    {QUICK_GREETINGS.map((g) => (
                        <button key={g.label} type="button" onClick={() => handleSend(g.label, g.reply, g.apiId)} className="rounded border border-white/10 bg-slate-800/80 px-1.5 py-1 text-left text-[11px] font-medium text-stone-300 hover:border-[#d4af37]/50 hover:bg-slate-700 hover:text-white transition">
                            {g.label}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSend(chatInput); }} className="flex gap-1.5">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Envoyer un message à ${oppName}...`}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button type="submit" className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/25">
                    Envoyer
                </button>
            </form>

            {/* 4. Pied du panneau : Vous PR • Opponent PR • Blunders */}
            <div data-testid="coach-idle-session-stats" className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 font-mono text-xs shadow-inner">
                <span className="text-white font-bold">Vous : PR {playerPr}</span>
                <span data-testid="persona-live-pr-badge" className="text-amber-300 font-bold">
                    {oppName} : PR {oppPr}
                </span>
                <span className="text-rose-300 font-bold">{matchStats?.blundersCount ?? 0} blunder{(matchStats?.blundersCount ?? 0) > 1 ? 's' : ''}</span>
            </div>

            {onTriggerCoach && (
                <button type="button" onClick={onTriggerCoach} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:brightness-105 transition active:scale-95">
                    <span aria-hidden="true">💡</span>
                    <span>Demander conseil au Coach</span>
                </button>
            )}
        </div>
    );
};

export const BotPersonaChatCard = React.memo(BotPersonaChatCardComponent);
export default BotPersonaChatCard;
