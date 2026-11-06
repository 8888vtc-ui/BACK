/**
 * Analyseur log-driven déterministe du Coach IA (Règle d'or n°1 & n°3)
 *
 * Ce module est la SEULE source d'analyse mathématique des coups du joueur connecté.
 * Il ne lit JAMAIS le DOM ni l'état visuel React : il prend en entrée exclusivement
 * une entrée immuable de `matchLog` et retourne un verdict déterministe.
 */

import type { Player, BoardState, Move } from '../../engine/backgammonEngine';
import {
    createInitialState,
    applyMove,
    serializeCanonicalXGID,
    generateLegalMoves,
} from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { analyzeBoardMoves, evaluateBoard } from '../../lib/engine/evaluator';
import { evaluatePositionExpectiminimax2Ply } from '../../lib/engine/expectiminimax';
import {
    evaluateWithBgsage,
    boardsMatchOnPoints,
    boardsMatchOnPointsAndBar,
} from '../../lib/engine/bgsageClient';
import { bgsageCacheKey, getCachedBgsageEvaluation } from '../../lib/engine/bgsageCache';
import {
    formatCoachMoveSequence,
    formatCoachMoveSequenceFromBoard,
    movesFromBoardDiff,
    parseCoachNotationMoves,
} from './coachMoveNotation';
import type { BgsageStrategicInsights } from './featureExtractor';
import {
    detectOpeningScoreRegime,
    getOpeningForScore,
    isInitialBoardPosition,
} from '../openings/openingDatabase';
import {
    extractVerifiedCoachFacts,
    computeVerifiedBoardFacts,
    type CoachVerifiedFacts,
    type CommittedHumanMovePacket,
} from './turnSnapshot';
import {
    resolvePlayedMoves,
    resolveEffectiveBoardAfter,
    notationsAreEquivalent,
    moveSequenceKey,
    buildHumanMoveAnalysisFromBgsageResult,
} from './logAnalyzerBgsageBuilder';

export { extractVerifiedCoachFacts, computeVerifiedBoardFacts };

/**
 * Verdicts en 4 paliers (Règle d'or n°3).
 */
export type CoachVerdict = 'optimal' | 'good' | 'inaccuracy' | 'blunder';

/**
 * Seuils d'équité perdus (en valeur absolue) pour la classification.
 */
export const VERDICT_THRESHOLDS = {
    /** ≤ 0.010 → Optimal ✅ */
    OPTIMAL: 0.01,
    /** ≤ 0.020 → Bon 👍 */
    GOOD: 0.02,
    /** > 0.080 → Blunder ❌ */
    BLUNDER: 0.08,
} as const;

/**
 * Seuils stricts Grand Maître (PR 1–3) pour les joueurs d'élite.
 */
export const STRICT_VERDICT_THRESHOLDS = {
    /** ≤ 0.005 → Optimal ✅ */
    OPTIMAL: 0.005,
    /** ≤ 0.015 → Bon 👍 */
    GOOD: 0.015,
    /** > 0.060 → Blunder ❌ */
    BLUNDER: 0.06,
} as const;

/**
 * Classifie une perte d'équité en verdict à 4 paliers.
 */
export function classifyVerdict(equityLoss: number, strictPr1 = false): CoachVerdict {
    const loss = Math.abs(equityLoss);
    const thresholds = strictPr1 ? STRICT_VERDICT_THRESHOLDS : VERDICT_THRESHOLDS;
    if (loss <= thresholds.OPTIMAL) return 'optimal';
    if (loss <= thresholds.GOOD) return 'good';
    if (loss > thresholds.BLUNDER) return 'blunder';
    return 'inaccuracy';
}

/**
 * Libellé lisible du verdict (pour l'affichage du panneau Coach).
 */
export function verdictLabel(verdict: CoachVerdict): string {
    switch (verdict) {
        case 'optimal':
            return 'Optimal ✅';
        case 'good':
            return 'Bon 👍';
        case 'inaccuracy':
            return 'Imprécision ⚠️';
        case 'blunder':
            return 'Blunder ❌';
    }
}

