/**
 * @file src/features/drills/bgsage3PlyQuizValidator.ts
 * @description Sas Coupe-Circuit (`FlashLite-Single-Quiz-Inspector`) :
 * Auto-test individuel de chaque quiz un par un via `validateSingleQuizStrict(quiz)` (14 contrôles unitaires `14/14 PASS`).
 * Si un candidat échoue à UN SEUL de ces 14 contrôles, il lève une erreur et est détruit (`REJECTED`).
 * Strictement <= 220 lignes, 0 `any` (GOVERNANCE.md & SCALABILITY.md).
 */

import { applyMove, pipCount, parseXGID, generateLegalMoves } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../coach/coachMoveNotation';
import { isContactPosition, resolveSemanticArchetype, validateBoardState } from './drillSubAgentsPipeline';
import {
    expandMoveNotationTokens,
    computeBoardSignatureAfterMove,
    extractGeometric36Rolls,
    formatUiQuizLevelBadge,
    type Certified3PlyQuiz,
} from './bgsage3PlyQuizFactoryCore';

/**
 * Sas Coupe-Circuit : Auto-Test Individuel de chaque quiz un par un (`validateSingleQuizStrict(quiz)` — 14 Contrôles).
 */
export function validateSingleQuizStrict(quiz: Certified3PlyQuiz): void {
    // Contrôle #1 — Zéro Ouverture / Zéro Tour 1 à 4
    if (!(quiz.plyCount >= 6 && (quiz.whitePips <= 150 || quiz.blackPips <= 150))) {
        throw new Error(`CHECK_1_REJECTED (Opening/Turn 1-4): plyCount=${quiz.plyCount}, W=${quiz.whitePips}, B=${quiz.blackPips}`);
    }

    // Contrôle #2 — Intégrité Physique du Plateau (15 pions exacts & XGID valide)
    const parsed = parseXGID(quiz.xgid);
    const boardReport = validateBoardState(parsed.board, parsed.turn);
    if (!boardReport.isValid15Checkers || boardReport.whiteCheckersTotal !== 15 || boardReport.blackCheckersTotal !== 15) {
        throw new Error(`CHECK_2_REJECTED (15 checkers): W=${boardReport.whiteCheckersTotal}, B=${boardReport.blackCheckersTotal}`);
    }

    // Contrôle #3 — Cohérence Unique du Pip Count
    const pipsObj = pipCount(boardReport.normalizedBoard);
    const expectedPipText = `${pipsObj.X} vs ${pipsObj.O} pips`;
    if (
        quiz.whitePips !== pipsObj.X ||
        quiz.blackPips !== pipsObj.O ||
        quiz.geometry36.whitePips !== pipsObj.X ||
        quiz.geometry36.blackPips !== pipsObj.O ||
        quiz.pipCountDisplayed !== expectedPipText ||
        quiz.pipCountText !== expectedPipText ||
        !quiz.coachExplanation3Ply.includes(expectedPipText)
    ) {
        throw new Error(`CHECK_3_REJECTED (PipCount mismatch): recalc=${expectedPipText}, displayed=${quiz.pipCountDisplayed}`);
    }

    // Contrôle #4 — Zéro Course Pure / Vrai Contact Tactique
    if (quiz.isContact !== true || !isContactPosition(boardReport.normalizedBoard)) {
        throw new Error(`CHECK_4_REJECTED (Pure race forbidden): ${quiz.id}`);
    }

    // Contrôle #5 — Vrai Choix Non-Trivial (>= 4 choix légaux Pions ou >= 3 choix réels Videau, et |ΔE_1,2| <= 0.140)
    const minChoices = quiz.quizType === 'CUBE_DECISION' ? 3 : 4;
    if (quiz.legalMoves3Ply.length < minChoices || quiz.quizChoices.length < minChoices) {
        throw new Error(`CHECK_5_REJECTED (< ${minChoices} legal moves): count=${quiz.legalMoves3Ply.length}`);
    }
    const move1 = quiz.legalMoves3Ply[0]!;
    const move2 = quiz.legalMoves3Ply[1]!;
    const gap12 = Math.abs(move1.deltaEmg - move2.deltaEmg);
    if (gap12 > 0.140) {
        throw new Error(`CHECK_5_REJECTED (Gap12 > 0.140 EMG): gap12=${gap12.toFixed(4)}`);
    }

    // Contrôle #6 — Vraie Évaluation 3-PLY Réelle & Monotonie stricte des ΔEMG
    if (quiz.evaluatedPly !== 3 || move1.deltaEmg !== 0) {
        throw new Error(`CHECK_6_REJECTED (evaluatedPly !== 3 or move1.deltaEmg !== 0)`);
    }
    for (let i = 0; i < quiz.legalMoves3Ply.length; i++) {
        const m = quiz.legalMoves3Ply[i]!;
        if (m.evaluatedPly !== 3) {
            throw new Error(`CHECK_6_REJECTED (move #${i + 1} evaluatedPly !== 3)`);
        }
        if (Math.abs(m.probabilities.win + m.probabilities.loseWin - 1) > 0.001) {
            throw new Error(
                `CHECK_6_REJECTED (win + loseWin !== 1.000 at rank ${i + 1}: win=${m.probabilities.win}, loseWin=${m.probabilities.loseWin})`,
            );
        }
        if (i > 0 && !(m.deltaEmg <= quiz.legalMoves3Ply[i - 1]!.deltaEmg && m.deltaEmg < 0)) {
            throw new Error(`CHECK_6_REJECTED (Non-monotonic deltaEmg at rank ${i + 1}: ${m.deltaEmg})`);
        }
    }

    // Contrôle #7 — Double Vérification Croisée avec gnubg-cli.exe sur le Coup #1 (<= 0.025 EMG)
    if (
        !quiz.gnubg3PlyVerification ||
        !quiz.gnubg3PlyVerification.isAgreementValid ||
        quiz.gnubg3PlyVerification.top1DisagreementEmg > 0.025
    ) {
        throw new Error(`CHECK_7_REJECTED (GNUBG 3-ply disagreement > 0.025 EMG): ${quiz.gnubg3PlyVerification?.top1DisagreementEmg}`);
    }

    // Contrôle #11 — 80 % Quiz Pions (CHECKER_PLAY) + 20 % Quiz Videau (CUBE_DECISION)
    if (quiz.quizType !== 'CHECKER_PLAY' && quiz.quizType !== 'CUBE_DECISION') {
        throw new Error(`CHECK_11_REJECTED (Invalid quizType=${String(quiz.quizType)})`);
    }

    // Contrôle #12 — Pas de faux Ex-Aequo (choice[1].loss >= 0.003 et |ΔE_1,2| >= 0.008 EMG)
    if (Math.abs(move2.equityLoss) < 0.003 || gap12 < 0.008) {
        throw new Error(`CHECK_12_REJECTED (False tie / Ex-aequo: loss2=${move2.equityLoss}, gap12=${gap12.toFixed(4)})`);
    }

    // Contrôle #8 & Contrôle #13 — Légalité Réelle des Déplacements & Zéro Coup Transposé Identique
    if (quiz.quizType === 'CHECKER_PLAY') {
        const legalEngineSets = generateLegalMoves(parsed, [quiz.dice[0], quiz.dice[1]]);
        if (legalEngineSets.length < 4) {
            throw new Error(`CHECK_8_REJECTED (Engine legalMoves < 4)`);
        }
        const finalBoardSignatures = new Set<string>();
        for (const choiceNotation of quiz.quizChoices) {
            const steps = parseCoachNotationMoves(expandMoveNotationTokens(choiceNotation), 'X');
            if (steps.length === 0) {
                throw new Error(`CHECK_8_REJECTED (Unparseable move notation: ${choiceNotation})`);
            }
            let simBoard = [...boardReport.normalizedBoard];
            for (const step of steps) {
                if ((simBoard[step.from] ?? 0) <= 0) {
                    throw new Error(`CHECK_8_REJECTED (No checker on point ${step.from} for ${choiceNotation})`);
                }
                if (step.to >= 1 && step.to <= 24 && (simBoard[step.to] ?? 0) < -1) {
                    throw new Error(`CHECK_8_REJECTED (Blocked destination ${step.to} for ${choiceNotation})`);
                }
                simBoard = applyMove(simBoard, step, 'X');
            }
            if (!validateBoardState(simBoard, 'X').isValid15Checkers) {
                throw new Error(`CHECK_8_REJECTED (Post-move checker count invalid for ${choiceNotation})`);
            }
            finalBoardSignatures.add(computeBoardSignatureAfterMove(boardReport.normalizedBoard, choiceNotation));
        }
        if (finalBoardSignatures.size !== 4) {
            throw new Error(`CHECK_13_REJECTED (Transposed identical final board detected among 4 choices on ${quiz.id})`);
        }
    } else {
        // CUBE_DECISION : videau disponible, dés à 00 dans le XGID, et 3 actions cubeful distinctes
        if (quiz.competition.crawford || quiz.competition.cubeOwner === 'O' || !quiz.xgid.includes(':00:')) {
            throw new Error(`CHECK_8_REJECTED (Cube unavailable or non-00 dice in XGID on ${quiz.id})`);
        }
        if (new Set(quiz.quizChoices).size < 3) {
            throw new Error(`CHECK_13_REJECTED (Duplicate cube decision choices on ${quiz.id})`);
        }
    }

    // Contrôle #9 — Cohérence Géométrique Texte Coach <-> Pions Réels & Interdiction "0/36 lancers constructifs"
    const resolved = resolveSemanticArchetype(boardReport.normalizedBoard, {
        conceptId: quiz.conceptId,
        conceptName: quiz.conceptName,
        optimalMove: quiz.optimalMove,
    });
    const hasZeroConstructiveText =
        quiz.coachExplanation3Ply.includes('0/36 lancers constructifs') ||
        quiz.socraticHint.includes('0/36 lancers constructifs');
    const expectedGeomToken =
        quiz.geometry36.constructiveRollsOn36 > 0
            ? `${quiz.geometry36.constructiveRollsOn36}/36`
            : `${quiz.geometry36.directShotsOn36}/36`;
    if (resolved.archetype === 'PURE_RACE' || hasZeroConstructiveText || !quiz.coachExplanation3Ply.includes(expectedGeomToken)) {
        throw new Error(`CHECK_9_REJECTED (Geometric coach text mismatch or 0/36 constructive text on ${quiz.id})`);
    }

    // Contrôle #10 — Validation du quizTargetER (0.5..25.0 par pas de 0.5), Format [0,3,5,7,9,11,21] & Zéro ERH
    const allowedMatchLengths: readonly number[] = [0, 3, 5, 7, 9, 11, 21];
    const hasErhField =
        (quiz as { erh?: unknown }).erh !== undefined ||
        (quiz as { targetErh?: unknown }).targetErh !== undefined ||
        quiz.legalMoves3Ply.some((m) => (m as { erh?: unknown; erhScore?: unknown }).erh !== undefined || (m as { erhScore?: unknown }).erhScore !== undefined);
    if (
        typeof quiz.quizTargetER !== 'number' ||
        quiz.quizTargetER < 0.5 ||
        quiz.quizTargetER > 25.0 ||
        (quiz.quizTargetER * 2) % 1 !== 0 ||
        !allowedMatchLengths.includes(quiz.matchLength) ||
        hasErhField
    ) {
        throw new Error(`CHECK_10_REJECTED (Invalid quizTargetER=${quiz.quizTargetER}, matchLength=${quiz.matchLength}, or ERH present)`);
    }

    // Contrôle #14 — Affichage UI du Niveau du Quiz & Orientation Canonique (Sans Spoiler avant clic)
    const expectedBadge = formatUiQuizLevelBadge(quiz.quizTargetER);
    const hasSpoilerInChoices = quiz.quizChoices.some((c) => /EMG|ER\s*\/?\s*PR|\+0\.|\-0\./i.test(c));
    if (
        parsed.turn !== 'X' ||
        quiz.canonicalTurn !== 'X' ||
        quiz.canonicalDirection !== 'Case 24 ➔ Case 1' ||
        quiz.uiQuizLevelBadge !== expectedBadge ||
        hasSpoilerInChoices
    ) {
        throw new Error(`CHECK_14_REJECTED (Canonical orientation or UI badge/spoiler failure on ${quiz.id})`);
    }
}

export const assertQuizPassesQALoop = validateSingleQuizStrict;
