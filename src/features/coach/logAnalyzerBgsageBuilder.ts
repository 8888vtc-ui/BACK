import type { Player, BoardState, Move } from '../../engine/backgammonEngine';
import { applyMove, type generateLegalMoves } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import {
    boardsMatchOnPoints,
    boardsMatchOnPointsAndBar,
    bgsageMoveBoardToProjectBoard,
    type BgsageEvaluateResponse,
    type BgsageMove,
} from '../../lib/engine/bgsageClient';
import {
    applyBgsageNotationToBoard,
    formatCoachMoveSequence,
    movesFromBoardDiff,
    normalizeCoachNotation,
    relativeNotationToAbsolute,
    parseCoachNotationMoves,
} from './coachMoveNotation';
import type { BgsageMoveMetrics, BgsageStrategicInsights } from './featureExtractor';
import { estimateOffListEquityLoss } from './offListEquity';
import {
    verifyCheckersPhysicallyExistOnBoard,
    sanitizeVerdictWithEquityThreshold,
    boardSignature,
    extractVerifiedCoachFacts,
} from './turnSnapshot';
import { classifyVerdict, type CoachVerdict, type HumanMoveAnalysis } from './logAnalyzer';

/**
 * Séquence de sous-mouvements fiable pour l'affichage : celle du log si elle
 * est complète, sinon reconstruite depuis le différentiel boardBefore → boardAfter.
 */
export function resolvePlayedMoves(logEntry: MatchLogEntry): ReadonlyArray<{ from: number; to: number }> {
    if (logEntry.movePlayed && logEntry.movePlayed.length > 0) {
        return logEntry.movePlayed;
    }
    return movesFromBoardDiff(logEntry.boardBefore, logEntry.boardAfter, logEntry.player);
}

/**
 * Calcule le plateau d'arrivée effectif : si `boardAfter` est identique à `boardBefore`
 * alors que `movePlayed` contient des coups, rejoue `movePlayed` sur `boardBefore`.
 */
export function resolveEffectiveBoardAfter(logEntry: MatchLogEntry): number[] {
    if (
        logEntry.movePlayed &&
        logEntry.movePlayed.length > 0 &&
        boardsMatchOnPointsAndBar(logEntry.boardBefore, logEntry.boardAfter)
    ) {
        let b = [...logEntry.boardBefore];
        for (const m of logEntry.movePlayed) {
            b = applyMove(b, m, logEntry.player);
        }
        return b;
    }
    return [...logEntry.boardAfter];
}

/**
 * Clé canonique d'une séquence de sous-mouvements, insensible à l'ordre.
 */
export function moveSequenceKey(moves: ReadonlyArray<{ from: number; to: number }>): string {
    return moves
        .map((m) => `${m.from}>${m.to}`)
        .sort()
        .join('|');
}

/**
 * Fusionne les sous-mouvements chaînés d'un même pion (ex. 24/18 + 18/13 -> 24/13)
 * et développe les multiplicateurs (ex. 8/5(2) -> 8/5 8/5) pour une comparaison canonique.
 */
function collapseParsedMovesKey(
    notation: string,
    player: Player = 'X',
    dice?: readonly [number, number],
): string {
    const moves = parseCoachNotationMoves(notation, player, dice);
    if (moves.length === 0) return '';
    const list = moves.map((m) => ({ ...m }));
    let merged = true;
    while (merged) {
        merged = false;
        for (let i = 0; i < list.length && !merged; i++) {
            for (let j = 0; j < list.length; j++) {
                if (i === j) continue;
                if (list[i].to !== 0 && list[i].to !== 25 && list[i].to === list[j].from) {
                    list[i] = { from: list[i].from, to: list[j].to };
                    list.splice(j, 1);
                    merged = true;
                    break;
                }
            }
        }
    }
    return list
        .map((m) => {
            const fromKey = m.from === 0 || m.from === 25 ? 'bar' : String(m.from);
            const toKey = m.to === 0 || m.to === 25 ? 'off' : String(m.to);
            return `${fromKey}>${toKey}`;
        })
        .sort()
        .join('|');
}