/**
 * Résultat déterministe de l'analyse d'un coup humain depuis la log.
 */
export interface HumanMoveAnalysis {
    readonly turnIndex: number;
    readonly player: Player;
    readonly verdict: CoachVerdict;
    readonly equityLoss: number;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly playedEquity: number;
    readonly bestEquity: number;
    readonly isUnforced: boolean;
    readonly isBlunder: boolean;
    readonly candidateMoves: ReadonlyArray<{
        readonly notation: string;
        readonly equity: number;
        readonly equityLoss: number;
        readonly winProbability?: number;
        readonly gammonProbability?: number;
        readonly backgammonProbability?: number;
    }>;
    readonly optimalMoves?: ReadonlyArray<Move>;
    readonly optimalSubMoves?: ReadonlyArray<{ readonly from: number; readonly to: number }>;
    readonly verifiedFacts?: CoachVerifiedFacts;
    readonly packetId?: string;
    readonly bgsageInsights?: BgsageStrategicInsights;
}

export interface AnalyzeHumanMoveFromLogParams {
    readonly logEntry: MatchLogEntry;
    readonly packet?: CommittedHumanMovePacket;
    readonly localPlayer?: Player;
    readonly cubeValue?: number;
    readonly cubeOwner?: Player | null;
    readonly crawford?: boolean;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly ply?: number;
    readonly signal?: AbortSignal;
}

/**
 * Reconstruction déterministe de la position avant le coup n° K (Règle d'or n°1).
 */
export function reconstructBoardFromLog(
    log: ReadonlyArray<MatchLogEntry>,
    turnIndex: number,
): number[] | null {
    let board = [...createInitialState().board];
    for (const entry of log) {
        if (entry.turnIndex >= turnIndex) {
            break;
        }
        for (const move of entry.movePlayed) {
            board = applyMove(board, move, entry.player);
        }
    }
    return board;
}

/**
 * Pipeline d'analyse déterministe du joueur connecté (Règle d'or n°3).
 */
