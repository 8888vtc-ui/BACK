'use client';

/**
 * Carte Interactive des 4 Bots Personnifiés & Mode Adaptatif (« UI Caméléon » : S'amuser vs Pro).
 * Style Dark Slate 2026 (< 260 lignes, 0 any, React.memo).
 */

import React, { useEffect, useState } from 'react';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import type { MatchStats } from '../../hooks/useCoach';
import {
    BOT_PERSONAS_BY_DIFFICULTY,
    computeRealtimeBotErrorRate,
    generateBotChatReply,
    getBotPersona,
    MAX_BOT_DISPLAY_PR,
    readStoredExperienceMode,
    storeExperienceMode,
    type BotPersonaTurnLike,
    type ExperienceMode,
} from '../../features/personas/botPersonas';
import { buildSilentTutorBotLuckExplanation } from '../../features/coach/tacticalExplainer';

export interface BotPersonaChatCardProps {
    readonly difficulty?: AIDifficulty;
    readonly verdict?: string | null;
    readonly equityLoss?: number | null;
    readonly dice?: [number, number] | null;
    readonly matchStats?: MatchStats | null;
    readonly turnsHistory?: ReadonlyArray<BotPersonaTurnLike>;
    readonly onTriggerCoach?: () => void;
    readonly onReplayMove?: () => void;
}

interface ChatMessageItem {
    readonly id: string;
    readonly sender: 'bot' | 'player';
    readonly text: string;
}

const PERSONA_KEYS: ReadonlyArray<AIDifficulty> = ['beginner', 'intermediate', 'expert', 'grandmaster'];

