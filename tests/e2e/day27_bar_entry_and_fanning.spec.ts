import { test, expect } from '@playwright/test';

/**
 * MISSION 27/50 : TEST PLAYWRIGHT E2E RENTRÉE DE BARRE ET DANSE (1440x900, --workers=1)
 * Vérifie via le pont d'inspection officiel QA (__BG_QA__.applyRemoteState) :
 * 1. 1 pion sur la barre : interdiction de déplacer les pions du plateau (data-locked-by-bar="true").
 * 2. 2 pions sur la barre : le plateau reste verrouillé et seule la barre peut bouger.
 * 3. Danse complète (6 portes fermées) : affichage du bandeau de danse et auto-pass sans blocage.
 */

test.describe('Day 27: Bar Entry Priority, 2-Checkers Lock & Fanning E2E', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(60000);

    test('1. Un pion sur la barre : les pions du plateau sont verrouillés (data-locked-by-bar="true")', async ({ page }) => {
        // Préparer un état avec 1 pion sur la barre pour X, dés [6, 2]
        const board = new Array<number>(26).fill(0);
        board[0] = 1; // 1 pion X sur la barre (X_BAR)
        board[6] = 5; // Pions X sur le point 6
        board[8] = 3; // Pions X sur le point 8
        board[13] = 5; // Pions X sur le point 13
        board[1] = 1; // 1 pion X sur le point 1
        board[24] = -2; // Porte adverse en 24
        board[12] = -13; // Pions adverses

        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof (window as any).__BG_QA__?.applyRemoteState === 'function', { timeout: 15000 });

        await page.evaluate(({ board }) => {
            (window as any).__BG_QA__.applyRemoteState({
                board,
                turn: 'X',
                dice: [6, 2],
                phase: 'PLAYING_MOVES',
                usedDice: [false, false],
            });
        }, { board });

        // Vérifier que le conteneur central de la barre est visible
        await expect(page.getByTestId('central-bar-container')).toBeVisible({ timeout: 10000 });

        // Vérifier que les flèches du plateau occupées par X sont marquées data-locked-by-bar="true"
        const point13 = page.locator('[data-point="13"]');
        const point8 = page.locator('[data-point="8"]');
        const point6 = page.locator('[data-point="6"]');

        await expect(point13).toHaveAttribute('data-locked-by-bar', 'true');
        await expect(point8).toHaveAttribute('data-locked-by-bar', 'true');
        await expect(point6).toHaveAttribute('data-locked-by-bar', 'true');
    });

    test('2. Deux pions sur la barre : le plateau reste verrouillé et seule la barre peut bouger', async ({ page }) => {
        const board = new Array<number>(26).fill(0);
        board[0] = 2; // 2 pions X sur la barre
        board[6] = 5;
        board[8] = 3;
        board[13] = 5;
        board[19] = -2; // Case 25 - 6 = 19 fermée
        board[12] = -13;

        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof (window as any).__BG_QA__?.applyRemoteState === 'function', { timeout: 15000 });

        await page.evaluate(({ board }) => {
            (window as any).__BG_QA__.applyRemoteState({
                board,
                turn: 'X',
                dice: [6, 2],
                phase: 'PLAYING_MOVES',
                usedDice: [false, false],
            });
        }, { board });

        await expect(page.getByTestId('central-bar-container')).toBeVisible({ timeout: 10000 });

        // Flèches du plateau toujours verrouillées
        await expect(page.locator('[data-point="13"]')).toHaveAttribute('data-locked-by-bar', 'true');
        await expect(page.locator('[data-point="6"]')).toHaveAttribute('data-locked-by-bar', 'true');
    });

    test('3. Danse complète (6 portes fermées) : affichage du bandeau de danse sans bloquer la partie', async ({ page }) => {
        const board = new Array<number>(26).fill(0);
        board[0] = 1; // 1 pion X sur la barre
        board[1] = 14;
        // 6 portes fermées dans le jan intérieur adverse (19..24)
        for (let pt = 19; pt <= 24; pt++) {
            board[pt] = -2;
        }
        board[12] = -3;

        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof (window as any).__BG_QA__?.applyRemoteState === 'function', { timeout: 15000 });

        await page.evaluate(({ board }) => {
            (window as any).__BG_QA__.applyRemoteState({
                board,
                turn: 'X',
                dice: [6, 5],
                phase: 'PLAYING_MOVES',
                usedDice: [false, false],
            });
        }, { board });

        await expect(page.getByTestId('central-bar-container')).toBeVisible({ timeout: 10000 });

        // Vérifier l'apparition du bandeau de danse
        const danceBanner = page.getByTestId('bar-danced-banner');
        await expect(danceBanner).toBeVisible({ timeout: 10000 });
        const bannerText = await danceBanner.innerText();
        expect(bannerText.toLowerCase()).toContain('portes fermées');
    });
});
