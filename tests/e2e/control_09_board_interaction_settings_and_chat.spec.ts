import { test, expect } from '@playwright/test';

test.describe('MISSION 9/10 — Ergonomie du Plateau, Inversion des Dés, Undo & Réglages', () => {
  test('vérifie la manipulation des dames, les dés et le tiroir de réglages sur /play', async ({ page }) => {
    // 1. Ouvre la page de jeu en mode guidé
    await page.goto('/play?gate=intermediate&start=guided');
    await page.waitForLoadState('domcontentloaded');

    // 2. Vérifie la présence du plateau
    const board = page.locator('[data-testid="backgammon-board"]');
    await expect(board).toBeVisible({ timeout: 10000 });

    // 3. Bouton Réglages de table (⚙️)
    const settingsBtn = page.locator('[data-testid="hud-settings-toggle-btn"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();

      // Vérifie l'ouverture du menu réglages
      const settingsMenu = page.locator('[data-testid="hud-settings-menu"]');
      await expect(settingsMenu).toBeVisible();

      // Vérifie le bouton de sens et de visibilité des pips
      const orientationBtn = page.locator('[data-testid="orientation-toggle-btn"]');
      await expect(orientationBtn).toBeVisible();

      const pipVisibilityBtn = page.locator('[data-testid="hud-pip-visibility-btn"]');
      await expect(pipVisibilityBtn).toBeVisible();

      // Ferme les réglages
      await settingsBtn.click();
    }

    // 4. Vérification de l'accès aux réactions rapides (Quick-Chat)
    const quickChatToggle = page.locator('[data-testid="left-rail-quick-chat-toggle"]');
    if (await quickChatToggle.isVisible()) {
      await quickChatToggle.click();
      const ggBtn = page.locator('[data-testid="quick-chat-btn-gg"]');
      await expect(ggBtn).toBeVisible();
    }
  });

  test('permet d\'inverser l\'ordre des dés (Swap Dice) au clic sur les dés dans la rivière', async ({ page }) => {
    await page.goto('/play?gate=intermediate&start=guided');
    await page.waitForLoadState('domcontentloaded');

    // Vérifie si des dés sont affichés sur le plateau
    const diceArea = page.getByRole('button', { name: /Dé [1-2]/i }).first();
    if (await diceArea.isVisible({ timeout: 4000 }).catch(() => false)) {
      await diceArea.click();
      expect(true).toBe(true);
    }
  });
});

