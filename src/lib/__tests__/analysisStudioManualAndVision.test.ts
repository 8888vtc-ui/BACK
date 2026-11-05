/**
 * @file src/lib/__tests__/analysisStudioManualAndVision.test.ts
 * @description Tests unitaires pour le Studio d'Analyse :
 * - Vidage de plateau en réserves de 15 dames.
 * - Complétion automatique à 15 pions dans les sabots de Sortie.
 * - Normalisation de vision IA garantissant l'invariant strict de 15 pions par camp.
 * - Exclusion mathématique absolue de coups illégaux (ex: #5 24/20 sur 3-1).
 */

import { describe, it, expect } from 'vitest';
import {
    clearBoardToTrays,
    getInitialStartingBoard,
    countCheckers,
    autoCompleteRemainingToOff,
    normalizeVisionBoardTo15Checkers,
    computeLegalCandidateMovesTop5,
} from '../analysis/analysisStudioEngine';
import { generateLegalMoves, createInitialState } from '../../engine/backgammonEngine';
import { formatMoveSequenceNotationWithHits } from '../engine/evaluator';

describe('Studio d\'Analyse — Moteur Manuel & Vision IA', () => {
    it('1. clearBoardToTrays() vide les 24 flèches et place 15 Blancs et 15 Noirs dans les réserves', () => {
        const { board, tray } = clearBoardToTrays();
        expect(tray.white).toBe(15);
        expect(tray.black).toBe(15);

        for (let pt = 1; pt <= 24; pt++) {
            expect(board[pt]).toBe(0);
        }

        const counts = countCheckers(board);
        expect(counts.whiteOnBoard).toBe(0);
        expect(counts.blackOnBoard).toBe(0);
        expect(counts.whiteInTray).toBe(15);
        expect(counts.blackInTray).toBe(15);
    });

    it('2. autoCompleteRemainingToOff() produit toujours un plateau 100 % légal à 15 Blancs / 15 Noirs', () => {
        const { board } = clearBoardToTrays();
        // Pose manuelle de seulement 5 pions Blancs et 6 pions Noirs
        board[6] = 3;  // 3 Blancs en 6
        board[8] = 2;  // 2 Blancs en 8
        board[13] = -4; // 4 Noirs en 13
        board[20] = -2; // 2 Noirs en 20

        const countsBefore = countCheckers(board);
        expect(countsBefore.whiteOnBoard).toBe(5);
        expect(countsBefore.blackOnBoard).toBe(6);
        expect(countsBefore.isComplete15).toBe(false);

        // Appel du bouton magique "Ranger le reste dans la Sortie"
        const completedBoard = autoCompleteRemainingToOff(board);
        const countsAfter = countCheckers(completedBoard, { white: 0, black: 0 });

        expect(countsAfter.whiteTotal).toBe(15);
        expect(countsAfter.blackTotal).toBe(15);
        expect(countsAfter.whiteOff).toBe(10); // 15 - 5 = 10
        expect(countsAfter.blackOff).toBe(9);  // 15 - 6 = 9
        expect(countsAfter.whiteInTray).toBe(0);
        expect(countsAfter.blackInTray).toBe(0);
        expect(countsAfter.isComplete15).toBe(true);
    });

    it('3. normalizeVisionBoardTo15Checkers() corrige toute photo partielle en un état exact de 15 pions par camp', () => {
        // Simulation d'une photo où l'IA n'a vu que 12 pions Blancs et 13 pions Noirs
        const partialVision = {
            points: [
                -2, 0, 0, 0, 0, 5,  // Flèches 1-6 (2 Noirs en 1, 5 Blancs en 6)
                0, 3, 0, 0, 0, -4,  // Flèches 7-12 (3 Blancs en 8, 4 Noirs en 12)
                4, 0, 0, 0, -3, 0,  // Flèches 13-18 (4 Blancs en 13, 3 Noirs en 17)
                -4, 0, 0, 0, 0, 0,  // Flèches 19-24 (4 Noirs en 19)
            ],
            bar: { player: 0, opponent: 0 },
            dice: [5, 2] as [number, number],
            cubeValue: 2 as const,
        };

        const normalized = normalizeVisionBoardTo15Checkers(partialVision);

        const totalWhiteOnPoints = normalized.points.filter((v) => v > 0).reduce((acc, v) => acc + v, 0);
        const totalBlackOnPoints = normalized.points.filter((v) => v < 0).reduce((acc, v) => acc + -v, 0);

        expect(totalWhiteOnPoints + normalized.bar.player + normalized.off.player).toBe(15);
        expect(totalBlackOnPoints + normalized.bar.opponent + normalized.off.opponent).toBe(15);
        expect(normalized.dice).toEqual([5, 2]);
        expect(normalized.cubeValue).toBe(2);
    });

    it('4. Sur la position de départ avec 3-1 : 100 % des coups du Top 5 sont légaux (zéro coup #5 24/20 illégal)', () => {
        const state = createInitialState(7);
        state.dice = [3, 1];

        // Vrais coups légaux de référence générés par le moteur officiel
        const referenceLegalSeqs = generateLegalMoves(state, [3, 1]);
        const legalNotations = new Set(
            referenceLegalSeqs.map((seq) => formatMoveSequenceNotationWithHits(seq.moves, state.turn, state.board))
        );

        // Vérification directe : 24/20 est impossible avec les dés 3-1
        expect(legalNotations.has('24/20')).toBe(false);

        const top5 = computeLegalCandidateMovesTop5(state, [3, 1]);

        expect(top5.length).toBeGreaterThanOrEqual(1);
        expect(top5.length).toBeLessThanOrEqual(5);

        // 100 % des coups renvoyés doivent appartenir à l'ensemble officiel des coups légaux
        for (const candidate of top5) {
            expect(legalNotations.has(candidate.notation)).toBe(true);
            expect(candidate.notation).not.toBe('24/20');
        }

        // Le coup #1 doit être le coup d'or classique (8/5 6/5)
        expect(top5[0]?.notation).toBe('8/5 6/5');
        expect(top5[0]?.isOptimal).toBe(true);
        expect(top5[0]?.deltaEmg).toBe(0);
    });
});
