'use client';

/**
 * Carte de Verdict & Gamification du "Puzzle du Jour" (`DailyPuzzleVerdict.tsx`).
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), bordures secondaires border-white/10.
 */

import React from 'react';
import type {
    DailyPuzzleVerdictEvaluation,
    LocalFsrsErrorEntry,
} from '../../lib/puzzle/puzzleService';

export interface DailyPuzzleVerdictProps {
    readonly verdict: DailyPuzzleVerdictEvaluation | null;
    readonly fsrsScheduledEntry: LocalFsrsErrorEntry | null;
    readonly onRetry: () => void;
    readonly onOpenDebrief: () => void;
}

const VERDICT_THEME: Readonly<
    Record<
        DailyPuzzleVerdictEvaluation['code'],
        {
            containerClass: string;
            badgeClass: string;
            deltaClass: string;
        }
    >
> = {
    BEST: {
        containerClass:
            'border-emerald-500/60 bg-gradient-to-r from-[#082418]/95 via-[#0b1b15]/95 to-[#0d121c]/95 text-emerald-100',
        badgeClass: 'border-emerald-400/50 bg-emerald-950/80 text-emerald-200',
        deltaClass: 'border-white/10 bg-black/50 text-emerald-300',
    },
    EXCELLENT_ALTERNATIVE: {
        containerClass:
            'border-[#f3c65f]/60 bg-gradient-to-r from-[#2c1d09]/95 via-[#1b1309]/95 to-[#0d121c]/95 text-amber-100',
        badgeClass: 'border-[#f3c65f]/50 bg-amber-950/80 text-[#fce8b2]',
        deltaClass: 'border-white/10 bg-black/50 text-[#f3c65f]',
    },
    ERROR: {
        containerClass:
            'border-orange-500/60 bg-gradient-to-r from-[#2d1409]/95 via-[#1c0e08]/95 to-[#0d121c]/95 text-orange-100',
        badgeClass: 'border-orange-400/50 bg-orange-950/80 text-orange-200',
        deltaClass: 'border-white/10 bg-black/50 text-orange-300',
    },
    BLUNDER: {
        containerClass:
            'border-rose-500/70 bg-gradient-to-r from-[#3a0d12]/95 via-[#21090c]/95 to-[#0d121c]/95 text-rose-100',
        badgeClass: 'border-rose-400/60 bg-rose-950/90 text-rose-200',
        deltaClass: 'border-white/10 bg-black/50 text-rose-300',
    },
};

export const DailyPuzzleVerdict: React.FC<DailyPuzzleVerdictProps> = ({
    verdict,
    fsrsScheduledEntry,
    onRetry,
    onOpenDebrief,
}) => {
    if (!verdict) return null;

    const styles = VERDICT_THEME[verdict.code];

    return (
        <section
            data-testid="daily-puzzle-verdict"
            data-verdict-code={verdict.code}
            className={`w-full rounded-2xl border p-4 sm:p-5 shadow-2xl space-y-3 ${styles.containerClass}`}
        >
            {/* Ligne principale : Badge Verdict, Titre & ΔE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span
                        data-testid="verdict-badge"
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${styles.badgeClass}`}
                    >
                        <span>{verdict.badgeEmoji}</span>
                        <span>{verdict.badgeLabel}</span>
                    </span>
                    <h2 className="font-serif text-base sm:text-lg font-black text-[#fdf8eb]">
                        {verdict.feedbackHeadline}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        data-testid="verdict-equity-delta"
                        className={`rounded-xl border px-3 py-1 font-mono text-xs font-extrabold ${styles.deltaClass}`}
                    >
                        ΔE = {verdict.deltaEquity === 0 ? '0.000' : `-${verdict.deltaEquity.toFixed(3)}`}
                    </span>

                    {verdict.earnedXp > 0 && (
                        <span
                            data-testid="verdict-earned-xp"
                            className="rounded-xl border border-white/10 bg-[#261409] px-3 py-1 font-mono text-xs font-black text-[#f3c65f]"
                        >
                            +{verdict.earnedXp} XP
                        </span>
                    )}
                </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-[#fdf8eb]/90">
                {verdict.feedbackDetail}
            </p>

            {/* Alerte Piège de la Partie Originale sur BLUNDER */}
            {verdict.trapAlertMessage && (
                <div
                    data-testid="verdict-original-trap-alert"
                    className="rounded-xl border border-rose-400/50 bg-[#460e14]/85 p-3 text-xs text-rose-100"
                >
                    {verdict.trapAlertMessage}
                </div>
            )}

            {/* Bandeau Planificateur FSRS si raté au 1er essai */}
            {fsrsScheduledEntry && (
                <div
                    data-testid="verdict-fsrs-scheduled-banner"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#160b06]/90 px-3.5 py-2 text-xs text-[#e2d2b5]"
                >
                    <div className="flex items-center gap-2">
                        <span>🔁</span>
                        <span>
                            <strong>Planificateur FSRS activé :</strong> Concept{' '}
                            <span className="font-bold text-[#f3c65f]">
                                {fsrsScheduledEntry.conceptLabel}
                            </span>{' '}
                            injecté dans <code className="font-mono">recurring_errors</code>.
                        </span>
                    </div>
                    <span className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-0.5 font-mono text-xs text-[#f3c65f]">
                        Cycle : J+1 · J+3 · J+7 · J+14 · J+30 (Prochaine : J+{fsrsScheduledEntry.interval_days})
                    </span>
                </div>
            )}

            {/* Boutons d'action selon le palier de verdict */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span>
                        <span className="text-[#c7b89c]">Votre coup : </span>
                        <strong className="font-mono text-white">{verdict.playedNotation}</strong>
                    </span>
                    {verdict.revealDebrief && (
                        <span>
                            <span className="text-[#c7b89c]">Meilleur coup Monte-Carlo : </span>
                            <strong className="font-mono text-[#f3c65f]">{verdict.bestNotation}</strong>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {verdict.canSeekSuperiorNuance && (
                        <button
                            type="button"
                            data-testid="verdict-seek-nuance-btn"
                            onClick={onRetry}
                            className="rounded-xl border border-[#f3c65f] bg-[#361c0b] px-3.5 py-1.5 text-xs font-extrabold text-[#fff3c4] hover:brightness-110 transition"
                        >
                            🔍 Chercher la nuance supérieure (#1)
                        </button>
                    )}

                    {verdict.canRetry && !verdict.canSeekSuperiorNuance && (
                        <button
                            type="button"
                            data-testid="verdict-second-try-btn"
                            onClick={onRetry}
                            className="rounded-xl border border-orange-400/60 bg-[#3d170b] px-3.5 py-1.5 text-xs font-extrabold text-orange-100 hover:brightness-110 transition"
                        >
                            ↺ Tenter un second essai
                        </button>
                    )}

                    {!verdict.revealDebrief && (
                        <button
                            type="button"
                            data-testid="verdict-reveal-debrief-btn"
                            onClick={onOpenDebrief}
                            className="rounded-xl border border-white/10 bg-[#140a05] px-3.5 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white transition"
                        >
                            📖 Révéler le débriefing
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};

export default DailyPuzzleVerdict;
