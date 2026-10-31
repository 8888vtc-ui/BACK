'use client';

/**
 * @file src/components/board/BoardSideRails.tsx
 * @description Rails latéraux Haute-Horlogerie Monte-Carlo (< 300 lignes, 0 `any`).
 */

import React, { useState } from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { PlayerEloProfile } from '../../features/multiplayer/types';
import {
    BOT_ELO_BY_DIFFICULTY,
    BOT_OFFICIAL_PR_BY_DIFFICULTY,
    getBotPersona,
} from '../../features/personas/botPersonas';
import { toggleOrientation, getSavedOrientation, saveOrientation } from './boardOrientation';
import {
    BotPortraitMedallion,
    IconAstrolabeCoach,
    IconHorologyGear,
} from '../common/MonteCarloIcons';

export interface BoardLeftPlayerRailProps {
    readonly difficulty?: AIDifficulty;
    readonly locale?: string;
    readonly isXTurn: boolean;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly cubeValue: number;
    readonly matchLength: number;
    readonly turn: 'X' | 'O';
    readonly opponentClock?: string;
    readonly playerClock?: string;
    readonly delaySeconds?: number;
    readonly prX?: number | null;
    readonly prO?: number | null;
    readonly challengerProfile?: PlayerEloProfile | null;
}

