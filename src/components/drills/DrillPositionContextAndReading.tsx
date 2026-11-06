'use client';

/**
 * @file src/components/drills/DrillPositionContextAndReading.tsx
 * @description Calculateur de télémétrie de position (couplé à `validateBoardState` 15 pions exacts)
 * et tableau de classement mathématique post-validation **Vrai 3-Ply Cubeful** (GNU Backgammon 3-ply & Open Sage 3-ply — Zéro donnée factice).
 * Strictement < 190 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useState } from 'react';
import { applyMove, serializeCanonicalXGID } from '../../engine/backgammonEngine';
import { GNUBG_3PLY_CERTIFIED_POSITIONS } from '../../lib/engine/gnubg3PlyCertifiedPositions';
import { GNUBG_3PLY_QUIZ_BANK } from '../../features/drills/gnubg3PlyQuizBank';
import { BGSAGE_3PLY_FACTORY_SEED } from '../../features/drills/bgsage3PlyFactorySeed';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';
import type { PlayerBlunderRecord } from '../../features/drills/types';
import { validateBoardState } from '../../features/drills/drillSubAgentsPipeline';

export interface PositionTelemetry {
    readonly isValid15Checkers: boolean;
    readonly whitePips: number;
    readonly blackPips: number;
    readonly pipDiff: number;
    readonly whiteHomePoints: number;
    readonly whiteMadePoints: number;
    readonly blackMadePoints: number;
    readonly backCheckersSummary: string;
    readonly awayLabel: string;
    readonly compactMatchLabel: string;
    readonly compactCubeLabel: string;
    readonly compactRaceDiffLabel: string;
    readonly singleLineContext: string;
    readonly structureLineContext: string;
}

export function computePositionTelemetry(blunder: PlayerBlunderRecord, isBeginner = false): PositionTelemetry {
    const validated = validateBoardState(blunder.board, blunder.player);
    const board = validated.normalizedBoard;

    let whiteHomePoints = 0;
    for (let i = 1; i <= 6; i++) {
        if ((board[i] ?? 0) >= 2) whiteHomePoints++;
    }

    const ctx = blunder.matchContext;
    const matchLength = ctx?.matchLength ?? 0;
    const scoreX = ctx?.scoreX ?? 0;
    const scoreO = ctx?.scoreO ?? 0;
    const awayX = Math.max(1, matchLength - scoreX);
    const awayO = Math.max(1, matchLength - scoreO);
    const awayLabel = matchLength === 0 ? 'Money Game' : `${awayX}-away / ${awayO}-away`;

    const compactMatchLabel =
        matchLength === 0
            ? (isBeginner ? 'Partie Libre' : 'Money Game (Cube Libre)')
            : isBeginner
                ? `Match ${matchLength} pts (${scoreX}-${scoreO})`
                : `Match ${matchLength} pts (${scoreX}-${scoreO}${ctx?.crawford ? ' Cr' : ''} • ${awayLabel})`;

    const cubeValue = ctx?.cubeValue ?? 1;
    const cubeOwner = ctx?.cubeOwner ?? null;
    const cubePosText = cubeOwner === null ? 'Centre' : cubeOwner === 'X' ? 'Blanc' : 'Noir';
    const compactCubeLabel = `Videau : ${cubeValue} (${cubePosText})`;

    const { pipDiff, whitePips, blackPips, whiteMadePoints, blackMadePoints, backCheckersSummary } = validated;
    const compactRaceDiffLabel =
        pipDiff === 0
            ? (isBeginner ? 'Égalité' : 'Égalité : 0 pip')
            : pipDiff > 0
                ? (isBeginner ? `+${pipDiff} pips d'avance` : `Avance : +${pipDiff} pips`)
                : (isBeginner ? `${pipDiff} pips de retard` : `Retard : ${pipDiff} pips`);

    const singleLineContext = `${compactMatchLabel} • ${compactCubeLabel} • Pips : ${whitePips} vs ${blackPips} (${compactRaceDiffLabel})`;
    const structureLineContext = `Portes faites : Blanc ${whiteMadePoints} | Noir ${blackMadePoints} • Pions arrières : ${backCheckersSummary}`;

    return {
        isValid15Checkers: validated.isValid15Checkers,
        whitePips,
        blackPips,
        pipDiff,
        whiteHomePoints,
        whiteMadePoints,
        blackMadePoints,
        backCheckersSummary,
        awayLabel,
        compactMatchLabel,
        compactCubeLabel,
        compactRaceDiffLabel,
        singleLineContext,
        structureLineContext,
    };
}

export interface CandidateMathRankRow {
    readonly rank: number;
    readonly notation: string;
    /** false = coup absent de l'analyse GNUBG 3-ply : affiché « non évalué », aucune valeur inventée. */
    readonly isEvaluated: boolean;
    readonly equity: number;
    readonly deltaEmg: number;
    readonly winPct: number;
    readonly gammonPct: number;
    readonly isOptimal: boolean;
    readonly isUserChoice: boolean;
}