// Vérifie si deux notations sont équivalentes même lorsque les sous-mouvements sont chaînés ou inversés.
export function notationsAreEquivalent(
    a: string,
    b: string,
    player: Player = 'X',
    dice?: readonly [number, number],
): boolean {
    const normA = normalizeCoachNotation(a);
    const normB = normalizeCoachNotation(b);
    if (!normA || !normB) return false;
    if (normA === normB) return true;
    const tokensA = normA.split(' ').filter(Boolean).sort().join(' ');
    const tokensB = normB.split(' ').filter(Boolean).sort().join(' ');
    if (tokensA === tokensB) return true;
    const collapsedA = collapseParsedMovesKey(a, player, dice);
    const collapsedB = collapseParsedMovesKey(b, player, dice);
    return Boolean(collapsedA && collapsedA === collapsedB);
}

function toBgsageMoveMetrics(m: BgsageMove): BgsageMoveMetrics {
    const winProb = m.probabilities?.win ?? 0.5;
    const winGammonProb = m.probabilities?.winGammon ?? 0;
    const winBackgammonProb = m.probabilities?.winBackgammon ?? 0;
    const loseProb = m.probabilities?.loseWin ?? Math.max(0, 1 - winProb);
    const loseGammonProb = m.probabilities?.loseGammon ?? 0;
    const loseBackgammonProb = m.probabilities?.loseBackgammon ?? 0;
    return {
        equity: m.equity,
        cubelessEquity: m.cubelessEquity ?? m.equity,
        equityLoss: m.equityLoss,
        winProb,
        winSingleProb: m.probabilities?.winSingle ?? Math.max(0, winProb - winGammonProb),
        winGammonProb,
        winBackgammonProb,
        loseProb,
        loseSingleProb: m.probabilities?.loseSingle ?? Math.max(0, loseProb - loseGammonProb),
        loseGammonProb,
        loseBackgammonProb,
        playerGamePlan: m.playerGamePlan ?? 'contact',
        opponentGamePlan: m.opponentGamePlan ?? 'contact',
        evalLevel: m.evalLevel ?? undefined,
    };
}

