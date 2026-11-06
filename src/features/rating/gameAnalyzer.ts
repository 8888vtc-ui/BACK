/**
 * Analyseur de Partie Complète de Backgammon (Full Game Reviewer — XG / Snowie / Galaxy Parity).
 *
 * Compare chaque coup joué au moteur déterministe GNUBG / WildBG pour :
 * 1. Détecter les coups forcés vs décisions libres (unforced decisions) + décisions de videau serrées (Close Cube)
 * 2. Calculer la perte d'équité précise (ΔEq en EMG) par évaluation directe de boardAfter (aucun cap -0.22)
 * 3. Calculer l'évolution MWC (%) via la table Kazaross-XG2 et la chance des dés (Luck)
 * 4. Agréger le Performance Rating combiné (PR_combiné = ((CheckerLoss + CubeLoss) / (UnforcedChecker + CloseCube)) * 500)
 * 5. Alimenter automatiquement la banque d'entraînement (Blunder Training)
 * Strictement <= 400 lignes, 0 any.
 */

import { type Player, type BoardState, type Move, applyMove, serializeCanonicalXGID, generateLegalMoves } from '../../engine/backgammonEngine';
import { analyzeBoardCube, evaluateBoard, analyzeBoardMoves, formatMoveSequenceNotation } from '../../lib/engine/evaluator';
import { boardsMatchOnPointsAndBar } from '../../lib/engine/bgsageClient';
import { bgsageCacheKey, getCachedBgsageEvaluation } from '../../lib/engine/bgsageCache';
import { formatCoachMoveSequence, movesFromBoardDiff } from '../coach/coachMoveNotation';
import { detectOpeningScoreRegime, getOpeningForScore, isInitialBoardPosition } from '../openings/openingDatabase';
import { notationsAreEquivalent, buildHumanMoveAnalysisFromBgsageResult } from '../coach/logAnalyzerBgsageBuilder';
import { recordBlunder } from '../drills/blunderBank';
import { classifyLivePositionCategory } from '../drills/adaptiveQuizEngine';
import { categorizeExplanation } from '../../lib/stats/statsAggregator';
import {
    classifyMoveEquity, calculateErrorRate, calculateSnowieErrorRate, calculatePR,
    calculateCombinedPR, calculateLuckRate, calculateLuckAdjustedPR, convertEquityToMwc,
    getPRCategory, estimateEloFromPR,
} from './ratingCalculator';
import type { RawGameTurn, EvaluatedTurn, MoveBreakdown, CompleteGameAnalysis } from './types';

export interface AnalyzeGameOptions {
    targetPlayer?: Player;
    gameId?: string;
    opponentType?: 'ai' | 'human';
    opponentDifficulty?: string | null;
    winner?: Player | null;
    winType?: 'single' | 'gammon' | 'backgammon' | 'pass' | null;
    pointsWon?: number;
    scoreX?: number;
    scoreO?: number;
    matchLength?: number;
    cubeValue?: number;
    cubeOwner?: Player | null;
    crawford?: boolean;
    ply?: number;
}

function evaluateTurnCubeDecision(
    turn: RawGameTurn,
    syntheticState: BoardState,
): { isCloseCube: boolean; cubeLoss: number } {
    if (!turn.cubeDecision || syntheticState.crawford) {
        return { isCloseCube: false, cubeLoss: 0 };
    }
    if (
        (turn.cubeDecision.action === 'no_double' || turn.cubeDecision.action === 'double') &&
        syntheticState.cubeOwner !== null &&
        syntheticState.cubeOwner !== syntheticState.turn
    ) {
        return { isCloseCube: false, cubeLoss: 0 };
    }
    if (typeof turn.cubeDecision.cubeEquityLoss === 'number') {
        const loss = Math.abs(turn.cubeDecision.cubeEquityLoss);
        return { isCloseCube: turn.cubeDecision.isCloseDecision ?? true, cubeLoss: Number(loss.toFixed(4)) };
    }

    const cubeEval = analyzeBoardCube(syntheticState, { ply: 2 });
    const nd = cubeEval.noDouble ?? 0;
    const dt = cubeEval.doubleTake ?? 0;
    const dp = cubeEval.doublePass ?? 0;
    const effectiveDouble = Math.min(dt, dp);
    const isClose = turn.cubeDecision.isCloseDecision ?? Math.abs(nd - effectiveDouble) <= 0.16;
    const action = turn.cubeDecision.action;
    let loss = 0;
    if (action === 'no_double' && effectiveDouble > nd) loss = effectiveDouble - nd;
    else if (action === 'double' && nd > effectiveDouble) loss = nd - effectiveDouble;
    else if (action === 'take' && dt > dp) loss = dt - dp;
    else if (action === 'pass' && dp > dt) loss = dp - dt;

    return { isCloseCube: isClose || loss > 0.001, cubeLoss: Number(Math.max(0, loss).toFixed(4)) };
}

