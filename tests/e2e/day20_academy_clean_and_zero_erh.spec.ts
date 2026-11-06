import { test, expect } from '@playwright/test';

test.describe('Day 20: Clean /academy, Zero ERH, AppNavbar + Sidebar & Bilingual FR|EN', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/u;

    test('1. /academy affiche AppNavbar et LobbyLeftSidebar sans débordement', async ({ page }) => {
        await page.goto('/academy?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        const navbar = page.getByTestId('app-navbar');
        await expect(navbar).toBeVisible({ timeout: 10000 });

        const sidebar = page.getByTestId('lobby-left-sidebar');
        await expect(sidebar).toBeVisible({ timeout: 10000 });

        const academyView = page.getByTestId('gammon-academy-view');
        await expect(academyView).toBeVisible({ timeout: 10000 });
    });

    test('2. /academy : Zéro terme interdit ERH et 0 emoji système', async ({ page }) => {
        await page.goto('/academy?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        const pageContent = await page.content();
        // Vérification stricte : Zéro 'ERH' dans tout le code source HTML / DOM
        expect(pageContent).not.toMatch(/\bERH\b/);

        // Vérification 0 emoji
        const mainText = await page.locator('main').innerText();
        expect(mainText).not.toMatch(EMOJI_REGEX);
    });

    test('3. /academy : 100 % Bilingue FR et EN', async ({ page }) => {
        // Test en FR
        await page.goto('/academy?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        await expect(page.getByTestId('academy-beginner-view')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('main')).toContainText('Portail Débutant');

        // Test en EN via ?lang=en
        await page.goto('/academy?lang=en', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('academy-beginner-view')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('main')).toContainText('Beginner Portal');
    });
});
