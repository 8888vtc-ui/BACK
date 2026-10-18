'use client';

/**
 * Feuille de match officielle en direct (Score-Sheet) et suivi du Pip Count.
 *
 * Rôle :
 *   Affiche l'historique chronologique des coups joués en notation officielle de tournoi
 *   (ex: 1. 53: 24/20 13/10) ainsi que le comparatif de course (Pip Count).
 *
 * Dépendances :
 *   `formatMoveSequenceNotationAbsolute`, `pipCount`, `RawGameTurn`.
 *
 * Retrait :
 *   Supprimer ce fichier et son appel dans `CoachSidebar.tsx`.
 */

import React, { useMemo } from 'react';
import type { RawGameTurn } from '../../features/rating';
import { formatMoveSequenceNotationAbsolute } from '../../lib/engine/evaluator';
import { pipCount } from '../../engine/backgammonEngine';

export interface MatchScoreSheetProps {
    /** Historique des tours joués de la manche */
    turnsHistory: RawGameTurn[];
    /** Plateau de jeu actuel */
    board?: number[];
    /** Statistiques de match (PR Joueur X) */
    matchStats?: any;
    /** Statistiques de match (PR Adversaire O) */
    matchStatsO?: any;
}

const MatchScoreSheetComponent: React.FC<MatchScoreSheetProps> = ({
    turnsHistory,
    board,
    matchStats,
    matchStatsO,
}) => {
    const pips = useMemo(() => {
        if (!board) return { X: 167, O: 167 };
        return pipCount(board);
    }, [board]);

    const pipDiff = pips.X - pips.O;
    const prValueX = matchStats?.totalErrorRate !== undefined && matchStats.totalErrorRate !== null
        ? Number(matchStats.totalErrorRate).toFixed(1)
        : matchStats?.decisionsCount > 0
        ? ((matchStats.totalEquityLoss / matchStats.decisionsCount) * 500).toFixed(1)
        : null;

    const prValueO = matchStatsO?.totalErrorRate !== undefined && matchStatsO.totalErrorRate !== null
        ? Number(matchStatsO.totalErrorRate).toFixed(1)
        : matchStatsO?.decisionsCount > 0
        ? ((matchStatsO.totalEquityLoss / matchStatsO.decisionsCount) * 500).toFixed(1)
        : null;

    return (
        <div
            data-testid="match-score-sheet"
            className="flex flex-col flex-1 min-h-[160px] rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 shadow-md space-y-2.5"
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
                        title="Performance Rating Joueur Blanc (X)"
                    >
                        PR X: {prValueX ?? '--'}
                    </span>
                    <span
                        data-testid="scoresheet-pr-o"
                        className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-600/60 text-indigo-300 font-mono font-bold"
                        title="Performance Rating IA Noire (O)"
                    >
                        PR IA: {prValueO ?? '--'}
                    </span>
                </div>
            </div>

            {/* 2. Jauge comparative de Pip Count */}
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

            {/* 3. Transcription des coups joués */}
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1 pr-1 text-xs">
                {turnsHistory.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 space-y-1">
                        <div className="text-lg opacity-40">📜</div>
                        <p className="text-[11px] leading-relaxed">
                            Partie en cours. La transcription officielle des coups s'affichera ici à chaque tour.
                        </p>
                    </div>
                ) : (
                    turnsHistory.map((turn) => {
                        const isX = turn.player === 'X';
                        const diceStr = `${turn.dice[0]}-${turn.dice[1]}`;
                        const movesStr = formatMoveSequenceNotationAbsolute(turn.moves, turn.player) || 'Bloqué';

                        return (
                            <div
                                key={turn.turnNumber}
                                className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] transition ${
                                    isX
                                        ? 'bg-blue-950/30 border border-blue-900/40 text-blue-100'
                                        : 'bg-stone-900/60 border border-stone-800/60 text-stone-200'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-mono text-slate-400 text-[10px] w-4">
                                        {turn.turnNumber}.
                                    </span>
                                    <span className={`font-bold ${isX ? 'text-blue-300' : 'text-amber-400'}`}>
                                        {turn.player}
                                    </span>
                                    <span className="font-mono text-slate-400 text-[10px]">
                                        [{diceStr}]
                                    </span>
                                </div>
                                <span className="font-mono font-semibold truncate ml-2 text-right">
                                    {movesStr}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export const MatchScoreSheet = React.memo(MatchScoreSheetComponent);
export default MatchScoreSheet;
