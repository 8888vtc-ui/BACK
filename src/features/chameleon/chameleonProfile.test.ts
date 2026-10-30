import { describe, it, expect } from 'vitest';
import {
    resolveAutoChameleonLayer,
    formatChameleonPipDisplay,
    formatNAwayScore,
    getClubPrScaleLabel,
    calculateExactTakePoint,
    evaluateCubeVisualGauge,
    buildFourFactorsNaturalAdvice,
    sortEvaluatedMovesByMwcLoss,
    buildProgressiveMasteryGoal,
    CHAMELEON_CONFIGS,
} from './chameleonProfile';
import type { EvaluatedTurn } from '../rating/types';

describe('Architecture Caméléon & Algorithme Elon Musk (chameleonProfile)', () => {
    it('Étape 5 : bascule automatiquement entre Couche 0, Couche 1 et Couche 2 sans questionnaire', () => {
        // 0 partie -> Couche 0 (Débutant)
        expect(resolveAutoChameleonLayer([])).toBe(0);

        // PR > 15 et 0 décision de videau -> Couche 0
        expect(
            resolveAutoChameleonLayer([
                { performanceRating: 18.4, closeCubeDecisionsCount: 0, decisionsCount: 12 },
            ]),
        ).toBe(0);

        // PR entre 5 et 15 -> Couche 1 (Club)
        expect(
            resolveAutoChameleonLayer([
                { performanceRating: 9.2, closeCubeDecisionsCount: 0, decisionsCount: 15 },
            ]),
        ).toBe(1);

        // PR > 15 mais utilise le videau -> Couche 1 (Club)
        expect(
            resolveAutoChameleonLayer([
                { performanceRating: 16.5, closeCubeDecisionsCount: 2, decisionsCount: 14 },
            ]),
        ).toBe(1);

        // PR < 5 -> Couche 2 (Grand-Maître / Pro)
        expect(
            resolveAutoChameleonLayer([
                { performanceRating: 3.8, closeCubeDecisionsCount: 3, decisionsCount: 18 },
            ]),
        ).toBe(2);
    });

    it('formate l’affichage des pips selon la strate (masqué en Couche 0, différentiel en Couche 1, exact en Couche 2, et garde-fou 10 % forceReveal)', () => {
        expect(formatChameleonPipDisplay(69, 79, 0, false)).toBeNull();
        expect(formatChameleonPipDisplay(69, 79, 0, true)).toBe('69 pips');
        expect(formatChameleonPipDisplay(69, 79, 1, false)).toBe('Course : +10');
        expect(formatChameleonPipDisplay(85, 73, 1, false)).toBe('Course : -12');
        expect(formatChameleonPipDisplay(69, 79, 2, false)).toBe('69 pips');
    });

    it('formate le score de match en notation n-away pour la Couche 2', () => {
        expect(formatNAwayScore(4, 2, 7, false)).toBe('3-away, 5-away');
        expect(formatNAwayScore(6, 4, 7, true)).toBe('1-away, 3-away · Crawford');
        expect(formatNAwayScore(0, 0, 0, false)).toBe('Money Game');
    });

    it('retourne l’échelle PR lisible de la Couche 1 (< 5 Maître, 5–10 Expert, 10–15 Fort, > 15 En progression)', () => {
        expect(getClubPrScaleLabel(4.2).tier).toBe('Maître');
        expect(getClubPrScaleLabel(7.8).tier).toBe('Expert');
        expect(getClubPrScaleLabel(12.4).tier).toBe('Fort');
        expect(getClubPrScaleLabel(19.1).tier).toBe('En progression');
    });

    it('calcule exactement le Take Point = Risque / (Risque + Gain) et la Jauge de Videau à 3 repères (25 %, 75 %, Recube Vig, Loi de Woolsey)', () => {
        // En partie libre sans vig : risquer 1 unité (-1 -> -2) pour en gagner 3 (-1 -> +2) => 1 / (1 + 3) = 0.25 (25 %)
        expect(calculateExactTakePoint(1, 3)).toBe(0.25);

        // Course / Blitz : Recube Vig de 6 % -> seuil effectif 19.0 %
        const raceGauge = evaluateCubeVisualGauge(21, 'race');
        expect(raceGauge.baseTakePointPercent).toBe(25);
        expect(raceGauge.recubeVigPercent).toBe(6);
        expect(raceGauge.effectiveTakePointPercent).toBe(19);
        expect(raceGauge.doubleWindowPercent).toBe(75);

        // Zone de Woolsey (68 % - 75 %)
        const woolseyGauge = evaluateCubeVisualGauge(70, 'holding');
        expect(woolseyGauge.effectiveTakePointPercent).toBe(23.5);
        expect(woolseyGauge.woolseyLawApplies).toBe(true);
        expect(woolseyGauge.clubRecommendationFr).toContain('Loi de Woolsey');
    });

    it('génère un conseil Couche 0 en français courant basé sur Course, Structure, Flexibilité, Sécurité sans jargon EMG/PR/MWC', () => {
        const advice = buildFourFactorsNaturalAdvice({
            moveNumber: 9,
            playedNotation: '13/9 6/5',
            optimalNotation: '8/5 6/5',
            conceptId: 'blot_safety',
        });

        expect(advice.primaryFactor).toBe('Sécurité');
        expect(advice.secondaryFactor).toBe('Structure');
        expect(advice.narrativeFr).toContain('Sécurité');
        expect(advice.narrativeFr).toContain('Structure');
        expect(advice.narrativeFr).not.toContain('EMG');
        expect(advice.narrativeFr).not.toContain('MWC');
    });

    it('trie en priorité les erreurs de match selon la perte réelle de MWC (%) plutôt que la distorsion EMG', () => {
        const moves: EvaluatedTurn[] = [
            {
                moveNumber: 3,
                player: 'X',
                dice: [4, 2],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '13/9 13/11',
                optimalNotation: '8/4 6/4',
                equityLoss: -0.425, // Forte distorsion EMG mais faible écart MWC simulé ici
                mwcBefore: 50.0,
                mwcAfter: 46.5, // -3.5 % MWC
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 8,
            },
            {
                moveNumber: 8,
                player: 'X',
                dice: [6, 5],
                boardBefore: [],
                boardAfter: [],
                playedNotation: '24/18 18/13',
                optimalNotation: '24/13',
                equityLoss: -0.212, // Moins d'EMG brut mais plus grosse perte réelle de MWC %
                mwcBefore: 52.0,
                mwcAfter: 44.2, // -7.8 % MWC
                verdict: 'blunder',
                isUnforced: true,
                candidateCount: 5,
            },
        ];

        const sorted = sortEvaluatedMovesByMwcLoss(moves);
        expect(sorted[0].moveNumber).toBe(8);
        expect(sorted[1].moveNumber).toBe(3);
    });

    it('respecte l’ego en Couche 0 ("Essentiel" au lieu de "Débutant") et guide la réduction progressive des blunders (4-5 -> 1 -> 0)', () => {
        expect(CHAMELEON_CONFIGS[0].badgeFr).toContain('Essentiel');
        expect(CHAMELEON_CONFIGS[0].badgeFr).not.toContain('Débutant');

        // Cas typique : 4 blunders + 2 cubes oubliés -> focus sur les grosses erreurs et le Videau
        const typicalGoal = buildProgressiveMasteryGoal({
            blundersCount: 4,
            inaccuraciesCount: 3,
            missedCubesCount: 2,
        });
        expect(typicalGoal.focusMode).toBe('MAJOR_BLUNDERS_AND_CUBE');
        expect(typicalGoal.badgeLabelFr).toContain('4 Blunders');
        expect(typicalGoal.goalDescriptionFr).toContain('Videau');

        // Bon joueur : 1 seul blunder -> vise le zéro faute
        const goodPlayerGoal = buildProgressiveMasteryGoal({
            blundersCount: 1,
            inaccuraciesCount: 2,
            missedCubesCount: 0,
        });
        expect(goodPlayerGoal.focusMode).toBe('ZERO_BLUNDER_TARGET');
        expect(goodPlayerGoal.badgeLabelFr).toContain('1 seul Blunder');

        // Très bon joueur / Pro : 0 blunder -> traque des micro-blunders
        const proGoal = buildProgressiveMasteryGoal({
            blundersCount: 0,
            inaccuraciesCount: 2,
            missedCubesCount: 0,
        });
        expect(proGoal.focusMode).toBe('MICRO_BLUNDERS_POLISH');
        expect(proGoal.goalDescriptionFr).toContain('micro-blunder');
    });
});