interface GnubgMoveValues {
    readonly rank: number;
    readonly notation: string;
    readonly equityLoss: number;
    readonly win: number;
    readonly winGammon: number;
}

function normNotation(s: string): string {
    return s.replace(/\*/g, '').trim().toLowerCase().split(/\s+/).sort().join(' ');
}

/** Développe `8/4(2)`, les coups chaînés et `bar` en sous-coups simples. */
function expandNotationForSim(notation: string): string {
    const out: string[] = [];
    for (const raw of notation.replace(/\*/g, '').trim().split(/\s+/)) {
        const rep = raw.match(/^(.+)\((\d)\)$/);
        const parts = (rep ? rep[1]! : raw).toLowerCase().replace('bar', '25').replace('off', '0').split('/');
        const steps: string[] = [];
        for (let k = 0; k < parts.length - 1; k++) steps.push(`${parts[k]}/${parts[k + 1]}`);
        for (let c = 0; c < (rep ? Number(rep[2]) : 1); c++) out.push(...steps);
    }
    return out.join(' ');
}

function boardKeyAfter(baseBoard: readonly number[], notation: string, player: 'X' | 'O'): string | null {
    try {
        let b = [...baseBoard];
        for (const m of parseCoachNotationMoves(expandNotationForSim(notation), player)) b = applyMove(b, m, player);
        return b.slice(0, 26).join(',');
    } catch {
        return null;
    }
}

/** Valeurs GNUBG 3-ply de la position (table certifiée ou banque de quiz), par id puis par XGID + dés. */
function findGnubgMoves(blunder: PlayerBlunderRecord, baseBoard: number[]): readonly GnubgMoveValues[] {
    if (blunder.candidateMoves3Ply && blunder.candidateMoves3Ply.length > 0) return blunder.candidateMoves3Ply;
    const byId =
        BGSAGE_3PLY_FACTORY_SEED.find((q) => q.id === blunder.id)?.candidateMoves3Ply ??
        GNUBG_3PLY_CERTIFIED_POSITIONS.find((p) => p.id === blunder.id)?.moves ??
        GNUBG_3PLY_QUIZ_BANK.find((q) => q.id === blunder.id)?.candidateMoves3Ply;
    if (byId) return byId;
    const canonBody = serializeCanonicalXGID({
        board: baseBoard,
        turn: blunder.player,
        cubeValue: blunder.matchContext?.cubeValue ?? 1,
        cubeOwner: blunder.matchContext?.cubeOwner ?? null,
        dice: blunder.dice,
        matchLength: blunder.matchContext?.matchLength ?? 0,
        scoreX: blunder.matchContext?.scoreX ?? 0,
        scoreO: blunder.matchContext?.scoreO ?? 0,
        crawford: blunder.matchContext?.crawford ?? false,
        doubled: false,
        resigned: 0,
    }).split(':')[0];
    const sameDice = (d: readonly [number, number]): boolean =>
        Math.max(d[0], d[1]) === Math.max(blunder.dice[0], blunder.dice[1]) &&
        Math.min(d[0], d[1]) === Math.min(blunder.dice[0], blunder.dice[1]);
    return (
        BGSAGE_3PLY_FACTORY_SEED.find((q) => q.xgid.split(':')[0] === canonBody && sameDice(q.dice))?.candidateMoves3Ply ??
        GNUBG_3PLY_CERTIFIED_POSITIONS.find((p) => p.xgid.split(':')[0] === canonBody && sameDice(p.dice))?.moves ??
        GNUBG_3PLY_QUIZ_BANK.find((q) => q.xgid.split(':')[0] === canonBody && sameDice(q.dice))?.candidateMoves3Ply ??
        []
    );
}

