/**
 * Test de simulation PR — Validation exhaustive de TOUS les formats.
 *
 * Formats validés :
 *   1. MATCH PLAY (7 points) avec et sans Videau
 *   2. MONEY GAME (Cash Game) avec règle de Jacoby et Videau
 *   3. DMP (Double Match Point, 1 point sans videau)
 *   4. Déterminisme et métriques BMAB officielles (Checker PR, Cube PR, Total PR)
 */

import { describe, it, expect } from 'vitest';
import { simulateMatches } from './simulatePR';

describe('Simulation PR — Tous les formats de jeu (Match, Money, Cube, Jacoby)', () => {
    it('exécute 10 matchs de 7 points (Match Play classique) et mesure le PR', () => {
        const result = simulateMatches(10, 7, 42);

        expect(result.matches).toBe(10);
        expect(result.matchLength).toBe(7);
        expect(result.format).toBe('match');
        expect(result.unforcedDecisions).toBeGreaterThan(0);
        expect(result.totalEquityLoss).toBe(0);
        expect(result.pr).toBe(0);

        console.log('=== MATCH PLAY (10 matchs × 7 points) ===');
        console.log(`Décisions non forcées : ${result.unforcedDecisions}`);
        console.log(`PR (auto-référencé)   : ${result.pr}`);
    });

    it('exécute du Match Play avec le VIDEAU ACTIF (décisions de Cube)', () => {
        const result = simulateMatches(5, 5, 99, { includeCube: true });

        expect(result.matches).toBe(5);
        expect(result.matchLength).toBe(5);
        expect(result.format).toBe('match');
        expect(result.cube.decisions).toBeGreaterThan(0);
        expect(result.checker.decisions).toBeGreaterThan(0);
        expect(result.pr).toBe(0);

        console.log('=== MATCH PLAY AVEC VIDEAU (5 matchs × 5 points) ===');
        console.log(`Décisions Pions  : ${result.checker.decisions}`);
        console.log(`Décisions Videau : ${result.cube.decisions}`);
        console.log(`PR Total BMAB    : ${result.pr}`);
    });

    it('exécute du MONEY GAME avec Règle de Jacoby et Videau', () => {
        // En Money Game : matchLength = 0, règle de Jacoby active
        const result = simulateMatches(20, 0, 777, { format: 'money', includeCube: true, jacoby: true });

        expect(result.matches).toBe(20);
        expect(result.format).toBe('money');
        expect(result.unforcedDecisions).toBeGreaterThan(0);
        expect(result.cube.decisions).toBeGreaterThan(0);
        expect(result.pr).toBe(0);

        console.log('=== MONEY GAME (20 parties libres avec Jacoby & Videau) ===');
        console.log(`Parties simulées : ${result.matches}`);
        console.log(`Décisions Pions  : ${result.checker.decisions}`);
        console.log(`Décisions Videau : ${result.cube.decisions}`);
        console.log(`PR Money Game    : ${result.pr}`);
    });

    it('exécute du format DMP (1 point, Double Match Point)', () => {
        const result = simulateMatches(10, 1, 555);

        expect(result.matches).toBe(10);
        expect(result.matchLength).toBe(1);
        expect(result.unforcedDecisions).toBeGreaterThan(0);
        expect(result.pr).toBe(0);
    });

    it('est strictement déterministe (même seed => même résultat)', () => {
        const r1 = simulateMatches(3, 7, 123);
        const r2 = simulateMatches(3, 7, 123);
        expect(r1.unforcedDecisions).toBe(r2.unforcedDecisions);
        expect(r1.totalEquityLoss).toBe(r2.totalEquityLoss);
        expect(r1.pr).toBe(r2.pr);
    });
});
