import { test, expect } from '@playwright/test';

test.describe('Tournaments World Hub — Left Sidebar, Full FR/EN i18n, Zero Emojis & Zero Scroll (1440x900)', () => {
  test('Verifies all 5 chantiers on /tournaments at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });

    await page.goto('/tournaments');
    await page.locator('[data-testid="tier-gate-btn-intermediate"]').first().click();

    // 1. Sidebar présente à gauche
    const sidebar = page.locator('[data-testid="lobby-left-sidebar"]');
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-quick-play-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-find-player-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-my-quizzes-link"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-my-blunders-link"]')).toBeVisible();
    const tourLink = page.locator('[data-testid="sidebar-pillar-tournaments"]');
    await expect(tourLink).toBeVisible();
    await expect(tourLink).toHaveClass(/border-\[#D4AF37\]/);

    // 2. Multilingue FR | EN fonctionnel
    const hubView = page.locator('[data-testid="tournament-world-hub-view"]');
    await expect(hubView).toContainText('CARTE MONDIALE DES CLUBS & TOURNOIS');
    await expect(hubView).not.toContainText('Install App');

    // 3. Zéro troncature dans le Header ("Joueur Invité" entièrement dans 1440px)
    const authStatus = page.locator('[data-testid="lobby-auth-status"]');
    await expect(authStatus).toBeVisible();
    await expect(authStatus).toHaveText('Joueur Invité');
    const authTrigger = page.locator('[data-testid="auth-login-trigger"]');
    const authBox = await authTrigger.boundingBox();
    expect(authBox).not.toBeNull();
    expect(authBox!.x + authBox!.width).toBeLessThanOrEqual(1440);

    // Bascule en EN en 1 clic
    const localeToggle = page.locator('[data-testid="navbar-locale-toggle-btn"]');
    await localeToggle.click();

    await expect(hubView).toContainText('WORLD MAP OF CLUBS & TOURNAMENTS');
    await expect(page.locator('[data-testid="sidebar-find-player-btn"]')).toContainText('Find a Player');
    await expect(authStatus).toHaveText('Guest Player');
    await expect(page.locator('[data-testid="tier-gate-btn-beginner"]').first()).toHaveText('Beginner');
    await expect(page.locator('[data-testid="tier-gate-btn-intermediate"]').first()).toHaveText('Intermediate');

    // Retour en FR
    await localeToggle.click();
    await expect(hubView).toContainText('CARTE MONDIALE DES CLUBS & TOURNOIS');
    await expect(authStatus).toHaveText('Joueur Invité');

    // 4. Zéro emoji système dans le DOM de /tournaments
    const bodyText = await page.locator('body').innerText();
    for (const forbiddenEmoji of ['🏛', '🔍', '🌍', '📍', '🕒', '💳', '🏆', '🎲']) {
      expect(bodyText).not.toContain(forbiddenEmoji);
    }

    // 5. Zéro scroll vertical sur 1440x900
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeight).toBeLessThanOrEqual(900);

    await page.screenshot({ path: 'test-results/tournaments-sidebar-i18n-clean-proof.png' });
  });
});