/**
 * Classement des coups candidats avec les valeurs EXACTES de GNU Backgammon 3-ply cubeful.
 * Un coup absent de l'analyse GNUBG est marqué « non évalué » : plus aucun moteur local ni écart forcé.
 */
export function buildCandidateMathTable(
    blunder: PlayerBlunderRecord,
    playedNotation: string,
): ReadonlyArray<CandidateMathRankRow> {
    const baseBoard = validateBoardState(blunder.board, blunder.player).normalizedBoard;
    const player = blunder.player;

    const rawChoices =
        blunder.quizChoices && blunder.quizChoices.length > 0
            ? [...blunder.quizChoices]
            : [blunder.optimalMove, blunder.playedMove];
    if (playedNotation.trim() && !rawChoices.some((c) => normNotation(c) === normNotation(playedNotation))) {
        rawChoices.push(playedNotation.trim());
    }

    const gnubgMoves = findGnubgMoves(blunder, baseBoard);
    const byBoard = new Map<string, GnubgMoveValues>();
    const byNotation = new Map<string, GnubgMoveValues>();
    for (const m of gnubgMoves) {
        byNotation.set(normNotation(m.notation), m);
        const k = boardKeyAfter(baseBoard, m.notation, player);
        if (k && !byBoard.has(k)) byBoard.set(k, m);
    }
    const optimalNorm = normNotation(blunder.optimalMove);

    const rows = rawChoices.map((notation) => {
        const k = boardKeyAfter(baseBoard, notation, player);
        const m = (k ? byBoard.get(k) : undefined) ?? byNotation.get(normNotation(notation));
        return {
            notation,
            isEvaluated: Boolean(m),
            equity: m ? -m.equityLoss : 0,
            deltaEmg: m ? -m.equityLoss : 0,
            winPct: m ? Math.round(m.win * 100) : 0,
            gammonPct: m ? Math.round(m.winGammon * 100) : 0,
            isOptimal: m ? m.equityLoss === 0 : normNotation(notation) === optimalNorm,
            isUserChoice: normNotation(notation) === normNotation(playedNotation),
        };
    });

    rows.sort((a, b) => {
        if (a.isEvaluated !== b.isEvaluated) return a.isEvaluated ? -1 : 1;
        return b.deltaEmg - a.deltaEmg;
    });
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}


export const DrillPrMathRankingTable: React.FC<{
    readonly rows: ReadonlyArray<CandidateMathRankRow>;
}> = ({ rows }) => {
    const [open, setOpen] = useState<boolean>(false);
    return (
        <div data-testid="drill-pr-math-ranking" className="rounded-lg border border-emerald-400/30 bg-[#070a10] p-1.5">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                data-testid="drill-3ply-drawer-toggle"
                className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-300 hover:text-white transition px-1 py-0.5"
            >
                <span>Détails 3-ply ({rows.length} coups évalués)</span>
                <span>{open ? '▲ Masquer' : '▼ Afficher ΔEMG & MWC'}</span>
            </button>
            {open && (
                <div className="divide-y divide-white/5 pt-1">
                    {rows.map((r) => (
                        <div
                            key={r.notation}
                            className={`flex items-center justify-between py-0.5 px-1.5 text-[11px] font-mono ${
                                r.isOptimal
                                ? 'bg-emerald-500/15 text-emerald-200 font-bold rounded'
                                : r.isUserChoice
                                    ? 'bg-rose-500/15 text-rose-200 font-bold rounded'
                                    : 'text-slate-300'
                        }`}
                    >
                        <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">#{r.rank}</span>
                            <span>{r.notation}</span>
                            {r.isOptimal && <span className="text-[10px] text-emerald-400">★ Optimal</span>}
                            {r.isUserChoice && !r.isOptimal && <span className="text-[10px] text-rose-400">✗ Joué</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            {r.isEvaluated ? (
                                <>
                                    <span className={r.deltaEmg === 0 ? 'text-emerald-300' : r.deltaEmg >= -0.02 ? 'text-amber-300' : 'text-rose-300'}>
                                        {r.deltaEmg === 0 ? '0.000' : r.deltaEmg.toFixed(3)} EMG
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        W:{r.winPct}% · G:{r.gammonPct}%
                                    </span>
                                </>
                            ) : (
                                <span className="text-[10px] text-slate-500" title="Coup absent de l'analyse GNU Backgammon 3-ply">
                                    non évalué
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
    );
};
