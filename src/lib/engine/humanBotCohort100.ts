/**
 * @file src/lib/engine/humanBotCohort100.ts
 * @description Cohorte Officielle des 100 Robots Faux-Humains (« HUMAN_BOT_COHORT_100 »)
 * pour la validation scientifique de `BT-ERH v3.0` vs `BT-Core v3.0 (ER)` vs `GNU Backgammon`.
 *
 * Répartis en 5 paliers réalistes (#001 à #100) sans aucun `Math.random()` :
 * - Palier 1 (#001-#020) : Débutants Impulsifs / Gamblers (PR 14.0 à 23.5, Elo 1210-1440)
 * - Palier 2 (#021-#045) : Joueurs de Café / Prudents Chandeliers (PR 8.6 à 13.6, Elo 1450-1645)
 * - Palier 3 (#046-#070) : Joueurs de Club Réguliers (PR 5.0 à 8.4, Elo 1650-1845)
 * - Palier 4 (#071-#090) : Compétiteurs de Tournoi Avancés (PR 2.8 à 4.8, Elo 1850-2015)
 * - Palier 5 (#091-#100) : Experts & Maîtres Humains (PR 1.6 à 2.6, Elo 2025-2150)
 *
 * Strictement 0 any, 0 Math.random, <= 380 lignes (conforme GOVERNANCE.md & SCALABILITY.md).
 */

import {
    borneOffCount,
    generateLegalMoves,
    X_BAR,
    O_BAR,
    type BoardState,
    type MoveSequence,
    type Player,
} from '../../engine/backgammonEngine';
import {
    computeHumanGeometricCounters,
    type BotPrErrorBudgetState,
} from '../../engine/humanBotController';
import { evaluateBtCoreBoard } from './btCoreEngine';
import { formatMoveSequenceNotation } from './evaluator';
import { computeShotExposure } from './shotExposure';

export type HumanBotTierId =
    | 'TIER_1_IMPULSIVE_BEGINNER'
    | 'TIER_2_CAFE_CANDLESTICK'
    | 'TIER_3_CLUB_REGULAR'
    | 'TIER_4_TOURNAMENT_ADVANCED'
    | 'TIER_5_HUMAN_MASTER';

export interface HumanBotArchetype100 {
    readonly index: number; // 1..100
    readonly id: string; // ex: "HBOT-001"
    readonly name: string;
    readonly tier: HumanBotTierId;
    readonly targetPr: number;
    readonly elo: number;
    readonly deltaMaxEmg: number;
    /** Pénalité perçue par blot exposé sous tir direct 1..6 */
    readonly wBlotDirect: number;
    /** Aveuglement aux tirs indirects (7..12 pips) : 0 = voit parfaitement, 1 = ignore totalement */
    readonly indirectBlindness: number;
    /** Appât de la frappe immédiate (biais de chasseur de blots) */
    readonly wHitGreed: number;
    /** Tendance à empiler des chandeliers (> 4 dames) ou sur-sécuriser */
    readonly wStackSafety: number;
    /** Tendance à fermer prématurément les cases profondes 1 et 2 */
    readonly wDeepPoint: number;
    /** Peur du gammon (0.05 à 0.95) provoquant des passes prématurés au videau */
    readonly fearOfGammons: number;
    /** Orgueil au videau (0.05 à 0.95) provoquant des takes perdants */
    readonly prideTake: number;
    /** Seuil de victoire perçu pour doubler (ex: 0.75 = Doubling Too Late, 0.62 = Rush Double) */
    readonly doubleThresholdWin: number;
}

export interface HumanBotMoveDecision {
    readonly sequence: MoveSequence;
    readonly notation: string;
    readonly chosenTrueEquity: number;
    readonly bestGtoEquity: number;
    readonly bestGtoNotation: string;
    readonly bestGtoSequence: MoveSequence;
    readonly equityLossEmg: number;
    readonly isUnforced: boolean;
    readonly updatedBudget: BotPrErrorBudgetState;
}

