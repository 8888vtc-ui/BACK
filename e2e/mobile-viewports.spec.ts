import { test, expect } from '@playwright/test';

test.describe('E2E : Viewports Mobile & Ergonomie Tactile', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('bloque le portrait mobile et invite à tourner l\'appareil en paysage', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });

        // Le plateau de backgammon (ratio ~2:1) ne peut pas être rendu lisiblement
        // en portrait : un bloqueur plein écran invite à tourner l'appareil.
        const landscapeBlocker = page.getByTestId('landscape-hint');
        await expect(landscapeBlocker).toBeVisible();
        await expect(landscapeBlocker).toContainText(/Tournez votre appareil/i);

        // Le plateau reste présent dans le DOM mais est masqué par le bloqueur.
        const boardContainer = page.getByTestId('backgammon-board');
        await expect(boardContainer).toBeAttached();
    });

    test('affiche le plateau et le HUD sans collision en paysage mobile', async ({ page }) => {
        await page.setViewportSize({ width: 844, height: 390 });

        // En paysage, le bloqueur de rotation ne doit pas s'afficher.
        await expect(page.getByTestId('landscape-hint')).not.toBeVisible();

        // Le plateau est visible.
        const boardContainer = page.getByTestId('backgammon-board');
        await expect(boardContainer).toBeVisible();

        // Le HUD est visible.
        const header = page.locator('header[aria-label*="Tableau de bord"]');
        await expect(header).toBeVisible();
    });

    test('affiche le menu et les outils du HUD sans collision en paysage mobile', async ({ page }) => {
        await page.setViewportSize({ width: 844, height: 390 });

        const header = page.locator('header[aria-label*="Tableau de bord"]');
        await expect(header).toBeVisible();

        // Déplie la barre secondaire d'activités (repliable par défaut)
        const modesToggle = page.getByTestId('hud-modes-toggle-btn');
        await expect(modesToggle).toBeVisible();
        await modesToggle.click();

        // Liens d'accès direct désormais visibles
        await expect(page.getByTestId('drills-hud-link')).toBeVisible();
        await expect(page.getByTestId('puzzles-hud-link')).toBeVisible();
        await expect(page.getByTestId('coach-hud-trigger')).toBeVisible();
    });
});
