'use client';

/**
 * Plateau Interactif du "Puzzle du Jour" (`DailyPuzzleBoard.tsx`).
 * Loi 5 : < 300 lignes, typage strict, 0 micro-texte (< 12px), bordures épurées border-white/10,
 * barre de contrôle et bouton de validation visibles au premier coup d'œil sans scroller.
 */

import React from 'react';
import { X_BAR, O_BAR, type BoardState, type Move } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import type { CubeDecisionAction, DailyPuzzleDefinition, HintLevel } from '../../lib/puzzle/puzzleService';

export interface DailyPuzzleBoardProps {
    readonly puzzle: DailyPuzzleDefinition;
    readonly boardState: BoardState;
    readonly isReplayingIntro: boolean;
    readonly playedMoves: ReadonlyArray<Move>;
    readonly usedDice: readonly [boolean, boolean];
    readonly selectedPoint: number | null;
    readonly selectedDie: 0 | 1 | null;
    readonly leftDieTargets: Map<number, number[]>;
    readonly rightDieTargets: Map<number, number[]>;
    readonly hintLevel: HintLevel;
    readonly highlightedHintSources: ReadonlySet<number>;
    readonly showDebrief: boolean;
    readonly isSolved: boolean;
    readonly onSkipIntro: () => void;
    readonly onCheckerClick: (point: number) => void;
    readonly onDestinationClick: (dest: number) => void;
    readonly onPlayMove: (from: number, to: number, die?: 0 | 1) => void;
    readonly onSelectDie: (die: 0 | 1) => void;
    readonly onDeselect: () => void;
    readonly onUndoLastMove: () => void;
    readonly onResetAttempt: () => void;
    readonly onUnlockNextHint: () => void;
    readonly onSubmitCheckerSolution: () => void;
    readonly onSubmitCubeDecision: (action: CubeDecisionAction) => void;
}

function formatPointLabel(pt: number): string {
    if (pt === X_BAR || pt === O_BAR) return 'Barre';
    if (pt === 0 || pt === 25) return 'Sortie (Off)';
    return `Point ${pt}`;
}

