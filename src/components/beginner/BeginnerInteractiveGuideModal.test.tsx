// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { BeginnerInteractiveGuideModal } from './BeginnerInteractiveGuideModal';

describe('BeginnerInteractiveGuideModal', () => {
  afterEach(() => {
    cleanup();
  });

  it('ne rend rien si isOpen est false', () => {
    const { container } = render(
      <BeginnerInteractiveGuideModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('affiche le premier chapitre sur l alliance hasard-strategie et les 36 combinaisons', () => {
    render(<BeginnerInteractiveGuideModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/1 \/ 6/)).toBeDefined();
    expect(
      screen.getByText(/L'Alliance Unique du Hasard et de la Stratégie|The Unique Blend of Luck and Strategy/i)
    ).toBeDefined();

    // Vérifie la présence du texte sur Monte-Carlo, les 36 combinaisons, les Blunders et le Videau
    expect(
      screen.getByText(/Championnats du Monde à Monte-Carlo|World Championships in Monte-Carlo/i)
    ).toBeDefined();
    expect(
      screen.getAllByText(/36 combinaisons|36 dice combinations/i).length
    ).toBeGreaterThanOrEqual(1);

    const nextBtn = screen.getByTestId('guide-next-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByText(/2 \/ 6/)).toBeDefined();
    expect(screen.getByText(/Le Circuit en Fer à Cheval|The Horseshoe Track/i)).toBeDefined();
  });
});
