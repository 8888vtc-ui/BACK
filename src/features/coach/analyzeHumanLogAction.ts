/**
 * Micro-programme d'analyse Coach Log-Driven (LOI 4)
 *
 * RÈGLES STRICTES :
 * 1. Ne lit jamais l'écran ni le DOM : prend en entrée exclusivement la dernière ligne immuable de `matchLog`.
 * 2. Condition stricte : if (logEntry.player !== localConnectedPlayer) return null;
 * 3. 0 mock, 0 moteur local ply 2 : vérifie le Livre d'Ouvertures ou le cache bgsage 3-ply.
 *    L'analyse complète hors-cache est assurée de manière asynchrone par `analyzeHumanMoveFromLogWithBgsage`.
 */

import type { Player, BoardState } from '../../engine/backgammonEngine';
import { serializeCanonicalXGID, generateLegalMoves } from '../../engine/backgammonEngine';
import type { MatchLogEntry } from '../../actions/types';
import { type CoachVerdict, classifyVerdict } from './logAnalyzer';
import { detectOpeningScoreRegime, getOpeningForScore, isInitialBoardPosition } from '../openings/openingDatabase';
import { formatCoachMoveSequence, movesFromBoardDiff, parseCoachNotationMoves } from './coachMoveNotation';
import { resolvePlayedMoves, resolveEffectiveBoardAfter, notationsAreEquivalent, buildHumanMoveAnalysisFromBgsageResult } from './logAnalyzerBgsageBuilder';
import { bgsageCacheKey, getCachedBgsageEvaluation } from '../../lib/engine/bgsageCache';
import { boardsMatchOnPointsAndBar } from '../../lib/engine/bgsageClient';

export interface HumanLogAnalysisResult {
    readonly turnIndex: number;
    readonly player: Player;
    readonly verdict: CoachVerdict;
    readonly equityLoss: number;
    readonly playedNotation: string;
    readonly optimalNotation: string;
    readonly isUnforced: boolean;
    readonly isBlunder: boolean;
    readonly candidateMoves: ReadonlyArray<{
        readonly notation: string;
        readonly equityLoss: number;
    }>;
}

export interface AnalyzeHumanLogParams {
    readonly logEntry: MatchLogEntry;
    readonly localConnectedPlayer?: Player;
    readonly cubeValue?: number;
    readonly matchLength?: number;
    readonly scoreX?: number;
    readonly scoreO?: number;
    readonly ply?: number;
}

export function analyzeHumanLogAction(
    params: AnalyzeHumanLogParams,
): HumanLogAnalysisResult | null {
    const { logEntry, localConnectedPlayer = 'X' } = params;
    if (logEntry.player !== localConnectedPlayer) {
        return null;
    }

    const dice: [number, number] = [logEntry.dice[0], logEntry.dice[1]];
    const boardBefore = [...logEntry.boardBefore];
    const effectiveBoardAfter = resolveEffectiveBoardAfter(logEntry);

    const isOpening = isInitialBoardPosition(boardBefore) && dice[0] !== dice[1] && logEntry.player === 'X';
    if (isOpening) {
        const regime = detectOpeningScoreRegime({
            matchLength: params.matchLength, scoreX: params.scoreX, scoreO: params.scoreO,
            player: logEntry.player, cubeValue: params.cubeValue,
        });
        const opening = getOpeningForScore(dice[0], dice[1], regime);
        if (opening) {
            const playedMoves = resolvePlayedMoves(logEntry);
            const playedNotation = formatCoachMoveSequence([...playedMoves], logEntry.player, boardBefore);
            const canonicalMoves = movesFromBoardDiff(boardBefore, effectiveBoardAfter, logEntry.player);
            const canonicalNotation = formatCoachMoveSequence(canonicalMoves, logEntry.player, boardBefore);

            const isOptimal = notationsAreEquivalent(playedNotation, opening.bestMoveNotation, logEntry.player, dice) ||
                notationsAreEquivalent(canonicalNotation, opening.bestMoveNotation, logEntry.player, dice);

            if (isOptimal) {
                return {
                    turnIndex: logEntry.turnIndex, player: logEntry.player, verdict: 'optimal', equityLoss: 0,
                    playedNotation, optimalNotation: opening.bestMoveNotation, isUnforced: true, isBlunder: false,
                    candidateMoves: [{ notation: opening.bestMoveNotation, equityLoss: 0 }],
                };
            }

            const matchedAlt = opening.alternatives.find((alt) =>
                notationsAreEquivalent(alt.notation, playedNotation, logEntry.player, dice) ||
                notationsAreEquivalent(alt.notation, canonicalNotation, logEntry.player, dice),
            );
            if (matchedAlt) {
                const loss = Math.abs(matchedAlt.equityLoss);
                const verdict = classifyVerdict(loss);
                return {
                    turnIndex: logEntry.turnIndex, player: logEntry.player, verdict, equityLoss: loss,
                    playedNotation, optimalNotation: opening.bestMoveNotation, isUnforced: true,
                    isBlunder: verdict === 'blunder',
                    candidateMoves: [
                        { notation: opening.bestMoveNotation, equityLoss: 0 },
                        { notation: matchedAlt.notation, equityLoss: loss },
                    ],
                };
            }
        }
    }

    const evalState: BoardState = {
        board: boardBefore, turn: logEntry.player, dice, cubeValue: params.cubeValue ?? 1,
        cubeOwner: null, matchLength: params.matchLength ?? 7, scoreX: params.scoreX ?? 0, scoreO: params.scoreO ?? 0,
        crawford: false, doubled: false, resigned: 0,
    };
    const xgid = serializeCanonicalXGID(evalState);
    const cached = getCachedBgsageEvaluation(bgsageCacheKey(xgid, 3)) ??
                   getCachedBgsageEvaluation(bgsageCacheKey(xgid, 2)) ??
                   getCachedBgsageEvaluation(bgsageCacheKey(xgid, 1));
    if (cached && cached.chequerPlay.length > 0 && cached.source !== 'typescript-tri-phase' && cached.source !== 'local') {
        const legalSeqs = generateLegalMoves(evalState, dice);
        const built = buildHumanMoveAnalysisFromBgsageResult({
            bgsageResult: cached, logEntry, evalState, legalSeqs, boardBefore, effectiveBoardAfter, targetPly: 3,
        });
        if (built) {
            return {
                turnIndex: built.turnIndex, player: built.player, verdict: built.verdict, equityLoss: built.equityLoss,
                playedNotation: built.playedNotation, optimalNotation: built.optimalNotation, isUnforced: built.isUnforced,
                isBlunder: built.isBlunder, candidateMoves: built.candidateMoves.map((c) => ({ notation: c.notation, equityLoss: c.equityLoss })),
            };
        }
    }

    return null;
}
