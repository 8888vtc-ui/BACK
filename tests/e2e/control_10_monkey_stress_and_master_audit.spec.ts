import { test, expect } from '@playwright/test';

test.describe('MISSION 10/10 — Monkey Stress-Test & Certification Globale', () => {
  test('stress-test : bascules rapides de portes, rechargements et clics sans pageerror', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    // 1. Navigation initiale vers l'accueil
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 2. Bascules répétées entre les 3 portes
    const gates = ['beginner', 'intermediate', 'expert', 'beginner', 'expert'];
    for (const g of gates) {
      await page.goto(`/?gate=${g}`);
      await page.waitForTimeout(150);
    }

    // 3. Navigation sur /play en partie guidée
    await page.goto('/play?gate=intermediate&start=guided');
    await page.waitForLoadState('domcontentloaded');

    // Clics rapides sur les boutons d'action
    const rollBtn = page.locator('[data-testid="center-roll-btn"]').or(page.locator('[data-testid="roll-dice-btn"]'));
    if (await rollBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rollBtn.click().catch(() => {});
      await rollBtn.click().catch(() => {});
    }

    // 4. Rechargement de page en cours de partie
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const board = page.locator('[data-testid="backgammon-board"]');
    await expect(board).toBeVisible({ timeout: 10000 });

    // 5. Navigation sur /puzzles
    await page.goto('/puzzles');
    await page.waitForLoadState('domcontentloaded');

    const drillTitle = page.locator('[data-testid="drill-mode-title"]');
    await expect(drillTitle).toBeVisible({ timeout: 10000 });

    // 6. Aucune erreur JavaScript fatale non capturée
    expect(pageErrors.length).toBe(0);
  });
});

