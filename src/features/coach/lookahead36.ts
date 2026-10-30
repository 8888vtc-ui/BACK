/**
 * @file src/features/coach/lookahead36.ts
 * @description Simulateur déterministe 1-Turn Rollout (< 2 ms, 21 tirages pondérés sur 36),
 * Détecteur algorithmique de « Coup Brillant (!!) » à 4 portes et Tuteur Silencieux Anti-Paranoïa.
 *
 * Strictement 0 `any`, < 400 lignes.
 */

import { computeDuplication, maxPrimeLength } from './detectPositionalMotif';

export interface Lookahead36Metrics {
    readonly constructiveCoversOpt: number;
    readonly constructiveCoversPlay: number;
    readonly bestTargetPointsOpt: number[];
    readonly oppHitRollsOpt: number;
    readonly oppHitRollsPlay: number;
    readonly oppDirectShotsOpt: number;
    readonly oppDirectShotsPlay: number;
    readonly oppJokerRollsOpt: number;
    readonly oppJokerRollsPlay: number;
    readonly oppDanceRollsOpt: number;
    readonly causalHeadlineFR: string;
    readonly causalHeadlineEN: string;
}

export interface BrilliantMoveEvaluation {
    readonly isBrilliant: boolean;
    readonly reasonCode:
        | 'NOT_TOP_CHOICE'
        | 'MARGIN_TOO_SMALL'
        | 'NO_APPARENT_SACRIFICE'
        | 'NO_DEEP_JUSTIFICATION'
        | 'BRILLIANT_DUPLICATION'
        | 'BRILLIANT_SLOT_TEMPO'
        | 'BRILLIANT_PRIME_SACRIFICE';
    readonly headlineFR: string;
    readonly headlineEN: string;
}

export interface BotApparentLuckExplanation {
    readonly constructiveRolls36: number;
    readonly shouldDisplayTutorBubble: boolean;
    readonly messageFR: string;
    readonly messageEN: string;
}

const DICE_PAIRS: ReadonlyArray<readonly [number, number, number]> = [
    [1, 1, 1], [1, 2, 2], [1, 3, 2], [1, 4, 2], [1, 5, 2], [1, 6, 2],
    [2, 2, 1], [2, 3, 2], [2, 4, 2], [2, 5, 2], [2, 6, 2],
    [3, 3, 1], [3, 4, 2], [3, 5, 2], [3, 6, 2],
    [4, 4, 1], [4, 5, 2], [4, 6, 2],
    [5, 5, 1], [5, 6, 2],
    [6, 6, 1],
];

const KEY_TARGETS = [5, 4, 7, 3, 6, 8, 9, 2, 20, 21, 18];

/**
 * Calcule le nombre de pions "libres" (mobiles sans casser une porte de 2 pions) sur chaque case.
 */
function getFreeCheckers(b: Int8Array | readonly number[], targetPt: number): Int8Array {
    const free = new Int8Array(25);
    for (let i = targetPt + 1; i <= 24; i++) {
        const c = (b[i] ?? 0) > 0 ? (b[i] ?? 0) : 0;
        if (c === 1) free[i] = 1;
        else if (c >= 3) free[i] = c - 2;
    }
    return free;
}

function canReach(
    b: Int8Array | readonly number[],
    from: number,
    to: number,
    d1: number,
    d2: number,
): boolean {
    const dist = from - to;
    if (dist <= 0) return false;
    const isBlocked = (pt: number) => pt >= 1 && pt <= 24 && (b[pt] ?? 0) <= -2;
    if (isBlocked(to)) return false;

    if (dist === d1 || dist === d2) return true;
    if (dist === d1 + d2) {
        return !isBlocked(from - d1) || !isBlocked(from - d2);
    }
    if (d1 === d2 && dist % d1 === 0 && dist / d1 <= 4) {
        const steps = dist / d1;
        for (let s = 1; s < steps; s++) {
            if (isBlocked(from - s * d1)) return false;
        }
        return true;
    }
    return false;
}

