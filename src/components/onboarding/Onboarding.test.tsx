// @vitest-environment jsdom
/**
 * Tests du composant Onboarding.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Onboarding } from './Onboarding';

afterEach(() => {
    cleanup();
});

describe('Onboarding', () => {
    it('affiche le premier écran', () => {
        render(<Onboarding onComplete={vi.fn()} />);
        expect(screen.getByTestId('onboarding')).toBeTruthy();
        expect(screen.getByText('Lance les dés')).toBeTruthy();
    });

    it('avance au deuxième écran au clic Suivant', () => {
        render(<Onboarding onComplete={vi.fn()} />);
        fireEvent.click(screen.getByTestId('onboarding-next'));
        expect(screen.getByText('Joue en 1 tap')).toBeTruthy();
    });

    it('appelle onComplete au dernier écran', () => {
        const onComplete = vi.fn();
        render(<Onboarding onComplete={onComplete} />);
        // 3 clics pour traverser les 3 écrans
        fireEvent.click(screen.getByTestId('onboarding-next'));
        fireEvent.click(screen.getByTestId('onboarding-next'));
        fireEvent.click(screen.getByTestId('onboarding-next'));
        expect(onComplete).toHaveBeenCalled();
    });
});
