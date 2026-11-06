/**
 * @file src/features/drills/__tests__/day31_bgsage_jsonl_quiz_bank_gates.test.ts
 * @description MISSION 31/50 : CONTRÔLE DU BRANCHEMENT RÉEL DE `bgsage_3ply_er_factory.jsonl`
 * ET FILTRAGE PAR PORTE (BEGINNER, INTERMEDIATE, EXPERT).
 *
 * Vérifications :
 *   1. Lecture exhaustive des milliers de quiz 3-ply dans data/quizzes/bgsage_3ply_er_factory.jsonl (> 25 000 quiz).
 *   2. Absence totale de doublons `XGID + dice` (unicité mathématique stricte).
 *   3. Répartition exacte par Porte :
 *      - Porte 1 (`BEGINNER`)     : quiz `ER 13.0–20.0`
 *      - Porte 2 (`INTERMEDIATE`) : quiz `ER 6.0–13.0`
 *      - Porte 3 (`EXPERT`)       : quiz `ER 0.5–6.0` (incluant `CHECKER_PLAY` et `CUBE_DECISION`).
 *   4. Validation unitaire des fonctions de filtrage `quizTierGates.ts`.
 *
 * Strictement <= 300 lignes, 0 `any`.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {
    isQuizInPorteGate,
    getQuizPorteGate,
    normalizePorteGate,
    PORTE_GATES_CONFIG,
    type QuizPorteGate,
} from '../quizTierGates';

const JSONL_PATH = path.join(process.cwd(), 'data', 'quizzes', 'bgsage_3ply_er_factory.jsonl');

interface RawQuizLine {
    id: string;
    xgid: string;
    dice: [number, number];
    quizType: 'CHECKER_PLAY' | 'CUBE_DECISION';
    quizTargetER: number;
    targetBracket: string;
    optimalMove: string;
    quizChoices: string[];
    plyCount: number;
    evaluatedPly: number;
    legalMoves3Ply?: Array<{
        rank: number;
        notation: string;
        equity: number;
        evaluatedPly: number;
    }>;
}

describe('MISSION 31/50 : Certification Usine Quiz 3-Ply & Filtrage par Porte', () => {
    it('1. Valide les règles unitaires du module quizTierGates (seuils ER et normalisation)', () => {
        // Normalisation
        expect(normalizePorteGate('1')).toBe('BEGINNER');
        expect(normalizePorteGate('BEGINNER')).toBe('BEGINNER');
        expect(normalizePorteGate('debutant')).toBe('BEGINNER');
        expect(normalizePorteGate('2')).toBe('INTERMEDIATE');
        expect(normalizePorteGate('INTERMEDIATE')).toBe('INTERMEDIATE');
        expect(normalizePorteGate('club')).toBe('INTERMEDIATE');
        expect(normalizePorteGate('3')).toBe('EXPERT');
        expect(normalizePorteGate('EXPERT')).toBe('EXPERT');
        expect(normalizePorteGate('master')).toBe('EXPERT');
        expect(normalizePorteGate('unknown')).toBeNull();

        // Classification par ER
        expect(getQuizPorteGate(15.0)).toBe('BEGINNER');
        expect(getQuizPorteGate(13.0)).toBe('BEGINNER');
        expect(getQuizPorteGate(9.5)).toBe('INTERMEDIATE');
        expect(getQuizPorteGate(6.0)).toBe('INTERMEDIATE');
        expect(getQuizPorteGate(3.5)).toBe('EXPERT');
        expect(getQuizPorteGate(0.5)).toBe('EXPERT');

        // Test d'appartenance Porte 1 (BEGINNER : ER 13.0–20.0)
        expect(isQuizInPorteGate({ quizTargetER: 16.0 }, 'BEGINNER')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 13.0 }, 1)).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 20.0 }, 'BEGINNER')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 12.9 }, 'BEGINNER')).toBe(false);

        // Test d'appartenance Porte 2 (INTERMEDIATE : ER 6.0–13.0)
        expect(isQuizInPorteGate({ quizTargetER: 8.5 }, 'INTERMEDIATE')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 6.0 }, 2)).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 13.0 }, 'INTERMEDIATE')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 5.9 }, 'INTERMEDIATE')).toBe(false);
        expect(isQuizInPorteGate({ quizTargetER: 13.5 }, 'INTERMEDIATE')).toBe(false);

        // Test d'appartenance Porte 3 (EXPERT : ER 0.5–6.0)
        expect(isQuizInPorteGate({ quizTargetER: 2.0, quizType: 'CHECKER_PLAY' }, 'EXPERT')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 3.5, quizType: 'CUBE_DECISION' }, 'EXPERT')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 0.5 }, 3)).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 6.0 }, 'EXPERT')).toBe(true);
        expect(isQuizInPorteGate({ quizTargetER: 0.4 }, 'EXPERT')).toBe(false);
        expect(isQuizInPorteGate({ quizTargetER: 7.0 }, 'EXPERT')).toBe(false);
    });

    it('2. Lit l’intégralité de bgsage_3ply_er_factory.jsonl, certifie 0 doublon XGID+dice et répartition par Porte', async () => {
        expect(fs.existsSync(JSONL_PATH)).toBe(true);

        const fileStream = fs.createReadStream(JSONL_PATH, { encoding: 'utf8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        let totalParsed = 0;
        let malformedLines = 0;
        let invalidQuizzes = 0;
        const seenKeys = new Set<string>();
        let duplicateCount = 0;

        let countPorte1 = 0; // BEGINNER: ER 13.0–20.0
        let countPorte2 = 0; // INTERMEDIATE: ER 6.0–13.0
        let countPorte3 = 0; // EXPERT: ER 0.5–6.0
        let cubeInPorte3 = 0;
        let checkerInPorte3 = 0;

        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            totalParsed++;
            let quiz: RawQuizLine;
            try {
                quiz = JSON.parse(trimmed) as RawQuizLine;
            } catch {
                malformedLines++;
                continue;
            }

            // Invariants obligatoires d'un quiz certifié 3-ply
            if (
                !quiz.id ||
                !quiz.xgid ||
                !Array.isArray(quiz.dice) ||
                quiz.dice.length !== 2 ||
                !quiz.optimalMove ||
                !Array.isArray(quiz.quizChoices) ||
                quiz.quizChoices.length < 3 ||
                quiz.evaluatedPly !== 3
            ) {
                invalidQuizzes++;
            }

            // Invariant d'unicité physique : xgid + dice
            const uniqueKey = `${quiz.xgid}|${quiz.dice[0]},${quiz.dice[1]}`;
            if (seenKeys.has(uniqueKey)) {
                duplicateCount++;
            } else {
                seenKeys.add(uniqueKey);
            }

            // Répartition par Porte
            const er = quiz.quizTargetER;
            if (!Number.isFinite(er) || er < 0.5 || er > 25.0) {
                invalidQuizzes++;
            }

            if (isQuizInPorteGate(quiz, 'BEGINNER')) {
                countPorte1++;
            }
            if (isQuizInPorteGate(quiz, 'INTERMEDIATE')) {
                countPorte2++;
            }
            if (isQuizInPorteGate(quiz, 'EXPERT')) {
                countPorte3++;
                if (quiz.quizType === 'CUBE_DECISION') {
                    cubeInPorte3++;
                } else {
                    checkerInPorte3++;
                }
            }
        }

        // 1. Zéro ligne malformée et volume massif (> 25 000 quiz certifiés)
        expect(malformedLines).toBe(0);
        expect(invalidQuizzes).toBe(0);
        expect(totalParsed).toBeGreaterThan(25000);

        // 2. Absence totale de doublons
        expect(duplicateCount).toBe(0);
        expect(seenKeys.size).toBe(totalParsed);

        // 3. Répartition équilibrée par Porte
        // Porte 1 (BEGINNER) : milliers de quiz fondamentaux
        expect(countPorte1).toBeGreaterThan(3000);
        // Porte 2 (INTERMEDIATE) : milliers de quiz tactiques
        expect(countPorte2).toBeGreaterThan(8000);
        // Porte 3 (EXPERT) : milliers de quiz World-Class
        expect(countPorte3).toBeGreaterThan(10000);

        // 4. Porte 3 inclut obligatoirement CHECKER_PLAY ET CUBE_DECISION
        expect(checkerInPorte3).toBeGreaterThan(5000);
        expect(cubeInPorte3).toBeGreaterThan(500);

        // Log de synthèse certifiée
        console.log(`=== RAPPORT DE CERTIFICATION USINE 3-PLY (MISSION 31/50) ===`);
        console.log(`Total quiz lus sur disque : ${totalParsed}`);
        console.log(`Clés uniques (XGID + dés) : ${seenKeys.size} (Doublons : ${duplicateCount})`);
        console.log(`Porte 1 (Débutant ER 13.0–20.0) : ${countPorte1} quiz`);
        console.log(`Porte 2 (Intermédiaire ER 6.0–13.0) : ${countPorte2} quiz`);
        console.log(`Porte 3 (Expert ER 0.5–6.0) : ${countPorte3} quiz (${checkerInPorte3} pions, ${cubeInPorte3} videau)`);
    }, 20000);
});
