/**
 * @file src/lib/engine/btErhEngine.ts
 * @description Moteur BackgammonTour « BT-ERH v2.0 » (Exploitation de la Réponse Humaine).
 *
 * Se branche au-dessus de « BT-Core v2.0 » (GTO pur) :
 * 1. Mode GTO Pur (opponentPr <= 1.5) : délégation directe 100 % BT-Core (zéro perte vs machine).
 * 2. Mode Humain (opponentPr > 1.5) : modélisation cognitive stochastique sur les 21 tirages
 *    via computeHumanIntuitionScore H_opp(a) et distribution Softmax de température tau.
 * 3. Évaluation multi-facettes : gtoEquity, erhEquity, inducedBlunderRate, trapComplexityBonus.
 * 4. Garde-fou strict Zéro-Suicide GTO (maxGtoSacrificeEmg = 0.015) : interdit tout sacrifice > 15 mEMG.
 *
 * Strictement 0 any, pur, <= 380 lignes (conforme GOVERNANCE.md & SCALABILITY.md).
 */

import {
    generateLegalMoves,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import type { AIDifficulty } from '../../engine/aiHeuristics';
import {
    computeHumanIntuitionScore,
    type NeuralFiveOutputs,
} from '../../engine/humanBotController';
import {
    analyzeBtCoreMoves,
    evaluateBtCoreBoard,
} from './btCoreEngine';
import {
    DISTINCT_DICE_ROLLS_21,
    type StaticEvaluatorFn,
} from './expectiminimax';
import { computeShotExposure } from './shotExposure';
import { isPureRace } from './evaluator';
import type {
    BestMoveResult,
    MoveAnalysis,
    Probabilities,
} from './types';

export interface BtErhOptions {
    /** Performance Rating estimé de l'adversaire (<= 1.5 = GTO pur, > 1.5 = Humain). Défaut: 1.5 */
    readonly opponentPr?: number;
    /** Difficulté optionnelle utilisée si opponentPr est omis. */
    readonly difficulty?: AIDifficulty;
    /** Profondeur de recherche BT-Core (défaut: 2). */
    readonly ply?: number;
    /** Nombre maximal de coups à retourner (défaut: 6). */
    readonly maxMoves?: number;
    /** Budget temps en ms (défaut: 120 ms). */
    readonly timeBudgetMs?: number;
    /** Séquences candidates pré-générées (optionnel). */
    readonly candidateMoves?: MoveSequence[];
    /** Plafond strict de sacrifice GTO (défaut: 0.015 EMG = 15 mEMG). */
    readonly maxGtoSacrificeEmg?: number;
    /** Poids du bonus de complexité dans l'équité composite (défaut: 0.25). */
    readonly complexityWeight?: number;
    /** Température Softmax manuelle (optionnelle, calculée par défaut depuis opponentPr). */
    readonly temperature?: number;
}

export interface TrapComplexityDetails {
    readonly bonus: number;
    readonly indirectHitsCount: number;
    readonly oppPrimeLength: number;
    readonly isHitVsPrimeAmbiguous: boolean;
    readonly duplicatedRollsCount: number;
    readonly summary: string;
}

export interface BtErhMoveAnalysis extends MoveAnalysis {
    /** Équité GTO exacte issue de BT-Core v2.0 (2-ply / 3-ply) */
    readonly gtoEquity: number;
    /** Espérance d'équité face à la réponse humaine modélisée */
    readonly erhEquity: number;
    /** Perte d'équité moyenne induite chez l'adversaire (erhEquity - gtoEquity) */
    readonly inducedBlunderRate: number;
    /** Bonus de complexité tactique laissé à l'adversaire (tirs indirects, prime vs hit) */
    readonly trapComplexityBonus: number;
    /** Détails géométriques du piège tactique */
    readonly trapComplexityDetails: TrapComplexityDetails;
    /** Équité composite ERH = erhEquity + complexityWeight * trapComplexityBonus */
    readonly erhCompositeEquity: number;
    /** Indique si ce coup est un piège tactique recommandé préféré au coup GTO #1 */
    readonly isTrap: boolean;
    /** Rationale explicative du piège ou du coup */
    readonly trapRationale?: string;
}

export interface AnalyzeBtErhMovesResult {
    readonly xgid: string;
    readonly moves: BtErhMoveAnalysis[];
    readonly bestMove: BtErhMoveAnalysis | null;
    readonly isGtoMode: boolean;
    readonly opponentPr: number;
    readonly isWasm: boolean;
}

export interface Erh2PlyEvaluationResult {
    readonly erhEquity: number;
    readonly gtoEquity: number;
    readonly inducedBlunderRate: number;
    readonly probabilities: Probabilities;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

export function prToDifficulty(opponentPr: number): AIDifficulty {
    if (opponentPr <= 1.5) return 'grandmaster';
    if (opponentPr <= 2.5) return 'expert';
    if (opponentPr <= 5.5) return 'intermediate';
    return 'beginner';
}

export function computeSoftmaxTemperature(opponentPr: number): number {
    return clamp(opponentPr / 10, 0.02, 0.25);
}

/**
 * Calcule le bonus de complexité tactique du plateau laissé à l'adversaire.
 */
export function computeTrapComplexityBonus(
    board: ReadonlyArray<number>,
    player: Player,
): TrapComplexityDetails {
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const exposure = computeShotExposure(board as number[], player);
    const indirectHitsCount = exposure.indirectRolls;
    const duplicatedRollsCount = exposure.duplicatedNumbers.length;

    let oppPrimeLength = 0;
    let currentStreak = 0;
    for (let p = 1; p <= 24; p++) {
        const v = board[p] ?? 0;
        const isOppPoint = opponent === 'X' ? v >= 2 : v <= -2;
        if (isOppPoint) {
            currentStreak++;
            if (currentStreak > oppPrimeLength) oppPrimeLength = currentStreak;
        } else {
            currentStreak = 0;
        }
    }

    const isHitVsPrimeAmbiguous = oppPrimeLength >= 3 && exposure.totalRolls > 0;
    const indirectBonus = Math.min(0.015, indirectHitsCount * 0.0015);
    const primeDilemmaBonus = isHitVsPrimeAmbiguous
        ? 0.010 + Math.min(0.010, (oppPrimeLength - 3) * 0.005)
        : 0;
    const duplicationBonus = Math.min(0.008, duplicatedRollsCount * 0.004);
    const bonus = Number(Math.min(0.035, indirectBonus + primeDilemmaBonus + duplicationBonus).toFixed(4));

    const parts: string[] = [];
    if (indirectHitsCount > 0) parts.push(`${indirectHitsCount} tirs indirects`);
    if (isHitVsPrimeAmbiguous) parts.push(`Dilemme Frappe vs Prime-${oppPrimeLength}`);
    if (duplicatedRollsCount > 0) parts.push(`${duplicatedRollsCount} dés dupliqués`);
    const summary = parts.length > 0 ? parts.join(' | ') : 'Position fluide sans piège';

    return {
        bonus,
        indirectHitsCount,
        oppPrimeLength,
        isHitVsPrimeAmbiguous,
        duplicatedRollsCount,
        summary,
    };
}

/**
 * Évalue en 2-ply l'espérance d'équité face à la réponse humaine modélisée sur les 21 tirages.
 */
export function evaluatePositionErh2Ply(
    resultingState: BoardState,
    opponentPr: number,
    staticEvaluator: StaticEvaluatorFn = (st) => evaluateBtCoreBoard(st),
    customTau?: number,
): Erh2PlyEvaluationResult {
    const oppPlayer = resultingState.turn;
    const initialPlayer: Player = oppPlayer === 'X' ? 'O' : 'X';
    const difficulty = prToDifficulty(opponentPr);
    const tau = customTau ?? computeSoftmaxTemperature(opponentPr);

    let totalWeightedErhEquity = 0;
    let totalWeightedGtoEquity = 0;
    let totalWeightedWin = 0;
    let totalWeightedWinGammon = 0;
    let totalWeightedWinBackgammon = 0;
    let totalWeightedLoseWin = 0;
    let totalWeightedLoseGammon = 0;
    let totalWeightedLoseBackgammon = 0;

    for (const roll of DISTINCT_DICE_ROLLS_21) {
        const oppLegalMoves = generateLegalMoves(resultingState, roll.dice);
        const w = roll.weight;

        if (oppLegalMoves.length === 0) {
            const passEval = staticEvaluator({
                ...resultingState,
                turn: initialPlayer,
                dice: null,
            });
            const eq = passEval.cubefulEquity;
            totalWeightedErhEquity += eq * w;
            totalWeightedGtoEquity += eq * w;
            totalWeightedWin += passEval.probabilities.win * w;
            totalWeightedWinGammon += passEval.probabilities.winGammon * w;
            totalWeightedWinBackgammon += passEval.probabilities.winBackgammon * w;
            totalWeightedLoseWin += passEval.probabilities.loseWin * w;
            totalWeightedLoseGammon += passEval.probabilities.loseGammon * w;
            totalWeightedLoseBackgammon += passEval.probabilities.loseBackgammon * w;
            continue;
        }

        if (oppLegalMoves.length === 1) {
            const oppEval = staticEvaluator({
                ...resultingState,
                board: oppLegalMoves[0].board,
                turn: oppPlayer,
                dice: null,
            });
            const playerEq = -oppEval.cubefulEquity;
            totalWeightedErhEquity += playerEq * w;
            totalWeightedGtoEquity += playerEq * w;
            totalWeightedWin += oppEval.probabilities.loseWin * w;
            totalWeightedWinGammon += oppEval.probabilities.loseGammon * w;
            totalWeightedWinBackgammon += oppEval.probabilities.loseBackgammon * w;
            totalWeightedLoseWin += oppEval.probabilities.win * w;
            totalWeightedLoseGammon += oppEval.probabilities.winGammon * w;
            totalWeightedLoseBackgammon += oppEval.probabilities.winBackgammon * w;
            continue;
        }

        const scored = oppLegalMoves.map((oppSeq) => {
            const oppEval = staticEvaluator({
                ...resultingState,
                board: oppSeq.board,
                turn: oppPlayer,
                dice: null,
            });
            const neuralOutputs: NeuralFiveOutputs = {
                pWin: oppEval.probabilities.win,
                pWinGammon: oppEval.probabilities.winGammon,
                pWinBg: oppEval.probabilities.winBackgammon,
                pLoseGammon: oppEval.probabilities.loseGammon,
                pLoseBg: oppEval.probabilities.loseBackgammon,
            };
            const humanScore = computeHumanIntuitionScore({
                boardBefore: resultingState.board,
                boardAfter: oppSeq.board,
                trueEquity: oppEval.cubefulEquity,
                difficulty,
                player: oppPlayer,
                neuralOutputs,
            });
            return {
                seq: oppSeq,
                trueEquity: oppEval.cubefulEquity,
                humanScore,
                probs: oppEval.probabilities,
            };
        });

        const bestOppGtoEquity = Math.max(...scored.map((s) => s.trueEquity));
        totalWeightedGtoEquity += -bestOppGtoEquity * w;

        const maxH = Math.max(...scored.map((s) => s.humanScore));
        const expWeights = scored.map((s) => Math.exp((s.humanScore - maxH) / tau));
        const sumExp = expWeights.reduce((acc, v) => acc + v, 0);

        let rollErhEq = 0;
        let rollWin = 0;
        let rollWinG = 0;
        let rollWinBg = 0;
        let rollLoseWin = 0;
        let rollLoseG = 0;
        let rollLoseBg = 0;

        for (let j = 0; j < scored.length; j++) {
            const cand = scored[j];
            const p = sumExp > 0 ? expWeights[j] / sumExp : 1 / scored.length;
            rollErhEq += p * -cand.trueEquity;
            rollWin += p * cand.probs.loseWin;
            rollWinG += p * cand.probs.loseGammon;
            rollWinBg += p * cand.probs.loseBackgammon;
            rollLoseWin += p * cand.probs.win;
            rollLoseG += p * cand.probs.winGammon;
            rollLoseBg += p * cand.probs.winBackgammon;
        }

        totalWeightedErhEquity += rollErhEq * w;
        totalWeightedWin += rollWin * w;
        totalWeightedWinGammon += rollWinG * w;
        totalWeightedWinBackgammon += rollWinBg * w;
        totalWeightedLoseWin += rollLoseWin * w;
        totalWeightedLoseGammon += rollLoseG * w;
        totalWeightedLoseBackgammon += rollLoseBg * w;
    }

    const erhEquity = Number((totalWeightedErhEquity / 36).toFixed(4));
    const gtoEquity = Number((totalWeightedGtoEquity / 36).toFixed(4));
    const inducedBlunderRate = Number(Math.max(0, erhEquity - gtoEquity).toFixed(4));

    return {
        erhEquity,
        gtoEquity,
        inducedBlunderRate,
        probabilities: {
            win: Number((totalWeightedWin / 36).toFixed(4)),
            winGammon: Number((totalWeightedWinGammon / 36).toFixed(4)),
            winBackgammon: Number((totalWeightedWinBackgammon / 36).toFixed(4)),
            loseWin: Number((totalWeightedLoseWin / 36).toFixed(4)),
            loseGammon: Number((totalWeightedLoseGammon / 36).toFixed(4)),
            loseBackgammon: Number((totalWeightedLoseBackgammon / 36).toFixed(4)),
        },
    };
}

/**
 * Analyse et classe les coups avec le moteur hybride « BT-ERH v2.0 ».
 */
export function analyzeBtErhMoves(
    state: BoardState,
    dice: [number, number],
    options: BtErhOptions = {},
): AnalyzeBtErhMovesResult {
    const rawOpponentPr =
        options.opponentPr ??
        (options.difficulty
            ? options.difficulty === 'grandmaster'
                ? 0.4
                : options.difficulty === 'expert'
                  ? 1.5
                  : options.difficulty === 'intermediate'
                    ? 4.0
                    : 7.5
            : 1.5);
    const opponentPr = Math.max(0, rawOpponentPr);
    const isGtoMode = opponentPr <= 1.5;
    const maxMoves = options.maxMoves ?? 6;
    const maxGtoSacrifice = options.maxGtoSacrificeEmg ?? 0.015;
    const complexityWeight = options.complexityWeight ?? 0.25;

    const coreResult = analyzeBtCoreMoves(state, dice, {
        candidateMoves: options.candidateMoves,
        ply: options.ply ?? 2,
        maxMoves: Math.max(6, maxMoves),
        timeBudgetMs: options.timeBudgetMs ?? 120,
    });

    if (coreResult.moves.length === 0) {
        return {
            xgid: coreResult.xgid,
            moves: [],
            bestMove: null,
            isGtoMode,
            opponentPr,
            isWasm: coreResult.isWasm ?? false,
        };
    }

    const player = state.turn;
    const pureRace = isPureRace(state.board);

    if (isGtoMode || pureRace || coreResult.moves.length === 1) {
        const gtoMoves: BtErhMoveAnalysis[] = coreResult.moves.slice(0, maxMoves).map((m) => {
            const complexity = computeTrapComplexityBonus(m.board ?? state.board, player);
            return {
                ...m,
                gtoEquity: m.equity,
                erhEquity: m.equity,
                inducedBlunderRate: 0,
                trapComplexityBonus: 0,
                trapComplexityDetails: complexity,
                erhCompositeEquity: m.equity,
                isTrap: false,
                trapRationale: pureRace
                    ? 'Course sans contact (GTO optimal)'
                    : 'Optimal GTO (Machine PR <= 1.5)',
            };
        });
        return {
            xgid: coreResult.xgid,
            moves: gtoMoves,
            bestMove: gtoMoves[0] ?? null,
            isGtoMode: true,
            opponentPr,
            isWasm: coreResult.isWasm ?? false,
        };
    }

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const budgetMs = options.timeBudgetMs ?? 120;
    const opponent: Player = player === 'X' ? 'O' : 'X';
    const topCandidates = coreResult.moves.slice(0, Math.min(6, coreResult.moves.length));
    const m1GtoEquity = topCandidates[0].equity;

    const evaluatedMoves: BtErhMoveAnalysis[] = [];

    for (let i = 0; i < topCandidates.length; i++) {
        const cand = topCandidates[i];
        const candBoard = cand.board ?? state.board;
        const gtoSacrifice = Number((m1GtoEquity - cand.equity).toFixed(4));
        const complexity = computeTrapComplexityBonus(candBoard, player);

        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
        let erhEquity = cand.equity;
        let inducedBlunderRate = 0;

        if (elapsed <= budgetMs * 0.85 || i <= 1 || gtoSacrifice <= maxGtoSacrifice) {
            const erhResult = evaluatePositionErh2Ply(
                { ...state, board: candBoard, turn: opponent, dice: null },
                opponentPr,
                (st) => evaluateBtCoreBoard(st),
                options.temperature,
            );
            erhEquity = erhResult.erhEquity;
            inducedBlunderRate = Number(Math.max(0, erhEquity - cand.equity).toFixed(4));
        }

        const erhCompositeEquity = Number(
            (erhEquity + complexityWeight * complexity.bonus).toFixed(4),
        );

        evaluatedMoves.push({
            ...cand,
            gtoEquity: cand.equity,
            erhEquity,
            inducedBlunderRate,
            trapComplexityBonus: complexity.bonus,
            trapComplexityDetails: complexity,
            erhCompositeEquity,
            isTrap: false,
        });
    }

    const m1 = evaluatedMoves[0];
    let bestTrapCandidate: BtErhMoveAnalysis | null = null;
    let highestTrapComposite = m1.erhCompositeEquity;

    for (let i = 1; i < evaluatedMoves.length; i++) {
        const cand = evaluatedMoves[i];
        const sacrifice = Number((m1GtoEquity - cand.gtoEquity).toFixed(4));
        if (sacrifice <= maxGtoSacrifice && cand.erhCompositeEquity > highestTrapComposite) {
            bestTrapCandidate = cand;
            highestTrapComposite = cand.erhCompositeEquity;
        }
    }

    let finalOrderedMoves: BtErhMoveAnalysis[];
    if (bestTrapCandidate !== null) {
        const trapMove: BtErhMoveAnalysis = {
            ...bestTrapCandidate,
            isTrap: true,
            trapRationale: `Piège Tactique : sacrifice GTO de ${(m1GtoEquity - bestTrapCandidate.gtoEquity).toFixed(3)} EMG pour +${(bestTrapCandidate.erhEquity - bestTrapCandidate.gtoEquity).toFixed(3)} EMG exploitant PR ${opponentPr.toFixed(1)} (${bestTrapCandidate.trapComplexityDetails.summary})`,
        };
        const otherMoves = evaluatedMoves.filter((m) => m.notation !== trapMove.notation);
        finalOrderedMoves = [trapMove, ...otherMoves];
    } else {
        finalOrderedMoves = [...evaluatedMoves];
    }

    const chosenEquity = finalOrderedMoves[0].erhCompositeEquity;
    const outputMoves = finalOrderedMoves.slice(0, maxMoves).map((item, idx) => ({
        ...item,
        rank: idx + 1,
        equity: item.erhCompositeEquity,
        equityLoss: Number((item.erhCompositeEquity - chosenEquity).toFixed(4)),
    }));

    return {
        xgid: coreResult.xgid,
        moves: outputMoves,
        bestMove: outputMoves[0] ?? null,
        isGtoMode: false,
        opponentPr,
        isWasm: coreResult.isWasm ?? false,
    };
}

/**
 * Détermine le meilleur coup exploitatif avec « BT-ERH v2.0 ».
 */
export function findBestBtErhMove(
    state: BoardState,
    dice: [number, number],
    options: BtErhOptions = {},
): BestMoveResult | null {
    const result = analyzeBtErhMoves(state, dice, { ...options, maxMoves: 1 });
    if (!result.bestMove || !result.bestMove.moves || !result.bestMove.board) {
        return null;
    }
    return {
        xgid: result.xgid,
        notation: result.bestMove.notation,
        sequence: {
            moves: result.bestMove.moves,
            board: result.bestMove.board,
        },
        equity: result.bestMove.equity,
        rank: 1,
        isWasm: result.isWasm,
    };
}

