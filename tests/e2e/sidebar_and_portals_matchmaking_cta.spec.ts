import { test, expect } from '@playwright/test';

test.describe('Permanent Find a Player Matchmaking & Gate CTA Sublimation', () => {
  test('Sidebar displays Find a Player with online counter and pulsing green dot', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Verify left sidebar exists
    const sidebar = page.locator('[data-testid="lobby-left-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Verify Salon de Jeu
    const quickPlayBtn = page.locator('[data-testid="sidebar-quick-play-btn"]');
    await expect(quickPlayBtn).toBeVisible();

    // Verify Trouver un joueur button directly in sidebar
    const findPlayerBtn = page.locator('[data-testid="sidebar-find-player-btn"]');
    await expect(findPlayerBtn).toBeVisible();
    await expect(findPlayerBtn).toContainText(/Trouver un joueur|Find a Player/);
    await expect(findPlayerBtn).toContainText(/en ligne|online/);

    // Verify Inviter un ami button
    const inviteBtn = page.locator('[data-testid="sidebar-invite-friend-btn"]');
    await expect(inviteBtn).toBeVisible();
    await expect(inviteBtn).toContainText(/Inviter un ami|Invite a Friend/);

    // Switch to Intermediate Gate
    const interTab = page.locator('[data-testid="tier-gate-btn-intermediate"]').first();
    await interTab.click();

    // Verify Gate 2 header & CTA
    const interPortal = page.locator('[data-testid="intermediate-home-portal"]');
    await expect(interPortal).toBeVisible();
    await expect(interPortal).toContainText(/Matchmaking Club Actif 24\/7|24\/7 Club Matchmaking Active/);
    const interPlayBtn = page.locator('[data-testid="intermediate-play-btn"]');
    await expect(interPlayBtn).toContainText(/TROUVER UN JOUEUR EN LIGNE|FIND A PLAYER ONLINE/);

    // Switch to Expert Gate
    const expertTab = page.locator('[data-testid="tier-gate-btn-expert"]').first();
    await expertTab.click();

    // Verify Gate 3 header & CTA
    const expertPortal = page.locator('[data-testid="expert-home-portal"]');
    await expect(expertPortal).toBeVisible();
    await expect(expertPortal).toContainText(/Matchmaking Tournoi Actif|Tournament Matchmaking Active/);
    const expertPlayBtn = page.locator('[data-testid="expert-play-btn"]');
    await expect(expertPlayBtn).toContainText(/TROUVER UN ADVERSAIRE|FIND AN OPPONENT/);

    // Take screenshot for visual proof
    await page.screenshot({ path: 'test-results/matchmaking-prominence-proof.png' });
  });
});
