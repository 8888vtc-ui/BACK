'use client';

/**
 * Section 1 du Rapport de Formation — En-tête de résultat & comparatif PR (Style Galaxy Match Report).
 * Score final symétrique, 3 blocs (Taux d'erreur, Chance, Performance), compteurs 4 paliers.
 * Strictement 0 `any`, < 250 lignes, 0 classe text-[8px] / text-[9px].
 */

import React from 'react';
import type { DecisionCountersSummary } from './postMatchReportHelpers';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';

export interface PostMatchHeaderProps {
    winner: 'X' | 'O' | null;
    winType: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    pointsWon: number;
    scoreX: number;
    scoreO: number;
    matchLength: number;
    playerPr: number;
    playerCategory: string;
    botPr: number | null;
    botCategory?: string | null;
    counters: DecisionCountersSummary;
    totalEquityLoss: number;
    accuracyPercent?: number;
    checkerPr?: number;
    cubePr?: number;
    locale?: string;
}

const WIN_TYPE_LABELS: Record<string, { fr: string; en: string; icon: string; className: string }> = {
    single: { fr: 'Victoire simple', en: 'Single win', icon: '⚡', className: 'border-[#d4af37]/50 bg-[#2a1a0d]/80 text-[#fce8b2]' },
    gammon: { fr: 'Gammon (2x)', en: 'Gammon (2x)', icon: '🎉', className: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
    backgammon: { fr: 'Backgammon (3x)', en: 'Backgammon (3x)', icon: '👑', className: 'border-amber-400/70 bg-amber-950/60 text-amber-200' },
    pass: { fr: 'Abandon du videau', en: 'Cube pass', icon: '🏳️', className: 'border-[#d4af37]/60 bg-[#331e10]/80 text-[#f3c65f]' },
};

const PostMatchHeaderComponent: React.FC<PostMatchHeaderProps> = ({
    winner, winType, pointsWon, scoreX, scoreO, matchLength, playerPr,
    playerCategory, botPr, botCategory, counters, totalEquityLoss,
    accuracyPercent, checkerPr, cubePr, locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const [showPrSplit, setShowPrSplit] = React.useState(false);
    const isPlayerWinner = winner === 'X';
    const winInfo = winType ? WIN_TYPE_LABELS[winType] : null;

    const cells: Array<{ key: keyof DecisionCountersSummary; icon: string; label: string; className: string }> = [
        { key: 'optimal', icon: '✅', label: isEn ? 'Optimal' : 'Optimaux', className: 'border-white/10 bg-emerald-500/10 text-emerald-300' },
        { key: 'good', icon: '👍', label: isEn ? 'Good' : 'Bons', className: 'border-white/10 bg-[#d4af37]/10 text-[#fce8b2]' },
        { key: 'inaccuracy', icon: '⚠️', label: isEn ? 'Inaccuracies' : 'Imprécisions', className: 'border-white/10 bg-amber-500/10 text-amber-300' },
        { key: 'blunder', icon: '❌', label: isEn ? 'Blunders' : 'Blunders', className: 'border-white/10 bg-rose-500/15 text-rose-300' },
    ];

    return (
        <section
            data-testid="post-match-header"
            aria-label={isEn ? 'Result and PR comparison' : 'Résultat et comparatif PR'}
            className="rounded-2xl border border-[#d4af37]/30 bg-[#120e0b] p-4 space-y-3 shadow-2xl"
        >
            {/* Haut (Duel) : Médaillon Octogonal Gauche - Guichets Grande Date Horlogers - Médaillon Octogonal Droite */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#d4af37]/20">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                        <BotPortraitMedallion character="player" size="md" isActive={isPlayerWinner} />
                        {isPlayerWinner && (
                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-[#f5dfa0] bg-gradient-to-r from-[#d4af37] to-[#b88924] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#090806] shadow">
                                {isEn ? 'Winner' : 'Gagnant'}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h2 className="truncate font-display text-base italic font-bold text-[#f7f3e8]">
                            {isPlayerWinner ? (isEn ? 'You won!' : 'Victoire !') : (isEn ? 'Defeat' : 'Défaite')}
                        </h2>
                        <p className="text-[11px] text-stone-400">{isEn ? 'Member' : 'Vous'}</p>
                    </div>
                </div>

                {/* Deux Guichets Grande Date Horlogers [ scoreX ] - [ scoreO ] */}
                <div className="flex flex-col items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex h-11 w-10 items-center justify-center rounded-xl border-2 border-[#d4af37] bg-gradient-to-b from-[#f7f3e8] to-[#dfd3b8] font-display text-xl font-bold text-[#090806] shadow tabular-nums">
                            {scoreX}
                        </div>
                        <span className="font-mono text-base font-black text-[#d4af37]">-</span>
                        <div className="flex h-11 w-10 items-center justify-center rounded-xl border-2 border-[#d4af37]/65 bg-gradient-to-b from-[#1a1510] to-[#090705] font-display text-xl font-bold text-[#f7f3e8] shadow tabular-nums">
                            {scoreO}
                        </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                        {winInfo && (
                            <span data-testid="post-match-win-type" className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${winInfo.className}`}>
                                <span aria-hidden="true">{winInfo.icon}</span>
                                <span>{isEn ? winInfo.en : winInfo.fr}</span>
                            </span>
                        )}
                        <span data-testid="post-match-points-won" className="rounded-full border border-[#d4af37]/40 bg-[#1a140e] px-2 py-0.5 font-mono text-[10px] font-bold text-[#f3d27a]">
                            +{pointsWon} {pointsWon > 1 ? 'pts' : 'pt'}
                        </span>
                        {matchLength > 0 ? (
                            <span className="text-[10px] font-medium text-stone-400">/{matchLength}</span>
                        ) : (
                            <span className="text-[10px] font-medium text-[#d4af37]">(Money)</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
                    <div className="min-w-0">
                        <h2 className="truncate font-display text-base italic font-bold text-[#f7f3e8]">
                            {!isPlayerWinner ? (isEn ? 'Winner' : 'Victoire') : (isEn ? 'Defeat' : 'Défaite')}
                        </h2>
                        <p className="text-[11px] text-stone-400">{isEn ? 'Master IA' : 'Maître IA'}</p>
                    </div>
                    <div className="relative shrink-0">
                        <BotPortraitMedallion character="grandmaster" size="md" isActive={!isPlayerWinner} />
                        {!isPlayerWinner && (
                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-[#f5dfa0] bg-gradient-to-r from-[#d4af37] to-[#b88924] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#090806] shadow">
                                {isEn ? 'Winner' : 'Gagnant'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bloc 1 — Taux d'erreur */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 rounded-2xl border border-[#d4af37]/20 bg-[#18130e] p-3 shadow-md">
                <div
                    data-testid="post-match-pr-player"
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowPrSplit((v) => !v)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPrSplit((v) => !v); } }}
                    title="Toucher pour ventiler PR-Positional vs PR-Cube"
                    className="flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#120e0a]/90 p-2 cursor-pointer transition hover:border-[#d4af37]/40 text-center"
                >
                    <span className="sr-only">Votre PR</span>
                    <span className="text-xl font-mono font-black text-emerald-400">{playerPr.toFixed(2)}</span>
                    <span className="truncate text-xs font-semibold text-stone-300">{playerCategory}</span>
                    {showPrSplit && (
                        <div data-testid="post-match-pr-split" className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#d4af37]/15 pt-1 font-mono text-[10px] text-amber-200">
                            <span>Dames : <strong>{(checkerPr ?? playerPr).toFixed(2)}</strong></span>
                            <span>·</span>
                            <span>Videau : <strong>{(cubePr ?? 0).toFixed(2)}</strong></span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center px-1 text-center">
                    <svg className="h-5 w-5 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9.5" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /><circle cx="12" cy="12" r="2.5" />
                    </svg>
                    <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-stone-300">
                        {isEn ? 'Performance PR' : 'Indice PR (XG)'}
                    </span>
                </div>

                <div data-testid="post-match-pr-bot" className="flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#120e0a]/90 p-2 text-center">
                    <span className="sr-only">PR du Bot</span>
                    <span className="text-xl font-mono font-black text-[#f3d27a]">
                        {botPr !== null && Number.isFinite(botPr) ? botPr.toFixed(2) : '--'}
                    </span>
                    <span className="truncate text-xs font-semibold text-stone-300">
                        {botCategory ?? (isEn ? 'Master' : 'Maître')}
                    </span>
                </div>
            </div>

            {/* Bloc 2 — Variance des Dés */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-[#d4af37]/20 bg-[#18130e] p-3 shadow-md">
                <div className="flex items-center px-1">
                    <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-rose-400 via-[#d4af37] to-emerald-400">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#f7f3e8] bg-[#120e0a]" />
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center px-2 text-center">
                    <span className="font-display text-sm italic font-bold text-[#f3d27a]" aria-hidden="true">±σ</span>
                    <span className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-stone-300">
                        {isEn ? 'Dice Variance' : 'Variance Dés'}
                    </span>
                </div>
                <div className="flex items-center px-1">
                    <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-rose-400 via-[#d4af37] to-emerald-400">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#f7f3e8] bg-[#120e0a]" />
                    </div>
                </div>
            </div>

            {/* Bloc 3 — Performance */}
            <div className="rounded-2xl border border-[#d4af37]/20 bg-[#18130e] p-3 space-y-2 shadow-md">
                <div className="grid grid-cols-3 items-center text-center">
                    <span className="font-mono text-sm font-black text-emerald-400">{playerPr.toFixed(2)}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{isEn ? 'Error rate' : "Taux d'erreur"}</span>
                    <span className="font-mono text-sm font-black text-[#f3d27a]">{botPr !== null && Number.isFinite(botPr) ? botPr.toFixed(2) : '--'}</span>
                </div>
                <div className="grid grid-cols-3 items-center text-center border-t border-[#d4af37]/10 pt-1.5">
                    <span className="truncate text-xs font-semibold text-[#f7f3e8]">{playerCategory}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">{isEn ? 'Skill level' : 'Rang Cercle'}</span>
                    <span className="truncate text-xs font-semibold text-[#f7f3e8]">{botCategory ?? (isEn ? 'Master' : 'Maître')}</span>
                </div>
            </div>

            {/* Bilan chiffré des 4 paliers */}
            <div className="grid grid-cols-4 gap-1.5">
                {cells.map((cell) => (
                    <div key={cell.key} data-testid={`post-match-counter-${cell.key}`} className={`flex flex-col items-center rounded-lg border px-1.5 py-1.5 ${cell.className}`}>
                        <span aria-hidden="true" className="text-xs leading-none">{cell.icon}</span>
                        <span className="mt-0.5 font-mono text-sm font-black leading-none">{counters[cell.key]}</span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">{cell.label}</span>
                    </div>
                ))}
            </div>

            {/* Perte d'équité totale & Précision */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e8dcc6]/70">
                        {isEn ? 'Total equity lost' : 'Perte d’équité totale'}
                    </span>
                    <span data-testid="post-match-total-equity-loss" className="font-mono text-xs font-bold text-rose-300">
                        -{totalEquityLoss.toFixed(3)}
                    </span>
                </div>
                {accuracyPercent !== undefined && (
                    <div className="flex items-center gap-1.5" data-testid="post-match-accuracy">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e8dcc6]/70">
                            {isEn ? 'Accuracy' : 'Précision'}
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-300">
                            {accuracyPercent.toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Bouclier d'Ego Post-Défaite */}
            {winner === 'O' && (
                <div data-testid="post-match-ego-shield" className="rounded-xl border border-amber-400/35 bg-[#1e1208]/90 px-3 py-2 text-xs text-[#fce8b2]">
                    {counters.blunder <= 1
                        ? (isEn ? `🎲 The dice favored your opponent on this game, but your decision quality (${counters.blunder} blunder) held strong!` : `🎲 Les dés ont favorisé votre adversaire sur cette manche, mais votre qualité de jeu (${counters.blunder} blunder) était au rendez-vous !`)
                        : (isEn ? `🎲 Tough dice on this game! Fixing just ${counters.blunder} key turn(s) below will turn the next match around.` : `🎲 Les dés étaient capricieux sur cette manche ! En corrigeant vos ${counters.blunder} décisions clés ci-dessous, vous inverserez la tendance au prochain match.`)}
                </div>
            )}
        </section>
    );
};

export const PostMatchHeader = React.memo(PostMatchHeaderComponent);
export default PostMatchHeader;