const ARCHETYPE_FIRST_NAMES: readonly string[] = [
    'Lucas', 'Enzo', 'Matteo', 'Hugo', 'Leo', 'Gabriel', 'Arthur', 'Louis', 'Jules', 'Adam',
    'Chloe', 'Emma', 'Jade', 'Louise', 'Alice', 'Lina', 'Mila', 'Rose', 'Anna', 'Elena',
    'Marc', 'Alain', 'Bernard', 'Philippe', 'Patrick', 'Michel', 'René', 'Gérard', 'Claude', 'Serge',
    'Sylvie', 'Nathalie', 'Isabelle', 'Valérie', 'Sandrine', 'Catherine', 'Monique', 'Françoise', 'Martine', 'Nicole',
    'Thomas', 'Nicolas', 'Julien', 'Sébastien', 'Alexandre', 'Maxime', 'Antoine', 'Romain', 'Vincent', 'Guillaume',
    'Camille', 'Manon', 'Sarah', 'Laura', 'Pauline', 'Mathilde', 'Marine', 'Juliette', 'Claire', 'Margaux',
    'David', 'Stéphane', 'Olivier', 'Christophe', 'Laurent', 'Frédéric', 'Éric', 'Jérôme', 'Fabien', 'Cédric',
    'Hélène', 'Céline', 'Aurélie', 'Émilie', 'Virginie', 'Laetitia', 'Caroline', 'delphine', 'Stéphanie', 'Élodie',
    'Viktor', 'Kaspar', 'Darius', 'Soren', 'Kenji', 'Tariq', 'Levon', 'Magnus', 'Fabiano', 'Hikaru',
    'Sofia', 'Judit', 'Hou', 'Alexandra', 'Nana', 'Pia', 'Humpy', 'Mariya', 'Kateryna', 'Lei',
];

function buildCohort100(): ReadonlyArray<HumanBotArchetype100> {
    const list: HumanBotArchetype100[] = [];

    for (let idx = 1; idx <= 100; idx++) {
        const id = `HBOT-${String(idx).padStart(3, '0')}`;
        const rawName = ARCHETYPE_FIRST_NAMES[idx - 1] ?? `Joueur${idx}`;
        const name = `${rawName} #${String(idx).padStart(3, '0')}`;

        if (idx <= 20) {
            // Palier 1 : Débutants Impulsifs / Gamblers (#001 à #020)
            const k = idx - 1; // 0..19
            const targetPr = Number((23.5 - k * 0.5).toFixed(2)); // 23.5 -> 14.0
            const isHyperBlitzer = k % 2 === 0;
            list.push({
                index: idx,
                id,
                name: `${name} (Débutant ${isHyperBlitzer ? 'Blitzer' : 'Gambler'})`,
                tier: 'TIER_1_IMPULSIVE_BEGINNER',
                targetPr,
                elo: 1210 + k * 12,
                deltaMaxEmg: Number((0.185 - k * 0.002).toFixed(3)),
                wBlotDirect: isHyperBlitzer ? 0.008 : 0.018,
                indirectBlindness: Number((0.92 - k * 0.01).toFixed(2)),
                wHitGreed: Number((0.095 - k * 0.0015).toFixed(3)),
                wStackSafety: 0.015,
                wDeepPoint: 0.035,
                fearOfGammons: isHyperBlitzer ? 0.25 : 0.72,
                prideTake: isHyperBlitzer ? 0.85 : 0.65,
                doubleThresholdWin: isHyperBlitzer ? 0.60 : 0.76,
            });
        } else if (idx <= 45) {
            // Palier 2 : Joueurs de Café / Prudents Chandeliers (#021 à #045)
            const k = idx - 21; // 0..24
            const targetPr = Number((13.6 - k * 0.2).toFixed(2)); // 13.6 -> 8.8
            const isPhobic = k % 2 === 0;
            list.push({
                index: idx,
                id,
                name: `${name} (Café ${isPhobic ? 'Anti-Blot' : 'Chandelier'})`,
                tier: 'TIER_2_CAFE_CANDLESTICK',
                targetPr,
                elo: 1450 + k * 8,
                deltaMaxEmg: Number((0.135 - k * 0.0015).toFixed(3)),
                wBlotDirect: isPhobic ? 0.065 : 0.048,
                indirectBlindness: Number((0.78 - k * 0.008).toFixed(2)),
                wHitGreed: isPhobic ? 0.015 : 0.045,
                wStackSafety: isPhobic ? -0.025 : -0.035, // aime empiler des chandeliers "sûrs" !
                wDeepPoint: 0.030,
                fearOfGammons: Number((0.82 - k * 0.006).toFixed(2)),
                prideTake: isPhobic ? 0.25 : 0.55,
                doubleThresholdWin: 0.75,
            });
        } else if (idx <= 70) {
            // Palier 3 : Joueurs de Club Réguliers (#046 à #070)
            const k = idx - 46; // 0..24
            const targetPr = Number((8.4 - k * 0.14).toFixed(2)); // 8.4 -> 5.04
            const isAttackClub = k % 3 === 0;
            list.push({
                index: idx,
                id,
                name: `${name} (Club ${isAttackClub ? 'Offensif' : 'Classique'})`,
                tier: 'TIER_3_CLUB_REGULAR',
                targetPr,
                elo: 1650 + k * 8,
                deltaMaxEmg: Number((0.095 - k * 0.001).toFixed(3)),
                wBlotDirect: isAttackClub ? 0.022 : 0.038,
                indirectBlindness: Number((0.58 - k * 0.007).toFixed(2)),
                wHitGreed: isAttackClub ? 0.042 : 0.022,
                wStackSafety: 0.015,
                wDeepPoint: 0.016,
                fearOfGammons: isAttackClub ? 0.42 : 0.68,
                prideTake: isAttackClub ? 0.64 : 0.35,
                doubleThresholdWin: isAttackClub ? 0.64 : 0.74,
            });
        } else if (idx <= 90) {
            // Palier 4 : Compétiteurs de Tournoi Avancés (#071 à #090)
            const k = idx - 71; // 0..19
            const targetPr = Number((4.8 - k * 0.1).toFixed(2)); // 4.8 -> 2.9
            list.push({
                index: idx,
                id,
                name: `${name} (Tournoi Avancé)`,
                tier: 'TIER_4_TOURNAMENT_ADVANCED',
                targetPr,
                elo: 1850 + k * 8,
                deltaMaxEmg: Number((0.062 - k * 0.001).toFixed(3)),
                wBlotDirect: 0.018,
                indirectBlindness: Number((0.36 - k * 0.006).toFixed(2)),
                wHitGreed: 0.016,
                wStackSafety: 0.010,
                wDeepPoint: 0.008,
                fearOfGammons: Number((0.58 - k * 0.005).toFixed(2)),
                prideTake: Number((0.46 - k * 0.005).toFixed(2)),
                doubleThresholdWin: 0.70,
            });
        } else {
            // Palier 5 : Experts & Maîtres Humains (#091 à #100)
            const k = idx - 91; // 0..9
            const targetPr = Number((2.6 - k * 0.11).toFixed(2)); // 2.6 -> 1.61
            list.push({
                index: idx,
                id,
                name: `${name} (Maître Humain)`,
                tier: 'TIER_5_HUMAN_MASTER',
                targetPr,
                elo: 2025 + k * 14,
                deltaMaxEmg: Number((0.038 - k * 0.0012).toFixed(3)),
                wBlotDirect: 0.008,
                indirectBlindness: Number((0.18 - k * 0.01).toFixed(2)),
                wHitGreed: 0.007,
                wStackSafety: 0.005,
                wDeepPoint: 0.003,
                fearOfGammons: 0.52,
                prideTake: 0.34,
                doubleThresholdWin: 0.68,
            });
        }
    }

    return Object.freeze(list);
}

