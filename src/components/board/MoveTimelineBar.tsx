'use client';

/**
 * Barre de navigation temporelle des coups sur le vrai plateau (Move Timeline & Replay).
 *
 * Permet d'inspecter pas-à-pas chaque coup de la partie (Avant / Après coup) avec
 * surcouche visuelle duale (flèches Vertes = Optimal Open Sage, Rouges = Coup joué)
 * et Ghost-Checkers sans jamais désynchroniser ni muter le moteur de jeu actif.
 *
 * Strictement 0 `any`, < 140 lignes (LOI 5).
 */

import React from 'react';
import type { RawGameTurn } from '../../features/rating';

export interface MoveTimelineBarProps {
    /** Nombre total de tours enregistrés dans la manche. */
    readonly totalTurns: number;
    /** Index du tour inspecté (0..totalTurns-1), ou `null` en mode Direct. */
    readonly replayIndex: number | null;
    /** Vrai si le plateau affiche la partie en direct. */
    readonly isLive: boolean;
    /** Tour actuellement inspecté en mode Replay. */
    readonly selectedTurn: RawGameTurn | null;
    /** Notation officielle du coup inspecté. */
    readonly officialNotation: string | null;
    /** Sous-étape inspectée du tour : avant ou après le déplacement des pions. */
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
}

const MoveTimelineBarComponent: React.FC<MoveTimelineBarProps> = ({
    totalTurns,
    replayIndex,
    isLive,
    selectedTurn,
    officialNotation,
    viewPhase,
    canStepPrev,
    canStepNext,
    onStepFirst,
    onStepPrev,
    onStepNext,
    onReturnToLive,
    onToggleViewPhase,
    onRewindHere,
    swapColors = false,
}) => {
    const currentStepNumber = isLive ? totalTurns : (replayIndex ?? 0) + 1;
    const humanColorLabel = swapColors ? 'Noir' : 'Blanc';
    const aiColorLabel = swapColors ? 'Blanc' : 'Noir';

    return (
        <nav
            aria-label="Timeline temporelle des coups"
            data-testid="board-move-timeline"
            data-mode={isLive ? 'live' : 'replay'}
            className={`w-full max-w-[1260px] mx-auto shrink-0 h-8 max-h-8 flex-nowrap items-center justify-between gap-2 overflow-x-auto whitespace-nowrap rounded-xl border px-2.5 py-0.5 text-[11px] backdrop-blur-md transition-colors z-30 ${
                isLive
                    ? 'hidden md:flex border-[#d4af37]/35 bg-[#120b06]/85 text-slate-200'
                    : 'flex border-amber-400/80 bg-amber-950/90 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            }`}
        >
            {/* Contrôles de navigation pas-à-pas */}
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    data-testid="timeline-btn-first"
                    disabled={!canStepPrev}
                    onClick={onStepFirst}
                    title="Revenir au tout premier coup de la manche"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition"
                >
                    <span aria-hidden="true">⏪</span>
                    <span className="hidden sm:inline">Début</span>
                </button>

                <button
                    type="button"
                    data-testid="timeline-btn-prev"
                    disabled={!canStepPrev}
                    onClick={onStepPrev}
                    title="Inspecter le coup précédent sur le plateau"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition"
                >
                    <span aria-hidden="true">◀</span>
                    <span className="hidden sm:inline">Coup Précédent</span>
                    <span className="sm:hidden">Préc.</span>
                </button>

                <span
                    data-testid="timeline-step-counter"
                    className="px-2 py-0.5 rounded-md bg-black/50 border border-[#d4af37]/30 font-mono font-bold text-[#f3c65f]"
                >
                    Coup {currentStepNumber} / {totalTurns}
                </span>

                <button
                    type="button"
                    data-testid="timeline-btn-next"
                    disabled={!canStepNext}
                    onClick={onStepNext}
                    title="Avancer au coup suivant"
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2 py-0.5 font-bold text-slate-200 hover:border-[#f3c65f]/60 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition"
                >
                    <span className="hidden sm:inline">Coup Suivant</span>
                    <span className="sm:hidden">Suiv.</span>
                    <span aria-hidden="true">▶</span>
                </button>

                <button
                    type="button"
                    data-testid="timeline-btn-live"
                    onClick={onReturnToLive}
                    title="Revenir immédiatement à la partie en direct"
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 font-bold transition ${
                        isLive
                            ? 'border border-emerald-500/45 bg-emerald-950/60 text-emerald-300'
                            : 'border border-amber-300 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm'
                    }`}
                >
                    <span aria-hidden="true">{isLive ? '🟢' : '⏩'}</span>
                    <span>Direct</span>
                </button>
            </div>

            {/* Détail du coup inspecté en mode Consultation / Replay */}
            {!isLive && selectedTurn ? (
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px]">
                    <span className="rounded bg-amber-500/20 border border-amber-400/50 px-1.5 py-0.5 font-bold uppercase tracking-wider text-amber-200">
                        Consultation · {selectedTurn.player === 'X' ? `Vous (${humanColorLabel})` : `IA (${aiColorLabel})`} [{selectedTurn.dice[0]}-{selectedTurn.dice[1]}]
                    </span>
                    {officialNotation && (
                        <span data-testid="timeline-move-notation" className="font-mono font-black text-white">
                            {officialNotation}
                        </span>
                    )}
                    <button
                        type="button"
                        data-testid="timeline-toggle-phase-btn"
                        onClick={onToggleViewPhase}
                        title="Basculer entre la position avant le coup (avec flèches) et la position après le coup"
                        className="rounded-md border border-amber-300/60 bg-black/50 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-200 hover:bg-black/80 hover:text-white transition"
                    >
                        {viewPhase === 'before' ? '👁 Position AVANT coup + Flèches' : '👁 Position APRÈS coup'}
                    </button>
                    {onRewindHere && (
                        <button
                            type="button"
                            data-testid="timeline-rewind-here-btn"
                            onClick={onRewindHere}
                            title="Revenir jouer à partir de ce coup sur le plateau"
                            className="rounded-md border border-blue-400/70 bg-blue-600/80 px-2 py-0.5 font-bold text-[10px] text-white hover:bg-blue-500 transition"
                        >
                            ⏪ Reprendre d&apos;ici
                        </button>
                    )}
                </div>
            ) : (
                <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400">
                    <span>🟢 Flèches Vertes : Optimal Monte-Carlo</span>
                    <span>·</span>
                    <span>🔴 Flèches Rouges : Coup joué (si erreur)</span>
                </div>
            )}
        </nav>
    );
};

export const MoveTimelineBar = React.memo(MoveTimelineBarComponent);
export default MoveTimelineBar;
