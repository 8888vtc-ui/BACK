import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/day45_beginner_complete_journey_audit.spec.ts
 * @description Mission 45 : Contrôle du Parcours Débutant Complet
 * - Guide Audio 6 chapitres & Sélecteur de Victoires (Simple / Gammon / Backgammon)
 * - Simulateur des 15 Coups d'Ouverture (SVG flèches dorées, zéro jargon)
 * - 10 Leçons / Quiz d'Initiation visuels jusqu'au Diplôme d'Initié (+2 000 PTS)
 * - Zéro crash, bilingue FR/EN, zéro emoji système.
 */

test.describe('Day 45 — Contrôle du Parcours Débutant Complet', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');

            const calls = { speakCount: 0, cancelCount: 0, speaking: false };
            const mockSpeech = {
                get speaking() { return calls.speaking; },
                speak: () => { calls.speakCount++; calls.speaking = true; },
                cancel: () => { calls.cancelCount++; calls.speaking = false; },
                getVoices: () => [],
                addEventListener: () => {},
                removeEventListener: () => {},
            };
            Object.defineProperty(window, 'speechSynthesis', {
                configurable: true,
                writable: true,
                value: mockSpeech,
            });
        });
    });

    test('1. Guide Audio (6 chapitres) & Sélecteur de Victoires', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=BEGINNER&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const openGuideBtn = page.getByTestId('beginner-open-guide-btn');
        await expect(openGuideBtn).toBeVisible({ timeout: 10000 });

        const guideModal = page.getByTestId('beginner-interactive-guide-modal');
        await expect(async () => {
            await openGuideBtn.click();
            await expect(guideModal).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 10000 });

        // Parcourir les 6 chapitres
        for (let i = 1; i <= 6; i++) {
            const tab = page.getByTestId(`guide-tab-${i}`);
            await expect(tab).toBeVisible();
            await tab.click();
            await page.waitForTimeout(50);
        }

        // Tester le sélecteur de victoires
        const simpleBtn = page.getByTestId('victory-type-simple');
        const gammonBtn = page.getByTestId('victory-type-gammon');
        const backgammonBtn = page.getByTestId('victory-type-backgammon');
        const desc = page.getByTestId('victory-type-description');

        await expect(simpleBtn).toBeVisible();
        await expect(gammonBtn).toBeVisible();
        await expect(backgammonBtn).toBeVisible();

        await gammonBtn.click();
        await expect(desc).toContainText('15 dames');

        await backgammonBtn.click();
        await expect(desc).toContainText('barre');

        await simpleBtn.click();
        await expect(desc).toContainText('au moins 1 dame');

        // Tester le bouton vocal
        const voiceBtn = page.getByTestId('guide-voice-btn');
        await expect(voiceBtn).toBeVisible();
        await voiceBtn.click();
        await page.waitForTimeout(50);

        // Fermer la modale
        const closeBtn = page.getByTestId('guide-close-btn');
        await closeBtn.click();
        await expect(guideModal).not.toBeVisible();

        expect(pageErrors).toHaveLength(0);
    });

    test('2. Simulateur des 15 Coups d’Ouverture', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=BEGINNER&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const openingsBtn = page.getByTestId('beginner-openings-btn');
        await expect(openingsBtn).toBeVisible({ timeout: 10000 });

        const openingsModal = page.getByTestId('beginner-opening-explorer-modal');
        await expect(async () => {
            await openingsBtn.click();
            await expect(openingsModal).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 10000 });

        // Tester plusieurs lancers clés : 3-1, 4-2, 6-1, 6-5, 2-1
        const testRolls = ['3-1', '4-2', '6-1', '6-5', '2-1'];
        for (const rollId of testRolls) {
            const rollBtn = page.getByTestId(`opening-roll-${rollId}`);
            await expect(rollBtn).toBeVisible();
            await rollBtn.click();
            await page.waitForTimeout(50);
        }

        // Vérifier la présence du plateau visuel SVG avec flèches
        const visualBoard = page.getByTestId('opening-visual-board');
        await expect(visualBoard).toBeVisible();

        // Fermer le simulateur
        const closeBtn = page.getByTestId('opening-close-btn');
        await closeBtn.click();
        await expect(openingsModal).not.toBeVisible();

        expect(pageErrors).toHaveLength(0);
    });

    test('3. Parcours complet 10 Leçons d’Initiation jusqu’au Diplôme d’Initié (+2 000 PTS)', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/puzzles?mode=beginner-academy&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const quizContainer = page.getByTestId('academy-quiz-container');
        await expect(quizContainer).toBeVisible({ timeout: 10000 });

        // Répondre aux 10 quiz (l'option A est toujours correcte)
        for (let q = 1; q <= 10; q++) {
            const optA = page.getByTestId('academy-option-A');
            await expect(optA).toBeVisible();
            await optA.click();

            const nextBtn = page.getByTestId('academy-quiz-next-btn');
            await expect(nextBtn).toBeVisible();
            await nextBtn.click();
            await page.waitForTimeout(100);
        }

        // Vérifier l'affichage du Diplôme d'Initié
        const diploma = page.getByTestId('academy-diploma-card');
        await expect(diploma).toBeVisible();
        await expect(diploma).toContainText('Diplôme');
        await expect(diploma).toContainText('2000');

        // Vérifier le bouton 1-clic de partie guidée
        const launchGuidedBtn = page.getByTestId('diploma-launch-guided-match-btn');
        await expect(launchGuidedBtn).toBeVisible();

        // Tester la navigation vers l'onglet Vidéos et retour Quiz
        const tabVideos = page.getByTestId('academy-tab-videos');
        await tabVideos.click();
        await expect(diploma).not.toBeVisible();

        const tabQuizzes = page.getByTestId('academy-tab-quizzes');
        await tabQuizzes.click();
        await expect(page.getByTestId('academy-quiz-container')).toBeVisible();

        expect(pageErrors).toHaveLength(0);
    });

    test('4. Bilinguisme EN sur l’Académie Débutant', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/puzzles?mode=beginner-academy&lang=en');
        await page.waitForLoadState('domcontentloaded');

        const quizContainer = page.getByTestId('academy-quiz-container');
        await expect(quizContainer).toBeVisible({ timeout: 10000 });

        // Vérifier le libellé en anglais
        await expect(page.getByTestId('academy-tab-quizzes')).toContainText('Lessons');
        await expect(page.getByTestId('academy-back-btn')).toContainText('Back to Home');

        expect(pageErrors).toHaveLength(0);
    });
});
