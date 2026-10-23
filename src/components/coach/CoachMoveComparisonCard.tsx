'use client';

/**
 * Carte Verdict & Comparaison des coups — style eXtreme Gammon / Snowie.
 *
 * Rôle :
 *   - Bandeau de verdict immédiat à 4 niveaux :
 *       ✅ COUP OPTIMAL / 👍 BON COUP / ⚠️ IMPRÉCISION (-0.045) / ❌ BLUNDER MAJEUR (-0.142)
 *   - Deux boîtes côte à côte : « Votre coup joué » (rouge si erreur) et
 *     « Meilleur coup Open Sage » (émeraude), en notation ABSOLUE complète
 *     (1..24) issue de `coachMoveNotation.ts`, sans aucune troncature.
 *   - Bouton d'entraînement immédiat « ⏪ Rejouer ce tour sur le plateau ».
 *
 * Composant 100 % muet (LOI 5) : le verdict est dérivé de `equityLoss` via les
 * seuils officiels du cahier des charges (0.010 / 0.020 / 0.080).
 *
 * Dépendances :
 *   Aucune (présentation pure).
 *
 * Retrait :
 *   Supprimer ce fichier et son usage dans `CoachPanel.tsx`.
 */

import React from 'react';
import type { CoachDisplayVerdict } from './coachPanelHelpers';

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
                icon: '✅',
                label: isEn ? 'OPTIMAL MOVE' : 'COUP OPTIMAL',
                bannerClass: 'border-emerald-500/60 bg-emerald-950/50',
                textClass: 'text-emerald-300',
                playedClass: 'border-emerald-800/60 bg-emerald-950/25',
            };
        case 'good':
            return {
                icon: '👍',
                label: isEn ? 'GOOD MOVE' : 'BON COUP',
                bannerClass: 'border-cyan-500/60 bg-cyan-950/50',
                textClass: 'text-cyan-300',
                playedClass: 'border-cyan-800/60 bg-cyan-950/25',
            };
        case 'inaccuracy':
            return {
                icon: '⚠️',
                label: isEn ? 'INACCURACY' : 'IMPRÉCISION',
                bannerClass: 'border-amber-500/60 bg-amber-950/50',
                textClass: 'text-amber-300',
                playedClass: 'border-amber-800/60 bg-amber-950/25',
            };
        default:
            return {
                icon: '❌',
                label: isEn ? 'MAJOR BLUNDER' : 'BLUNDER MAJEUR',
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
}: CoachMoveComparisonCardProps) {
    if (!verdict) return null;

    const isEn = locale === 'en';
    const tier = classifyDecisionTier(equityLoss);
    const style = getTierStyle(tier, isEn);
    const isError = tier === 'inaccuracy' || tier === 'blunder';
    const formattedLoss = equityLoss !== null ? Math.abs(equityLoss).toFixed(3) : null;

    // Le bandeau n'affiche la perte que pour les paliers non optimaux.
    const bannerLabel =
        tier === 'optimal' || tier === 'good' || !formattedLoss
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

            {/* 2. Comparaison côte à côte */}
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
                            <span>{isEn ? 'Best move (Open Sage)' : 'Meilleur coup Open Sage'}</span>
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

            {/* 3. Résumé d'accroche */}
            {summary && (
                <p className="px-1 text-[11px] leading-relaxed text-slate-300">{summary}</p>
            )}

            {/* 4. Bouton d'entraînement immédiat */}
            {onReplayMove && (
                <button
                    type="button"
                    onClick={onReplayMove}
                    data-testid="coach-replay-move-btn"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98]"
                >
                    <span aria-hidden="true">⏪</span>
                    <span>{isEn ? 'Replay this turn on the board' : 'Rejouer ce tour sur le plateau'}</span>
                </button>
            )}
        </div>
    );
}

export default React.memo(CoachMoveComparisonCard);
