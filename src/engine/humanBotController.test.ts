import { describe, expect, it } from 'vitest';
import {
    HUMAN_BOT_CALIBRATION_SPECS,
    computeHumanGeometricCounters,
    computeHumanIntuitionScore,
    evaluateHumanCubeHeuristic,
    selectHumanCalibratedMove,
    type BotPrErrorBudgetState,
    type CandidateMoveEvaluation,
} from './humanBotController';

describe('humanBotController — Calibrage de Bots Humains en 4 Règles (Zéro Math.random)', () => {
    it('Règle 1 : applique strictement le Garde-Fou d’Absurdité (Δmax = 0.035 Expert, 0.075 Intermédiaire, 0.115 Débutant)', () => {
        expect(HUMAN_BOT_CALIBRATION_SPECS.expert.deltaMaxEmg).toBe(0.035);
        expect(HUMAN_BOT_CALIBRATION_SPECS.intermediate.deltaMaxEmg).toBe(0.075);
        expect(HUMAN_BOT_CALIBRATION_SPECS.beginner.deltaMaxEmg).toBe(0.115);

        const boardBefore = new Array<number>(26).fill(0);
        const candidates: CandidateMoveEvaluation[] = [
            { id: 'best', sequence: { moves: [], board: [...boardBefore] }, trueEquity: 0.40 },
            { id: 'mild-inaccuracy', sequence: { moves: [], board: [...boardBefore] }, trueEquity: 0.37 }, // ΔE = 0.030
            { id: 'absurd-blunder', sequence: { moves: [], board: [...boardBefore] }, trueEquity: 0.12 }, // ΔE = 0.280 (> 0.115)
        ];

        // Même avec un déficit d'erreur élevé, le coup absurde (ΔE = 0.280) est formellement banni
        const res = selectHumanCalibratedMove({
            boardBefore,
            candidates,
            difficulty: 'beginner',
            budgetState: { totalEmgLost: 0, unforcedDecisions: 10 },
        });
        expect(res.selected.id).not.toBe('absurd-blunder');
        expect(res.equityLossEmg).toBeLessThanOrEqual(0.115);
    });

    it('Règle 2 : calcule les 4 compteurs géométriques (blot sous tir direct x2, frappe réflexe, chandeliers > 4, points profonds 1-2)', () => {
        const boardBefore = new Array<number>(26).fill(0);
        const boardAfter = new Array<number>(26).fill(0);

        // Le bot O (valeurs négatives) a frappé un pion X (boardAfter[0] = 1)
        boardAfter[0] = 1;
        // Le bot O laisse un blot en case 10, et X a un pion en case 14 (distance 4 -> tir direct !)
        boardAfter[10] = -1;
        boardAfter[14] = 2;
        // Le bot O empile 6 dames sur sa case 19 (chandelier : 6 - 4 = 2)
        boardAfter[19] = -6;
        // Le bot O fait une porte profonde sur la case 24 (relPt = 1 pour O)
        boardAfter[24] = -2;

        const counters = computeHumanGeometricCounters(boardBefore, boardAfter, 'O');
        expect(counters.hitIndicator).toBe(1);
        expect(counters.nBlots).toBe(2); // 1 blot sous tir direct (case 14 -> 10) = pénalité doublée
        expect(counters.nStack).toBe(2); // 6 - 4 = 2 dames surnuméraires
        expect(counters.nDeep).toBe(1); // case 24 = point 1 profond du bot O

        const scoreBeginner = computeHumanIntuitionScore({
            boardBefore,
            boardAfter,
            trueEquity: 0.10,
            difficulty: 'beginner',
            player: 'O',
        });
        expect(Number.isFinite(scoreBeginner)).toBe(true);
    });

    it('Règle 3 : l’Asserviteur Déterministe de PR fait converger la perte moyenne exactement vers le PR cible', () => {
        const boardBefore = new Array<number>(26).fill(0);
        // On prépare un lot de candidats avec des pertes graduées (0.000, 0.008, 0.016, 0.030 EMG)
        const bBest = [...boardBefore];
        const bHuman = [...boardBefore];
        bHuman[24] = -2; // Point profond qui attire l'intuition humaine débutante/intermédiaire

        const candidates: CandidateMoveEvaluation[] = [
            { id: 'm0', sequence: { moves: [], board: bBest }, trueEquity: 0.500 },
            { id: 'm8', sequence: { moves: [], board: bHuman }, trueEquity: 0.492 }, // ΔE = 0.008 (8 mEMG = PR 4.0)
            { id: 'm16', sequence: { moves: [], board: bHuman }, trueEquity: 0.484 }, // ΔE = 0.016 (16 mEMG = PR 8.0)
        ];

        let budget: BotPrErrorBudgetState = { totalEmgLost: 0, unforcedDecisions: 0 };
        for (let turn = 0; turn < 20; turn++) {
            const step = selectHumanCalibratedMove({
                boardBefore,
                candidates,
                difficulty: 'intermediate', // Cible PR 4.0 (8 mEMG / décision)
                budgetState: budget,
            });
            budget = step.updatedBudget;
        }

        const achievedPr = (budget.totalEmgLost / budget.unforcedDecisions) * 500;
        // Doit être dans la tranche Intermédiaire (PR 3.0 – 5.0)
        expect(achievedPr).toBeGreaterThanOrEqual(3.0);
        expect(achievedPr).toBeLessThanOrEqual(5.0);
    });

    it('Règle 4 : reproduit les biais humains sur le Videau (Doubling Too Late / Dead-Cube Drop vs Doubling on a Rush / Pride Take)', () => {
        // Profil Prudent (Intermédiaire) : à 70 % de gain, hésite et ne double pas encore (< 74 %)
        const prudent70 = evaluateHumanCubeHeuristic({
            difficulty: 'intermediate',
            winProbability: 0.70,
        });
        expect(prudent70.shouldDouble).toBe(false);
        expect(prudent70.rationaleTag).toBe('DOUBLING_TOO_LATE');

        // Profil Prudent : à 22 % de gain (pourtant prenable en live-cube à 20 %), abandonne par prudence (< 24 %)
        const prudentDrop = evaluateHumanCubeHeuristic({
            difficulty: 'intermediate',
            winProbability: 0.22,
        });
        expect(prudentDrop.shouldTake).toBe(false);
        expect(prudentDrop.rationaleTag).toBe('DEAD_CUBE_DROP');

        // Profil Agressif (Débutant) : après une frappe à 62 % de gain, double sous l'adrénaline (Doubling on a Rush)
        const rushDouble = evaluateHumanCubeHeuristic({
            difficulty: 'beginner',
            winProbability: 0.62,
            justHitOpponent: true,
        });
        expect(rushDouble.shouldDouble).toBe(true);
        expect(rushDouble.rationaleTag).toBe('DOUBLING_ON_A_RUSH');

        // Profil Agressif : accepte par orgueil (Pride Take) un double perdant à 18 %
        const prideTake = evaluateHumanCubeHeuristic({
            difficulty: 'beginner',
            winProbability: 0.18,
        });
        expect(prideTake.shouldTake).toBe(true);
    });
});
