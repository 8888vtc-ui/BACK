/**
 * @file src/lib/engine/opponentErhTracker.ts
 * @description Tracker télémétrique de profil adverse en temps réel (« ERH Profile & Telemetry »)
 * et Moteur de Videau Exploitatif (« analyzeBtErhCube ») avec Garde-Fou GTO Strict (<= 0.025 EMG).
 *
 * Couche logique pure : 0 any, 0 React, 0 Math.random, <= 380 lignes.
 */

import { type BoardState, serializeXGID } from '../../engine/backgammonEngine';
import {
    computeJanowskiCubeEvaluation,
    detectJanowskiPhase,
    type JanowskiCubeEvaluation,
} from './janowskiCube';
import {
    analyzeBtCoreCube,
    evaluateBtCoreBoard,
} from './btCoreEngine';
import type { CubeDecisionResult } from './types';

export interface OpponentErhTelemetryCounts {
    readonly unforcedDecisions: number;
    readonly totalEmgLost: number;
    readonly blundersCount: number;
    readonly recentLosses: ReadonlyArray<number>;
    readonly gammonRiskPositions: number;
    readonly passiveSafeMoves: number;
    readonly gammonCubeOpportunities: number;
    readonly gammonDropsObserved: number;
    readonly greedyHitOpportunities: number;
    readonly greedyHitsObserved: number;
    readonly prideTakeOpportunities: number;
    readonly prideTakesObserved: number;
}

export interface OpponentErhProfile {
    /** Performance Rating glissant selon la formule officielle XG (EMG perdue x 500). */
    readonly estimatedPr: number;
    /** Fréquence des coups avec perte d'équité >= 0.080 EMG (0.0 à 1.0). */
    readonly blunderRate: number;
    /** Indice de peur du gammon / sur-sécurisation défensive (0.05 à 0.98). */
    readonly fearOfGammonsIndex: number;
    /** Indice de frappe cupide au détriment de la structure (0.05 à 0.98). */
    readonly greedHitIndex: number;
    /** Indice d'acceptation de videau par orgueil (0.05 à 0.98). */
    readonly prideTakeIndex: number;
    /** Compteurs télémétriques internes pour la mise à jour bayésienne. */
    readonly counts: OpponentErhTelemetryCounts;
}

export type ErhExploitMode =
    | 'GTO_ALIGNED'
    | 'PRESSURE_BLUFF_DOUBLE'
    | 'PUNITIVE_PRIDE_DOUBLE'
    | 'HOLD_FOR_GAMMON';

export interface BtErhCubeResult extends CubeDecisionResult {
    readonly gtoAction: string;
    readonly erhAction: string;
    readonly isExploitativeDivergence: boolean;
    readonly exploitMode: ErhExploitMode;
    readonly exploitativeReason: string | null;
    readonly gtoEquityLoss: number;
    readonly predictedHumanPassProbability: number;
    readonly profileSnap: {
        readonly fearOfGammons: number;
        readonly prideTake: number;
        readonly estimatedPr: number;
    };
}

/** Plafond d'intégrité non négociable : max 0.025 EMG concédés en valeur GTO théorique. */
export const STRICT_GTO_CUBE_SAFETY_CAP_EMG = 0.025;
const ROLLING_WINDOW_SIZE = 30;

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

const EMPTY_COUNTS: OpponentErhTelemetryCounts = {
    unforcedDecisions: 0,
    totalEmgLost: 0,
    blundersCount: 0,
    recentLosses: [],
    gammonRiskPositions: 0,
    passiveSafeMoves: 0,
    gammonCubeOpportunities: 0,
    gammonDropsObserved: 0,
    greedyHitOpportunities: 0,
    greedyHitsObserved: 0,
    prideTakeOpportunities: 0,
    prideTakesObserved: 0,
};

/**
 * Crée un profil adverse initialisé avec un a priori bayésien selon le niveau estimé.
 */
