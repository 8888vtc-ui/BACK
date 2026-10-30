/**
 * Tests unitaires du diagnostic stratégique automatique (PARTIE 3.2).
 */

import { describe, it, expect } from 'vitest';
import {
    explainTacticalDifference,
    evaluateBrilliantMoveCriteria,
    buildBiLevelCoachMicroCopy,
    buildSilentTutorBotLuckExplanation,
} from './tacticalExplainer';

function makeBoard(xPoints: Record<number, number> = {}, oPoints: Record<number, number> = {}): number[] {
    const board = new Array<number>(26).fill(0);
    for (const [p, n] of Object.entries(xPoints)) board[Number(p)] = n;
    for (const [p, n] of Object.entries(oPoints)) board[Number(p)] = -n;
    return board;
}

describe('explainTacticalDifference — Diagnostic stratégique FR', () => {
    it('détecte une différence de sécurité (blots exposés)', () => {
        const before = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const optimal = makeBoard({ 13: 5, 8: 2, 10: 2 }, { 12: 5, 19: 5 });
        const played = makeBoard({ 13: 5, 8: 2, 10: 1, 9: 1 }, { 12: 5, 19: 5 });

        const res = explainTacticalDifference({
            boardBefore: before,
            boardOptimal: optimal,
            boardPlayed: played,
            player: 'X',
        });

        expect(res.concepts).toContain('Sécurité');
        expect(res.summary).toContain('blot');
    });

    it('détecte la construction d’un point clé (Golden Point 5)', () => {
        const before = makeBoard({ 8: 3, 6: 5, 13: 5 }, { 12: 5, 19: 5 });
        const optimal = makeBoard({ 8: 2, 6: 4, 13: 5, 5: 2 }, { 12: 5, 19: 5 });
        const played = makeBoard({ 8: 2, 6: 4, 13: 5, 4: 2 }, { 12: 5, 19: 5 });

        const res = explainTacticalDifference({
            boardBefore: before,
            boardOptimal: optimal,
            boardPlayed: played,
            player: 'X',
        });

        expect(res.concepts).toContain('Point clé');
        expect(res.summary).toContain('Golden Point');
    });

    it('retourne un résumé neutre si aucune différence tactique majeure', () => {
        const board = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const res = explainTacticalDifference({
            boardBefore: board,
            boardOptimal: board,
            boardPlayed: board,
            player: 'X',
        });
        expect(res.summary).toContain('subtile');
        expect(res.concepts).toHaveLength(0);
    });

    it('garantit la valeur absolue mathématique de la perte d’équité (absEquityLoss)', () => {
        const board = makeBoard({ 13: 5, 8: 3 }, { 12: 5, 19: 5 });
        const res = explainTacticalDifference({
            boardBefore: board,
            boardOptimal: board,
            boardPlayed: board,
            player: 'X',
            equityLoss: -0.245,
        });
        expect(res.absEquityLoss).toBeCloseTo(0.245, 5);
    });

    it('détecte le dégorgement du Midpoint (point 13) et le gain de lancers constructeurs (/36)', () => {
        const before = makeBoard({ 24: 2, 13: 5, 8: 3, 6: 5 }, { 1: 2, 12: 5, 17: 3, 19: 5 });
        const optimal = makeBoard({ 24: 2, 13: 3, 9: 1, 8: 4, 6: 5 }, { 1: 2, 12: 5, 17: 3, 19: 5 });
        const played = makeBoard({ 24: 2, 13: 5, 8: 1, 4: 1, 3: 1, 6: 5 }, { 1: 2, 12: 5, 17: 3, 19: 5 });

        const res = explainTacticalDifference({
            boardBefore: before,
            boardOptimal: optimal,
            boardPlayed: played,
            player: 'X',
        });

        expect(res.concepts).toContain('Bâtisseurs');
        expect(res.summary).toContain('Midpoint');
    });

    it('valide les 4 portes du Coup Brillant (!!) et génère la micro-copie Zéro-Jargon (18–28 mots max) + Tuteur Silencieux (/36)', () => {
        // 1. Coup Brillant (!!) : optimal (ΔEMG <= 0.005), sacrifice apparent de sécurité (tir direct > 0), écart >= 0.025 EMG
        expect(
            evaluateBrilliantMoveCriteria({
                equityLossEmg: 0.002,
                secondBestGapEmg: 0.032,
                directShotsConceded: 11,
                hasDeepTacticalJustification: true,
                level: 'pro',
            }),
        ).toBe(true);

        // Un coup évident sans sacrifice de sécurité immédiate n'est pas un Coup Brillant (!!)
        expect(
            evaluateBrilliantMoveCriteria({
                equityLossEmg: 0.0,
                secondBestGapEmg: 0.040,
                directShotsConceded: 0,
                brokeHomePoint: false,
                slottedKeyPointNaked: false,
            }),
        ).toBe(false);

        // 2. Micro-copie Niveau 1 (< 3 secondes, 18–28 mots max, zéro jargon technique, CTAs de 2 mots)
        const copy = buildBiLevelCoachMicroCopy({
            equityLossEmg: 0.092,
            directShotsConceded: 14,
            dominantTheme: 'BLITZ',
            recurringErrorCount: 4,
            locale: 'fr',
        });
        expect(copy.headerBadge).toContain('😵 Gaffe');
        expect(copy.bulletDiagnostic).toBe('Ce pion isolé donne 14 lancers sur 36 pour te frapper.');
        expect(copy.bulletAction).toBe('Prends plutôt la case 5 pour bâtir un mur.');
        expect(copy.bulletHabitHook).toBe("⚠️ C'est ta 4e erreur similaire cette semaine.");
        expect(copy.ctaPills).toEqual(['Voir danger', 'Voir idée', 'Réessayer']);
        expect(copy.wordCountLevel1).toBeGreaterThanOrEqual(15);
        expect(copy.wordCountLevel1).toBeLessThanOrEqual(28);
        expect(copy.proTelemetryLine).toContain('-92 mEMG');

        // 3. Tuteur Silencieux Anti-Paranoïa : explique les lancers sur 36 préparés par le bot
        const botBefore = makeBoard({ 1: 2 }, { 20: 1, 19: 3, 17: 3, 16: 3, 13: 5 });
        const botAfter = makeBoard({ 1: 2 }, { 20: 2, 19: 3, 17: 2, 16: 3, 13: 5 });
        const luckNote = buildSilentTutorBotLuckExplanation({
            boardBeforeBotRoll: botBefore,
            boardAfterBotMove: botAfter,
            botPlayer: 'O',
            locale: 'fr',
        });
        expect(luckNote).toContain('lancers sur 36 pour couvrir cette case');
    });
});
