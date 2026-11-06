/**
 * @file src/lib/__tests__/day32_coach_500_quizzes_truth_audit.test.ts
 * @description MISSION 32/50 : AUDIT AUTOMATIQUE DE VÉRITÉ DES EXPLICATIONS DU COACH SUR 500 QUIZ (ZÉRO HALLUCINATION).
 *
 * Invariants audités sur 500 quiz réels en FR et en EN :
 *   1. Citation exacte du coup #1 (optimalMove).
 *   2. Vérité physique absolue des flèches : aucune case p n'est qualifiée de « pion isolé (blot) » si boardAfterMove[p] !== 1.
 *   3. En mode Débutant : explication stricte entre 15 et 35 mots, avec ZÉRO mot de jargon interdit ('EMG', 'E-R-H', '3-ply', 'cubeful', 'MWC').
 *
 * Strictement <= 350 lignes, 0 any.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
    translateCoachExplanationForBeginner,
    countExplanationWords,
    containsForbiddenJargon,
    BEGINNER_STRICT_FORBIDDEN_WORDS,
} from '../../features/coach/beginnerCoachTranslator';
import { generateRuleBasedExplanation } from '../../features/coach/ruleBasedExplanation';
import { parseXGID, applyMove, type Player } from '../../engine/backgammonEngine';
import { parseCoachNotationMoves } from '../../features/coach/coachMoveNotation';

const JSONL_PATH = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');

interface FactoryQuizLine {
    readonly id: string;
    readonly xgid: string;
    readonly dice: readonly [number, number];
    readonly quizType: 'CHECKER_PLAY' | 'CUBE_DECISION';
    readonly quizTargetER: number;
    readonly optimalMove: string;
    readonly conceptId?: string;
    readonly legalMoves3Ply?: ReadonlyArray<{
        readonly rank: number;
        readonly notation: string;
        readonly finalBoardSignature?: string;
    }>;
}

function resolveBoardAfterOptimalMove(quiz: FactoryQuizLine): number[] {
    const topMove = quiz.legalMoves3Ply?.[0];
    if (topMove?.finalBoardSignature) {
        const boardStr = topMove.finalBoardSignature.split('|')[0];
        if (boardStr) {
            return boardStr.split(',').map((v) => parseInt(v, 10));
        }
    }

    // Calcul de repli via parseXGID et simulateur de coups
    try {
        const parsed = parseXGID(quiz.xgid);
        let sim = [...parsed.board];
        if (quiz.quizType === 'CHECKER_PLAY' && quiz.optimalMove) {
            const steps = parseCoachNotationMoves(quiz.optimalMove, 'X');
            for (const s of steps) {
                sim = applyMove(sim, s, 'X');
            }
        }
        return sim;
    } catch {
        return new Array<number>(26).fill(0);
    }
}

function extractClaimedBlotPoints(text: string): number[] {
    const blotRegex = /(?:pion(?:s)?\s+isolé(?:s)?|blot(?:s)?)\s+(?:sur\s+(?:(?:la|le|les)\s+)?flèche(?:s)?|point(?:s)?)\s+([0-9,\s–etand]+)/gi;
    const claimed: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = blotRegex.exec(text)) !== null) {
        const numbers = match[1]?.match(/\b\d{1,2}\b/g) ?? [];
        for (const num of numbers) {
            const pt = parseInt(num, 10);
            if (pt >= 1 && pt <= 24) {
                claimed.push(pt);
            }
        }
    }
    return claimed;
}

describe('MISSION 32/50 : Audit de Vérité des Explications Coach sur 500 Quiz Réels', () => {
    it('audit 500 quiz réels du jsonl en FR et EN pour 0 hallucination, citation exacte et calibrage débutant', async () => {
        expect(fs.existsSync(JSONL_PATH)).toBe(true);

        const fileStream = fs.createReadStream(JSONL_PATH, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        const quizzes: FactoryQuizLine[] = [];
        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            quizzes.push(JSON.parse(trimmed) as FactoryQuizLine);
            if (quizzes.length >= 500) break;
        }

        expect(quizzes.length).toBe(500);

        let auditedCount = 0;
        let blotCheckPassed = 0;
        let optimalMoveCitations = 0;
        let lengthComplianceCount = 0;
        let zeroJargonViolations = 0;

        for (const quiz of quizzes) {
            auditedCount++;
            const boardAfter = resolveBoardAfterOptimalMove(quiz);

            for (const lang of ['fr', 'en'] as const) {
                // 1. Génération via beginnerCoachTranslator
                const explanation = translateCoachExplanationForBeginner({
                    optimalMove: quiz.optimalMove,
                    quizType: quiz.quizType,
                    conceptId: quiz.conceptId,
                    boardAfterMove: boardAfter,
                    language: lang,
                });

                // Invariant 1 : Citation exacte de la notation du coup #1 (optimalMove)
                expect(explanation).toContain(quiz.optimalMove);
                optimalMoveCitations++;

                // Invariant 2 : Zéro fausse allégation de blot (aucune flèche p qualifiée de blot si boardAfterMove[p] !== 1)
                const claimedBlotPoints = extractClaimedBlotPoints(explanation);
                for (const pt of claimedBlotPoints) {
                    // La case doit obligatoirement posséder exactement 1 pion du joueur
                    expect(boardAfter[pt]).toBe(1);
                }
                blotCheckPassed++;

                // Invariant 3 : Longueur cognitive stricte (15 à 35 mots)
                const wordCount = countExplanationWords(explanation);
                expect(wordCount).toBeGreaterThanOrEqual(15);
                expect(wordCount).toBeLessThanOrEqual(35);
                lengthComplianceCount++;

                // Invariant 4 : Zéro mot de jargon interdit ('EMG', 'E-R-H', '3-ply', 'cubeful', 'MWC')
                const hasJargon = containsForbiddenJargon(explanation);
                expect(hasJargon).toBe(false);
                for (const forbidden of BEGINNER_STRICT_FORBIDDEN_WORDS) {
                    const regex = new RegExp(`(?<!\\p{L})${forbidden}(?!\\p{L})`, 'iu');
                    expect(regex.test(explanation)).toBe(false);
                }
                zeroJargonViolations++;

                // 2. Génération via ruleBasedExplanation en playerLevel: 'beginner'
                const ruleBased = generateRuleBasedExplanation({
                    verdict: 'optimal',
                    equityLoss: 0,
                    optimalMove: quiz.optimalMove,
                    playedMove: quiz.optimalMove,
                    language: lang,
                    playerLevel: 'beginner',
                    features: {
                        player: 'X',
                        pipCountDiff: { player: 150, opponent: 150, leader: 'tie', diff: 0 },
                        blotsAndShots: { user: [], best: [] },
                        boardStructure: { innerBoardPoints: 2, advancedAnchor: false, goldenPoint: false, barPoint: false, longestPrime: 2 },
                        contactStatus: 'contact',
                    },
                });

                expect(ruleBased.explanation).toContain(quiz.optimalMove);
                const rbWords = countExplanationWords(ruleBased.explanation);
                expect(rbWords).toBeGreaterThanOrEqual(15);
                expect(rbWords).toBeLessThanOrEqual(35);
                expect(containsForbiddenJargon(ruleBased.explanation)).toBe(false);
            }
        }

        console.log(`=== RAPPORT D'AUDIT DE VÉRITÉ COACH (MISSION 32/50) ===`);
        console.log(`Quiz audités en production : ${auditedCount} / 500`);
        console.log(`Citations exactes coup #1 vérifiées : ${optimalMoveCitations} / 1000 (FR + EN)`);
        console.log(`Audits physiques de flèches & blots : ${blotCheckPassed} / 1000 PASS`);
        console.log(`Conformité longueur cognitive (15–35 mots) : ${lengthComplianceCount} / 1000 PASS`);
        console.log(`Zéro jargon interdit vérifié : ${zeroJargonViolations} / 1000 PASS`);
    }, 20000);
});
