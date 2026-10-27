'use client';

/**
 * Radar Temps Réel contre l'IA & Mode « Seconde Chance Socratique » (< 215 lignes, 0 any).
 *
 * Rôle :
 *   1. Affiche en direct les métriques Grand-Maître de la position contre l'IA :
 *      - Course Effective Pip Count (EPC de Walter Trice) & Gaspillage (Wastage).
 *      - Posture Paul Magriel (Safe vs Bold Criterion).
 *      - Thermomètre du Videau (Take Point de Janowski & Prix du Gammon MET).
 *   2. Gère le mode d'entraînement « Seconde Chance Socratique » permettant de
 *      rejouer immédiatement une gaffe contre l'IA en s'appuyant sur un indice.
 */

import React, { useMemo, useState } from 'react';
import { calculateEffectivePipCount, evaluateRaceCube } from '../../lib/engine/effectivePipCount';
import { computeMagrielSafeVsBoldScore } from '../../lib/coach/michyProverbs';
import type { MatchContext, BuildMatchContextParams } from '../../features/coach/matchContext';
import { resolveMatchContext, type CoachDisplayVerdict } from './coachPanelHelpers';

export const SECOND_CHANCE_STORAGE_KEY = 'backgammon.socraticSecondChance';

export interface CoachLiveAiRadarProps {
    board?: ReadonlyArray<number>;
    matchContext?: MatchContext | Partial<BuildMatchContextParams> | null;
    verdict?: CoachDisplayVerdict | null;
    equityLoss?: number | null;
    onReplayMove?: () => void;
    locale?: string;
}

const DEFAULT_BOARD: readonly number[] = [
    0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5, 5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
];

function countInnerBoardMadePoints(board: ReadonlyArray<number>, player: 'X' | 'O'): number {
    let count = 0;
    if (player === 'X') {
        for (let p = 1; p <= 6; p++) {
            if ((board[p] ?? 0) >= 2) count++;
        }
    } else {
        for (let p = 19; p <= 24; p++) {
            if ((board[p] ?? 0) <= -2) count++;
        }
    }
    return count;
}

