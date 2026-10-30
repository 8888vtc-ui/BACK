// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import {
    BEGINNER_RULES_LESSONS,
    getCompletedBeginnerLessons,
    markBeginnerLessonCompleted,
} from './beginnerRulesCourse';
import { BeginnerInteractiveRulesCourse } from '../../components/academy/BeginnerInteractiveRulesCourse';

describe('Parcours Débutant Interactif — Apprendre les Règles en 5 Étapes + Quiz + Bravos', () => {
    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it('expose les 5 leçons fondamentales avec plateaux de démonstration et quiz à 3 choix', () => {
        expect(BEGINNER_RULES_LESSONS).toHaveLength(5);
        for (const lesson of BEGINNER_RULES_LESSONS) {
            expect(lesson.board).toHaveLength(26);
            expect(lesson.quizOptions).toHaveLength(3);
            expect(lesson.quizOptions.filter((o) => o.isCorrect)).toHaveLength(1);
            expect(lesson.bravoTitle).toMatch(/Bravo|Félicitations/);
        }
    });

    it('sauvegarde la progression des leçons validées et affiche la célébration « 🎉 Bravo ! » au clic sur la bonne réponse', async () => {
        render(React.createElement(BeginnerInteractiveRulesCourse));

        expect(screen.getByTestId('beginner-active-lesson-title').textContent).toContain(
            'Leçon 1 : Le But du Jeu & Le Sens de Marche',
        );

        // Clique sur la bonne réponse (b) de la Leçon 1
        const optionB = screen.getByTestId('beginner-quiz-option-b');
        fireEvent.click(optionB);

        const feedback = screen.getByTestId('beginner-quiz-feedback');
        expect(feedback.textContent).toContain('🎉 Bravo ! Vous maîtrisez le sens de marche (+20 XP)');

        // Passe à la Leçon 2 via le bouton « Leçon suivante »
        const nextBtn = screen.getByTestId('beginner-next-lesson-btn');
        fireEvent.click(nextBtn);

        expect(screen.getByTestId('beginner-active-lesson-title').textContent).toContain(
            'Leçon 2 : Lancer les Dés & Le Cadeau des Doubles',
        );

        const completed = await markBeginnerLessonCompleted('lesson-1-horseshoe');
        expect(completed).toContain('lesson-1-horseshoe');
        expect(getCompletedBeginnerLessons()).toContain('lesson-1-horseshoe');
    });
});
