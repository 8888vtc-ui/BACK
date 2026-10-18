/**
 * Tests de la table exacte de bear-off (1-sided bear-off database).
 *
 * Valide :
 * 1. La bijection index <-> position (stars and bars) sur les 54 264 états.
 * 2. L'exactitude de l'espérance de jets sur des positions d'école.
 * 3. La monotonie (plus de pions / pions plus reculés => plus de jets attendus).
 */

import { describe, it, expect } from 'vitest';
import {
    BEAROFF_STATE_COUNT,
    bearoffIndex,
    bearoffDecode,
    bearoffExpectedRolls,
    getBearoffTable,
    resetBearoffTable,
} from './bearoffTable';

describe('Table exacte de bear-off (1-sided)', () => {
    describe('1. Indexation parfaite (stars and bars)', () => {
        it('couvre exactement 54 264 états', () => {
            expect(BEAROFF_STATE_COUNT).toBe(54264);
        });

        it('est une bijection : decode(index(position)) === position', () => {
            const samples: number[][] = [
                [0, 0, 0, 0, 0, 0], // vide
                [15, 0, 0, 0, 0, 0], // tout sur la flèche 1
                [0, 0, 0, 0, 0, 15], // tout sur la flèche 6
                [3, 3, 3, 3, 3, 0], // répartition équilibrée
                [2, 0, 0, 0, 0, 1], // position d'école
                [0, 0, 0, 0, 0, 1], // 1 pion sur la flèche 6
                [1, 0, 0, 0, 0, 0], // 1 pion sur la flèche 1
            ];
            for (const pos of samples) {
                const idx = bearoffIndex(pos);
                expect(idx).toBeGreaterThanOrEqual(0);
                expect(idx).toBeLessThan(BEAROFF_STATE_COUNT);
                expect(bearoffDecode(idx)).toEqual(pos);
            }
        });

        it('est injective sur tous les états (aucune collision)', () => {
            const seen = new Set<number>();
            for (let idx = 0; idx < BEAROFF_STATE_COUNT; idx++) {
                const pos = bearoffDecode(idx);
                const recomputed = bearoffIndex(pos);
                expect(recomputed).toBe(idx);
                seen.add(recomputed);
            }
            expect(seen.size).toBe(BEAROFF_STATE_COUNT);
        });
    });

    describe('2. Exactitude de l\'espérance de jets', () => {
        it('position vide => 0 jet', () => {
            expect(bearoffExpectedRolls([0, 0, 0, 0, 0, 0])).toBe(0);
        });

        it('1 pion sur la flèche 1 => 1 jet exactement', () => {
            // Un seul pion sur la flèche 1 : tout lancer (1..6) le sort.
            expect(bearoffExpectedRolls([1, 0, 0, 0, 0, 0])).toBeCloseTo(1, 2);
        });

        it('1 pion sur la flèche 2 => 1 jet (sortie directe ou overshoot)', () => {
            // Tout lancer sort un pion de la flèche 2 : dé >= 2 (sortie directe
            // ou overshoot) ou double 1 (2->1->off).
            expect(bearoffExpectedRolls([0, 1, 0, 0, 0, 0])).toBeCloseTo(1, 2);
        });

        it('1 pion sur la flèche 6 => espérance > 1 (dépend du dé)', () => {
            // Un pion sur la flèche 6 ne sort pas toujours en 1 jet (ex: double 1
            // ne le sort pas). Espérance strictement > 1.
            const e = bearoffExpectedRolls([0, 0, 0, 0, 0, 1]);
            expect(e).toBeGreaterThan(1);
            expect(e).toBeLessThan(2);
        });

        it('2 pions sur la flèche 1 vs 1 pion sur la flèche 2 (position d\'école)', () => {
            // 2 pions sur la flèche 1 : chaque dé sort 1 pion, donc sortis en
            // 1 jet garanti (tout lancer sort au moins 2 pions).
            const twoOnOne = bearoffExpectedRolls([2, 0, 0, 0, 0, 0]);
            // 1 pion sur la flèche 2 : sorti en 1 jet garanti (dé >= 2 ou double 1).
            const oneOnTwo = bearoffExpectedRolls([0, 1, 0, 0, 0, 0]);
            // Les deux positions d'école sortent en 1 jet exactement.
            expect(twoOnOne).toBeCloseTo(1, 2);
            expect(oneOnTwo).toBeCloseTo(1, 2);
        });
    });

    describe('3. Monotonie', () => {
        it('plus de pions sur une flèche haute => espérance croissante', () => {
            // Sur la flèche 6, ajouter des pions augmente l'espérance.
            const e1 = bearoffExpectedRolls([0, 0, 0, 0, 0, 1]); // 1 pion flèche 6
            const e2 = bearoffExpectedRolls([0, 0, 0, 0, 0, 2]); // 2 pions flèche 6
            const e3 = bearoffExpectedRolls([0, 0, 0, 0, 0, 3]); // 3 pions flèche 6
            expect(e2).toBeGreaterThan(e1);
            expect(e3).toBeGreaterThan(e2);
        });

        it('pions plus reculés => espérance croissante', () => {
            const e6 = bearoffExpectedRolls([0, 0, 0, 0, 0, 1]); // flèche 6
            const e5 = bearoffExpectedRolls([0, 0, 0, 0, 1, 0]); // flèche 5
            const e4 = bearoffExpectedRolls([0, 0, 0, 1, 0, 0]); // flèche 4
            expect(e5).toBeLessThan(e6);
            expect(e4).toBeLessThan(e5);
        });
    });

    describe('4. Performance (< 1 ms par lookup)', () => {
        it('génère la table et répond en moins de 1 ms par lookup', () => {
            resetBearoffTable();
            const start = performance.now();
            const table = getBearoffTable();
            const genMs = performance.now() - start;

            expect(table.length).toBe(BEAROFF_STATE_COUNT);

            const lookupStart = performance.now();
            for (let i = 0; i < 1000; i++) {
                bearoffExpectedRolls([2, 0, 0, 0, 0, 1]);
            }
            const lookupMs = (performance.now() - lookupStart) / 1000;
            expect(lookupMs).toBeLessThan(1);
            expect(genMs).toBeGreaterThanOrEqual(0);
        });
    });
});
