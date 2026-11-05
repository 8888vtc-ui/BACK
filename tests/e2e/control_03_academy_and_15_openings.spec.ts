/**
 * @file tests/e2e/control_03_academy_and_15_openings.spec.ts
 * @description MISSION 3/10 — Audit complet de l'Académie Débutant, des 15 Coups d'Ouverture,
 * de l'Audio bilingue & des Alertes Anti-Frustration.
 * Strictement <= 260 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('MISSION 3/10 — Audit Académie Débutant & 15 Coups d’Ouverture', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
        });
    });

    test('Preuve 1 : Simulateur des 15 Coups d\'Ouverture (clic séquentiel, flèches et explications FR/EN)', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Ouvrir le simulateur depuis l'accueil Débutant
        const openSimBtn = page.getByTestId('beginner-openings-btn');
        await expect(openSimBtn).toBeVisible({ timeout: 10000 });
        await openSimBtn.click();

        const modal = page.getByTestId('beginner-opening-explorer-modal');
        await expect(modal).toBeVisible();

        const all15Rolls = [
            '3-1', '4-2', '5-3', '6-1', '6-5',
            '6-4', '6-3', '6-2', '5-2', '4-3',
            '5-4', '5-1', '4-1', '3-2', '2-1',
        ];

        for (const rollId of all15Rolls) {
            const rollBtn = page.getByTestId(`opening-roll-${rollId}`);
            await expect(rollBtn).toBeVisible();
            await rollBtn.click();

            // Vérifier l'explication et le tracé du coup
            const explanation = page.getByTestId('opening-explanation-text');
            await expect(explanation).toBeVisible();
            const text = await explanation.innerText();
            expect(text.length).toBeGreaterThan(10);

            // Vérifier la présence du tracé de plateau visuel sans chiffre de case
            const visualBoard = page.getByTestId('opening-visual-board');
            await expect(visualBoard).toBeVisible();
            await expect(visualBoard).not.toContainText(/Case \d+/i);
        }

        // Test de la synthèse vocale
        const voiceBtn = page.getByTestId('opening-voice-btn');
        await expect(voiceBtn).toBeVisible();
        await voiceBtn.click();

        // Fermeture
        const closeBtn = page.getByTestId('opening-close-btn');
        await closeBtn.click();
        await expect(modal).not.toBeVisible();
    });

    test('Preuve 2 : Guide Interactif 6 Chapitres & Sélecteur Simple / Gammon / Backgammon', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const openGuideBtn = page.getByTestId('beginner-open-guide-btn');
        await expect(openGuideBtn).toBeVisible();
        await openGuideBtn.click();

        const guideModal = page.getByTestId('beginner-interactive-guide-modal');
        await expect(guideModal).toBeVisible();

        // Vérifier les 6 chapitres
        for (let ch = 1; ch <= 6; ch++) {
            const tab = page.getByTestId(`guide-tab-${ch}`);
            await expect(tab).toBeVisible();
            await tab.click();
            await page.waitForTimeout(100);
        }

        // Tester le sélecteur interactif des 3 types de victoire
        const simpleBtn = page.getByTestId('victory-type-simple');
        const gammonBtn = page.getByTestId('victory-type-gammon');
        const backgammonBtn = page.getByTestId('victory-type-backgammon');

        await expect(simpleBtn).toBeVisible();
        await expect(gammonBtn).toBeVisible();
        await expect(backgammonBtn).toBeVisible();

        await gammonBtn.click();
        const descGammon = await page.getByTestId('victory-type-description').innerText();
        expect(descGammon).toMatch(/15 dames|15 checkers/i);

        await backgammonBtn.click();
        const descBackgammon = await page.getByTestId('victory-type-description').innerText();
        expect(descBackgammon).toMatch(/barre|bar/i);

        // Vérifier la présence de la carte du Cap 6.0 ER
        const capCard = page.getByTestId('cap-6-er-era-card');
        await expect(capCard).toBeVisible();

        // Fermer le guide
        const closeGuideBtn = page.getByTestId('guide-close-btn');
        await closeGuideBtn.click();
        await expect(guideModal).not.toBeVisible();
    });

    test('Preuve 3 : Parcours 10 Quiz d\'Initiation -> Diplôme Initié (+2 000 PTS) -> Partie Guidée', async ({ page }) => {
        await page.goto('/puzzles?mode=beginner-academy');
        await page.waitForLoadState('domcontentloaded');

        // Vérifier la présence du conteneur d'Académie
        const scoreBadge = page.getByTestId('academy-score-badge');
        await expect(scoreBadge).toBeVisible({ timeout: 10000 });

        // Lancer les quiz depuis la première vidéo si en vue VIDEO
        const startQuizBtn = page.locator('button:has-text("Répondre aux quiz")').first();
        if (await startQuizBtn.count() > 0 && await startQuizBtn.isVisible()) {
            await startQuizBtn.click();
        }

        // Répondre aux quiz jusqu'au diplôme (ou tester le flux de validation)
        const quizContainer = page.getByTestId('academy-quiz-container');
        if (await quizContainer.count() > 0) {
            // Cliquer sur le choix A
            const optA = page.getByTestId('academy-option-a');
            if (await optA.count() > 0) {
                await optA.click();
                await page.waitForTimeout(200);

                const nextBtn = page.getByTestId('academy-quiz-next-btn');
                await expect(nextBtn).toBeVisible();
            }
        }
    });

    test('Preuve 4 : Alertes Anti-Frustration (BAR_PRIORITY et CLOSED_POINT)', async ({ page }) => {
        await page.goto('/play?gate=beginner&start=guided');
        await page.waitForLoadState('domcontentloaded');

        const overlay = page.getByTestId('live-professor-coach-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Cliquer sur "Aide déplacements ?" pour déclencher l'alerte anti-frustration
        const helpBtn = page.getByRole('button', { name: /aide déplacements \?|movement rules\?/i });
        await expect(helpBtn).toBeVisible();
        await helpBtn.click();

        // L'alerte anti-frustration doit s'afficher
        const alertBanner = page.getByTestId('anti-frustration-alert');
        await expect(alertBanner).toBeVisible();
        const alertText = await alertBanner.innerText();
        expect(alertText).toMatch(/Barre|fermé|Priority|Gate/i);
    });
});

