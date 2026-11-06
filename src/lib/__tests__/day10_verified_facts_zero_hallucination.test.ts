/**
 * Test de certification MISSION 10/25 :
 * Verrouillage des faits vérifiés sur /api/coach & MatchHud (ZÉRO hallucination de case).
 * Vérifie sur 200 coups composés et doublés que 100 % des flèches citées comme blot vérifient boardAfter[p] === 1.
 */

import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    applyMove,
    type Move,
} from '../../engine/backgammonEngine';
import {
    extractVerifiedCoachFacts,
    verifyAndSanitizeCoachTextAgainstBoard,
} from '../../features/coach/turnSnapshot';
import { generateRuleBasedExplanation } from '../../features/coach/prompts';
import { buildKnowledgeVaultEntry } from '../../features/coach/knowledgeVaultHarvester';

describe('MISSION 10/25 — Verrouillage des faits vérifiés & Zéro Hallucination de case', () => {
    it('1. verifyAndSanitizeCoachTextAgainstBoard interdit de qualifier de blot une case avec >= 2 pions (ex: 13/9* 13/9 9/5 9/5)', () => {
        // Plateau exact du cas réel Double 4 :
        // Blanc (X) a 3 pions sur la case 13, 2 pions sur la case 5, 0 sur la case 9.
        const boardAfter = new Array(26).fill(0);
        boardAfter[24] = 2;
        boardAfter[13] = 3; // 3 pions : JAMAIS un blot !
        boardAfter[8] = 3;
        boardAfter[6] = 5;
        boardAfter[5] = 2; // 2 pions : porte fermée, JAMAIS un blot !
        boardAfter[25] = -1; // 1 pion adverse sur la barre

        // Texte provocateur simulant une hallucination LLM
        const hallucinatedFr =
            'Votre coup laisse un pion isolé sur la case 13 et un blot sur la flèche 5, tout en laissant la case 9 comme pion isolé.';
        const resultFr = verifyAndSanitizeCoachTextAgainstBoard(hallucinatedFr, boardAfter, 'fr');

        expect(resultFr.hasHallucination).toBe(true);
        expect(resultFr.correctedPoints).toContain(13);
        expect(resultFr.correctedPoints).toContain(5);
        expect(resultFr.correctedPoints).toContain(9);

        // Vérification de la non-contradiction
        expect(resultFr.sanitizedText).not.toMatch(/pion isolé sur la case 13/i);
        expect(resultFr.sanitizedText).not.toMatch(/blot sur la flèche 5/i);
        expect(resultFr.sanitizedText).not.toMatch(/case 9 comme pion isolé/i);

        // Version anglaise
        const hallucinatedEn =
            'Playing this move leaves a lone checker on point 13 and a blot on point 5.';
        const resultEn = verifyAndSanitizeCoachTextAgainstBoard(hallucinatedEn, boardAfter, 'en');

        expect(resultEn.hasHallucination).toBe(true);
        expect(resultEn.sanitizedText).not.toMatch(/lone checker on point 13/i);
        expect(resultEn.sanitizedText).not.toMatch(/blot on point 5/i);
    });

    it('2. Préserve scrupuleusement la mention d’un vrai blot quand boardAfter[p] === 1', () => {
        const boardAfter = new Array(26).fill(0);
        boardAfter[24] = 2;
        boardAfter[13] = 4;
        boardAfter[8] = 3;
        boardAfter[6] = 5;
        boardAfter[10] = 1; // VRAI BLOT physique sur 10

        const legitimateFr = 'Attention : votre coup laisse un pion isolé sur la case 10 exposé aux tirs.';
        const result = verifyAndSanitizeCoachTextAgainstBoard(legitimateFr, boardAfter, 'fr');

        expect(result.hasHallucination).toBe(false);
        expect(result.correctedPoints).toHaveLength(0);
        expect(result.sanitizedText).toContain('pion isolé sur la case 10');
    });

    it('3. Audit de 200 coups composés et doublés : 0 contradiction physique entre les cases et le texte du Coach', () => {
        const diceCombos: Array<[number, number]> = [
            [4, 4], [5, 5], [3, 3], [2, 2], [6, 6], [1, 1],
            [6, 5], [5, 4], [4, 3], [3, 2], [6, 1], [5, 3],
            [4, 2], [6, 3], [5, 2], [6, 4], [4, 1], [3, 1],
        ];

        let totalAuditedTurns = 0;
        let totalHallucinationsTrappedAndSanitized = 0;

        for (let i = 0; i < 200; i++) {
            const dice = diceCombos[i % diceCombos.length];
            const state = createInitialState(7);
            const boardBefore = [...state.board];

            // Varier les configurations de plateau pour couvrir les 24 flèches
            const shift = i % 12;
            if (shift > 0 && boardBefore[13] > 1) {
                boardBefore[13] -= 1;
                const targetPt = Math.max(1, 13 - shift);
                boardBefore[targetPt] = (boardBefore[targetPt] ?? 0) + 1;
            }

            // Génération de sous-mouvements composés ou de doublets
            const subMoves: Move[] = [];
            let currentSimBoard = [...boardBefore];

            if (dice[0] === dice[1]) {
                // Coup doublé (4 déplacements du même dé)
                const die = dice[0];
                for (let step = 0; step < 4; step++) {
                    // Trouver une case avec pion joueur
                    let from = -1;
                    for (let p = 24; p >= 1; p--) {
                        if (currentSimBoard[p] > 0 && p - die >= 0) {
                            from = p;
                            break;
                        }
                    }
                    if (from > 0) {
                        const to = Math.max(0, from - die);
                        subMoves.push({ from, to });
                        currentSimBoard = applyMove(currentSimBoard, { from, to }, 'X');
                    }
                }
            } else {
                // Coup composé 2 dés
                for (const die of dice) {
                    let from = -1;
                    for (let p = 24; p >= 1; p--) {
                        if (currentSimBoard[p] > 0 && p - die >= 0) {
                            from = p;
                            break;
                        }
                    }
                    if (from > 0) {
                        const to = Math.max(0, from - die);
                        subMoves.push({ from, to });
                        currentSimBoard = applyMove(currentSimBoard, { from, to }, 'X');
                    }
                }
            }

            const boardAfter = currentSimBoard;
            const verifiedFacts = extractVerifiedCoachFacts(boardBefore, boardAfter);

            // Construction du texte coach déterministe
            const promptParams = {
                verdict: 'blunder' as const,
                equityLoss: -0.125,
                playedMove: subMoves.map((m) => `${m.from}/${m.to}`).join(' ') || '13/9 13/9',
                optimalMove: '24/20 13/9',
                features: {
                    player: 'X' as const,
                    pipCountDiff: { player: 150, opponent: 150, leader: 'tie' as const, diff: 0 },
                    blotsAndShots: {
                        user: verifiedFacts.realBlotsAfterPlayed.map((p) => ({ point: p, directShots: 2, indirectShots: 0, totalShots: 2 })),
                        best: [],
                    },
                    boardStructure: {
                        innerBoardPoints: 2,
                        advancedAnchor: false,
                        goldenPoint: false,
                        barPoint: false,
                        longestPrime: 2,
                    },
                    contactStatus: 'contact' as const,
                },
                playerLevel: 'intermediate' as const,
                language: 'fr' as const,
            };

            const vault = buildKnowledgeVaultEntry({ promptParams, board: boardAfter, dice });
            const ruleBased = vault.selectedVariant ?? generateRuleBasedExplanation(promptParams);

            // Injecter une phrase de test potentiellement contradictoire pour tester le piège
            // (ex: citer la case 13 ou 6 comme blot alors qu'elles ont >= 2 pions)
            const adversarialText = `${ruleBased.explanation} De plus, ce coup expose un pion isolé sur la case 13 et un blot en 6.`;

            const sanitized = verifyAndSanitizeCoachTextAgainstBoard(adversarialText, boardAfter, 'fr');
            if (sanitized.hasHallucination) {
                totalHallucinationsTrappedAndSanitized++;
            }

            // TEST D'INTÉGRITÉ ABSOLU :
            // Pour toute flèche p mentionnée comme blot dans sanitized.sanitizedText, boardAfter[p] DOIT valoir 1
            const blotMatches = sanitized.sanitizedText.matchAll(
                /(?:pion(?:s)?\s+isolé(?:s)?|blot(?:s)?)\s+(?:sur\s+(?:la\s+)?(?:case|flèche)\s+|en\s+|sur\s+)(\d{1,2})/gi,
            );

            for (const match of blotMatches) {
                const pt = parseInt(match[1], 10);
                if (pt >= 1 && pt <= 24) {
                    // Aucune exception : boardAfter[pt] DOIT physiquement valoir 1
                    expect(boardAfter[pt]).toBe(1);
                    expect(boardAfter[pt]).not.toBeGreaterThanOrEqual(2);
                    expect(boardAfter[pt]).not.toBeLessThanOrEqual(0);
                }
            }

            totalAuditedTurns++;
        }

        expect(totalAuditedTurns).toBe(200);
        expect(totalHallucinationsTrappedAndSanitized).toBeGreaterThan(0);
    });
});
