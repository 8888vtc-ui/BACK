'use client';

/**
 * @file src/components/board/BoardSideRails.tsx
 * @description Rails latéraux Haute-Horlogerie Monte-Carlo :
 * - Gauche : Médaillons octogonaux illustrés des personnages, Guichets Grande Date Horlogers
 *   pour les scores, PR en direct et Chronographe Bronstein WBGF en laiton brossé.
 * - Droit : 4 Commandes horlogères ciselées au trait d'or (zéro emoji cartoon).
 * Strictement < 260 lignes, 0 `any`, 0 classe text-[8px] / text-[9px].
 */

import React from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import { getBotPersona } from '../../features/personas/botPersonas';
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
}

function resolvePersonaMeta(difficulty: AIDifficulty, locale: string, prX?: number | null, prO?: number | null) {
    const activePersona = getBotPersona(difficulty, locale as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja');
    const botElo = difficulty === 'grandmaster' ? '2150' : difficulty === 'expert' ? '1950' : difficulty === 'intermediate' ? '1680' : '1420';
    const botDefaultPr = difficulty === 'grandmaster' ? '0.4' : difficulty === 'expert' ? '2.1' : difficulty === 'intermediate' ? '5.4' : '12.8';
    const playerPrValue = typeof prX === 'number' && Number.isFinite(prX) ? prX : 0;
    const opponentPrValue = typeof prO === 'number' && Number.isFinite(prO) ? prO.toFixed(1) : botDefaultPr;
    return { activePersona, botElo, playerPrValue, opponentPrValue };
}

export const BoardPortraitTopHud: React.FC<BoardLeftPlayerRailProps> = React.memo(({
    difficulty = 'expert', locale = 'fr', isXTurn, scoreO, cubeValue, matchLength, turn, opponentClock = '02:36', delaySeconds = 12, prX, prO,
}) => {
    const { activePersona, botElo, playerPrValue, opponentPrValue } = resolvePersonaMeta(difficulty, locale, prX, prO);
    return (
        <div
            data-testid="board-portrait-top-hud"
            className="md:hidden [@media(max-height:500px)]:hidden w-full shrink-0 flex flex-col gap-1 px-1.5 pt-0.5 pb-1 select-none"
        >
            {/* Duel Header (style Galaxy Portrait avec charte Monte-Carlo Or & Obsidienne) */}
            <div className="flex items-center justify-between gap-1.5 rounded-xl border border-[#d4af37]/25 bg-[#0d0a08]/95 px-2.5 py-1.5 shadow-md">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="shrink-0 scale-90 origin-left">
                        <BotPortraitMedallion character="player" size="md" isActive={isXTurn} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                        <span className="truncate font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">Vous</span>
                        <div className="flex items-center gap-1 text-[10px] font-mono tabular-nums">
                            <span className="text-stone-400">1500</span>
                            <span className="rounded border border-emerald-400/50 bg-emerald-950/80 px-1 py-0.2 font-bold text-emerald-300">
                                PR {playerPrValue.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col items-center justify-center rounded-lg border border-[#d4af37]/30 bg-[#16110c] px-2 py-1 text-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f3d27a]">
                        {matchLength > 0 ? `Match ${matchLength}p` : 'Libre'} · ×{cubeValue}
                    </span>
                    <span className="text-[10px] font-black tracking-widest text-stone-400">VS</span>
                </div>

                <div className="flex items-center justify-end gap-2 min-w-0 flex-1 text-right">
                    <div className="min-w-0 flex flex-col items-end">
                        <span className="truncate max-w-[105px] font-display text-sm italic font-bold text-[#f7f3e8] leading-tight">
                            {activePersona.shortName}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono tabular-nums">
                            <span className="text-stone-400">{botElo}</span>
                            <span className="rounded border border-[#d4af37]/45 bg-[#d4af37]/15 px-1 py-0.2 font-bold text-[#f3d27a]">
                                PR {opponentPrValue}
                            </span>
                        </div>
                    </div>
                    <div className="shrink-0 scale-90 origin-right">
                        <BotPortraitMedallion character={difficulty} size="md" isActive={!isXTurn} />
                    </div>
                </div>
            </div>

            {/* Barre de bord supérieure (Score Adversaire + Chrono Bronstein Adversaire) */}
            <div className="flex items-center justify-between px-1">
                <div className="flex h-7 min-w-[34px] items-center justify-center rounded-lg border border-[#d4af37]/60 bg-[#14100c] px-2 font-display text-base font-bold tabular-nums text-[#f7f3e8] shadow">
                    {scoreO}
                </div>
                <div className="flex items-center overflow-hidden rounded-lg border border-[#d4af37]/40 bg-[#080605] font-mono text-[11px] font-bold tabular-nums shadow">
                    <span className="bg-[#14100c] px-1.5 py-0.5 text-[#f3d27a] border-r border-[#d4af37]/30">+{delaySeconds}s</span>
                    <span className={`px-2 py-0.5 ${turn === 'O' ? 'bg-[#b45309] text-[#fef3c7]' : 'text-stone-400'}`}>{opponentClock}</span>
                </div>
                <div className="h-6 w-12 rounded-md border border-[#d4af37]/20 bg-[#0d0a08]/80 flex items-center justify-center text-[10px] font-mono text-stone-400">
                    Camp O
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
    difficulty = 'expert',
    locale = 'fr',
    isXTurn,
    scoreX,
    scoreO,
    cubeValue,
    matchLength,
    turn,
    opponentClock = '02:36',
    playerClock = '02:14',
    delaySeconds = 12,
    prX,
    prO,
}) => {
    const { activePersona, botElo, playerPrValue, opponentPrValue } = resolvePersonaMeta(difficulty, locale, prX, prO);

    return (
        <aside
            aria-label="Joueurs et score du match"
            data-testid="board-left-player-rail"
            className="hidden md:flex [@media(max-height:500px)]:!flex flex-col items-center justify-between w-44 md:w-52 xl:w-60 [@media(max-height:540px)]:!w-44 shrink-0 h-full min-h-0 overflow-hidden py-2.5 [@media(max-height:540px)]:!py-1.5 px-2 select-none rounded-2xl border border-[#d4af37]/20 bg-[#0d0a08]/90 shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
        >
            {/* Adversaire (Haut) — Médaillon Octogonal & Guichet Grande Date */}
            <div className="flex w-full items-center justify-between gap-2 border-b border-[#d4af37]/15 pb-2 [@media(max-height:540px)]:!pb-1 shrink-0">
                <div className="flex flex-col items-center gap-1 [@media(max-height:540px)]:!gap-0.5 min-w-0 flex-1">
                    <span className="truncate max-w-full font-display text-sm md:text-base [@media(max-height:540px)]:!text-xs italic font-bold text-[#f7f3e8] leading-tight">
                        {activePersona.shortName}
                    </span>
                    <div className="[@media(max-height:540px)]:scale-75 [@media(max-height:540px)]:-my-1.5">
                        <BotPortraitMedallion
                            character={difficulty}
                            size="lg"
                            isActive={!isXTurn}
                        />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] [@media(max-height:540px)]:!text-[10px] font-semibold tabular-nums">
                        <span className="font-mono text-stone-300">{botElo}</span>
                        <span
                            className="rounded border border-[#d4af37]/45 bg-[#d4af37]/15 px-1 py-0.2 font-mono text-[10px] font-bold text-[#f3d27a]"
                            title={`Performance Rating : ${opponentPrValue}`}
                        >
                            PR {opponentPrValue}
                        </span>
                    </div>
                </div>

                {/* Guichet Grande Date Horloger (Adversaire) */}
                <div
                    data-testid="left-rail-score-o"
                    className="flex h-12 w-11 [@media(max-height:540px)]:!h-9 [@media(max-height:540px)]:!w-9 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37]/65 bg-gradient-to-b from-[#1a1510] to-[#090705] font-display text-2xl [@media(max-height:540px)]:!text-lg font-bold tabular-nums text-[#f7f3e8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.6)]"
                    title="Points de l'adversaire"
                >
                    {scoreO}
                </div>
            </div>

            {/* Centre : Plaque de Match & Chronographe Bronstein WBF */}
            <div className="flex w-full items-center justify-between gap-1.5 my-auto py-1 [@media(max-height:540px)]:!py-0.5 shrink-0">
                {/* Plaque Enjeu & Format Crawford */}
                <div className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#14100c] px-2 py-2 [@media(max-height:540px)]:!py-1 text-center shadow-inner">
                    <div className="text-[10px] uppercase tracking-wider text-stone-400">
                        Videau <span className="font-mono font-bold text-[#f3d27a]">×{cubeValue}</span>
                    </div>
                    <div className="mt-0.5 font-display text-xs sm:text-sm [@media(max-height:540px)]:!text-xs italic font-bold text-[#f7f3e8] leading-tight">
                        Match{' '}
                        <span className="font-mono not-italic font-extrabold text-[#d4af37]">
                            {matchLength > 0 ? `${matchLength} pts` : 'Libre'}
                        </span>
                    </div>
                </div>

                {/* Chronographe Vertical Bronstein (Laiton & Émail) */}
                <div
                    data-testid="left-rail-clock-block"
                    className="flex flex-col items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#080605] p-1 [@media(max-height:540px)]:!p-0.5 shadow-inner gap-0.5 shrink-0 w-15"
                >
                    <div
                        data-testid="left-rail-clock-opp"
                        className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[11px] [@media(max-height:540px)]:!text-[10px] font-bold tabular-nums transition-all ${
                            turn === 'O'
                                ? 'bg-[#b45309] text-[#fef3c7] ring-1 ring-[#f5dfa0]'
                                : 'bg-[#16120e] text-stone-400'
                        }`}
                        title="Réserve de temps adversaire"
                    >
                        {opponentClock}
                    </div>

                    <div
                        data-testid="left-rail-bronstein-delay"
                        className="flex h-5 [@media(max-height:540px)]:!h-4 w-9 items-center justify-center rounded border border-[#d4af37]/50 bg-[#14100c] font-mono text-[10px] font-bold tabular-nums text-[#f3d27a]"
                        title="Délai Bronstein WBGF"
                    >
                        +{delaySeconds}s
                    </div>

                    <div
                        data-testid="left-rail-clock-player"
                        className={`w-full rounded-md py-0.5 px-1 text-center font-mono text-[11px] [@media(max-height:540px)]:!text-[10px] font-bold tabular-nums transition-all ${
                            turn === 'X'
                                ? 'bg-[#065f46] text-emerald-50 ring-1 ring-emerald-400/70'
                                : 'bg-[#16120e] text-stone-400'
                        }`}
                        title="Votre réserve de temps"
                    >
                        {playerClock}
                    </div>
                </div>
            </div>

            {/* Joueur Humain (Bas) — Médaillon Membre du Cercle & PR Live */}
            <div className="flex w-full items-center justify-between gap-2 border-t border-[#d4af37]/15 pt-2 [@media(max-height:540px)]:!pt-1 shrink-0">
                <div className="flex flex-col items-center gap-1 [@media(max-height:540px)]:!gap-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1 text-[11px] [@media(max-height:540px)]:!text-[10px] font-semibold tabular-nums">
                        <span className="font-mono text-stone-300">1500</span>
                        <span
                            data-testid="left-rail-player-pr"
                            title={`Votre Performance Rating en direct : ${playerPrValue.toFixed(2)}`}
                            className={`rounded border px-1 py-0.2 font-mono text-[10px] font-bold ${
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
                    <div className="[@media(max-height:540px)]:scale-75 [@media(max-height:540px)]:-my-1.5">
                        <BotPortraitMedallion
                            character="player"
                            size="lg"
                            isActive={isXTurn}
                        />
                    </div>
                    <span className="truncate max-w-full font-display text-sm md:text-base [@media(max-height:540px)]:!text-xs italic font-bold text-[#f7f3e8] leading-tight">
                        Vous
                    </span>
                </div>

                {/* Guichet Grande Date Horloger (Joueur) */}
                <div
                    data-testid="left-rail-score-x"
                    className="flex h-12 w-11 [@media(max-height:540px)]:!h-9 [@media(max-height:540px)]:!w-9 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-2xl [@media(max-height:540px)]:!text-lg font-bold tabular-nums text-[#0b0907] shadow-[0_4px_14px_rgba(212,175,55,0.28)]"
                    title="Votre score"
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
}

export const BoardRightActionRail: React.FC<BoardRightActionRailProps> = React.memo(({
    isBrowserFullscreen,
    isFocusFullBoard,
    onToggleFullscreen,
    onToggleCoach,
    onToggleTheme,
    onBackToLobby,
}) => {
    const handleFlipDirection = () => {
        const next = toggleOrientation(getSavedOrientation());
        saveOrientation(next);
    };

    const btnBase =
        'flex h-11 w-11 [@media(max-height:540px)]:!h-9 [@media(max-height:540px)]:!w-9 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] shadow-lg transition hover:border-[#d4af37] hover:bg-[#1c1610] active:scale-95';

    return (
        <aside
            aria-label="Actions rapides de table"
            data-testid="board-right-action-rail"
            className="hidden md:flex [@media(max-height:500px)]:!flex flex-col items-center justify-center gap-3 [@media(max-height:540px)]:!gap-2 w-13 [@media(max-height:540px)]:!w-10 shrink-0 py-3 [@media(max-height:540px)]:!py-1 select-none"
        >
            <button
                type="button"
                data-testid="board-fullscreen-toggle-btn"
                onClick={onToggleFullscreen}
                title={isBrowserFullscreen ? 'Quitter le plein écran' : 'Plein écran intégral'}
                aria-label="Basculer le plein écran"
                className={btnBase}
            >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
            </button>

            <button
                type="button"
                data-testid="board-focus-toggle-btn"
                onClick={onToggleCoach}
                title="Ouvrir ou masquer le Maître-Coach IA"
                aria-label="Ouvrir ou masquer le Coach IA"
                className={`flex h-11 w-11 [@media(max-height:540px)]:!h-9 [@media(max-height:540px)]:!w-9 items-center justify-center rounded-xl border transition active:scale-95 shadow-lg ${
                    !isFocusFullBoard
                        ? 'border-[#f5dfa0] bg-gradient-to-br from-[#d4af37] to-[#9a6f18] text-[#090806]'
                        : 'border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] hover:border-[#d4af37]'
                }`}
            >
                <IconAstrolabeCoach className={!isFocusFullBoard ? 'text-[#090806]' : 'text-[#f3d27a]'} size={20} />
            </button>

            <button
                type="button"
                data-testid="right-rail-settings-btn"
                onClick={onToggleTheme ?? handleFlipDirection}
                title="Changer de marqueterie ou inverser le sens de jeu"
                aria-label="Personnaliser le plateau"
                className={btnBase}
            >
                <IconHorologyGear className="text-[#f3d27a]" size={19} />
            </button>

            {onBackToLobby && (
                <button
                    type="button"
                    data-testid="right-rail-leave-btn"
                    onClick={onBackToLobby}
                    title="Quitter la table / Retour au Salon"
                    aria-label="Retour au Salon"
                    className="flex h-11 w-11 [@media(max-height:540px)]:!h-9 [@media(max-height:540px)]:!w-9 items-center justify-center rounded-xl border border-rose-500/35 bg-[#160b0b] text-rose-300 shadow-lg transition hover:border-rose-400 hover:bg-rose-950/60 active:scale-95"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                </button>
            )}
        </aside>
    );
});
BoardRightActionRail.displayName = 'BoardRightActionRail';