export function analyzeHumanMoveFromLog(
    params: AnalyzeHumanMoveFromLogParams,
): HumanMoveAnalysis | null {
    const { logEntry, localPlayer = 'X' } = params;
    if (logEntry.player !== localPlayer) {
        return null;
    }

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    const evalState: BoardState = {
        board: boardBefore,
        turn: logEntry.player,
        dice,
        cubeValue: params.cubeValue ?? 1,
        cubeOwner: params.cubeOwner ?? null,
        matchLength: params.matchLength ?? 7,
        scoreX: params.scoreX ?? 0,
        scoreO: params.scoreO ?? 0,
        crawford: params.crawford ?? false,
        doubled: false,
        resigned: 0,
    };

    const playedMoves = resolvePlayedMoves(logEntry);
    const playedNotation = formatCoachMoveSequence([...playedMoves], logEntry.player, boardBefore);
    const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
    const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

    const isOpening = isInitialBoardPosition(boardBefore) && dice[0] !== dice[1] && logEntry.player === 'X';
    const openingRegime = isOpening
        ? detectOpeningScoreRegime({
              matchLength: params.matchLength,
              scoreX: params.scoreX,
              scoreO: params.scoreO,
              player: logEntry.player,
              cubeValue: params.cubeValue,
              crawford: params.crawford,
          })
        : 'NORMAL';
    const opening = isOpening ? getOpeningForScore(dice[0], dice[1], openingRegime) : null;
    if (opening) {
        let openingBestBoard = [...boardBefore];
        for (const m of opening.bestMoves) {
            openingBestBoard = applyMove(openingBestBoard, m, logEntry.player);
        }

        if (
            boardsMatchOnPointsAndBar(openingBestBoard, effectiveBoardAfter) ||
            notationsAreEquivalent(playedNotation, opening.bestMoveNotation, logEntry.player, dice) ||
            notationsAreEquivalent(canonicalNotation, opening.bestMoveNotation, logEntry.player, dice)
        ) {
            return {
                turnIndex: logEntry.turnIndex,
                player: logEntry.player,
                verdict: 'optimal',
                equityLoss: 0,
                playedNotation,
                optimalNotation: opening.bestMoveNotation,
                playedEquity: opening.equity,
                bestEquity: opening.equity,
                isUnforced: true,
                isBlunder: false,
                optimalMoves: opening.bestMoves,
                candidateMoves: [
                    { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                    ...opening.alternatives.map((alt) => ({
                        notation: alt.notation,
                        equity: opening.equity + alt.equityLoss,
                        equityLoss: Math.abs(alt.equityLoss),
                    })),
                ],
            };
        }
        const matchedAlt = opening.alternatives.find((alt) => {
            if (
                notationsAreEquivalent(alt.notation, playedNotation, logEntry.player, dice) ||
                notationsAreEquivalent(alt.notation, canonicalNotation, logEntry.player, dice)
            ) {
                return true;
            }
            const altMoves = parseCoachNotationMoves(alt.notation, logEntry.player, dice);
            if (altMoves.length > 0) {
                let altBoard = [...boardBefore];
                for (const m of altMoves) altBoard = applyMove(altBoard, m, logEntry.player);
                return boardsMatchOnPointsAndBar(altBoard, effectiveBoardAfter);
            }
            return false;
        });
        if (matchedAlt) {
            const loss = Math.abs(matchedAlt.equityLoss);
            return {
                turnIndex: logEntry.turnIndex,
                player: logEntry.player,
                verdict: classifyVerdict(loss),
                equityLoss: loss,
                playedNotation,
                optimalNotation: opening.bestMoveNotation,
                playedEquity: opening.equity + matchedAlt.equityLoss,
                bestEquity: opening.equity,
                isUnforced: true,
                isBlunder: classifyVerdict(loss) === 'blunder',
                optimalMoves: opening.bestMoves,
                candidateMoves: [
                    { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                    ...opening.alternatives.map((alt) => ({
                        notation: alt.notation,
                        equity: opening.equity + alt.equityLoss,
                        equityLoss: Math.abs(alt.equityLoss),
                    })),
                ],
            };
        }

        const opponent: Player = logEntry.player === 'X' ? 'O' : 'X';
        const bestAfterEval = evaluateBoard(
            { ...evalState, board: openingBestBoard, turn: opponent, dice: null },
            Math.max(0, (params.ply ?? 2) - 1),
        );
        const playedAfterEval = evaluateBoard(
            { ...evalState, board: effectiveBoardAfter, turn: opponent, dice: null },
            Math.max(0, (params.ply ?? 2) - 1),
        );
        const minAltLoss =
            opening.alternatives.length > 0
                ? Math.max(...opening.alternatives.map((a) => Math.abs(a.equityLoss)))
                : 0.04;
        const rawDiff = Math.max(
            0,
            (-bestAfterEval.cubelessEquity - -playedAfterEval.cubelessEquity) * 0.22,
        );
        const offBookLoss = Number(Math.min(0.105, Math.max(minAltLoss, rawDiff)).toFixed(4));
        const offBookVerdict = classifyVerdict(offBookLoss);
        return {
            turnIndex: logEntry.turnIndex,
            player: logEntry.player,
            verdict: offBookVerdict,
            equityLoss: offBookLoss,
            playedNotation,
            optimalNotation: opening.bestMoveNotation,
            playedEquity: Number((opening.equity - offBookLoss).toFixed(4)),
            bestEquity: opening.equity,
            isUnforced: true,
            isBlunder: offBookVerdict === 'blunder',
            optimalMoves: opening.bestMoves,
            candidateMoves: [
                { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                ...opening.alternatives.map((alt) => ({
                    notation: alt.notation,
                    equity: opening.equity + alt.equityLoss,
                    equityLoss: Math.abs(alt.equityLoss),
                })),
                {
                    notation: playedNotation,
                    equity: Number((opening.equity - offBookLoss).toFixed(4)),
                    equityLoss: offBookLoss,
                },
            ],
        };
    }

    const xgidForCache = serializeCanonicalXGID(evalState);
    const cachedBgsage =
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 3)) ??
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 2)) ??
        getCachedBgsageEvaluation(bgsageCacheKey(xgidForCache, 1));
    if (
        cachedBgsage &&
        cachedBgsage.chequerPlay.length > 0 &&
        cachedBgsage.source !== 'typescript-tri-phase' &&
        cachedBgsage.source !== 'local'
    ) {
        const legalSeqs = generateLegalMoves(evalState, dice);
        const fromCache = buildHumanMoveAnalysisFromBgsageResult({
            bgsageResult: cachedBgsage,
            logEntry,
            evalState,
            legalSeqs,
            boardBefore,
            effectiveBoardAfter,
            targetPly: 3,
        });
        if (fromCache) {
            if (params.ply === 0 && fromCache.equityLoss > 0.105) {
                return {
                    ...fromCache,
                    equityLoss: 0.105,
                    playedEquity: Number((fromCache.bestEquity - 0.105).toFixed(4)),
                };
            }
            return fromCache;
        }
    }

    const analysis = analyzeBoardMoves(evalState, dice, { ply: params.ply ?? 2, maxMoves: 64 });
    if (!analysis.bestMove) {
        return null;
    }

    const playedKey = moveSequenceKey(playedMoves);
    const canonicalKey = moveSequenceKey(canonicalMoves);
    const matchedAnalysis =
        analysis.moves.find((m) => m.board && boardsMatchOnPointsAndBar(m.board, effectiveBoardAfter)) ??
        analysis.moves.find((m) => m.board && boardsMatchOnPoints(m.board, effectiveBoardAfter)) ??
        analysis.moves.find((m) => m.moves && (moveSequenceKey(m.moves) === playedKey || moveSequenceKey(m.moves) === canonicalKey)) ??
        analysis.moves.find((m) => notationsAreEquivalent(m.notation, playedNotation, logEntry.player, dice) || notationsAreEquivalent(m.notation, canonicalNotation, logEntry.player, dice));

    const bestEquity = analysis.bestMove.equity;
    const isBestMovePlayed =
        (analysis.bestMove.board && boardsMatchOnPointsAndBar(analysis.bestMove.board, effectiveBoardAfter)) ||
        notationsAreEquivalent(analysis.bestMove.notation, playedNotation, logEntry.player, dice) ||
        notationsAreEquivalent(analysis.bestMove.notation, canonicalNotation, logEntry.player, dice);

    const opponent: Player = logEntry.player === 'X' ? 'O' : 'X';
    let playedEquity: number;
    if (isBestMovePlayed) {
        playedEquity = bestEquity;
    } else if (matchedAnalysis && analysis.moves.indexOf(matchedAnalysis) < 6) {
        playedEquity = matchedAnalysis.equity;
    } else {
        const resultingState: BoardState = {
            ...evalState,
            board: effectiveBoardAfter,
            turn: opponent,
            dice: null,
        };
        if ((params.ply ?? 2) >= 2) {
            playedEquity = evaluatePositionExpectiminimax2Ply(
                resultingState,
                (st) => evaluateBoard(st, 0),
            ).equity;
        } else {
            playedEquity = -evaluateBoard(resultingState, 0).cubefulEquity;
        }
    }

    let rawLoss = Math.max(0, bestEquity - playedEquity);
    if (!isBestMovePlayed && analysis.bestMove.board) {
        const bestStatic = -evaluateBoard(
            { ...evalState, board: analysis.bestMove.board, turn: opponent, dice: null },
            0,
        ).cubelessEquity;
        const playedStatic = -evaluateBoard(
            { ...evalState, board: effectiveBoardAfter, turn: opponent, dice: null },
            0,
        ).cubelessEquity;
        const staticDiff = Math.max(0, bestStatic - playedStatic);
        const calibratedCap = Math.min(0.105, Number((staticDiff * 0.16 + 0.006).toFixed(4)));
        if (rawLoss > calibratedCap) {
            rawLoss = calibratedCap;
            playedEquity = Number((bestEquity - rawLoss).toFixed(4));
        }
    }

    const equityLoss = Math.max(0, rawLoss);
    const verdict = classifyVerdict(equityLoss);

    const optimalNotation = analysis.bestMove.moves && analysis.bestMove.moves.length > 0
        ? formatCoachMoveSequence(analysis.bestMove.moves, logEntry.player, boardBefore)
        : analysis.bestMove.board
            ? formatCoachMoveSequenceFromBoard(boardBefore, analysis.bestMove.board, logEntry.player)
            : analysis.bestMove.notation;

    return {
        turnIndex: logEntry.turnIndex,
        player: logEntry.player,
        verdict,
        equityLoss,
        playedNotation,
        optimalNotation,
        playedEquity,
        bestEquity,
        isUnforced: analysis.moves.length > 1,
        isBlunder: verdict === 'blunder',
        optimalMoves: analysis.bestMove.moves,
        candidateMoves: analysis.moves.map((m) => ({
            notation:
                m.moves && m.moves.length > 0
                    ? formatCoachMoveSequence(m.moves, logEntry.player, boardBefore)
                    : m.board
                        ? formatCoachMoveSequenceFromBoard(boardBefore, m.board, logEntry.player)
                        : m.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            winProbability: m.probabilities?.win,
            gammonProbability: m.probabilities?.winGammon,
            backgammonProbability: m.probabilities?.winBackgammon,
        })),
    };
}

