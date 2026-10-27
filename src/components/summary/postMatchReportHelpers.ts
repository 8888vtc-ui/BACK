/**
 * Helpers purs du Rapport de Formation Post-Match & Grandmaster Blunder Report (< 300 lignes, 0 any).
 *
 * Rôle :
 *   - Classifier tous les coups selon les seuils officiels Open Sage / bgsage / XG2.
 *   - Extraire les plus grosses erreurs du joueur avec position XGID, diagnostic et concept clé.
 *   - Calculer le taux de précision (Accuracy %) et construire le payload Gemini en 3 volets.
 */

import type { EvaluatedTurn, CompleteGameAnalysis } from '../../features/rating/types';
import { serializeXGID } from '../../engine/backgammonEngine';
import {
    MAJOR_BLUNDER_THRESHOLD,
    MAX_MAJOR_BLUNDERS,
    REPORT_EQUITY_THRESHOLDS,
    type DecisionCountersSummary,
    type GamePhaseLabel,
    type MajorBlunder,
    type MatchSummaryPayload,
    type ReportMoveClassificationBreakdown,
} from './postMatchReportTypes';
import {
    buildBlunderPedagogicalNote,
    classifyMoveByEquityLoss,
    countBlundersByPhase,
    identifyRecurringThemes,
} from './postMatchSynthesisBuilder';

export * from './postMatchReportTypes';
export {
    buildBlunderPedagogicalNote,
    buildRuleBasedSynthesis,
    classifyMoveByEquityLoss,
    countBlundersByPhase,
    identifyRecurringThemes,
} from './postMatchSynthesisBuilder';