function resolvePersonaMeta(
    difficulty: AIDifficulty,
    locale: string,
    prX?: number | null,
    prO?: number | null,
    challengerProfile?: PlayerEloProfile | null,
) {
    const activePersona = getBotPersona(difficulty, locale as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja');
    const botElo = challengerProfile ? String(challengerProfile.rating) : String(BOT_ELO_BY_DIFFICULTY[difficulty] ?? 1950);
    const botDefaultPr = (BOT_OFFICIAL_PR_BY_DIFFICULTY[difficulty] ?? 2.5).toFixed(1);
    const playerPrValue = typeof prX === 'number' && Number.isFinite(prX) ? prX : 0;
    const opponentPrValue = typeof prO === 'number' && Number.isFinite(prO) ? prO.toFixed(1) : botDefaultPr;
    const opponentDisplayName = challengerProfile ? challengerProfile.displayName : activePersona.shortName;
    const opponentBadge = challengerProfile
        ? challengerProfile.countryName
            ? `Club ${challengerProfile.countryName}`
            : 'Challenger En Ligne'
        : activePersona.styleBadge;
    return { activePersona, botElo, playerPrValue, opponentPrValue, opponentDisplayName, opponentBadge };
}

export const BoardPortraitTopHud: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreO, cubeValue, matchLength, turn, opponentClock = '02:36', delaySeconds = 12, prX, prO, challengerProfile,
}) => {
    const { activePersona, botElo, playerPrValue, opponentPrValue, opponentDisplayName, opponentBadge } = resolvePersonaMeta(
        difficulty, locale, prX, prO, challengerProfile,
    );
    return (
        <div
            data-testid="board-portrait-top-hud"
            className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 flex flex-col gap-1 px-1.5 pt-0.5 pb-1 select-none"
        >
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#d4af37]/35 bg-gradient-to-r from-[#0d0a08] via-[#15100b] to-[#0d0a08] px-2.5 py-2 shadow-lg">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <BotPortraitMedallion character="player" size="md" isActive={isXTurn} />
                    <div className="min-w-0 flex flex-col">
                        <span className="truncate font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">Vous</span>
                        <span className="truncate text-[10px] font-semibold text-emerald-300/90">Membre Monte-Carlo</span>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono tabular-nums">
                            <span className="text-stone-300">1500</span>
                            <span className="rounded border border-emerald-400/50 bg-emerald-950/80 px-1 py-0.2 font-bold text-emerald-300">
                                PR {playerPrValue.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#16110c] px-2 py-1 text-center shadow-inner">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">
                        {matchLength > 0 ? `${matchLength} pts` : 'Libre'} · ×{cubeValue}
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-amber-400">⚔ VS</span>
                </div>

                <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0 flex flex-col items-end">
                        <span className="truncate max-w-[115px] font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">
                            {opponentDisplayName}
                        </span>
                        <span className="truncate max-w-[115px] text-[10px] font-bold text-[#f3c65f]">
                            {opponentBadge}
                        </span>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono tabular-nums">
                            <span className="text-stone-300">{botElo}</span>
                            <span className="rounded border border-[#d4af37]/45 bg-[#d4af37]/15 px-1 py-0.2 font-bold text-[#f3d27a]">
                                PR {opponentPrValue}
                            </span>
                        </div>
                    </div>
                    <BotPortraitMedallion character={difficulty} size="md" isActive={!isXTurn} />
                </div>
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex h-7 min-w-[34px] items-center justify-center rounded-lg border border-[#d4af37]/60 bg-[#14100c] px-2 font-display text-base font-bold tabular-nums text-[#f7f3e8] shadow">
                    {scoreO}
                </div>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#d4af37]/40 bg-[#080605] font-mono text-[11px] font-bold tabular-nums shadow">
                    <span className="bg-[#14100c] px-1.5 py-0.5 text-[#f3d27a] border-r border-[#d4af37]/30">+{delaySeconds}s</span>
                    <span className={`px-2 py-0.5 ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7]' : 'text-stone-400'}`}>{opponentClock}</span>
                </div>
                <div className="h-6 rounded-md border border-[#d4af37]/25 bg-[#0d0a08]/90 px-2 flex items-center justify-center text-[10px] font-semibold text-[#f3d27a] truncate max-w-[140px]">
                    « {activePersona.skillTaught} »
                </div>
            </div>
        </div>
    );
});
BoardPortraitTopHud.displayName = 'BoardPortraitTopHud';

export const BoardPortraitBottomHud: React.FC<Pick<BoardLeftPlayerRailProps, 'scoreX' | 'turn' | 'playerClock' | 'delaySeconds'>> = React.memo(({
    scoreX, turn, playerClock = '02:14', delaySeconds = 12,
}) => (
    <div
        data-testid="board-portrait-bottom-hud"
        className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 flex items-center justify-between px-2.5 py-1 select-none"
    >
        <div className="flex h-7 min-w-[34px] items-center justify-center rounded-lg border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] px-2 font-display text-base font-bold tabular-nums text-[#0b0907] shadow">
            {scoreX}
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-[#d4af37]/40 bg-[#080605] font-mono text-[11px] font-bold tabular-nums shadow">
            <span className="bg-[#14100c] px-1.5 py-0.5 text-[#f3d27a] border-r border-[#d4af37]/30">+{delaySeconds}s</span>
            <span className={`px-2 py-0.5 ${turn === 'X' ? 'bg-[#065f46] text-emerald-50' : 'text-stone-400'}`}>{playerClock}</span>
        </div>
        <div className="h-6 w-12 rounded-md border border-[#d4af37]/20 bg-[#0d0a08]/80 flex items-center justify-center text-[10px] font-mono text-[#f3d27a]">
            Vous
        </div>
    </div>
));
BoardPortraitBottomHud.displayName = 'BoardPortraitBottomHud';

export const BoardLeftPlayerRail: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreX, scoreO, cubeValue, matchLength, turn,
    opponentClock = '02:36', playerClock = '02:14', delaySeconds = 12, prX, prO, challengerProfile,
}) => {
    const { activePersona, botElo, playerPrValue, opponentPrValue, opponentDisplayName, opponentBadge } = resolvePersonaMeta(
        difficulty, locale, prX, prO, challengerProfile,
    );

    return (
        <aside
            aria-label="Joueurs et score du match"
            data-testid="board-left-player-rail"
            className="hidden md:flex [@media(max-height:500px)]:!flex flex-col items-center justify-between w-44 md:w-52 xl:w-60 [@media(max-height:540px)]:!w-36 shrink-0 h-full min-h-0 overflow-hidden py-2 [@media(max-height:540px)]:!py-1 px-2 [@media(max-height:540px)]:!px-1.5 select-none rounded-2xl border border-[#d4af37]/25 bg-gradient-to-b from-[#130e09]/95 via-[#0d0a08]/95 to-[#130e09]/95 shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
        >
            {/* Adversaire (Haut) — Grand Portrait Haute-Couture & Caractère */}
            <div className="flex w-full flex-col gap-1 [@media(max-height:540px)]:!gap-0.5 border-b border-[#d4af37]/20 pb-1.5 [@media(max-height:540px)]:!pb-0.5 shrink-0">
                <div className="flex w-full items-center justify-between gap-1.5 [@media(max-height:540px)]:!gap-1">
                    <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                        <span className="truncate max-w-full font-display text-sm md:text-base [@media(max-height:540px)]:!text-[11px] italic font-black text-[#f7f3e8] leading-tight">
                            {opponentDisplayName}
                        </span>
                        <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#f3c65f] [@media(max-height:540px)]:hidden">
                            {opponentBadge}
                        </span>
                        <div className="[@media(max-height:540px)]:hidden">
                            <BotPortraitMedallion character={difficulty} size="lg" isActive={!isXTurn} />
                        </div>
                        <div className="hidden [@media(max-height:540px)]:block">
                            <BotPortraitMedallion character={difficulty} size="sm" isActive={!isXTurn} />
                        </div>
                        <div className="flex items-center gap-1 text-[11px] [@media(max-height:540px)]:!text-[9px] font-semibold tabular-nums">
                            <span className="font-mono text-stone-200 font-bold">{botElo} Elo</span>
                            <span
                                className="rounded border border-[#d4af37]/50 bg-[#d4af37]/20 px-1 py-0.2 font-mono text-[9px] font-black text-[#f3d27a]"
                                title={`Performance Rating : ${opponentPrValue}`}
                            >
                                PR {opponentPrValue}
                            </span>
                        </div>
                    </div>

                    <div
                        data-testid="left-rail-score-o"
                        className="flex h-11 w-10 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37]/65 bg-gradient-to-b from-[#1a1510] to-[#090705] font-display text-xl [@media(max-height:540px)]:!text-base font-bold tabular-nums text-[#f7f3e8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.6)]"
                        title="Points de l'adversaire"
                    >
                        {scoreO}
                    </div>
                </div>
                <p
                    data-testid="left-rail-persona-quote"
                    className="[@media(max-height:540px)]:hidden rounded-lg border border-[#d4af37]/25 bg-black/45 px-2 py-1 text-[10px] italic text-amber-100/90 leading-snug line-clamp-2 text-center"
                >
                    « {activePersona.dialogues.opening.fun} »
                </p>
            </div>

            {/* Centre : Plaque de Match & Chronographe Bronstein WBF */}
            <div className="flex w-full items-center justify-between gap-1 my-auto py-0.5 shrink-0">
                <div className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#14100c] px-1.5 py-1.5 [@media(max-height:540px)]:!py-1 text-center shadow-inner min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-stone-400">
                        Videau <span className="font-mono font-bold text-[#f3d27a]">×{cubeValue}</span>
                    </div>
                    <div className="mt-0.5 font-display text-xs [@media(max-height:540px)]:!text-[10px] italic font-bold text-[#f7f3e8] leading-tight truncate">
                        Match <span className="font-mono not-italic font-extrabold text-[#d4af37]">{matchLength > 0 ? `${matchLength} pts` : 'Libre'}</span>
                    </div>
                </div>

                <div
                    data-testid="left-rail-clock-block"
                    className="flex flex-col items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#080605] p-1 [@media(max-height:540px)]:!p-0.5 shadow-inner gap-0.5 shrink-0 w-13 [@media(max-height:540px)]:!w-12"
                >
                    <div
                        data-testid="left-rail-clock-opp"
                        className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] [@media(max-height:540px)]:!text-[9px] font-bold tabular-nums transition-all ${
                            turn === 'O' ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]' : 'bg-[#16120e] text-stone-400'
                        }`}
                    >
                        {opponentClock}
                    </div>
                    <div
                        data-testid="left-rail-bronstein-delay"
                        className="flex h-4 [@media(max-height:540px)]:!h-3.5 w-8 items-center justify-center rounded border border-[#d4af37]/50 bg-[#14100c] font-mono text-[9px] font-bold tabular-nums text-[#f3d27a]"
                    >
                        +{delaySeconds}s
                    </div>
                    <div
                        data-testid="left-rail-clock-player"
                        className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[10px] [@media(max-height:540px)]:!text-[9px] font-bold tabular-nums transition-all ${
                            turn === 'X' ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70' : 'bg-[#16120e] text-stone-400'
                        }`}
                    >
                        {playerClock}
                    </div>
                </div>
            </div>

            {/* Joueur Humain (Bas) — Médaillon Membre du Cercle & PR Live */}
            <div className="flex w-full items-center justify-between gap-1.5 [@media(max-height:540px)]:!gap-1 border-t border-[#d4af37]/20 pt-1.5 [@media(max-height:540px)]:!pt-0.5 shrink-0">
                <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] [@media(max-height:540px)]:!text-[9px] font-semibold tabular-nums">
                        <span className="font-mono text-stone-200 font-bold">1500 Elo</span>
                        <span
                            data-testid="left-rail-player-pr"
                            className={`rounded border px-1 py-0.2 font-mono text-[9px] font-black ${
                                playerPrValue <= 4
                                    ? 'border-emerald-400/50 bg-emerald-950/80 text-emerald-300'
                                    : playerPrValue <= 8
                                      ? 'border-amber-400/50 bg-amber-950/80 text-amber-300'
                                      : 'border-rose-400/50 bg-rose-950/80 text-rose-300'
                            }`}
                        >
                            PR {playerPrValue.toFixed(2)}
                        </span>
                    </div>
                    <div className="[@media(max-height:540px)]:hidden">
                        <BotPortraitMedallion character="player" size="lg" isActive={isXTurn} />
                    </div>
                    <div className="hidden [@media(max-height:540px)]:block">
                        <BotPortraitMedallion character="player" size="sm" isActive={isXTurn} />
                    </div>
                    <span className="truncate max-w-full font-display text-sm md:text-base [@media(max-height:540px)]:!text-[11px] italic font-black text-[#f7f3e8] leading-tight">
                        Vous
                    </span>
                </div>

                <div
                    data-testid="left-rail-score-x"
                    className="flex h-11 w-10 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-xl [@media(max-height:540px)]:!text-base font-bold tabular-nums text-[#0b0907] shadow-[0_4px_14px_rgba(212,175,55,0.28)]"
                >
                    {scoreX}
                </div>
            </div>
        </aside>
    );
});
BoardLeftPlayerRail.displayName = 'BoardLeftPlayerRail';