/**
 * Analyse d'un coup humain via Open Sage (bgsage-service 3-ply).
 */
export async function analyzeHumanMoveFromLogWithBgsage(
    params: AnalyzeHumanMoveFromLogParams,
): Promise<(HumanMoveAnalysis & { source: 'bgsage' | 'local' }) | null> {
    const { logEntry, localPlayer = 'X' } = params;
    if (logEntry.player !== localPlayer) {
        return null;
    }

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    const evalState: BoardState = {
        board: boardBefore,
        turn: logEntry.player,
        dice,
        cubeValue: params.cubeValue ?? 1,
        cubeOwner: params.cubeOwner ?? null,
        matchLength: params.matchLength ?? 7,
        scoreX: params.scoreX ?? 0,
        scoreO: params.scoreO ?? 0,
        crawford: params.crawford ?? false,
        doubled: false,
        resigned: 0,
    };
    const xgid = serializeCanonicalXGID(evalState);
    const legalSeqs = generateLegalMoves(evalState, dice);

    const isOpeningTurn =
        (logEntry.turnIndex <= 1 || isInitialBoardPosition(boardBefore)) &&
        isInitialBoardPosition(boardBefore) &&
        dice[0] !== dice[1] &&
        logEntry.player === 'X';
    const openingBookEntry = isOpeningTurn
        ? getOpeningForScore(
              dice[0],
              dice[1],
              detectOpeningScoreRegime({
                  matchLength: params.matchLength,
                  scoreX: params.scoreX,
                  scoreO: params.scoreO,
                  player: logEntry.player,
                  cubeValue: params.cubeValue,
                  crawford: params.crawford,
              }),
          )
        : null;
    if (openingBookEntry) {
        const openingResult = analyzeHumanMoveFromLog(params);
        if (openingResult) {
            return { ...openingResult, source: 'local' };
        }
    }

    if (params.signal?.aborted) {
        return null;
    }
    const targetPly = params.ply ?? 3;
    try {
        const bgsageResult = await evaluateWithBgsage(xgid, targetPly, 4000);
        if (params.signal?.aborted) {
            return null;
        }
        const isRealBgsage = Boolean(
            bgsageResult &&
            bgsageResult.chequerPlay.length > 0 &&
            bgsageResult.source !== 'typescript-tri-phase' &&
            bgsageResult.source !== 'local',
        );

        if (isRealBgsage && bgsageResult) {
            const built = buildHumanMoveAnalysisFromBgsageResult({
                bgsageResult,
                logEntry,
                evalState,
                legalSeqs,
                boardBefore,
                effectiveBoardAfter,
                targetPly,
            });
            if (built) {
                return built;
            }
        }
    } catch (err) {
        console.warn('[Coach] bgsage-service indisponible :', err);
    }

    return null;
}
