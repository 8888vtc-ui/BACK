import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/opening_15_visual_no_numbers.spec.ts
 * @description Audit E2E Playwright de la Refonte Visuelle du Simulateur des 15 Coups d'Ouverture.
 * Vérifie : zéro notation chiffrée (8/5, 13/7), présence du vrai plateau visuel SVG,
 * flèches dorées animées et explications sans numéro de case.
 */

test.describe('🎯 AUDIT E2E : SIMULATEUR DES 15 COUPS D’OUVERTURE 100% VISUEL (ZÉRO NOTATION)', () => {

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
        });
    });

    test('1. Vérifie l’absence totale de notation technique chiffrée et la présence du plateau visuel', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Ouvrir le simulateur depuis l'accueil Débutant
        const openSimBtn = page.getByTestId('beginner-openings-btn');
        await expect(openSimBtn).toBeVisible({ timeout: 12000 });
        await openSimBtn.click();

        const modal = page.getByTestId('beginner-opening-explorer-modal');
        await expect(modal).toBeVisible({ timeout: 6000 });

        // 1. Contrôle constitutionnel : ZÉRO notation chiffrée (8/5, 6/5, 24/13, 13/7, Notation officielle)
        const modalText = await modal.innerText();
        expect(modalText).not.toContain('8/5');
        expect(modalText).not.toContain('6/5');
        expect(modalText).not.toContain('24/13');
        expect(modalText).not.toContain('13/7');
        expect(modalText).not.toContain('Notation officielle');
        expect(modalText).not.toMatch(/Case \d+/i);

        // 2. Vérification du plateau visuel SVG et des flèches dorées sur le coup par défaut 3-1
        const visualBoard = page.getByTestId('opening-visual-board');
        await expect(visualBoard).toBeVisible();

        // Le plateau doit contenir le camp adverse et la maison du joueur (FR ou EN)
        await expect(visualBoard).toContainText(/(?:Camp Adverse|Opponent Camp)/);
        await expect(visualBoard).toContainText(/(?:Votre Maison \(Sortie\)|Your Home \(Exit\))/);

        // Flèches dorées de déplacement
        const moveArrows = page.locator('[data-testid="opening-move-arrow"]');
        await expect(moveArrows.first()).toBeVisible();
        const arrowCount = await moveArrows.count();
        expect(arrowCount).toBeGreaterThanOrEqual(1);

        // 3. Test du bouton d'animation des pions
        const animateBtn = page.getByTestId('opening-animate-btn');
        await expect(animateBtn).toBeVisible();
        await animateBtn.click();
        await page.waitForTimeout(300);
        await expect(animateBtn).toHaveText(/Position Initiale|Reset position/i);

        // Revenir en position initiale
        await animateBtn.click();
        await page.waitForTimeout(200);
        await expect(animateBtn).toHaveText(/Animer le déplacement|Animate move/i);

        // 4. Clic sur plusieurs lancers clés et vérification de la mise à jour dynamique
        const testRolls = ['4-2', '6-1', '6-5', '5-2', '4-3'];
        for (const rollId of testRolls) {
            const rollBtn = page.getByTestId(`opening-roll-${rollId}`);
            await expect(rollBtn).toBeVisible();
            await rollBtn.click();

            // Vérifier que le commentaire du professeur est à jour et sans numéro de case
            const explanation = page.getByTestId('opening-explanation-text');
            await expect(explanation).toBeVisible();
            const expText = await explanation.innerText();
            expect(expText).not.toMatch(/case \d+/i);
            expect(expText).not.toMatch(/\d+\/\d+/);

            // Vérifier que le plateau visuel affiche les flèches du nouveau coup
            await expect(moveArrows.first()).toBeVisible();
        }

        // 5. Fermeture de la modale
        const closeBtn = page.getByTestId('opening-close-btn');
        await closeBtn.click();
        await expect(modal).not.toBeVisible();
    });
});
