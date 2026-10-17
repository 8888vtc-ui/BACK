import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DailyPuzzleView from './DailyPuzzleView';

describe('DailyPuzzleView', () => {
    let mockStore: Record<string, string> = {};

    beforeEach(() => {
        mockStore = {};
        const mockStorage = {
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
            localStorage: mockStorage,
        });
    });

    it('affiche l’en-tête du défi quotidien et le badge de série en cours', () => {
        const html = renderToStaticMarkup(<DailyPuzzleView />);

        expect(html).toContain('Défi Backgammon Quotidien');
        expect(html).toContain('data-testid="puzzle-streak-badge"');
        expect(html).toContain('Série en cours');
    });

    it('affiche le titre du puzzle, sa catégorie et les dés à jouer', () => {
        const html = renderToStaticMarkup(
            <DailyPuzzleView initialPuzzleId="puzzle_01_gold_point" />,
        );

        expect(html).toContain('Le Point d’Or (Golden Point)');
        expect(html).toContain('Jet à jouer :');
        expect(html).toContain('3');
        expect(html).toContain('1');
        expect(html).toContain('Ouverture');
    });

    it('affiche les boutons de contrôle : Valider, Réinitialiser, Indice et Voir la solution', () => {
        const html = renderToStaticMarkup(<DailyPuzzleView />);

        expect(html).toContain('data-testid="puzzle-verify-button"');
        expect(html).toContain('Valider ma réponse');
        expect(html).toContain('data-testid="puzzle-reset-button"');
        expect(html).toContain('Réinitialiser');
        expect(html).toContain('data-testid="puzzle-hint-button"');
        expect(html).toContain('Indice');
        expect(html).toContain('data-testid="puzzle-solution-button"');
        expect(html).toContain('Voir la solution');
    });

    it('rend le catalogue des puzzles avec toutes les situations disponibles', () => {
        const html = renderToStaticMarkup(<DailyPuzzleView />);

        expect(html).toContain('Catalogue des Puzzles &amp; Archives');
        expect(html).toContain('data-testid="puzzle-card-puzzle_01_gold_point"');
        expect(html).toContain('data-testid="puzzle-card-puzzle_02_lovers_leap"');
        expect(html).toContain('data-testid="puzzle-card-puzzle_04_bearoff_safety"');
    });
});
