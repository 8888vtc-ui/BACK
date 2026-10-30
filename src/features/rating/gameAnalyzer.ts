/**
 * Analyseur de Partie Complète de Backgammon (Full Game Reviewer — XG / Snowie / Galaxy Parity).
 *
 * Compare chaque coup joué au moteur déterministe GNUBG / WildBG pour :
 * 1. Détecter les coups forcés vs décisions libres (unforced decisions) + décisions de videau serrées (Close Cube)
 * 2. Calculer la perte d'équité précise (ΔEq en EMG) par évaluation directe de boardAfter (aucun cap -0.22)
 * 3. Calculer l'évolution MWC (%) via la table Kazaross-XG2 et la chance des dés (Luck)
 * 4. Agréger le Performance Rating combiné (PR_combiné = ((CheckerLoss + CubeLoss) / (UnforcedChecker + CloseCube)) * 500)
 * 5. Alimenter automatiquement la banque d'entraînement (Blunder Training)
 */

import { type Player, type BoardState, type Move, applyMove } from '../../engine/backgammonEngine';
import {
    analyzeBoardCube,
    evaluateBoard,
    formatMoveSequenceNotation,
} from '../../lib/engine/evaluator';
import { boardsMatchOnPointsAndBar } from '../../lib/engine/bgsageClient';
import { analyzeHumanMoveFromLog } from '../coach/logAnalyzer';
import { movesFromBoardDiff } from '../coach/coachMoveNotation';
import { recordBlunder } from '../drills/blunderBank';
import { categorizeExplanation } from '../../lib/stats/statsAggregator';
import {
    classifyMoveEquity,
    calculateErrorRate,
    calculateSnowieErrorRate,
    calculatePR,
    calculateCombinedPR,
    calculateLuckRate,
    calculateLuckAdjustedPR,
    convertEquityToMwc,
    getPRCategory,
    estimateEloFromPR,
} from './ratingCalculator';
import type {
    RawGameTurn,
    EvaluatedTurn,
    MoveBreakdown,
    CompleteGameAnalysis,
} from './types';

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
    /** Profondeur d'évaluation locale en repli (défaut : 2). */
    ply?: number;
}

/**
 * Évalue une décision de videau sur le tour courant (si présente ou close cube explicite).
 */
function evaluateTurnCubeDecision(
    turn: RawGameTurn,
    syntheticState: BoardState,
): { isCloseCube: boolean; cubeLoss: number } {
    if (!turn.cubeDecision) {
        return { isCloseCube: false, cubeLoss: 0 };
    }

    // Invariant XG / AGENTS.md : lorsque le videau appartient à l'adversaire, aucune décision de double n'existe.
    if (
        (turn.cubeDecision.action === 'no_double' || turn.cubeDecision.action === 'double') &&
        syntheticState.cubeOwner !== null &&
        syntheticState.cubeOwner !== syntheticState.turn
    ) {
        return { isCloseCube: false, cubeLoss: 0 };
    }

    if (typeof turn.cubeDecision.cubeEquityLoss === 'number') {
        const loss = Math.abs(turn.cubeDecision.cubeEquityLoss);
        const isClose = turn.cubeDecision.isCloseDecision ?? true;
        return { isCloseCube: isClose, cubeLoss: Number(loss.toFixed(4)) };
    }

    if (syntheticState.crawford) {
        return { isCloseCube: false, cubeLoss: 0 };
    }

    const cubeEval = analyzeBoardCube(syntheticState, { ply: 2 });
    const nd = cubeEval.noDouble ?? 0;
    const dt = cubeEval.doubleTake ?? 0;
    const dp = cubeEval.doublePass ?? 0;
    const effectiveDouble = Math.min(dt, dp);

    // Une décision de videau est dite "proche" (Close Cube Decision XG) si l'écart entre ND et Double est <= 0.160 EMG
    const isClose =
        turn.cubeDecision.isCloseDecision ?? Math.abs(nd - effectiveDouble) <= 0.16;

    const action = turn.cubeDecision.action;
    let loss = 0;

    if (action === 'no_double' && effectiveDouble > nd) {
        loss = effectiveDouble - nd;
    } else if (action === 'double' && nd > effectiveDouble) {
        loss = nd - effectiveDouble;
    } else if (action === 'take' && dt > dp) {
        loss = dt - dp;
    } else if (action === 'pass' && dp > dt) {
        loss = dp - dt;
    }

    return {
        isCloseCube: isClose || loss > 0.001,
        cubeLoss: Number(Math.max(0, loss).toFixed(4)),
    };
}

