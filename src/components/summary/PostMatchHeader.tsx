'use client';

/**
 * Section 1 du Rapport de Formation — En-tête de résultat & comparatif PR.
 *
 * Rôle :
 *   - Score final et type de victoire (Simple / Gammon / Backgammon).
 *   - Comparaison côte à côte : Votre PR Final & Niveau vs PR du Bot.
 *   - Bilan chiffré des 4 paliers + perte d'équité totale.
 *
 * Composant 100 % muet (LOI 5).
 *
 * Dépendances :
 *   `postMatchReportHelpers` (types uniquement).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `PostMatchTrainingReport.tsx`.
 */

import React from 'react';
import type { DecisionCountersSummary } from './postMatchReportHelpers';

export interface PostMatchHeaderProps {
    /** Vainqueur de la manche. */
    winner: 'X' | 'O' | null;
    /** Type de victoire. */
    winType: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    /** Points remportés. */
    pointsWon: number;
    /** Score du joueur X. */
    scoreX: number;
    /** Score du joueur O. */
    scoreO: number;
    /** Longueur du match (0 = money game). */
    matchLength: number;
    /** PR final du joueur. */
    playerPr: number;
    /** Catégorie de niveau du joueur. */
    playerCategory: string;
    /** PR du bot (null si indisponible). */
    botPr: number | null;
    /** Catégorie de niveau du bot. */
    botCategory?: string | null;
    /** Compteurs des 4 paliers. */
    counters: DecisionCountersSummary;
    /** Perte d'équité totale. */
    totalEquityLoss: number;
    /** Taux de précision global (0–100 %, optionnel). */
    accuracyPercent?: number;
    /** Langue d'affichage. */
    locale?: string;
}

const WIN_TYPE_LABELS: Record<string, { fr: string; en: string; icon: string; className: string }> = {
    single: {
        fr: 'Victoire simple',
        en: 'Single win',
        icon: '⚡',
        className: 'border-[#d4af37]/50 bg-[#2a1a0d]/80 text-[#fce8b2]',
    },
    gammon: {
        fr: 'Gammon (2x)',
        en: 'Gammon (2x)',
        icon: '🎉',
        className: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300',
    },
    backgammon: {
        fr: 'Backgammon (3x)',
        en: 'Backgammon (3x)',
        icon: '👑',
        className: 'border-amber-400/70 bg-amber-950/60 text-amber-200',
    },
    pass: {
        fr: 'Abandon du videau',
        en: 'Cube pass',
        icon: '🏳️',
        className: 'border-[#d4af37]/60 bg-[#331e10]/80 text-[#f3c65f]',
    },
};

/** Couleur du PR selon le niveau (aligné sur les seuils XG). */
function prColor(pr: number): string {
    if (pr <= 2.5) return 'text-emerald-300';
    if (pr <= 5.0) return 'text-green-300';
    if (pr <= 8.5) return 'text-[#f3c65f]';
    if (pr <= 13.0) return 'text-amber-300';
    return 'text-rose-300';
}

const PostMatchHeaderComponent: React.FC<PostMatchHeaderProps> = ({
    winner,
    winType,
    pointsWon,
    scoreX,
    scoreO,
    matchLength,
    playerPr,
    playerCategory,
    botPr,
    botCategory,
    counters,
    totalEquityLoss,
    accuracyPercent,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
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
            className="rounded-2xl border border-white/10 bg-[#0d0704]/90 p-4 space-y-3 shadow-[inset_0_1px_0_rgba(255,245,205,0.08)]"
        >
            {/* Score final + type de victoire */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="text-2xl">
                        {isPlayerWinner ? '🏆' : '🎖️'}
                    </span>
                    <div>
                        <h2 className="font-serif text-base font-black tracking-tight text-[#fdf8eb]">
                            {isPlayerWinner
                                ? isEn ? 'You won this game!' : 'Manche remportée !'
                                : isEn ? 'Game lost' : 'Manche perdue'}
                        </h2>
                        <p className="text-xs text-[#e8dcc6]/70">
                            {isEn ? 'Final score' : 'Score final'} :{' '}
                            <span className="font-mono font-bold text-[#f3c65f]">
                                {scoreX} – {scoreO}
                            </span>
                            {matchLength > 0 ? (
                                <span className="text-[#e8dcc6]/50"> / {matchLength}</span>
                            ) : (
                                <span className="ml-1 text-[#d4af37]/70">(Money Game)</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {winInfo && (
                        <span
                            data-testid="post-match-win-type"
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${winInfo.className}`}
                        >
                            <span aria-hidden="true">{winInfo.icon}</span>
                            <span>{isEn ? winInfo.en : winInfo.fr}</span>
                        </span>
                    )}
                    <span
                        data-testid="post-match-points-won"
                        className="rounded-full border border-white/10 bg-[#1e120a] px-2.5 py-1 font-mono text-[11px] font-bold text-[#f3c65f]"
                    >
                        +{pointsWon} {pointsWon > 1 ? 'pts' : 'pt'}
                    </span>
                </div>
            </div>

            {/* Comparatif PR */}
            <div className="grid grid-cols-2 gap-2">
                <div
                    data-testid="post-match-pr-player"
                    className="rounded-xl border border-white/10 bg-[#1c1008]/90 p-2.5"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#f3c65f]">
                        {isEn ? 'Your PR' : 'Votre PR'}
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className={`font-mono text-xl font-black ${prColor(playerPr)}`}>
                            {playerPr.toFixed(2)}
                        </span>
                        <span className="truncate text-xs font-semibold text-[#e8dcc6]/85">
                            {playerCategory}
                        </span>
                    </div>
                </div>

                <div
                    data-testid="post-match-pr-bot"
                    className="rounded-xl border border-white/10 bg-[#140b06]/80 p-2.5"
                >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e8dcc6]/70">
                        {isEn ? 'Bot PR' : 'PR du Bot'}
                    </span>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="font-mono text-xl font-black text-[#fdf8eb]">
                            {botPr !== null && Number.isFinite(botPr) ? botPr.toFixed(2) : '--'}
                        </span>
                        {botCategory && (
                            <span className="truncate text-xs font-semibold text-[#e8dcc6]/65">
                                {botCategory}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Bilan chiffré des 4 paliers */}
            <div className="grid grid-cols-4 gap-1.5">
                {cells.map((cell) => (
                    <div
                        key={cell.key}
                        data-testid={`post-match-counter-${cell.key}`}
                        className={`flex flex-col items-center rounded-lg border px-1.5 py-1.5 ${cell.className}`}
                    >
                        <span aria-hidden="true" className="text-xs leading-none">
                            {cell.icon}
                        </span>
                        <span className="mt-0.5 font-mono text-sm font-black leading-none">
                            {counters[cell.key]}
                        </span>
                        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-90">
                            {cell.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Perte d'équité totale & Précision */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#e8dcc6]/70">
                        {isEn ? 'Total equity lost' : 'Perte d’équité totale'}
                    </span>
                    <span
                        data-testid="post-match-total-equity-loss"
                        className="font-mono text-xs font-bold text-rose-300"
                    >
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
        </section>
    );
};

/** Composant mémoïsé : ne re-rend que si ses props changent. */
export const PostMatchHeader = React.memo(PostMatchHeaderComponent);
export default PostMatchHeader;
