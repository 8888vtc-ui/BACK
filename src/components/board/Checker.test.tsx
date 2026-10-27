// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, cleanup } from '@testing-library/react';
import { Checker, BADGE_MIN_COUNT } from './Checker';
import { computeCheckerStackLayout } from './boardGeometry';
import { BoardPoint } from './BoardPoint';

afterEach(() => {
    cleanup();
});

describe('Checker & High Stack Readability (Audit 14 / 20)', () => {
    it('affiche le badge numérique quand countBadge >= 2', () => {
        const html = renderToStaticMarkup(
            <Checker color="white" countBadge={2} />,
        );
        expect(html).toContain('2');
    });

    it('affiche le badge numérique (7) pour une grande pile', () => {
        const html = renderToStaticMarkup(
            <Checker color="black" countBadge={7} />,
        );
        expect(html).toContain('7');
    });

    it('n\'affiche pas de badge quand countBadge est absent', () => {
        const html = renderToStaticMarkup(<Checker color="white" />);
        expect(html).not.toContain('font-extrabold');
    });

    it('n\'affiche pas de badge quand countBadge < 2', () => {
        const html = renderToStaticMarkup(
            <Checker color="white" countBadge={1} />,
        );
        expect(html).not.toContain('font-extrabold');
    });

    it('expose un seuil BADGE_MIN_COUNT égal à 2', () => {
        expect(BADGE_MIN_COUNT).toBe(2);
    });

    it('calcule un tassement vertical adaptatif progressif au-delà de 5 pions et place le badge ×N sur l’apex', () => {
        const normalTop = computeCheckerStackLayout(5, true);
        expect(normalTop.isCompressed).toBe(false);
        expect(normalTop.visibleCheckers).toBe(5);
        expect(normalTop.overlapPx).toBe(1);
        expect(normalTop.badgeCount).toBeUndefined();
        expect(normalTop.apexIndex).toBe(4);

        const stack6Top = computeCheckerStackLayout(6, true);
        expect(stack6Top.isCompressed).toBe(true);
        expect(stack6Top.visibleCheckers).toBe(5);
        expect(stack6Top.overlapPx).toBeGreaterThan(1);
        expect(stack6Top.badgeCount).toBe(6);
        expect(stack6Top.badgeText).toBe('6');
        expect(stack6Top.apexIndex).toBe(4);

        const stack10Bottom = computeCheckerStackLayout(10, false);
        expect(stack10Bottom.isCompressed).toBe(true);
        expect(stack10Bottom.overlapPx).toBeGreaterThan(stack6Top.overlapPx);
        expect(stack10Bottom.badgeText).toBe('10');
        expect(stack10Bottom.apexIndex).toBe(0);
    });

    it('rend une pile haute (6 pions) sur le jan inférieur avec badge 6 au sommet et zéro débordement', () => {
        const { getByTestId } = render(
            <BoardPoint
                pointNumber={6}
                isTopRow={false}
                checkerColor="white"
                checkerCount={6}
                isMovable={true}
                onClickPoint={vi.fn()}
            />,
        );

        const stack = getByTestId('point-stack-6');
        expect(stack.getAttribute('data-stack-compressed')).toBe('true');
        expect(stack.className).toContain('max-h-full');
        expect(stack.className).toContain('overflow-hidden');

        // Le badge 6 est affiché exactement une fois sur l'apex (checker-p6-0 pour isTopRow=false)
        const apexChecker = getByTestId('checker-p6-0');
        expect(apexChecker.textContent).toBe('6');
        expect((apexChecker as HTMLElement).style.zIndex).toBe('5');
    });
});