/** Agrège tous les coups évalués du joueur dans les 5 catégories du rapport. */
export function classifyAllMatchMoves(
    evaluatedMoves: ReadonlyArray<EvaluatedTurn> | undefined,
    player: 'X' | 'O' = 'X',
): ReportMoveClassificationBreakdown {
    const breakdown: ReportMoveClassificationBreakdown = {
        best: 0,
        inaccuracy: 0,
        mistake: 0,
        blunder: 0,
        cubeBlunder: 0,
    };
    if (!evaluatedMoves || evaluatedMoves.length === 0) return breakdown;

    for (const m of evaluatedMoves) {
        if (m.player !== player) continue;
        if (m.cubeEquityLoss !== undefined && Math.abs(m.cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN) {
            breakdown.cubeBlunder += 1;
        }
        const cat = classifyMoveByEquityLoss(m.equityLoss);
        if (cat === 'best') breakdown.best += 1;
        else if (cat === 'inaccuracy') breakdown.inaccuracy += 1;
        else if (cat === 'mistake') breakdown.mistake += 1;
        else if (cat === 'blunder') breakdown.blunder += 1;
    }

    return breakdown;
}

/** Calcule le taux de précision global (Accuracy %) sur l'échelle 0–100 %. */
export function computeMatchAccuracy(
    analysis: CompleteGameAnalysis | null | undefined,
    player: 'X' | 'O' = 'X',
): number {
    if (!analysis) return 100;

    const playerMoves = (analysis.evaluatedMoves ?? []).filter((m) => m.player === player);
    if (playerMoves.length > 0) {
        let weightedScore = 0;
        for (const m of playerMoves) {
            const cat = classifyMoveByEquityLoss(m.equityLoss, m.cubeEquityLoss);
            if (cat === 'best') weightedScore += 1.0;
            else if (cat === 'inaccuracy') weightedScore += 0.72;
            else if (cat === 'mistake') weightedScore += 0.4;
            else weightedScore += 0.05;
        }
        const rawPct = (weightedScore / playerMoves.length) * 100;
        return Number(Math.max(0, Math.min(100, rawPct)).toFixed(1));
    }

    const b = analysis.breakdown;
    const total = b.optimal + b.acceptable + b.doubtful + b.blunder + b.howler;
    if (total > 0) {
        const weighted = b.optimal * 1.0 + b.acceptable * 0.88 + b.doubtful * 0.55 + b.blunder * 0.15;
        return Number(Math.max(0, Math.min(100, (weighted / total) * 100)).toFixed(1));
    }

    const pr = Math.max(0, analysis.performanceRating ?? 0);
    return Number(Math.max(0, Math.min(100, 100 - pr * 2.4)).toFixed(1));
}

/** Génère un identifiant XGID pour un tour évalué. */
export function buildTurnXGID(
    turn: Pick<EvaluatedTurn, 'boardBefore' | 'player' | 'dice'>,
    matchMeta?: { scoreX?: number; scoreO?: number; matchLength?: number },
): string {
    try {
        const safeBoard =
            Array.isArray(turn.boardBefore) && turn.boardBefore.length >= 26
                ? turn.boardBefore.slice(0, 26)
                : new Array<number>(26).fill(0);
        return serializeXGID({
            board: safeBoard,
            turn: turn.player ?? 'X',
            cubeValue: 1,
            cubeOwner: null,
            dice: turn.dice ?? [1, 1],
            matchLength: matchMeta?.matchLength ?? 7,
            scoreX: matchMeta?.scoreX ?? 0,
            scoreO: matchMeta?.scoreO ?? 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        });
    } catch {
        return 'XGID=--------------------------:0:0:1:11:0:0:0:7:10';
    }
}

/** Détermine la phase de jeu à partir d'un plateau (28 entiers). */
export function detectGamePhase(board: ReadonlyArray<number>, player: 'X' | 'O' = 'X'): GamePhaseLabel {
    if (!board || board.length < 26) return 'unknown';

    const homeRange = player === 'X' ? [1, 2, 3, 4, 5, 6] : [19, 20, 21, 22, 23, 24];
    const startRange = player === 'X' ? [19, 20, 21, 22, 23, 24] : [1, 2, 3, 4, 5, 6];

    let onBoard = 0;
    let inHome = 0;
    let inStart = 0;
    let minX = 25;
    let maxX = 0;
    let minO = 25;
    let maxO = 0;

    for (let p = 1; p <= 24; p++) {
        const v = board[p];
        if (v === 0) continue;
        const count = Math.abs(v);
        const isPlayer = player === 'X' ? v > 0 : v < 0;

        if (isPlayer) {
            onBoard += count;
            if (homeRange.includes(p)) inHome += count;
            if (startRange.includes(p)) inStart += count;
            minX = Math.min(minX, p);
            maxX = Math.max(maxX, p);
        } else {
            minO = Math.min(minO, p);
            maxO = Math.max(maxO, p);
        }
    }

    if (onBoard > 0 && inHome === onBoard) return 'bearoff';
    if (maxX > 0 && minO < 25 && maxX < minO) return 'race';
    if (maxO > 0 && minX < 25 && maxO < minX) return 'race';
    if (inStart >= 8) return 'opening';
    return 'contact';
}

/** Extrait les N plus grosses erreurs du joueur (ΔEq > seuil), triées par gravité. */
export function extractMajorBlunders(
    evaluatedMoves: ReadonlyArray<EvaluatedTurn> | undefined,
    player: 'X' | 'O' = 'X',
    maxCount: number = MAX_MAJOR_BLUNDERS,
): MajorBlunder[] {
    if (!evaluatedMoves || evaluatedMoves.length === 0) return [];

    return evaluatedMoves
        .filter(
            (m) =>
                m.player === player &&
                (Math.abs(m.equityLoss) > MAJOR_BLUNDER_THRESHOLD ||
                    (m.cubeEquityLoss !== undefined &&
                        Math.abs(m.cubeEquityLoss) >= REPORT_EQUITY_THRESHOLDS.CUBE_BLUNDER_MIN)),
        )
        .sort((a, b) => {
            const lossA = Math.max(Math.abs(a.equityLoss), Math.abs(a.cubeEquityLoss ?? 0));
            const lossB = Math.max(Math.abs(b.equityLoss), Math.abs(b.cubeEquityLoss ?? 0));
            return lossB - lossA;
        })
        .slice(0, maxCount)
        .map((m) => {
            const phase = detectGamePhase(m.boardBefore, player);
            const equityLoss = Math.max(Math.abs(m.equityLoss), Math.abs(m.cubeEquityLoss ?? 0));
            const category = classifyMoveByEquityLoss(m.equityLoss, m.cubeEquityLoss);
            const xgid = buildTurnXGID(m);
            const note = buildBlunderPedagogicalNote({
                phase,
                category,
                playedNotation: m.playedNotation,
                optimalNotation: m.optimalNotation,
                equityLoss,
                conceptId: m.conceptId,
                explanation: m.explanation,
            });

            return {
                turnNumber: m.moveNumber,
                dice: m.dice,
                playedNotation: m.playedNotation,
                optimalNotation: m.optimalNotation,
                equityLoss,
                explanation: m.explanation,
                conceptId: m.conceptId,
                boardBefore: m.boardBefore,
                boardAfter: m.boardAfter,
                phase,
                category,
                xgid,
                player: m.player,
                cubeEquityLoss: m.cubeEquityLoss,
                diagnostic: note.diagnostic,
                keyConcept: note.keyConcept,
            };
        });
}

/** Agrège les compteurs des 4 paliers depuis une analyse complète. */
export function summarizeDecisionCounters(
    analysis: CompleteGameAnalysis | null | undefined,
): DecisionCountersSummary {
    if (!analysis) {
        return { optimal: 0, good: 0, inaccuracy: 0, blunder: 0 };
    }
    const b = analysis.breakdown;
    return {
        optimal: b.optimal,
        good: b.acceptable,
        inaccuracy: b.doubtful,
        blunder: b.blunder + b.howler,
    };
}

/** Construit le résumé structuré du match transmis à l'IA Gemini. */
export function buildMatchSummaryPayload(params: {
    analysis: CompleteGameAnalysis | null | undefined;
    blunders: ReadonlyArray<MajorBlunder>;
    opponentPerformanceRating?: number | null;
    matchDurationSeconds?: number;
}): MatchSummaryPayload {
    const { analysis, blunders, opponentPerformanceRating = null, matchDurationSeconds } = params;
    const player = analysis?.player ?? 'X';

    return {
        performanceRating: analysis?.performanceRating ?? 0,
        prCategory: analysis?.prCategory ?? 'Intermédiaire',
        opponentPerformanceRating,
        decisionsCount: analysis?.decisionsCount ?? 0,
        totalEquityLoss: analysis?.totalEquityLoss ?? 0,
        accuracyPercent: computeMatchAccuracy(analysis, player),
        scoreX: analysis?.scoreX ?? 0,
        scoreO: analysis?.scoreO ?? 0,
        matchLength: analysis?.matchLength ?? 0,
        matchDurationSeconds:
            matchDurationSeconds ?? Math.max(60, (analysis?.totalMovesCount ?? 20) * 18),
        recurringThemes: identifyRecurringThemes(blunders, analysis),
        reportBreakdown: classifyAllMatchMoves(analysis?.evaluatedMoves, player),
        counters: summarizeDecisionCounters(analysis),
        blunders: blunders.map((b) => ({
            turnNumber: b.turnNumber,
            dice: b.dice,
            playedNotation: b.playedNotation,
            optimalNotation: b.optimalNotation,
            equityLoss: Number(b.equityLoss.toFixed(3)),
            phase: b.phase,
            category: b.category ?? classifyMoveByEquityLoss(b.equityLoss, b.cubeEquityLoss),
            xgid: b.xgid ?? buildTurnXGID({ boardBefore: b.boardBefore, player: b.player ?? 'X', dice: b.dice }),
            conceptId: b.conceptId,
        })),
        phaseBreakdown: countBlundersByPhase(blunders),
        winner: analysis?.winner ?? null,
        winType: analysis?.winType ?? null,
    };
}
