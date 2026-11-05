'use client';

import React from 'react';
import { Coins, Dices, Settings, Trophy } from 'lucide-react';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { Locale } from '../../i18n';
import { BOT_PERSONAS_BY_DIFFICULTY, getBotPersona, type BotPersonaSpec } from '../../features/personas/botPersonas';

export interface LobbyAiConfigQuickbarProps {
    readonly selectedMode: 'ai' | 'multiplayer' | 'training' | null;
    readonly locale: Locale;
    readonly difficulty: AIDifficulty;
    readonly setDifficulty: (d: AIDifficulty) => void;
    readonly isMittensActive: boolean;
    readonly setIsMittensActive: (b: boolean) => void;
    readonly matchLength: number;
    readonly setMatchLength: React.Dispatch<React.SetStateAction<number>>;
    readonly showOptions: boolean;
    readonly setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
    readonly selectedPersona: BotPersonaSpec;
    readonly onPlay: () => void;
    readonly collapseLabel: string;
    readonly configureLabel: string;
}

const BOT_TAGLINE_BY_DIFF: Record<AIDifficulty, string> = {
    beginner: 'Imprévisible',
    intermediate: 'Tenace',
    expert: 'Calculateur',
    grandmaster: 'Stratège',
};

const BOT_ENGINE_TOOLTIP_BY_DIFF: Record<AIDifficulty, string> = {
    beginner: 'Moteur Open Sage 3-ply, erreurs volontaires plafonnées. Le PR du bot est mesuré en direct.',
    intermediate: 'Moteur Open Sage 3-ply, imprécisions calibrées. Le PR du bot est mesuré en direct.',
    expert: 'Moteur Open Sage 3-ply, erreurs très limitées. Le PR du bot est mesuré en direct.',
    grandmaster: 'Moteur Open Sage 3-ply, sans erreur volontaire. Le PR du bot est mesuré en direct.',
};

const ACTIVE_PILL_CLS = 'border-[#D4AF37]/60 border-[#f3c65f] bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.12)]';
const IDLE_PILL_CLS = 'border-white/10 border-white/[0.05] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200';

