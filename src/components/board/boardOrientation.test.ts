import { describe, it, expect } from 'vitest';
import {
    TOP_ROW,
    BOTTOM_ROW,
    invertRow,
    getOrientedRows,
    toggleOrientation,
} from './boardOrientation';

describe('invertRow', () => {
    it('inverse une rangée', () => {
        expect(invertRow([1, 2, 3])).toEqual([3, 2, 1]);
    });

    it('ne mute pas la rangée d\'origine', () => {
        const row = [1, 2, 3];
        invertRow(row);
        expect(row).toEqual([1, 2, 3]);
    });
});

describe('getOrientedRows', () => {
    it('retourne les rangées normales par défaut', () => {
        const { top, bottom } = getOrientedRows('normal');
        expect(top).toEqual(TOP_ROW);
        expect(bottom).toEqual(BOTTOM_ROW);
    });

    it('inverse les rangées en mode inverted', () => {
        const { top, bottom } = getOrientedRows('inverted');
        expect(top).toEqual([...TOP_ROW].reverse());
        expect(bottom).toEqual([...BOTTOM_ROW].reverse());
    });
});

describe('toggleOrientation', () => {
    it('bascule normal → inverted', () => {
        expect(toggleOrientation('normal')).toBe('inverted');
    });

    it('bascule inverted → normal', () => {
        expect(toggleOrientation('inverted')).toBe('normal');
    });
});
