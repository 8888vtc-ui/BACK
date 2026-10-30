/**
 * @file src/engine/humanBotController.ts
 * @description Contrôleur déterministe de Bots Humains (« Premier Principe / Zéro Usine à Gaz »).
 *
 * Implémente les 4 règles d'ingénierie cognitive sans bruit aléatoire (zéro Math.random) :
 *   1. Garde-Fou d'Absurdité (Plafond strict de perte Δmax : 0.035 Expert, 0.075 Intermédiaire, 0.115 Débutant/Club).
 *   2. Score d'Intuition Humaine H(a) combinant les 5 sorties neuronales biaisées (α_G, β_G)
 *      et les 4 compteurs géométriques (N_blots doublé sous tir direct 1..6, I_hit, N_stack > 4, N_deep cases 1-2).
 *   3. Asserviteur Déterministe de PR (Sélection par Budget d'Erreur Δ_voulu = clamp(k*(PR/500) - Total_EMG_Lost, 0, Δmax)).
 *   4. Heuristiques Humaines sur le Videau (Doubling Too Late / Dead-Cube Drop vs Doubling on a Rush / Pride Take).
 *
 * Couche Règles Pures (src/engine/) : 0 any, 0 React, 0 Math.random, ≤ 300 lignes.
 */

import type { Player, MoveSequence } from './backgammonEngine';
import type { AIDifficulty } from './aiHeuristics';

export type HumanCubeStyle = 'optimal' | 'prudent' | 'aggressive';

export interface HumanBotCalibrationSpec {
    readonly difficulty: AIDifficulty;
    readonly targetPr: number;
    readonly targetEmgPerDecision: number;
    readonly deltaMaxEmg: number;
    readonly wBlot: number;
    readonly wHit: number;
    readonly wStack: number;
    readonly wDeep: number;
    readonly alphaG: number;
    readonly betaG: number;
    readonly cubeStyle: HumanCubeStyle;
}

export interface NeuralFiveOutputs {
    readonly pWin: number;
    readonly pWinGammon: number;
    readonly pWinBg: number;
    readonly pLoseGammon: number;
    readonly pLoseBg: number;
}

export interface BotPrErrorBudgetState {
    readonly totalEmgLost: number;
    readonly unforcedDecisions: number;
}

export interface CandidateMoveEvaluation {
    readonly id: string;
    readonly sequence: MoveSequence;
    readonly trueEquity: number;
    readonly neuralOutputs?: NeuralFiveOutputs;
}

export interface HumanCalibratedSelectionResult {
    readonly selected: CandidateMoveEvaluation;
    readonly bestMove: CandidateMoveEvaluation;
    readonly equityLossEmg: number;
    readonly humanScore: number;
    readonly targetDeficitEmg: number;
    readonly isUnforcedDecision: boolean;
    readonly updatedBudget: BotPrErrorBudgetState;
}

export const HUMAN_BOT_CALIBRATION_SPECS: Record<AIDifficulty, HumanBotCalibrationSpec> = {
    grandmaster: {
        difficulty: 'grandmaster',
        targetPr: 0.4,
        targetEmgPerDecision: 0.4 / 500,
        deltaMaxEmg: 0.0,
        wBlot: 0.0,
        wHit: 0.0,
        wStack: 0.0,
        wDeep: 0.0,
        alphaG: 1.0,
        betaG: 1.0,
        cubeStyle: 'optimal',
    },
    expert: {
        difficulty: 'expert',
        targetPr: 1.5, // PR 1.0 - 2.0 (2.0 à 4.0 mEMG / décision)
        targetEmgPerDecision: 1.5 / 500,
        deltaMaxEmg: 0.035,
        wBlot: 0.005,
        wHit: 0.0,
        wStack: 0.005,
        wDeep: 0.0,
        alphaG: 1.0,
        betaG: 1.0,
        cubeStyle: 'optimal',
    },
    intermediate: {
        difficulty: 'intermediate',
        targetPr: 4.0, // PR 3.0 - 5.0 (6.0 à 10.0 mEMG / décision)
        targetEmgPerDecision: 4.0 / 500,
        deltaMaxEmg: 0.075,
        wBlot: 0.020,
        wHit: 0.015,
        wStack: 0.015,
        wDeep: 0.010,
        alphaG: 0.8,
        betaG: 1.2,
        cubeStyle: 'prudent',
    },
    beginner: {
        difficulty: 'beginner',
        targetPr: 7.5, // PR 6.0 - 9.0 (12.0 à 18.0 mEMG / décision)
        targetEmgPerDecision: 7.5 / 500,
        deltaMaxEmg: 0.115,
        wBlot: 0.045,
        wHit: 0.040,
        wStack: 0.030,
        wDeep: 0.030,
        alphaG: 1.5,
        betaG: 0.6,
        cubeStyle: 'aggressive',
    },
};

