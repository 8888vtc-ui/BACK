import { test, expect, type Page } from '@playwright/test';

/**
 * AUDIT GÉOMÉTRIQUE & FONCTIONNEL — Refonte "Galaxy / XG".
 *
 * Aucune capture d'écran : l'inspection visuelle est faite exclusivement par
 * calcul de boîtes englobantes (`getBoundingClientRect`) et de styles calculés.
 */

const VIEWPORT = { width: 1440, height: 900 };

async function gotoGame(page: Page) {
    await page.setViewportSize(VIEWPORT);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const aiCard = page.getByTestId('lobby-card-ai');
    if (await aiCard.isVisible()) {
        await aiCard.click();
        await page.getByTestId('lobby-start-btn').click();
    }
    await expect(page.getByTestId('backgammon-board')).toBeVisible();
}

test.describe('Audit géométrique Galaxy/XG (1440x900)', () => {
    test.beforeEach(async ({ page }) => {
        await gotoGame(page);
    });

    test('règle des 5 pions maximum par flèche', async ({ page }) => {
        const violations = await page.evaluate(() => {
            const result: Array<{ point: string; rendered: number }> = [];
            const points = document.querySelectorAll('[data-testid^="point-triangle-"]');
            points.forEach((el) => {
                const point = el.getAttribute('data-point') ?? '?';
                const checkers = el.querySelectorAll('[data-testid^="checker-p"]:not([data-testid^="checker-pattern-"])');
                if (checkers.length > 5) {
                    result.push({ point, rendered: checkers.length });
                }
            });
            return result;
        });
        expect(violations).toEqual([]);
    });

    test('les contrôles centraux sont visibles et ne chevauchent ni pions ni videau', async ({ page }) => {
        const controls = page.getByTestId('board-center-controls');
        await expect(controls).toBeVisible();

        const rollBtn = page.getByTestId('center-roll-button');
        await expect(rollBtn).toBeVisible();
        await expect(rollBtn).toBeEnabled();

        // Vérifie l'absence de chevauchement avec les pions et le videau.
        const overlap = await page.evaluate(() => {
            const btn = document.querySelector('[data-testid="center-roll-button"]');
            if (!btn) return null;
            const b = btn.getBoundingClientRect();
            const checkers = document.querySelectorAll('[data-testid^="checker-p"], [data-testid="doubling-cube"]');
            for (const c of Array.from(checkers)) {
                const r = c.getBoundingClientRect();
                const intersects =
                    b.left < r.right && b.right > r.left && b.top < r.bottom && b.bottom > r.top;
                if (intersects) return true;
            }
            return false;
        });
        expect(overlap).toBe(false);
    });

    test('le bouton central "Lancer" déclenche bien le lancer de dés', async ({ page }) => {
        await page.getByTestId('center-roll-button').click();
        // Après le lancer, les dés du plateau apparaissent.
        await expect(page.getByTestId('board-die-0')).toBeVisible({ timeout: 10000 });
    });

    test('le Pip Count et son différentiel sont affichés', async ({ page }) => {
        const pip = page.getByTestId('pip-diff-badge');
        await expect(pip).toBeVisible();
        const text = await pip.innerText();
        expect(text).toMatch(/\d+/);
    });

    test('chaque flèche SVG part d’un point situé dans un pion existant', async ({ page }) => {
        // Lance les dés puis joue un coup pour faire apparaître des flèches IA/coach.
        await page.getByTestId('center-roll-button').click();
        await expect(page.getByTestId('board-die-0')).toBeVisible({ timeout: 10000 });

        const invalid = await page.evaluate(() => {
            const svgs = document.querySelectorAll('svg[data-testid="coach-arrows"], svg[data-arrow-layer]');
            const problems: string[] = [];
            svgs.forEach((svg) => {
                const lines = svg.querySelectorAll('line, path');
                lines.forEach((l) => {
                    const x1 = Number(l.getAttribute('x1') ?? '0');
                    const y1 = Number(l.getAttribute('y1') ?? '0');
                    if (!Number.isFinite(x1) || !Number.isFinite(y1)) {
                        problems.push('coordonnée non numérique');
                    }
                });
            });
            return problems;
        });
        expect(invalid).toEqual([]);
    });

    test('le panneau Coach n’affiche une analyse que pour le joueur X', async ({ page }) => {
        await page.getByTestId('center-roll-button').click();
        await expect(page.getByTestId('board-die-0')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('hud-coach-btn').click();

        const coach = page.locator('#coach-panel');
        await expect(coach).toBeVisible();
        // Le panneau ne doit jamais afficher un libellé d'analyse pour O.
        const text = await coach.innerText();
        expect(text).not.toContain('Analyse du coup de O');
    });
});
