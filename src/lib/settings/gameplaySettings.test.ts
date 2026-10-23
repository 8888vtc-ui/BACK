// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
    DEFAULT_GAMEPLAY_SETTINGS,
    GAME_SPEED_STORAGE_KEY,
    getSavedGameSpeed,
    migrateGameplaySettings,
    saveGameSpeed,
} from './gameplaySettings';

describe('gameplaySettings', () => {
    afterEach(() => {
        window.localStorage.removeItem(GAME_SPEED_STORAGE_KEY);
    });

    it('entrée invalide → valeurs par défaut', () => {
        expect(migrateGameplaySettings(null)).toBe(DEFAULT_GAMEPLAY_SETTINGS);
        expect(migrateGameplaySettings('x')).toBe(DEFAULT_GAMEPLAY_SETTINGS);
    });

    it('migre l\'ancien booléen autoConfirmTurn', () => {
        expect(migrateGameplaySettings({ autoConfirmTurn: true }).autoConfirmTurn).toBe('always');
        expect(migrateGameplaySettings({ autoConfirmTurn: false }).autoConfirmTurn).toBe('never');
        expect(migrateGameplaySettings({}).autoConfirmTurn).toBe('forced_only');
    });

    it('conserve les valeurs valides et rejette les valeurs hors domaine', () => {
        const s = migrateGameplaySettings({ gameSpeed: 'blitz', showPipCount: 'nope', haptics: 'yes', autoRoll: false });
        expect(s.version).toBe(2);
        expect(s.gameSpeed).toBe('blitz');
        expect(s.showPipCount).toBe('always');
        expect(s.haptics).toBe(true);
        expect(s.autoRoll).toBe(false);
    });

    it('persiste le profil de vitesse', () => {
        expect(getSavedGameSpeed()).toBe('tournament');
        saveGameSpeed('coach');
        expect(getSavedGameSpeed()).toBe('coach');
        window.localStorage.setItem(GAME_SPEED_STORAGE_KEY, 'warp');
        expect(getSavedGameSpeed()).toBe('tournament');
    });
});
