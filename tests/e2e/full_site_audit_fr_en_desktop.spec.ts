import { test, expect } from '@playwright/test';

test.describe('Full Site Audit — FR & EN Sync, 1-Line Sidebar, Zero Franglais & Zero Scroll (1440x900)', () => {
  test.setTimeout(120_000);
  test('Audits /, Portals 1/2/3, /tournaments, /academy, /puzzles, and /analysis in FR and EN at 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });

    // =========================================================================
    // 1. HOME (/) — PORTES 1, 2 & 3 EN FR PUIS EN EN
    // =========================================================================
    await page.goto('/');

    const navbar = page.locator('[data-testid="app-navbar"]');
    const sidebar = page.locator('[data-testid="lobby-left-sidebar"]');
    await expect(navbar).toBeVisible();
    await expect(sidebar).toBeVisible();

    // Vérification Zéro Franglais en FR dans le Header
    await expect(navbar).toContainText('Débutant');
    await expect(navbar).toContainText('Intermédiaire');
    await expect(navbar).toContainText('Expert / Pro');
    await expect(navbar).toContainText('Joueur Invité');
    await expect(navbar).toContainText('Connexion');
    const navTextFr = await navbar.innerText();
    expect(navTextFr).not.toContain('Install App');
    expect(navTextFr).not.toContain('Sign In');

    // Vérification Bouton "Trouver un joueur" sur 1 seule ligne (height <= 42px) & 1 seul bouton Invite
    const findPlayerBtn = page.locator('[data-testid="sidebar-find-player-btn"]');
    await expect(findPlayerBtn).toBeVisible();
    const boxFr = await findPlayerBtn.boundingBox();
    expect(boxFr).not.toBeNull();
    expect(boxFr!.height).toBeLessThanOrEqual(42);
    await expect(sidebar.locator('[data-testid="sidebar-invite-friend-btn"]')).toHaveCount(1);
    const sidebarTextFr = await sidebar.innerText();
    expect(sidebarTextFr).not.toContain('Inviter des amis');

    // Porte 1 (Débutant) — Zéro Scroll 1440x900
    await page.locator('[data-testid="tier-gate-btn-beginner"]').first().click();
    await expect(page.locator('[data-testid="beginner-home-portal"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-guided-play-btn"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    // Porte 2 (Intermédiaire) — Zéro Scroll 1440x900 en FR
    await page.locator('[data-testid="tier-gate-btn-intermediate"]').first().click();
    await expect(page.locator('[data-testid="intermediate-home-portal"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    // Bascule en EN sur la Porte 2
    const localeToggle = page.locator('[data-testid="navbar-locale-toggle-btn"]');
    await localeToggle.click();

    await expect(navbar).toContainText('Beginner');
    await expect(navbar).toContainText('Intermediate');
    await expect(navbar).toContainText('Expert / Pro');
    await expect(navbar).toContainText('Guest Player');
    await expect(navbar).toContainText('Sign In');
    const navTextEn = await navbar.innerText();
    expect(navTextEn).not.toContain('Débutant');
    expect(navTextEn).not.toContain('Intermédiaire');
    expect(navTextEn).not.toContain('Joueur Invité');

    // Bouton "Find a Player" en EN strictement sur 1 seule ligne (height <= 42px)
    await expect(findPlayerBtn).toContainText('Find a Player');
    const boxEn = await findPlayerBtn.boundingBox();
    expect(boxEn).not.toBeNull();
    expect(boxEn!.height).toBeLessThanOrEqual(42);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    await page.screenshot({ path: 'test-results/audit-portal-2-intermediate-en.png' });

    // Porte 3 (Expert / Pro) — Zéro Scroll 1440x900 en EN puis FR
    await page.locator('[data-testid="tier-gate-btn-expert"]').first().click();
    await expect(page.locator('[data-testid="expert-home-portal"]')).toBeVisible();
    await expect(page.locator('[data-testid="expert-play-btn"]')).toContainText('FIND AN OPPONENT (OFFICIAL MATCH)');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    await localeToggle.click(); // Retour FR
    await expect(page.locator('[data-testid="expert-play-btn"]')).toContainText('TROUVER UN ADVERSAIRE (MATCH OFFICIEL)');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    // =========================================================================
    // 2. /TOURNAMENTS — SIDEBAR, FR/EN & ZÉRO SCROLL
    // =========================================================================
    await page.goto('/tournaments');
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-testid="tournament-world-hub-view"]')).toContainText('CARTE MONDIALE DES CLUBS & TOURNOIS');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);

    await localeToggle.click(); // EN
    await expect(page.locator('[data-testid="tournament-world-hub-view"]')).toContainText('WORLD MAP OF CLUBS & TOURNAMENTS');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    await localeToggle.click(); // FR

    // =========================================================================
    // 3. /ACADEMY — SIDEBAR & FR/EN
    // =========================================================================
    await page.goto('/academy');
    await expect(sidebar).toBeVisible();
    await page.locator('[data-testid="tier-gate-btn-intermediate"]').first().click();
    await expect(page.locator('[data-testid="academy-intermediate-view"]')).toContainText('Maîtrise Tactique de Club & Tournoi');
    await localeToggle.click(); // EN
    await expect(page.locator('[data-testid="academy-intermediate-view"]')).toContainText('Tournament & Club Tactical Masterclass');
    await localeToggle.click(); // FR

    // =========================================================================
    // 4. /PUZZLES — SIDEBAR, FR/EN & ZÉRO SCROLL
    // =========================================================================
    await page.goto('/puzzles', { waitUntil: 'networkidle' });
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-testid="drill-mode-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="drill-back-btn"]')).toContainText('Retour');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    await localeToggle.click(); // EN
    await expect(page.locator('[data-testid="drill-back-btn"]')).toContainText('Back');
    await localeToggle.click(); // FR

    // =========================================================================
    // 5. /ANALYSIS — SIDEBAR, FR/EN & ZÉRO SCROLL
    // =========================================================================
    await page.goto('/analysis', { waitUntil: 'networkidle' });
    await expect(sidebar).toBeVisible();
    await expect(page.locator('[data-testid="analysis-studio-root"]')).toContainText("Studio d'Analyse 3-Ply");
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
    await localeToggle.click(); // EN
    await expect(page.locator('[data-testid="analysis-studio-root"]')).toContainText('3-Ply Analysis Studio');
    await expect(page.locator('[data-testid="run-analysis-btn"]')).toContainText('ANALYZE POSITION IN 3-PLY');
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(900);
  });
});

