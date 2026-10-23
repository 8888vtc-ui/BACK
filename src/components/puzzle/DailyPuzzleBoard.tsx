'use client';

/**
 * Plateau Interactif du "Puzzle du Jour" (`DailyPuzzleBoard.tsx`).
 *
 * Gère :
 * - Animation d'introduction de 1.2s rejouant le dernier coup de l'adversaire.
 * - Déplacement des dames (Smart Click ou Drag-and-Drop) et décisions de videau (Double / Take / Pass).
 * - Système d'indices progressifs :
 *    * Indice 1 (-25% XP) : Révèle le plan de jeu optimal.
 *    * Indice 2 (-50% XP) : Met en surbrillance les pions sources du meilleur coup.
 * - Calque comparatif visuel du meilleur coup (flèches Or) vs coup joué (flèches Rouges).
 */

import React from 'react';
import { X_BAR, O_BAR, type BoardState, type Move } from '../../engine/backgammonEngine';
import Board from '../board/Board';
import { useBoardTheme } from '../../hooks/useBoardTheme';
import type {
    CubeDecisionAction,
    DailyPuzzleDefinition,
    HintLevel,
} from '../../lib/puzzle/puzzleService';

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

    const coachHighlight = showDebrief
        ? {
              played: [...playedMoves],
              optimal: [...puzzle.bestMoves],
          }
        : null;

    const opponentHighlight = isReplayingIntro
        ? puzzle.opponentReplay.opponentArrows.map((a) => ({
              from: a.from,
              to: a.to,
              isHit: a.isHit,
          }))
        : null;

    return (
        <section
            data-testid="daily-puzzle-board-section"
            className="w-full space-y-4"
        >
            {/* Bandeau d'animation Replay Initial 1.2s ou Indices Progressifs actifs */}
            {isReplayingIntro && (
                <div
                    data-testid="daily-puzzle-intro-replay-banner"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#f3c65f]/60 bg-gradient-to-r from-[#3a160e] via-[#1f0d07] to-[#120905] px-4 py-2.5 text-xs text-[#fdf8eb] shadow-lg animate-pulse"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-base">🎬</span>
                        <span>
                            <strong>Contexte dynamique (1.2s) :</strong> L&apos;adversaire joue{' '}
                            <span className="font-mono font-bold text-[#f3c65f]">
                                {puzzle.opponentReplay.opponentDice[0]}-{puzzle.opponentReplay.opponentDice[1]} :{' '}
                                {puzzle.opponentReplay.opponentNotation}
                            </span>
                        </span>
                    </div>
                    <button
                        type="button"
                        data-testid="daily-puzzle-skip-intro-btn"
                        onClick={onSkipIntro}
                        className="rounded-lg border border-[#d4af37]/40 bg-black/50 px-2.5 py-1 text-[11px] font-bold text-[#f3c65f] hover:border-[#f3c65f]"
                    >
                        Passer l&apos;animation →
                    </button>
                </div>
            )}

            {/* Affichage des Indices Progressifs débloqués (Indice 1 : -25% XP, Indice 2 : -50% XP) */}
            {hintLevel >= 1 && (
                <div
                    data-testid="daily-puzzle-hint-panel"
                    className="rounded-2xl border border-[#d4af37]/55 bg-gradient-to-r from-[#28130a]/95 to-[#140a05]/95 p-4 shadow-xl space-y-2"
                >
                    <div
                        data-testid="daily-puzzle-hint-1"
                        className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#fdf8eb]"
                    >
                        <div>
                            <span className="rounded bg-[#d4af37]/20 border border-[#d4af37]/50 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#f3c65f] mr-2">
                                💡 INDICE 1 (-25% XP) · PLAN DE JEU
                            </span>
                            <span className="font-semibold text-[#fdf8eb]">{puzzle.gamePlanHint}</span>
                        </div>
                    </div>

                    {hintLevel >= 2 && (
                        <div
                            data-testid="daily-puzzle-hint-2"
                            className="flex flex-wrap items-center gap-2 border-t border-[#d4af37]/20 pt-2 text-xs text-[#fdf8eb]"
                        >
                            <span className="rounded bg-amber-500/25 border border-[#f3c65f]/65 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#f3c65f]">
                                ✨ INDICE 2 (-50% XP) · PIONS SOURCES
                            </span>
                            <span>Pions sources du meilleur coup mis en surbrillance :</span>
                            {Array.from(highlightedHintSources).map((pt) => (
                                <span
                                    key={pt}
                                    data-testid={`hint-source-badge-${pt}`}
                                    className="rounded-lg border border-[#f3c65f] bg-[#3b1c0c] px-2.5 py-0.5 font-mono text-xs font-black text-[#fff3c4] shadow-[0_0_12px_rgba(243,198,95,0.45)]"
                                >
                                    {formatPointLabel(pt)}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Écrin du Plateau de Tournoi */}
            <div className="relative rounded-3xl border border-[#d4af37]/45 bg-[#080a0f] p-2 sm:p-4 shadow-[0_28px_70px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(243,198,95,0.22)]">
                <Board
                    state={boardState}
                    gamePhase="HUMAN_MOVING"
                    leftDieTargets={leftDieTargets}
                    rightDieTargets={rightDieTargets}
                    selectedPoint={
                        selectedPoint ??
                        (hintLevel >= 2 && puzzle.optimalSourcePoints.length > 0
                            ? puzzle.optimalSourcePoints[0]
                            : null)
                    }
                    selectedDie={selectedDie}
                    usedDice={[usedDice[0], usedDice[1]]}
                    opponentDice={
                        isReplayingIntro
                            ? [
                                  puzzle.opponentReplay.opponentDice[0],
                                  puzzle.opponentReplay.opponentDice[1],
                              ]
                            : null
                    }
                    coachHighlight={coachHighlight}
                    opponentHighlight={opponentHighlight}
                    onCheckerClick={onCheckerClick}
                    onCheckerRightClick={(pt) => {
                        onCheckerClick(pt);
                        onSelectDie(1);
                    }}
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

                {/* Légende des flèches comparatives lors du Débriefing */}
                {showDebrief && (
                    <div
                        data-testid="daily-puzzle-comparison-arrows-legend"
                        className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d4af37]/35 bg-[#140b06]/95 px-4 py-2.5 text-xs"
                    >
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="inline-flex items-center gap-2 font-bold text-[#f3c65f]">
                                <span className="inline-block h-2.5 w-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#22c55e] shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                                Meilleur coup Open Sage (Flèches Or / Émeraude) :{' '}
                                <strong className="font-mono text-[#fdf8eb]">{puzzle.bestMoveNotation}</strong>
                            </span>
                            {playedMoves.length > 0 && (
                                <span className="inline-flex items-center gap-2 font-bold text-rose-300">
                                    <span className="inline-block h-2.5 w-6 rounded-full bg-rose-500 border border-dashed border-rose-200" />
                                    Coup joué (Flèches Rouges) :{' '}
                                    <strong className="font-mono text-white">
                                        {playedMoves
                                            .map(
                                                (m) =>
                                                    `${m.from === X_BAR ? 'bar' : m.from}/${
                                                        m.to === 0 ? 'off' : m.to
                                                    }`,
                                            )
                                            .join(' ')}
                                    </strong>
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Barre de Contrôle d'Ébénisterie : Coup en cours, Décisions de Videau, Indices & Validation */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-3xl border border-[#d4af37]/35 bg-gradient-to-r from-[#1c0d07] via-[#10131c] to-[#160b06] p-4 shadow-2xl">
                {/* Séquence de sous-coups joués */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold uppercase tracking-wider text-[#c7b89c]">
                        Séquence jouée :
                    </span>
                    {playedMoves.length === 0 ? (
                        <span className="italic text-[#8e8270]">
                            Cliquez ou glissez vos dames (Smart Click / Drag)
                        </span>
                    ) : (
                        playedMoves.map((m, idx) => (
                            <span
                                key={`${m.from}-${m.to}-${idx}`}
                                data-testid={`played-submove-pill-${idx}`}
                                className="rounded-xl border border-[#f3c65f]/55 bg-[#2b140a] px-2.5 py-1 font-mono text-xs font-extrabold text-[#fdf8eb]"
                            >
                                {m.from === X_BAR ? 'bar' : m.from}/{m.to === 0 ? 'off' : m.to}
                            </span>
                        ))
                    )}
                </div>

                {/* Boutons d'Action : Annuler, Réinitialiser, Indice Progressif, Videau, Valider */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        data-testid="daily-puzzle-undo-btn"
                        onClick={onUndoLastMove}
                        disabled={playedMoves.length === 0 || isSolved}
                        className="rounded-xl border border-[#d4af37]/35 bg-[#160c07] px-3 py-2 text-xs font-bold text-[#e2d2b5] hover:border-[#f3c65f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        ↶ Annuler
                    </button>

                    <button
                        type="button"
                        data-testid="daily-puzzle-reset-btn"
                        onClick={onResetAttempt}
                        disabled={playedMoves.length === 0}
                        className="rounded-xl border border-[#d4af37]/35 bg-[#160c07] px-3 py-2 text-xs font-bold text-[#e2d2b5] hover:border-[#f3c65f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                        🔄 Réinitialiser
                    </button>

                    <button
                        type="button"
                        data-testid="daily-puzzle-hint-btn"
                        onClick={onUnlockNextHint}
                        disabled={hintLevel >= 2 || isSolved}
                        className="rounded-xl border border-[#f3c65f]/50 bg-gradient-to-b from-[#33180c] to-[#1a0b05] px-3.5 py-2 text-xs font-extrabold text-[#f3c65f] hover:border-[#fff3c4] disabled:opacity-45 disabled:cursor-not-allowed transition"
                    >
                        {hintLevel === 0
                            ? '💡 Indice 1 : Plan (-25% XP)'
                            : hintLevel === 1
                              ? '✨ Indice 2 : Pions (-50% XP)'
                              : '💡 Indices dévoilés (-50% XP)'}
                    </button>

                    {puzzle.decisionType === 'cube' && (
                        <div
                            data-testid="daily-puzzle-cube-actions"
                            className="flex items-center gap-1.5"
                        >
                            <button
                                type="button"
                                data-testid="cube-action-double"
                                onClick={() => onSubmitCubeDecision('DOUBLE')}
                                className="rounded-xl border border-[#f3c65f]/60 bg-[#3a120d] px-3 py-2 text-xs font-extrabold text-[#fce8b2] hover:brightness-110"
                            >
                                ×2 Double
                            </button>
                            <button
                                type="button"
                                data-testid="cube-action-take"
                                onClick={() => onSubmitCubeDecision('TAKE')}
                                className="rounded-xl border border-emerald-500/60 bg-emerald-950/70 px-3 py-2 text-xs font-extrabold text-emerald-200 hover:brightness-110"
                            >
                                Take
                            </button>
                            <button
                                type="button"
                                data-testid="cube-action-pass"
                                onClick={() => onSubmitCubeDecision('PASS')}
                                className="rounded-xl border border-rose-500/60 bg-rose-950/70 px-3 py-2 text-xs font-extrabold text-rose-200 hover:brightness-110"
                            >
                                Pass
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        data-testid="daily-puzzle-submit-btn"
                        onClick={onSubmitCheckerSolution}
                        disabled={playedMoves.length === 0 || isSolved}
                        className="rounded-2xl border border-[#ffecb3]/80 bg-gradient-to-r from-[#d4af37] via-[#f8d778] to-[#b88218] px-5 py-2.5 font-serif text-xs sm:text-sm font-black uppercase tracking-wider text-[#1a0d05] shadow-[0_10px_26px_rgba(212,175,55,0.38),inset_0_1px_0_rgba(255,255,255,0.75)] hover:brightness-105 active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed transition"
                    >
                        ✦ Valider mon coup
                    </button>
                </div>
            </div>
        </section>
    );
};

export default DailyPuzzleBoard;
