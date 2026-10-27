import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    DISMISS_KEY,
    DISMISS_DURATION_MS,
    OFFLINE_CORE_ASSETS,
    SW_BEFORE_RELOAD_EVENT,
    isStandaloneMode,
    isIosDevice,
    isPromptTemporarilyDismissed,
    savePromptDismissal,
    clearPromptDismissal,
    checkWasmCached,
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

    it('isStandaloneMode détecte display-mode: standalone ou navigator.standalone et gère les erreurs matchMedia', () => {
        expect(SW_BEFORE_RELOAD_EVENT).toBe('backgammon:before-sw-reload');

        const webWindow = {
            matchMedia: (q: string) => ({ matches: q.includes('standalone') ? false : true }),
            navigator: { standalone: false },
        };
        expect(isStandaloneMode(webWindow)).toBe(false);

        const pwaWindow = {
            matchMedia: (q: string) => ({ matches: q.includes('standalone') ? true : false }),
            navigator: { standalone: false },
        };
        expect(isStandaloneMode(pwaWindow)).toBe(true);

        const iosStandaloneWindow = {
            matchMedia: () => ({ matches: false }),
            navigator: { standalone: true },
        };
        expect(isStandaloneMode(iosStandaloneWindow)).toBe(true);

        const throwingWindow = {
            matchMedia: () => {
                throw new Error('matchMedia unsupported');
            },
        };
        expect(isStandaloneMode(throwingWindow)).toBe(false);
    });

    it('isIosDevice détecte les iPhone, iPad et iPod', () => {
        expect(isIosDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
        expect(isIosDevice('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe(true);
        expect(isIosDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe(false);
        expect(isIosDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(false);
    });

    it('gère l’exclusion temporaire du prompt d’installation avec savePromptDismissal et isPromptTemporarilyDismissed', () => {
        const now = 1000000;

        expect(isPromptTemporarilyDismissed(storageAdapter, now)).toBe(false);

        savePromptDismissal(storageAdapter, DISMISS_DURATION_MS, now);
        expect(storageAdapter.setItem).toHaveBeenCalledWith(
            DISMISS_KEY,
            (now + DISMISS_DURATION_MS).toString(),
        );

        expect(isPromptTemporarilyDismissed(storageAdapter, now + 1000)).toBe(true);
        expect(isPromptTemporarilyDismissed(storageAdapter, now + DISMISS_DURATION_MS + 1)).toBe(false);
    });

    it('clearPromptDismissal supprime l’exclusion enregistrée', () => {
        mockStorage[DISMISS_KEY] = (Date.now() + 1000000).toString();
        expect(isPromptTemporarilyDismissed(storageAdapter)).toBe(true);

        clearPromptDismissal(storageAdapter);
        expect(storageAdapter.removeItem).toHaveBeenCalledWith(DISMISS_KEY);
        expect(isPromptTemporarilyDismissed(storageAdapter)).toBe(false);
    });

    it('checkWasmCached vérifie la présence du binaire de fin de partie dans CacheStorage', async () => {
        expect(OFFLINE_CORE_ASSETS).toContain('/data/bearoff.bin');
        expect(await checkWasmCached(undefined)).toBe(false);

        const mockCachesHit = {
            match: vi.fn().mockResolvedValue(new Response('bearoff-binary')),
        } as unknown as CacheStorage;
        expect(await checkWasmCached(mockCachesHit)).toBe(true);
        expect(mockCachesHit.match).toHaveBeenCalledWith('/data/bearoff.bin');

        const mockCachesMiss = {
            match: vi.fn().mockResolvedValue(undefined),
        } as unknown as CacheStorage;
        expect(await checkWasmCached(mockCachesMiss)).toBe(false);
    });
});