export interface BoardRightActionRailProps {
    readonly isBrowserFullscreen: boolean;
    readonly isFocusFullBoard: boolean;
    readonly onToggleFullscreen: () => void;
    readonly onToggleCoach: () => void;
    readonly onToggleTheme?: () => void;
    readonly onBackToLobby?: () => void;
    readonly canUndo?: boolean;
    readonly onUndo?: () => void;
    readonly autoConfirmEnabled?: boolean;
    readonly onToggleAutoConfirm?: () => void;
}

export const BoardRightActionRail: React.FC<BoardRightActionRailProps> = React.memo(({
    isBrowserFullscreen, isFocusFullBoard, onToggleFullscreen, onToggleCoach, onToggleTheme, onBackToLobby,
    canUndo = false, onUndo, autoConfirmEnabled = false, onToggleAutoConfirm,
}) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const handleFlipDirection = () => {
        const next = toggleOrientation(getSavedOrientation());
        saveOrientation(next);
    };
    const btnBase =
        'flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] shadow-lg transition hover:border-[#d4af37] hover:bg-[#1c1610] active:scale-95';

    return (
        <aside
            aria-label="Actions rapides de table"
            data-testid="board-right-action-rail"
            className="relative hidden md:flex [@media(max-height:500px)]:!flex flex-col items-center justify-center gap-2.5 [@media(max-height:540px)]:!gap-1.5 w-12 [@media(max-height:540px)]:!w-9 shrink-0 py-2 [@media(max-height:540px)]:!py-1 select-none"
        >
            {canUndo && onUndo && (
                <button
                    type="button"
                    data-testid="right-rail-undo-btn"
                    onClick={onUndo}
                    title="Annuler le dé joué (Ctrl+Z)"
                    aria-label="Annuler le coup"
                    className="flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border border-amber-400/60 bg-amber-500/20 text-amber-200 font-bold text-sm shadow-lg transition hover:border-amber-300 hover:bg-amber-500/30 active:scale-95"
                >
                    ↶
                </button>
            )}
            <button type="button" data-testid="board-fullscreen-toggle-btn" onClick={onToggleFullscreen} title={isBrowserFullscreen ? 'Quitter le plein écran' : 'Plein écran intégral'} aria-label="Basculer le plein écran" className={btnBase}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
            </button>
            <button
                type="button"
                data-testid="board-focus-toggle-btn"
                onClick={onToggleCoach}
                title="Ouvrir ou masquer le Maître-Coach IA"
                aria-label="Ouvrir ou masquer le Coach IA"
                className={`flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border transition active:scale-95 shadow-lg ${
                    !isFocusFullBoard ? 'border-[#f5dfa0] bg-gradient-to-br from-[#d4af37] to-[#9a6f18] text-[#090806]' : 'border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] hover:border-[#d4af37]'
                }`}
            >
                <IconAstrolabeCoach className={!isFocusFullBoard ? 'text-[#090806]' : 'text-[#f3d27a]'} size={18} />
            </button>
            <div className="relative">
                <button
                    type="button"
                    data-testid="right-rail-settings-btn"
                    onClick={() => setIsSettingsOpen((v) => !v)}
                    title="Paramètres de table (Validation automatique, tapis, orientation)"
                    aria-label="Paramètres de table"
                    aria-expanded={isSettingsOpen}
                    className={btnBase}
                >
                    <IconHorologyGear className="text-[#f3d27a]" size={17} />
                </button>
                {isSettingsOpen && (
                    <div
                        data-testid="right-rail-settings-popover"
                        className="absolute right-full mr-2 top-1/2 -translate-y-1/2 z-50 w-56 rounded-2xl border border-[#d4af37]/45 bg-[#120e0a]/98 p-2.5 text-xs text-[#f7f3e8] shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-md flex flex-col gap-1.5"
                    >
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#f3c65f]">⚙️ Paramètres</span>
                            <button type="button" onClick={() => setIsSettingsOpen(false)} className="text-[11px] text-stone-400 hover:text-white px-1">✕</button>
                        </div>
                        {onToggleAutoConfirm && (
                            <button
                                type="button"
                                data-testid="right-rail-auto-confirm-toggle"
                                onClick={onToggleAutoConfirm}
                                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left text-[11px] font-semibold hover:border-[#d4af37]/50 transition"
                            >
                                <span>Validation automatique des coups</span>
                                <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-black ${autoConfirmEnabled ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50' : 'bg-white/10 text-stone-300'}`}>
                                    {autoConfirmEnabled ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        )}
                        {onToggleTheme && (
                            <button
                                type="button"
                                onClick={() => { onToggleTheme(); setIsSettingsOpen(false); }}
                                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#d4af37]/50 transition"
                            >
                                <span>🎨 Changer le tapis</span>
                                <span className="text-[10px] text-[#f3d27a]">Suivant</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { handleFlipDirection(); setIsSettingsOpen(false); }}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#d4af37]/50 transition"
                        >
                            <span>⇄ Sens du plateau</span>
                            <span className="text-[10px] text-[#f3d27a]">Inverser</span>
                        </button>
                    </div>
                )}
            </div>
            {onBackToLobby && (
                <button
                    type="button"
                    data-testid="right-rail-leave-btn"
                    onClick={onBackToLobby}
                    title="Quitter la table / Retour au Salon"
                    aria-label="Retour au Salon"
                    className="flex h-11 w-11 [@media(max-height:540px)]:!h-8 [@media(max-height:540px)]:!w-8 items-center justify-center rounded-xl border border-rose-500/35 bg-[#160b0b] text-rose-300 shadow-lg transition hover:border-rose-400 hover:bg-rose-950/60 active:scale-95"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                </button>
            )}
        </aside>
    );
});
BoardRightActionRail.displayName = 'BoardRightActionRail';
