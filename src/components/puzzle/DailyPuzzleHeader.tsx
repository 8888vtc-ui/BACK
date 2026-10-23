'use client';

/**
 * En-tête d'Orfèvrerie du "Puzzle du Jour" (`DailyPuzzleHeader.tsx`).
 *
 * Affiche :
 * - Titre & Sous-titre du tournoi, échéance quotidienne 00h00 UTC.
 * - Contexte du match : Score Away (`3-away / 5-away`) ou `Money Game`, Videau, Dés du tour.
 * - Série quotidienne (`backgammon.puzzleStreak` 🔥) & Classement Puzzle Glicko-2 (`puzzle_rating`).
 * - Sélecteur rapide de situations du catalogue.
 */

import React from 'react';
import type {
    DailyPuzzleDefinition,
    HintLevel,
    LocalPuzzleProfileState,
} from '../../lib/puzzle/puzzleService';

export interface DailyPuzzleHeaderProps {
    readonly puzzle: DailyPuzzleDefinition;
    readonly catalog: ReadonlyArray<DailyPuzzleDefinition>;
    readonly utcDateString: string;
    readonly utcCountdown: string;
    readonly matchScoreLabel: string;
    readonly profile: LocalPuzzleProfileState;
    readonly ratingDelta: number | null;
    readonly hintLevel: HintLevel;
    readonly xpPreview: { readonly earnedXp: number; readonly xpPenaltyPct: number };
    readonly isReplayingIntro: boolean;
    readonly onSelectPuzzle: (id: string) => void;
    readonly onReplayIntro: () => void;
}

const DIFFICULTY_STYLES: Readonly<
    Record<DailyPuzzleDefinition['difficulty'], { label: string; className: string }>
> = {
    beginner: {
        label: 'Initié',
        className: 'border-emerald-500/45 bg-emerald-950/40 text-emerald-300',
    },
    intermediate: {
        label: 'Maître de Club',
        className: 'border-amber-500/45 bg-amber-950/40 text-amber-300',
    },
    expert: {
        label: 'Grand-Maître',
        className: 'border-rose-500/50 bg-[#3a1014]/70 text-rose-200',
    },
};

