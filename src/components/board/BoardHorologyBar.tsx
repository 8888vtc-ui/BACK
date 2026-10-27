'use client';

/**
 * Barre de contrôle horlogère ultra-fine (h-8) sous le plateau (< 210 lignes, 0 any).
 *
 * Fusionne en une seule ligne compacte :
 *   1. La navigation temporelle (Move Timeline & Replay)
 *   2. Le rival IA incarné, ses citations et les badges de dopamine (Coup Brillant, Combo, Cube, Ghost)
 *
 * Garantit zéro compression verticale sur le plateau de jeu (Loi 5 de Scalabilité).
 */

import React, { useMemo } from 'react';
import type { AIDifficulty } from '../../hooks/useBackgammonGame';
import type { Player } from '../../engine/backgammonEngine';
import type { RawGameTurn } from '../../features/rating';
import type { CoachAnalysisHistoryEntry } from '../../hooks/useCoachHelpers';
import {
    AI_RIVALS_BY_DIFFICULTY,
    computeDopamineMetricsFromHistory,
    resolveAiRivalQuote,
} from '../../lib/gameFeel/aiRivals';

export interface BoardHorologyBarProps {
    readonly totalTurns: number;
    readonly replayIndex: number | null;
    readonly isLive: boolean;
    readonly selectedTurn: RawGameTurn | null;
    readonly officialNotation: string | null;
    readonly viewPhase: 'before' | 'after';
    readonly canStepPrev: boolean;
    readonly canStepNext: boolean;
    readonly onStepFirst: () => void;
    readonly onStepPrev: () => void;
    readonly onStepNext: () => void;
    readonly onReturnToLive: () => void;
    readonly onToggleViewPhase: () => void;
    readonly onRewindHere?: () => void;
    readonly swapColors?: boolean;
    readonly difficulty?: AIDifficulty;
    readonly coachHistory?: ReadonlyArray<CoachAnalysisHistoryEntry>;
    readonly cubeValue?: number;
    readonly doublingOfferedBy?: Player | null;
    readonly onTriggerGhostChallenge?: (turnIndex: number) => void;
    readonly onInstantRematch?: () => void;
    readonly locale?: string;
}