/**
 * Analyse l'ensemble des coups d'une partie complète pour le joueur cible.
 */
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
    const awayPlayer =
        matchLength > 0 ? Math.max(1, matchLength - (targetPlayer === 'X' ? scoreX : scoreO)) : 0;
    const awayOpponent =
        matchLength > 0 ? Math.max(1, matchLength - (targetPlayer === 'X' ? scoreO : scoreX)) : 0;

    let checkerEquityLoss = 0;
    let cubeEquityLoss = 0;
    let totalLuck = 0;
    let unforcedCheckerCount = 0;
    let closeCubeDecisionsCount = 0;
    const evaluatedMoves: EvaluatedTurn[] = [];

    const breakdown: MoveBreakdown = {
        optimal: 0,
        acceptable: 0,
        doubtful: 0,
        blunder: 0,
        howler: 0,
    };

    for (let i = 0; i < playerTurns.length; i++) {
        const turn = playerTurns[i];
        const turnCubeValue = turn.cubeValue ?? defaultCubeValue;
        const turnCubeOwner = turn.cubeOwner !== undefined ? turn.cubeOwner : (options.cubeOwner ?? null);
        const turnCrawford = turn.crawford ?? options.crawford ?? false;

        const hasDistinctBoardAfter =
            Boolean(turn.boardAfter && turn.boardAfter.length >= 26) &&
            !boardsMatchOnPointsAndBar(turn.boardBefore, turn.boardAfter);

        let effectiveMoves: Move[] = turn.moves ?? [];
        let effectiveBoardAfter: number[];

        if (hasDistinctBoardAfter) {
            effectiveBoardAfter = [...turn.boardAfter];
            if (effectiveMoves.length > 0) {
                let simBoard = [...turn.boardBefore];
                for (const mv of effectiveMoves) {
                    simBoard = applyMove(simBoard, mv, targetPlayer);
                }
                if (!boardsMatchOnPointsAndBar(simBoard, effectiveBoardAfter)) {
                    effectiveMoves = movesFromBoardDiff(turn.boardBefore, effectiveBoardAfter, targetPlayer);
                }
            } else {
                effectiveMoves = movesFromBoardDiff(turn.boardBefore, effectiveBoardAfter, targetPlayer);
            }
        } else {
            let simBoard = [...turn.boardBefore];
            for (const mv of effectiveMoves) {
                simBoard = applyMove(simBoard, mv, targetPlayer);
            }
            effectiveBoardAfter = simBoard;
        }

        const fallbackPlayedNotation = formatMoveSequenceNotation(effectiveMoves, targetPlayer);

        const syntheticState: BoardState = {
            board: turn.boardBefore,
            turn: targetPlayer,
            cubeValue: turnCubeValue,
            cubeOwner: turnCubeOwner,
            dice: turn.dice,
            matchLength,
            scoreX,
            scoreO,
            crawford: turnCrawford,
            doubled: false,
            resigned: 0,
        };

        // 1. Évaluation d'une décision de videau éventuelle sur ce tour
        const { isCloseCube, cubeLoss } = evaluateTurnCubeDecision(turn, syntheticState);
        if (isCloseCube) {
            closeCubeDecisionsCount += 1;
            cubeEquityLoss += cubeLoss;
        }

        // 2. Équité de référence avant le jet (0-ply rapide pour le calcul de Luck et MWC)
        let preRollEquity = 0;
        try {
            preRollEquity = evaluateBoard({ ...syntheticState, dice: null }, 0).cubelessEquity;
        } catch {
            preRollEquity = 0;
        }

        // 3. Analyse unifiée avec le Coach en direct (`analyzeHumanMoveFromLog` : maxMoves 64,
        //    Opening Book, appariement par plateau résultant et notations chaînées/inversées)
        const logEval = analyzeHumanMoveFromLog({
            logEntry: {
                turnIndex: turn.turnNumber || i + 1,
                player: targetPlayer,
                dice: [turn.dice[0], turn.dice[1]],
                boardBefore: turn.boardBefore,
                movePlayed: effectiveMoves,
                boardAfter: effectiveBoardAfter,
                notation: fallbackPlayedNotation,
                timestamp: 0,
            },
            localPlayer: targetPlayer,
            cubeValue: turnCubeValue,
            cubeOwner: turnCubeOwner,
            crawford: turnCrawford,
            matchLength,
            scoreX,
            scoreO,
            ply: options.ply ?? 2,
        });

        const candidateCount = logEval ? logEval.candidateMoves.length : 0;
        const isUnforced = logEval ? logEval.isUnforced : false;
        const playedNotation = logEval ? logEval.playedNotation : fallbackPlayedNotation;
        const optimalNotation = logEval ? logEval.optimalNotation : playedNotation;
        const bestEquity = logEval ? logEval.bestEquity : preRollEquity;

        // Calcul de la chance du jet de dés étalonnée XG : Luck = E*(S, dice) - E(S)
        const rawLuckDiff = bestEquity - preRollEquity;
        const calibratedLuck = Math.abs(rawLuckDiff) > 0.25 ? rawLuckDiff * 0.28 : rawLuckDiff;
        const rollLuck = Number(
            Math.max(-0.45, Math.min(0.45, calibratedLuck)).toFixed(4),
        );
        totalLuck += rollLuck;

        const equityLoss =
            isUnforced && logEval ? -Number(Math.abs(logEval.equityLoss).toFixed(4)) : 0;

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

        const conceptId =
            verdict === 'blunder' || verdict === 'howler' || verdict === 'doubtful'
                ? categorizeExplanation(null, playedNotation)
                : undefined;

        if (verdict === 'blunder' || verdict === 'howler') {
            try {
                recordBlunder({
                    board: [...turn.boardBefore],
                    dice: [turn.dice[0], turn.dice[1]],
                    player: targetPlayer,
                    playedMove: playedNotation,
                    optimalMove: optimalNotation,
                    acceptableMoves: (logEval?.candidateMoves ?? [])
                        .filter((m) => Math.abs(m.equityLoss) < 0.02)
                        .map((m) => m.notation),
                    equityLoss: Math.abs(equityLoss),
                    verdict,
                    conceptId: conceptId || 'positional',
                    conceptName: conceptId || 'Jeu positionnel',
                    explanation: `Le coup optimal était ${optimalNotation} (perte de ${Math.abs(equityLoss).toFixed(3)} EMG sur ${playedNotation}).`,
                    gameId: options.gameId,
                    matchContext: {
                        scoreX,
                        scoreO,
                        matchLength,
                        cubeValue: turnCubeValue,
                        cubeOwner: turnCubeOwner,
                        crawford: turnCrawford,
                    },
                });
            } catch {
                // Ignore storage errors in non-browser contexts
            }
        }

        evaluatedMoves.push({
            moveNumber: turn.turnNumber || i + 1,
            player: targetPlayer,
            dice: turn.dice,
            boardBefore: turn.boardBefore,
            boardAfter: effectiveBoardAfter,
            playedNotation,
            optimalNotation,
            equityLoss: Number(equityLoss.toFixed(4)),
            equityBefore,
            equityAfter,
            mwcBefore,
            mwcAfter,
            luck: rollLuck,
            verdict,
            isUnforced,
            candidateCount,
            conceptId,
            cubeEquityLoss: isCloseCube ? cubeLoss : undefined,
            isCloseCubeDecision: isCloseCube || undefined,
        });
    }

    const totalUnforcedDecisions = unforcedCheckerCount + closeCubeDecisionsCount;
    const totalEquityLoss = Number((checkerEquityLoss + cubeEquityLoss).toFixed(4));

    const errorRate = calculateErrorRate(totalEquityLoss, totalUnforcedDecisions);
    const snowieErrorRate = calculateSnowieErrorRate(totalEquityLoss, playerTurns.length);
    const checkerPR = calculatePR(checkerEquityLoss, unforcedCheckerCount);
    const cubePR = calculatePR(cubeEquityLoss, closeCubeDecisionsCount);
    const performanceRating = calculateCombinedPR(
        checkerEquityLoss,
        cubeEquityLoss,
        unforcedCheckerCount,
        closeCubeDecisionsCount,
    );
    const luckRate = calculateLuckRate(totalLuck, playerTurns.length);
    const luckAdjustedPR = calculateLuckAdjustedPR(
        totalEquityLoss,
        totalLuck,
        totalUnforcedDecisions,
    );
    const prCategory = getPRCategory(performanceRating);
    const estimatedRating = estimateEloFromPR(performanceRating);

    return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gameId: options.gameId || `game_${Date.now()}`,
        date: new Date().toISOString(),
        player: targetPlayer,
        opponentType: options.opponentType || 'ai',
        opponentDifficulty: options.opponentDifficulty || 'intermediate',
        winner: options.winner ?? null,
        winType: options.winType ?? null,
        pointsWon: options.pointsWon ?? 1,
        scoreX,
        scoreO,
        matchLength,
        totalMovesCount: playerTurns.length,
        decisionsCount: playerTurns.length + closeCubeDecisionsCount,
        unforcedDecisionsCount: totalUnforcedDecisions,
        closeCubeDecisionsCount,
        totalEquityLoss,
        cubeEquityLoss: Number(cubeEquityLoss.toFixed(4)),
        checkerPR,
        cubePR,
        errorRate,
        snowieErrorRate,
        performanceRating,
        totalLuck: Number(totalLuck.toFixed(4)),
        luckRate,
        luckAdjustedPR,
        estimatedRating,
        prCategory,
        breakdown,
        evaluatedMoves,
    };
}
