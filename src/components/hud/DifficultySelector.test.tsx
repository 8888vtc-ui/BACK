import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DifficultySelector from './DifficultySelector';

describe('DifficultySelector', () => {
    it('affiche les niveaux d’IA (Novice 0-ply, Maître 2-ply, Viktor Orlov 3-ply)', () => {
        const html = renderToStaticMarkup(
            <DifficultySelector difficulty="expert" onChange={vi.fn()} />,
        );

        expect(html).toContain('Novice');
        expect(html).toContain('0-ply');
        expect(html).toContain('Maître');
        expect(html).toContain('2-Ply');
        expect(html).toContain('Viktor Orlov');
        expect(html).toContain('3-Ply Sélectif');
    });

    it('met en surbrillance le niveau actif avec aria-checked="true"', () => {
        const htmlExpert = renderToStaticMarkup(
            <DifficultySelector difficulty="expert" onChange={vi.fn()} />,
        );

        expect(htmlExpert).toContain('aria-checked="true"');
        expect(htmlExpert).toContain('border-rose-500/80');

        const htmlBeginner = renderToStaticMarkup(
            <DifficultySelector difficulty="beginner" onChange={vi.fn()} />,
        );
        expect(htmlBeginner).toContain('border-emerald-500/80');
    });

    it('gère l’état désactivé', () => {
        const html = renderToStaticMarkup(
            <DifficultySelector difficulty="expert" onChange={vi.fn()} disabled={true} />,
        );

        expect(html).toContain('disabled=""');
        expect(html).toContain('cursor-not-allowed');
    });
});