export const DailyPuzzleBoard: React.FC<DailyPuzzleBoardProps> = ({
    puzzle,
    boardState,
    isReplayingIntro,
    playedMoves,
    usedDice,
    selectedPoint,
    selectedDie,
    leftDieTargets,
    rightDieTargets,
    hintLevel,
    highlightedHintSources,
    showDebrief,
    isSolved,
    onSkipIntro,
    onCheckerClick,
    onDestinationClick,
    onPlayMove,
    onSelectDie,
    onDeselect,
    onUndoLastMove,
    onResetAttempt,
    onUnlockNextHint,
    onSubmitCheckerSolution,
    onSubmitCubeDecision,
}) => {
    const { theme } = useBoardTheme();
    const coachHighlight = showDebrief ? { played: [...playedMoves], optimal: [...puzzle.bestMoves] } : null;
    const opponentHighlight = isReplayingIntro
        ? puzzle.opponentReplay.opponentArrows.map((a) => ({ from: a.from, to: a.to, isHit: a.isHit }))
        : null;

    return (
        <section data-testid="daily-puzzle-board-section" className="w-full space-y-2">
            {/* 1. Barre de Contrôle & Validation immédiatement visible sans scroller */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#0e121b]/95 px-3.5 py-2 shadow-xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#c7b89c]">Séquence jouée :</span>
                    {playedMoves.length === 0 ? (
                        <span className="italic text-[#8e8270]">Cliquez ou glissez vos dames (Smart Click / Drag)</span>
                    ) : (
                        playedMoves.map((m, idx) => (
                            <span
                                key={`${m.from}-${m.to}-${idx}`}
                                data-testid={`played-submove-pill-${idx}`}
                                className="rounded-lg border border-white/10 bg-[#2b140a] px-2.5 py-0.5 font-mono text-xs font-extrabold text-[#fdf8eb]"
                            >
                                {m.from === X_BAR ? 'bar' : m.from}/{m.to === 0 ? 'off' : m.to}
                            </span>
                        ))
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        data-testid="daily-puzzle-undo-btn"
                        onClick={onUndoLastMove}
                        disabled={playedMoves.length === 0 || isSolved}
                        className="rounded-xl border border-white/10 bg-[#160c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        ↶ Annuler
                    </button>

                    <button
                        type="button"
                        data-testid="daily-puzzle-reset-btn"
                        onClick={onResetAttempt}
                        disabled={playedMoves.length === 0}
                        className="rounded-xl border border-white/10 bg-[#160c07] px-3 py-1.5 text-xs font-bold text-[#e2d2b5] hover:border-white/25 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        🔄 Réinitialiser
                    </button>

                    <button
                        type="button"
                        data-testid="daily-puzzle-hint-btn"
                        onClick={onUnlockNextHint}
                        disabled={hintLevel >= 2 || isSolved}
                        className="rounded-xl border border-white/10 bg-[#1a1109] px-3 py-1.5 text-xs font-extrabold text-[#f3c65f] hover:border-white/25 disabled:opacity-45 disabled:cursor-not-allowed transition"
                    >
                        {hintLevel === 0
                            ? '💡 Indice 1 : Plan (-25% XP)'
                            : hintLevel === 1
                              ? '✨ Indice 2 : Pions (-50% XP)'
                              : '💡 Indices dévoilés (-50% XP)'}
                    </button>

                    {puzzle.decisionType === 'cube' && (
                        <div data-testid="daily-puzzle-cube-actions" className="flex items-center gap-1.5">
                            <button type="button" data-testid="cube-action-double" onClick={() => onSubmitCubeDecision('DOUBLE')} className="rounded-xl border border-white/10 bg-[#3a120d] px-3 py-1.5 text-xs font-extrabold text-[#fce8b2] hover:brightness-110">×2 Double</button>
                            <button type="button" data-testid="cube-action-take" onClick={() => onSubmitCubeDecision('TAKE')} className="rounded-xl border border-emerald-500/50 bg-emerald-950/70 px-3 py-1.5 text-xs font-extrabold text-emerald-200 hover:brightness-110">Take</button>
                            <button type="button" data-testid="cube-action-pass" onClick={() => onSubmitCubeDecision('PASS')} className="rounded-xl border border-rose-500/50 bg-rose-950/70 px-3 py-1.5 text-xs font-extrabold text-rose-200 hover:brightness-110">Pass</button>
                        </div>
                    )}

                    <button
                        type="button"
                        data-testid="daily-puzzle-submit-btn"
                        onClick={onSubmitCheckerSolution}
                        disabled={playedMoves.length === 0 || isSolved}
                        className="rounded-xl border border-[#f3c65f] bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#b88218] px-4 py-1.5 font-serif text-xs sm:text-sm font-black uppercase tracking-wider text-[#1a0d05] shadow-md hover:brightness-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed transition"
                    >
                        ✦ Valider mon coup
                    </button>
                </div>
            </div>

            {/* 2. Bandeau d'animation Replay Initial 1.2s */}
            {isReplayingIntro && (
                <div
                    data-testid="daily-puzzle-intro-replay-banner"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#1f0d07] px-4 py-2 text-xs text-[#fdf8eb] shadow-md animate-pulse"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🎬</span>
                        <span>
                            <strong>Contexte dynamique (1.2s) :</strong> L&apos;adversaire joue{' '}
                            <span className="font-mono font-bold text-[#f3c65f]">
                                {puzzle.opponentReplay.opponentDice[0]}-{puzzle.opponentReplay.opponentDice[1]} : {puzzle.opponentReplay.opponentNotation}
                            </span>
                        </span>
                    </div>
                    <button type="button" data-testid="daily-puzzle-skip-intro-btn" onClick={onSkipIntro} className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-xs font-bold text-[#f3c65f] hover:border-white/25">
                        Passer l&apos;animation →
                    </button>
                </div>
            )}

            {/* 3. Affichage des Indices Progressifs débloqués */}
            {hintLevel >= 1 && (
                <div data-testid="daily-puzzle-hint-panel" className="rounded-2xl border border-white/10 bg-[#180c06]/95 p-3.5 shadow-lg space-y-2">
                    <div data-testid="daily-puzzle-hint-1" className="flex flex-wrap items-center gap-2 text-xs text-[#fdf8eb]">
                        <span className="rounded border border-white/10 bg-[#d4af37]/20 px-2 py-0.5 font-mono text-xs font-extrabold text-[#f3c65f]">💡 INDICE 1 (-25% XP) · PLAN DE JEU</span>
                        <span className="font-semibold text-[#fdf8eb]">{puzzle.gamePlanHint}</span>
                    </div>

                    {hintLevel >= 2 && (
                        <div data-testid="daily-puzzle-hint-2" className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 text-xs text-[#fdf8eb]">
                            <span className="rounded border border-white/10 bg-amber-500/25 px-2 py-0.5 font-mono text-xs font-extrabold text-[#f3c65f]">✨ INDICE 2 (-50% XP) · PIONS SOURCES</span>
                            <span>Pions sources du meilleur coup mis en surbrillance :</span>
                            {Array.from(highlightedHintSources).map((pt) => (
                                <span key={pt} data-testid={`hint-source-badge-${pt}`} className="rounded-lg border border-[#f3c65f] bg-[#3b1c0c] px-2.5 py-0.5 font-mono text-xs font-black text-[#fff3c4]">
                                    {formatPointLabel(pt)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 4. Plateau de Tournoi */}
            <div className="relative rounded-2xl border border-white/10 bg-[#080a0f] p-2 sm:p-3 shadow-2xl">
                <Board
                    state={boardState}
                    gamePhase="HUMAN_MOVING"
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={selectedPoint ?? (hintLevel >= 2 && puzzle.optimalSourcePoints.length > 0 ? puzzle.optimalSourcePoints[0] : null)}
                    selectedDie={selectedDie}
                    usedDice={[usedDice[0], usedDice[1]]}
                    opponentDice={isReplayingIntro ? [puzzle.opponentReplay.opponentDice[0], puzzle.opponentReplay.opponentDice[1]] : null}
                    coachHighlight={coachHighlight}
                    opponentHighlight={opponentHighlight}
                    onCheckerClick={onCheckerClick}
                    onCheckerRightClick={(pt) => { onCheckerClick(pt); onSelectDie(1); }}
                    onDestinationClick={onDestinationClick}
                    onPlayMove={onPlayMove}
                    onSelectDie={onSelectDie}
                    onDeselect={onDeselect}
                    onUndo={onUndoLastMove}
                    canUndo={playedMoves.length > 0 && !isSolved}
                    canConfirm={playedMoves.length > 0 && !isSolved}
                    onConfirm={onSubmitCheckerSolution}
                    isMatchStarted={false}
                    theme={theme}
                />

                {showDebrief && (
                    <div data-testid="daily-puzzle-comparison-arrows-legend" className="mt-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#140b06]/95 px-3.5 py-2 text-xs">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2 font-bold text-[#f3c65f]">
                                <span className="inline-block h-2.5 w-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#22c55e]" />
                                Meilleur coup Monte-Carlo (Flèches Or / Émeraude) : <strong className="font-mono text-[#fdf8eb]">{puzzle.bestMoveNotation}</strong>
                            </span>
                            {playedMoves.length > 0 && (
                                <span className="inline-flex items-center gap-2 font-bold text-rose-300">
                                    <span className="inline-block h-2.5 w-6 rounded-full bg-rose-500 border border-dashed border-rose-200" />
                                    Coup joué (Flèches Rouges) : <strong className="font-mono text-white">{playedMoves.map((m) => `${m.from === X_BAR ? 'bar' : m.from}/${m.to === 0 ? 'off' : m.to}`).join(' ')}</strong>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default DailyPuzzleBoard;
