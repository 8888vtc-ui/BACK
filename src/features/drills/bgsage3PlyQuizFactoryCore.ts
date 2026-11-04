/**
 * @file src/features/drills/bgsage3PlyQuizFactoryCore.ts
 * @description Cœur de l'usine à Quiz `ER / PR` certifiés 100 % `3-ply` (`bgsage` vs `gnubg`) :
 * 1. Suppression totale de l'`ERH` : uniquement `ER / PR` (ΔEMG * 500, 0.0–30.0) + `Rating` (1500).
 * 2. Notation numérique exacte `quizTargetER` (0.5 à 25.0 par pas de 0.5) sur 5 tranches (`DEBUTANT`, `CLUB`, `INTERMEDIAIRE`, `EXPERT`, `MASTER`) pour ciblage N+1 (`ER_joueur - 0.5`).
 * 3. Objectif `TARGET_MAX_QUIZZES = 50000` : 80 % `CHECKER_PLAY` (40 000) + 20 % `CUBE_DECISION` (10 000).
 * 4. Formats de compétition complets `[0, 3, 5, 7, 9, 11, 21]` avec table Kazaross-XG2 (`buildMatchContext`).
 * 5. Sas coupe-circuit `validateSingleQuizStrict(quiz)` (14 contrôles unitaires obligatoires `14/14 PASS`).
 * Strictement <= 400 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import { applyMove } from '../../engine/backgammonEngine';
import { buildMatchContext } from '../coach/matchContext';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import { countConstructiveRolls36 } from '../coach/lookahead36';
import { validateBoardState, computeTenthsMetricDelta, type SemanticArchetype } from './drillSubAgentsPipeline';
import { validateSingleQuizStrict, assertQuizPassesQALoop } from './bgsage3PlyQuizValidator';

export { validateSingleQuizStrict, assertQuizPassesQALoop };
export const TARGET_MAX_QUIZZES = 50000;
export const TARGET_CHECKER_QUIZZES = 40000;
export const TARGET_CUBE_QUIZZES = 10000;

export type QuizDecisionType = 'CHECKER_PLAY' | 'CUBE_DECISION';
export type QuizCompetitionRegime = 'MONEY_JACOBY' | 'MATCH_NORMAL' | 'MATCH_CRAWFORD' | 'MATCH_POST_CRAWFORD' | 'MATCH_DMP' | 'MATCH_GAMMON_GO_2A1A' | 'MATCH_SCORE_4A2A';
export type AllowedQuizMatchLength = 0 | 3 | 5 | 7 | 9 | 11 | 21;
export type QuizTargetBracket = 'DEBUTANT' | 'CLUB' | 'INTERMEDIAIRE' | 'EXPERT' | 'MASTER';

export interface CompetitionFormatSpec {
    readonly id: string;
    readonly label: string;
    readonly regime: QuizCompetitionRegime;
    readonly matchLength: AllowedQuizMatchLength;
    readonly scoreX: number;
    readonly scoreO: number;
    readonly crawford: boolean;
    readonly crawfordAlreadyPlayed: boolean;
    readonly cubeValue: number;
    readonly cubeOwner: 'X' | 'O' | null;
    readonly jacoby: boolean;
    readonly kazarossMwcX: number;
    readonly kazarossGammonPriceX: number;
    readonly kazarossTakePointX: number;
}

export interface Certified3PlyLegalMoveEntry {
    readonly rank: number;
    readonly notation: string;
    readonly evaluatedPly: 3;
    readonly equity: number;
    readonly deltaEmg: number;
    readonly equityLoss: number;
    readonly erPrScore: number;
    readonly erPrTenthsDelta: number;
    readonly isInstinctive0PlyChoice: boolean;
    readonly playerGamePlan: string;
    readonly opponentGamePlan: string;
    readonly finalBoardSignature?: string;
    readonly probabilities: {
        readonly win: number;
        readonly winGammon: number;
        readonly winBackgammon: number;
        readonly loseWin: number;
        readonly loseGammon: number;
        readonly loseBackgammon: number;
    };
}

export interface Geometric36RollsReport {
    readonly whitePips: number;
    readonly blackPips: number;
    readonly pipDiff: number;
    readonly directShotsOn36: number;
    readonly indirectShotsOn36: number;
    readonly constructiveRollsOn36: number;
    readonly targetPoints: readonly number[];
}

export interface Gnubg3PlyCrossCheckReport {
    readonly gnubgTopMove3Ply: string;
    readonly bgsageTopMove3Ply: string;
    readonly top1DisagreementEmg: number;
    readonly isAgreementValid: boolean;
}

export interface Certified3PlyQuiz {
    readonly id: string;
    readonly quizType: QuizDecisionType;
    readonly xgid: string;
    readonly canonicalTurn: 'X';
    readonly canonicalDirection: 'Case 24 ➔ Case 1';
    readonly uiQuizLevelBadge: string;
    readonly plyCount: number;
    readonly evaluatedPly: 3;
    readonly dice: readonly [number, number];
    readonly matchLength: AllowedQuizMatchLength;
    readonly quizTargetER: number;
    readonly targetBracket: QuizTargetBracket;
    readonly tierLabel: 'BEGINNER_OPEN' | 'INTERMEDIATE' | 'EXPERT' | 'MASTER';
    readonly matchupDepthLabel: string;
    readonly competition: CompetitionFormatSpec;
    readonly isContact: boolean;
    readonly archetype: SemanticArchetype;
    readonly conceptId: string;
    readonly conceptName: string;
    readonly optimalMove: string;
    readonly instinctive0PlyMove: string;
    readonly instinctive0PlyLossEmg: number;
    readonly is3PlyTrapVs0Ply: boolean;
    readonly is1PlyTrapVs3Ply: boolean;
    readonly requiredEr: number;
    readonly targetNPlus1Er: number;
    readonly whitePips: number;
    readonly blackPips: number;
    readonly pipCountDisplayed: string;
    readonly pipCountText: string;
    readonly geometry36: Geometric36RollsReport;
    readonly gnubg3PlyVerification: Gnubg3PlyCrossCheckReport;
    readonly coachExplanation3Ply: string;
    readonly socraticHint: string;
    readonly quizChoices: readonly string[];
    readonly legalMoves3Ply: readonly Certified3PlyLegalMoveEntry[];
}

export type CertifiedDualIndexed3PlyQuiz = Certified3PlyQuiz;

export function roundToHalfErStep(value: number): number {
    const clamped = Math.max(0.5, Math.min(25.0, value));
    return Number((Math.round(clamped * 2) / 2).toFixed(1));
}

export function formatUiQuizLevelBadge(quizTargetER: number): string {
    return `🎯 Niveau du Quiz : ER / PR ${roundToHalfErStep(quizTargetER).toFixed(1)} (Objectif N+1)`;
}

function makeFormat(
    id: string,
    label: string,
    regime: QuizCompetitionRegime,
    matchLength: AllowedQuizMatchLength,
    scoreX: number,
    scoreO: number,
    crawford: boolean,
    crawfordAlreadyPlayed: boolean,
    cubeValue: number = 1,
    cubeOwner: 'X' | 'O' | null = null,
): CompetitionFormatSpec {
    const ctx = buildMatchContext({
        matchLength,
        scoreX,
        scoreO,
        crawford,
        crawfordAlreadyPlayed,
        cubeValue,
        cubeOwner,
    });
    return {
        id,
        label,
        regime,
        matchLength,
        scoreX,
        scoreO,
        crawford: ctx.crawford,
        crawfordAlreadyPlayed: ctx.postCrawford,
        cubeValue,
        cubeOwner,
        jacoby: matchLength === 0,
        kazarossMwcX: Number((ctx.matchEquity.X * 100).toFixed(1)),
        kazarossGammonPriceX: Number(ctx.gammonPrice.X.toFixed(3)),
        kazarossTakePointX: Number((ctx.takePoint.X * 100).toFixed(1)),
    };
}

export const ALL_COMPETITION_FORMATS: ReadonlyArray<CompetitionFormatSpec> = [
    makeFormat('money_jacoby_c1', 'Money Game (Jacoby • Videau : 1)', 'MONEY_JACOBY', 0, 0, 0, false, false, 1, null),
    makeFormat('money_jacoby_c2', 'Money Game (Jacoby • Videau : 2)', 'MONEY_JACOBY', 0, 0, 0, false, false, 2, 'X'),
    makeFormat('m3_normal_0_0', 'Match 3 pts (0-0 • 3-away / 3-away)', 'MATCH_NORMAL', 3, 0, 0, false, false, 1, null),
    makeFormat('m3_crawford_2_1', 'Match 3 pts (2-1 Crawford • 1-away / 2-away)', 'MATCH_CRAWFORD', 3, 2, 1, true, false, 1, null),
    makeFormat('m3_dmp_2_2', 'Match 3 pts (2-2 DMP • 1-away / 1-away)', 'MATCH_DMP', 3, 2, 2, false, true, 1, null),
    makeFormat('m3_gammongo_1_2', 'Match 3 pts (1-2 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 3, 1, 2, false, true, 2, 'X'),
    makeFormat('m5_normal_3_0', 'Match 5 pts (3-0 • 2-away / 5-away)', 'MATCH_NORMAL', 5, 3, 0, false, false, 1, null),
    makeFormat('m5_crawford_4_2', 'Match 5 pts (4-2 Crawford • 1-away / 3-away)', 'MATCH_CRAWFORD', 5, 4, 2, true, false, 1, null),
    makeFormat('m5_postcrawford_4_3', 'Match 5 pts (4-3 Post-Crawford • 1-away / 2-away)', 'MATCH_POST_CRAWFORD', 5, 4, 3, false, true, 2, 'O'),
    makeFormat('m5_dmp_4_4', 'Match 5 pts (4-4 DMP • 1-away / 1-away)', 'MATCH_DMP', 5, 4, 4, false, true, 1, null),
    makeFormat('m5_gammongo_3_4', 'Match 5 pts (3-4 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 5, 3, 4, false, true, 2, 'X'),
    makeFormat('m7_normal_5_0', 'Match 7 pts (5-0 • 2-away / 7-away)', 'MATCH_NORMAL', 7, 5, 0, false, false, 1, null),
    makeFormat('m7_4a2a_3_5', 'Match 7 pts (3-5 • 4-away / 2-away • Videau : 1)', 'MATCH_SCORE_4A2A', 7, 3, 5, false, false, 1, null),
    makeFormat('m7_crawford_6_4', 'Match 7 pts (6-4 Crawford • 1-away / 3-away)', 'MATCH_CRAWFORD', 7, 6, 4, true, false, 1, null),
    makeFormat('m7_postcrawford_6_5', 'Match 7 pts (6-5 Post-Crawford • 1-away / 2-away)', 'MATCH_POST_CRAWFORD', 7, 6, 5, false, true, 2, 'O'),
    makeFormat('m7_dmp_6_6', 'Match 7 pts (6-6 DMP • 1-away / 1-away)', 'MATCH_DMP', 7, 6, 6, false, true, 1, null),
    makeFormat('m7_gammongo_5_6', 'Match 7 pts (5-6 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 7, 5, 6, false, true, 2, 'X'),
    makeFormat('m9_normal_6_3', 'Match 9 pts (6-3 • 3-away / 6-away)', 'MATCH_NORMAL', 9, 6, 3, false, false, 1, null),
    makeFormat('m9_crawford_8_5', 'Match 9 pts (8-5 Crawford • 1-away / 4-away)', 'MATCH_CRAWFORD', 9, 8, 5, true, false, 1, null),
    makeFormat('m9_postcrawford_8_6', 'Match 9 pts (8-6 Post-Crawford • 1-away / 3-away)', 'MATCH_POST_CRAWFORD', 9, 8, 6, false, true, 2, 'O'),
    makeFormat('m9_dmp_8_8', 'Match 9 pts (8-8 DMP • 1-away / 1-away)', 'MATCH_DMP', 9, 8, 8, false, true, 1, null),
    makeFormat('m9_gammongo_7_8', 'Match 9 pts (7-8 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 9, 7, 8, false, true, 2, 'X'),
    makeFormat('m11_normal_6_4', 'Match 11 pts (6-4 • 5-away / 7-away)', 'MATCH_NORMAL', 11, 6, 4, false, false, 1, null),
    makeFormat('m11_4a2a_7_9', 'Match 11 pts (7-9 • 4-away / 2-away)', 'MATCH_SCORE_4A2A', 11, 7, 9, false, false, 2, 'O'),
    makeFormat('m11_crawford_10_8', 'Match 11 pts (10-8 Crawford • 1-away / 3-away)', 'MATCH_CRAWFORD', 11, 10, 8, true, false, 1, null),
    makeFormat('m11_gammongo_9_10', 'Match 11 pts (9-10 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 11, 9, 10, false, true, 2, 'X'),
    makeFormat('m21_normal_14_11', 'Match 21 pts (14-11 • 7-away / 10-away)', 'MATCH_NORMAL', 21, 14, 11, false, false, 1, null),
    makeFormat('m21_4a2a_17_19', 'Match 21 pts (17-19 • 4-away / 2-away)', 'MATCH_SCORE_4A2A', 21, 17, 19, false, false, 2, 'O'),
    makeFormat('m21_crawford_20_18', 'Match 21 pts (20-18 Crawford • 1-away / 3-away)', 'MATCH_CRAWFORD', 21, 20, 18, true, false, 1, null),
    makeFormat('m21_gammongo_19_20', 'Match 21 pts (19-20 Gammon-Go • 2-away / 1-away)', 'MATCH_GAMMON_GO_2A1A', 21, 19, 20, false, true, 2, 'X'),
];

const ALL_21_ROLLS: ReadonlyArray<readonly [number, number, number]> = [
    [1, 1, 1], [1, 2, 2], [1, 3, 2], [1, 4, 2], [1, 5, 2], [1, 6, 2],
    [2, 2, 1], [2, 3, 2], [2, 4, 2], [2, 5, 2], [2, 6, 2],
    [3, 3, 1], [3, 4, 2], [3, 5, 2], [3, 6, 2],
    [4, 4, 1], [4, 5, 2], [4, 6, 2],
    [5, 5, 1], [5, 6, 2],
    [6, 6, 1],
];

export function expandMoveNotationTokens(notation: string): string {
    return notation
        .replace(/\*/g, '')
        .trim()
        .replace(/(\S+)\(([234])\)/g, (_m, step: string, countStr: string) => {
            const count = Number(countStr);
            return Array.from({ length: count }, () => step).join(' ');
        })
        .split(/\s+/)
        .flatMap((tok) => {
            const parts = tok.split('/');
            return parts.length > 2 ? parts.slice(0, -1).map((p, k) => `${p}/${parts[k + 1]}`) : [tok];
        })
        .join(' ');
}

