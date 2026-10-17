/**
 * Analyseur de Partie Complète de Backgammon (Full Game Reviewer).
 *
 * Compare chaque coup joué au moteur déterministe GNUBG pour :
 * 1. Détecter les coups forcés vs décisions libres (unforced decisions)
 * 2. Calculer la perte d'équité précise (ΔEq) subie sur chaque coup
 * 3. Agréger le Performance Rating (PR) officiel et le Rating Elo estimé
 * 4. Fournir la ventilation détaillée des coups (optimaux, acceptables, douteux, blunders, howlers)
 */

import type { Player, BoardState } from '../../engine/backgammonEngine';
import {
    analyzeBoardMoves,
    formatMoveSequenceNotation,
} from '../../lib/engine/evaluator';
import { normalizeMoveNotation } from '../drills/blunderDrillEngine';
import { categorizeExplanation } from '../../lib/stats/statsAggregator';
import {
    classifyMoveEquity,
    calculateErrorRate,
    calculatePR,
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

    let totalEquityLoss = 0;
    let unforcedDecisionsCount = 0;
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
        const playedNotation = formatMoveSequenceNotation(turn.moves, targetPlayer);
        const normalizedPlayed = normalizeMoveNotation(playedNotation);

        const syntheticState: BoardState = {
            board: turn.boardBefore,
            turn: targetPlayer,
            cubeValue: 1,
            cubeOwner: null,
            dice: turn.dice,
            matchLength: options.matchLength ?? 7,
            scoreX: options.scoreX ?? 0,
            scoreO: options.scoreO ?? 0,
            crawford: false,
            doubled: false,
            resigned: 0,
        };

        // Analyse des candidats par le moteur
        let analysis;
        try {
            analysis = analyzeBoardMoves(syntheticState, turn.dice, { ply: 2, maxMoves: 8 });
        } catch {
            analysis = { moves: [], bestMove: null };
        }

        const candidateCount = analysis.moves.length;
        const isUnforced = candidateCount > 1;
        const bestMove = analysis.bestMove;
        const optimalNotation = bestMove ? bestMove.notation : playedNotation;
        const normalizedOptimal = normalizeMoveNotation(optimalNotation);

        let equityLoss = 0;

        if (!isUnforced) {
            // Coup forcé ou aucun choix légal : perte d'équité nulle conventionnelle
            equityLoss = 0;
        } else if (normalizedPlayed === normalizedOptimal) {
            // Coup optimal direct
            equityLoss = 0;
        } else {
            // Recherche du coup joué dans les candidats évalués
            const matchedCandidate = analysis.moves.find(
                (m) => normalizeMoveNotation(m.notation) === normalizedPlayed,
            );

            if (matchedCandidate) {
                equityLoss = -Math.abs(matchedCandidate.equityLoss);
            } else {
                // Coup non présent dans le top-8 : pénalité par défaut représentative d'un howler
                equityLoss = -0.22;
            }
        }

        const verdict = classifyMoveEquity(equityLoss);
        breakdown[verdict] += 1;

        if (isUnforced) {
            totalEquityLoss += Math.abs(equityLoss);
            unforcedDecisionsCount += 1;
        }

        const conceptId =
            verdict === 'blunder' || verdict === 'howler' || verdict === 'doubtful'
                ? categorizeExplanation(null, playedNotation)
                : undefined;

        evaluatedMoves.push({
            moveNumber: turn.turnNumber || i + 1,
            player: targetPlayer,
            dice: turn.dice,
            boardBefore: turn.boardBefore,
            boardAfter: turn.boardAfter,
            playedNotation,
            optimalNotation,
            equityLoss: Number(equityLoss.toFixed(4)),
            verdict,
            isUnforced,
            candidateCount,
            conceptId,
        });
    }

    const errorRate = calculateErrorRate(totalEquityLoss, unforcedDecisionsCount);
    const performanceRating = calculatePR(totalEquityLoss, unforcedDecisionsCount);
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
        scoreX: options.scoreX ?? 0,
        scoreO: options.scoreO ?? 0,
        matchLength: options.matchLength ?? 7,
        totalMovesCount: playerTurns.length,
        decisionsCount: playerTurns.length,
        unforcedDecisionsCount,
        totalEquityLoss: Number(totalEquityLoss.toFixed(4)),
        errorRate,
        performanceRating,
        estimatedRating,
        prCategory,
        breakdown,
        evaluatedMoves,
    };
}
