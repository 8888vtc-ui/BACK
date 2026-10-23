// @vitest-environment jsdom
/**
 * Tests du composant MatchFormatSelector et de ses helpers de persistance.
 */

import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MatchFormatSelector, {
    readStoredMatchFormat,
    storeMatchFormat,
    MATCH_FORMAT_KEY,
} from './MatchFormatSelector';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
});

describe('readStoredMatchFormat / storeMatchFormat', () => {
    it('retourne 7 par défaut si rien n\'est stocké', () => {
        expect(readStoredMatchFormat()).toBe(7);
    });

    it('persiste et relit un format valide', () => {
        storeMatchFormat(5);
        expect(localStorage.getItem(MATCH_FORMAT_KEY)).toBe('5');
        expect(readStoredMatchFormat()).toBe(5);
    });

    it('retourne 7 pour une valeur invalide', () => {
        localStorage.setItem(MATCH_FORMAT_KEY, '42');
        expect(readStoredMatchFormat()).toBe(7);
    });

    it('accepte le money game (0)', () => {
        storeMatchFormat(0);
        expect(readStoredMatchFormat()).toBe(0);
    });
});

describe('MatchFormatSelector', () => {
    it('affiche les 5 formats', () => {
        render(<MatchFormatSelector value={7} onChange={vi.fn()} />);
        expect(screen.getByText('Money')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
        expect(screen.getByText('7')).toBeTruthy();
        expect(screen.getByText('9')).toBeTruthy();
    });

    it('appelle onChange avec le format sélectionné', () => {
        const onChange = vi.fn();
        render(<MatchFormatSelector value={7} onChange={onChange} />);
        fireEvent.click(screen.getByText('5'));
        expect(onChange).toHaveBeenCalledWith(5);
    });
});
