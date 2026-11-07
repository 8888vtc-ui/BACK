// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BeginnerAcademyFlow } from './BeginnerAcademyFlow';

describe('BeginnerAcademyFlow Component', () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('affiche le lecteur vidéo et le score de points au chargement', () => {
    render(<BeginnerAcademyFlow />);
    expect(screen.getByText(/Mini-Série Vidéo Débutant|Beginner Video/i)).toBeDefined();
    expect(screen.getAllByText(/PTS/i).length).toBeGreaterThan(0);
  });

  it('permet de basculer vers les quiz d initiation et de gagner des points', () => {
    render(<BeginnerAcademyFlow />);
    const launchBtn = screen.getByText(/Tester avec 2 mini-quiz|Test with 2 mini-quizzes/i);
    fireEvent.click(launchBtn);

    expect(screen.getByText(/Quiz 1\/10/i)).toBeDefined();
    const correctOption = screen.getByTestId('academy-option-B');
    fireEvent.click(correctOption);

    expect(screen.getByText(/Exact !|Correct!/i)).toBeDefined();
  });

  it('navigue directement vers n importe quel quiz via les boutons 1 à 10', () => {
    render(<BeginnerAcademyFlow />);
    const launchBtn = screen.getByText(/Tester avec 2 mini-quiz|Test with 2 mini-quizzes/i);
    fireEvent.click(launchBtn);

    const stepBtn5 = screen.getByTestId('academy-quiz-step-btn-5');
    fireEvent.click(stepBtn5);
    expect(screen.getByTitle('Quiz 5/10')).toBeDefined();
  });

  it('reprend automatiquement au premier quiz non encore validé', () => {
    // 7 premiers quiz déjà validés (IDs 1 à 7)
    localStorage.setItem('bgtour_beginner_completed_quizzes_v1', JSON.stringify([1, 2, 3, 4, 5, 6, 7]));
    localStorage.setItem('bgtour_beginner_academy_progress', JSON.stringify({ scorePoints: 700, completedQuizIds: [1, 2, 3, 4, 5, 6, 7] }));

    render(<BeginnerAcademyFlow />);
    const tabQuizzes = screen.getByTestId('academy-tab-quizzes');
    fireEvent.click(tabQuizzes);

    // Le quiz actif doit être le Quiz 8/10
    const stepBtn8 = screen.getByTestId('academy-quiz-step-btn-8');
    expect(stepBtn8.className).toContain('bg-[#D4AF37]');
  });

  it('bascule sur l écran du diplôme avec +2 000 PTS quand tous les quiz sont validés', () => {
    localStorage.setItem('bgtour_beginner_completed_quizzes_v1', JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    render(<BeginnerAcademyFlow />);

    expect(screen.getByTestId('academy-diploma-card')).toBeDefined();
    expect(screen.getByText(/\+2 000 PTS/i)).toBeDefined();
    expect(screen.getByTestId('diploma-launch-guided-match-btn')).toBeDefined();
    const reviewBtn = screen.getByTestId('diploma-review-lessons-btn');
    expect(reviewBtn).toBeDefined();

    // Revoir les 10 leçons réouvre le quiz 1
    fireEvent.click(reviewBtn);
    expect(screen.getByTestId('academy-quiz-container')).toBeDefined();
  });

  it('affiche les 5 épisodes sans doublon et permet de basculer le son WebAudio', () => {
    render(<BeginnerAcademyFlow />);
    for (let ep = 1; ep <= 5; ep++) {
      expect(screen.getByTestId(`academy-episode-tab-${ep}`)).toBeDefined();
    }
    const soundToggle = screen.getByTestId('academy-sound-toggle-btn');
    expect(soundToggle.textContent).toContain('Effets Sonores : ON');
    fireEvent.click(soundToggle);
    expect(soundToggle.textContent).toContain('Effets Sonores : OFF');
  });
});

