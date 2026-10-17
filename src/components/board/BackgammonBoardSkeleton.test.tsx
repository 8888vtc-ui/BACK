import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BackgammonBoardSkeleton from './BackgammonBoardSkeleton';
import BackgammonBoard from './BackgammonBoard';
import { createInitialState } from '../../engine/backgammonEngine';

describe('BackgammonBoardSkeleton', () => {
    it('rend le SVG au ratio 16:10 (viewBox 1120x700)', () => {
        const html = renderToStaticMarkup(<BackgammonBoardSkeleton />);
        expect(html).toContain('viewBox="0 0 1120 700"');
        expect(html).toContain('role="status"');
        expect(html).toContain('aria-live="polite"');
        expect(html).toContain('animate-pulse');
    });

    it('affiche 24 flèches / triangles de chargement', () => {
        const html = renderToStaticMarkup(<BackgammonBoardSkeleton />);
        // 24 polygones pour les flèches du plateau
        const polygonCount = (html.match(/<polygon/g) || []).length;
        expect(polygonCount).toBe(24);
    });

    it('affiche le message de chargement et un spinner SVG accessible', () => {
        const html = renderToStaticMarkup(<BackgammonBoardSkeleton message="Initialisation du match..." />);
        expect(html).toContain('Initialisation du match...');
        expect(html).toContain('animate-spin');
        expect(html).toContain('aria-label="Initialisation du match..."');
    });

    it('BackgammonBoard affiche BackgammonBoardSkeleton quand isLoading=true', () => {
        const state = createInitialState();
        const emptyMap = new Map();
        const html = renderToStaticMarkup(
            <BackgammonBoard
                state={state}
                leftDieTargets={emptyMap}
                rightDieTargets={emptyMap}
                selectedPoint={null}
                selectedDie={null}
                usedDice={[false, false]}
                onCheckerClick={() => {}}
                onCheckerRightClick={() => {}}
                onDestinationClick={() => {}}
                isLoading={true}
            />,
        );

        // Doit afficher le squelette et non les pions interactifs
        expect(html).toContain('Chargement du plateau de jeu...');
        expect(html).toContain('animate-pulse');
        expect(html).not.toContain('bgGradX');
    });
});
