import { describe, it, expect } from 'vitest';
import {
    CUBE_SAFETY_DELAY_MS,
    CUBE_BUTTON_MIN_GAP_PX,
    computeNextCubeValue,
    formatCubeTransition,
    getCubePositionZone,
    canPlayerOfferDouble,
    isBeaverAllowed,
    validateBeaverLegality,
    computeJacobyMultiplier,
} from './cubeRules';

describe('cubeRules (Audit 9/20 — Manipulation du Videau & Cube Safety)', () => {
    it('expose CUBE_SAFETY_DELAY_MS = 250ms et CUBE_BUTTON_MIN_GAP_PX = 20px', () => {
        expect(CUBE_SAFETY_DELAY_MS).toBe(250);
        expect(CUBE_BUTTON_MIN_GAP_PX).toBeGreaterThanOrEqual(16);
    });

    it('calcule et formate proprement la transition du videau (1 -> 2, 2 -> 4, 4 -> 8)', () => {
        expect(computeNextCubeValue(1)).toBe(2);
        expect(computeNextCubeValue(2)).toBe(4);
        expect(computeNextCubeValue(4)).toBe(8);
        expect(formatCubeTransition(2)).toBe('2 → 4');
    });

    it('positionne le videau dans sa zone dédiée (middle, top, bottom) sans chevauchement', () => {
        expect(getCubePositionZone(null)).toBe('middle');
        expect(getCubePositionZone('O')).toBe('top');
        expect(getCubePositionZone('X')).toBe('bottom');
    });

    it('valide les règles officielles de doublage (Crawford, DMP, Dead Cube, propriété du videau)', () => {
        const base = {
            turn: 'X' as const,
            cubeValue: 2,
            cubeOwner: 'X' as const,
            hasRolledDice: false,
            isCrawford: false,
            scoreX: 3,
            scoreO: 2,
            matchLength: 7,
        };

        expect(canPlayerOfferDouble(base)).toBe(true);
        // Dés déjà lancés -> interdit
        expect(canPlayerOfferDouble({ ...base, hasRolledDice: true })).toBe(false);
        // Manche Crawford -> interdit
        expect(canPlayerOfferDouble({ ...base, isCrawford: true })).toBe(false);
        // Videau possédé par l'adversaire -> interdit
        expect(canPlayerOfferDouble({ ...base, cubeOwner: 'O' })).toBe(false);
        // DMP (6-6 sur 7) -> interdit
        expect(canPlayerOfferDouble({ ...base, scoreX: 6, scoreO: 6 })).toBe(false);
        // Dead Cube : X mène 5-2 sur 7 avec un videau déjà à 2 (5 + 2 >= 7) -> interdit
        expect(canPlayerOfferDouble({ ...base, scoreX: 5, cubeValue: 2 })).toBe(false);
        // Règle WBF 5.1 : interdit de doubler sur la position initiale avant le premier coup joué
        expect(canPlayerOfferDouble({ ...base, isOpeningPosition: true })).toBe(false);
    });

    it('interdit strictement le BEAVER en Match Play (matchLength > 0)', () => {
        expect(isBeaverAllowed(0)).toBe(true);
        expect(isBeaverAllowed(3)).toBe(false);
        expect(isBeaverAllowed(7)).toBe(false);

        expect(() => validateBeaverLegality(0)).not.toThrow();
        expect(() => validateBeaverLegality(5)).toThrowError('MATCH_PLAY_BEAVER_FORBIDDEN');
    });

    it('applique la règle Jacoby en Money Game (matchLength === 0)', () => {
        // En Money Game (matchLength 0) sans videau doublé (cubeValue <= 1) : Gammon (2) et BG (3) ramenés à 1
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 1, rawMultiplier: 2 })).toBe(1);
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 1, rawMultiplier: 3 })).toBe(1);
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 1, rawMultiplier: 1 })).toBe(1);

        // Dès que le videau est tourné (cubeValue >= 2), les gammon et backgammon comptent pleinement
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 2, rawMultiplier: 2 })).toBe(2);
        expect(computeJacobyMultiplier({ matchLength: 0, cubeValue: 2, rawMultiplier: 3 })).toBe(3);

        // En Match Play (matchLength > 0), la règle Jacoby ne s'applique jamais : les gammon comptent toujours
        expect(computeJacobyMultiplier({ matchLength: 7, cubeValue: 1, rawMultiplier: 2 })).toBe(2);
        expect(computeJacobyMultiplier({ matchLength: 7, cubeValue: 1, rawMultiplier: 3 })).toBe(3);
    });
});
