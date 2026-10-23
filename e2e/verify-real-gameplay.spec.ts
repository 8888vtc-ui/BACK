import { test, expect } from '@playwright/test';

test.use({ hasTouch: false });

test('Boucle de jeu réelle : Humain joue 2 tours + Bot répond avec flèches et boîte noire', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
        if (msg.text().includes('[FLIGHT RECORDER]')) {
            consoleLogs.push(msg.text());
        }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Démarre une partie depuis le Lobby
    await page.getByTestId('lobby-start-btn').click();

    const board = page.getByTestId('backgammon-board');
    await expect(board).toBeVisible();

    const playHumanTurn = async () => {
        const rollBtn = page.getByTestId('center-roll-button');
        await expect(rollBtn).toBeVisible({ timeout: 15000 });
        await rollBtn.click();

        await expect(page.getByTestId('board-die-0')).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(460);

        const confirmBtn = page.getByTestId('center-confirm-button');
        for (let step = 0; step < 4; step++) {
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
                break;
            }
            if (await rollBtn.isVisible()) break;

            let moved = false;
            const bar = page.getByTestId('bar');
            if (await bar.isVisible()) {
                await bar.click();
            }

            for (const pt of [24, 13, 8, 6, 5, 7, 11, 20, 18, 4, 3, 2, 1]) {
                const ptEl = page.getByTestId(`point-triangle-${pt}`);
                await ptEl.click();
                await page.waitForTimeout(80);
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    moved = true;
                    break;
                }
            }
            if (moved) break;
        }
    };

    // Tour 1 Humain
    await playHumanTurn();

    // Attendre que le Bot termine son tour et que le bouton Lancer réapparaisse pour le Tour 2 Humain
    await expect(page.getByTestId('center-roll-button')).toBeVisible({ timeout: 15000 });

    // Vérifier le Flight Recorder dans window.__BG_FLIGHT_LOG__
    const flightLog = await page.evaluate(() => (window as unknown as { __BG_FLIGHT_LOG__: Array<{ arrows: Array<{ sourceValid: boolean }> }> }).__BG_FLIGHT_LOG__ || []);
    expect(flightLog.length).toBeGreaterThan(0);

    for (const entry of flightLog) {
        for (const arrow of entry.arrows) {
            expect(arrow.sourceValid).toBe(true);
        }
    }
});
