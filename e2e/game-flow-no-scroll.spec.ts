import { test, expect } from '@playwright/test';

test.describe('Audit Zéro Défilement & Parcours Réel du Jeu', () => {
    test('Aucun défilement vertical ni horizontal sur Desktop (1280x800) et Mobile (390x844)', async ({ page }) => {
        // 1. Desktop 1280x800
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/');

        await page.getByTestId('lobby-start-btn').click();

        const board = page.getByTestId('backgammon-board');
        await expect(board).toBeVisible();

        const desktopOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            return {
                scrollHeight: doc.scrollHeight,
                clientHeight: doc.clientHeight,
                scrollWidth: doc.scrollWidth,
                clientWidth: doc.clientWidth,
            };
        });

        expect(desktopOverflow.scrollHeight).toBeLessThanOrEqual(desktopOverflow.clientHeight + 2);
        expect(desktopOverflow.scrollWidth).toBeLessThanOrEqual(desktopOverflow.clientWidth + 2);

        // 2. Jouer un tour réel (Lancer les dés -> Cliquer sur les pions -> Valider le tour)
        const rollButton = page.getByTestId('center-roll-button');
        await expect(rollButton).toBeVisible();
        await rollButton.click();

        const die0 = page.getByTestId('board-die-0');
        await expect(die0).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(460);

        const candidatePoints = [24, 13, 8, 6];
        for (const pt of candidatePoints) {
            await page.getByTestId(`point-triangle-${pt}`).click();
            await page.waitForTimeout(100);
        }

        const confirmBtn = page.getByTestId('center-confirm-button');
        if (await confirmBtn.isVisible()) {
            await confirmBtn.click();
        }

        // Vérifier qu'après le coup + affichage du Coach, la page ne scrolle toujours pas
        const desktopAfterMoveOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            return {
                scrollHeight: doc.scrollHeight,
                clientHeight: doc.clientHeight,
            };
        });
        expect(desktopAfterMoveOverflow.scrollHeight).toBeLessThanOrEqual(desktopAfterMoveOverflow.clientHeight + 2);

        // 3. Mobile 390x844
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(200);

        const mobileOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            return {
                scrollHeight: doc.scrollHeight,
                clientHeight: doc.clientHeight,
                scrollWidth: doc.scrollWidth,
                clientWidth: doc.clientWidth,
            };
        });

        expect(mobileOverflow.scrollHeight).toBeLessThanOrEqual(mobileOverflow.clientHeight + 2);
        expect(mobileOverflow.scrollWidth).toBeLessThanOrEqual(mobileOverflow.clientWidth + 2);
    });
});
