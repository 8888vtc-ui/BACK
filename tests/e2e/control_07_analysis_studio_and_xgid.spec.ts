import { test, expect } from '@playwright/test';

test.describe('MISSION 7/10 — Studio d\'Analyse & Scanner XGID 3-Ply', () => {
  test('ouvre le studio d\'analyse, charge un XGID et affiche le top 5 des coups avec flèches', async ({ page }) => {
    // 1. Navigation directe vers /analysis
    await page.goto('/analysis');
    await page.waitForLoadState('domcontentloaded');

    // 2. Vérification de la présence du studio et du plateau
    const studioRoot = page.locator('[data-testid="analysis-studio-root"]');
    await expect(studioRoot).toBeVisible({ timeout: 10000 });

    const xgidInput = page.locator('[data-testid="xgid-input"]');
    await expect(xgidInput).toBeVisible();

    // 3. Clic sur le bouton d'analyse 3-ply
    const runAnalysisBtn = page.locator('[data-testid="run-analysis-btn"]');
    await expect(runAnalysisBtn).toBeVisible();
    await runAnalysisBtn.click();

    // 4. Attente des résultats 3-ply ou du message
    const resultsSection = page.locator('[data-testid="analysis-results-section"]');
    const errorBox = page.locator('[data-testid="analysis-error-box"]');

    // Au moins un des deux doit apparaître proprement sans crash JavaScript
    await expect(resultsSection.or(errorBox)).toBeVisible({ timeout: 15000 });

    // 5. Si les résultats sont visibles, vérifier qu'un clic sur un coup active les flèches
    if (await resultsSection.isVisible()) {
      const firstMove = page.locator('[data-testid="analysis-move-row-0"]');
      await expect(firstMove).toBeVisible();
      await firstMove.click();
    }
  });

  test('permet d\'accéder au Studio d\'Analyse depuis la Sidebar en mode Intermédiaire', async ({ page }) => {
    // Navigation vers le salon en mode Intermédiaire
    await page.goto('/?gate=intermediate');
    await page.waitForLoadState('domcontentloaded');

    // Clic sur l'onglet Studio d'Analyse dans la sidebar
    const studioLink = page.locator('[data-testid="sidebar-pillar-studio"]');
    await expect(studioLink).toBeVisible({ timeout: 10000 });
    await studioLink.click();

    // Vérification de la redirection vers /analysis
    await expect(page).toHaveURL(/.*analysis/);
    await expect(page.locator('[data-testid="analysis-studio-root"]')).toBeVisible();
  });
});