/**
 * Calcule les 4 compteurs géométriques humains sur l'état résultant `boardAfter` :
 * - `nBlots` : nombre de pions isolés du bot (comptés x2 s'ils sont à portée de tir direct 1..6 d'un pion adverse).
 * - `hitIndicator` : 1 si le coup a frappé au moins un pion adverse, 0 sinon.
 * - `nStack` : dames empilées au-delà de 4 sur une même flèche (chandeliers).
 * - `nDeep` : portes faites (>= 2 dames) sur les cases profondes 1 et 2 du bot.
 */
export function computeHumanGeometricCounters(
    boardBefore: ReadonlyArray<number>,
    boardAfter: ReadonlyArray<number>,
    player: Player = 'O',
): {
    readonly nBlots: number;
    readonly hitIndicator: 0 | 1;
    readonly nStack: number;
    readonly nDeep: number;
} {
    const isBotChecker = (v: number): boolean => (player === 'X' ? v > 0 : v < 0);
    const isOppChecker = (v: number): boolean => (player === 'X' ? v < 0 : v > 0);
    const botCount = (v: number): number => (player === 'X' ? Math.max(0, v) : Math.max(0, -v));

    const oppBarIdx = player === 'X' ? 25 : 0;
    const oppOnBarBefore = Math.abs(boardBefore[oppBarIdx] ?? 0);
    const oppOnBarAfter = Math.abs(boardAfter[oppBarIdx] ?? 0);
    const hitIndicator: 0 | 1 = oppOnBarAfter > oppOnBarBefore ? 1 : 0;

    let nBlots = 0;
    let nStack = 0;
    let nDeep = 0;

    for (let pt = 1; pt <= 24; pt++) {
        const val = boardAfter[pt] ?? 0;
        if (!isBotChecker(val)) continue;
        const count = botCount(val);

        if (count > 4) {
            nStack += count - 4;
        }

        // Cases profondes 1 et 2 relatives au camp du bot
        const relPt = player === 'X' ? pt : 25 - pt;
        if ((relPt === 1 || relPt === 2) && count >= 2) {
            nDeep += 1;
        }

        if (count === 1) {
            // Vérifie si ce blot est sous tir direct (1 à 6 cases) d'un pion adverse ou de la barre adverse
            let underDirectShot = false;
            for (let dist = 1; dist <= 6; dist++) {
                // Pour X (qui descend vers 1), l'adversaire O monte de 1 vers 24 (donc O attaque depuis pt - dist ou O_BAR=0)
                // Pour O (qui monte vers 24), l'adversaire X descend de 24 vers 1 (donc X attaque depuis pt + dist ou X_BAR=25)
                const attackerPt = player === 'X' ? pt - dist : pt + dist;
                if (attackerPt >= 1 && attackerPt <= 24) {
                    if (isOppChecker(boardAfter[attackerPt] ?? 0)) {
                        underDirectShot = true;
                        break;
                    }
                } else if ((player === 'X' && attackerPt === 0) || (player === 'O' && attackerPt === 25)) {
                    if (oppOnBarAfter > 0) {
                        underDirectShot = true;
                        break;
                    }
                }
            }
            nBlots += underDirectShot ? 2 : 1;
        }
    }

    return { nBlots, hitIndicator, nStack, nDeep };
}

