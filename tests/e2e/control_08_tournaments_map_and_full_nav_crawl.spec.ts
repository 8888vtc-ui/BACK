import { test, expect } from '@playwright/test';

test.describe('MISSION 8/10 — Carte : Tournois & Clubs & Crawl Zéro-404', () => {
  test('affiche la carte et la liste mondiale des tournois sans crash ni 404', async ({ page }) => {
    // 1. Navigation directe vers /tournaments
    await page.goto('/tournaments');
    await page.waitForLoadState('domcontentloaded');

    // 2. Vérification de la présence de la vue principale des tournois
    const tournamentView = page.locator('[data-testid="tournament-hub-view"]').or(page.locator('main'));
    await expect(tournamentView).toBeVisible({ timeout: 10000 });

    // 3. Vérification des tournois phares (Monte-Carlo World Championship, Paris, etc.)
    const tournamentText = page.getByText(/Monte-Carlo|Paris|Chypre|Cyprus|World Championship/i).first();
    await expect(tournamentText).toBeVisible({ timeout: 10000 });
  });

  test('parcourt tous les onglets principaux de la navigation sans erreur 404', async ({ page }) => {
    const routesToTest = [
      { name: 'Accueil', path: '/' },
      { name: 'Tournois & Clubs', path: '/tournaments' },
      { name: 'Quiz & Puzzles', path: '/puzzles' },
      { name: 'Studio Analyse', path: '/analysis' },
      { name: 'Académie', path: '/academy' },
      { name: 'Progression', path: '/progression' },
    ];

    for (const r of routesToTest) {
      const response = await page.goto(r.path);
      expect(response?.status()).toBeLessThan(400);
      await page.waitForLoadState('domcontentloaded');

      // Vérifie qu'il n'y a pas d'écran 404
      const notFoundHeading = page.getByRole('heading', { name: /404|Page introuvable|Not Found/i });
      await expect(notFoundHeading).not.toBeVisible();
    }
  });

  test('permet d\'accéder à la Carte des Tournois depuis la sidebar du Lobby', async ({ page }) => {
    await page.goto('/?gate=intermediate');
    await page.waitForLoadState('domcontentloaded');

    const tournamentsSidebarLink = page.locator('[data-testid="sidebar-pillar-tournaments"]');
    await expect(tournamentsSidebarLink).toBeVisible({ timeout: 10000 });
    await tournamentsSidebarLink.click();

    await expect(page).toHaveURL(/.*tournaments/);
  });
});