const CoachLiveAiRadarComponent: React.FC<CoachLiveAiRadarProps> = ({
    board,
    matchContext,
    verdict,
    equityLoss,
    onReplayMove,
    locale = 'fr',
}) => {
    const isEn = Boolean(locale && locale !== 'fr');
    const [secondChanceEnabled, setSecondChanceEnabled] = useState<boolean>(() => {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return true;
        try {
            const saved = localStorage.getItem(SECOND_CHANCE_STORAGE_KEY);
            return saved === null ? true : saved === 'true';
        } catch {
            return true;
        }
    });

    const toggleSecondChance = () => {
        setSecondChanceEnabled((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(SECOND_CHANCE_STORAGE_KEY, String(next));
            } catch {
                // ignore
            }
            return next;
        });
    };

    const radar = useMemo(() => {
        const activeBoard = board && board.length >= 26 ? [...board] : [...DEFAULT_BOARD];
        const epcX = calculateEffectivePipCount(activeBoard, 'X');
        const epcO = calculateEffectivePipCount(activeBoard, 'O');
        const raceCube = evaluateRaceCube(activeBoard, 'X');
        const homeX = countInnerBoardMadePoints(activeBoard, 'X');
        const homeO = countInnerBoardMadePoints(activeBoard, 'O');
        const magriel = computeMagrielSafeVsBoldScore({
            homeBoardPointsPlayer: homeX,
            homeBoardPointsOpponent: homeO,
            playerPipCount: epcX.rawPips,
            opponentPipCount: epcO.rawPips,
            opponentBarCount: Math.max(0, -(activeBoard[25] ?? 0)),
        });

        return { epcX, epcO, raceCube, magriel };
    }, [board]);

    const resolvedContext = useMemo(
        () => resolveMatchContext(matchContext ?? undefined),
        [matchContext],
    );
    const takePointPct =
        resolvedContext?.takePoint?.X !== undefined
            ? `${(resolvedContext.takePoint.X * 100).toFixed(1)}%`
            : '25.0%';
    const gammonPricePct =
        resolvedContext?.gammonPrice?.X !== undefined
            ? `${(resolvedContext.gammonPrice.X * 100).toFixed(0)}%`
            : '50%';

    const isBlunder = verdict === 'blunder' && Math.abs(equityLoss ?? 0) >= 0.06;

    return (
        <section
            data-testid="coach-live-ai-radar"
            aria-label={isEn ? 'Live AI Tactical Radar' : "Radar Tactique Temps Réel contre l'IA"}
            className="rounded-xl border border-[#d4af37]/35 bg-[#0c101b]/95 p-2.5 space-y-2 text-xs"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">📡</span>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#f3c65f]">
                        {isEn ? 'Live AI Radar (Trice / Magriel / GTO)' : 'Radar Temps Réel vs IA'}
                    </span>
                </div>
                {onReplayMove && (
                    <button
                        type="button"
                        data-testid="coach-second-chance-toggle"
                        aria-pressed={secondChanceEnabled}
                        onClick={toggleSecondChance}
                        title={
                            isEn
                                ? 'Toggle Socratic Second Chance training mode on blunders'
                                : 'Activer/Désactiver le mode Seconde Chance Socratique sur les gaffes'
                        }
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold transition ${
                            secondChanceEnabled
                                ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-200'
                                : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                    >
                        {secondChanceEnabled
                            ? isEn
                                ? '⏪ Second Chance: ON'
                                : '⏪ Seconde Chance : ON'
                            : isEn
                              ? '⏪ Second Chance: OFF'
                              : '⏪ Seconde Chance : OFF'}
                    </button>
                )}
            </div>

            {/* Grille des 3 indicateurs temps réel contre l'IA */}
            <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5">
                    <div className="text-[11px] uppercase text-slate-400 font-semibold">
                        {isEn ? 'Trice EPC' : 'Course EPC (Trice)'}
                    </div>
                    <div className="font-mono text-[11px] font-bold text-white" data-testid="radar-trice-epc">
                        {radar.epcX.epc.toFixed(0)} <span className="text-slate-500">vs</span> {radar.epcO.epc.toFixed(0)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {isEn ? `Wastage: ${radar.epcX.wastage.toFixed(1)}` : `Gaspi : +${radar.epcX.wastage.toFixed(1)}p`}
                    </div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5">
                    <div className="text-[11px] uppercase text-slate-400 font-semibold">
                        {isEn ? 'Magriel Posture' : 'Posture Magriel'}
                    </div>
                    <div
                        data-testid="radar-magriel-posture"
                        className={`font-mono text-[11px] font-black ${
                            radar.magriel.posture === 'BOLD' ? 'text-amber-300' : 'text-cyan-300'
                        }`}
                    >
                        {radar.magriel.posture === 'BOLD'
                            ? isEn
                                ? '⚔️ BOLD'
                                : '⚔️ AUDACIEUX'
                            : isEn
                              ? '🛡️ SAFE'
                              : '🛡️ SÉCURITÉ'}
                    </div>
                    <div className="text-[11px] text-slate-400">Score {radar.magriel.score >= 0 ? `+${radar.magriel.score}` : radar.magriel.score}</div>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5">
                    <div className="text-[11px] uppercase text-slate-400 font-semibold">
                        {isEn ? 'Janowski Cube' : 'Videau (GTO)'}
                    </div>
                    <div className="font-mono text-[11px] font-bold text-indigo-300" data-testid="radar-janowski-tp">
                        TP {takePointPct}
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {radar.raceCube.isPureRace ? radar.raceCube.action : `Gammon ${gammonPricePct}`}
                    </div>
                </div>
            </div>

            {/* Bannière Seconde Chance Socratique en cas de Blunder contre l'IA */}
            {secondChanceEnabled && isBlunder && onReplayMove && (
                <div
                    data-testid="coach-second-chance-banner"
                    className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/50 bg-emerald-950/50 px-2.5 py-2 text-[11px] text-emerald-100"
                >
                    <span>
                        🎯{' '}
                        {isEn
                            ? `Blunder detected (-${Math.abs(equityLoss ?? 0).toFixed(3)} Eq). Want to take back this turn and find the Master move?`
                            : `Gaffe détectée (-${Math.abs(equityLoss ?? 0).toFixed(3)} Eq). Voulez-vous reprendre ce tour contre l'IA ?`}
                    </span>
                    <button
                        type="button"
                        data-testid="coach-second-chance-replay-btn"
                        onClick={onReplayMove}
                        className="shrink-0 rounded-lg border border-emerald-400 bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase text-white hover:bg-emerald-500 transition active:scale-95"
                    >
                        {isEn ? '⏪ Retry Turn' : '⏪ Rejouer'}
                    </button>
                </div>
            )}
        </section>
    );
};

export const CoachLiveAiRadar = React.memo(CoachLiveAiRadarComponent);
export default CoachLiveAiRadar;
