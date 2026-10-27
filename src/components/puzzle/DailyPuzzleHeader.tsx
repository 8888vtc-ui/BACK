'use client';

/**
 * En-tête du "Puzzle du Jour" (`DailyPuzzleHeader.tsx`).
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), bordures épurées border-white/10,
 * objectif du puzzle immédiatement visible au premier coup d'œil.
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
            className="w-full rounded-2xl border border-white/10 bg-[#0e121b]/95 p-2.5 sm:p-3 shadow-xl backdrop-blur-md space-y-2"
        >
            {/* Ligne supérieure : Identité, Objectif immédiat + Compteurs Streak, Glicko-2 & XP */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#1a1109] text-base">
                            ⚜️
                        </span>
                        <h1 className="font-serif text-base sm:text-xl font-black tracking-tight text-[#fdf8eb]">
                            Puzzle du Jour · Monte-Carlo 3-Ply
                        </h1>
                        <span
                            data-testid="daily-puzzle-utc-date"
                            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 font-mono text-xs font-bold text-[#f3c65f]"
                        >
                            {utcDateString} · 00h00 UTC
                        </span>
                        <span
                            suppressHydrationWarning
                            className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 font-mono text-xs text-[#e2d2b5]"
                        >
                            ⏳ Prochain dans {utcCountdown}
                        </span>
                    </div>
                    <p
                        data-testid="daily-puzzle-objective"
                        className="text-xs sm:text-sm text-[#e2d2b5]"
                    >
                        <strong className="text-[#fdf8eb]">Objectif :</strong> {puzzle.title} —{' '}
                        <span className="text-[#f3c65f] font-semibold">{puzzle.subtitle}</span>
                    </p>
                </div>

                {/* Compteurs Gamification : Streak Quotidien, Classement Glicko-2 & XP */}
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        data-testid="daily-puzzle-streak-counter"
                        suppressHydrationWarning
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1a1109]/90 px-3 py-1.5"
                    >
                        <span className="text-base" aria-hidden="true">
                            🔥
                        </span>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#f3c65f]">
                                Série Quotidienne
                            </div>
                            <div className="font-mono text-xs sm:text-sm font-black text-[#fdf8eb]">
                                {profile.currentStreak} {profile.currentStreak > 1 ? 'jours' : 'jour'}
                                <span className="ml-1.5 text-xs font-normal text-[#c7b89c]">
                                    (Record : {profile.maxStreak})
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        data-testid="daily-puzzle-glicko-rating"
                        suppressHydrationWarning
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5"
                    >
                        <span className="text-base" aria-hidden="true">
                            🏆
                        </span>
                        <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-[#e2d2b5]">
                                Glicko-2 Puzzle
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-black text-[#fdf8eb]">
                                <span>{profile.puzzleRating}</span>
                                {ratingDelta !== null && (
                                    <span
                                        data-testid="daily-puzzle-rating-delta"
                                        className={`rounded px-1.5 py-0.5 text-xs font-extrabold ${
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
                        className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-right"
                    >
                        <div className="text-xs font-bold uppercase tracking-wider text-[#c7b89c]">
                            Enjeu XP
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-black text-[#f3c65f]">
                            +{xpPreview.earnedXp} XP
                            {xpPreview.xpPenaltyPct > 0 && (
                                <span className="ml-1 text-xs text-amber-400">
                                    (-{xpPreview.xpPenaltyPct}%)
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ligne inférieure : Contexte Match (Away Score / Videau / Dés) & Replay 1.2s */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider ${diffMeta.className}`}
                    >
                        {diffMeta.label} · {puzzle.puzzleRating} Elo
                    </span>

                    <span
                        data-testid="daily-puzzle-match-score"
                        className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs font-bold text-[#fdf8eb]"
                    >
                        🎯 {matchScoreLabel}
                    </span>

                    <span
                        data-testid="daily-puzzle-cube-state"
                        className="rounded-xl border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-xs font-semibold text-[#e2d2b5]"
                    >
                        🎲 Videau ×{puzzle.cubeValue} ({cubeOwnerLabel})
                    </span>

                    <div
                        data-testid="daily-puzzle-dice-badge"
                        className="flex items-center gap-1.5 rounded-xl border border-[#f3c65f]/50 bg-[#2b140a] px-2.5 py-1"
                    >
                        <span className="text-xs font-bold text-[#f3c65f]">Tour {puzzle.turn} :</span>
                        <span className="rounded bg-[#fdf8eb] px-1.5 py-0.5 font-mono text-xs font-black text-[#1a0d06]">
                            {puzzle.dice[0]}
                        </span>
                        <span className="rounded bg-[#fdf8eb] px-1.5 py-0.5 font-mono text-xs font-black text-[#1a0d06]">
                            {puzzle.dice[1]}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        data-testid="daily-puzzle-replay-intro-btn"
                        onClick={onReplayIntro}
                        className="rounded-xl border border-white/10 bg-[#1b0e08] px-3 py-1 text-xs font-bold text-[#f3c65f] hover:border-white/25 hover:bg-[#2a150b] transition"
                    >
                        {isReplayingIntro
                            ? `🎬 Replay adverse en cours (${puzzle.opponentReplay.opponentNotation})...`
                            : `🎬 Rejouer le dernier coup adverse (${puzzle.opponentReplay.opponentNotation})`}
                    </button>

                    <select
                        id="daily-puzzle-selector"
                        name="dailyPuzzleSelector"
                        aria-label="Choisir un puzzle du catalogue"
                        data-testid="daily-puzzle-selector"
                        value={puzzle.id}
                        onChange={(e) => onSelectPuzzle(e.target.value)}
                        className="rounded-xl border border-white/10 bg-black/50 px-3 py-1 text-xs font-bold text-[#fdf8eb] focus:outline-none focus:ring-1 focus:ring-[#f3c65f]"
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