export const HUMAN_BOT_COHORT_100: ReadonlyArray<HumanBotArchetype100> = buildCohort100();

/**
 * Sélectionne de façon 100 % déterministe le coup joué par l'un des 100 bots faux-humains.
 * Plus la position laissée par l'adversaire comporte de pièges (tirs indirects 7-10, dilemmes hit/prime,
 * dés dupliqués), plus les biais cognitifs du profil (`wHitGreed`, `wBlotDirect`, `indirectBlindness`, `wStackSafety`)
 * divergent du coup GTO optimal.
 */
export function selectCohortHumanBotMove(
    state: BoardState,
    dice: [number, number],
    bot: HumanBotArchetype100,
    budgetState: BotPrErrorBudgetState = { totalEmgLost: 0, unforcedDecisions: 0 },
): HumanBotMoveDecision | null {
    const legalSeqs = generateLegalMoves(state, dice);
    if (legalSeqs.length === 0) return null;

    const player = state.turn;
    const opponent: Player = player === 'X' ? 'O' : 'X';

    // Évaluation GTO exacte (via BT-Neural v3.0 / BT-Core) de chaque candidat légal
    const evaluated = legalSeqs.map((seq) => {
        const oppEval = evaluateBtCoreBoard({
            ...state,
            board: seq.board,
            turn: opponent,
            dice: null,
        });
        const trueEquity = Number((-oppEval.cubefulEquity).toFixed(4));
        const geom = computeHumanGeometricCounters(state.board, seq.board, player);
        const exposure = computeShotExposure(seq.board as number[], player);

        // Un humain aveugle aux tirs indirects sous-estime le danger des tirs > 6 pips
        // (ce qui lui donne une fausse impression de sécurité sur les blots à 7..10 cases !)
        const indirectIllusionBonus =
            bot.indirectBlindness * Math.min(0.045, exposure.indirectRolls * 0.0035);

        // Score d'intuition psychologique propre à l'archétype #001..#100
        const humanPerceivedScore = Number(
            (
                trueEquity -
                bot.wBlotDirect * geom.nBlots +
                bot.wHitGreed * geom.hitIndicator -
                bot.wStackSafety * geom.nStack +
                bot.wDeepPoint * geom.nDeep +
                indirectIllusionBonus
            ).toFixed(5),
        );

        return {
            seq,
            notation: formatMoveSequenceNotation(seq.moves, player),
            trueEquity,
            humanPerceivedScore,
        };
    });

    evaluated.sort((a, b) => b.trueEquity - a.trueEquity);
    const bestGto = evaluated[0];
    const worstGto = evaluated[evaluated.length - 1];
    const isUnforced = evaluated.length > 1 && bestGto.trueEquity - worstGto.trueEquity > 0.001;
    const nextDecisions = isUnforced ? budgetState.unforcedDecisions + 1 : budgetState.unforcedDecisions;

    if (!isUnforced) {
        return {
            sequence: bestGto.seq,
            notation: bestGto.notation,
            chosenTrueEquity: bestGto.trueEquity,
            bestGtoEquity: bestGto.trueEquity,
            bestGtoNotation: bestGto.notation,
            bestGtoSequence: bestGto.seq,
            equityLossEmg: 0,
            isUnforced: false,
            updatedBudget: budgetState,
        };
    }

    // Garde-fou d'absurdité propre au bot + Asserviteur déterministe de PR
    const allowed = evaluated.filter((c) => bestGto.trueEquity - c.trueEquity <= bot.deltaMaxEmg);
    const pool = allowed.length > 0 ? allowed : [bestGto];

    const byHuman = [...pool].sort((a, b) => b.humanPerceivedScore - a.humanPerceivedScore);
    const targetEmgPerMove = bot.targetPr / 500;
    const rawDeficit = nextDecisions * targetEmgPerMove - budgetState.totalEmgLost;
    const targetDeficit = Math.max(0, Math.min(bot.deltaMaxEmg, rawDeficit));

    // Si le coup intuitif #1 de l'humain diffère du coup GTO, l'humain tombe naturellement dans le piège !
    let chosen = byHuman[0];
    if (chosen.notation === bestGto.notation && targetDeficit >= 0.012 && byHuman.length > 1) {
        const topHumanPool = byHuman.slice(0, Math.min(4, byHuman.length));
        chosen = topHumanPool.reduce((bestFit, cur) => {
            const lossCur = bestGto.trueEquity - cur.trueEquity;
            const lossBest = bestGto.trueEquity - bestFit.trueEquity;
            return Math.abs(lossCur - targetDeficit) < Math.abs(lossBest - targetDeficit) ? cur : bestFit;
        }, topHumanPool[0]);
    }

    const equityLossEmg = Number(Math.max(0, bestGto.trueEquity - chosen.trueEquity).toFixed(4));
    return {
        sequence: chosen.seq,
        notation: chosen.notation,
        chosenTrueEquity: chosen.trueEquity,
        bestGtoEquity: bestGto.trueEquity,
        bestGtoNotation: bestGto.notation,
        bestGtoSequence: bestGto.seq,
        equityLossEmg,
        isUnforced: true,
        updatedBudget: {
            totalEmgLost: Number((budgetState.totalEmgLost + equityLossEmg).toFixed(5)),
            unforcedDecisions: nextDecisions,
        },
    };
}

