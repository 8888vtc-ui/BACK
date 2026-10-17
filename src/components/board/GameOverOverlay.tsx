'use client';

import React from 'react';
import type { GameResult } from '../../hooks/useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import type { CompleteGameAnalysis } from '../../features/rating/types';
import { shareGameResult } from '../../lib/capacitor/share';
import { impactLight } from '../../lib/capacitor/haptics';
import { useBoardTheme, getModalThemeClasses, type ThemeName } from '../../hooks/useBoardTheme';

export interface GameOverOverlayProps {
    result: GameResult;
    scoreX: number;
    scoreO: number;
    matchLength: number;
    isMatchOver: boolean;
    matchWinner: Player | null;
    isCrawfordNext?: boolean;
    analysis?: CompleteGameAnalysis | null;
    onOpenReview?: () => void;
    onNextGame: () => void;
    onResetMatch: () => void;
    theme?: ThemeName;
}

export default function GameOverOverlay({
    result,
    scoreX,
    scoreO,
    matchLength,
    isMatchOver,
    matchWinner,
    isCrawfordNext = false,
    analysis,
    onOpenReview,
    onNextGame,
    onResetMatch,
    theme,
}: GameOverOverlayProps) {
    const { theme: activeTheme } = useBoardTheme();
    const currentTheme = theme || activeTheme;
    const modalClasses = getModalThemeClasses(currentTheme);

    const isXWinner = result.winner === 'X';

    const winTypeBadge = {
        backgammon: {
            label: '👑 BACKGAMMON (3x)',
            color: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/50',
            desc: 'Le perdant n’a sorti aucun pion et a encore des pions dans le jan intérieur adverse ou sur la barre.',
        },
        gammon: {
            label: '🎉 GAMMON (2x)',
            color: 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border-emerald-400/50',
            desc: 'Le perdant n’a sorti aucun pion de la partie.',
        },
        single: {
            label: '⚡ VICTOIRE SIMPLE (1x)',
            color: 'bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-blue-300 border-blue-400/50',
            desc: 'Victoire standard : le perdant avait déjà commencé à sortir ses pions.',
        },
        pass: {
            label: '🏳️ ABANDON DU VIDEAU (1x)',
            color: 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-purple-400/50',
            desc: 'L’adversaire a refusé la proposition de doubler le videau.',
        },
    }[result.winType];

    const progressX = matchLength > 0 ? Math.min(100, Math.round((scoreX / matchLength) * 100)) : 0;
    const progressO = matchLength > 0 ? Math.min(100, Math.round((scoreO / matchLength) * 100)) : 0;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-over-title"
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 ${modalClasses.overlay}`}
        >
            <div className={`relative w-full max-w-lg overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl transition-all ${modalClasses.container}`}>
                {/* Lueur d'ambiance selon le vainqueur */}
                <div
                    className={`absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl pointer-events-none opacity-40 ${
                        isXWinner ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                />

                <div className="relative flex flex-col items-center text-center">
                    {/* Icône de victoire */}
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-3xl shadow-lg shadow-amber-500/30 ring-2 ring-amber-300">
                        {isMatchOver ? '🏆' : '🎖️'}
                    </div>

                    <h2 id="game-over-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        {isMatchOver
                            ? `Victoire du Match : Joueur ${matchWinner} !`
                            : `Manche remportée par le Joueur ${result.winner} !`}
                    </h2>

                    <div className="mt-2 flex flex-col items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wider ${winTypeBadge.color}`}>
                            {winTypeBadge.label}
                        </span>
                        <p className="text-xs text-slate-400 max-w-xs">{winTypeBadge.desc}</p>
                    </div>

                    {/* Points remportés */}
                    <div className="my-4 w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                        <span className="text-xs uppercase tracking-wider text-slate-400">Points de la manche</span>
                        <div className="text-3xl font-black text-emerald-400">
                            +{result.pointsWon} {result.pointsWon > 1 ? 'points' : 'point'}
                        </div>
                    </div>

                    {/* Bloc Performance Rating (PR) de la manche */}
                    {analysis && (
                        <div className="mb-4 w-full rounded-2xl border border-blue-500/30 bg-blue-950/25 p-3.5 flex items-center justify-between">
                            <div className="text-left">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                    Performance Rating (PR)
                                </span>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="font-mono text-xl font-black text-white" data-testid="gameover-pr-value">
                                        {analysis.performanceRating}
                                    </span>
                                    <span className="rounded-full border border-blue-400/40 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                                        {analysis.prCategory}
                                    </span>
                                    <span className="text-xs text-amber-300 font-bold ml-1">
                                        ~{analysis.estimatedRating} Elo
                                    </span>
                                </div>
                            </div>

                            {onOpenReview && (
                                <button
                                    type="button"
                                    onClick={onOpenReview}
                                    className="rounded-xl border border-blue-400/50 bg-blue-600/30 hover:bg-blue-600/50 px-3 py-1.5 text-xs font-bold text-blue-200 transition shadow-sm"
                                    data-testid="open-game-review-btn"
                                >
                                    🔍 Analyser
                                </button>
                            )}
                        </div>
                    )}

                    {/* Tableau récapitulatif du match */}
                    {matchLength > 0 && (
                        <div className="w-full space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-left">
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                <span>Progression du Match</span>
                                <span>Objectif : {matchLength} pts</span>
                            </div>

                            {/* Joueur X */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-100 ring-1 ring-slate-400" />
                                        Joueur X (Blanc)
                                    </span>
                                    <span>{scoreX} / {matchLength}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                        style={{ width: `${progressX}%` }}
                                    />
                                </div>
                            </div>

                            {/* Joueur O */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-900 ring-1 ring-slate-600" />
                                        Joueur O (Noir)
                                    </span>
                                    <span>{scoreO} / {matchLength}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div
                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${progressO}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Indication Crawford pour la manche suivante */}
                    {!isMatchOver && isCrawfordNext && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-left">
                            <span className="text-base">⚠️</span>
                            <div className="text-[11px] text-amber-200">
                                <strong>Règle de Crawford :</strong> un joueur est à 1 point du match. Le videau sera suspendu pour la prochaine manche.
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex w-full flex-col sm:flex-row items-center gap-3">
                        {isMatchOver ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onResetMatch}
                                    className="w-full flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-98"
                                >
                                    🏆 Nouveau Match ({matchLength} pts)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        impactLight();
                                        shareGameResult({
                                            winner: result.winner,
                                            pointsWon: result.pointsWon,
                                            winType: result.winType,
                                            scoreX,
                                            scoreO,
                                            matchLength,
                                        }).catch(() => {});
                                    }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-950/40 px-4 py-3 text-xs font-bold text-blue-300 hover:bg-blue-900/40 transition active:scale-95"
                                >
                                    <span>📤</span>
                                    <span>Partager</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onNextGame}
                                    className="w-full flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500 transition active:scale-98"
                                >
                                    Manche Suivante →
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        impactLight();
                                        shareGameResult({
                                            winner: result.winner,
                                            pointsWon: result.pointsWon,
                                            winType: result.winType,
                                            scoreX,
                                            scoreO,
                                            matchLength,
                                        }).catch(() => {});
                                    }}
                                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-950/40 px-4 py-3 text-xs font-bold text-blue-300 hover:bg-blue-900/40 transition active:scale-95"
                                >
                                    <span>📤</span>
                                    <span>Partager</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onResetMatch}
                                    className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                                >
                                    Réinitialiser
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