export const DailyPuzzleHeader: React.FC<DailyPuzzleHeaderProps> = ({
    puzzle,
    catalog,
    utcDateString,
    utcCountdown,
    matchScoreLabel,
    profile,
    ratingDelta,
    xpPreview,
    isReplayingIntro,
    onSelectPuzzle,
    onReplayIntro,
}) => {
    const diffMeta = DIFFICULTY_STYLES[puzzle.difficulty];
    const cubeOwnerLabel =
        puzzle.cubeOwner === 'X'
            ? 'Joueur (X)'
            : puzzle.cubeOwner === 'O'
              ? 'Adversaire (O)'
              : 'Centre';

    return (
        <header
            data-testid="daily-puzzle-header"
            className="w-full rounded-3xl border border-[#d4af37]/45 bg-gradient-to-r from-[#241109] via-[#120b08] to-[#0a0d14] p-4 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(243,198,95,0.28)] backdrop-blur-md space-y-4"
        >
            {/* Ligne supérieure : Identité Orfèvrerie + Badges Streak & Glicko-2 */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-4">
                <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d4af37]/55 bg-gradient-to-br from-[#471810] via-[#2a120a] to-[#120804] text-lg shadow-[inset_0_1px_1px_rgba(255,235,180,0.35)]">
                            <span className="[filter:sepia(0.95)_saturate(2.5)_hue-rotate(5deg)]">⚜️</span>
                        </span>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="font-serif text-lg sm:text-2xl font-black tracking-tight text-[#fdf8eb]">
                                    Puzzle du Jour · Open Sage 3T
                                </h1>
                                <span
                                    data-testid="daily-puzzle-utc-date"
                                    className="rounded-full border border-[#d4af37]/40 bg-[#140a05] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#f3c65f]"
                                >
                                    {utcDateString} · 00h00 UTC
                                </span>
                                <span
                                    suppressHydrationWarning
                                    className="rounded-full border border-[#d4af37]/25 bg-black/40 px-2.5 py-0.5 font-mono text-[10px] text-[#e2d2b5]"
                                >
                                    ⏳ Prochain dans {utcCountdown}
                                </span>
                            </div>
                            <p className="text-xs text-[#c7b89c] mt-0.5">
                                {puzzle.title} — <span className="text-[#f3c65f] font-semibold">{puzzle.subtitle}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Compteurs Gamification : Streak Quotidien & Classement Glicko-2 Puzzle */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div
                        data-testid="daily-puzzle-streak-counter"
                        suppressHydrationWarning
                        className="flex items-center gap-2.5 rounded-2xl border border-[#d4af37]/50 bg-gradient-to-b from-[#2f130d] to-[#160805] px-3.5 py-2 shadow-inner"
                    >
                        <span className="text-xl" aria-hidden="true">
                            🔥
                        </span>
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#f3c65f]">
                                Série Quotidienne
                            </div>
                            <div className="font-mono text-sm font-black text-[#fdf8eb]">
                                {profile.currentStreak} {profile.currentStreak > 1 ? 'jours' : 'jour'}
                                <span className="ml-1.5 text-[10px] font-normal text-[#c7b89c]">
                                    (Record : {profile.maxStreak})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        data-testid="daily-puzzle-glicko-rating"
                        suppressHydrationWarning
                        className="flex items-center gap-2.5 rounded-2xl border border-[#d4af37]/35 bg-[#120b07]/95 px-3.5 py-2 shadow-inner"
                    >
                        <span className="text-lg" aria-hidden="true">
                            🏆
                        </span>
                        <div>
                            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#e2d2b5]">
                                Glicko-2 Puzzle
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-sm font-black text-[#fdf8eb]">
                                <span>{profile.puzzleRating}</span>
                                {ratingDelta !== null && (
                                    <span
                                        data-testid="daily-puzzle-rating-delta"
                                        className={`rounded px-1.5 py-0.2 text-[11px] font-extrabold ${
                                            ratingDelta >= 0
                                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                        }`}
                                    >
                                        {ratingDelta >= 0 ? `+${ratingDelta}` : ratingDelta}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        data-testid="daily-puzzle-xp-badge"
                        className="rounded-2xl border border-[#d4af37]/30 bg-[#0d1018]/90 px-3 py-2 text-right"
                    >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#c7b89c]">
                            Enjeu XP
                        </div>
                        <div className="font-mono text-sm font-black text-[#f3c65f]">
                            +{xpPreview.earnedXp} XP
                            {xpPreview.xpPenaltyPct > 0 && (
                                <span className="ml-1 text-[10px] text-amber-400">
                                    (-{xpPreview.xpPenaltyPct}%)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ligne inférieure : Contexte Match (Away Score / Videau / Dés) & Replay 1.2s */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${diffMeta.className}`}
                    >
                        {diffMeta.label} · {puzzle.puzzleRating} Elo
                    </span>

                    <span
                        data-testid="daily-puzzle-match-score"
                        className="rounded-xl border border-[#d4af37]/35 bg-[#160c07] px-3 py-1 font-mono text-xs font-bold text-[#fdf8eb]"
                    >
                        🎯 {matchScoreLabel}
                    </span>

                    <span
                        data-testid="daily-puzzle-cube-state"
                        className="rounded-xl border border-[#d4af37]/30 bg-[#120b07] px-3 py-1 font-mono text-xs font-semibold text-[#e2d2b5]"
                    >
                        🎲 Videau ×{puzzle.cubeValue} ({cubeOwnerLabel})
                    </span>

                    <div
                        data-testid="daily-puzzle-dice-badge"
                        className="flex items-center gap-1.5 rounded-xl border border-[#f3c65f]/55 bg-gradient-to-b from-[#33180d] to-[#180a04] px-3 py-1 shadow-inner"
                    >
                        <span className="text-[11px] font-bold text-[#f3c65f]">Tour {puzzle.turn} :</span>
                        <span className="rounded bg-[#fdf8eb] px-1.5 py-0.2 font-mono text-xs font-black text-[#1a0d06]">
                            {puzzle.dice[0]}
                        </span>
                        <span className="rounded bg-[#fdf8eb] px-1.5 py-0.2 font-mono text-xs font-black text-[#1a0d06]">
                            {puzzle.dice[1]}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        data-testid="daily-puzzle-replay-intro-btn"
                        onClick={onReplayIntro}
                        className="rounded-xl border border-[#d4af37]/40 bg-[#1b0e08] px-3 py-1.5 text-xs font-bold text-[#f3c65f] hover:border-[#f3c65f] hover:bg-[#2a150b] transition"
                    >
                        {isReplayingIntro
                            ? `🎬 Replay adverse en cours (${puzzle.opponentReplay.opponentNotation})...`
                            : `🎬 Rejouer le dernier coup adverse (${puzzle.opponentReplay.opponentNotation})`}
                    </button>

                    <select
                        aria-label="Choisir un puzzle du catalogue"
                        data-testid="daily-puzzle-selector"
                        value={puzzle.id}
                        onChange={(e) => onSelectPuzzle(e.target.value)}
                        className="rounded-xl border border-[#d4af37]/35 bg-[#120a06] px-3 py-1.5 text-xs font-bold text-[#fdf8eb] focus:outline-none focus:ring-1 focus:ring-[#f3c65f]"
                    >
                        {catalog.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.title} ({item.puzzleRating})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </header>
    );
};

export default DailyPuzzleHeader;