export function createInitialOpponentProfile(
    priorLevel: 'beginner' | 'intermediate' | 'expert' | 'grandmaster' = 'intermediate',
): OpponentErhProfile {
    switch (priorLevel) {
        case 'beginner':
            return {
                estimatedPr: 12.0,
                blunderRate: 0.28,
                fearOfGammonsIndex: 0.68,
                greedHitIndex: 0.70,
                prideTakeIndex: 0.62,
                counts: EMPTY_COUNTS,
            };
        case 'expert':
            return {
                estimatedPr: 2.2,
                blunderRate: 0.02,
                fearOfGammonsIndex: 0.48,
                greedHitIndex: 0.35,
                prideTakeIndex: 0.30,
                counts: EMPTY_COUNTS,
            };
        case 'grandmaster':
            return {
                estimatedPr: 0.5,
                blunderRate: 0.0,
                fearOfGammonsIndex: 0.50,
                greedHitIndex: 0.25,
                prideTakeIndex: 0.25,
                counts: EMPTY_COUNTS,
            };
        case 'intermediate':
        default:
            return {
                estimatedPr: 6.5,
                blunderRate: 0.10,
                fearOfGammonsIndex: 0.52,
                greedHitIndex: 0.50,
                prideTakeIndex: 0.40,
                counts: EMPTY_COUNTS,
            };
    }
}

/**
 * Enregistre un coup de pions joué par l'humain et actualise le profil ERH.
 */
export function recordOpponentCheckerMove(
    profile: OpponentErhProfile,
    event: {
        readonly equityLossEmg: number;
        readonly isUnforcedDecision: boolean;
        readonly oppLoseGammonProb: number;
        readonly didHitChecker: boolean;
        readonly didBreakHomeOrKeyPoint: boolean;
        readonly isPassiveOverStackMove: boolean;
    },
): OpponentErhProfile {
    const c = profile.counts;
    let nextUnforced = c.unforcedDecisions;
    let nextTotalLost = c.totalEmgLost;
    let nextBlunders = c.blundersCount;
    const nextRecent = [...c.recentLosses];

    if (event.isUnforcedDecision) {
        nextUnforced += 1;
        nextTotalLost = Number((nextTotalLost + event.equityLossEmg).toFixed(6));
        if (event.equityLossEmg >= 0.08) nextBlunders += 1;
        nextRecent.push(event.equityLossEmg);
        if (nextRecent.length > ROLLING_WINDOW_SIZE) nextRecent.shift();
    }

    let estimatedPr = profile.estimatedPr;
    let blunderRate = profile.blunderRate;
    if (nextUnforced > 0) {
        const rollingAvg = nextRecent.reduce((acc, v) => acc + v, 0) / nextRecent.length;
        const rawPr = rollingAvg * 500;
        estimatedPr =
            nextUnforced < 10
                ? Number((((10 - nextUnforced) * profile.estimatedPr + nextUnforced * rawPr) / 10).toFixed(2))
                : Number(rawPr.toFixed(2));
        blunderRate = Number((nextBlunders / nextUnforced).toFixed(4));
    }

    let nextGammonPositions = c.gammonRiskPositions;
    let nextPassiveMoves = c.passiveSafeMoves;
    if (event.oppLoseGammonProb >= 0.15) {
        nextGammonPositions += 1;
        if (event.isPassiveOverStackMove && event.equityLossEmg >= 0.025) nextPassiveMoves += 1;
    }
    const fearOfGammonsIndex = Number(
        clamp(
            (2.0 + nextPassiveMoves + 2.5 * c.gammonDropsObserved) /
                (4.0 + nextGammonPositions + 2.5 * c.gammonCubeOpportunities),
            0.05,
            0.98,
        ).toFixed(4),
    );

    let nextGreedOpp = c.greedyHitOpportunities;
    let nextGreedHits = c.greedyHitsObserved;
    if (event.didHitChecker && event.didBreakHomeOrKeyPoint) {
        nextGreedOpp += 1;
        if (event.equityLossEmg >= 0.03) nextGreedHits += 1;
    }
    const greedHitIndex = Number(
        clamp((2.0 + nextGreedHits) / (4.0 + nextGreedOpp), 0.05, 0.98).toFixed(4),
    );

    return {
        estimatedPr,
        blunderRate,
        fearOfGammonsIndex,
        greedHitIndex,
        prideTakeIndex: profile.prideTakeIndex,
        counts: {
            unforcedDecisions: nextUnforced,
            totalEmgLost: nextTotalLost,
            blundersCount: nextBlunders,
            recentLosses: nextRecent,
            gammonRiskPositions: nextGammonPositions,
            passiveSafeMoves: nextPassiveMoves,
            gammonCubeOpportunities: c.gammonCubeOpportunities,
            gammonDropsObserved: c.gammonDropsObserved,
            greedyHitOpportunities: nextGreedOpp,
            greedyHitsObserved: nextGreedHits,
            prideTakeOpportunities: c.prideTakeOpportunities,
            prideTakesObserved: c.prideTakesObserved,
        },
    };
}

