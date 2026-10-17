// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
    getSavedTheme,
    saveTheme,
    getNextTheme,
    isValidTheme,
    DEFAULT_BOARD_THEME,
    THEME_STORAGE_KEY,
    BoardThemeProvider,
    useBoardTheme,
    getModalThemeClasses,
    getHudThemeClasses,
} from './useBoardTheme';

describe('useBoardTheme helpers & persistence', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                store[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        });
    });

    it('définit le thème par défaut unifié sur snowie_classic', () => {
        expect(DEFAULT_BOARD_THEME).toBe('snowie_classic');
        expect(getSavedTheme()).toBe('snowie_classic');
    });

    it('valide correctement les thèmes autorisés avec isValidTheme', () => {
        expect(isValidTheme('snowie_classic')).toBe(true);
        expect(isValidTheme('tournament')).toBe(true);
        expect(isValidTheme('midnight')).toBe(true);
        expect(isValidTheme('dark')).toBe(false);
        expect(isValidTheme(null)).toBe(false);
        expect(isValidTheme(undefined)).toBe(false);
    });

    it('renvoie le thème par défaut si rien n’est sauvegardé dans localStorage', () => {
        expect(getSavedTheme('snowie_classic')).toBe('snowie_classic');
        expect(getSavedTheme('midnight')).toBe('midnight');
        expect(getSavedTheme('tournament')).toBe('tournament');
    });

    it('charge correctement le thème sauvegardé depuis localStorage', () => {
        store[THEME_STORAGE_KEY] = 'snowie_classic';
        expect(getSavedTheme('midnight')).toBe('snowie_classic');

        store[THEME_STORAGE_KEY] = 'tournament';
        expect(getSavedTheme('midnight')).toBe('tournament');

        store[THEME_STORAGE_KEY] = 'midnight';
        expect(getSavedTheme('tournament')).toBe('midnight');
    });

    it('ignore les valeurs invalides ou corrompues dans localStorage', () => {
        store[THEME_STORAGE_KEY] = 'retro-neon';
        expect(getSavedTheme('snowie_classic')).toBe('snowie_classic');
    });

    it('persiste le thème sélectionné dans localStorage via saveTheme', () => {
        saveTheme('snowie_classic');
        expect(localStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'snowie_classic');
        expect(store[THEME_STORAGE_KEY]).toBe('snowie_classic');

        saveTheme('tournament');
        expect(localStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'tournament');
        expect(store[THEME_STORAGE_KEY]).toBe('tournament');

        saveTheme('midnight');
        expect(localStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'midnight');
        expect(store[THEME_STORAGE_KEY]).toBe('midnight');
    });

    it('calcule la bascule correcte entre snowie_classic, tournament et midnight avec getNextTheme', () => {
        expect(getNextTheme('snowie_classic')).toBe('tournament');
        expect(getNextTheme('tournament')).toBe('midnight');
        expect(getNextTheme('midnight')).toBe('snowie_classic');
    });

    it('génère des classes de modales distinctes et adaptées pour chaque thème', () => {
        const snowieModal = getModalThemeClasses('snowie_classic');
        expect(snowieModal.container).toContain('border-amber-600');
        expect(snowieModal.container).toContain('#25130b');

        const tourModal = getModalThemeClasses('tournament');
        expect(tourModal.container).toContain('border-emerald-600');
        expect(tourModal.container).toContain('#183a24');

        const midModal = getModalThemeClasses('midnight');
        expect(midModal.container).toContain('border-slate-700');
        expect(midModal.container).toContain('slate-900');
    });

    it('génère des classes de HUD distinctes et adaptées pour chaque thème', () => {
        const snowieHud = getHudThemeClasses('snowie_classic');
        expect(snowieHud.container).toContain('border-amber-700');

        const tourHud = getHudThemeClasses('tournament');
        expect(tourHud.container).toContain('border-amber-800');

        const midHud = getHudThemeClasses('midnight');
        expect(midHud.container).toContain('border-slate-700');
    });
});

describe('useBoardTheme Source Unique de Vérité (Context & Provider)', () => {
    let store: Record<string, string> = {};

    beforeEach(() => {
        store = {};
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => store[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                store[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        });
    });

    it('propage le même état entre plusieurs consommateurs au sein de BoardThemeProvider', () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <BoardThemeProvider defaultTheme="snowie_classic">{children}</BoardThemeProvider>
        );

        const { result } = renderHook(
            () => {
                const consumerA = useBoardTheme();
                const consumerB = useBoardTheme();
                return { consumerA, consumerB };
            },
            { wrapper },
        );

        // Initialement sur snowie_classic
        expect(result.current.consumerA.theme).toBe('snowie_classic');
        expect(result.current.consumerB.theme).toBe('snowie_classic');

        // Bascule depuis consumerA
        act(() => {
            result.current.consumerA.toggleTheme();
        });

        // Les deux consommateurs sont synchronisés sur tournament
        expect(result.current.consumerA.theme).toBe('tournament');
        expect(result.current.consumerB.theme).toBe('tournament');
        expect(store[THEME_STORAGE_KEY]).toBe('tournament');

        // Changement direct depuis consumerB vers midnight
        act(() => {
            result.current.consumerB.setTheme('midnight');
        });

        expect(result.current.consumerA.theme).toBe('midnight');
        expect(result.current.consumerB.theme).toBe('midnight');
        expect(store[THEME_STORAGE_KEY]).toBe('midnight');
    });

    it('fonctionne en mode autonome avec persistance lorsqu’il est utilisé hors du Provider', () => {
        const { result } = renderHook(() => useBoardTheme('snowie_classic'));

        expect(result.current.theme).toBe('snowie_classic');

        act(() => {
            result.current.toggleTheme();
        });

        expect(result.current.theme).toBe('tournament');
        expect(store[THEME_STORAGE_KEY]).toBe('tournament');
    });
});
