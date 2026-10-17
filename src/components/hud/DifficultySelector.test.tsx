import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import DifficultySelector from './DifficultySelector';

describe('DifficultySelector', () => {
    it('affiche les 3 niveaux d’IA (Débutant 0-ply, Intermédiaire 1-ply, Expert 2-ply)', () => {
        const html = renderToStaticMarkup(
            <DifficultySelector difficulty="intermediate" onChange={vi.fn()} />,
        );

        expect(html).toContain('Débutant');
        expect(html).toContain('0-ply');
        expect(html).toContain('Intermédiaire');
        expect(html).toContain('1-ply');
        expect(html).toContain('Expert');
        expect(html).toContain('2-ply');
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
            <DifficultySelector difficulty="intermediate" onChange={vi.fn()} disabled={true} />,
        );

        expect(html).toContain('disabled=""');
        expect(html).toContain('cursor-not-allowed');
    });
});
