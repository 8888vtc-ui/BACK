'use client';

/**
 * Carte Verdict & Comparaison des coups — style eXtreme Gammon / Snowie (< 300 lignes, 0 any).
 * Intègre le bouton viral `ShareBlunderButton` ("Partager ce Quiz (HD)" 1200x630).
 */

import React from 'react';
import type { CoachDisplayVerdict } from './coachPanelHelpers';
import ShareBlunderButton from '../share/ShareBlunderButton';

const DEFAULT_SHARE_BOARD: ReadonlyArray<number> = Object.freeze([
    0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
]);

export interface CoachMoveComparisonCardProps {
    verdict: CoachDisplayVerdict | null;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    summary?: string | null;
    onReplayMove?: () => void;
    onClose?: () => void;
    locale?: string;
    board?: ReadonlyArray<number>;
    dice?: [number, number] | null;
    keyConcept?: string | null;
}

/** Palier de décision dérivé de la perte d'équité. */
export type DecisionTier = 'optimal' | 'good' | 'inaccuracy' | 'blunder';

/** Seuils officiels (exigence 3.3 du cahier des charges). */
export const DECISION_THRESHOLDS = {
    OPTIMAL: 0.01,
    GOOD: 0.02,
    BLUNDER: 0.08,
} as const;

/**
 * Classe une perte d'équité dans l'un des 4 paliers.
 * `≤ 0.010` optimal · `≤ 0.020` bon · `≤ 0.080` imprécision · `> 0.080` blunder.
 */
export function classifyDecisionTier(equityLoss: number | null): DecisionTier {
    const loss = Math.abs(equityLoss ?? 0);
    if (loss <= DECISION_THRESHOLDS.OPTIMAL) return 'optimal';
    if (loss <= DECISION_THRESHOLDS.GOOD) return 'good';
    if (loss <= DECISION_THRESHOLDS.BLUNDER) return 'inaccuracy';
    return 'blunder';
}

interface TierStyle {
    icon: string;
    label: string;
    subtitle: string;
    /** Classes du bandeau de verdict. */
    bannerClass: string;
    /** Classes du texte du bandeau. */
    textClass: string;
    /** Classes de l'encadré du coup joué. */
    playedClass: string;
}

/** Style visuel de chaque palier. */
export function getTierStyle(tier: DecisionTier, isEn: boolean): TierStyle {
    switch (tier) {
        case 'optimal':
            return {
                icon: '🟢',
                label: isEn ? 'OPTIMAL MOVE' : 'COUP OPTIMAL',
                subtitle: isEn
                    ? '🎯 Master move! Exactly the champion’s choice.'
                    : '🎯 Coup de Maître ! Exactement le choix du champion.',
                bannerClass: 'border-emerald-500/60 bg-emerald-950/50',
                textClass: 'text-emerald-300',
                playedClass: 'border-emerald-800/60 bg-emerald-950/25',
            };
        case 'good':
            return {
                icon: '👍',
                label: isEn ? 'GOOD MOVE' : 'BON COUP',
                subtitle: isEn
                    ? '👏 Very solid! Your position stays healthy.'
                    : '👏 Très solide ! Votre position reste saine.',
                bannerClass: 'border-emerald-500/50 bg-emerald-950/40',
                textClass: 'text-emerald-200',
                playedClass: 'border-emerald-800/50 bg-emerald-950/20',
            };
        case 'inaccuracy':
            return {
                icon: '🟡',
                label: isEn ? 'INACCURACY' : 'IMPRÉCISION',
                subtitle: isEn
                    ? '💡 Small room for improvement: check the green arrows.'
                    : '💡 Petite piste de progrès : observez les flèches vertes.',
                bannerClass: 'border-amber-500/60 bg-amber-950/50',
                textClass: 'text-amber-300',
                playedClass: 'border-amber-800/60 bg-amber-950/25',
            };
        default:
            return {
                icon: '🔴',
                label: isEn ? 'MAJOR BLUNDER' : 'BLUNDER MAJEUR',
                subtitle: isEn
                    ? '⚡ Match turning point! Tap Replay below to try again.'
                    : '⚡ Tournant du match ! Rejouez ce tour pour trouver la parade.',
                bannerClass: 'border-rose-500/60 bg-rose-950/50',
                textClass: 'text-rose-300',
                playedClass: 'border-rose-800/60 bg-rose-950/25',
            };
    }
}