/**
 * Décision de Videau (Double / No Double) et Réponse (Take / Pass) d'un des 100 bots faux-humains.
 */
export function evaluateCohortHumanBotCube(
    state: BoardState,
    bot: HumanBotArchetype100,
): {
    readonly shouldDouble: boolean;
    readonly shouldTakeWhenDoubled: boolean;
    readonly oppWinProb: number;
    readonly oppLoseGammonProb: number;
} {
    const player = state.turn;
    const offP = borneOffCount(state.board as number[], player);
    const oppBar = player === 'X' ? Math.max(0, -(state.board[O_BAR] ?? 0)) : Math.max(0, state.board[X_BAR] ?? 0);

    const evalSt = evaluateBtCoreBoard(state, 1);
    const winProb = evalSt.probabilities.win;
    const loseGammonProb = evalSt.probabilities.loseGammon;

    const justHitBonus = oppBar > 0 && bot.prideTake > 0.6 ? 0.05 : 0;
    const shouldDouble = offP < 15 && winProb + justHitBonus >= bot.doubleThresholdWin;

    // Quand ce bot reçoit un videau (donc state.turn est le doubleur adverse, et ce bot a `1 - winProb` de gagner) :
    const defenderWinProb = 1 - winProb;
    const defenderLoseGammonProb = evalSt.probabilities.winGammon;

    // Point de take psychologique : augmente avec fearOfGammons, baisse avec prideTake
    const fearShift = Math.max(0, bot.fearOfGammons - 0.45) * defenderLoseGammonProb * 0.45;
    const prideShift = Math.max(0, bot.prideTake - 0.45) * 0.09;
    const effectiveTakePoint = Math.max(0.14, Math.min(0.36, 0.215 + fearShift - prideShift));

    return {
        shouldDouble,
        shouldTakeWhenDoubled: defenderWinProb >= effectiveTakePoint,
        oppWinProb: defenderWinProb,
        oppLoseGammonProb: defenderLoseGammonProb,
    };
}

