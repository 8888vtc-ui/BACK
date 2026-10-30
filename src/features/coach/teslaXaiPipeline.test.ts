import { describe, it, expect } from 'vitest';
import {
    computeRaceTelemetry,
    computeDuplication,
    detectPositionalMotif,
} from './detectPositionalMotif';
import {
    computeLookahead36,
    detectBrilliantMove,
    explainBotApparentLuck36,
} from './lookahead36';
import {
    lookupKazarossMWC,
    convertDeltaEmgToMwcPercent,
    computeJanowskiMwcApprox,
    computeTurnerMwcApprox,
    generateDeterministicCommentary,
} from './teslaCoachCommentary';

function buildCanonicalBoard(
    ownPoints: Record<number, number> = {},
    oppPoints: Record<number, number> = {},
    ownBar = 0,
    oppBar = 0,
): Int8Array {
    const b = new Int8Array(26);
    b[25] = ownBar;
    b[0] = -oppBar;
    for (const [pt, cnt] of Object.entries(ownPoints)) {
        b[Number(pt)] = cnt;
    }
    for (const [pt, cnt] of Object.entries(oppPoints)) {
        b[Number(pt)] = -cnt;
    }
    return b;
}

describe('teslaXaiPipeline — 18 Motifs, Lookahead 36, Coup Brillant (!!) & Tesla 3-Secondes', () => {
    it('détecte UNSTACK_MIDPOINT et calcule le différentiel de Lookahead sur 36', () => {
        const before = buildCanonicalBoard(
            { 6: 4, 8: 2, 13: 5, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        );
        // Coup passif qui garde 5 pions sur le Midpoint (13) et enterre 2 pions sur l'as (6/1(2))
        const played = buildCanonicalBoard(
            { 1: 2, 6: 2, 8: 2, 13: 5, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        );
        // Coup optimal qui dégorge le 13 vers les bâtisseurs 9 et 10 (13/9 13/10)
        const optimal = buildCanonicalBoard(
            { 6: 4, 8: 2, 9: 1, 10: 1, 13: 3, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        );

        const lk = computeLookahead36(played, optimal);
        expect(lk.constructiveCoversOpt).toBeGreaterThan(lk.constructiveCoversPlay);

        const motif = detectPositionalMotif(
            before,
            played,
            optimal,
            lk.oppDirectShotsOpt,
            lk.oppDirectShotsPlay,
            lk.oppHitRollsOpt,
            lk.oppHitRollsPlay,
        );
        expect(motif.motif).toBe('UNSTACK_MIDPOINT');
        expect(motif.primaryPoint).toBe(13);

        const beginnerFR = generateDeterministicCommentary({
            movePlayedNotation: '6/2 6/3',
            moveOptimalNotation: '13/9 13/10',
            deltaEmg: -0.078,
            playerAway: 3,
            oppAway: 5,
            cubeValue: 1,
            motifData: motif,
            lookahead: lk,
            lang: 'fr',
            mode: 'BEGINNER',
        });
        expect(beginnerFR.severityTier).toBe('DOUBTFUL');
        expect(beginnerFR.badgeColorHex).toBe('#FA903E');
        expect(beginnerFR.line2CausalError).toContain('grande pile du milieu (case 13)');
        expect(beginnerFR.actionCtas).toEqual(['Voir danger', 'Voir idée', 'Réessayer']);

        const proFR = generateDeterministicCommentary({
            movePlayedNotation: '6/2 6/3',
            moveOptimalNotation: '13/9 13/10',
            deltaEmg: -0.078,
            playerAway: 3,
            oppAway: 5,
            cubeValue: 1,
            motifData: motif,
            lookahead: lk,
            lang: 'fr',
            mode: 'PRO',
        });
        expect(proFR.line1Verdict).toContain('-0.078 EMG');
        expect(proFR.line2CausalError).toContain('Midpoint (13)');
        expect(proFR.grandmasterPillarTag).toBe('MICHY_MAKING_POINTS');
    });

    it('calcule les 4 régimes EPC de Walter Trice (Rollish 7n+1, Non-Rollish <=8, Pippish abc, Fastimate)', () => {
        // Position Rollish : 6 pions empilés sur les cases 1 et 2 (crossovers = 0, G < 1.5) => 7*3 + 1 = 22
        const rollish = buildCanonicalBoard({ 1: 4, 2: 2 }, { 24: 6 });
        const tRollish = computeRaceTelemetry(rollish);
        expect(tRollish.epc).toBe(22);

        // Position Pippish (>= 7 pions, a,b,c <= 2) : méthode abc = PC + 7 + a + 0.5*b
        const pippish = buildCanonicalBoard({ 1: 1, 2: 2, 4: 2, 5: 2, 6: 2 }, { 24: 9 });
        const tPippish = computeRaceTelemetry(pippish);
        // PC = 1 + 4 + 8 + 10 + 12 = 35 ; EPC = 35 + 7 + 1 + 1 = 44
        expect(tPippish.rawPipCount).toBe(35);
        expect(tPippish.epc).toBe(44);
    });

    it('vérifie la conversion exacte ΔEMG -> ΔMWC% via Kazaross-XG2 (ex. Madsen 3-away vs 7-away et DMP)', () => {
        expect(lookupKazarossMWC(3, 7)).toBeCloseTo(76.2, 2);
        // À 3a-7a, C=1 : MWC_min (3a-6a) = 71.1, MWC_max (2a-7a) = 84.2 => span = 13.1%
        // ΔEMG = -0.095 => -0.095 * (13.1 / 2) = -0.6%
        expect(convertDeltaEmgToMwcPercent(-0.095, 3, 7, 1)).toBeCloseTo(-0.6, 1);

        // À DMP (1a-1a, C=1) : span = 100% => ΔEMG = -0.095 => -4.75%
        expect(convertDeltaEmgToMwcPercent(-0.095, 1, 1, 1)).toBeCloseTo(-4.75, 2);

        // Au-delà de 7-away : formules de Janowski et Turner
        expect(computeJanowskiMwcApprox(8, 11)).toBeGreaterThan(50);
        expect(computeTurnerMwcApprox(8, 11)).toBeGreaterThan(50);
    });

    it('détecte un Coup Brillant (!!) à 4 portes et explique la Chance Apparente du Bot', () => {
        const before = buildCanonicalBoard(
            { 6: 4, 8: 3, 9: 2, 13: 4, 24: 2 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        );
        // Slot intentionnel sur la case 5 avec duplication et nombreux constructeurs
        const played = buildCanonicalBoard(
            { 5: 1, 6: 4, 8: 3, 9: 2, 13: 3, 20: 1, 24: 1 },
            { 1: 2, 12: 5, 17: 3, 19: 5 },
        );

        const dup = computeDuplication(played);
        expect(dup.overlapScore).toBeGreaterThanOrEqual(0);

        const brilliant = detectBrilliantMove({
            boardBefore: before,
            boardPlayed: played,
            deltaEmgFromBest: 0.0,
            gapToSecondBestEmg: 0.032,
            isBeginnerProfile: false,
        });
        expect(brilliant.isBrilliant).toBe(true);
        expect(brilliant.headlineFR).toContain('Coup Brillant !!');

        const botLuck = explainBotApparentLuck36(played);
        expect(botLuck.constructiveRolls36).toBeGreaterThanOrEqual(14);
        expect(botLuck.shouldDisplayTutorBubble).toBe(true);
        expect(botLuck.messageFR).toContain('Bien préparé');
    });
});
