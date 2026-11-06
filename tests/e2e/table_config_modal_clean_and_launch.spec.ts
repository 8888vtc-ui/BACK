import { test, expect } from '@playwright/test';

test.describe('Salon Privé & Configuration de la Table — Zéro-Scroll & Paliers Officiels', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Modale compacte, bouton Lancer visible sans scroll, Paliers Officiels et Videau à 1', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=expert');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        // Ouvre la modale des options via la sidebar
        await page.waitForSelector('[data-testid="sidebar-play-group-toggle"]', { timeout: 15000 });
        await page.click('[data-testid="sidebar-play-group-toggle"]');
        await page.click('[data-testid="sidebar-submenu-ai"]');

        const modal = page.locator('[data-testid="lobby-options-panel"]');
        await expect(modal).toBeVisible();

        // 1. Bouton LANCER LA PARTIE immédiatement visible dans le viewport sans scroller
        const startBtn = page.locator('[data-testid="lobby-options-start-btn"]');
        await expect(startBtn).toBeVisible();

        const startBox = await startBtn.boundingBox();
        expect(startBox).not.toBeNull();
        if (startBox) {
            // Le bouton doit se trouver dans les 900px du viewport vertical
            expect(startBox.y + startBox.height).toBeLessThanOrEqual(900);
            expect(startBox.y).toBeGreaterThan(0);
        }

        // 2. Vérification des 4 Paliers Officiels : Zéro troncature "..." et Zéro vieux noms
        const beginnerCard = page.locator('[data-testid="lobby-opponent-beginner"]');
        const intermediateCard = page.locator('[data-testid="lobby-opponent-intermediate"]');
        const expertCard = page.locator('[data-testid="lobby-opponent-expert"]');
        const grandmasterCard = page.locator('[data-testid="lobby-opponent-grandmaster"]');

        await expect(beginnerCard).toBeVisible();
        await expect(intermediateCard).toBeVisible();
        await expect(expertCard).toBeVisible();
        await expect(grandmasterCard).toBeVisible();

        // Aucun nom coupé par "..."
        const beginnerText = await beginnerCard.textContent();
        const expertText = await expertCard.textContent();
        expect(beginnerText).toContain('Le Professeur');
        expect(beginnerText).not.toContain('...');
        expect(beginnerText).not.toContain('Mauvais');

        expect(expertText).toContain('Compétiteur');
        expect(expertText).not.toContain('...');
        expect(expertText).not.toContain('Victor');
        expect(expertText).not.toContain('Marcus');

        // 3. Synchronisation à 100 % avec le récapitulatif à droite
        await expertCard.click();
        const recapOpponent = page.locator('[data-testid="lobby-preview-opponent"]');
        await expect(recapOpponent).toContainText('Compétiteur');
        await expect(recapOpponent).toContainText('1850 Elo');

        await beginnerCard.click();
        await expect(recapOpponent).toContainText('Le Professeur');
        await expect(recapOpponent).toContainText('1200 Elo');

        // 4. Videau sur le mini-plateau à droite : affiche 1 (et non 64)
        const boardSvg = page.locator('[data-testid="lobby-board-preview"] svg');
        await expect(boardSvg).toBeVisible();
        const svgContent = await boardSvg.innerHTML();
        expect(svgContent).toContain('>1<');
        expect(svgContent).not.toContain('>64<');

        // Absence d'erreurs runtime
        expect(pageErrors).toEqual([]);
    });
});
