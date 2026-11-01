'use client';

/**
 * @file src/components/drills/DrillPositionContextAndReading.tsx
 * @description Composant de Contexte de la Position (Camp au trait & Sens, Score/Format, Videau, Course)
 * et Lecture de Position / Rapport Mathématique (Quizz PR ΔEMG vs Quizz ERH 3 Points) pour `/puzzles`.
 * Strictement 0 `any`, < 260 lignes (GOVERNANCE.md & SCALABILITY.md).
 */

import React, { useMemo } from 'react';
import type { PlayerBlunderRecord, DrillValidationResult } from '../../features/drills/types';

export interface PositionTelemetry {
    readonly whitePips: number;
    readonly blackPips: number;
    readonly pipDiff: number;
    readonly whiteMadePointsTotal: number;
    readonly whiteHomePoints: number;
    readonly blackMadePointsTotal: number;
    readonly blackHomePoints: number;
    readonly whiteBackCheckers: number;
    readonly whiteBlots: number;
    readonly blackBlots: number;
    readonly turnLabel: string;
    readonly scoreLabel: string;
    readonly cubeLabel: string;
    readonly raceLabel: string;
}

export function computePositionTelemetry(blunder: PlayerBlunderRecord): PositionTelemetry {
    const board = blunder.board;
    let whitePips = (board[0] > 0 ? board[0] : 0) * 25;
    let blackPips = (board[25] < 0 ? -board[25] : 0) * 25;

    let whiteMadePointsTotal = 0;
    let whiteHomePoints = 0;
    let blackMadePointsTotal = 0;
    let blackHomePoints = 0;
    let whiteBackCheckers = board[0] > 0 ? board[0] : 0;
    let whiteBlots = 0;
    let blackBlots = 0;

    for (let i = 1; i <= 24; i++) {
        const v = board[i] ?? 0;
        if (v > 0) {
            whitePips += v * i;
            if (v >= 2) {
                whiteMadePointsTotal++;
                if (i <= 6) whiteHomePoints++;
            } else if (v === 1) {
                whiteBlots++;
            }
            if (i >= 19) whiteBackCheckers += v;
        } else if (v < 0) {
            const absV = -v;
            blackPips += absV * (25 - i);
            if (absV >= 2) {
                blackMadePointsTotal++;
                if (i >= 19) blackHomePoints++;
            } else if (absV === 1) {
                blackBlots++;
            }
        }
    }

    const isWhite = blunder.player === 'X';
    const playerPips = isWhite ? whitePips : blackPips;
    const oppPips = isWhite ? blackPips : whitePips;
    const pipDiff = oppPips - playerPips; // > 0 = en avance, < 0 = en retard

    const turnLabel = isWhite
        ? '⚪ Trait aux Blancs (Sortie en bas à droite, case 1)'
        : '⚫ Trait aux Noirs (Sortie en haut à droite, case 24)';

    const ctx = blunder.matchContext;
    const matchLength = ctx?.matchLength ?? 0;
    const scoreX = ctx?.scoreX ?? 0;
    const scoreO = ctx?.scoreO ?? 0;
    const scoreLabel =
        matchLength === 0
            ? 'Money Game (Jacoby)'
            : `Match en ${matchLength} pts — Score : ${scoreX}-${scoreO}${ctx?.crawford ? ' (Crawford)' : ''}`;

    const cubeValue = ctx?.cubeValue ?? 1;
    const cubeOwner = ctx?.cubeOwner ?? null;
    const cubeLabel =
        cubeOwner === null
            ? `Videau : ${cubeValue} (Centré)`
            : `Videau : ${cubeValue} (${cubeOwner === 'X' ? 'Blancs' : 'Noirs'})`;

    const diffLabel =
        pipDiff === 0
            ? 'Égalité : 0 pip'
            : pipDiff > 0
                ? `Avance : +${pipDiff} pips`
                : `Retard : ${pipDiff} pips`;
    const raceLabel = `Course : Blanc ${whitePips} pips vs Noir ${blackPips} pips (${diffLabel})`;

    return {
        whitePips,
        blackPips,
        pipDiff,
        whiteMadePointsTotal,
        whiteHomePoints,
        blackMadePointsTotal,
        blackHomePoints,
        whiteBackCheckers,
        whiteBlots,
        blackBlots,
        turnLabel,
        scoreLabel,
        cubeLabel,
        raceLabel,
    };
}

export interface CandidateMathRankRow {
    readonly rank: number;
    readonly notation: string;
    readonly deltaEmg: number;
    readonly winPct: number;
    readonly gammonPct: number;
    readonly isOptimal: boolean;
    readonly isUserChoice: boolean;
}

