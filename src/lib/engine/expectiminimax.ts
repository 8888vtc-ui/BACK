/**
 * Expectiminimax 2-Ply pour le moteur de secours local du Backgammon.
 *
 * Évalue la valeur espérée d'une position après la réponse adverse optimale
 * calculée sur les 21 tirages de dés possibles pondérés par leur probabilité exacte (1/36 ou 2/36).
 *
 * Respecte un budget de temps strict (< 120 ms) pour ne jamais bloquer l'UI ni l'API.
 */

import {
    generateLegalMoves,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import type { Probabilities } from './types';

export interface DiceRollOutcome {
    dice: [number, number];
    /** Poids de probabilité sur 36 (1 pour les 6 doubles, 2 pour les 15 non-doubles). */
    weight: number;
}

/**
 * Les 21 tirages de dés distincts au backgammon et leurs probabilités exactes sur 36.
 * 6 doubles de poids 1/36 + 15 non-doubles de poids 2/36 = 36/36.
 */
export const DISTINCT_DICE_ROLLS_21: ReadonlyArray<DiceRollOutcome> = [
    // 6 doubles (1/36 chacun)
    { dice: [1, 1], weight: 1 },
    { dice: [2, 2], weight: 1 },
    { dice: [3, 3], weight: 1 },
    { dice: [4, 4], weight: 1 },
    { dice: [5, 5], weight: 1 },
    { dice: [6, 6], weight: 1 },
    // 15 combinaisons non-doubles (2/36 chacune)
    { dice: [2, 1], weight: 2 },
    { dice: [3, 1], weight: 2 },
    { dice: [3, 2], weight: 2 },
    { dice: [4, 1], weight: 2 },
    { dice: [4, 2], weight: 2 },
    { dice: [4, 3], weight: 2 },
    { dice: [5, 1], weight: 2 },
    { dice: [5, 2], weight: 2 },
    { dice: [5, 3], weight: 2 },
    { dice: [5, 4], weight: 2 },
    { dice: [6, 1], weight: 2 },
    { dice: [6, 2], weight: 2 },
    { dice: [6, 3], weight: 2 },
    { dice: [6, 4], weight: 2 },
    { dice: [6, 5], weight: 2 },
];

export interface ScoredCandidate {
    seq: MoveSequence;
    equity: number;
    probabilities: Probabilities;
    notation: string;
}

export type StaticEvaluatorFn = (state: BoardState) => {
    cubefulEquity: number;
    probabilities: Probabilities;
};

/**
 * Calcule l'évaluation 2-ply expectiminimax d'une position résultante après le coup du joueur
 * (où le tour passe à l'adversaire).
 */
export function evaluatePositionExpectiminimax2Ply(
    resultingState: BoardState,
    staticEvaluator: StaticEvaluatorFn,
): { equity: number; probabilities: Probabilities } {
    const oppPlayer = resultingState.turn;
    const initialPlayer: Player = oppPlayer === 'X' ? 'O' : 'X';

    let totalWeightedEquity = 0;
    let totalWeightedWin = 0;
    let totalWeightedWinGammon = 0;
    let totalWeightedWinBackgammon = 0;
    let totalWeightedLoseWin = 0;
    let totalWeightedLoseGammon = 0;
    let totalWeightedLoseBackgammon = 0;

    for (const roll of DISTINCT_DICE_ROLLS_21) {
        const oppLegalMoves = generateLegalMoves(resultingState, roll.dice);

        if (oppLegalMoves.length === 0) {
            // Adversaire bloqué : son tour passe, la position reste inchangée
            const stateAfterPass: BoardState = {
                ...resultingState,
                turn: initialPlayer,
                dice: null,
            };
            const evalForPlayer = staticEvaluator(stateAfterPass);
            const w = roll.weight;
            totalWeightedEquity += evalForPlayer.cubefulEquity * w;
            totalWeightedWin += evalForPlayer.probabilities.win * w;
            totalWeightedWinGammon += evalForPlayer.probabilities.winGammon * w;
            totalWeightedWinBackgammon += evalForPlayer.probabilities.winBackgammon * w;
            totalWeightedLoseWin += evalForPlayer.probabilities.loseWin * w;
            totalWeightedLoseGammon += evalForPlayer.probabilities.loseGammon * w;
            totalWeightedLoseBackgammon += evalForPlayer.probabilities.loseBackgammon * w;
            continue;
        }

        // L'adversaire choisit le coup qui maximise son équité (cubefulEquity du point de vue de l'adversaire)
        let bestOppEquity = -Infinity;
        let bestOppProbs = oppLegalMoves[0]
            ? staticEvaluator({ ...resultingState, board: oppLegalMoves[0].board, turn: initialPlayer, dice: null }).probabilities
            : { win: 0.5, winGammon: 0.1, winBackgammon: 0.01, loseWin: 0.5, loseGammon: 0.1, loseBackgammon: 0.01 };

        for (const oppSeq of oppLegalMoves) {
            const stateAfterOppMove: BoardState = {
                ...resultingState,
                board: oppSeq.board,
                turn: oppPlayer, // perspective adverse
                dice: null,
            };
            const oppStaticEval = staticEvaluator(stateAfterOppMove);
            if (oppStaticEval.cubefulEquity > bestOppEquity) {
                bestOppEquity = oppStaticEval.cubefulEquity;
                bestOppProbs = oppStaticEval.probabilities;
            }
        }

        // Du point de vue du joueur initial :
        // L'équité est l'opposée de la meilleure équité adverse
        const playerEquityOnRoll = -bestOppEquity;
        const w = roll.weight;

        totalWeightedEquity += playerEquityOnRoll * w;
        // Inversion des probabilités : la victoire de B est la défaite de A
        totalWeightedWin += bestOppProbs.loseWin * w;
        totalWeightedWinGammon += bestOppProbs.loseGammon * w;
        totalWeightedWinBackgammon += bestOppProbs.loseBackgammon * w;
        totalWeightedLoseWin += bestOppProbs.win * w;
        totalWeightedLoseGammon += bestOppProbs.winGammon * w;
        totalWeightedLoseBackgammon += bestOppProbs.winBackgammon * w;
    }

    const expectedEquity = Number((totalWeightedEquity / 36).toFixed(4));
    const expectedProbs: Probabilities = {
        win: Number((totalWeightedWin / 36).toFixed(4)),
        winGammon: Number((totalWeightedWinGammon / 36).toFixed(4)),
        winBackgammon: Number((totalWeightedWinBackgammon / 36).toFixed(4)),
        loseWin: Number((totalWeightedLoseWin / 36).toFixed(4)),
        loseGammon: Number((totalWeightedLoseGammon / 36).toFixed(4)),
        loseBackgammon: Number((totalWeightedLoseBackgammon / 36).toFixed(4)),
    };

    return {
        equity: expectedEquity,
        probabilities: expectedProbs,
    };
}

/**
 * Affine les Top-candidats via un expectiminimax 2-ply avec budget de temps borné (< 120 ms).
 *
 * @param state État initial du tour avec les dés joués
 * @param scoredCandidates Candidats pré-évalués et triés en 0-ply
 * @param staticEvaluator Fonction d'évaluation 0-ply
 * @param options Options d'approfondissement (maxCandidates: 6, timeBudgetMs: 100)
 */
export function refineTopCandidatesExpectiminimax2Ply(
    state: BoardState,
    scoredCandidates: ScoredCandidate[],
    staticEvaluator: StaticEvaluatorFn,
    options: { maxCandidates?: number; timeBudgetMs?: number } = {},
): ScoredCandidate[] {
    const maxCandidates = options.maxCandidates ?? 6;
    const timeBudgetMs = options.timeBudgetMs ?? 100;

    if (scoredCandidates.length <= 1) {
        return scoredCandidates;
    }

    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const opponent: Player = state.turn === 'X' ? 'O' : 'X';
    const topCount = Math.min(maxCandidates, scoredCandidates.length);

    const refined = [...scoredCandidates];

    for (let i = 0; i < topCount; i++) {
        const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
        if (elapsed > timeBudgetMs) {
            // Budget temps dépassé : interruption propre sans altérer les scores restants
            break;
        }

        const cand = refined[i];
        const resultingState: BoardState = {
            ...state,
            board: cand.seq.board,
            turn: opponent,
            dice: null,
        };

        const result2Ply = evaluatePositionExpectiminimax2Ply(resultingState, staticEvaluator);
        refined[i] = {
            ...cand,
            equity: result2Ply.equity,
            probabilities: result2Ply.probabilities,
        };
    }

    // Re-tri des candidats avec leurs scores affinés en 2-ply
    refined.sort((a, b) => b.equity - a.equity);
    return refined;
}
