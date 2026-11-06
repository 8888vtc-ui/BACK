/**
 * @file src/features/drills/__tests__/day33_cube_decision_quizzes_end_to_end.test.ts
 * @description MISSION 33/50 : TEST END-TO-END DES QUIZ DE VIDEAU (CUBE_DECISION).
 *
 * Invariants validés en FR et EN :
 *   1. Actions de Videau explicites (Pas de Double, Doubler ×2 / Accepter, Doubler ×2 / Refuser).
 *   2. ZÉRO option BEAVER en Match Play (matchLength > 0).
 *   3. Explication et télémétrie post-réponse : % de victoire, % de Gammon et Seuil de prise (Take Point).
 *   4. Validation symétrique des choix canoniques et libellés localisés.
 *
 * Strictement <= 350 lignes, 0 any.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
    isCubeDecisionQuiz,
    filterLegalCubeChoices,
    formatCubeChoiceButtonLabel,
    normalizeCubeActionKey,
    extractCubeTelemetry,
} from '../drillCubeDecisionHelper';
import { validateDrillNotationChoice } from '../blunderDrillEngine';
import { DrillChoicesGrid } from '../../../components/drills/DrillChoicesGrid';
import { DrillCoachFeedback } from '../../../components/drills/DrillCoachFeedback';
import type { PlayerBlunderRecord, DrillValidationResult } from '../types';

const SAMPLE_CUBE_BLUNDER: PlayerBlunderRecord = {
    id: 'bgsage3p_v4_cube_m7_4a2a_3_5_3',
    createdAt: '2026-11-06T15:00:00.000Z',
    quizType: 'CUBE_DECISION',
    conceptId: 'cube_decision',
    conceptName: 'Décision de Videau 3-Ply Cubeful (Double / Take / Pass)',
    dice: [0, 0],
    player: 'X',
    board: [
        0, 2, 0, 0, 0, 0, -5,
        0, -3, 0, 0, 0, 5,
        -5, 0, 0, 0, 3, 0,
        5, 0, 0, 0, 0, -2,
        0, 0, 0,
    ],
    optimalMove: 'Double / Pass',
    playedMove: 'No Double / Take',
    acceptableMoves: ['No Double / Take'],
    quizChoices: ['Double / Pass', 'No Double / Take', 'Double / Take'],
    equityLoss: 0.019,
    verdict: 'doubtful',
    whyFailed: 'No Double / Take concède 0.019 EMG en 3-ply (110 vs 110 pips).',
    explanation:
        'En 3-ply Cubeful (110 vs 110 pips, Match 7 pts (3-5 • 4-away / 2-away • Videau : 1)), Double / Pass (+1.000 EMG) devance No Double / Take de 0.019 EMG avec 2/36 lancers constructifs.',
    proverb: 'Vérifiez toujours le compte de course et les 36 réponses adverses en 3-ply.',
    hint: 'Observez le compte (110 vs 110 pips) et vos 2/36 lancers constructifs avant de décider du videau.',
    tier: 4,
    quizTargetER: 3.5,
    plyCount: 15,
    matchContext: {
        matchLength: 7,
        scoreX: 3,
        scoreO: 5,
        crawford: false,
        cubeValue: 1,
        cubeOwner: null,
    },
    candidateMoves3Ply: [
        { rank: 1, notation: 'Double / Pass', equityLoss: 0, win: 0.794, winGammon: 0.114 },
        { rank: 2, notation: 'No Double / Take', equityLoss: 0.019, win: 0.794, winGammon: 0.114 },
        { rank: 3, notation: 'Double / Take', equityLoss: 0.495, win: 0.794, winGammon: 0.114 },
    ],
    timesReviewed: 0,
    timesSolved: 0,
    isMastered: false,
};

describe('MISSION 33/50 : Contrôle des Quiz de Videau (CUBE_DECISION)', () => {
    it('1. Détecte fidèlement les Quiz de Videau via isCubeDecisionQuiz', () => {
        expect(isCubeDecisionQuiz(SAMPLE_CUBE_BLUNDER)).toBe(true);
        expect(isCubeDecisionQuiz({ quizType: 'CUBE_DECISION' })).toBe(true);
        expect(isCubeDecisionQuiz({ dice: [0, 0] })).toBe(true);
        expect(isCubeDecisionQuiz({ optimalMove: 'Double / Take' })).toBe(true);
        expect(isCubeDecisionQuiz({ quizType: 'CHECKER_PLAY', dice: [6, 5], optimalMove: '24/18 13/8' })).toBe(false);
    });

    it('2. Interdit STRICTEMENT l’option BEAVER en Match Play (matchLength > 0)', () => {
        const choicesWithBeaver = ['No Double / Take', 'Double / Take', 'Double / Pass', 'Beaver'];

        // En Match Play (matchLength = 7) : Beaver doit être éliminé à 100%
        const matchChoices = filterLegalCubeChoices(choicesWithBeaver, 7);
        expect(matchChoices).not.toContain('Beaver');
        expect(matchChoices).toEqual(['No Double / Take', 'Double / Take', 'Double / Pass']);

        // En Money Play (matchLength = 0) : Beaver peut être conservé
        const moneyChoices = filterLegalCubeChoices(choicesWithBeaver, 0);
        expect(moneyChoices).toContain('Beaver');
    });

    it('3. Formate les boutons de réponse avec les actions explicites en FR et EN', () => {
        // En Français
        expect(formatCubeChoiceButtonLabel('No Double / Take', 'fr')).toBe('Pas de Double');
        expect(formatCubeChoiceButtonLabel('No Double', 'fr')).toBe('Pas de Double');
        expect(formatCubeChoiceButtonLabel('Double / Take', 'fr')).toBe('Doubler ×2 / Accepter (Take)');
        expect(formatCubeChoiceButtonLabel('Double / Pass', 'fr')).toBe('Doubler ×2 / Refuser (Pass)');
        expect(formatCubeChoiceButtonLabel('Double / Drop', 'fr')).toBe('Doubler ×2 / Refuser (Pass)');

        // En Anglais
        expect(formatCubeChoiceButtonLabel('No Double / Take', 'en')).toBe('No Double');
        expect(formatCubeChoiceButtonLabel('Double / Take', 'en')).toBe('Double ×2 / Take');
        expect(formatCubeChoiceButtonLabel('Double / Pass', 'en')).toBe('Double ×2 / Pass');
    });

    it('4. Normalise les clés d’action de videau pour une validation symétrique canonique et localisée', () => {
        expect(normalizeCubeActionKey('No Double / Take')).toBe('no_double');
        expect(normalizeCubeActionKey('Pas de Double')).toBe('no_double');
        expect(normalizeCubeActionKey('Double / Take')).toBe('double_take');
        expect(normalizeCubeActionKey('Doubler ×2 / Accepter (Take)')).toBe('double_take');
        expect(normalizeCubeActionKey('Double / Pass')).toBe('double_pass');
        expect(normalizeCubeActionKey('Doubler ×2 / Refuser (Pass)')).toBe('double_pass');
    });

    it('5. Valide fidèlement la réponse au Quiz de Videau via validateDrillNotationChoice', () => {
        // Coup optimal sélectionné via libellé canonique
        const optimalRes = validateDrillNotationChoice(SAMPLE_CUBE_BLUNDER, 'Double / Pass');
        expect(optimalRes.isCorrect).toBe(true);
        expect(optimalRes.verdict).toBe('optimal');

        // Coup optimal sélectionné via libellé FR
        const optimalFrRes = validateDrillNotationChoice(SAMPLE_CUBE_BLUNDER, 'Doubler ×2 / Refuser (Pass)');
        expect(optimalFrRes.isCorrect).toBe(true);
        expect(optimalFrRes.verdict).toBe('optimal');

        // Erreur sélectionnée (Double / Take alors que c’est Double / Pass, perte 0.495 EMG)
        const wrongRes = validateDrillNotationChoice(SAMPLE_CUBE_BLUNDER, 'Doubler ×2 / Accepter (Take)');
        expect(wrongRes.isCorrect).toBe(false);
        expect(wrongRes.verdict).toBe('blunder');
    });

    it('6. Extrait la télémétrie complète du Videau : % Victoire, % Gammon et Take Point', () => {
        const telemetry = extractCubeTelemetry(SAMPLE_CUBE_BLUNDER);
        expect(telemetry.winPct).toBe('79.4');
        expect(telemetry.gammonPct).toBe('11.4');
        expect(Number(telemetry.takePointPct)).toBeGreaterThan(0);
        expect(Number(telemetry.takePointPct)).toBeLessThanOrEqual(50);
    });

    it('7. Rendu HTML de DrillChoicesGrid : affiche le badge Décision de Videau et les 3 boutons d’action', () => {
        const html = renderToStaticMarkup(
            React.createElement(DrillChoicesGrid, {
                choices: SAMPLE_CUBE_BLUNDER.quizChoices ?? [],
                optimalMove: SAMPLE_CUBE_BLUNDER.optimalMove,
                dice: SAMPLE_CUBE_BLUNDER.dice,
                isErMode: true,
                validationResult: null,
                isCubeDecision: true,
                matchLength: 7,
                hoveredChoiceNotation: null,
            }),
        );

        // Badge videau présent
        expect(html).toContain('Décision de Videau');
        expect(html).toContain('Action avant de lancer');

        // Libellés des 3 actions présents
        expect(html).toContain('Pas de Double');
        expect(html).toContain('Doubler ×2 / Accepter (Take)');
        expect(html).toContain('Doubler ×2 / Refuser (Pass)');

        // Zéro Beaver
        expect(html.toLowerCase()).not.toContain('beaver');
    });

    it('8. Rendu HTML de DrillCoachFeedback : affiche clairement % Victoire, % Gammon et Seuil de Prise (Take Point)', () => {
        const validationResult: DrillValidationResult = {
            isCorrect: true,
            verdict: 'optimal',
            equityLoss: 0,
            playedNotation: 'Double / Pass',
            optimalNotation: 'Double / Pass',
            feedbackMessage: '👑 Coup optimal trouvé !',
            canRetry: false,
        };

        const html = renderToStaticMarkup(
            React.createElement(DrillCoachFeedback, {
                currentBlunder: SAMPLE_CUBE_BLUNDER,
                validationResult,
                isErMode: true,
                attemptsLeft: 2,
                currentMetricScore: 6.3,
                onNextBlunder: () => {},
            }),
        );

        // Télémétrie de videau présente
        expect(html).toContain('drill-cube-telemetry-badge');
        expect(html).toContain('% de victoire');
        expect(html).toContain('79.4%');
        expect(html).toContain('% de Gammon');
        expect(html).toContain('11.4%');
        expect(html).toContain('Take Point');
    });
});
