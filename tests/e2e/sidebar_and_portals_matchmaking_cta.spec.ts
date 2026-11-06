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

    // 4. Switch to Intermediate Gate and verify full training menu, zero fake counter, zero Franglais, and zero scroll (FR & EN)
    const interTab = page.locator('[data-testid="tier-gate-btn-intermediate"]').first();
    await interTab.click();
    await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-pillar-academy"]')).toBeVisible();

    // Verify zero fake online counter in sidebar (no digits inside sidebar-find-player-btn)
    const findPlayerText = (await findPlayerBtn.innerText()).trim();
    expect(findPlayerText).not.toMatch(/\d+/);
    expect(findPlayerText).not.toMatch(/online|en ligne/i);

    // Verify only 1 Invite button in sidebar
    const sidebarText = await sidebar.innerText();
    const inviteMatches = sidebarText.match(/Inviter|Invite/gi) ?? [];
    expect(inviteMatches.length).toBe(1);

    // Verify Intermediate Portal alignment & zero vertical scroll in FR
    const navbar = page.locator('[data-testid="app-navbar"]');
    const localeBtn = page.locator('[data-testid="navbar-locale-toggle-btn"]');
    const currentNavbarText = await navbar.innerText();
    if (currentNavbarText.includes('Beginner')) {
      await localeBtn.click();
    }

    await expect(navbar).toContainText('Débutant');
    await expect(navbar).toContainText('Intermédiaire');
    await expect(navbar).toContainText('Expert / Pro');
    await expect(navbar).toContainText('Joueur Invité');
    await expect(navbar).toContainText('Connexion');
    await expect(page.locator('[data-testid="intermediate-matchmaking-badge"]')).toContainText('● Matchmaking Direct');

    const scrollHeightFr = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeightFr).toBeLessThanOrEqual(900);

    // Switch to EN and verify zero Franglais + zero vertical scroll in EN
    await localeBtn.click();
    await expect(navbar).toContainText('Beginner');
    await expect(navbar).toContainText('Intermediate');
    await expect(navbar).toContainText('Expert / Pro');
    await expect(navbar).toContainText('10,000 PTS');
    await expect(navbar).toContainText('Guest Player');
    await expect(navbar).toContainText('Sign In');
    await expect(navbar).not.toContainText('Débutant');
    await expect(navbar).not.toContainText('Joueur Invité');
    await expect(page.locator('[data-testid="intermediate-matchmaking-badge"]')).toContainText('● Live Matchmaking');

    const scrollHeightEn = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeightEn).toBeLessThanOrEqual(900);
  });

  test('/analysis displays AppNavbar, LobbyLeftSidebar, 3-step guided flow, plain-language win %, gold arrows, 0 emojis, and 0 vertical scroll in FR & EN', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/analysis?lang=fr');

    await expect(page.locator('[data-testid="app-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="lobby-left-sidebar"]')).toBeVisible();

    const root = page.locator('[data-testid="analysis-studio-root"]');
    await expect(root).toContainText('1. Choisissez ou modifiez la position');
    await expect(root).toContainText('2. Choisissez les Dés & le Format');
    await expect(root).toContainText('3. Meilleurs Coups & Explication du Coach');
    await expect(root).toContainText('58.2 % de victoire');
    await expect(root).toContainText('Meilleur coup');

    // Verify zero emojis in /analysis DOM
    const bodyTextFr = await root.innerText();
    expect(bodyTextFr).not.toMatch(/📸|🗑️|🧹|✨|🔄|🏠|💡|🎮/);

    // Verify gold arrow (#D4AF37) for #1 and sky arrow (#38BDF8) when clicking #2
    const firstArrowCircle = page.locator('[data-testid="coach-ghost-checker-optimal-0"]');
    await expect(firstArrowCircle).toHaveAttribute('stroke', '#D4AF37');
    await page.locator('[data-testid="analysis-move-row-1"]').click();
    await expect(firstArrowCircle).toHaveAttribute('stroke', '#38BDF8');

    // Verify zero vertical scroll in FR
    const scrollHeightFr = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeightFr).toBeLessThanOrEqual(900);

    // Switch to EN via navbar toggle
    await page.locator('[data-testid="navbar-locale-toggle-btn"]').click();
    await expect(root).toContainText('1. Choose or edit the position');
    await expect(root).toContainText('2. Choose Dice & Format');
    await expect(root).toContainText('3. Best Moves & Coach Explanation');
    await expect(root).toContainText('58.2% win');
    await expect(root).toContainText('Best Move');

    const scrollHeightEn = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(scrollHeightEn).toBeLessThanOrEqual(900);
  });
});