function evaluateTurnCheckerMove(
    syntheticState: BoardState,
    dice: [number, number],
    boardBefore: number[],
    effectiveBoardAfter: number[],
    effectiveMoves: Move[],
    fallbackPlayedNotation: string,
    ply: number,
) {
    const isOpening = isInitialBoardPosition(boardBefore) && dice[0] !== dice[1] && syntheticState.turn === 'X';
    if (isOpening) {
        const regime = detectOpeningScoreRegime({
            matchLength: syntheticState.matchLength, scoreX: syntheticState.scoreX, scoreO: syntheticState.scoreO,
            player: syntheticState.turn, cubeValue: syntheticState.cubeValue,
        });
        const opening = getOpeningForScore(dice[0], dice[1], regime);
        if (opening) {
            const playedNotation = formatCoachMoveSequence([...effectiveMoves], syntheticState.turn, boardBefore);
            const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, syntheticState.turn);
            const canonicalNotation = formatCoachMoveSequence(canonicalMoves, syntheticState.turn, boardBefore);

            const isOptimal = notationsAreEquivalent(playedNotation, opening.bestMoveNotation, syntheticState.turn, dice) ||
                notationsAreEquivalent(canonicalNotation, opening.bestMoveNotation, syntheticState.turn, dice);

            if (isOptimal) {
                return {
                    candidateMoves: [{ notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 }],
                    isUnforced: true, playedNotation, optimalNotation: opening.bestMoveNotation,
                    bestEquity: opening.equity, equityLoss: 0,
                };
            }
            const matchedAlt = opening.alternatives.find((alt) =>
                notationsAreEquivalent(alt.notation, playedNotation, syntheticState.turn, dice) ||
                notationsAreEquivalent(alt.notation, canonicalNotation, syntheticState.turn, dice),
            );
            if (matchedAlt) {
                const loss = Math.abs(matchedAlt.equityLoss);
                return {
                    candidateMoves: [
                        { notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 },
                        { notation: matchedAlt.notation, equity: opening.equity + matchedAlt.equityLoss, equityLoss: loss },
                    ],
                    isUnforced: true, playedNotation, optimalNotation: opening.bestMoveNotation,
                    bestEquity: opening.equity, equityLoss: loss,
                };
            }
            return {
                candidateMoves: [{ notation: opening.bestMoveNotation, equity: opening.equity, equityLoss: 0 }],
                isUnforced: true, playedNotation, optimalNotation: opening.bestMoveNotation,
                bestEquity: opening.equity, equityLoss: 0.105,
            };
        }
    }

    const xgid = serializeCanonicalXGID(syntheticState);
    const cached = getCachedBgsageEvaluation(bgsageCacheKey(xgid, 3)) ??
                   getCachedBgsageEvaluation(bgsageCacheKey(xgid, 2)) ??
                   getCachedBgsageEvaluation(bgsageCacheKey(xgid, 1));
    if (cached && cached.chequerPlay.length > 0 && cached.source !== 'typescript-tri-phase' && cached.source !== 'local') {
        const legalSeqs = generateLegalMoves(syntheticState, dice);
        const built = buildHumanMoveAnalysisFromBgsageResult({
            bgsageResult: cached,
            logEntry: {
                turnIndex: 1, player: syntheticState.turn, dice,
                boardBefore, movePlayed: effectiveMoves, boardAfter: effectiveBoardAfter,
                timestamp: 0,
            },
            evalState: syntheticState, legalSeqs, boardBefore, effectiveBoardAfter, targetPly: 3,
        });
        if (built) {
            return {
                candidateMoves: built.candidateMoves,
                isUnforced: built.isUnforced,
                playedNotation: built.playedNotation,
                optimalNotation: built.optimalNotation,
                bestEquity: built.bestEquity,
                equityLoss: built.equityLoss,
            };
        }
    }

    const analysis = analyzeBoardMoves(syntheticState, dice, { ply, maxMoves: 64 });
    if (!analysis.bestMove) return null;

    const playedNotation = formatCoachMoveSequence([...effectiveMoves], syntheticState.turn, boardBefore);
    const isBest = notationsAreEquivalent(analysis.bestMove.notation, playedNotation, syntheticState.turn, dice);
    const bestEquity = analysis.bestMove.equity;
    const matched = analysis.moves.find((m) => notationsAreEquivalent(m.notation, playedNotation, syntheticState.turn, dice));
    const opponent = syntheticState.turn === 'X' ? 'O' : 'X';
    const playedEquity = isBest ? bestEquity : (matched?.equity ?? -evaluateBoard({ ...syntheticState, board: effectiveBoardAfter, turn: opponent, dice: null }, 0).cubefulEquity);
    const equityLoss = Math.max(0, bestEquity - playedEquity);

    return {
        candidateMoves: analysis.moves.map((m) => ({ notation: m.notation, equity: m.equity, equityLoss: m.equityLoss })),
        isUnforced: analysis.moves.length > 1,
        playedNotation: playedNotation || fallbackPlayedNotation,
        optimalNotation: analysis.bestMove.notation,
        bestEquity,
        equityLoss,
    };
}

