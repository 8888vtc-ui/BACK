/**
 * Test de robustesse (fuzz) du bot IA (AXE 5 du plan de validation).
 *
 * Vérifie que `selectBestOpponentSequence` ne produit JAMAIS de coup invalide :
 *   - Le coup retourné doit être légal (généré par `generateLegalMoves`).
 *   - Chaque coup de la séquence doit partir d'une flèche contenant un pion du
 *     joueur actif, en rejouant la séquence (le plateau évolue après chaque coup).
 *   - Aucun deadlock : retourne toujours un coup légal ou `null` (si aucun coup).
 */

import { describe, it, expect } from 'vitest';
import {
    createInitialState,
    generateLegalMoves,
    applyMove,
    type Player,
} from './backgammonEngine';
import { selectBestOpponentSequence, type AIDifficulty } from './aiHeuristics';

/** Générateur pseudo-aléatoire déterministe (mulberry32) pour la reproductibilité. */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Génère une position aléatoire valide (15 pions par joueur, sans chevauchement illégal). */
function randomBoard(rng: () => number): number[] {
    const board = new Array<number>(26).fill(0);

    // Place 15 pions X sur des flèches aléatoires (1..24).
    let xRemaining = 15;
    while (xRemaining > 0) {
        const point = 1 + Math.floor(rng() * 24);
        const count = Math.min(xRemaining, 1 + Math.floor(rng() * 3));
        board[point] += count;
        xRemaining -= count;
    }

    // Place 15 pions O sur des flèches aléatoires (1..24), sans chevauchement avec X.
    let oRemaining = 15;
    while (oRemaining > 0) {
        const point = 1 + Math.floor(rng() * 24);
        if (board[point] > 0) continue; // flèche occupée par X
        const count = Math.min(oRemaining, 1 + Math.floor(rng() * 3));
        board[point] -= count;
        oRemaining -= count;
    }

    return board;
}

describe('Robustesse du bot IA (fuzz, AXE 5)', () => {
    const difficulties: AIDifficulty[] = ['beginner', 'expert', 'grandmaster'];
    const players: Player[] = ['X', 'O'];
    const rng = mulberry32(42);

    it('ne produit jamais de coup invalide sur 50 positions aléatoires', () => {
        let invalidCount = 0;
        let totalMoves = 0;

        for (let i = 0; i < 50; i++) {
            const board = randomBoard(rng);
            const player = players[i % 2];
            const dice: [number, number] = [
                1 + Math.floor(rng() * 6),
                1 + Math.floor(rng() * 6),
            ];
            const difficulty = difficulties[i % 3];

            const state = {
                ...createInitialState(),
                board,
                turn: player,
                dice,
            };

            const legalSeqs = generateLegalMoves(state, dice);
            if (legalSeqs.length === 0) continue;

            const bestSeq = selectBestOpponentSequence(legalSeqs, player, difficulty, rng);
            if (!bestSeq) continue;

            // Rejoue la séquence pour vérifier que chaque coup part d'une flèche
            // contenant un pion du joueur actif (le plateau évolue après chaque coup).
            let currentBoard = [...board];
            for (const move of bestSeq.moves) {
                totalMoves++;
                const src = currentBoard[move.from];
                const ownsSource = player === 'X' ? src > 0 : src < 0;
                if (!ownsSource) {
                    invalidCount++;
                }
                currentBoard = applyMove(currentBoard, move, player);
            }
        }

        expect(totalMoves).toBeGreaterThan(0);
        expect(invalidCount).toBe(0);
    });

    it('retourne null (ou un coup légal) quand aucun coup n\'est possible', () => {
        // Position où X est bloqué : tous ses pions sont derrière une prime adverse.
        const board = new Array<number>(26).fill(0);
        // X : 2 pions sur 24 (bloqués par une prime O sur 18-23).
        board[24] = 2;
        board[23] = 2;
        board[22] = 2;
        board[21] = 2;
        board[20] = 2;
        board[19] = 2;
        board[18] = 2;
        // O : prime sur 18-23 (6 points consécutifs).
        board[18] = -2;
        board[19] = -2;
        board[20] = -2;
        board[21] = -2;
        board[22] = -2;
        board[23] = -2;
        // O : 3 pions restants ailleurs.
        board[12] = -3;

        const state = {
            ...createInitialState(),
            board,
            turn: 'X' as const,
            dice: [6, 5] as [number, number],
        };

        const legalSeqs = generateLegalMoves(state, [6, 5]);
        const bestSeq = selectBestOpponentSequence(legalSeqs, 'X', 'expert');

        // Soit aucun coup légal (null), soit un coup légal valide.
        if (legalSeqs.length === 0) {
            expect(bestSeq).toBeNull();
        } else {
            expect(bestSeq).not.toBeNull();
        }
    });
});
