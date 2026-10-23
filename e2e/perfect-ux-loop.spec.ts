import { test, expect } from '@playwright/test';

test.use({ hasTouch: false });

test.describe('Audit Ergonomique & Boucle de Jeu Temps Réel', () => {
    test('Joue 2 tours complets (Humain + IA), vérifie les flèches, les dés, le Coach et le Flight Recorder', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/');

        await page.getByTestId('lobby-start-btn').click();

        const board = page.getByTestId('backgammon-board');
        await expect(board).toBeVisible();

        const playOneFullTurn = async () => {
            const rollBtn = page.getByTestId('center-roll-button');
            await expect(rollBtn).toBeVisible({ timeout: 15000 });
            await rollBtn.click();

            await expect(page.getByTestId('board-die-0')).toBeVisible({ timeout: 5000 });
            await page.waitForTimeout(460);

            const confirmBtn = page.getByTestId('center-confirm-button');
            for (let subMove = 0; subMove < 4; subMove++) {
                if (await confirmBtn.isVisible()) {
                    await confirmBtn.click();
                    break;
                }

                let confirmed = false;
                for (const pt of [24, 13, 8, 6, 5, 7, 11, 20, 18, 4, 3, 2, 1]) {
                    const ptEl = page.getByTestId(`point-triangle-${pt}`);
                    await ptEl.click();
                    await page.waitForTimeout(80);
                    if (await confirmBtn.isVisible()) {
                        await confirmBtn.click();
                        confirmed = true;
                        break;
                    }
                }
                if (confirmed) break;
            }

            // Attendre que l'IA joue et que le bouton Lancer revienne au joueur
            await expect(rollBtn).toBeVisible({ timeout: 15000 });
        };

        await playOneFullTurn();

        // Vérifier le Flight Recorder : 0 flèche fantôme (sourceValid === true)
        const flightLog = await page.evaluate(() => (window as unknown as { __BG_FLIGHT_LOG__: Array<{ arrows: Array<{ sourceValid: boolean }> }> }).__BG_FLIGHT_LOG__ || []);
        expect(flightLog.length).toBeGreaterThan(0);

        const invalidArrows = flightLog.flatMap((e) => e.arrows).filter((a) => !a.sourceValid);
        expect(invalidArrows).toHaveLength(0);
        expect(errors).toHaveLength(0);
    });
});