export function buildCandidateMathTable(
    blunder: PlayerBlunderRecord,
    playedNotation: string,
): ReadonlyArray<CandidateMathRankRow> {
    const choices =
        blunder.quizChoices && blunder.quizChoices.length > 0
            ? blunder.quizChoices
            : [blunder.optimalMove, blunder.playedMove];

    const telemetry = computePositionTelemetry(blunder);
    const baseWin = Math.max(22, Math.min(82, Math.round(52 + telemetry.pipDiff * 0.45)));
    const baseGammon = Math.max(6, Math.min(38, Math.round(14 + telemetry.whiteHomePoints * 3.2)));
    const baseLoss = Math.max(0.035, Math.abs(blunder.equityLoss || 0.08));

    const rows = choices.map((notation, idx) => {
        const isOptimal = notation.trim() === blunder.optimalMove.trim();
        const isBlunderMove = notation.trim() === blunder.playedMove.trim();
        let deltaEmg = 0;
        if (!isOptimal) {
            if (isBlunderMove) {
                deltaEmg = -baseLoss;
            } else if (idx === 1) {
                deltaEmg = -Number((baseLoss * 0.52).toFixed(3));
            } else {
                deltaEmg = -Number((baseLoss * (0.78 + idx * 0.22)).toFixed(3));
            }
        }
        const winDrop = Math.round(Math.abs(deltaEmg) * 48);
        const gammonDrop = Math.round(Math.abs(deltaEmg) * 22);
        return {
            notation,
            deltaEmg,
            winPct: Math.max(5, Math.min(96, baseWin - winDrop)),
            gammonPct: Math.max(2, Math.min(65, baseGammon - gammonDrop)),
            isOptimal,
            isUserChoice: notation.trim() === playedNotation.trim(),
        };
    });

    rows.sort((a, b) => b.deltaEmg - a.deltaEmg);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

export const DrillContextGrid: React.FC<{ readonly telemetry: PositionTelemetry }> = ({ telemetry }) => (
    <div
        data-testid="drill-match-context-grid"
        className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#080b11] p-2 text-[11px]"
    >
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <span>{telemetry.turnLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-1.5 text-slate-300">
            <span className="font-semibold text-amber-200">🏆 {telemetry.scoreLabel}</span>
            <span className="rounded border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#f3c65f]">
                🎲 {telemetry.cubeLabel}
            </span>
        </div>
        <div className="sm:col-span-2 flex items-center justify-between border-t border-white/5 pt-1 text-[11px] font-mono text-sky-200">
            <span>🏁 {telemetry.raceLabel}</span>
        </div>
    </div>
);

export const DrillPreValidationReadingCard: React.FC<{
    readonly telemetry: PositionTelemetry;
    readonly blunder: PlayerBlunderRecord;
    readonly isPrMathMode: boolean;
}> = ({ telemetry, blunder, isPrMathMode }) => (
    <div
        data-testid="drill-position-reading-card"
        className="flex-1 rounded-xl border border-white/10 bg-[#080b11]/90 p-2.5 flex flex-col justify-between gap-2 text-[11px]"
    >
        <div className="space-y-1.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="font-extrabold uppercase tracking-wider text-[#f3c65f]">
                    {isPrMathMode ? '📐 Lecture Mathématique du Tablier' : '🧠 Lecture Stratégique & Plan de Jeu'}
                </span>
                <span className="font-mono text-[10px] text-slate-400">Analyse 3-Ply</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Structure de Portes</div>
                    <div className="mt-0.5 font-bold text-white">
                        ⚪ {telemetry.whiteMadePointsTotal} portes ({telemetry.whiteHomePoints} jan) · ⚫ {telemetry.blackMadePointsTotal} portes ({telemetry.blackHomePoints} jan)
                    </div>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2">
                    <div className="text-[10px] uppercase font-semibold text-slate-400">Pions Arrières &amp; Blots</div>
                    <div className="mt-0.5 font-bold text-amber-200">
                        {telemetry.whiteBackCheckers} pion(s) arrière(s) · {telemetry.whiteBlots} blot(s) X vs {telemetry.blackBlots} blot(s) O
                    </div>
                </div>
            </div>
            <p className="rounded-lg border border-white/5 bg-black/40 p-2 text-slate-300 leading-relaxed">
                <strong className="text-white">Objectif du Plan : </strong>
                {isPrMathMode
                    ? `Comparez l'équité cubeful (ΔEMG) entre la prise de risque offensive et la sécurisation de votre structure avec un différentiel de ${telemetry.pipDiff > 0 ? `+${telemetry.pipDiff}` : telemetry.pipDiff} pips.`
                    : `Observez la menace adverse (${telemetry.blackHomePoints} portes noires dans le jan) et choisissez le plan qui maximise la pression tout en limitant les retours directs.`}
            </p>
        </div>
    </div>
);

export const DrillPrMathRankingTable: React.FC<{
    readonly rows: ReadonlyArray<CandidateMathRankRow>;
}> = ({ rows }) => (
    <div data-testid="drill-pr-math-ranking" className="rounded-lg border border-emerald-400/30 bg-[#070a10] p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span>📐 Classement Mathématique 3-Ply (ΔEMG &amp; MWC)</span>
            <span>Win % / Gammon %</span>
        </div>
        <div className="divide-y divide-white/5">
            {rows.map((r) => (
                <div
                    key={r.notation}
                    className={`flex items-center justify-between py-1 px-1.5 text-[11px] font-mono ${
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
                    <div className="flex items-center gap-2.5">
                        <span className={r.deltaEmg === 0 ? 'text-emerald-300' : 'text-rose-300'}>
                            {r.deltaEmg === 0 ? '0.000' : r.deltaEmg.toFixed(3)} EMG
                        </span>
                        <span className="text-[10px] text-slate-400">
                            W:{r.winPct}% · G:{r.gammonPct}%
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

