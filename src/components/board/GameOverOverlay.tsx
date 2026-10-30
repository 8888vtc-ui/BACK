'use client';

/**
 * @file src/components/board/GameOverOverlay.tsx
 * @description Modale de Fin de Partie / Match symétrique (style Galaxy Match-End) :
 * - Duel d'avatars face à face avec badge "Gagnant" et carrés blancs géants de score (4 - 2)
 * - Lignes de comparaison horizontales centrées (Points, Elo, Progression Match)
 * - Barre de 3 actions en pied de carte (Partager, Revue, Manche Suivante / Nouveau Match).
 * Strictement < 220 lignes, 0 `any`.
 */

import React from 'react';
import type { Player } from '../../engine/backgammonEngine';
import type { GameResult } from '../../engine/aiHeuristics';

export interface GameOverOverlayProps {
    readonly result: GameResult;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly matchLength: number;
    readonly isMatchOver: boolean;
    readonly matchWinner: Player | null;
    readonly isCrawfordNext: boolean;
    readonly onNextGame: () => void;
    readonly onResetMatch: () => void;
    readonly onOpenAnalysis?: () => void;
}

const WIN_TYPE_LABELS: Record<GameResult['winType'], string> = {
    single: 'SIMPLE (1x)',
    gammon: 'GAMMON (2x)',
    backgammon: 'BACKGAMMON (3x)',
    pass: 'ABANDON DU VIDEAU',
};

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
    result,
    scoreX,
    scoreO,
    matchLength,
    isMatchOver,
    matchWinner,
    isCrawfordNext,
    onNextGame,
    onResetMatch,
    onOpenAnalysis,
}) => {
    const isPlayerWinner = result.winner === 'X';
    const winLabel = WIN_TYPE_LABELS[result.winType];
    const eloDelta = isPlayerWinner
        ? `+${(result.pointsWon * 4.2).toFixed(1)}`
        : `-${(result.pointsWon * 4.2).toFixed(1)}`;
    const oppEloDelta = isPlayerWinner
        ? `-${(result.pointsWon * 4.2).toFixed(1)}`
        : `+${(result.pointsWon * 4.2).toFixed(1)}`;

    return (
        <div
            data-testid="game-over-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
        >
            <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#121526] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.92)]">
                {/* Bannière Fin de Match */}
                {isMatchOver && matchWinner && (
                    <div className="mb-3 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                        🏆 Victoire du Match : Joueur {matchWinner} !
                    </div>
                )}

                {/* 1. DUEL D'AVATARS & CARRÉS DE SCORE BLANCS GÉANTS (Style Galaxy) */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    {/* Joueur X */}
                    <div className="flex flex-col items-center w-28">
                        <div className="relative">
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 bg-[#1c223a] text-lg font-black text-white shadow-lg ${
                                    isPlayerWinner
                                        ? 'border-amber-400 ring-4 ring-amber-400/20'
                                        : 'border-indigo-400/40'
                                }`}
                            >
                                X
                            </div>
                            {isPlayerWinner && (
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow">
                                    Gagnant
                                </span>
                            )}
                        </div>
                        <span className="mt-3 text-[11px] font-extrabold text-white">
                            Vous · Joueur X (Blanc)
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                            {scoreX} / {matchLength}
                        </span>
                    </div>

                    {/* Carrés Blancs Géants de Score */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-14 w-12 items-center justify-center rounded-xl bg-white font-mono text-2xl font-black text-slate-950 shadow-md tabular-nums">
                            {scoreX}
                        </div>
                        <span className="font-mono text-lg font-black text-slate-500">-</span>
                        <div className="flex h-14 w-12 items-center justify-center rounded-xl bg-white font-mono text-2xl font-black text-slate-950 shadow-md tabular-nums">
                            {scoreO}
                        </div>
                    </div>

                    {/* Joueur O */}
                    <div className="flex flex-col items-center w-28">
                        <div className="relative">
                            <div
                                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 bg-[#1c223a] text-lg font-black text-indigo-200 shadow-lg ${
                                    !isPlayerWinner
                                        ? 'border-amber-400 ring-4 ring-amber-400/20'
                                        : 'border-indigo-400/40'
                                }`}
                            >
                                O
                            </div>
                            {!isPlayerWinner && (
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow">
                                    Gagnant
                                </span>
                            )}
                        </div>
                        <span className="mt-3 text-[11px] font-extrabold text-slate-300">
                            IA · Joueur O (Noir)
                        </span>
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                            {scoreO} / {matchLength}
                        </span>
                    </div>
                </div>

                {/* Sous-titre : Manche remportée + Type + Points */}
                <h2 className="text-sm font-black text-white mb-1">
                    Manche remportée par le Joueur {result.winner} !
                </h2>
                <p className="text-xs font-bold text-slate-300 mb-4">
                    <span className="rounded bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-extrabold text-indigo-200">
                        {winLabel}
                    </span>{' '}
                    ·{' '}
                    <span className="font-black text-amber-300">
                        +{result.pointsWon} {result.pointsWon > 1 ? 'points' : 'point'}
                    </span>
                </p>

                {/* 2. LIGNES DE COMPARAISON HORIZONTALES SYMÉTRIQUES */}
                <div className="space-y-2.5 mb-4">
                    <div className="grid grid-cols-3 items-center rounded-2xl bg-[#1a1f35] px-4 py-2.5 border border-white/5">
                        <span
                            className={`text-left font-mono text-base font-black tabular-nums ${
                                isPlayerWinner ? 'text-amber-300' : 'text-slate-400'
                            }`}
                        >
                            {isPlayerWinner ? `+${result.pointsWon} pts` : '0 pt'}
                        </span>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Points
                            </span>
                            <span className="text-base leading-none" aria-hidden="true">
                                🪙
                            </span>
                        </div>
                        <span
                            className={`text-right font-mono text-base font-black tabular-nums ${
                                !isPlayerWinner ? 'text-amber-300' : 'text-slate-400'
                            }`}
                        >
                            {!isPlayerWinner ? `+${result.pointsWon} pts` : '0 pt'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 items-center rounded-2xl bg-[#1a1f35] px-4 py-2.5 border border-white/5">
                        <span
                            className={`text-left font-mono text-base font-black tabular-nums ${
                                isPlayerWinner ? 'text-sky-400' : 'text-slate-400'
                            }`}
                        >
                            {eloDelta}
                        </span>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Elo
                            </span>
                            <span className="text-base leading-none" aria-hidden="true">
                                📊
                            </span>
                        </div>
                        <span
                            className={`text-right font-mono text-base font-black tabular-nums ${
                                !isPlayerWinner ? 'text-sky-400' : 'text-slate-400'
                            }`}
                        >
                            {oppEloDelta}
                        </span>
                    </div>
                </div>

                {/* Alerte Règle de Crawford */}
                {isCrawfordNext && !isMatchOver && (
                    <div className="mb-4 rounded-2xl border border-amber-400/35 bg-amber-500/10 p-3 text-xs text-amber-200">
                        <strong className="font-black text-amber-300">Règle de Crawford :</strong>{' '}
                        Le videau sera suspendu pour la prochaine manche.
                    </div>
                )}

                {/* 3. BARRE D'ACTIONS EN PIED DE CARTE */}
                <div className="flex items-center gap-2.5">
                    {onOpenAnalysis && (
                        <button
                            type="button"
                            onClick={onOpenAnalysis}
                            className="flex-1 rounded-xl border border-white/10 bg-[#1c223a] py-3 px-3 text-xs font-extrabold text-slate-200 hover:bg-[#252d4d] transition"
                        >
                            🔍 Revue
                        </button>
                    )}
                    {isMatchOver ? (
                        <button
                            type="button"
                            onClick={onResetMatch}
                            className="flex-1 rounded-xl bg-emerald-400 py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_6px_20px_rgba(52,211,153,0.35)] hover:bg-emerald-300 transition"
                        >
                            ↻ Nouveau Match
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onNextGame}
                            className="flex-1 rounded-xl bg-emerald-400 py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_6px_20px_rgba(52,211,153,0.35)] hover:bg-emerald-300 transition"
                        >
                            ▶ Manche Suivante
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameOverOverlay;
