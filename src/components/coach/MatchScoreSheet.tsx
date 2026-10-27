'use client';

/**
 * Feuille de match officielle en direct (Score-Sheet), Historique Interactif & Replay Pas-à-Pas (Audit 18 / 20).
 *
 * Rôle :
 *   - Affiche l'historique chronologique des coups joués en notation officielle de tournoi
 *     (ex: `1. X [5-3] 24/20 13/10` puis `1. O [6-4] 24/18 13/9`).
 *   - Fournit une barre de Replay pas-à-pas (`⏮`, `◀`, `▶`, `🔴 Direct`) et le clic sur
 *     chaque tour pour prévisualiser l'état fantôme et retourner instantanément au direct.
 *
 * Strictement 0 `any`, < 300 lignes.
 */

import React, { useMemo, useRef, useEffect } from 'react';
import type { RawGameTurn } from '../../features/rating';
import { formatStandardMoveSequence } from '../../features/coach/coachMoveNotation';
import { pipCount } from '../../engine/backgammonEngine';
import { useInteractiveReplay } from '../../hooks/useInteractiveReplay';

export interface EvaluatedMoveSummary {
    turnNumber?: number;
    verdict: string;
    equityLoss: number;
}

export interface ScoreSheetMatchStats {
    decisionsCount?: number;
    totalEquityLoss?: number;
    totalErrorRate?: number | null;
    evaluatedMoves?: EvaluatedMoveSummary[];
}

export interface MatchScoreSheetProps {
    /** Historique des tours joués de la manche */
    turnsHistory: RawGameTurn[];
    /** Plateau de jeu actuel */
    board?: number[];
    /** Statistiques de match (PR Joueur X) */
    matchStats?: ScoreSheetMatchStats | null;
    /** Statistiques de match (PR Adversaire O) */
    matchStatsO?: ScoreSheetMatchStats | null;
    /** Callback optionnel notifiant le tour sélectionné en mode Replay fantôme */
    onReplayTurnChange?: (turn: RawGameTurn | null, index: number | null) => void;
}

function getBadgeStyle(verdict: string, equityLoss: number) {
    if (verdict === 'optimal' || equityLoss >= -0.02) {
        return { label: 'Optimal ✅', classes: 'bg-emerald-950/80 border-emerald-600/60 text-emerald-300' };
    }
    if (verdict === 'blunder' || verdict === 'howler' || equityLoss <= -0.08) {
        return { label: 'Blunder ❌', classes: 'bg-rose-950/80 border-rose-600/60 text-rose-300' };
    }
    return { label: 'Imprécision ⚠️', classes: 'bg-amber-950/80 border-amber-600/60 text-amber-300' };
}

function formatPrStat(stats?: ScoreSheetMatchStats | null): string | null {
    if (!stats) return null;
    if (stats.totalErrorRate !== undefined && stats.totalErrorRate !== null) {
        return Number(stats.totalErrorRate).toFixed(1);
    }
    if ((stats.decisionsCount ?? 0) > 0 && stats.totalEquityLoss !== undefined) {
        return ((stats.totalEquityLoss / (stats.decisionsCount ?? 1)) * 500).toFixed(1);
    }
    return null;
}

