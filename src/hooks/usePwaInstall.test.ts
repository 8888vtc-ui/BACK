// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import {
    usePwaInstall,
    isStandaloneMode,
    isIosOrIpadOsDevice,
    type BeforeInstallPromptEvent,
} from './usePwaInstall';

describe('usePwaInstall Hook & Detection Suite', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('isStandaloneMode', () => {
        it('retourne false si window ou navigator est indéfini', () => {
            expect(isStandaloneMode(null)).toBe(false);
            expect(isStandaloneMode(undefined)).toBe(false);
        });

        it('détecte display-mode: standalone via matchMedia', () => {
            const mockWin = {
                matchMedia: (query: string) => ({
                    matches: query.includes('standalone'),
                }),
                navigator: {},
            };
            expect(isStandaloneMode(mockWin as any)).toBe(true);
        });

        it('détecte le mode standalone propriétaire Safari iOS (navigator.standalone)', () => {
            const mockWin = {
                matchMedia: () => ({ matches: false }),
                navigator: { standalone: true },
            };
            expect(isStandaloneMode(mockWin as any)).toBe(true);
        });

        it('retourne false en mode navigateur normal', () => {
            const mockWin = {
                matchMedia: () => ({ matches: false }),
                navigator: { standalone: false },
            };
            expect(isStandaloneMode(mockWin as any)).toBe(false);
        });
    });

    describe('isIosOrIpadOsDevice', () => {
        it('détecte iPhone Safari', () => {
            const mockWin = {
                navigator: {
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
                    maxTouchPoints: 5,
                },
            };
            expect(isIosOrIpadOsDevice(mockWin as any)).toBe(true);
        });

        it('détecte iPadOS 13+ (Macintosh UA avec maxTouchPoints > 1)', () => {
            const mockWin = {
                navigator: {
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
                    maxTouchPoints: 5,
                },
            };
            expect(isIosOrIpadOsDevice(mockWin as any)).toBe(true);
        });

        it('ne détecte PAS un Mac de bureau (Macintosh UA avec maxTouchPoints 0)', () => {
            const mockWin = {
                navigator: {
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    maxTouchPoints: 0,
                },
            };
            expect(isIosOrIpadOsDevice(mockWin as any)).toBe(false);
        });

        it('ne détecte PAS un PC Windows', () => {
            const mockWin = {
                navigator: {
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
                    maxTouchPoints: 0,
                },
            };
            expect(isIosOrIpadOsDevice(mockWin as any)).toBe(false);
        });
    });

    describe('Hook usePwaInstall lifecycle', () => {
        it('intercepte beforeinstallprompt, permet de déclencher le prompt natif et gère l’acceptation', async () => {
            const { result } = renderHook(() => usePwaInstall());

            // Initialement pas de prompt
            expect(result.current.isInstalled).toBe(false);

            // Simulation de l'événement beforeinstallprompt
            const promptMock = vi.fn().mockResolvedValue(undefined);
            const userChoiceMock = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });

            const fakeEvent = new Event('beforeinstallprompt') as BeforeInstallPromptEvent;
            fakeEvent.prompt = promptMock;
            fakeEvent.userChoice = userChoiceMock;

            act(() => {
                window.dispatchEvent(fakeEvent);
            });

            expect(result.current.canInstall).toBe(true);
            expect(result.current.hasDeferredPrompt).toBe(true);

            // Clic sur Installer l'App
            let installAccepted = false;
            await act(async () => {
                installAccepted = await result.current.handleInstallClick();
            });

            expect(promptMock).toHaveBeenCalledTimes(1);
            expect(installAccepted).toBe(true);
            await waitFor(() => {
                expect(result.current.isInstalled).toBe(true);
            });
            expect(result.current.canInstall).toBe(false);
        });

        it('sur iOS, handleInstallClick ouvre la modale explicative au lieu du prompt natif', async () => {
            // Configurer le UA pour iOS
            const originalUserAgent = window.navigator.userAgent;
            Object.defineProperty(window.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
                configurable: true,
            });

            const { result } = renderHook(() => usePwaInstall());

            expect(result.current.isIOS).toBe(true);
            expect(result.current.canInstall).toBe(true);
            expect(result.current.showIosModal).toBe(false);

            // Clic install
            await act(async () => {
                await result.current.handleInstallClick();
            });

            expect(result.current.showIosModal).toBe(true);

            // Fermeture de la modale
            act(() => {
                result.current.setShowIosModal(false);
            });
            expect(result.current.showIosModal).toBe(false);

            // Rétablir UA
            Object.defineProperty(window.navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true,
            });
        });

        it('masque complètement l’installation si l’app est déjà installée (standalone)', () => {
            // Mock matchMedia standalone
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = vi.fn().mockImplementation((query: string) => ({
                matches: query.includes('standalone'),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            }));

            const { result } = renderHook(() => usePwaInstall());

            expect(result.current.isInstalled).toBe(true);
            expect(result.current.canInstall).toBe(false);

            window.matchMedia = originalMatchMedia;
        });

        it('passe en mode installé lors de l’événement appinstalled', () => {
            const { result } = renderHook(() => usePwaInstall());

            act(() => {
                window.dispatchEvent(new Event('appinstalled'));
            });

            expect(result.current.isInstalled).toBe(true);
            expect(result.current.canInstall).toBe(false);
        });
    });
});