export function buildHumanMoveAnalysisFromBgsageResult(params: {
    bgsageResult: BgsageEvaluateResponse;
    logEntry: MatchLogEntry;
    evalState: BoardState;
    legalSeqs: ReturnType<typeof generateLegalMoves>;
    boardBefore: number[];
    effectiveBoardAfter: number[];
    targetPly: number;
}): (HumanMoveAnalysis & { source: 'bgsage' }) | null {
    const { bgsageResult, logEntry, evalState, legalSeqs, boardBefore, effectiveBoardAfter, targetPly } = params;
    if (!bgsageResult || bgsageResult.chequerPlay.length === 0) return null;

    const dicePair: [number, number] = evalState.dice ?? [logEntry.dice[0], logEntry.dice[1]];

    const resolveBgsageCandidateSeq = (m: BgsageMove, source?: string | null) => {
        if (m.moves && m.moves.length > 0) {
            if (m.board && m.board.length === 26) {
                const engineBoard = bgsageMoveBoardToProjectBoard(m.board, logEntry.player, source);
                return {
                    moves: m.moves,
                    board: engineBoard,
                    notation: formatCoachMoveSequence(m.moves, logEntry.player, boardBefore),
                };
            }
            let simBoard = [...boardBefore];
            for (const mv of m.moves) simBoard = applyMove(simBoard, mv, logEntry.player);
            return {
                moves: m.moves,
                board: simBoard,
                notation: formatCoachMoveSequence(m.moves, logEntry.player, boardBefore),
            };
        }
        if (m.board && m.board.length === 26) {
            const engineBoard = bgsageMoveBoardToProjectBoard(m.board, logEntry.player, source);
            const matchedSeq =
                legalSeqs.find((s) => boardsMatchOnPointsAndBar(s.board, engineBoard)) ??
                legalSeqs.find((s) => boardsMatchOnPoints(s.board, engineBoard));
            if (matchedSeq) {
                return {
                    moves: matchedSeq.moves,
                    board: matchedSeq.board,
                    notation: formatCoachMoveSequence(matchedSeq.moves, logEntry.player, boardBefore),
                };
            }
            return {
                moves: movesFromBoardDiff(boardBefore, engineBoard, logEntry.player),
                board: engineBoard,
                notation: relativeNotationToAbsolute(m.notation, logEntry.player),
            };
        }
        const simBoard = applyBgsageNotationToBoard(boardBefore, m.notation, dicePair, logEntry.player);
        if (simBoard) {
            const matchedSeq =
                legalSeqs.find((s) => boardsMatchOnPointsAndBar(s.board, simBoard)) ??
                legalSeqs.find((s) => boardsMatchOnPoints(s.board, simBoard));
            if (matchedSeq) {
                return {
                    moves: matchedSeq.moves,
                    board: matchedSeq.board,
                    notation: formatCoachMoveSequence(matchedSeq.moves, logEntry.player, boardBefore),
                };
            }
            const parsedMoves = parseCoachNotationMoves(m.notation, logEntry.player, dicePair);
            return {
                moves: parsedMoves.length > 0 ? parsedMoves : movesFromBoardDiff(boardBefore, simBoard, logEntry.player),
                board: simBoard,
                notation: parsedMoves.length > 0
                    ? formatCoachMoveSequence(parsedMoves, logEntry.player, boardBefore)
                    : relativeNotationToAbsolute(m.notation, logEntry.player),
            };
        }
        const absNotation = relativeNotationToAbsolute(m.notation, logEntry.player);
        const matchedByNotation = legalSeqs.find((s) => {
            const seqNotation = formatCoachMoveSequence(s.moves, logEntry.player, boardBefore);
            return (
                notationsAreEquivalent(seqNotation, absNotation, logEntry.player, dicePair) ||
                notationsAreEquivalent(seqNotation, m.notation, logEntry.player, dicePair)
            );
        });
        if (matchedByNotation) {
            return {
                moves: matchedByNotation.moves,
                board: matchedByNotation.board,
                notation: formatCoachMoveSequence(matchedByNotation.moves, logEntry.player, boardBefore),
            };
        }
        return {
            moves: [] as Move[],
            board: null as number[] | null,
            notation: absNotation,
        };
    };

    const playedMoves = resolvePlayedMoves(logEntry);
    const playedNotation = formatCoachMoveSequence([...playedMoves], logEntry.player, boardBefore);
    const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
    const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

    const bestMove = bgsageResult.chequerPlay[0];
    let resolvedBest = resolveBgsageCandidateSeq(bestMove, bgsageResult.source);
    let effectiveBestMove = bestMove;
    if (resolvedBest.moves.length === 0 && !resolvedBest.board) {
        for (const m of bgsageResult.chequerPlay) {
            const cand = resolveBgsageCandidateSeq(m, bgsageResult.source);
            if (cand.moves.length > 0 || cand.board) {
                resolvedBest = cand;
                effectiveBestMove = m;
                break;
            }
        }
    }

    const playedBoardSig = boardSignature(effectiveBoardAfter);

    // Résolution physique stricte de la meilleure séquence parmi les coups légaux (ZÉRO fallback sur legalSeqs[0])
    const bestLegalSeq = legalSeqs.find((s) => {
        if (resolvedBest.board) {
            return (
                boardsMatchOnPointsAndBar(s.board, resolvedBest.board) ||
                boardSignature(s.board) === boardSignature(resolvedBest.board)
            );
        }
        if (bestMove.board && bestMove.board.length === 26) {
            const engineBoard = bgsageMoveBoardToProjectBoard(bestMove.board, logEntry.player, bgsageResult.source);
            return (
                boardsMatchOnPointsAndBar(s.board, engineBoard) ||
                boardSignature(s.board) === boardSignature(engineBoard)
            );
        }
        const simBoard = applyBgsageNotationToBoard(boardBefore, bestMove.notation, dicePair, logEntry.player);
        return Boolean(
            simBoard &&
            (boardsMatchOnPointsAndBar(s.board, simBoard) || boardSignature(s.board) === boardSignature(simBoard)),
        );
    });

    const optimalSubMoves = bestLegalSeq?.moves ?? (resolvedBest.moves.length > 0 ? resolvedBest.moves : []);
    const bestBoardResolved = bestLegalSeq?.board ?? resolvedBest.board;

    // Verrou 3 : Transposition exacte du meilleur coup (plateau identique ou notation équivalente) = 0.0000 EMG garanti !
    const isExactTranspositionOfBest = Boolean(
        (bestBoardResolved &&
            (boardSignature(bestBoardResolved) === playedBoardSig ||
                boardsMatchOnPointsAndBar(bestBoardResolved, effectiveBoardAfter))) ||
        notationsAreEquivalent(resolvedBest.notation, playedNotation, logEntry.player, dicePair) ||
        notationsAreEquivalent(resolvedBest.notation, canonicalNotation, logEntry.player, dicePair) ||
        notationsAreEquivalent(bestMove.notation, playedNotation, logEntry.player, dicePair) ||
        notationsAreEquivalent(bestMove.notation, canonicalNotation, logEntry.player, dicePair),
    );

    const matched = isExactTranspositionOfBest
        ? bestMove
        : bgsageResult.chequerPlay.find((m) => {
              if (m.board && m.board.length === 26) {
                  if (boardSignature(m.board) === playedBoardSig) return true;
                  const engineBoard = bgsageMoveBoardToProjectBoard(m.board, logEntry.player, bgsageResult.source);
                  if (
                      boardSignature(engineBoard) === playedBoardSig ||
                      boardsMatchOnPointsAndBar(engineBoard, effectiveBoardAfter)
                  ) {
                      return true;
                  }
              }
              const simBoard = applyBgsageNotationToBoard(boardBefore, m.notation, dicePair, logEntry.player);
              if (
                  simBoard &&
                  (boardSignature(simBoard) === playedBoardSig ||
                      boardsMatchOnPointsAndBar(simBoard, effectiveBoardAfter))
              ) {
                  return true;
              }
              const resolvedCand = resolveBgsageCandidateSeq(m, bgsageResult.source);
              if (
                  resolvedCand.board &&
                  (boardSignature(resolvedCand.board) === playedBoardSig ||
                      boardsMatchOnPointsAndBar(resolvedCand.board, effectiveBoardAfter))
              ) {
                  return true;
              }
              const absMoveNotation = relativeNotationToAbsolute(m.notation, logEntry.player);
              return (
                  notationsAreEquivalent(resolvedCand.notation, playedNotation, logEntry.player, dicePair) ||
                  notationsAreEquivalent(resolvedCand.notation, canonicalNotation, logEntry.player, dicePair) ||
                  notationsAreEquivalent(absMoveNotation, playedNotation, logEntry.player, dicePair) ||
                  notationsAreEquivalent(absMoveNotation, canonicalNotation, logEntry.player, dicePair) ||
                  notationsAreEquivalent(m.notation, playedNotation, logEntry.player, dicePair) ||
                  notationsAreEquivalent(m.notation, canonicalNotation, logEntry.player, dicePair)
              );
          });

    const rawOptimalNotation =
        (bestLegalSeq && formatCoachMoveSequence(bestLegalSeq.moves, logEntry.player, boardBefore)) ||
        resolvedBest.notation ||
        relativeNotationToAbsolute(effectiveBestMove.notation, logEntry.player);

    const optimalNotation = isExactTranspositionOfBest
        ? playedNotation
        : verifyCheckersPhysicallyExistOnBoard(rawOptimalNotation, boardBefore, logEntry.player, dicePair)
          ? rawOptimalNotation
          : resolvedBest.notation;

    const bestEquity = effectiveBestMove.equity;

    let playedEquity: number;
    let equityLoss: number;
    let verdict: CoachVerdict;

    if (isExactTranspositionOfBest) {
        playedEquity = bestEquity;
        equityLoss = 0.0000;
        verdict = 'optimal';
    } else if (matched) {
        playedEquity = matched.equity;
        equityLoss = Math.max(0, bestEquity - playedEquity);
        const rawVerdict = classifyVerdict(equityLoss);
        verdict = sanitizeVerdictWithEquityThreshold(equityLoss, rawVerdict);
    } else {
        const offList = estimateOffListEquityLoss({
            evalState,
            playedBoard: effectiveBoardAfter,
            legalSeqs,
            candidates: bgsageResult.chequerPlay,
            bestEquity,
            ply: 2,
        });
        playedEquity = bestEquity - offList.equityLoss;
        equityLoss = Math.max(0, bestEquity - playedEquity);
        const rawVerdict = classifyVerdict(equityLoss);
        verdict = sanitizeVerdictWithEquityThreshold(equityLoss, rawVerdict);
    }

    const verifiedFacts = extractVerifiedCoachFacts(
        boardBefore,
        effectiveBoardAfter,
        bestBoardResolved ?? effectiveBoardAfter,
    );

    const candidateMoves = bgsageResult.chequerPlay.map((m) => {
        const resolvedCand = resolveBgsageCandidateSeq(m, bgsageResult.source);
        const isMatch = m === matched;
        return {
            notation: isMatch ? playedNotation : resolvedCand.notation,
            equity: m.equity,
            equityLoss: m.equityLoss,
            winProbability: m.probabilities?.win,
            gammonProbability: m.probabilities?.winGammon,
            backgammonProbability: m.probabilities?.winBackgammon,
        };
    });

    if (!matched && !candidateMoves.some((m) => notationsAreEquivalent(m.notation, playedNotation, logEntry.player, dicePair))) {
        candidateMoves.push({
            notation: playedNotation,
            equity: playedEquity,
            equityLoss: Number((playedEquity - bestEquity).toFixed(4)),
            winProbability: undefined,
            gammonProbability: undefined,
            backgammonProbability: undefined,
        });
    }

    const topCandidates = bgsageResult.chequerPlay.slice(0, 5).map((m, idx) => {
        const resolvedCand = resolveBgsageCandidateSeq(m, bgsageResult.source);
        const isMatch = m === matched;
        return {
            rank: m.rank ?? idx + 1,
            notation: isMatch ? playedNotation : resolvedCand.notation,
            equity: m.equity,
            cubelessEquity: m.cubelessEquity ?? m.equity,
            equityLoss: m.equityLoss,
            winProb: m.probabilities?.win ?? 0.5,
            winGammonProb: m.probabilities?.winGammon ?? 0,
            winBackgammonProb: m.probabilities?.winBackgammon ?? 0,
            loseGammonProb: m.probabilities?.loseGammon ?? 0,
            loseBackgammonProb: m.probabilities?.loseBackgammon ?? 0,
            playerGamePlan: m.playerGamePlan ?? undefined,
        };
    });

    const bgsageInsights: BgsageStrategicInsights = {
        isRace: Boolean(bgsageResult.isRace),
        playerGamePlan: bgsageResult.gamePlans?.player ?? bestMove.playerGamePlan ?? 'contact',
        opponentGamePlan: bgsageResult.gamePlans?.opponent ?? bestMove.opponentGamePlan ?? 'contact',
        evalLevel: bestMove.evalLevel ?? `${targetPly}-ply`,
        source: bgsageResult.source ?? 'bgsage-stage11',
        optimalMetrics: toBgsageMoveMetrics(bestMove),
        playedMetrics: matched ? toBgsageMoveMetrics(matched) : undefined,
        topCandidates,
        cubeDecision: bgsageResult.cubeDecision ?? undefined,
    };

    return {
        turnIndex: logEntry.turnIndex,
        player: logEntry.player,
        verdict,
        equityLoss,
        playedNotation,
        optimalNotation,
        playedEquity,
        bestEquity,
        isUnforced: Math.max(bgsageResult.chequerPlay.length, legalSeqs.length) > 1,
        isBlunder: verdict === 'blunder',
        optimalMoves: optimalSubMoves.length > 0 ? optimalSubMoves : (resolvedBest.moves.length > 0 ? resolvedBest.moves : undefined),
        optimalSubMoves: optimalSubMoves.length > 0 ? optimalSubMoves : undefined,
        verifiedFacts,
        packetId: logEntry.packet?.packetId,
        bgsageInsights,
        candidateMoves,
        source: 'bgsage',
    };
}