/**
 * Règle 2 : Calcule le score d'intuition humaine H(a) d'un coup candidat.
 */
export function computeHumanIntuitionScore(params: {
    readonly boardBefore: ReadonlyArray<number>;
    readonly boardAfter: ReadonlyArray<number>;
    readonly trueEquity: number;
    readonly difficulty: AIDifficulty;
    readonly player?: Player;
    readonly neuralOutputs?: NeuralFiveOutputs;
}): number {
    const { boardBefore, boardAfter, trueEquity, difficulty, player = 'O', neuralOutputs } = params;
    const spec = HUMAN_BOT_CALIBRATION_SPECS[difficulty];

    const biasedNetEquity = neuralOutputs
        ? 2 * neuralOutputs.pWin -
          1 +
          spec.alphaG * (neuralOutputs.pWinGammon + neuralOutputs.pWinBg) -
          spec.betaG * (neuralOutputs.pLoseGammon + neuralOutputs.pLoseBg)
        : trueEquity;

    const { nBlots, hitIndicator, nStack, nDeep } = computeHumanGeometricCounters(
        boardBefore,
        boardAfter,
        player,
    );

    return Number(
        (
            biasedNetEquity -
            spec.wBlot * nBlots +
            spec.wHit * hitIndicator -
            spec.wStack * nStack +
            spec.wDeep * nDeep
        ).toFixed(6),
    );
}

/**
 * Règles 1, 2 & 3 : Sélectionne de manière 100 % déterministe le coup du Bot
 * en respectant le plafond d'absurdité Δmax et le budget d'erreur PR cible.
 */
export function selectHumanCalibratedMove(params: {
    readonly boardBefore: ReadonlyArray<number>;
    readonly candidates: ReadonlyArray<CandidateMoveEvaluation>;
    readonly difficulty: AIDifficulty;
    readonly player?: Player;
    readonly budgetState?: BotPrErrorBudgetState;
}): HumanCalibratedSelectionResult {
    const {
        boardBefore,
        candidates,
        difficulty,
        player = 'O',
        budgetState = { totalEmgLost: 0, unforcedDecisions: 0 },
    } = params;

    if (candidates.length === 0) {
        throw new Error('selectHumanCalibratedMove: aucun coup candidat fourni.');
    }

    const spec = HUMAN_BOT_CALIBRATION_SPECS[difficulty];
    const sortedByTrue = [...candidates].sort((a, b) => b.trueEquity - a.trueEquity);
    const bestMove = sortedByTrue[0];
    const worstMove = sortedByTrue[sortedByTrue.length - 1];

    // Une décision n'est comptée comme non-forcée que si l'écart max-min dépasse 0.001 EMG
    const isUnforcedDecision =
        candidates.length > 1 && bestMove.trueEquity - worstMove.trueEquity > 0.001;
    const nextK = isUnforcedDecision
        ? budgetState.unforcedDecisions + 1
        : budgetState.unforcedDecisions;

    // Règle 1 : Garde-Fou d'Absurdité (élimine tout coup perdant plus de Δmax)
    const allowedCandidates = sortedByTrue.filter(
        (c) => bestMove.trueEquity - c.trueEquity <= spec.deltaMaxEmg + 1e-6,
    );
    const pool = allowedCandidates.length > 0 ? allowedCandidates : [bestMove];

    // Règle 2 : Score d'Intuition Humaine H(a) sur les candidats autorisés
    const scoredPool = pool.map((cand) => ({
        cand,
        lossEmg: Math.max(0, bestMove.trueEquity - cand.trueEquity),
        humanScore: computeHumanIntuitionScore({
            boardBefore,
            boardAfter: cand.sequence.board,
            trueEquity: cand.trueEquity,
            difficulty,
            player,
            neuralOutputs: cand.neuralOutputs,
        }),
    }));

    scoredPool.sort((a, b) => b.humanScore - a.humanScore);
    const topHuman = scoredPool[0];

    // Règle 3 : Asserviteur Déterministe de PR (Budget d'erreur Δ_voulu)
    const rawDeficit = nextK * spec.targetEmgPerDecision - budgetState.totalEmgLost;
    const targetDeficitEmg = Math.max(0, Math.min(spec.deltaMaxEmg, rawDeficit));

    let chosen = topHuman;
    if (
        difficulty === 'grandmaster' ||
        !isUnforcedDecision ||
        (topHuman.cand.id === bestMove.id && targetDeficitEmg < 0.015)
    ) {
        chosen = scoredPool.find((item) => item.cand.id === bestMove.id) ?? topHuman;
    } else {
        // Parmi les 3 coups préférés par l'intuition humaine H(a), choisit celui dont la perte ΔE(a) est la plus proche de Δ_voulu
        const top3Human = scoredPool.slice(0, Math.min(3, scoredPool.length));
        chosen = top3Human.reduce((bestFit, current) => {
            const currentDiff = Math.abs(current.lossEmg - targetDeficitEmg);
            const bestDiff = Math.abs(bestFit.lossEmg - targetDeficitEmg);
            return currentDiff < bestDiff ? current : bestFit;
        }, top3Human[0]);
    }

    const updatedBudget: BotPrErrorBudgetState = {
        totalEmgLost: Number((budgetState.totalEmgLost + chosen.lossEmg).toFixed(6)),
        unforcedDecisions: nextK,
    };

    return {
        selected: chosen.cand,
        bestMove,
        equityLossEmg: Number(chosen.lossEmg.toFixed(6)),
        humanScore: chosen.humanScore,
        targetDeficitEmg: Number(targetDeficitEmg.toFixed(6)),
        isUnforcedDecision,
        updatedBudget,
    };
}