export const LobbyAiConfigQuickbar: React.FC<LobbyAiConfigQuickbarProps> = ({
    selectedMode,
    locale,
    difficulty,
    setDifficulty,
    isMittensActive,
    setIsMittensActive,
    matchLength,
    setMatchLength,
    showOptions,
    setShowOptions,
    selectedPersona,
    onPlay,
    collapseLabel,
    configureLabel,
}) => {
    return (
        <div className={selectedMode === 'ai' ? 'flex flex-col gap-3.5' : 'hidden'}>
            <div
                data-testid="lobby-persona-quickbar"
                className="flex overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-5 gap-2.5 snap-x"
                role="group"
                aria-label="Adversaire Bot Personnifié"
            >
                {(['beginner', 'intermediate', 'expert', 'grandmaster'] as const).map((lvl) => {
                    const p = getBotPersona(lvl, locale) ?? BOT_PERSONAS_BY_DIFFICULTY[lvl];
                    const active = !isMittensActive && difficulty === lvl;
                    return (
                        <button
                            key={lvl}
                            type="button"
                            data-testid={`lobby-persona-pill-${lvl}`}
                            title={BOT_ENGINE_TOOLTIP_BY_DIFF[lvl]}
                            aria-pressed={active}
                            onClick={() => {
                                setIsMittensActive(false);
                                setDifficulty(lvl);
                            }}
                            className={`min-w-[136px] sm:min-w-0 shrink-0 snap-start flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all duration-200 ${
                                active
                                    ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-[#F3E5AB] shadow-[0_0_20px_rgba(212,175,55,0.12)] -translate-y-0.5'
                                    : 'border-white/[0.05] bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white'
                            }`}
                        >
                            <BotPortraitMedallion character={lvl} size="md" isActive={active} />
                            <span className="w-full text-xs sm:text-sm font-bold text-[#f7f3e8] leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center">
                                {p.shortName}
                            </span>
                            <span className="w-full truncate text-[11px] font-bold uppercase tracking-wide text-[#D4AF37]">
                                {p.styleBadge}
                            </span>
                            <span className="whitespace-nowrap rounded-full border border-white/[0.08] bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                                {BOT_TAGLINE_BY_DIFF[lvl]}
                            </span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    data-testid="lobby-persona-pill-mittens"
                    aria-pressed={isMittensActive}
                    onClick={() => {
                        setIsMittensActive(true);
                        setDifficulty('grandmaster');
                    }}
                    className={`min-w-[136px] sm:min-w-0 shrink-0 snap-start flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center transition-all duration-200 ${
                        isMittensActive
                            ? 'border-rose-400/60 bg-rose-500/10 text-white shadow-[0_0_20px_rgba(244,63,94,0.2)] -translate-y-0.5'
                            : 'border-white/[0.05] bg-white/[0.02] text-zinc-300 hover:border-rose-400/40 hover:bg-white/[0.05] hover:text-white'
                    }`}
                >
                    <BotPortraitMedallion character="mittens" size="md" isActive={isMittensActive} />
                    <span className="w-full text-xs sm:text-sm font-bold text-[#f7f3e8] leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center">
                        Lord Mittens
                    </span>
                    <span className="w-full truncate text-[11px] font-bold uppercase tracking-wide text-rose-300">
                        Boss Secret
                    </span>
                    <span className="whitespace-nowrap rounded-full border border-rose-400/30 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-rose-200">
                        Défi ultime
                    </span>
                </button>
            </div>

            <div
                data-testid="lobby-direct-format-bar"
                className={selectedMode === 'ai' ? 'flex flex-wrap items-center justify-between gap-2 pt-0.5' : 'sr-only'}
            >
                <div className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5 gap-0.5">
                        <button
                            type="button"
                            data-testid="lobby-pill-match-mode"
                            aria-pressed={matchLength > 0}
                            onClick={() => setMatchLength((prev) => (prev === 0 ? 7 : prev))}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all duration-150 ${
                                matchLength > 0 ? ACTIVE_PILL_CLS : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Trophy size={14} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />
                            <span>Match</span>
                        </button>
                        <button
                            type="button"
                            data-testid="lobby-pill-money-mode"
                            aria-pressed={matchLength === 0}
                            onClick={() => setMatchLength(0)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all duration-150 ${
                                matchLength === 0 ? ACTIVE_PILL_CLS : 'border-transparent text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <Coins size={14} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />
                            <span>Money Game</span>
                        </button>
                    </div>
                    {matchLength > 0 ? (
                        <div className="inline-flex items-center gap-1" role="group" aria-label="Points du match">
                            {[3, 5, 7, 9, 11].map((pts) => (
                                <button
                                    key={pts}
                                    type="button"
                                    data-testid={`lobby-quick-pts-${pts}`}
                                    aria-pressed={matchLength === pts}
                                    onClick={() => setMatchLength(pts)}
                                    className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-all duration-150 ${
                                        matchLength === pts ? ACTIVE_PILL_CLS : IDLE_PILL_CLS
                                    }`}
                                >
                                    {`${pts} pts`}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span
                            data-testid="lobby-money-rule-badge"
                            className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-2.5 py-1 text-xs font-medium text-[#34D399]"
                        >
                            Partie libre continue
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setShowOptions((v) => !v)}
                    aria-expanded={showOptions}
                    data-testid="lobby-options-toggle"
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                        showOptions ? ACTIVE_PILL_CLS : IDLE_PILL_CLS
                    }`}
                >
                    <Settings size={14} strokeWidth={1.5} aria-hidden="true" className="text-[#D4AF37]" />
                    <span>{showOptions ? collapseLabel : configureLabel}</span>
                </button>
            </div>

            <div
                className={selectedMode === 'ai' ? 'flex items-center justify-between gap-2' : 'sr-only'}
                data-testid="lobby-tournament-quickbar"
            >
                <button
                    type="button"
                    data-testid="lobby-start-btn"
                    onClick={onPlay}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#f3c65f] bg-gradient-to-b from-[#E6C665] via-[#D4AF37] to-[#B89225] px-6 py-3 font-semibold text-xs sm:text-sm uppercase tracking-wider text-[#050505] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_25px_-4px_rgba(212,175,55,0.35)] transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
                >
                    <Dices size={17} strokeWidth={1.5} aria-hidden="true" />
                    <span>{`${isMittensActive ? 'Lord Mittens' : selectedPersona.shortName} · ${
                        matchLength === 0 ? 'MONEY GAME' : `MATCH ${matchLength} PTS`
                    }`}</span>
                </button>
            </div>
        </div>
    );
};