export function CoachMoveComparisonCard({
    verdict,
    equityLoss,
    playedMove,
    optimalMove,
    whyFailed,
    whyOptimal,
    summary,
    onReplayMove,
    onClose,
    locale = 'fr',
    board,
    dice,
    keyConcept,
}: CoachMoveComparisonCardProps) {
    if (!verdict) return null;

    const isEn = locale === 'en';
    const tier = classifyDecisionTier(equityLoss);
    const style = getTierStyle(tier, isEn);
    const isError = tier === 'inaccuracy' || tier === 'blunder';
    const formattedLoss = equityLoss !== null ? Math.abs(equityLoss).toFixed(3) : null;
    const prImpact = equityLoss !== null ? (Math.abs(equityLoss) * 500).toFixed(1) : null;

    // Affiche la perte d'équité exacte dès qu'elle atteint 0.001 (calibrage PR 1–5).
    const hasMicroLoss = equityLoss !== null && Math.abs(equityLoss) >= 0.001;
    const bannerLabel =
        !formattedLoss || (!hasMicroLoss && (tier === 'optimal' || tier === 'good'))
            ? style.label
            : `${style.label} (-${formattedLoss})`;

    return (
        <div
            className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 space-y-2.5 shadow-lg"
            data-testid="coach-move-comparison-card"
        >
            {/* 1. Bandeau de verdict immédiat */}
            <div
                data-testid="coach-verdict-banner"
                data-tier={tier}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${style.bannerClass}`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span aria-hidden="true" className="text-base shrink-0">
                        {style.icon}
                    </span>
                    <span
                        className={`truncate text-xs sm:text-sm font-black uppercase tracking-wide ${style.textClass}`}
                    >
                        {bannerLabel}
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {tier === 'blunder' && prImpact && (
                        <span
                            data-testid="coach-blunder-pr-impact"
                            className="rounded bg-rose-900/70 border border-rose-500/50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-rose-200"
                        >
                            PR +{prImpact}
                        </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-400">
                        {isEn ? 'White (X)' : 'Blanc (X)'}
                    </span>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded px-1 text-xs text-slate-400 transition hover:text-white"
                            title={isEn ? 'Dismiss analysis' : 'Masquer cette analyse'}
                            aria-label={isEn ? 'Dismiss analysis' : "Fermer l'analyse"}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* 1b. Accroche unique (résumé analytique si disponible, sinon accroche du palier) */}
            <p
                data-testid="coach-playful-subtitle"
                className="px-1 text-[11px] font-semibold leading-relaxed text-slate-200"
            >
                {summary || style.subtitle}
            </p>

            {/* 2. Comparaison côte à côte (ou carte unifiée si le coup joué est exactement le coup optimal) */}
            {playedMove && optimalMove && playedMove.trim() === optimalMove.trim() ? (
                <div
                    className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-2.5 space-y-1 ring-1 ring-inset ring-emerald-500/20"
                    data-testid="coach-optimal-move-card"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                            <span aria-hidden="true">⭐</span>
                            <span>{isEn ? 'Your move = Best Monte-Carlo move' : 'Votre coup = Meilleur coup Monte-Carlo'}</span>
                        </span>
                    </div>
                    <div
                        className="break-words font-mono text-sm sm:text-base font-black leading-snug text-emerald-100"
                        title={optimalMove}
                    >
                        {optimalMove}
                    </div>
                    {(whyOptimal || whyFailed) && (
                        <p className="border-t border-emerald-900/40 pt-1 text-[10px] leading-snug text-emerald-200/90">
                            {whyOptimal || whyFailed}
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Votre coup joué */}
                    {playedMove && (
                        <div
                            className={`rounded-xl border p-2.5 space-y-1 ${style.playedClass}`}
                            data-testid="coach-played-move-card"
                        >
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                <span aria-hidden="true">{isError ? '❌' : '🎯'}</span>
                                <span>{isEn ? 'Your move' : 'Votre coup joué'}</span>
                            </span>
                            <div
                                className="break-words font-mono text-sm sm:text-base font-black leading-snug text-white"
                                title={playedMove}
                            >
                                {playedMove}
                            </div>
                            {whyFailed && (
                                <p className="border-t border-slate-700/50 pt-1 text-[10px] leading-snug text-slate-300">
                                    {whyFailed}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Meilleur coup Open Sage */}
                    {optimalMove && (
                        <div
                            className="rounded-xl border border-emerald-700/60 bg-emerald-950/30 p-2.5 space-y-1 ring-1 ring-inset ring-emerald-500/20"
                            data-testid="coach-optimal-move-card"
                        >
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                <span aria-hidden="true">⭐</span>
                                <span>{isEn ? 'Best move (Monte-Carlo)' : 'Meilleur coup Monte-Carlo'}</span>
                            </span>
                            <div
                                className="break-words font-mono text-sm sm:text-base font-black leading-snug text-emerald-100"
                                title={optimalMove}
                            >
                                {optimalMove}
                            </div>
                            {whyOptimal && (
                                <p className="border-t border-emerald-900/40 pt-1 text-[10px] leading-snug text-emerald-200/90">
                                    {whyOptimal}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Actions : Rejouer ce tour + Partage Viral HD */}
            {(onReplayMove || (isError && optimalMove)) && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    {onReplayMove && (
                        <button
                            type="button"
                            onClick={onReplayMove}
                            data-testid="coach-replay-move-btn"
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
                        >
                            <span aria-hidden="true">⏪</span>
                            <span>{isEn ? 'Replay this turn on the board' : 'Rejouer ce tour sur le plateau'}</span>
                        </button>
                    )}
                    {isError && optimalMove && (
                        <ShareBlunderButton
                            data={{
                                board: board && board.length >= 26 ? board : DEFAULT_SHARE_BOARD,
                                dice: dice && dice.length === 2 ? [dice[0], dice[1]] : [6, 5],
                                bestMoveNotation: optimalMove,
                                playedMoveNotation: playedMove ?? undefined,
                                equityLoss: equityLoss ?? undefined,
                                keyConcept: keyConcept ?? undefined,
                                locale,
                            }}
                            variant="full"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default React.memo(CoachMoveComparisonCard);
