'use client';

/**
 * Carte comparative visuelle des coups du Coach (Coup joué vs Meilleur coup).
 *
 * Résout le problème de clarté pour les joueurs :
 * - Explique clairement ce que signifie "Douteux" ou "Blunder" sans jargon ni chiffres cryptiques.
 * - Met en vis-à-vis direct le coup joué par le joueur et le coup recommandé par le moteur IA.
 * - Indique clairement le défaut du coup joué et le bénéfice du coup optimal.
 *
 * Conforme SCALABILITY.md (< 300 lignes, composant isolé et mémoïsé).
 */

import React from 'react';

export interface CoachMoveComparisonCardProps {
    verdict: 'doubtful' | 'blunder' | null;
    equityLoss: number | null;
    playedMove: string | null;
    optimalMove: string | null;
    whyFailed?: string | null;
    whyOptimal?: string | null;
    summary?: string | null;
    onReplayMove?: () => void;
    locale?: string;
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
    locale = 'fr',
}: CoachMoveComparisonCardProps) {
    if (!verdict) return null;

    const isBlunder = verdict === 'blunder';
    const isEn = locale === 'en';

    // Intitulé explicite et compréhensible pour les joueurs
    const verdictTitle = isBlunder
        ? (isEn ? 'Major Blunder (Tactical Error)' : 'Gaffe Majeure (Blunder)')
        : (isEn ? 'Imprecise Move (Doubtful)' : 'Coup Imprécis (Douteux)');

    // Explication vulgarisée du diagnostic (pourquoi ce n'est pas optimal)
    const verdictExplanation = isBlunder
        ? (isEn
            ? 'This move significantly swings the advantage towards your opponent.'
            : 'Ce coup affaiblit lourdement votre position et donne une opportunité décisive à votre adversaire.')
        : (isEn
            ? 'Not an outright disaster, but it unnecessarily weakens your position when a much safer option existed.'
            : 'Ce coup n’est pas catastrophique, mais il fragilise votre jeu alors qu’une meilleure option existait.');

    const formattedLoss = equityLoss !== null ? Math.abs(equityLoss).toFixed(3) : null;

    return (
        <div
            className={`rounded-2xl border p-3.5 sm:p-4 space-y-3 shadow-lg transition-all ${
                isBlunder
                    ? 'border-red-500/50 bg-gradient-to-b from-red-950/40 to-slate-900/90 shadow-red-950/20'
                    : 'border-amber-500/50 bg-gradient-to-b from-amber-950/30 to-slate-900/90 shadow-amber-950/20'
            }`}
            data-testid="coach-move-comparison-card"
        >
            {/* 0. Attribution explicite du joueur analysé */}
            <div className="flex items-center justify-between text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-200">
                <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-slate-100 ring-1 ring-slate-400 shrink-0" />
                    <span>{isEn ? 'Your Move Analysis — White (X)' : 'Analyse de votre décision — Joueur Blanc (X)'}</span>
                </span>
                <span className="text-[10px] text-sky-300/80 font-mono">
                    {playedMove ? `Coup : ${playedMove}` : ''}
                </span>
            </div>

            {/* 1. En-tête de diagnostic : Titre clair + explication accessible */}
            <div className="flex flex-col gap-1 border-b border-slate-800/80 pb-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                            {isBlunder ? '🚨' : '⚠️'}
                        </span>
                        <h3
                            className={`font-black uppercase tracking-wide text-sm sm:text-base ${
                                isBlunder ? 'text-red-400' : 'text-amber-400'
                            }`}
                        >
                            {verdictTitle}
                        </h3>
                    </div>

                    {formattedLoss && (
                        <div
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold ${
                                isBlunder
                                    ? 'bg-red-950/80 text-red-300 border border-red-700/60'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                            }`}
                            title={isEn ? `Equity lost: -${formattedLoss}` : `Perte d'avantage : -${formattedLoss}`}
                        >
                            <span>ΔEq:</span>
                            <span>-{formattedLoss}</span>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-300/90 leading-relaxed pt-0.5">
                    {summary || verdictExplanation}
                </p>
            </div>

            {/* 2. Visualisation comparative côte-à-côte des deux coups */}
            {(playedMove || optimalMove) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    {/* Cartouche Coup Joué */}
                    {playedMove && (
                        <div
                            className="rounded-xl border border-red-900/50 bg-red-950/25 p-3 flex flex-col justify-between gap-2"
                            data-testid="coach-played-move-card"
                        >
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 uppercase tracking-wider">
                                    <span>❌</span>
                                    <span>{isEn ? 'Your Move' : 'Votre coup joué'}</span>
                                </span>
                                <div className="font-mono text-base sm:text-lg font-black text-red-100 bg-red-950/50 px-2 py-1 rounded-lg border border-red-900/40 text-center tracking-wider">
                                    {playedMove}
                                </div>
                            </div>

                            {whyFailed && (
                                <p className="text-[11px] text-red-200/90 leading-snug pt-1 border-t border-red-900/30">
                                    {whyFailed}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Cartouche Meilleur Coup Recommandé */}
                    {optimalMove && (
                        <div
                            className="rounded-xl border border-emerald-800/60 bg-emerald-950/30 p-3 flex flex-col justify-between gap-2 ring-1 ring-emerald-500/20"
                            data-testid="coach-optimal-move-card"
                        >
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                                    <span>⭐</span>
                                    <span>{isEn ? 'Best Move (AI)' : 'Meilleur coup recommandé'}</span>
                                </span>
                                <div className="font-mono text-base sm:text-lg font-black text-emerald-100 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-700/50 text-center tracking-wider shadow-sm">
                                    {optimalMove}
                                </div>
                            </div>

                            {whyOptimal && (
                                <p className="text-[11px] text-emerald-200/90 leading-snug pt-1 border-t border-emerald-900/30">
                                    {whyOptimal}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 3. Bouton Reprendre le coup si disponible */}
            {onReplayMove && (
                <button
                    type="button"
                    onClick={onReplayMove}
                    data-testid="coach-replay-move-btn"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-900/30 transition active:scale-98"
                >
                    <span>⏪</span>
                    <span>{isEn ? 'Replay with optimal move' : 'Rejouer le bon coup'}</span>
                </button>
            )}
        </div>
    );
}

export default React.memo(CoachMoveComparisonCard);
