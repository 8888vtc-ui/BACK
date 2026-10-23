/**
 * Helpers d'exécution manuelle et de détection d'action videau pour `useCoach.ts` (< 200 lignes, 0 any).
 */

import { type BoardState, type Move, type Player, applyMove, serializeXGID } from '../engine/backgammonEngine';
import type { GameResult } from '../engine/aiHeuristics';
import {
    extractStrategicFeatures,
    generateRuleBasedExplanation,
    buildMatchContext,
} from '../features/coach';
import { mapGameCubeAction, type CubeAction, type CubeActionType } from '../features/coach/cubeCoach';
import { analyzeBoardMoves } from '../lib/engine/evaluator';
import { evaluatePosition } from '../lib/analysisService';
import { formatCoachMoveSequence, movesFromBoardDiff } from '../features/coach/coachMoveNotation';
import type { CoachHighlight } from '../components/board/boardThemes';
import { analyzeHumanMoveFromLogWithBgsage } from '../features/coach/logAnalyzer';
import type { MatchLogEntry } from '../actions/types';
import {
    buildCoachStateFromLogResult,
    extractCandidateMoveList,
    type CoachMoveHistoryItem,
    type CoachState,
} from './useCoachHelpers';

export interface DetectedCubeDecision {
    key: string;
    action: CubeActionType | CubeAction;
    stateToEval: BoardState;
    nextOfferSnapshot?: BoardState | null;
}

/**
 * Détecte de manière pure si une transition d'état correspond à une décision de videau du joueur X.
 */
export function detectPlayerCubeDecision(params: {
    moveHistory?: ReadonlyArray<CoachMoveHistoryItem>;
    doublingOfferedBy?: Player | null;
    prevOfferedBy: Player | null;
    stateBeforeCubeOffer: BoardState | null;
    phase?: string;
    gameResult?: GameResult | null;
    currentState: BoardState;
}): {
    decision: DetectedCubeDecision | null;
    updatedOfferSnapshot: BoardState | null;
    nextPrevOfferedBy: Player | null;
} {
    const { moveHistory, doublingOfferedBy, prevOfferedBy, stateBeforeCubeOffer, phase, gameResult, currentState } = params;
    const history = moveHistory ?? [];
    if (history.length > 0) {
        const lastItem = history[history.length - 1];
        const rawCubeType = lastItem.type ?? lastItem.action;
        const mapped = mapGameCubeAction(rawCubeType);
        if (mapped && (!lastItem.player || lastItem.player === 'X')) {
            const stateToEval = lastItem.state ?? currentState;
            return {
                decision: {
                    key: `hist:${history.length}:${rawCubeType}:${stateToEval.cubeValue}`,
                    action: mapped,
                    stateToEval,
                },
                updatedOfferSnapshot: stateBeforeCubeOffer,
                nextPrevOfferedBy: doublingOfferedBy ?? null,
            };
        }
    }

    const currOfferedBy = doublingOfferedBy ?? null;
    if (currOfferedBy === 'O' && prevOfferedBy !== 'O') {
        return {
            decision: null,
            updatedOfferSnapshot: { ...currentState, board: [...currentState.board] },
            nextPrevOfferedBy: currOfferedBy,
        };
    }

    if (currOfferedBy === 'X' && prevOfferedBy !== 'X') {
        return {
            decision: {
                key: `offer:${currentState.scoreX}-${currentState.scoreO}:${currentState.cubeValue}:${currentState.board.join(',')}`,
                action: 'OFFER_DOUBLE',
                stateToEval: currentState,
            },
            updatedOfferSnapshot: stateBeforeCubeOffer,
            nextPrevOfferedBy: currOfferedBy,
        };
    }

    if (prevOfferedBy === 'O' && currOfferedBy === null) {
        const snapshot = stateBeforeCubeOffer ?? currentState;
        const isPass = phase === 'GAME_OVER' || gameResult?.winType === 'pass';
        const decisionType: CubeActionType = isPass ? 'PASS_DOUBLE' : 'TAKE_DOUBLE';
        return {
            decision: {
                key: `${decisionType}:${snapshot.scoreX}-${snapshot.scoreO}:${snapshot.cubeValue}:${snapshot.board.join(',')}`,
                action: decisionType,
                stateToEval: snapshot,
            },
            updatedOfferSnapshot: null,
            nextPrevOfferedBy: currOfferedBy,
        };
    }

    return {
        decision: null,
        updatedOfferSnapshot: stateBeforeCubeOffer,
        nextPrevOfferedBy: currOfferedBy,
    };
}