export function countConstructiveRolls36(b: Int8Array | readonly number[]): {
    readonly rolls36: number;
    readonly targetPoints: number[];
} {
    if ((b[25] ?? 0) > 0) return { rolls36: 0, targetPoints: [] };

    let rolls36 = 0;
    const targetHitCounts = new Map<number, number>();

    for (const [d1, d2, weight] of DICE_PAIRS) {
        let rollMakesPoint = false;

        for (const pt of KEY_TARGETS) {
            const currentOwn = (b[pt] ?? 0) > 0 ? (b[pt] ?? 0) : 0;
            if (currentOwn >= 2 || (b[pt] ?? 0) <= -2) continue;

            const free = getFreeCheckers(b, pt);

            if (currentOwn === 1) {
                for (let src = pt + 1; src <= 24; src++) {
                    if ((free[src] ?? 0) >= 1 && canReach(b, src, pt, d1, d2)) {
                        rollMakesPoint = true;
                        targetHitCounts.set(pt, (targetHitCounts.get(pt) ?? 0) + weight);
                        break;
                    }
                }
            } else if (currentOwn === 0) {
                if (d1 !== d2) {
                    const src1 = pt + d1;
                    const src2 = pt + d2;
                    if (src1 <= 24 && src2 <= 24 && (free[src1] ?? 0) >= 1 && (free[src2] ?? 0) >= 1) {
                        rollMakesPoint = true;
                        targetHitCounts.set(pt, (targetHitCounts.get(pt) ?? 0) + weight);
                    }
                } else {
                    const src1 = pt + d1;
                    const src2 = pt + 2 * d1;
                    const avail1 = src1 <= 24 ? (free[src1] ?? 0) : 0;
                    const avail2 = src2 <= 24 && (b[src1] ?? 0) > -2 ? (free[src2] ?? 0) : 0;
                    if (avail1 + avail2 >= 2) {
                        rollMakesPoint = true;
                        targetHitCounts.set(pt, (targetHitCounts.get(pt) ?? 0) + weight);
                    }
                }
            }
            if (rollMakesPoint) break;
        }

        if (rollMakesPoint) rolls36 += weight;
    }

    const targetPoints = Array.from(targetHitCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map((e) => e[0]);

    return { rolls36, targetPoints };
}

export function evaluateOpponentThreats36(b: Int8Array | readonly number[]): {
    readonly hitRolls36: number;
    readonly directShots36: number;
    readonly jokerRolls36: number;
    readonly danceRolls36: number;
} {
    const oppB = new Int8Array(26);
    oppB[25] = (b[0] ?? 0) < 0 ? -(b[0] ?? 0) : 0;
    oppB[0] = (b[25] ?? 0) > 0 ? -(b[25] ?? 0) : 0;
    for (let i = 1; i <= 24; i++) {
        oppB[i] = -(b[25 - i] ?? 0);
    }

    let hitRolls36 = 0;
    let directShots36 = 0;
    let jokerRolls36 = 0;
    let danceRolls36 = 0;

    for (const [d1, d2, weight] of DICE_PAIRS) {
        if ((oppB[25] ?? 0) > 0) {
            const canEnterD1 = (oppB[25 - d1] ?? 0) >= -1;
            const canEnterD2 = (oppB[25 - d2] ?? 0) >= -1;
            if (!canEnterD1 && !canEnterD2) {
                danceRolls36 += weight;
                continue;
            }
        }

        let canHit = false;
        let canHitDirect = false;
        let canHitAndCover = false;

        for (let target = 1; target <= 24; target++) {
            if (oppB[target] === -1) {
                for (let src = target + 1; src <= 25; src++) {
                    const cOpp = (oppB[src] ?? 0) > 0 ? (oppB[src] ?? 0) : 0;
                    if (cOpp === 0) continue;
                    if ((oppB[25] ?? 0) > 0 && src !== 25) continue;

                    if (canReach(oppB, src, target, d1, d2)) {
                        canHit = true;
                        if (src - target <= 6) canHitDirect = true;

                        const dist = src - target;
                        const remDie = dist === d1 ? d2 : dist === d2 ? d1 : 0;
                        if (remDie > 0) {
                            const coverSrc = target + remDie;
                            if (
                                target <= 7 &&
                                coverSrc <= 24 &&
                                (oppB[coverSrc] ?? 0) >= (coverSrc === src ? 2 : 1)
                            ) {
                                canHitAndCover = true;
                            }
                            for (let innerPt = 1; innerPt <= 7; innerPt++) {
                                if (
                                    oppB[innerPt] === 1 &&
                                    innerPt + remDie <= 24 &&
                                    (oppB[innerPt + remDie] ?? 0) >= 2
                                ) {
                                    canHitAndCover = true;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (canHit) hitRolls36 += weight;
        if (canHitDirect) directShots36 += weight;
        if (canHitAndCover) jokerRolls36 += weight;
    }

    return { hitRolls36, directShots36, jokerRolls36, danceRolls36 };
}

export function computeLookahead36(
    boardPlayed: Int8Array | readonly number[],
    boardOptimal: Int8Array | readonly number[],
): Lookahead36Metrics {
    const consOpt = countConstructiveRolls36(boardOptimal);
    const consPlay = countConstructiveRolls36(boardPlayed);
    const oppOpt = evaluateOpponentThreats36(boardOptimal);
    const oppPlay = evaluateOpponentThreats36(boardPlayed);

    const deltaConstructive = consOpt.rolls36 - consPlay.rolls36;
    const deltaHit = oppPlay.hitRolls36 - oppOpt.hitRolls36;
    const deltaJoker = oppPlay.jokerRolls36 - oppOpt.jokerRolls36;

    let causalHeadlineFR = '';
    let causalHeadlineEN = '';

    if (deltaHit >= deltaConstructive && deltaHit > 0) {
        causalHeadlineFR =
            deltaJoker >= 2
                ? `Réduit les tirs adverses de ${oppPlay.hitRolls36}/36 à ${oppOpt.hitRolls36}/36 et supprime ${deltaJoker}/36 lancers « Joker » (frappe + porte).`
                : `Abaisse l'exposition immédiate de ${oppPlay.hitRolls36}/36 à ${oppOpt.hitRolls36}/36 lancers de frappe (${oppOpt.directShots36}/36 directs).`;
        causalHeadlineEN =
            deltaJoker >= 2
                ? `Cuts opponent hitting rolls from ${oppPlay.hitRolls36}/36 to ${oppOpt.hitRolls36}/36 and eliminates ${deltaJoker}/36 hit-and-cover Joker rolls.`
                : `Lowers immediate shot exposure from ${oppPlay.hitRolls36}/36 down to ${oppOpt.hitRolls36}/36 hitting rolls (${oppOpt.directShots36}/36 direct).`;
    } else {
        const pts = consOpt.targetPoints.length > 0 ? consOpt.targetPoints.join('/') : '5/7';
        causalHeadlineFR = `Porte vos lancers constructifs au tour suivant de ${consPlay.rolls36}/36 à ${consOpt.rolls36}/36 pour fermer les cases ${pts}.`;
        causalHeadlineEN = `Boosts your constructive rolls next turn from ${consPlay.rolls36}/36 to ${consOpt.rolls36}/36 to cover points ${pts}.`;
    }

    return {
        constructiveCoversOpt: consOpt.rolls36,
        constructiveCoversPlay: consPlay.rolls36,
        bestTargetPointsOpt: consOpt.targetPoints,
        oppHitRollsOpt: oppOpt.hitRolls36,
        oppHitRollsPlay: oppPlay.hitRolls36,
        oppDirectShotsOpt: oppOpt.directShots36,
        oppDirectShotsPlay: oppPlay.directShots36,
        oppJokerRollsOpt: oppOpt.jokerRolls36,
        oppJokerRollsPlay: oppPlay.jokerRolls36,
        oppDanceRollsOpt: oppOpt.danceRolls36,
        causalHeadlineFR,
        causalHeadlineEN,
    };
}

/**
 * Détection algorithmique d'un « Coup Brillant (!!) » en 4 portes mathématiques (Recherche #2, §1.3) :
 *   1. Choix non forcé et strictement optimal (|deltaEmg| <= 0.005).
 *   2. Surpasse le 2e meilleur coup légal d'au moins 0.025 EMG (ou 0.015 EMG pour un débutant).
 *   3. Sacrifice apparent de sécurité immédiate (laisse un tir direct, casse un point intérieur ou slotte 5/4/7).
 *   4. Justification profonde à 3-ply (duplication des dés adverses, prise de tempo/couverture >= 16/36, ou prime >= 4).
 */
export function detectBrilliantMove(params: {
    readonly boardBefore: Int8Array | readonly number[];
    readonly boardPlayed: Int8Array | readonly number[];
    readonly deltaEmgFromBest: number;
    readonly gapToSecondBestEmg: number;
    readonly isBeginnerProfile?: boolean;
}): BrilliantMoveEvaluation {
    if (Math.abs(params.deltaEmgFromBest) > 0.005) {
        return {
            isBrilliant: false,
            reasonCode: 'NOT_TOP_CHOICE',
            headlineFR: '',
            headlineEN: '',
        };
    }

    const minMargin = params.isBeginnerProfile ? 0.015 : 0.025;
    if (params.gapToSecondBestEmg < minMargin) {
        return {
            isBrilliant: false,
            reasonCode: 'MARGIN_TOO_SMALL',
            headlineFR: '',
            headlineEN: '',
        };
    }

    const threatsAfter = evaluateOpponentThreats36(params.boardPlayed);
    const threatsBefore = evaluateOpponentThreats36(params.boardBefore);
    const slottedKeyPoint = [5, 4, 7].some(
        (pt) => (params.boardBefore[pt] ?? 0) === 0 && (params.boardPlayed[pt] ?? 0) === 1,
    );
    const brokeInnerPoint = [1, 2, 3, 4, 5, 6].some(
        (pt) => (params.boardBefore[pt] ?? 0) >= 2 && (params.boardPlayed[pt] ?? 0) < 2,
    );
    const apparentSacrifice =
        threatsAfter.directShots36 > threatsBefore.directShots36 || slottedKeyPoint || brokeInnerPoint;

    if (!apparentSacrifice) {
        return {
            isBrilliant: false,
            reasonCode: 'NO_APPARENT_SACRIFICE',
            headlineFR: '',
            headlineEN: '',
        };
    }

    const dup = computeDuplication(params.boardPlayed);
    const covers = countConstructiveRolls36(params.boardPlayed);
    const primeLen = maxPrimeLength(params.boardPlayed);

    if (dup.overlapScore >= 1) {
        return {
            isBrilliant: true,
            reasonCode: 'BRILLIANT_DUPLICATION',
            headlineFR: `😱 Coup Brillant !! Sacrifice apparent justifié par la duplication des dés [${dup.duplicatedDice.join(', ')}].`,
            headlineEN: `😱 Brilliant Move !! Apparent risk justified by exact dice duplication [${dup.duplicatedDice.join(', ')}].`,
        };
    }

    if (slottedKeyPoint && covers.rolls36 >= 14) {
        return {
            isBrilliant: true,
            reasonCode: 'BRILLIANT_SLOT_TEMPO',
            headlineFR: `😱 Coup Brillant !! Slot audacieux qui ouvre ${covers.rolls36} lancers constructifs sur 36.`,
            headlineEN: `😱 Brilliant Move !! Bold slot unlocking ${covers.rolls36}/36 constructive covers next turn.`,
        };
    }

    if (primeLen >= 4) {
        return {
            isBrilliant: true,
            reasonCode: 'BRILLIANT_PRIME_SACRIFICE',
            headlineFR: `😱 Coup Brillant !! Risque calculé pour verrouiller un mur de ${primeLen} portes.`,
            headlineEN: `😱 Brilliant Move !! Calculated risk to lock down a ${primeLen}-prime wall.`,
        };
    }

    return {
        isBrilliant: false,
        reasonCode: 'NO_DEEP_JUSTIFICATION',
        headlineFR: '',
        headlineEN: '',
    };
}

/**
 * Garde-Fou Anti-Paranoïa #2 (Recherche #2, §2.4) :
 * Explique en direct la « Chance Apparente » du bot lorsqu'il réussit à couvrir un slot ou frapper
 * grâce à ses pions constructeurs pré-positionnés.
 */
export function explainBotApparentLuck36(
    botBoardAfterPreparation: Int8Array | readonly number[],
): BotApparentLuckExplanation {
    const { rolls36, targetPoints } = countConstructiveRolls36(botBoardAfterPreparation);
    const shouldDisplayTutorBubble = rolls36 >= 14;
    const ptLabel = targetPoints[0] ?? 5;
    return {
        constructiveRolls36: rolls36,
        shouldDisplayTutorBubble,
        messageFR: `Bien préparé : grâce à la position de ses pions de réserve, le bot avait ${rolls36} lancers sur 36 pour couvrir la case ${ptLabel} !`,
        messageEN: `Well prepared: thanks to its spare builders, the bot had ${rolls36} rolls out of 36 to cover point ${ptLabel}!`,
    };
}

