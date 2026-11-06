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
});

