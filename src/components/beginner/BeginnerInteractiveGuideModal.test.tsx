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

  it('affiche le premier chapitre et permet de naviguer vers le chapitre suivant', () => {
    render(<BeginnerInteractiveGuideModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/1 \/ 6/)).toBeDefined();
    expect(screen.getByText(/Pourquoi le Backgammon est de la pure Stratégie|Why Backgammon is Pure Strategy/i)).toBeDefined();

    const nextBtn = screen.getByTestId('guide-next-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByText(/2 \/ 6/)).toBeDefined();
    expect(screen.getByText(/Le Circuit en Fer à Cheval|The Horseshoe Track/i)).toBeDefined();
  });
});
