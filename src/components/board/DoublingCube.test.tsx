import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DoublingCube } from './DoublingCube';

describe('DoublingCube', () => {
    it('affiche 64 quand la valeur est 1 (videau initial)', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={1} cubeOwner={null} />,
        );
        expect(html).toContain('64');
    });

    it('affiche la valeur du videau', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={4} cubeOwner={null} />,
        );
        expect(html).toContain('4');
    });

    it('applique le halo quand canDouble est true', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={2} cubeOwner={null} canDouble />,
        );
        expect(html).toContain('ring-amber-400');
    });

    it('n\'applique pas le halo quand canDouble est false', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={2} cubeOwner={null} canDouble={false} />,
        );
        expect(html).not.toContain('ring-amber-400');
    });

    it('positionne le cube en haut quand O possède', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={2} cubeOwner="O" />,
        );
        expect(html).toContain('self-start');
    });

    it('positionne le cube en bas quand X possède', () => {
        const html = renderToStaticMarkup(
            <DoublingCube cubeValue={2} cubeOwner="X" />,
        );
        expect(html).toContain('self-end');
    });
});
