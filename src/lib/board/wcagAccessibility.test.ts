// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import {
    computeContrastRatio,
    isWcagAAACompliant,
    getAccessibleCheckerPalette,
    getSavedColorblindMode,
    saveColorblindMode,
    COLORBLIND_CHANGE_EVENT,
    WCAG_AAA_MIN_CONTRAST,
} from './wcagAccessibility';
import { Checker } from '../../components/board/Checker';
import { BOARD_THEME_TOKENS } from '../../components/board/boardThemes';

afterEach(() => {
    cleanup();
    window.localStorage.clear();
});

describe('wcagAccessibility — Accessibilité Visuelle & Daltonisme WCAG AAA (Audit 17 / 20)', () => {
    it('garantit un ratio de contraste WCAG AAA (≥ 7:1) entre les pions blancs et noirs ainsi que sur les flèches', () => {
        const stdPalette = getAccessibleCheckerPalette('standard');
        expect(stdPalette.contrastRatio).toBeGreaterThanOrEqual(WCAG_AAA_MIN_CONTRAST);
        expect(stdPalette.contrastRatio).toBeGreaterThan(17);
        expect(isWcagAAACompliant(stdPalette.whitePrimaryHex, stdPalette.blackPrimaryHex)).toBe(true);

        const aaaPalette = getAccessibleCheckerPalette('high_contrast_aaa');
        expect(aaaPalette.contrastRatio).toBeGreaterThan(19);

        // Vérifie que dans tous les thèmes, la teinte claire du point et la teinte sombre du point ont un contraste élevé
        for (const tokens of Object.values(BOARD_THEME_TOKENS)) {
            const lightTop = tokens.points.light[0];
            const darkBottom = tokens.points.dark[3];
            expect(computeContrastRatio(lightTop, darkBottom)).toBeGreaterThanOrEqual(WCAG_AAA_MIN_CONTRAST);
        }
    });

    it('différencie structurellement les pions blancs et noirs par des motifs géométriques SVG distincts (concentric-rings vs star-rosette)', () => {
        const { container: whiteContainer, getByTestId: getWhiteById } = render(
            React.createElement(Checker, { color: 'white' }),
        );
        const whiteRoot = whiteContainer.firstElementChild as HTMLElement;
        expect(whiteRoot.getAttribute('data-checker-pattern')).toBe('concentric-rings');
        expect(getWhiteById('checker-pattern-concentric')).toBeTruthy();

        cleanup();

        const { container: blackContainer, getByTestId: getBlackById } = render(
            React.createElement(Checker, { color: 'black' }),
        );
        const blackRoot = blackContainer.firstElementChild as HTMLElement;
        expect(blackRoot.getAttribute('data-checker-pattern')).toBe('star-rosette');
        expect(getBlackById('checker-pattern-rosette')).toBeTruthy();
    });

    it('bascule et persiste instantanément le mode daltonisme via événement synchrone sans rechargement', () => {
        const listener = vi.fn();
        window.addEventListener(COLORBLIND_CHANGE_EVENT, listener);

        expect(getSavedColorblindMode()).toBe('standard');
        saveColorblindMode('deuteranopia');
        expect(getSavedColorblindMode()).toBe('deuteranopia');
        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener(COLORBLIND_CHANGE_EVENT, listener);
    });
});