const MatchScoreSheetComponent: React.FC<MatchScoreSheetProps> = ({
    turnsHistory,
    board,
    matchStats,
    matchStatsO,
    onReplayTurnChange,
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    const replay = useInteractiveReplay({
        turnsHistory,
        liveBoard: board,
        onReplayChange: onReplayTurnChange,
    });

    const pips = useMemo(() => {
        const targetBoard = replay.activeBoard;
        if (!targetBoard) return { X: 167, O: 167 };
        return pipCount([...targetBoard]);
    }, [replay.activeBoard]);

    const pipDiff = pips.X - pips.O;
    const prValueX = formatPrStat(matchStats);
    const prValueO = formatPrStat(matchStatsO);

    const annotatedTurns = useMemo(() => {
        let currentRound = 1;
        return turnsHistory.map((turn, index) => {
            if (index > 0 && turn.player === 'X') {
                currentRound += 1;
            }
            return { ...turn, roundNumber: currentRound };
        });
    }, [turnsHistory]);

    useEffect(() => {
        if (turnsHistory.length > 0 && replay.isLive && typeof bottomRef.current?.scrollIntoView === 'function') {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [turnsHistory.length, replay.isLive]);

    return (
        <div
            data-testid="match-score-sheet"
            data-replay-mode={replay.isLive ? 'live' : 'replay'}
            className="flex flex-col flex-1 min-h-[160px] rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-md space-y-2"
        >
            {/* 1. En-tête Feuille de match & PR comparatif */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-serif text-xs">📋</span>
                    <span className="text-xs font-bold text-slate-200 tracking-wide">
                        Feuille de Match en Direct
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span
                        data-testid="scoresheet-pr-x"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono font-bold"
                    >
                        PR X: {prValueX ?? '--'}
                    </span>
                    <span
                        data-testid="scoresheet-pr-o"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-600/60 text-indigo-300 font-mono font-bold"
                    >
                        PR IA: {prValueO ?? '--'}
                    </span>
                </div>
            </div>

            {/* 2. Barre de Replay Pas-à-Pas (Audit 18 / 20) */}
            {turnsHistory.length > 0 && (
                <div
                    data-testid="replay-controls-bar"
                    className="flex items-center justify-between gap-1 rounded-lg bg-slate-950/80 px-2 py-1 border border-slate-800 text-[10px]"
                >
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            data-testid="btn-replay-first"
                            disabled={!replay.canStepPrev}
                            onClick={replay.stepFirst}
                            aria-label="Premier coup"
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35"
                        >
                            ⏮
                        </button>
                        <button
                            type="button"
                            data-testid="btn-replay-prev"
                            disabled={!replay.canStepPrev}
                            onClick={replay.stepPrev}
                            aria-label="Coup précédent"
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35"
                        >
                            ◀
                        </button>
                        <button
                            type="button"
                            data-testid="btn-replay-next"
                            disabled={!replay.canStepNext}
                            onClick={replay.stepNext}
                            aria-label="Coup suivant"
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-35"
                        >
                            ▶
                        </button>
                    </div>

                    <button
                        type="button"
                        data-testid="btn-replay-live"
                        onClick={replay.returnToLive}
                        className={`px-2 py-0.5 rounded font-bold transition-colors ${
                            replay.isLive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                        }`}
                    >
                        {replay.isLive ? '● En Direct' : '↩ Retour au Direct'}
                    </button>
                </div>
            )}

            {/* Bannière d'aperçu fantôme en mode Replay */}
            {!replay.isLive && replay.selectedTurn && (
                <div
                    data-testid="replay-ghost-preview-banner"
                    className="flex items-center justify-between rounded-lg border border-amber-500/50 bg-amber-950/40 px-2.5 py-1 text-[11px] text-amber-200"
                >
                    <span>
                        Aperçu Fantôme — Tour #{replay.selectedTurn.turnNumber} ({replay.selectedTurn.player})
                    </span>
                    <span data-testid="replay-official-notation" className="font-mono font-bold text-amber-300">
                        {replay.officialNotation}
                    </span>
                </div>
            )}

            {/* 3. Jauge comparative de Pip Count */}
            <div className="flex items-center justify-between rounded-lg bg-slate-950/70 px-2.5 py-1.5 border border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-100 ring-1 ring-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-300">X :</span>
                    <span className="font-mono font-bold text-white">{pips.X}</span>
                </div>
                <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {pipDiff === 0 ? '±0' : pipDiff < 0 ? `+${Math.abs(pipDiff)} (X mène)` : `+${pipDiff} (O mène)`}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">O :</span>
                    <span className="font-mono font-bold text-white">{pips.O}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-900 ring-1 ring-slate-600 shadow-inner shrink-0" />
                </div>
            </div>

            {/* 4. Transcription interactive des coups en notation officielle */}
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 pr-1 text-xs">
                {annotatedTurns.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 space-y-1">
                        <div className="text-lg opacity-40">📜</div>
                        <p className="text-[11px] leading-relaxed">
                            Partie en cours. La transcription officielle des coups s'affichera ici à chaque tour.
                        </p>
                    </div>
                ) : (
                    annotatedTurns.map((turn, idx) => {
                        const isX = turn.player === 'X';
                        const isSelectedReplay = replay.replayIndex === idx;
                        const diceStr = `${turn.dice[0]}-${turn.dice[1]}`;
                        const movesStr =
                            formatStandardMoveSequence(turn.moves, turn.player, turn.boardBefore) || 'Bloqué';
                        const evalTurn =
                            isX && matchStats?.evaluatedMoves
                                ? matchStats.evaluatedMoves.find((em) => em.turnNumber === turn.turnNumber) ??
                                  matchStats.evaluatedMoves[Math.floor(idx / 2)]
                                : null;

                        return (
                            <div
                                key={`${turn.roundNumber}-${turn.player}-${idx}`}
                                data-testid={`scoresheet-turn-${idx}`}
                                onClick={() => replay.selectTurnIndex(isSelectedReplay ? null : idx)}
                                className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] cursor-pointer transition ${
                                    isSelectedReplay
                                        ? 'ring-2 ring-amber-400 bg-amber-950/50 text-amber-100'
                                        : isX
                                          ? 'bg-blue-950/30 border border-blue-900/40 text-blue-100 hover:bg-blue-950/50'
                                          : 'bg-stone-900/60 border border-stone-800/60 text-stone-200 hover:bg-stone-800/70'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-mono text-slate-400 text-[10px] w-5">{turn.roundNumber}.</span>
                                    <span className={`font-bold ${isX ? 'text-blue-300' : 'text-amber-400'}`}>
                                        {turn.player}
                                    </span>
                                    <span className="font-mono text-slate-400 text-[10px]">[{diceStr}]</span>
                                </div>
                                <div className="flex items-center gap-2 truncate ml-2">
                                    <span className="font-mono font-semibold truncate text-right">{movesStr}</span>
                                    {evalTurn && (
                                        <span
                                            title={`Perte d'équité : ${evalTurn.equityLoss.toFixed(3)}`}
                                            className={`text-[11px] font-bold px-1.5 py-0.2 rounded font-mono border ${getBadgeStyle(evalTurn.verdict, evalTurn.equityLoss).classes}`}
                                        >
                                            {getBadgeStyle(evalTurn.verdict, evalTurn.equityLoss).label.split(' ')[0]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export const MatchScoreSheet = React.memo(MatchScoreSheetComponent);
export default MatchScoreSheet;
