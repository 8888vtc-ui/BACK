'use client';

/**
 * Section 1 du Rapport de Formation — En-tête de résultat & comparatif PR (Style Galaxy Match Report).
 * Loi 1 : En Mode Invité (`isGuest === true`), masque la perte EMG cumulée, la répartition des 4 paliers
 * et le PR, et affiche uniquement le score final + l'encadré de verrouillage Invité (Clause CGU §4).
 * Strictement 0 `any`, < 245 lignes, 0 classe text-[8px] / text-[9px].
 */

import React from 'react';
import type { DecisionCountersSummary } from './postMatchReportHelpers';
import { BotPortraitMedallion } from '../common/MonteCarloIcons';
import { usePlayerTierGate } from '../../hooks/usePlayerTierGate';
import { useAuthenticPlayerStats } from '../../hooks/useAuthenticPlayerStats';
import { openTermsAndPrPolicyModal } from '../legal/TermsAndPrPolicyModal';

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

const WIN_TYPE_LABELS: Record<string, { fr: string; en: string; className: string }> = {
    single: { fr: 'Victoire simple', en: 'Single win', className: 'border-[#d4af37]/50 bg-[#2a1a0d]/80 text-[#fce8b2]' },
    gammon: { fr: 'Gammon (2x)', en: 'Gammon (2x)', className: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
    backgammon: { fr: 'Backgammon (3x)', en: 'Backgammon (3x)', className: 'border-amber-400/70 bg-amber-950/60 text-amber-200' },
    pass: { fr: 'Abandon du videau', en: 'Cube pass', className: 'border-[#d4af37]/60 bg-[#331e10]/80 text-[#f3c65f]' },
};

const PostMatchHeaderComponent: React.FC<PostMatchHeaderProps> = ({
    winner, winType, pointsWon, scoreX, scoreO, matchLength, playerPr,
    playerCategory, botPr, botCategory, counters, totalEquityLoss,
    accuracyPercent, checkerPr, cubePr, locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const { tierGate } = usePlayerTierGate();
    const stats = useAuthenticPlayerStats();
    const isGuest = !stats.canHavePR;
    const isBeginner = tierGate === 'BEGINNER';
    const [showPrSplit, setShowPrSplit] = React.useState(false);
    const isPlayerWinner = winner === 'X';
    const winInfo = winType ? WIN_TYPE_LABELS[winType] : null;

    const cells: Array<{ key: keyof DecisionCountersSummary; label: string; className: string }> = [
        { key: 'optimal', label: isEn ? 'Optimal' : 'Optimaux', className: 'border-white/10 bg-emerald-500/10 text-emerald-300' },
        { key: 'good', label: isEn ? 'Good' : 'Bons', className: 'border-white/10 bg-[#d4af37]/10 text-[#fce8b2]' },
        { key: 'inaccuracy', label: isEn ? 'Inaccuracies' : 'Imprécisions', className: 'border-white/10 bg-amber-500/10 text-amber-300' },
        { key: 'blunder', label: isEn ? 'Blunders' : 'Blunders', className: 'border-white/10 bg-rose-500/15 text-rose-300' },
    ];

    return (
        <section
            data-testid="post-match-header"
            aria-label={isEn ? 'Result and PR comparison' : 'Résultat et comparatif PR'}
            className="rounded-2xl border border-[#d4af37]/30 bg-[#120e0b] p-4 space-y-3 shadow-2xl"
        >
            {/* Haut (Duel) : Score final symétrique */}
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
                        <p className="text-[11px] text-stone-400">{isGuest ? (isEn ? 'Guest Player' : 'Joueur Invité') : (isEn ? 'Member' : 'Vous')}</p>
                    </div>
                </div>

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
                        <p className="text-[11px] text-stone-400">
                            {isBeginner ? (isEn ? 'Opponent' : 'Adversaire') : (isEn ? 'Master IA' : 'Maître IA')}
                        </p>
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

            {isGuest ? (
                <div
                    data-testid="post-match-guest-lock-box"
                    className="rounded-2xl border border-[#d4af37]/30 bg-[#18130e] p-4 space-y-3 shadow-md text-center"
                >
                    <div data-testid="post-match-pr-player" className="rounded-xl border border-[#d4af37]/15 bg-[#120e0a]/90 p-3">
                        <p className="font-mono text-xs sm:text-sm font-black text-amber-300">
                            {isEn
                                ? 'Match History, PR Analysis & Blunders Locked in Guest Mode (Account Required — ToS §4)'
                                : 'Historique, Analyse PR & Blunders verrouillés en Mode Invité (Compte requis — Clause CGU §4)'}
                        </p>
                        <p className="mt-1 text-xs text-stone-300">
                            {isEn
                                ? 'In Guest Mode, you can freely play games. Sign in or create your free account to unlock your PR, save your match history and review your blunders.'
                                : 'En mode Invité, vous pouvez jouer librement des parties. Connectez-vous ou créez votre compte gratuit pour activer votre PR, sauvegarder votre historique et corriger vos blunders.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        data-testid="post-match-guest-activate-pr-btn"
                        onClick={openTermsAndPrPolicyModal}
                        className="w-full rounded-xl bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-md hover:brightness-105 transition"
                    >
                        {isEn
                            ? 'CREATE MY FREE ACCOUNT / SIGN IN TO UNLOCK MY PR & HISTORY →'
                            : 'SE CONNECTER / CRÉER MON COMPTE GRATUIT POUR ACTIVER MON PR →'}
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 rounded-2xl border border-[#d4af37]/20 bg-[#18130e] p-3 shadow-md">
                        <div
                            data-testid="post-match-pr-player"
                            role="button"
                            tabIndex={0}
                            onClick={() => setShowPrSplit((v) => !v)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPrSplit((v) => !v); } }}
                            title={isBeginner ? undefined : 'Toucher pour ventiler PR-Positional vs PR-Cube'}
                            className="flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#120e0a]/90 p-2 cursor-pointer transition hover:border-[#d4af37]/40 text-center"
                        >
                            <span className="sr-only">Votre Précision</span>
                            <span className="font-mono font-black text-xl text-emerald-400">
                                {isBeginner ? `${(accuracyPercent ?? 85).toFixed(0)}%` : playerPr.toFixed(2)}
                            </span>
                            <span className="truncate text-xs font-semibold text-stone-300">
                                {isBeginner ? (isEn ? 'Good moves' : 'Bons coups') : playerCategory}
                            </span>
                            {showPrSplit && (
                                <div data-testid="post-match-pr-split" className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#d4af37]/15 pt-1 font-mono text-[10px] text-amber-200">
                                    <span>Dames : <strong>{(checkerPr ?? playerPr).toFixed(2)}</strong></span>
                                    <span>·</span>
                                    <span>Videau : <strong>{(cubePr ?? 0).toFixed(2)}</strong></span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-center justify-center px-1 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
                                {isBeginner ? (isEn ? 'Match Accuracy' : 'Précision du Match') : (isEn ? 'Performance PR' : 'Indice PR (XG)')}
                            </span>
                        </div>

                        <div data-testid="post-match-pr-bot" className="flex flex-col items-center justify-center rounded-xl border border-[#d4af37]/15 bg-[#120e0a]/90 p-2 text-center">
                            <span className="sr-only">Niveau Adversaire</span>
                            <span className="text-xl font-mono font-black text-[#f3d27a]">
                                {botPr !== null && Number.isFinite(botPr) ? botPr.toFixed(2) : '--'}
                            </span>
                            <span className="truncate text-xs font-semibold text-stone-300">
                                {botCategory ?? (isEn ? 'Master' : 'Maître')}
                            </span>
                        </div>
                    </div>

                    {!isBeginner && (
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
                    )}

                    <div className="grid grid-cols-4 gap-1.5">
                        {cells.map((cell) => (
                            <div key={cell.key} data-testid={`post-match-counter-${cell.key}`} className={`flex flex-col items-center rounded-lg border px-1.5 py-1.5 ${cell.className}`}>
                                <span className="mt-0.5 font-mono text-sm font-black leading-none">{counters[cell.key]}</span>
                                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">{cell.label}</span>
                            </div>
                        ))}
                    </div>

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
                </>
            )}
        </section>
    );
};

export const PostMatchHeader = React.memo(PostMatchHeaderComponent);
export default PostMatchHeader;