export async function runManualTriggerAnalysis(
    stateToEval: BoardState,
    evalDice: [number, number],
    matchLog?: ReadonlyArray<MatchLogEntry>,
    hasActiveDice: boolean = false,
): Promise<{ coachState: CoachState; highlight: CoachHighlight }> {
    const lastHumanEntry = !hasActiveDice && matchLog ? [...matchLog].reverse().find((e) => e.player === 'X') : undefined;
    if (lastHumanEntry) {
        const result = await analyzeHumanMoveFromLogWithBgsage({
            logEntry: lastHumanEntry,
            localPlayer: 'X',
            cubeValue: stateToEval.cubeValue,
            matchLength: stateToEval.matchLength,
            scoreX: stateToEval.scoreX,
            scoreO: stateToEval.scoreO,
            ply: 2,
        });
        if (result) {
            const loggedMoves = [...lastHumanEntry.movePlayed];
            const playedMoves =
                loggedMoves.length > 0 ? loggedMoves : movesFromBoardDiff(lastHumanEntry.boardBefore, lastHumanEntry.boardAfter, 'X');
            const playedNotation = formatCoachMoveSequence(playedMoves, 'X', lastHumanEntry.boardBefore);
            return buildCoachStateFromLogResult({
                lastEntry: lastHumanEntry,
                result,
                playedMoves,
                playedNotation,
                gameState: stateToEval,
            });
        }
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout analyse coach (8s)')), 8000),
    );
    const analysisPromise = (async () => {
        const res = await evaluatePosition(stateToEval, { ply: 2, timeoutMs: 1500 });
        if (res && res.moves && res.moves.length > 0) {
            return { best: res.moves[0], candidates: res.moves };
        }
        const localRes = analyzeBoardMoves(stateToEval, evalDice, { ply: 2, maxMoves: 5 });
        if (localRes && localRes.bestMove) {
            return { best: localRes.bestMove, candidates: localRes.moves };
        }
        throw new Error('Aucun coup légal détecté');
    })();

    const { best, candidates } = await Promise.race([analysisPromise, timeoutPromise]);
    const bestMoves: Move[] = extractCandidateMoveList(best);

    let bestEndState: BoardState = stateToEval;
    if (bestMoves.length > 0) {
        let b = [...stateToEval.board];
        for (const m of bestMoves) b = applyMove(b, m, 'X');
        bestEndState = { ...stateToEval, board: b };
    }

    const features = extractStrategicFeatures(stateToEval, bestEndState, bestEndState);
    const absoluteBestNotation =
        bestMoves.length > 0
            ? formatCoachMoveSequence(bestMoves, 'X', stateToEval.board)
            : best.notation || 'Pass';

    const ruleBased = generateRuleBasedExplanation({
        verdict: 'optimal',
        equityLoss: 0,
        playedMove: absoluteBestNotation,
        optimalMove: absoluteBestNotation,
        features,
        matchContext: buildMatchContext({
            matchLength: stateToEval.matchLength,
            scoreX: stateToEval.scoreX,
            scoreO: stateToEval.scoreO,
            cubeValue: stateToEval.cubeValue,
            cubeOwner: stateToEval.cubeOwner,
            crawford: stateToEval.crawford,
        }),
        language: 'fr',
    });

    return {
        coachState: {
            verdict: 'optimal',
            equityLoss: 0,
            playedMove: absoluteBestNotation,
            optimalMove: absoluteBestNotation,
            explanation: ruleBased.explanation,
            whyFailed: undefined,
            whyOptimal: ruleBased.whyOptimal,
            summary: `Recommandation Open Sage sur [${evalDice[0]}-${evalDice[1]}] : ${absoluteBestNotation}`,
            features,
            positionKey: serializeXGID(stateToEval),
            candidateMoves: candidates.slice(0, 5).map((m, idx) => {
                const candMoves = extractCandidateMoveList(m);
                const notation =
                    candMoves.length > 0 ? formatCoachMoveSequence(candMoves, 'X', stateToEval.board) : m.notation;
                const probs = 'probabilities' in m && m.probabilities ? m.probabilities : undefined;
                return {
                    rank: idx + 1,
                    notation,
                    equity: m.equity,
                    equityLoss: m.equityLoss,
                    winProbability: probs?.win ?? ('winProb' in m ? (m as { winProb?: number }).winProb : undefined),
                    gammonProbability: probs?.winGammon ?? ('gammonProb' in m ? (m as { gammonProb?: number }).gammonProb : undefined),
                    backgammonProbability: probs?.winBackgammon ?? ('bgProb' in m ? (m as { bgProb?: number }).bgProb : undefined),
                };
            }),
            boardBefore: [...stateToEval.board],
        },
        highlight: { played: [], optimal: bestMoves },
    };
}
