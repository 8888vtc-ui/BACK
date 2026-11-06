import { test, expect } from '@playwright/test';

test.describe('Mission 42 — Contrôle de l\'Audio & Synthèse Vocale (TTS FR/EN, Annulation & Mute)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            const calls = {
                speakCount: 0,
                cancelCount: 0,
                lastLang: null as string | null,
                lastText: null as string | null,
                speaking: false,
            };
            (window as unknown as { __speechSynthesisCalls: typeof calls }).__speechSynthesisCalls = calls;

            const mockSpeechSynthesis = {
                get speaking() {
                    return calls.speaking;
                },
                speak: (utt: { lang?: string; text?: string; onend?: () => void }) => {
                    calls.speakCount++;
                    calls.lastLang = utt?.lang ?? null;
                    calls.lastText = utt?.text ?? null;
                    calls.speaking = true;
                },
                cancel: () => {
                    calls.cancelCount++;
                    calls.speaking = false;
                },
                getVoices: () => [],
                addEventListener: () => {},
                removeEventListener: () => {},
            };

            Object.defineProperty(window, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: mockSpeechSynthesis,
            });
        });
    });

    test('1. Synthèse vocale FR & EN : vérification de la langue fr-FR vs en-US et toggle stop au 2e clic', async ({ page }) => {
        // Mode Français sur Porte 1 Débutant
        await page.goto('/?gate=BEGINNER&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Ouvrir le Guide Audio (6 chapitres)
        const openGuideBtn = page.locator('[data-testid="beginner-open-guide-btn"]');
        await expect(openGuideBtn).toBeVisible({ timeout: 10000 });
        await openGuideBtn.click();

        // Le bouton Écouter du guide doit être visible
        const voiceBtn = page.locator('[data-testid="guide-voice-btn"]');
        await expect(voiceBtn).toBeVisible({ timeout: 5000 });

        // 1er clic : démarre la lecture en fr-FR
        await voiceBtn.click();

        const stateAfter1stClick = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { speakCount: number; cancelCount: number; lastLang: string | null; speaking: boolean } }).__speechSynthesisCalls;
        });

        expect(stateAfter1stClick.speakCount).toBeGreaterThanOrEqual(1);
        expect(stateAfter1stClick.lastLang).toBe('fr-FR');
        expect(stateAfter1stClick.speaking).toBe(true);

        // 2e clic : interrompt immédiatement la voix
        const prevCancelCount = stateAfter1stClick.cancelCount;
        await voiceBtn.click();

        const stateAfter2ndClick = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { cancelCount: number; speaking: boolean } }).__speechSynthesisCalls;
        });

        expect(stateAfter2ndClick.cancelCount).toBeGreaterThan(prevCancelCount);
        expect(stateAfter2ndClick.speaking).toBe(false);

        // Fermer le guide
        const closeGuideBtn = page.locator('[data-testid="guide-close-btn"]');
        if (await closeGuideBtn.isVisible()) {
            await closeGuideBtn.click();
        }

        // Mode Anglais sur Porte 1 Débutant
        await page.goto('/?gate=BEGINNER&lang=en');
        await page.waitForLoadState('domcontentloaded');

        const openGuideBtnEn = page.locator('[data-testid="beginner-open-guide-btn"]');
        await expect(openGuideBtnEn).toBeVisible({ timeout: 10000 });
        await openGuideBtnEn.click();

        const voiceBtnEn = page.locator('[data-testid="guide-voice-btn"]');
        await expect(voiceBtnEn).toBeVisible({ timeout: 5000 });
        await voiceBtnEn.click();

        const stateEn = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { lastLang: string | null } }).__speechSynthesisCalls;
        });

        expect(stateEn.lastLang).toBe('en-US');
    });

    test('2. Annulation automatique de speechSynthesis à la fermeture de modale et au changement de route', async ({ page }) => {
        // A. Fermeture de modale
        await page.goto('/?gate=BEGINNER&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const openGuideBtn = page.locator('[data-testid="beginner-open-guide-btn"]');
        await expect(openGuideBtn).toBeVisible({ timeout: 10000 });
        await openGuideBtn.click();

        const voiceBtn = page.locator('[data-testid="guide-voice-btn"]');
        await expect(voiceBtn).toBeVisible({ timeout: 5000 });
        await voiceBtn.click();

        const cancelCountBeforeClose = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { cancelCount: number; speaking: boolean } }).__speechSynthesisCalls;
        });
        expect(cancelCountBeforeClose.speaking).toBe(true);

        const closeGuideBtn = page.locator('[data-testid="guide-close-btn"]');
        await expect(closeGuideBtn).toBeVisible();
        await closeGuideBtn.click();

        const cancelCountAfterClose = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { cancelCount: number; speaking: boolean } }).__speechSynthesisCalls;
        });
        expect(cancelCountAfterClose.cancelCount).toBeGreaterThan(cancelCountBeforeClose.cancelCount);
        expect(cancelCountAfterClose.speaking).toBe(false);

        // B. Changement de route (RouteAudioCleanup sur transition SPA)
        // Sur Porte 2 Intermédiaire, la carte Club Secrets est directement sur la page (sans modale)
        await page.goto('/?gate=INTERMEDIATE&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const clubVoiceBtn = page.locator('[data-testid="club-secrets-voice-btn"]');
        await expect(clubVoiceBtn).toBeVisible({ timeout: 5000 });
        await clubVoiceBtn.click();

        const stateBeforeNav = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { cancelCount: number; speaking: boolean } }).__speechSynthesisCalls;
        });
        expect(stateBeforeNav.speaking).toBe(true);

        // Navigation client-side SPA vers /tournaments via le lien de la sidebar
        const navLink = page.locator('[data-testid="sidebar-pillar-tournaments"]');
        await expect(navLink).toBeVisible();
        await navLink.click();
        await page.waitForURL('**/tournaments', { timeout: 10000 });
        await page.waitForTimeout(400);

        const stateAfterNav = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { cancelCount: number; speaking: boolean } }).__speechSynthesisCalls;
        });

        // RouteAudioCleanup doit avoir appelé window.speechSynthesis.cancel() lors de la transition SPA
        expect(stateAfterNav.cancelCount).toBeGreaterThan(stateBeforeNav.cancelCount);
        expect(stateAfterNav.speaking).toBe(false);
    });

    test('3. Respect strict du mode Muet (localStorage bg_sound_muted=true bloque 100% du son et du TTS)', async ({ page }) => {
        await page.goto('/?gate=BEGINNER&lang=fr');
        await page.evaluate(() => {
            localStorage.setItem('bg_sound_muted', 'true');
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        const openGuideBtn = page.locator('[data-testid="beginner-open-guide-btn"]');
        await expect(openGuideBtn).toBeVisible({ timeout: 10000 });
        await openGuideBtn.click();

        const voiceBtn = page.locator('[data-testid="guide-voice-btn"]');
        await expect(voiceBtn).toBeVisible({ timeout: 5000 });

        const countBefore = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { speakCount: number } }).__speechSynthesisCalls.speakCount;
        });

        // En mode muet, cliquer sur Écouter ne doit pas lancer de synthèse vocale
        await voiceBtn.click();

        const countAfter = await page.evaluate(() => {
            return (window as unknown as { __speechSynthesisCalls: { speakCount: number } }).__speechSynthesisCalls.speakCount;
        });

        expect(countAfter).toBe(countBefore);
    });
});
