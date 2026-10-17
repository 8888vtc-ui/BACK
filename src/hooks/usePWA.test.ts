import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    DISMISS_KEY,
    DISMISS_DURATION_MS,
    isStandaloneMode,
    isIosDevice,
    isPromptTemporarilyDismissed,
    savePromptDismissal,
    clearPromptDismissal,
} from './usePWA';

describe('usePWA - Helpers & PWA Logic', () => {
    let mockStorage: Record<string, string> = {};

    const storageAdapter: Storage = {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, val: string) => {
            mockStorage[key] = String(val);
        }),
        removeItem: vi.fn((key: string) => {
            delete mockStorage[key];
        }),
        clear: vi.fn(() => {
            mockStorage = {};
        }),
        key: vi.fn(() => null),
        length: 0,
    };

    beforeEach(() => {
        mockStorage = {};
        vi.clearAllMocks();
    });

    it('isStandaloneMode détecte display-mode: standalone ou navigator.standalone', () => {
        // Mode classique (navigateur web)
        const webWindow = {
            matchMedia: (q: string) => ({ matches: q.includes('standalone') ? false : true }),
            navigator: { standalone: false },
        };
        expect(isStandaloneMode(webWindow)).toBe(false);

        // Mode autonome (PWA installée)
        const pwaWindow = {
            matchMedia: (q: string) => ({ matches: q.includes('standalone') ? true : false }),
            navigator: { standalone: false },
        };
        expect(isStandaloneMode(pwaWindow)).toBe(true);

        // Mode autonome Safari iOS (navigator.standalone = true)
        const iosStandaloneWindow = {
            matchMedia: () => ({ matches: false }),
            navigator: { standalone: true },
        };
        expect(isStandaloneMode(iosStandaloneWindow)).toBe(true);
    });

    it('isIosDevice détecte les iPhone, iPad et iPod', () => {
        expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
        expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe(true);
        expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(false);
        expect(isIosDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    });

    it('gère l’exclusion temporaire du prompt d’installation avec savePromptDismissal et isPromptTemporarilyDismissed', () => {
        const now = 1000000;

        // Initialement : pas d'exclusion
        expect(isPromptTemporarilyDismissed(storageAdapter, now)).toBe(false);

        // Sauvegarde de l'exclusion pour 7 jours
        savePromptDismissal(storageAdapter, DISMISS_DURATION_MS, now);
        expect(storageAdapter.setItem).toHaveBeenCalledWith(
            DISMISS_KEY,
            (now + DISMISS_DURATION_MS).toString(),
        );

        // Pendant la période : le prompt est masqué
        expect(isPromptTemporarilyDismissed(storageAdapter, now + 1000)).toBe(true);

        // Après l'expiration : le prompt peut réapparaître
        expect(isPromptTemporarilyDismissed(storageAdapter, now + DISMISS_DURATION_MS + 1)).toBe(false);
    });

    it('clearPromptDismissal supprime l’exclusion enregistrée', () => {
        mockStorage[DISMISS_KEY] = (Date.now() + 1000000).toString();
        expect(isPromptTemporarilyDismissed(storageAdapter)).toBe(true);

        clearPromptDismissal(storageAdapter);
        expect(storageAdapter.removeItem).toHaveBeenCalledWith(DISMISS_KEY);
        expect(isPromptTemporarilyDismissed(storageAdapter)).toBe(false);
    });
});
