// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import BlunderDrillView from './BlunderDrillView';
import { clearBlunderBank, getBlunderBankStats } from '../../features/drills/blunderBank';

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

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        clearBlunderBank();
    });

    afterEach(() => {
        cleanup();
    });

    it('affiche l’en-tête, les compteurs de maîtrise et le premier blunder à travailler (trié par perte d’équité)', () => {
        const html = renderToStaticMarkup(<BlunderDrillView />);

        expect(html).toContain('Drills de Blunders');
        expect(html).toContain('Rejeu interactif');
        expect(html).toContain('data-testid="mastered-count"');
        expect(html).toContain('0 / 5');

        // Vérifie la mise en valeur de la position à rejouer et du coup passé (blot_safety, perte 0.215)
        expect(html).toContain('data-testid="drill-position-card"');
        expect(html).toContain('Jet à rejouer');
        expect(html).toContain('Votre coup passé :');
        expect(html).toContain('13/9 13/11');
        expect(html).toContain('-0.215 ΔEq');
        expect(html).not.toContain('text-[8px]');
        expect(html).not.toContain('text-[9px]');
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

    it('ouvre et masque le panneau d’indice au clic sur le bouton Indice', () => {
        render(<BlunderDrillView />);

        expect(screen.queryByTestId('drill-hint-box')).toBeNull();
        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.getByTestId('drill-hint-box')).toBeDefined();

        fireEvent.click(screen.getByTestId('drill-hint-toggle'));
        expect(screen.queryByTestId('drill-hint-box')).toBeNull();
    });

    it('permet de filtrer les erreurs par concept via le sélecteur et de réinitialiser la maîtrise', () => {
        render(<BlunderDrillView />);

        const select = screen.getByTestId('concept-filter') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: 'golden_point' } });
        expect(select.value).toBe('golden_point');
        expect(screen.getByTestId('drill-position-card').textContent).toContain('24/21 13/12');
        expect(getBlunderBankStats().totalBlunders).toBe(5);
    });
});
