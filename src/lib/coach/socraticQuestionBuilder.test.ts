// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { buildSocraticQuestion } from './socraticQuestionBuilder';
import { classifyPosition } from './positionClassifier';
import {
    BACKGAMMON_COACH_SYSTEM_PROMPT,
    BACKGAMMON_COACH_SYSTEM_PROMPT_EN,
    generateRuleBasedExplanation,
    buildMichyMagrielWoolseySynthesis,
} from './prompts';
import { CoachDiagnosticBox } from '../../components/coach/CoachDiagnosticBox';

describe('Chantier 5 — Coach Socratique Interactif (Méthode Michy / Magriel / Woolsey)', () => {
    afterEach(() => {
        cleanup();
    });

    describe('1. socraticQuestionBuilder & positionClassifier', () => {
        it('génère en FR une question socratique ciblée (+16 pips et point 5 ouvert) et identifie Attaque / Blitz sur une frappe', () => {
            const challenge = buildSocraticQuestion({
                gamePhase: 'contact',
                playerPips: 124,
                opponentPips: 140,
                pipDiff: 16,
                equityLoss: 0.068,
                bestMoveNotation: '13/8 6/5*',
                concepts: ['blitz-attack', 'golden-point'],
                locale: 'fr',
            });

            expect(challenge.shouldTrigger).toBe(true);
            expect(challenge.question).toContain("+16 pips d'avance");
            expect(challenge.question).toContain('point 5');
            expect(challenge.question).toContain('quel est ton plan de jeu prioritaire ici ?');
            expect(challenge.choices).toEqual([
                'Course pure (Race)',
                'Attaque / Blitz',
                'Prime / Contention',
            ]);
            expect(challenge.optimalPlanId).toBe('blitz');
            expect(challenge.optimalChoiceIndex).toBe(1);
            expect(challenge.optimalChoice).toBe('Attaque / Blitz');
            expect(challenge.options[1].isOptimal).toBe(true);
            expect(challenge.explanation).toContain('13/8 6/5*');
            expect(challenge.threePillars.connectivity).toContain('13/8 6/5*');
            expect(challenge.threePillars.timingAndRace).toContain('124 contre 140 pips');
            expect(challenge.threePillars.duplicationAndPurity).toContain('Attaque / Blitz');
        });

        it('génère en EN une question socratique ciblée et identifie Pure Race (Race) en cas d’avance aux pips sans frappe', () => {
            const challenge = buildSocraticQuestion({
                gamePhase: 'race',
                playerPips: 98,
                opponentPips: 118,
                pipDiff: 20,
                equityLoss: 0.045,
                bestMoveNotation: '24/13',
                concepts: ['running-game'],
                locale: 'en',
            });

            expect(challenge.shouldTrigger).toBe(true);
            expect(challenge.question).toContain('+20 pip lead');
            expect(challenge.question).toContain('what is your priority game plan here?');
            expect(challenge.choices).toEqual([
                'Pure Race (Race)',
                'Attack / Blitz',
                'Prime / Containment',
            ]);
            expect(challenge.optimalPlanId).toBe('race');
            expect(challenge.optimalChoiceIndex).toBe(0);
            expect(challenge.options[0].isOptimal).toBe(true);
            expect(challenge.explanation).toContain('Magriel');
        });

        it('identifie Prime / Contention lorsque le meilleur coup construit le Golden Point (8/5 6/5)', () => {
            const classification = classifyPosition({
                gamePhase: 'contact',
                playerPips: 152,
                opponentPips: 150,
                bestMoveNotation: '8/5 6/5',
                primeLength: 4,
            });
            expect(classification.concepts).toContain('golden-point');
            expect(classification.concepts).toContain('prime-vs-prime');

            const challenge = buildSocraticQuestion({
                gamePhase: classification.normalizedPhase,
                playerPips: 152,
                opponentPips: 150,
                equityLoss: 0.095,
                bestMoveNotation: '8/5 6/5',
                concepts: classification.concepts,
                locale: 'fr',
            });

            expect(challenge.optimalPlanId).toBe('prime');
            expect(challenge.optimalChoiceIndex).toBe(2);
            expect(challenge.optimalChoice).toBe('Prime / Contention');
            expect(challenge.options[2].isOptimal).toBe(true);
        });

        it('désactive shouldTrigger lorsque la perte d’équité est <= 0.020 (coup Optimal ou Bon)', () => {
            const goodMoveChallenge = buildSocraticQuestion({
                gamePhase: 'contact',
                playerPips: 140,
                opponentPips: 140,
                equityLoss: 0.015,
                bestMoveNotation: '8/5 6/5',
                locale: 'fr',
            });

            expect(goodMoveChallenge.shouldTrigger).toBe(false);
        });
    });

    describe('2. Intégration UI dans CoachDiagnosticBox & CoachSocraticQuizCard', () => {
        it('affiche la carte Question du Grand-Maître sur un Blunder (equityLoss > 0.020) et déroule les 3 Piliers au clic sur le bon plan', () => {
            render(
                React.createElement(CoachDiagnosticBox, {
                    equityLoss: -0.085,
                    bestMoveNotation: '13/8 6/5*',
                    playedMoveNotation: '13/7',
                    playerPips: 124,
                    opponentPips: 140,
                    explanation: 'Analyse complète du moteur.',
                    locale: 'fr',
                }),
            );

            expect(screen.getByTestId('coach-socratic-quiz-card')).toBeDefined();
            expect(screen.getByTestId('socratic-quiz-question').textContent).toContain("+16 pips d'avance");
            expect(screen.queryByTestId('socratic-three-pillars')).toBeNull();

            // Clic sur le choix optimal (Attaque / Blitz, index 1)
            fireEvent.click(screen.getByTestId('socratic-plan-btn-1'));

            const feedback = screen.getByTestId('socratic-quiz-feedback');
            expect(feedback.textContent).toContain('Correct ✅');
            expect(feedback.textContent).toContain('13/8 6/5*');

            // Les 3 Piliers Grands-Maîtres sont déroulés
            expect(screen.getByTestId('socratic-three-pillars')).toBeDefined();
            expect(screen.getByTestId('socratic-pillar-connectivity').textContent).toContain('Connectivity');
            expect(screen.getByTestId('socratic-pillar-timing').textContent).toContain('Timing / Race');
            expect(screen.getByTestId('socratic-pillar-duplication').textContent).toContain('Duplication / Purity');
        });

        it('affiche Incorrect ❌ avec explication stratégique lorsque le joueur clique sur un plan sous-optimal', () => {
            render(
                React.createElement(CoachDiagnosticBox, {
                    equityLoss: 0.055,
                    bestMoveNotation: '8/5 6/5',
                    playerPips: 150,
                    opponentPips: 150,
                    concepts: ['golden-point'],
                    locale: 'fr',
                }),
            );

            // Clic sur Course pure (index 0) alors que le plan optimal est Prime / Contention (index 2)
            fireEvent.click(screen.getByTestId('socratic-plan-btn-0'));

            const feedback = screen.getByTestId('socratic-quiz-feedback');
            expect(feedback.textContent).toContain('Incorrect ❌');
            expect(feedback.textContent).toContain('Prime / Contention');
            expect(screen.getByTestId('socratic-three-pillars')).toBeDefined();
        });

        it('permet de dérouler directement les 3 Piliers via le bouton discret « Voir directement l’analyse »', () => {
            render(
                React.createElement(CoachDiagnosticBox, {
                    equityLoss: 0.042,
                    bestMoveNotation: '24/13',
                    playerPips: 110,
                    opponentPips: 130,
                    locale: 'fr',
                }),
            );

            const skipBtn = screen.getByTestId('socratic-skip-btn');
            expect(skipBtn.textContent).toContain("Voir directement l'analyse");

            fireEvent.click(skipBtn);

            expect(screen.getByTestId('socratic-three-pillars')).toBeDefined();
            expect(screen.queryByTestId('socratic-skip-btn')).toBeNull();
        });
    });

    describe('3. Prompts gemini-3.8-flash & Fallback déterministe Michy / Magriel / Woolsey', () => {
        it('structure le prompt système et le fallback local autour des critères de Michy, Magriel et Woolsey', () => {
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('gemini-3.8-flash');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Michy / Magriel / Woolsey');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Connectivity');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Timing / Race');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT).toContain('Duplication / Purity');

            expect(BACKGAMMON_COACH_SYSTEM_PROMPT_EN).toContain('gemini-3.8-flash');
            expect(BACKGAMMON_COACH_SYSTEM_PROMPT_EN).toContain('Michy / Magriel / Woolsey');

            const fallback = generateRuleBasedExplanation({
                verdict: 'blunder',
                equityLoss: -0.11,
                playedMove: '13/7',
                optimalMove: '8/5 6/5',
                features: {
                    player: 'X',
                    pipCountDiff: { player: 138, opponent: 150, leader: 'X', diff: -12 },
                    blotsAndShots: { user: [], best: [] },
                    boardStructure: {
                        innerBoardPoints: 3,
                        advancedAnchor: false,
                        goldenPoint: true,
                        barPoint: true,
                        longestPrime: 3,
                    },
                    contactStatus: 'contact',
                },
                language: 'fr',
            });

            expect(fallback.explanation).toContain('Synthèse Grand-Maître (Michy / Magriel / Woolsey');
            expect(fallback.explanation).toContain('Connectivité (Michy / Magriel)');
            expect(fallback.explanation).toContain('Timing & Course (Trice / Magriel)');
            expect(fallback.explanation).toContain('Duplication & Pureté (Mochy / Woolsey)');

            const synthesisEn = buildMichyMagrielWoolseySynthesis({
                optimalMove: '8/5 6/5',
                playerPips: 138,
                opponentPips: 150,
                equityLoss: 0.11,
                directShotsConceded: 0,
                isEn: true,
            });
            expect(synthesisEn).toContain('Grandmaster Synthesis (Michy / Magriel / Woolsey');
        });
    });
});
