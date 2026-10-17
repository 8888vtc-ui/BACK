import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BlunderDrillView from './BlunderDrillView';
import { clearBlunderBank } from '../../features/drills/blunderBank';

// Mock Capacitor Haptics
vi.mock('../../lib/capacitor/haptics', () => ({
    impactLight: vi.fn(),
    notificationSuccess: vi.fn(),
    notificationError: vi.fn(),
}));

// Mock ToastContext
vi.mock('../toast/ToastContext', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

describe('BlunderDrillView Component', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockLocalStorage = {
            getItem: vi.fn((key: string) => mockStore[key] ?? null),
            setItem: vi.fn((key: string, val: string) => {
                mockStore[key] = String(val);
            }),
            removeItem: vi.fn((key: string) => {
                delete mockStore[key];
            }),
            clear: vi.fn(() => {
                mockStore = {};
            }),
        };

        vi.stubGlobal('window', {
            localStorage: mockLocalStorage,
        });

        clearBlunderBank();
    });

    it('affiche l’en-tête, les compteurs de maîtrise et le premier blunder à travailler (trié par perte d’équité)', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('Drills de Blunders');
        expect(html).toContain('Rejeu interactif');
        expect(html).toContain('data-testid="mastered-count"');
        expect(html).toContain('0 / 5');

        // Vérifie la mention du coup passé du blunder prioritaire (blot_safety, perte 0.215)
        expect(html).toContain('Votre coup passé :');
        expect(html).toContain('13/9 13/11');
        expect(html).toContain('-0.215 ΔEq');
    });

    it('affiche les boutons de contrôle : Indice, Réinitialiser et le sélecteur de concept', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('data-testid="drill-hint-toggle"');
        expect(html).toContain('Indice');
        expect(html).toContain('data-testid="drill-reset-btn"');
        expect(html).toContain('Réinitialiser');
        expect(html).toContain('data-testid="concept-filter"');
    });

    it('supporte le filtre par concept initial', () => {
        const html = renderToStaticMarkup(
            <BlunderDrillView initialConceptId="golden_point" />,
        );

        expect(html).toContain('Contrôle du Golden Point (Porte 5 / 20)');
        expect(html).toContain('24/21 13/12');
        expect(html).toContain('-0.178 ΔEq');
    });

    it('affiche le plateau SVG interactif de Backgammon et les dés', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('svg');
        expect(html).toContain('data-testid="board-die-0"');
    });
});
