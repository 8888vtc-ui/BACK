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
    const activePersona = getBotPersona(
        difficulty,
        locale as 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja',
    );
    const botElo =
        difficulty === 'grandmaster'
            ? '2150'
            : difficulty === 'expert'
              ? '1950'
              : difficulty === 'intermediate'
                ? '1680'
                : '1420';

    const botDefaultPr =
        difficulty === 'grandmaster'
            ? '0.4'
            : difficulty === 'expert'
              ? '2.1'
              : difficulty === 'intermediate'
                ? '5.4'
                : '12.8';

    const playerPrValue = typeof prX === 'number' && Number.isFinite(prX) ? prX : 0;
    const opponentPrValue = typeof prO === 'number' && Number.isFinite(prO) ? prO.toFixed(1) : botDefaultPr;

    return (
        <aside
            aria-label="Joueurs et score du match"
            data-testid="board-left-player-rail"
            className="hidden md:flex flex-col items-center justify-between w-52 xl:w-60 shrink-0 py-3 px-2.5 select-none rounded-2xl border border-[#d4af37]/20 bg-[#0d0a08]/90 shadow-[0_16px_40px_rgba(0,0,0,0.85)]"
        >
            {/* Adversaire (Haut) — Médaillon Octogonal & Guichet Grande Date */}
            <div className="flex w-full items-center justify-between gap-2.5 border-b border-[#d4af37]/15 pb-3">
                <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                    <span className="truncate max-w-full font-display text-base italic font-bold text-[#f7f3e8]">
                        {activePersona.shortName}
                    </span>
                    <BotPortraitMedallion
                        character={difficulty}
                        size="lg"
                        isActive={!isXTurn}
                    />
                    <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                        <span className="font-mono text-stone-300">{botElo}</span>
                        <span
                            className="rounded border border-[#d4af37]/45 bg-[#d4af37]/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f3d27a]"
                            title={`Performance Rating : ${opponentPrValue}`}
                        >
                            PR {opponentPrValue}
                        </span>
                    </div>
                </div>

                {/* Guichet Grande Date Horloger (Adversaire) */}
                <div
                    data-testid="left-rail-score-o"
                    className="flex h-13 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37]/65 bg-gradient-to-b from-[#1a1510] to-[#090705] font-display text-2xl font-bold tabular-nums text-[#f7f3e8] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95),0_4px_12px_rgba(0,0,0,0.6)]"
                    title="Points de l'adversaire"
                >
                    {scoreO}
                </div>
            </div>

            {/* Centre : Plaque de Match & Chronographe Bronstein WBF */}
            <div className="flex w-full items-center justify-between gap-2 my-auto py-2">
                {/* Plaque Enjeu & Format Crawford */}
                <div className="flex-1 rounded-xl border border-[#d4af37]/20 bg-[#14100c] px-2.5 py-3 text-center shadow-inner">
                    <div className="text-[11px] uppercase tracking-widest text-stone-400">
                        Videau <span className="font-mono font-bold text-[#f3d27a]">×{cubeValue}</span>
                    </div>
                    <div className="mt-1 font-display text-sm italic font-bold text-[#f7f3e8]">
                        Match en{' '}
                        <span className="font-mono not-italic font-extrabold text-[#d4af37]">
                            {matchLength > 0 ? `${matchLength} pts` : 'Libre'}
                        </span>
                    </div>
                </div>

                {/* Chronographe Vertical Bronstein (Laiton & Émail) */}
                <div
                    data-testid="left-rail-clock-block"
                    className="flex flex-col items-center justify-between rounded-xl border border-[#d4af37]/40 bg-[#080605] p-1.5 shadow-inner gap-1 shrink-0 w-16"
                >
                    <div
                        data-testid="left-rail-clock-opp"
                        className={`w-full rounded-lg py-1 text-center font-mono text-xs font-bold tabular-nums transition-all ${
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
                        className="flex h-7 w-9 items-center justify-center rounded border border-[#d4af37]/50 bg-[#14100c] font-mono text-[11px] font-bold tabular-nums text-[#f3d27a]"
                        title="Délai Bronstein WBGF"
                    >
                        +{delaySeconds}s
                    </div>

                    <div
                        data-testid="left-rail-clock-player"
                        className={`w-full rounded-lg py-1 text-center font-mono text-xs font-bold tabular-nums transition-all ${
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
            <div className="flex w-full items-center justify-between gap-2.5 border-t border-[#d4af37]/15 pt-3">
                <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                        <span className="font-mono text-stone-300">1500</span>
                        <span
                            data-testid="left-rail-player-pr"
                            title={`Votre Performance Rating en direct : ${playerPrValue.toFixed(2)}`}
                            className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold ${
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
                    <BotPortraitMedallion
                        character="player"
                        size="lg"
                        isActive={isXTurn}
                    />
                    <span className="truncate max-w-full font-display text-base italic font-bold text-[#f7f3e8]">
                        Vous
                    </span>
                </div>

                {/* Guichet Grande Date Horloger (Joueur) */}
                <div
                    data-testid="left-rail-score-x"
                    className="flex h-13 w-12 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-2xl font-bold tabular-nums text-[#0b0907] shadow-[0_4px_14px_rgba(212,175,55,0.28)]"
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
        'flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#120e0a] text-[#f3d27a] shadow-lg transition hover:border-[#d4af37] hover:bg-[#1c1610] active:scale-95';

    return (
        <aside
            aria-label="Actions rapides de table"
            data-testid="board-right-action-rail"
            className="hidden md:flex flex-col items-center justify-center gap-3 w-13 shrink-0 py-3 select-none"
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
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition active:scale-95 shadow-lg ${
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
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/35 bg-[#160b0b] text-rose-300 shadow-lg transition hover:border-rose-400 hover:bg-rose-950/60 active:scale-95"
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