/**
 * Enregistre une réponse au videau de l'humain et actualise le profil ERH.
 */
export function recordOpponentCubeDecision(
    profile: OpponentErhProfile,
    event: {
        readonly decision: 'TAKE' | 'PASS';
        readonly gtoAction: 'DOUBLE_TAKE' | 'DOUBLE_PASS' | 'NO_DOUBLE' | 'REDOUBLE_TAKE' | 'REDOUBLE_PASS';
        readonly oppLoseGammonProb: number;
        readonly equityLossTakeVsPass: number;
    },
): OpponentErhProfile {
    const c = profile.counts;
    let nextPrideOpp = c.prideTakeOpportunities;
    let nextPrideTakes = c.prideTakesObserved;
    let nextGammonCubeOpp = c.gammonCubeOpportunities;
    let nextGammonDrops = c.gammonDropsObserved;

    const isTheoreticalPass =
        event.gtoAction === 'DOUBLE_PASS' ||
        event.gtoAction === 'REDOUBLE_PASS' ||
        event.equityLossTakeVsPass >= 0.04;
    if (isTheoreticalPass) {
        nextPrideOpp += 1;
        if (event.decision === 'TAKE') nextPrideTakes += 1;
    }

    const isTheoreticalTake =
        event.gtoAction === 'DOUBLE_TAKE' ||
        event.gtoAction === 'REDOUBLE_TAKE' ||
        event.equityLossTakeVsPass <= -0.02;
    if (event.oppLoseGammonProb >= 0.18 && isTheoreticalTake) {
        nextGammonCubeOpp += 1;
        if (event.decision === 'PASS') nextGammonDrops += 1;
    }

    const prideTakeIndex = Number(
        clamp((1.5 + nextPrideTakes) / (4.0 + nextPrideOpp), 0.05, 0.98).toFixed(4),
    );
    const fearOfGammonsIndex = Number(
        clamp(
            (2.0 + c.passiveSafeMoves + 2.5 * nextGammonDrops) /
                (4.0 + c.gammonRiskPositions + 2.5 * nextGammonCubeOpp),
            0.05,
            0.98,
        ).toFixed(4),
    );

    return {
        ...profile,
        fearOfGammonsIndex,
        prideTakeIndex,
        counts: {
            ...c,
            gammonCubeOpportunities: nextGammonCubeOpp,
            gammonDropsObserved: nextGammonDrops,
            prideTakeOpportunities: nextPrideOpp,
            prideTakesObserved: nextPrideTakes,
        },
    };
}

/**
 * Calcule la probabilité estimée que l'humain passe face au videau.
 */
export function estimateHumanPassProbability(params: {
    readonly oppWinProb: number;
    readonly oppLoseGammonProb: number;
    readonly takePointLive: number;
    readonly profile: OpponentErhProfile;
}): number {
    const deltaTpFear =
        0.14 * Math.max(0, params.profile.fearOfGammonsIndex - 0.5) * (params.oppLoseGammonProb / 0.25);
    const deltaTpPride = -0.12 * Math.max(0, params.profile.prideTakeIndex - 0.4);
    const effectiveTp = clamp(params.takePointLive + deltaTpFear + deltaTpPride, 0.1, 0.45);
    const logit = (effectiveTp - params.oppWinProb) / 0.035;
    return clamp(1.0 / (1.0 + Math.exp(-logit)), 0.01, 0.99);
}

/**
 * Analyse la décision de videau en combinant GTO Janowski et Profilage ERH.
 */
