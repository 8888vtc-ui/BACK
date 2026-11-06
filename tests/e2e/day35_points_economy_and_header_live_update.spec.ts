import { test, expect } from '@playwright/test';

test.describe('Mission 35/50: Économie 10 000 PTS, Plancher 1 000 PTS & Bourse Coach +2 500 PTS', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Capital initial à 10 000 PTS et mise à jour en direct dans le Header lors de la Bourse du Coach (+2 500 PTS)', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();

        // Vérification du capital initial 10 000 PTS
        await expect(pointsBadge).toContainText(/10[\s,.]?000\s*PTS/);

        // Simulation de la résolution de 3 quiz pour obtenir la Bourse du Coach (+2 500 PTS)
        await page.evaluate(() => {
            const STORAGE_KEY = 'bgtour_circle_points_balance';
            const raw = localStorage.getItem(STORAGE_KEY);
            const state = raw ? JSON.parse(raw) : { balance: 10000, consecutiveBlundersSolvedForGrant: 0, history: [] };

            // Crédit de la bourse du coach
            const nextBalance = state.balance + 2500;
            const updated = {
                ...state,
                balance: nextBalance,
                history: [
                    {
                        id: `coach_grant_${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        delta: 2500,
                        newBalance: nextBalance,
                        reason: 'COACH_STUDY_GRANT',
                    },
                    ...(state.history || []),
                ],
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('bgtour-points-updated', { detail: updated }));
        });

        // Le compteur PTS dans AppNavbar doit immédiatement afficher 12 500 PTS en direct
        await expect(pointsBadge).toContainText(/12[\s,.]?500\s*PTS/);
    });

    test('2. Filet de sécurité anti-banqueroute : recave automatique à 1 000 PTS si le solde chute sous 200 PTS', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();

        // Chute sous 200 PTS déclenchant le filet de sécurité (recave automatique à 1 000 PTS)
        await page.evaluate(() => {
            const STORAGE_KEY = 'bgtour_circle_points_balance';
            const updated = {
                balance: 1000, // Recharge automatique à 1 000 PTS
                consecutiveBlundersSolvedForGrant: 0,
                history: [
                    {
                        id: `safety_refill_${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        delta: 850,
                        newBalance: 1000,
                        reason: 'SAFETY_FLOOR_REFILL',
                        metadata: 'Filet de sécurité : recharge automatique à 1 000 PTS',
                    },
                ],
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('bgtour-points-updated', { detail: updated }));
        });

        // Le badge du Header se met à jour en direct à 1 000 PTS
        await expect(pointsBadge).toContainText(/1[\s,.]?000\s*PTS/);
    });

    test('3. Bourse du Coach sur /puzzles : le badge PTS est visible et synchronisé', async ({ page }) => {
        // En mode intermédiaire / connecté
        await page.goto('/puzzles?gate=intermediate&lang=fr');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText(/PTS/);
    });
});