/**
 * Règle 4 : Heuristiques humaines sur le Videau (Doubling Too Late, Dead-Cube Drop,
 * Doubling on a Rush, Pride Take).
 */
export function evaluateHumanCubeHeuristic(params: {
    readonly difficulty: AIDifficulty;
    readonly winProbability: number;
    readonly justHitOpponent?: boolean;
}): {
    readonly shouldDouble: boolean;
    readonly shouldTake: boolean;
    readonly rationaleTag: 'OPTIMAL_JANOWSKI' | 'DOUBLING_TOO_LATE' | 'DEAD_CUBE_DROP' | 'DOUBLING_ON_A_RUSH' | 'PRIDE_TAKE';
} {
    const { difficulty, winProbability, justHitOpponent = false } = params;
    const spec = HUMAN_BOT_CALIBRATION_SPECS[difficulty];

    if (spec.cubeStyle === 'prudent') {
        // Prudent : Doubling Too Late (> 74 %) et abandon dès < 24 % (ignore le live-cube take point à 20 %)
        const shouldDouble = winProbability >= 0.74;
        const shouldTake = winProbability >= 0.24;
        return {
            shouldDouble,
            shouldTake,
            rationaleTag: !shouldTake ? 'DEAD_CUBE_DROP' : 'DOUBLING_TOO_LATE',
        };
    }

    if (spec.cubeStyle === 'aggressive') {
        // Agressif : Doubling on a rush (bonus +6 % après une frappe) et Pride Take jusqu'à 17 %
        const effectiveDoubleProb = winProbability + (justHitOpponent ? 0.06 : 0);
        const shouldDouble = effectiveDoubleProb >= 0.66;
        const shouldTake = winProbability >= 0.17;
        return {
            shouldDouble,
            shouldTake,
            rationaleTag: justHitOpponent && shouldDouble ? 'DOUBLING_ON_A_RUSH' : 'PRIDE_TAKE',
        };
    }

    // Optimal / Janowski standard (double >= 66 %, live-cube take >= 20 %)
    return {
        shouldDouble: winProbability >= 0.66,
        shouldTake: winProbability >= 0.20,
        rationaleTag: 'OPTIMAL_JANOWSKI',
    };
}