export function analyzeBtErhCube(
    state: BoardState,
    profile: OpponentErhProfile,
    options: {
        score?: { scoreX: number; scoreO: number; matchLength?: number };
        ply?: number;
    } = {},
): BtErhCubeResult {
    const xgid = serializeXGID(state);
    const player = state.turn;
    const btEval = evaluateBtCoreBoard(state, options.ply ?? 2);
    const probs = btEval.probabilities;
    const phase = detectJanowskiPhase(state.board, player);
    const cubeOwner =
        state.cubeOwner === null ? 'CENTERED' : state.cubeOwner === player ? 'PLAYER' : 'OPPONENT';

    const jEval: JanowskiCubeEvaluation = computeJanowskiCubeEvaluation(probs, phase, {
        cubeOwner,
        board: state.board,
        player,
    });

    const cubelessEquity = jEval.cubelessEquity;
    const baseCube = analyzeBtCoreCube(state, options);
    const noDouble = baseCube.noDouble ?? 0;
    const doubleTake = baseCube.doubleTake ?? 0;
    const doublePass = baseCube.doublePass ?? 1;
    const gtoAction = baseCube.optimalAction ?? 'No double, take';

    const profileSnap = {
        fearOfGammons: profile.fearOfGammonsIndex,
        prideTake: profile.prideTakeIndex,
        estimatedPr: profile.estimatedPr,
    };

    if (
        !gtoAction.startsWith('No double, take') &&
        !gtoAction.startsWith('Double, take') &&
        !gtoAction.startsWith('Double, pass')
    ) {
        return {
            ...baseCube,
            gtoAction,
            erhAction: gtoAction,
            isExploitativeDivergence: false,
            exploitMode: 'GTO_ALIGNED',
            exploitativeReason: null,
            gtoEquityLoss: 0,
            predictedHumanPassProbability: 0,
            profileSnap,
        };
    }

    if (profile.estimatedPr <= 1.5) {
        return {
            xgid,
            noDouble,
            doubleTake,
            doublePass,
            isWasm: false,
            optimalAction: gtoAction,
            gtoAction,
            erhAction: gtoAction,
            isExploitativeDivergence: false,
            exploitMode: 'GTO_ALIGNED',
            exploitativeReason: null,
            gtoEquityLoss: 0,
            predictedHumanPassProbability: 0,
            profileSnap,
        };
    }

    const oppWinProb = Number((1.0 - probs.win).toFixed(4));
    const oppLoseGammonProb = probs.winGammon;
    const pPassHuman = estimateHumanPassProbability({
        oppWinProb,
        oppLoseGammonProb,
        takePointLive: jEval.takePointLive,
        profile,
    });
    const gtoLossIfDoubled = Number(Math.max(0, noDouble - doubleTake).toFixed(4));

    const isBlitzThreat = phase === 'BLITZ' || oppLoseGammonProb >= 0.22;
    const isEarlyCubeZone = cubelessEquity >= 0.34 && cubelessEquity <= 0.395;
    if (
        gtoAction === 'No double, take' &&
        isBlitzThreat &&
        isEarlyCubeZone &&
        profile.fearOfGammonsIndex >= 0.55 &&
        gtoLossIfDoubled <= STRICT_GTO_CUBE_SAFETY_CAP_EMG &&
        pPassHuman >= 0.48
    ) {
        const expectedErhDouble = pPassHuman * 1.0 + (1 - pPassHuman) * doubleTake;
        if (expectedErhDouble >= noDouble + 0.025) {
            return {
                xgid,
                noDouble,
                doubleTake,
                doublePass,
                isWasm: false,
                optimalAction: 'Double, pass',
                gtoAction,
                erhAction: 'Double, pass (ERH Pressure Bluff)',
                isExploitativeDivergence: true,
                exploitMode: 'PRESSURE_BLUFF_DOUBLE',
                exploitativeReason: `Double de pression ERH (+${(expectedErhDouble - noDouble).toFixed(3)} EMG face à la peur du gammon).`,
                gtoEquityLoss: gtoLossIfDoubled,
                predictedHumanPassProbability: Number(pPassHuman.toFixed(4)),
                profileSnap,
            };
        }
    }

    if (cubelessEquity >= 0.55 && profile.prideTakeIndex >= 0.55 && pPassHuman <= 0.45) {
        return {
            xgid,
            noDouble,
            doubleTake,
            doublePass,
            isWasm: false,
            optimalAction: 'Double, take',
            gtoAction,
            erhAction: 'Double, take (ERH Punitive Double)',
            isExploitativeDivergence: gtoAction !== 'Double, take',
            exploitMode: 'PUNITIVE_PRIDE_DOUBLE',
            exploitativeReason: `Double punitif ERH exploitant le Pride Take adverse.`,
            gtoEquityLoss: 0,
            predictedHumanPassProbability: Number(pPassHuman.toFixed(4)),
            profileSnap,
        };
    }

    return {
        xgid,
        noDouble,
        doubleTake,
        doublePass,
        isWasm: false,
        optimalAction: gtoAction,
        gtoAction,
        erhAction: gtoAction,
        isExploitativeDivergence: false,
        exploitMode: 'GTO_ALIGNED',
        exploitativeReason: null,
        gtoEquityLoss: 0,
        predictedHumanPassProbability: Number(pPassHuman.toFixed(4)),
        profileSnap,
    };
}
