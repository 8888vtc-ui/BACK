import { describe, it, expect } from 'vitest';
import {
    computeSixAxesDiagnostic,
    evaluateSwapDiceCounterfactual,
    buildClubChouetteWhatsAppShareUrl,
} from './sixAxesDiagnostic';
import { createBenchmarkGameAnalyses } from '../rating/gameAnalysisStorage';

describe('Diagnostic 6 Axes (Aimchess), Moment Swap Dice & Partage WhatsApp Pack Club', () => {
    it('compile les 6 axes du Backgammon et compare l’Elo Pions vs l’Elo Videau', () => {
        const sample = createBenchmarkGameAnalyses()[0];
        sample.checkerPR = 5.5; // ~1864 Elo
        sample.cubePR = 15.0; // ~1370 Elo

        const report = computeSixAxesDiagnostic([sample]);
        expect(report.axes).toHaveLength(6);
        expect(report.axes.map((a) => a.id)).toEqual([
            'openings',
            'race_bearoff',
            'defense_backgame',
            'attack_blitz',
            'cube_mastery',
            'score_crawford',
        ]);
        expect(report.checkerEstimatedElo).toBeGreaterThan(report.cubeEstimatedElo);
        expect(report.ahaDiagnosisFr).toContain('Vous jouez les pions comme un joueur à');
        expect(report.ahaDiagnosisFr).toContain('vous gérez le Videau comme un joueur à');
    });

    it('calcule le Moment Swap Dice contre-factuel et structure le Clip Karma 15s en 3 Actes (0–5s, 5–10s, 10–15s)', () => {
        const sample = createBenchmarkGameAnalyses()[0];
        sample.totalEquityLoss = 0.32;
        sample.totalLuck = -0.05;

        const counterfactual = evaluateSwapDiceCounterfactual(sample);
        expect(counterfactual.botStillWins).toBe(true);
        expect(counterfactual.botStillWinsProbabilityPercent).toBeGreaterThanOrEqual(58);
        expect(counterfactual.ahaHeadlineFr).toContain('Même en inversant les dés (Swap Dice)');
        expect(counterfactual.karmaClipActs).toHaveLength(3);
        expect(counterfactual.karmaClipActs[0].timeRange).toBe('0–5s');
        expect(counterfactual.karmaClipActs[1].timeRange).toBe('5–10s');
        expect(counterfactual.karmaClipActs[2].timeRange).toBe('10–15s');
    });

    it('génère l’URL WhatsApp 1-clic du Pack Club / Chouette (30 €/an par joueur · 2,50 €/mois) avec deep-link ?join=BG-XXXX', () => {
        const share = buildClubChouetteWhatsAppShareUrl('BG-4829', 'https://backgammon.app');
        expect(share.messageFr).toContain('30 €/an par joueur (2,50 €/mois)');
        expect(share.messageFr).toContain('https://backgammon.app/?join=BG-4829');
        expect(share.whatsappUrl).toContain('https://wa.me/?text=');
    });
});
