import { test, expect } from '@playwright/test';

// Skip links i18n et sélecteur de langue désormais présents.
test.describe('E2E : Internationalisation i18n FR/EN', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('affiche le sélecteur de langue et est initialisé en français par défaut', async ({ page }) => {
        const langSelector = page.getByTestId('language-selector');
        await expect(langSelector).toBeVisible();

        const btnFr = page.getByTestId('lang-btn-fr');
        const btnEn = page.getByTestId('lang-btn-en');
        await expect(btnFr).toBeVisible();
        await expect(btnEn).toBeVisible();

        // Vérifie l'attribut lang sur le document racine
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(btnFr).toHaveAttribute('aria-pressed', 'true');
        await expect(btnEn).toHaveAttribute('aria-pressed', 'false');

        // Vérifie un texte d'évitement en français
        const skipLink = page.locator('a[href="#backgammon-board"]');
        await expect(skipLink).toHaveText('Aller au plateau de jeu');
    });

    test('bascule l\'application en anglais au clic sur le bouton EN', async ({ page }) => {
        const btnEn = page.getByTestId('lang-btn-en');
        const btnFr = page.getByTestId('lang-btn-fr');
        await btnEn.click();

        // L'attribut lang passe à 'en'
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(btnEn).toHaveAttribute('aria-pressed', 'true');
        await expect(btnFr).toHaveAttribute('aria-pressed', 'false');

        // Vérification de la persistance dans localStorage
        const savedLocale = await page.evaluate(() => localStorage.getItem('bg_locale'));
        expect(savedLocale).toBe('en');

        // Vérifie la mise à jour des éléments de l'UI en anglais
        const skipLinkBoard = page.locator('a[href="#backgammon-board"]');
        await expect(skipLinkBoard).toHaveText('Skip to Game Board');

        const skipLinkHud = page.locator('a[href="#match-hud"]');
        await expect(skipLinkHud).toHaveText('Skip to Match HUD');
    });

    test('persiste la préférence linguistique après rechargement de la page', async ({ page }) => {
        // Bascule en anglais
        const btnEn = page.getByTestId('lang-btn-en');
        await btnEn.click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');

        // Rechargement
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // Vérifie que l'anglais est toujours actif
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        const savedLocale = await page.evaluate(() => localStorage.getItem('bg_locale'));
        expect(savedLocale).toBe('en');

        const skipLink = page.locator('a[href="#backgammon-board"]');
        await expect(skipLink).toHaveText('Skip to Game Board');

        // Bascule à nouveau vers le français
        const btnFr = page.getByTestId('lang-btn-fr');
        await btnFr.click();
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

        const finalLocale = await page.evaluate(() => localStorage.getItem('bg_locale'));
        expect(finalLocale).toBe('fr');
        await expect(skipLink).toHaveText('Aller au plateau de jeu');
    });
});