const BotPersonaChatCardComponent: React.FC<BotPersonaChatCardProps> = ({
    difficulty = 'expert',
    verdict = null,
    equityLoss = null,
    dice = null,
    matchStats = null,
    turnsHistory,
    onTriggerCoach,
    onReplayMove,
}) => {
    const [activePersonaId, setActivePersonaId] = useState<AIDifficulty>(difficulty);
    const [mode, setMode] = useState<ExperienceMode>(() => readStoredExperienceMode());
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [reportedNotice, setReportedNotice] = useState<boolean>(false);
    const [chatInput, setChatInput] = useState<string>('');
    const [messages, setMessages] = useState<ReadonlyArray<ChatMessageItem>>([]);

    const persona = getBotPersona(activePersonaId);
    const prValue =
        matchStats && matchStats.decisionsCount > 0
            ? (matchStats.totalEquityLoss / matchStats.decisionsCount) * 500
            : 0.0;
    const botLivePr = computeRealtimeBotErrorRate(turnsHistory, activePersonaId);
    const lastBotTurn = [...(turnsHistory ?? [])].reverse().find((t) => t.player === 'O');
    const silentTutorLuckNote = lastBotTurn
        ? buildSilentTutorBotLuckExplanation({
              boardBeforeBotRoll: lastBotTurn.boardBefore,
              boardAfterBotMove: lastBotTurn.boardAfter,
              botPlayer: 'O',
          })
        : null;

    useEffect(() => {
        setActivePersonaId(difficulty);
    }, [difficulty]);

    useEffect(() => {
        const currentPersona = getBotPersona(activePersonaId);
        setMessages([{ id: `open-${activePersonaId}-${mode}`, sender: 'bot', text: currentPersona.dialogues.opening[mode] }]);
    }, [activePersonaId, mode]);

    useEffect(() => {
        if (isMuted || !dice || dice[0] !== dice[1]) return;
        const reaction = getBotPersona(activePersonaId).dialogues.playerDoubleRoll[mode];
        setMessages((prev) => [...prev.slice(-6), { id: `roll-${Date.now()}`, sender: 'bot', text: `[Double ${dice[0]}-${dice[1]}] ${reaction}` }]);
    }, [dice, activePersonaId, mode, isMuted]);

    useEffect(() => {
        if (isMuted || !verdict) return;
        const currentPersona = getBotPersona(activePersonaId);
        const isBlunder = verdict === 'blunder' || verdict === 'error' || Math.abs(equityLoss ?? 0) >= 0.08;
        const text = isBlunder ? currentPersona.dialogues.playerBlunder[mode] : currentPersona.dialogues.playerOptimal[mode];
        setMessages((prev) => [...prev.slice(-6), { id: `verdict-${Date.now()}`, sender: 'bot', text }]);
    }, [verdict, equityLoss, activePersonaId, mode, isMuted]);

    const handleSwitchMode = (nextMode: ExperienceMode) => {
        setMode(nextMode);
        storeExperienceMode(nextMode);
    };

    const handleSendMessage = (rawText: string) => {
        const trimmed = rawText.trim();
        if (!trimmed) return;
        const reply = generateBotChatReply(trimmed, activePersonaId, mode, prValue);
        setMessages((prev) => [
            ...prev.slice(-6),
            { id: `u-${Date.now()}`, sender: 'player', text: trimmed },
            ...(isMuted ? [] : [{ id: `b-${Date.now() + 1}`, sender: 'bot' as const, text: reply.text }]),
        ]);
        setChatInput('');
    };

    return (
        <div
            data-testid="coach-idle-welcome-card"
            className="rounded-2xl border border-white/10 bg-slate-900/90 p-3 space-y-2.5 shadow-lg text-xs text-slate-300 backdrop-blur-md"
        >
            {/* 1. Bascule d'Interface Caméléon : S'amuser (Débutant) ↔ Pro (Perfectionnement) */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex flex-col">
                    <span className="font-sans font-bold text-xs tracking-tight text-white">
                        Cercle Monte-Carlo · Coach prêt
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                        {mode === 'fun'
                            ? 'Mode Ludique · Pip count · Plan de jeu · Historique'
                            : 'Mode Pro · Pip count · Plan de jeu · Historique'}
                    </span>
                </div>

                <div className="inline-flex rounded-xl border border-white/10 bg-slate-950 p-0.5">
                    {(['fun', 'pro'] as const).map((mKey) => (
                        <button
                            key={mKey}
                            type="button"
                            data-testid={`experience-mode-${mKey}-btn`}
                            aria-pressed={mode === mKey}
                            onClick={() => handleSwitchMode(mKey)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                                mode === mKey ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
                            }`}
                        >
                            {mKey === 'fun' ? '🎭 S’amuser' : '🏆 Pro EMG'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Sélecteur rapide des 4 Archétypes Personnifiés */}
            <div className="grid grid-cols-4 gap-1" role="group" aria-label="Choisir la personnalité du Bot">
                {PERSONA_KEYS.map((key) => {
                    const p = BOT_PERSONAS_BY_DIFFICULTY[key];
                    const active = key === activePersonaId;
                    return (
                        <button
                            key={key}
                            type="button"
                            data-testid={`persona-tab-${key}`}
                            aria-pressed={active}
                            onClick={() => setActivePersonaId(key)}
                            className={`flex flex-col items-center rounded-xl border px-1.5 py-1.5 text-center transition ${
                                active
                                    ? 'border-amber-400 bg-amber-400/15 text-white'
                                    : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/25 hover:text-slate-200'
                            }`}
                        >
                            <span className="text-base leading-none">{p.avatar}</span>
                            <span className="mt-1 w-full truncate text-[10px] font-bold">{p.shortName}</span>
                            <span className="mt-0.5 font-mono text-[10px] text-amber-300">PR {Math.min(MAX_BOT_DISPLAY_PR, p.targetErrorRate).toFixed(1)}</span>
                        </button>
                    );
                })}
            </div>

            {/* 3. Carte d'identité du Bot actif + Garde-fous App Store 1.2 (Muet / Signaler) */}
            <div className="rounded-xl border border-white/10 bg-slate-950/75 p-2.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-xl">
                            {persona.avatar}
                        </span>
                        <div>
                            <div className="font-sans text-xs font-bold text-white">{persona.name}</div>
                            <div className="text-[10px] font-semibold text-amber-300">{persona.styleBadge}</div>
                            <div className="text-[10px] text-slate-400">🎯 {persona.skillTaught}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            data-testid="persona-mute-btn"
                            onClick={() => setIsMuted((m) => !m)}
                            className="rounded-lg border border-white/10 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-slate-300 hover:border-white/25"
                            title="Mettre le personnage en muet"
                        >
                            {isMuted ? '🔇 Muet' : '🔊 Actif'}
                        </button>
                        <button
                            type="button"
                            data-testid="persona-report-btn"
                            onClick={() => setReportedNotice(true)}
                            className="rounded-lg border border-white/10 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-slate-300 hover:border-rose-400/50 hover:text-rose-300"
                            title="Signaler un message (Conformité App Store 1.2)"
                        >
                            🚩
                        </button>
                    </div>
                </div>
                {reportedNotice && (
                    <p className="mt-1.5 rounded bg-emerald-950/70 px-2 py-1 text-[10px] text-emerald-200">
                        ✓ Signalement enregistré (Conformité App Store Section 1.2).
                    </p>
                )}
            </div>

            {silentTutorLuckNote && (
                <div data-testid="coach-silent-tutor-bot-luck" className="rounded-xl border border-cyan-500/40 bg-cyan-950/35 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-200">
                    🛡️ {silentTutorLuckNote}
                </div>
            )}

            {/* 4. Fil de discussion vivant avec le Bot */}
            <div
                data-testid="persona-chat-feed"
                className="max-h-32 overflow-y-auto space-y-1.5 rounded-xl border border-white/10 bg-slate-950/60 p-2"
            >
                {messages.map((m) => (
                    <div
                        key={m.id}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                            m.sender === 'player'
                                ? 'ml-6 bg-amber-400/15 text-amber-100 border border-amber-400/30'
                                : 'mr-2 bg-slate-900 text-slate-200 border border-white/10'
                        }`}
                    >
                        <span className="font-bold text-amber-300">
                            {m.sender === 'player' ? 'Vous : ' : `${persona.shortName} : `}
                        </span>
                        <span>{m.text}</span>
                    </div>
                ))}

                {mode === 'fun' && onReplayMove && equityLoss && Math.abs(equityLoss) >= 0.08 && (
                    <button
                        type="button"
                        onClick={onReplayMove}
                        className="mt-1 w-full rounded-lg border border-amber-400/60 bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 transition"
                    >
                        ↩️ Reprendre mon coup (Tuteur Préventif)
                    </button>
                )}
            </div>

            {/* 5. Réponses rapides & saisie libre */}
            <div className="flex flex-wrap gap-1">
                {[
                    ['💡 Un conseil ?', 'Que me conseilles-tu pour jouer ?'],
                    ['🎲 Dés truqués ?', 'Ces dés sont-ils truqués ?'],
                    ['💎 Videau ?', 'Quand doubler au Videau ?'],
                ].map(([label, prompt]) => (
                    <button key={label} type="button" onClick={() => handleSendMessage(prompt)} className="rounded-full border border-white/10 bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-amber-400/50 hover:text-white">
                        {label}
                    </button>
                ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(chatInput); }} className="flex gap-1.5">
                <input
                    type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Parler à ${persona.shortName}...`}
                    className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                />
                <button type="submit" className="rounded-lg border border-amber-400/50 bg-amber-400/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-400/25">
                    Envoyer
                </button>
            </form>

            <div data-testid="coach-idle-session-stats" className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 font-mono text-[11px] shadow-inner">
                <span className="text-white font-bold">Vous : PR {prValue.toFixed(1)}</span>
                <span data-testid="persona-live-pr-badge" className="text-amber-300 font-bold" title="Error Rate temps réel du Bot (plafonné à 10.0)">
                    Bot : PR {botLivePr.toFixed(1)}
                </span>
                <span className="text-rose-300 font-bold">{matchStats?.blundersCount ?? 0} blunder{(matchStats?.blundersCount ?? 0) > 1 ? 's' : ''}</span>
            </div>

            {onTriggerCoach && (
                <button type="button" onClick={onTriggerCoach} className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:brightness-105 transition active:scale-95">
                    <span aria-hidden="true">🎓</span>
                    <span>Demander conseil au Coach</span>
                </button>
            )}
        </div>
    );
};

export const BotPersonaChatCard = React.memo(BotPersonaChatCardComponent);
export default BotPersonaChatCard;
