// @vitest-environment jsdom
/**
 * Tests du composant ColorSelector et de ses helpers de persistance.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ColorSelector, {
    readStoredPlayerColor,
    storePlayerColor,
    PLAYER_COLOR_KEY,
} from './ColorSelector';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('readStoredPlayerColor / storePlayerColor', () => {
    it('retourne X (Blanc) par défaut', () => {
        expect(readStoredPlayerColor()).toBe('X');
    });

    it('persiste et relit la couleur Noire', () => {
        storePlayerColor('O');
        expect(localStorage.getItem(PLAYER_COLOR_KEY)).toBe('O');
        expect(readStoredPlayerColor()).toBe('O');
    });

    it('retourne X pour une valeur invalide', () => {
        localStorage.setItem(PLAYER_COLOR_KEY, 'Z');
        expect(readStoredPlayerColor()).toBe('X');
    });
});

describe('ColorSelector', () => {
    it('affiche les deux couleurs', () => {
        render(<ColorSelector value="X" onChange={vi.fn()} />);
        expect(screen.getByText('Blanc')).toBeTruthy();
        expect(screen.getByText('Noir')).toBeTruthy();
    });

    it('appelle onChange avec la couleur sélectionnée', () => {
        const onChange = vi.fn();
        render(<ColorSelector value="X" onChange={onChange} />);
        fireEvent.click(screen.getByText('Noir'));
        expect(onChange).toHaveBeenCalledWith('O');
    });
});
