import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PipCountBadge, computePipDiff, isLeading, getSavedPipCountVisibility, getRaceStrategicAdvice } from './PipCountBadge';

describe('computePipDiff', () => {
    it('retourne un différentiel négatif quand X a moins de pips (avance)', () => {
        expect(computePipDiff(150, 160)).toBe(-10);
    });

    it('retourne un différentiel positif quand X a plus de pips (retard)', () => {
        expect(computePipDiff(160, 150)).toBe(10);
    });

    it('retourne zéro à égalité', () => {
        expect(computePipDiff(167, 167)).toBe(0);
    });
});

describe('isLeading', () => {
    it('X est en avance quand diff < 0 (pip plus bas)', () => {
        expect(isLeading(-10, 'X')).toBe(true);
    });

    it('X est en retard quand diff > 0', () => {
        expect(isLeading(10, 'X')).toBe(false);
    });

    it('O est en avance quand diff > 0 (pip X plus haut)', () => {
        expect(isLeading(10, 'O')).toBe(true);
    });

    it('O est en retard quand diff < 0', () => {
        expect(isLeading(-10, 'O')).toBe(false);
    });

    it('égalité → pas en avance', () => {
        expect(isLeading(0, 'X')).toBe(false);
        expect(isLeading(0, 'O')).toBe(false);
    });
});

describe('getSavedPipCountVisibility', () => {
    it('retourne defaultValue si localStorage est indisponible ou non défini', () => {
        expect(getSavedPipCountVisibility(true)).toBe(true);
        expect(getSavedPipCountVisibility(false)).toBe(false);
    });
});

describe('PipCountBadge (Rendu)', () => {
    it('affiche les comptes de pips pour Vous et IA sans jargon X/O', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={150} pipO={160} turn="X" />);
        expect(html).toContain('>Vous<');
        expect(html).toContain('>150<');
        expect(html).toContain('>IA<');
        expect(html).toContain('>160<');
        expect(html).not.toContain('O 160');
        expect(html).not.toContain('X 150');
        expect(html).toContain('data-testid="pip-diff-badge"');
        expect(html).toContain('data-testid="pip-count-toggle"');
    });

    it('affiche le différentiel vert quand le joueur au trait mène', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={140} pipO={160} turn="X" />);
        expect(html).toContain('bg-emerald-500/15');
        expect(html).toContain('+20');
        expect(html).toContain('(En avance)');
    });

    it('affiche le différentiel rouge quand le joueur au trait est en retard', () => {
        const html = renderToStaticMarkup(<PipCountBadge pipX={160} pipO={140} turn="X" />);
        expect(html).toContain('bg-rose-500/15');
        expect(html).toContain('-20');
        expect(html).toContain('(En retard)');
    });

    it('adapte les couleurs des miniatures de pions lorsque swapColors / playerColor="O" est actif', () => {
        const htmlBlack = renderToStaticMarkup(
            <PipCountBadge pipX={150} pipO={160} turn="X" playerColor="O" swapColors />,
        );
        expect(htmlBlack).toContain('Pip count Vous (Noir)');
        expect(htmlBlack).toContain('Pip count IA (Blanc)');
    });

    it('affiche la pastille EPC et le gaspillage (wastage) en course pure', () => {
        const htmlEpc = renderToStaticMarkup(
            <PipCountBadge
                pipX={35}
                pipO={42}
                turn="X"
                isPureRace
                epcX={41.5}
                epcO={48.2}
                wastageX={6.5}
                wastageO={6.2}
            />,
        );
        expect(htmlEpc).toContain('data-testid="pip-epc-badge"');
        expect(htmlEpc).toContain('EPC: 41.5 (Gaspillage: +6.5)');
        expect(htmlEpc).toContain('EPC: 48.2 (Gaspillage: +6.2)');
        expect(htmlEpc).toContain('Écart EPC: -6.7');
    });
});

describe('getRaceStrategicAdvice', () => {
    it('donne un conseil de course serrée pour un écart <= 3 pips', () => {
        expect(getRaceStrategicAdvice(2, 'X')).toContain('Course serrée');
        expect(getRaceStrategicAdvice(0, 'X')).toContain('Course serrée');
    });

    it('conseille de courir (When ahead in the race, RACE) pour une avance nette >= 12 pips', () => {
        expect(getRaceStrategicAdvice(-15, 'X')).toContain('When ahead in the race, RACE');
    });

    it('conseille de maintenir le contact et bâtir un barrage pour un retard significatif >= 12 pips', () => {
        expect(getRaceStrategicAdvice(15, 'X')).toContain('Retard significatif : maintenez le contact');
    });
});