const BoardHorologyBarComponent: React.FC<BoardHorologyBarProps> = ({
    totalTurns, replayIndex, isLive, selectedTurn, officialNotation,
    viewPhase, canStepPrev, canStepNext, onStepFirst, onStepPrev,
    onStepNext, onReturnToLive, onToggleViewPhase, onRewindHere,
    swapColors = false, difficulty = 'expert', coachHistory = [],
    cubeValue = 1, doublingOfferedBy = null, onTriggerGhostChallenge,
    onInstantRematch, locale = 'fr',
}) => {
    const isEn = locale === 'en';
    const rival = AI_RIVALS_BY_DIFFICULTY[difficulty] ?? AI_RIVALS_BY_DIFFICULTY.expert;
    const currentStepNumber = isLive ? totalTurns : (replayIndex ?? 0) + 1;
    const humanColorLabel = swapColors ? 'Noir' : 'Blanc';
    const aiColorLabel = swapColors ? 'Blanc' : 'Noir';

    const metrics = useMemo(() => computeDopamineMetricsFromHistory(coachHistory), [coachHistory]);
    const rivalQuote = useMemo(
        () => resolveAiRivalQuote({ rival, metrics, cubeValue, doublingOffered: doublingOfferedBy !== null, locale }),
        [rival, metrics, cubeValue, doublingOfferedBy, locale],
    );

    const isHighStakes = doublingOfferedBy !== null || cubeValue >= 2;
    const worstBlunder = metrics.worstBlunderEntry;

    // Mode Consultation / Replay
    if (!isLive && selectedTurn) {
        return (
            <nav
                aria-label="Timeline temporelle des coups"
                data-testid="board-move-timeline"
                data-mode="replay"
                className="w-full max-w-[1260px] mx-auto shrink-0 h-8 flex flex-nowrap items-center justify-between gap-1.5 overflow-hidden whitespace-nowrap rounded-xl border border-amber-400/80 bg-amber-950/90 px-2 py-0.5 text-[11px] text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-md z-30 select-none"
            >
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button" data-testid="timeline-btn-first" disabled={!canStepPrev} onClick={onStepFirst}
                        title="Revenir au tout premier coup"
                        className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/40 px-1.5 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 transition"
                    >
                        <span>⏪</span><span className="hidden sm:inline">Début</span>
                    </button>
                    <button
                        type="button" data-testid="timeline-btn-prev" disabled={!canStepPrev} onClick={onStepPrev}
                        title="Coup précédent"
                        className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/40 px-1.5 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 transition"
                    >
                        <span>◀</span><span className="hidden sm:inline">Préc.</span>
                    </button>
                    <span data-testid="timeline-step-counter" className="px-1.5 py-0.5 rounded-md bg-black/60 border border-[#d4af37]/35 font-mono font-bold tabular-nums text-[#f3c65f]">
                        {currentStepNumber} / {totalTurns}
                    </span>
                    <button
                        type="button" data-testid="timeline-btn-next" disabled={!canStepNext} onClick={onStepNext}
                        title="Coup suivant"
                        className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-black/40 px-1.5 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 transition"
                    >
                        <span className="hidden sm:inline">Suiv.</span><span>▶</span>
                    </button>
                    <button
                        type="button" data-testid="timeline-btn-live" onClick={onReturnToLive} title="Revenir au direct"
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-400 px-2 py-0.5 font-bold text-slate-950 hover:bg-amber-300 shadow-sm transition"
                    >
                        <span>⏩</span><span>Direct</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] shrink-0">
                    <span className="rounded bg-amber-500/20 border border-amber-400/50 px-1.5 py-0.5 font-bold uppercase tracking-wider text-amber-200">
                        Consultation · {selectedTurn.player === 'X' ? `Vous (${humanColorLabel})` : `IA (${aiColorLabel})`} [{selectedTurn.dice[0]}-{selectedTurn.dice[1]}]
                    </span>
                    {officialNotation && (
                        <span data-testid="timeline-move-notation" className="font-mono font-black text-white">
                            {officialNotation}
                        </span>
                    )}
                    <button
                        type="button" data-testid="timeline-toggle-phase-btn" onClick={onToggleViewPhase}
                        className="rounded-md border border-amber-300/60 bg-black/50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200 hover:bg-black/80 hover:text-white transition"
                    >
                        {viewPhase === 'before' ? '👁 AVANT + Flèches' : '👁 APRÈS coup'}
                    </button>
                    {onRewindHere && (
                        <button
                            type="button" data-testid="timeline-rewind-here-btn" onClick={onRewindHere}
                            className="rounded-md border border-blue-400/70 bg-blue-600/80 px-2 py-0.5 font-bold text-[10px] text-white hover:bg-blue-500 transition"
                        >
                            ⏪ Reprendre d&apos;ici
                        </button>
                    )}
                </div>
            </nav>
        );
    }

    // Mode Direct (Live) : Barre horlogère unifiée h-8
    return (
        <section
            aria-label="Barre de contrôle horlogère"
            data-testid={totalTurns > 0 ? 'board-move-timeline' : 'board-horology-bar'}
            data-mode={totalTurns > 0 ? 'live' : undefined}
            className="w-full max-w-[1260px] mx-auto shrink-0 h-8 flex flex-nowrap items-center justify-between gap-2 overflow-hidden whitespace-nowrap rounded-xl border border-[#d4af37]/40 bg-gradient-to-r from-[#140b06]/95 via-[#1c1008]/95 to-[#120a05]/95 px-2 py-0.5 text-[11px] text-amber-50 shadow-[0_6px_18px_rgba(0,0,0,0.65)] z-30 select-none"
        >
            {/* Contrôles Replay rapides (si au moins 1 tour joué) */}
            {totalTurns > 0 ? (
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button" data-testid="timeline-btn-first" disabled={!canStepPrev} onClick={onStepFirst}
                        title="Revenir au premier coup"
                        className="inline-flex items-center rounded-lg border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 transition"
                    >
                        ⏪
                    </button>
                    <button
                        type="button" data-testid="timeline-btn-prev" disabled={!canStepPrev} onClick={onStepPrev}
                        title="Inspecter le coup précédent"
                        className="inline-flex items-center rounded-lg border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 transition"
                    >
                        ◀
                    </button>
                    <span data-testid="timeline-step-counter" className="px-1.5 py-0.5 rounded-md bg-black/50 border border-[#d4af37]/30 font-mono text-[10px] font-bold tabular-nums text-[#f3c65f]">
                        {totalTurns} / {totalTurns}
                    </span>
                    <button
                        type="button" data-testid="timeline-btn-next" disabled className="inline-flex items-center rounded-lg border border-white/5 bg-black/20 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 opacity-35"
                    >
                        ▶
                    </button>
                    <button
                        type="button" data-testid="timeline-btn-live" onClick={onReturnToLive}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/45 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300"
                    >
                        <span aria-hidden="true">🟢</span>
                        <span className="hidden sm:inline">Direct</span>
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-1 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Direct</span>
                    </span>
                </div>
            )}

            {/* Rival IA : Avatar, Nom, PR cible et citation réactive */}
            <div data-testid="dopamine-ai-rival-card" className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden px-1">
                <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#f3c65f]/60 bg-[#2a170b] text-xs shadow-inner">
                    {rival.avatar}
                </span>
                <div className="min-w-0 flex flex-nowrap items-center gap-1.5 overflow-hidden">
                    <span className="font-serif font-black text-[#f3c65f] tracking-wide whitespace-nowrap">
                        {rival.name}
                    </span>
                    <span data-testid="dopamine-ai-rival-pr" className="rounded border border-amber-400/40 bg-black/50 px-1.5 py-0.2 font-mono text-[10px] font-bold tabular-nums text-amber-300">
                        PR ~{rival.targetPr}
                    </span>
                    <span data-testid="dopamine-ai-rival-quote" className="truncate italic text-[11px] text-slate-200 max-w-[200px] sm:max-w-[320px] xl:max-w-[480px]" title={rivalQuote}>
                        « {rivalQuote} »
                    </span>
                </div>
            </div>

            {/* Badges Dopamine : Coup Brillant, Combo, Videau et Défi Ghost */}
            <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                {metrics.isBrilliantMove && (
                    <span
                        data-testid="dopamine-brilliant-badge"
                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/80 bg-gradient-to-r from-cyan-950/90 to-emerald-950/90 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)] animate-pulse"
                        title={isEn ? `Unique best move! (+${metrics.brilliantMarginEq.toFixed(3)})` : `Seul coup optimal ! (+${metrics.brilliantMarginEq.toFixed(3)})`}
                    >
                        <span aria-hidden="true">💎</span>
                        <span>{isEn ? 'BRILLIANT' : 'BRILLANT'} (+{metrics.brilliantMarginEq.toFixed(3)})</span>
                    </span>
                )}

                {metrics.optimalStreak >= 1 && (
                    <span
                        data-testid="dopamine-combo-badge"
                        className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 font-mono text-[10px] font-extrabold ${
                            metrics.optimalStreak >= 3 ? 'border-amber-300/85 bg-gradient-to-r from-amber-600/35 to-emerald-600/35 text-amber-100' : 'border-emerald-500/50 bg-emerald-950/75 text-emerald-200'
                        }`}
                    >
                        <span>{metrics.optimalStreak >= 3 ? '🔥' : '⚡'}</span>
                        <span>x{metrics.optimalStreak}</span>
                    </span>
                )}

                {isHighStakes && (
                    <span
                        data-testid="dopamine-cube-stakes"
                        className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            doublingOfferedBy !== null ? 'border-rose-400/90 bg-rose-950/90 text-rose-100 animate-pulse' : 'border-amber-400/75 bg-amber-950/80 text-amber-200'
                        }`}
                    >
                        <span>🎰</span>
                        <span>{doublingOfferedBy !== null ? `2× (${cubeValue * 2})` : `${cubeValue}×`}</span>
                    </span>
                )}

                {worstBlunder && onTriggerGhostChallenge && (
                    <button
                        type="button" data-testid="dopamine-ghost-challenge-btn" onClick={() => onTriggerGhostChallenge(worstBlunder.turnIndex)}
                        title={`Revenir au Tour #${worstBlunder.turnIndex} (-${Math.abs(worstBlunder.coachState.equityLoss).toFixed(3)} Eq) pour battre votre fantôme`}
                        className="inline-flex items-center gap-1 rounded-lg border border-purple-400/75 bg-purple-950/90 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-purple-100 hover:border-purple-300 hover:text-white transition active:scale-95"
                    >
                        <span>👻</span><span>Ghost #{worstBlunder.turnIndex}</span>
                    </button>
                )}

                {onInstantRematch && (
                    <button
                        type="button" data-testid="dopamine-instant-rematch-btn" onClick={onInstantRematch}
                        title={`Revanche contre ${rival.name}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#d4af37]/55 bg-[#261409] px-1.5 py-0.5 text-[10px] font-bold text-[#f7e5b7] hover:border-[#f3c65f] transition active:scale-95"
                    >
                        <span>🔥</span><span>{isEn ? 'Rematch' : 'Revanche'}</span>
                    </button>
                )}
            </div>
        </section>
    );
};

export const BoardHorologyBar = React.memo(BoardHorologyBarComponent);
export default BoardHorologyBar;
