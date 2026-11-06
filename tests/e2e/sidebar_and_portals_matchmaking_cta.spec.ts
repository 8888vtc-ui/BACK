import { test, expect } from '@playwright/test';

test.describe('Beginner Left Sidebar Tailor & Single-Line Find a Player', () => {
  test('Beginner sidebar shows single-line Find a Player, no bottom duplicate Invite, and tailored Beginner items', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Ensure we are in Beginner mode
    const begTab = page.locator('[data-testid="tier-gate-btn-beginner"]').first();
    await begTab.click();

    const sidebar = page.locator('[data-testid="lobby-left-sidebar"]');
    await expect(sidebar).toBeVisible();

    // 1. Verify Trouver un joueur is on a single line (height <= 40px)
    const findPlayerBtn = page.locator('[data-testid="sidebar-find-player-btn"]');
    await expect(findPlayerBtn).toBeVisible();
    await expect(findPlayerBtn).toContainText(/Trouver un joueur|Find a Player/);
    const box = await findPlayerBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(40);

    // 2. Verify bottom duplicate "Inviter des amis" is gone
    await expect(page.locator('[data-testid="sidebar-submenu-friends"]')).toHaveCount(0);

    // 3. Verify Beginner tailored entries under TABLES & ENTRAÎNEMENT
    const guidedPlayBtn = page.locator('[data-testid="sidebar-guided-play-btn"]');
    await expect(guidedPlayBtn).toBeVisible();
    await expect(guidedPlayBtn).toContainText(/Partie Guidée|Guided Match/);

    const initiationLink = page.locator('[data-testid="sidebar-my-quizzes-link"]');
    await expect(initiationLink).toBeVisible();
    await expect(initiationLink).toContainText(/Initiation \(10 Leçons\)|10-Lesson Initiation/);

    const openingsBtn = page.locator('[data-testid="sidebar-beginner-openings-btn"]');
    await expect(openingsBtn).toBeVisible();
    await expect(openingsBtn).toContainText(/Les 15 Ouvertures|15 Opening Moves/);

    const audioGuideBtn = page.locator('[data-testid="sidebar-beginner-audio-guide-btn"]');
    await expect(audioGuideBtn).toBeVisible();
    await expect(audioGuideBtn).toContainText(/Guide Audio|Audio Guide/);

    const mistakesLink = page.locator('[data-testid="sidebar-my-blunders-link"]');
    await expect(mistakesLink).toBeVisible();
    await expect(mistakesLink).toContainText(/Mes Erreurs|My Mistakes/);

    // Take screenshot of Beginner mode with clean single-line sidebar
    await page.screenshot({ path: 'test-results/beginner-sidebar-clean-proof.png' });

    // 4. Switch to Intermediate Gate and verify full training menu
    const interTab = page.locator('[data-testid="tier-gate-btn-intermediate"]').first();
    await interTab.click();
    await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-pillar-academy"]')).toBeVisible();
  });
});
