import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DailyPuzzleView from './DailyPuzzleView';
import { PUZZLE_DATABASE } from '../../features/puzzles/puzzleDatabase';

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
        const p0 = PUZZLE_DATABASE[0]!;
        const html = renderToStaticMarkup(
            <DailyPuzzleView initialPuzzleId={p0.id} />,
        );

        expect(html.replace(/&amp;/g, '&')).toContain(p0.title);
        expect(html).toContain('Jet à jouer :');
        expect(html).toContain(String(p0.dice[0]));
        expect(html).toContain(String(p0.dice[1]));
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
        const p0 = PUZZLE_DATABASE[0]!;
        const p1 = PUZZLE_DATABASE[1]!;

        expect(html).toContain('Catalogue des Puzzles &amp; Archives');
        expect(html).toContain(`data-testid="puzzle-card-${p0.id}"`);
        expect(html).toContain(`data-testid="puzzle-card-${p1.id}"`);
    });

    it('épure les bordures en border-white/10 et place l’objectif et le bouton de validation avant le plateau sans micro-texte', () => {
        const html = renderToStaticMarkup(<DailyPuzzleView />);

        const objectiveIdx = html.indexOf('data-testid="puzzle-objective-description"');
        const verifyIdx = html.indexOf('data-testid="puzzle-verify-button"');
        const boardIdx = html.indexOf('board-adaptive-shell');

        expect(html).toContain('border-white/10');
        expect(objectiveIdx).toBeGreaterThan(-1);
        expect(verifyIdx).toBeGreaterThan(-1);
        expect(boardIdx).toBeGreaterThan(-1);
        expect(objectiveIdx).toBeLessThan(boardIdx);
        expect(verifyIdx).toBeLessThan(boardIdx);

        const headerAndObjectiveHtml = html.slice(0, boardIdx);
        expect(headerAndObjectiveHtml).not.toContain('text-[10px]');
        expect(headerAndObjectiveHtml).not.toContain('text-[9px]');
        expect(headerAndObjectiveHtml).not.toContain('text-[8px]');
    });
});
