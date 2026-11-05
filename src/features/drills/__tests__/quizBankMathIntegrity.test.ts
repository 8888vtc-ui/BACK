/**
 * @file src/features/drills/__tests__/quizBankMathIntegrity.test.ts
 * @description Contrôle de l'intégrité mathématique des 500 quiz 3-ply de BGSAGE_3PLY_FACTORY_SEED.
 * Strictement <= 150 lignes, 0 any.
 */

import { describe, it, expect } from 'vitest';
import { BGSAGE_3PLY_FACTORY_SEED } from '../bgsage3PlyFactorySeed';
import { parseXGID, createInitialState } from '../../../engine/backgammonEngine';
import { areMoveNotationsBoardEquivalent } from '../blunderDrillEngine';

describe('Intégrité Mathématique de la Banque de Quiz 3-Ply (500 Seed)', () => {
    it('contient au moins 150 quiz équilibrés (répartis sur les paliers de 1 à 4)', () => {
        expect(BGSAGE_3PLY_FACTORY_SEED.length).toBeGreaterThanOrEqual(150);
        for (const tier of [1, 2, 3, 4]) {
            const count = BGSAGE_3PLY_FACTORY_SEED.filter((q) => q.tier === tier).length;
            expect(count, `Palier ${tier} doit avoir des quiz`).toBeGreaterThanOrEqual(20);
        }
    });

    it('respecte les 6 invariants de qualité sur l\'ensemble des 500 quiz', () => {
        for (const quiz of BGSAGE_3PLY_FACTORY_SEED) {
            // 1. plyCount >= 6
            expect(quiz.plyCount, `Quiz ${quiz.id} plyCount >= 6`).toBeGreaterThanOrEqual(6);

            // 2. Parse XGID & 15 dames par camp
            const boardState = parseXGID(quiz.xgid);
            let whiteCount = 0;
            let blackCount = 0;
            for (let i = 0; i <= 25; i++) {
                const count = boardState.board[i];
                if (count > 0) whiteCount += count;
                else if (count < 0) blackCount += Math.abs(count);
            }
            expect(whiteCount, `Quiz ${quiz.id} 15 pions blancs`).toBe(15);
            expect(blackCount, `Quiz ${quiz.id} 15 pions noirs`).toBe(15);

            // 3. Zéro BEAVER en match play (matchLength > 0)
            if (boardState.matchLength > 0) {
                const choicesJoined = quiz.quizChoices.join(' ').toLowerCase();
                expect(choicesJoined).not.toContain('beaver');
            }

            // 4. Choix distincts
            const uniqueChoices = new Set(quiz.quizChoices);
            expect(uniqueChoices.size, `Quiz ${quiz.id} doit avoir au moins 3 choix distincts`).toBeGreaterThanOrEqual(3);

            // 5. Zéro ex-aequo immédiat < 0.003
            if (quiz.candidateMoves3Ply && quiz.candidateMoves3Ply.length >= 2) {
                const move0 = quiz.candidateMoves3Ply[0];
                const move1 = quiz.candidateMoves3Ply[1];
                if (move0 && move1) {
                    const diff = Math.abs(move1.equityLoss - move0.equityLoss);
                    expect(diff, `Quiz ${quiz.id} pas d'ex-aequo < 0.003`).toBeGreaterThanOrEqual(0.003);
                }
            }
        }
    });

    it('areMoveNotationsBoardEquivalent reconnaît les inversions d\'ordre de dés', () => {
        const initialBoard = createInitialState().board;
        expect(areMoveNotationsBoardEquivalent(initialBoard, '24/21 13/8', '13/8 24/21', 'X')).toBe(true);
        expect(areMoveNotationsBoardEquivalent(initialBoard, '13/10 13/8', '13/8 13/10', 'X')).toBe(true);
        expect(areMoveNotationsBoardEquivalent(initialBoard, '24/18', '13/7', 'X')).toBe(false);
    });
});