export function analyzeCompleteGame(
    turns: RawGameTurn[],
    options: AnalyzeGameOptions = {},
): CompleteGameAnalysis {
    const targetPlayer = options.targetPlayer ?? 'X';
    const playerTurns = turns.filter((t) => t.player === targetPlayer);
    const matchLength = options.matchLength ?? 7;
    const scoreX = options.scoreX ?? 0;
    const scoreO = options.scoreO ?? 0;
    const defaultCubeValue = options.cubeValue ?? 1;
    const awayPlayer = matchLength > 0 ? Math.max(1, matchLength - (targetPlayer === 'X' ? scoreX : scoreO)) : 0;
    const awayOpponent = matchLength > 0 ? Math.max(1, matchLength - (targetPlayer === 'X' ? scoreO : scoreX)) : 0;

    let checkerEquityLoss = 0;
    let cubeEquityLoss = 0;
    let totalLuck = 0;
    let unforcedCheckerCount = 0;
    let closeCubeDecisionsCount = 0;
    const evaluatedMoves: EvaluatedTurn[] = [];
    const breakdown: MoveBreakdown = { optimal: 0, acceptable: 0, doubtful: 0, blunder: 0, howler: 0 };

    for (let i = 0; i < playerTurns.length; i++) {
        const turn = playerTurns[i];
        const turnCubeValue = turn.cubeValue ?? defaultCubeValue;
        const turnCubeOwner = turn.cubeOwner !== undefined ? turn.cubeOwner : (options.cubeOwner ?? null);
        const turnCrawford = turn.crawford ?? options.crawford ?? false;

        const hasDistinctBoardAfter = Boolean(turn.boardAfter && turn.boardAfter.length >= 26) &&
            !boardsMatchOnPointsAndBar(turn.boardBefore, turn.boardAfter);

        let effectiveMoves: Move[] = turn.moves ?? [];
        let effectiveBoardAfter: number[];

        if (hasDistinctBoardAfter) {
            effectiveBoardAfter = [...turn.boardAfter];
            if (effectiveMoves.length > 0) {
                let simBoard = [...turn.boardBefore];
                for (const m of effectiveMoves) simBoard = applyMove(simBoard, m, targetPlayer);
                if (!boardsMatchOnPointsAndBar(simBoard, effectiveBoardAfter)) {
                    effectiveMoves = movesFromBoardDiff(turn.boardBefore, effectiveBoardAfter, targetPlayer);
                }
            } else {
                effectiveMoves = movesFromBoardDiff(turn.boardBefore, effectiveBoardAfter, targetPlayer);
            }
        } else if (effectiveMoves.length > 0) {
            effectiveBoardAfter = [...turn.boardBefore];
            for (const m of effectiveMoves) effectiveBoardAfter = applyMove(effectiveBoardAfter, m, targetPlayer);
        } else {
            effectiveBoardAfter = [...turn.boardBefore];
        }

        const fallbackPlayedNotation = effectiveMoves.length > 0
            ? formatMoveSequenceNotation(effectiveMoves, targetPlayer) : 'Pass';

        const syntheticState: BoardState = {
            board: turn.boardBefore, turn: targetPlayer, dice: [turn.dice[0], turn.dice[1]],
            cubeValue: turnCubeValue, cubeOwner: turnCubeOwner, matchLength,
            scoreX, scoreO, crawford: turnCrawford, doubled: false, resigned: 0,
        };

        const { isCloseCube, cubeLoss } = evaluateTurnCubeDecision(turn, syntheticState);
        if (isCloseCube) {
            closeCubeDecisionsCount += 1;
            cubeEquityLoss += cubeLoss;
        }

        let preRollEquity = 0;
        try {
            preRollEquity = evaluateBoard({ ...syntheticState, dice: null }, 0).cubelessEquity;
        } catch {
            preRollEquity = 0;
        }

        const logEval = evaluateTurnCheckerMove(
            syntheticState, [turn.dice[0], turn.dice[1]], turn.boardBefore, effectiveBoardAfter,
            effectiveMoves, fallbackPlayedNotation, options.ply ?? 2,
        );

        const candidateCount = logEval ? logEval.candidateMoves.length : 0;
        const isUnforced = logEval ? logEval.isUnforced : false;
        const playedNotation = logEval ? logEval.playedNotation : fallbackPlayedNotation;
        const optimalNotation = logEval ? logEval.optimalNotation : playedNotation;
        const bestEquity = logEval ? logEval.bestEquity : preRollEquity;

        const rawLuckDiff = bestEquity - preRollEquity;
        const calibratedLuck = Math.abs(rawLuckDiff) > 0.25 ? rawLuckDiff * 0.28 : rawLuckDiff;
        const rollLuck = Number(Math.max(-0.45, Math.min(0.45, calibratedLuck)).toFixed(4));
        totalLuck += rollLuck;

        const equityLoss = isUnforced && logEval ? -Number(Math.abs(logEval.equityLoss).toFixed(4)) : 0;
        const equityBefore = Number(bestEquity.toFixed(4));
        const equityAfter = Number((bestEquity + equityLoss).toFixed(4));
        const mwcBefore = convertEquityToMwc(equityBefore, awayPlayer, awayOpponent, turnCubeValue);
        const mwcAfter = convertEquityToMwc(equityAfter, awayPlayer, awayOpponent, turnCubeValue);

        const absLoss = Math.abs(equityLoss);
        const verdict = absLoss >= 0.005 && absLoss < 0.02 ? 'acceptable' : classifyMoveEquity(equityLoss);
        breakdown[verdict] += 1;

        if (isUnforced) {
            checkerEquityLoss += Math.abs(equityLoss);
            unforcedCheckerCount += 1;
        }

        const conceptId = verdict === 'blunder' || verdict === 'howler' || verdict === 'doubtful'
            ? categorizeExplanation(null, playedNotation) : undefined;

        const isSyntheticAuditGame = typeof options.gameId === 'string' &&
            (options.gameId.startsWith('beta_20000_') || options.gameId.startsWith('loop_game_'));

        if (!isSyntheticAuditGame && (verdict === 'blunder' || verdict === 'howler' || Math.abs(equityLoss) >= 0.06)) {
            try {
                const catMeta = classifyLivePositionCategory(turn.boardBefore, turn.turnNumber || i + 1, false);
                const choiceSet = new Set<string>();
                if (optimalNotation) choiceSet.add(optimalNotation);
                if (playedNotation) choiceSet.add(playedNotation);
                for (const cand of logEval?.candidateMoves ?? []) {
                    if (cand.notation) choiceSet.add(cand.notation);
                    if (choiceSet.size >= 4) break;
                }
                recordBlunder({
                    board: [...turn.boardBefore], dice: [turn.dice[0], turn.dice[1]], player: targetPlayer,
                    playedMove: playedNotation, optimalMove: optimalNotation,
                    acceptableMoves: (logEval?.candidateMoves ?? []).filter((m) => Math.abs(m.equityLoss) < 0.02).map((m) => m.notation),
                    equityLoss: Math.abs(equityLoss), verdict: verdict === 'howler' ? 'howler' : verdict === 'blunder' ? 'blunder' : 'doubtful',
                    conceptId: catMeta.id || conceptId || 'positional',
                    conceptName: catMeta.fullName || conceptId || 'Jeu positionnel',
                    whyFailed: `Votre coup ${playedNotation} cède ${Math.abs(equityLoss).toFixed(3)} EMG face à ${optimalNotation}.`,
                    explanation: `Le coup optimal était ${optimalNotation} (perte de ${Math.abs(equityLoss).toFixed(3)} EMG sur ${playedNotation}).`,
                    hint: `Catégorie ciblée : ${catMeta.fullName} — cherchez comment ${optimalNotation} protège votre structure.`,
                    quizChoices: Array.from(choiceSet).slice(0, 4), gameId: options.gameId,
                    matchContext: { scoreX, scoreO, matchLength, cubeValue: turnCubeValue, cubeOwner: turnCubeOwner, crawford: turnCrawford },
                });
            } catch {
                // Ignore storage errors in non-browser contexts
            }
        }

        evaluatedMoves.push({
            moveNumber: turn.turnNumber || i + 1, player: targetPlayer, dice: turn.dice,
            boardBefore: turn.boardBefore, boardAfter: effectiveBoardAfter, playedNotation, optimalNotation,
            equityLoss: Number(equityLoss.toFixed(4)), equityBefore, equityAfter, mwcBefore, mwcAfter,
            luck: rollLuck, verdict, isUnforced, candidateCount, conceptId,
            cubeEquityLoss: isCloseCube ? cubeLoss : undefined, isCloseCubeDecision: isCloseCube || undefined,
        });
    }

    const totalUnforcedDecisions = unforcedCheckerCount + closeCubeDecisionsCount;
    const totalEquityLoss = Number((checkerEquityLoss + cubeEquityLoss).toFixed(4));
    const errorRate = calculateErrorRate(totalEquityLoss, totalUnforcedDecisions);
    const snowieErrorRate = calculateSnowieErrorRate(totalEquityLoss, playerTurns.length);
    const checkerPR = calculatePR(checkerEquityLoss, unforcedCheckerCount);
    const cubePR = calculatePR(cubeEquityLoss, closeCubeDecisionsCount);
    const performanceRating = calculateCombinedPR(checkerEquityLoss, cubeEquityLoss, unforcedCheckerCount, closeCubeDecisionsCount);
    const luckRate = calculateLuckRate(totalLuck, playerTurns.length);
    const luckAdjustedPR = calculateLuckAdjustedPR(totalEquityLoss, totalLuck, totalUnforcedDecisions);
    const prCategory = getPRCategory(performanceRating);
    const estimatedRating = estimateEloFromPR(performanceRating);

    return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gameId: options.gameId || `game_${Date.now()}`, date: new Date().toISOString(), player: targetPlayer,
        opponentType: options.opponentType || 'ai', opponentDifficulty: options.opponentDifficulty || 'intermediate',
        winner: options.winner ?? null, winType: options.winType ?? null, pointsWon: options.pointsWon ?? 1,
        scoreX, scoreO, matchLength, totalMovesCount: playerTurns.length,
        decisionsCount: playerTurns.length + closeCubeDecisionsCount, unforcedDecisionsCount: totalUnforcedDecisions,
        closeCubeDecisionsCount, totalEquityLoss, cubeEquityLoss: Number(cubeEquityLoss.toFixed(4)),
        checkerPR, cubePR, errorRate, snowieErrorRate, performanceRating, totalLuck: Number(totalLuck.toFixed(4)),
        luckRate, luckAdjustedPR, estimatedRating, prCategory, breakdown, evaluatedMoves,
    };
}