export function computeBoardSignatureAfterMove(board28: ReadonlyArray<number>, notation: string): string {
    const validated = validateBoardState(board28, 'X');
    let simBoard = [...validated.normalizedBoard];
    const steps = parseCoachNotationMoves(expandMoveNotationTokens(notation), 'X');
    let hitCount = 0;
    for (const step of steps) {
        if (step.to >= 1 && step.to <= 24 && (simBoard[step.to] ?? 0) === -1) {
            hitCount++;
        }
        simBoard = applyMove(simBoard, step, 'X');
    }
    return `${simBoard.slice(0, 26).join(',')}|hits=${hitCount}`;
}

export function extractGeometric36Rolls(board28: ReadonlyArray<number>, optimalNotation: string): Geometric36RollsReport {
    const validated = validateBoardState(board28, 'X');
    let afterBoard = [...validated.normalizedBoard];
    if (optimalNotation.trim().length > 0) {
        const parsedSteps = parseCoachNotationMoves(expandMoveNotationTokens(optimalNotation), 'X');
        for (const step of parsedSteps) {
            afterBoard = applyMove(afterBoard, step, 'X');
        }
    }

    const blotPoints: number[] = [];
    for (let pt = 1; pt <= 24; pt++) {
        if ((afterBoard[pt] ?? 0) === 1) blotPoints.push(pt);
    }

    let directShotsOn36 = 0;
    let indirectShotsOn36 = 0;
    const oppOnBar = (afterBoard[25] ?? 0) < 0;

    if (blotPoints.length > 0) {
        for (const [d1, d2, weight] of ALL_21_ROLLS) {
            let hitsDirect = false;
            let hitsIndirect = false;
            for (const targetPt of blotPoints) {
                const startSrc = oppOnBar ? 0 : 1;
                const endSrc = oppOnBar ? 0 : targetPt - 1;
                for (let src = startSrc; src <= endSrc; src++) {
                    if (src === 0 || (afterBoard[src] ?? 0) < 0) {
                        const dist = targetPt - src;
                        if (dist === d1 || dist === d2) {
                            hitsDirect = true;
                        } else if (
                            dist === d1 + d2 &&
                            (((afterBoard[src + d1] ?? 0) < 2 && src + d1 <= 24) ||
                                ((afterBoard[src + d2] ?? 0) < 2 && src + d2 <= 24))
                        ) {
                            hitsIndirect = true;
                        } else if (d1 === d2 && dist % d1 === 0 && dist / d1 <= 4) {
                            const stepsCount = dist / d1;
                            let pathOpen = true;
                            for (let s = 1; s < stepsCount; s++) {
                                if ((afterBoard[src + s * d1] ?? 0) >= 2) pathOpen = false;
                            }
                            if (pathOpen) hitsIndirect = true;
                        }
                    }
                }
            }
            if (hitsDirect) directShotsOn36 += weight;
            else if (hitsIndirect) indirectShotsOn36 += weight;
        }
    }

    const baseConstructive = countConstructiveRolls36(afterBoard);
    let constructiveRollsOn36 = baseConstructive.rolls36;
    let targetPoints: readonly number[] = baseConstructive.targetPoints;

    if (constructiveRollsOn36 === 0 && (afterBoard[0] ?? 0) === 0) {
        const hitMap = new Map<number, number>();
        let fallbackRolls36 = 0;
        for (const [d1, d2, weight] of ALL_21_ROLLS) {
            let foundConstructive = false;
            for (let pt = 1; pt <= 20 && !foundConstructive; pt++) {
                const destVal = afterBoard[pt] ?? 0;
                if (destVal <= -2) continue;
                for (let src = pt + 1; src <= 24; src++) {
                    const srcVal = afterBoard[src] ?? 0;
                    if (srcVal !== 1 && srcVal < 3) continue;
                    const dist = src - pt;
                    const canReach =
                        dist === d1 ||
                        dist === d2 ||
                        (dist === d1 + d2 && ((afterBoard[src - d1] ?? 0) > -2 || (afterBoard[src - d2] ?? 0) > -2));
                    if (canReach && (destVal === 1 || (srcVal === 1 && destVal >= 2))) {
                        foundConstructive = true;
                        hitMap.set(pt, (hitMap.get(pt) ?? 0) + weight);
                        break;
                    }
                }
            }
            if (foundConstructive) fallbackRolls36 += weight;
        }
        constructiveRollsOn36 = fallbackRolls36;
        targetPoints = Array.from(hitMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map((e) => e[0]);
    }

    return {
        whitePips: validated.whitePips,
        blackPips: validated.blackPips,
        pipDiff: validated.pipDiff,
        directShotsOn36,
        indirectShotsOn36,
        constructiveRollsOn36,
        targetPoints,
    };
}

export function buildDynamicCoachAndHint3Ply(params: {
    readonly quizType: QuizDecisionType;
    readonly pipCountText: string;
    readonly compLabel: string;
    readonly optimalMove: string;
    readonly secondMove: string;
    readonly bestEquity: number;
    readonly gap12: number;
    readonly geometry36: Geometric36RollsReport;
}): { readonly coachExplanation3Ply: string; readonly socraticHint: string } {
    const { quizType, pipCountText, compLabel, optimalMove, secondMove, bestEquity, gap12, geometry36 } = params;
    const totalShots = geometry36.directShotsOn36 + geometry36.indirectShotsOn36;
    if (geometry36.constructiveRollsOn36 > 0) {
        const coachExplanation3Ply =
            quizType === 'CUBE_DECISION'
                ? `En 3-ply Cubeful (${pipCountText}, ${compLabel}), ${optimalMove} (${bestEquity >= 0 ? '+' : ''}${bestEquity.toFixed(3)} EMG) devance ${secondMove} de ${gap12.toFixed(3)} EMG avec ${geometry36.constructiveRollsOn36}/36 lancers constructifs.`
                : `En 3-ply (${pipCountText}, ${compLabel}), ${optimalMove} devance ${secondMove} de ${gap12.toFixed(3)} EMG avec ${geometry36.constructiveRollsOn36}/36 lancers constructifs et ${geometry36.directShotsOn36}/36 tirs directs adverses.`;
        const socraticHint =
            quizType === 'CUBE_DECISION'
                ? `Observez le compte (${pipCountText}) et vos ${geometry36.constructiveRollsOn36}/36 lancers constructifs avant de décider du videau.`
                : `Observez le compte (${pipCountText}) : quel choix valorise vos ${geometry36.constructiveRollsOn36}/36 lancers constructifs ?`;
        return { coachExplanation3Ply, socraticHint };
    }
    const coachExplanation3Ply =
        quizType === 'CUBE_DECISION'
            ? `En 3-ply Cubeful (${pipCountText}, ${compLabel}), ${optimalMove} (${bestEquity >= 0 ? '+' : ''}${bestEquity.toFixed(3)} EMG) devance ${secondMove} de ${gap12.toFixed(3)} EMG en limitant la riposte adverse à ${geometry36.directShotsOn36}/36 tirs directs (${totalShots}/36 au total).`
            : `En 3-ply (${pipCountText}, ${compLabel}), ${optimalMove} devance ${secondMove} de ${gap12.toFixed(3)} EMG en verrouillant la structure (${geometry36.directShotsOn36}/36 tirs directs adverses, ${totalShots}/36 au total).`;
    const socraticHint = `Observez le compte (${pipCountText}) : quelle option contrôle le mieux les ${geometry36.directShotsOn36}/36 tirs directs adverses et la structure de prime ?`;
    return { coachExplanation3Ply, socraticHint };
}

export function computeQuizTargetERAndBracket(params: {
    readonly gap12Emg: number;
    readonly is3PlyTrapVs0Ply: boolean;
    readonly is1PlyTrapVs3Ply: boolean;
}): {
    readonly quizTargetER: number;
    readonly targetBracket: QuizTargetBracket;
    readonly tierLabel: Certified3PlyQuiz['tierLabel'];
} {
    const gap = Math.max(0.008, Math.min(0.140, Math.abs(params.gap12Emg)));

    if (gap <= 0.013 || (params.is3PlyTrapVs0Ply && params.is1PlyTrapVs3Ply && gap <= 0.015)) {
        const raw = 0.5 + ((Math.min(0.013, gap) - 0.008) / 0.005) * 1.5;
        const quizTargetER = Math.max(0.5, Math.min(2.0, roundToHalfErStep(raw)));
        return { quizTargetER, targetBracket: 'MASTER', tierLabel: 'MASTER' };
    }
    if (gap <= 0.022) {
        const raw = 2.5 + ((gap - 0.013) / 0.009) * 1.5;
        const quizTargetER = Math.max(2.5, Math.min(4.0, roundToHalfErStep(raw)));
        return { quizTargetER, targetBracket: 'EXPERT', tierLabel: 'EXPERT' };
    }
    if (gap <= 0.038) {
        const raw = 4.5 + ((gap - 0.022) / 0.016) * 2.5;
        const quizTargetER = Math.max(4.5, Math.min(7.0, roundToHalfErStep(raw)));
        return { quizTargetER, targetBracket: 'INTERMEDIAIRE', tierLabel: 'INTERMEDIATE' };
    }
    if (gap < 0.065) {
        const raw = 7.5 + ((gap - 0.038) / 0.027) * 4.0;
        const quizTargetER = Math.max(7.5, Math.min(11.5, roundToHalfErStep(raw)));
        return { quizTargetER, targetBracket: 'CLUB', tierLabel: 'INTERMEDIATE' };
    }
    const raw = 12.0 + ((gap - 0.065) / 0.075) * 8.0;
    const quizTargetER = Math.max(12.0, Math.min(20.0, roundToHalfErStep(raw)));
    return { quizTargetER, targetBracket: 'DEBUTANT', tierLabel: 'BEGINNER_OPEN' };
}

export function computeErPrForMove(params: {
    readonly rank: number;
    readonly equityLoss: number;
}): {
    readonly deltaEmg: number;
    readonly equityLoss: number;
    readonly erPrScore: number;
    readonly erPrTenthsDelta: number;
} {
    const absLoss = Math.abs(params.equityLoss);
    const isOptimal = params.rank === 1 || absLoss < 0.0005;
    const deltaEmg = isOptimal ? 0.0 : Number((-absLoss).toFixed(4));
    const erPrScore = isOptimal ? 0.0 : Number(Math.min(30.0, absLoss * 500).toFixed(1));
    const erPrTenthsDelta = computeTenthsMetricDelta(isOptimal, absLoss);
    return { deltaEmg, equityLoss: isOptimal ? 0.0 : Number(absLoss.toFixed(4)), erPrScore, erPrTenthsDelta };
}

export function decodeXgidBoard26(xgid: string): number[] {
    const raw = xgid.replace(/^XGID=/, '').split(':')[0] ?? '';
    const chars = 'ABCDEFGHIJKLMNOP';
    const decodeChar = (ch: string): number => {
        if (ch === '-' || ch === '0') return 0;
        const idx = chars.indexOf(ch.toUpperCase());
        if (idx === -1) return 0;
        const count = idx + 1;
        return ch === ch.toUpperCase() ? count : -count;
    };
    const board = new Array<number>(26).fill(0);
    const barO = decodeChar(raw[0] ?? '-');
    board[0] = barO <= 0 ? barO : -barO;
    for (let p = 1; p <= 24; p++) {
        board[p] = decodeChar(raw[p] ?? '-');
    }
    const barX = decodeChar(raw[25] ?? '-');
    board[25] = barX >= 0 ? barX : -barX;
    return board;
}

export function encodeBgsageBoard26ToXgidBody(board26: ReadonlyArray<number>): string {
    const chars = 'ABCDEFGHIJKLMNOP';
    const encodeCount = (val: number, isUpper: boolean): string => {
        const c = Math.min(15, Math.abs(Math.trunc(val)));
        if (c === 0) return '-';
        const ch = chars[c - 1] ?? 'O';
        return isUpper ? ch : ch.toLowerCase();
    };
    let s = encodeCount(board26[0] ?? 0, false);
    for (let p = 1; p <= 24; p++) {
        const v = board26[p] ?? 0;
        s += v >= 0 ? encodeCount(v, true) : encodeCount(v, false);
    }
    s += encodeCount(board26[25] ?? 0, true);
    return s;
}

export function invertBgsageBoard26(board26: ReadonlyArray<number>): number[] {
    const inv = new Array<number>(26).fill(0);
    for (let i = 0; i < 26; i++) {
        inv[i] = -(board26[25 - i] ?? 0);
    }
    return inv;
}

export function buildCanonicalXgid(
    board26: ReadonlyArray<number>,
    dice: readonly [number, number] | null,
    comp: CompetitionFormatSpec,
): string {
    const body = encodeBgsageBoard26ToXgidBody(board26);
    const cubeExp = comp.cubeValue > 1 ? Math.round(Math.log2(comp.cubeValue)) : 0;
    const cubeOwnerCode = comp.cubeOwner === 'X' ? 1 : comp.cubeOwner === 'O' ? -1 : 0;
    const crawfordCode = comp.crawford || comp.jacoby ? 1 : 0;
    const diceCode = !dice || (dice[0] === 0 && dice[1] === 0) ? '00' : `${dice[0]}${dice[1]}`;
    return `XGID=${body}:${cubeExp}:${cubeOwnerCode}:1:${diceCode}:${comp.scoreX}:${comp.scoreO}:${crawfordCode}:${comp.matchLength}:10`;
}
