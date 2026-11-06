import { test, expect } from '@playwright/test';

test.describe('Sitewide Audit: Zero PR/Elo for Guests & Official Terms Clause 4', () => {
  test.setTimeout(120000);

  test('1. Guest Mode: Matchmaking modal, Portes 1/2/3, /puzzles, /analysis, /tournaments have zero PR/Elo for guests & Clause 4 modal opens in FR/EN', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=fr');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });
    await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('lobby-auth-status')).toBeVisible({ timeout: 15000 });

    // 1. Open Matchmaking / Private Room Modal from Sidebar "Trouver un joueur"
    const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
    await expect(findPlayerBtn).toBeVisible({ timeout: 15000 });
    await findPlayerBtn.click();

    const lobbyModal = page.getByTestId('multiplayer-lobby-modal');
    await expect(lobbyModal).toBeVisible({ timeout: 10000 });

    const modalText = await lobbyModal.innerText();
    // Strictly forbidden in Guest mode
    expect(modalText).not.toContain('7.25');
    expect(modalText).not.toContain('1500 Elo');
    expect(modalText).not.toContain('Compétiteur');
    expect(modalText).not.toContain('Classé Elo');
    expect(modalText).not.toMatch(/[🎯♟️⚡🔑🚪]/u);

    // Must display official Guest lock message & friendly match notice
    await expect(page.getByTestId('lobby-guest-pr-locked-badge')).toContainText(
      'Mode Invité • PR & Classement Elo désactivés (Compte requis)'
    );
    await expect(lobbyModal).toContainText('Match Amical en Ligne');
    await expect(page.getByTestId('lobby-guest-sign-in-cta')).toContainText(
      'Se connecter pour activer mon PR →'
    );

    // Open Clause CGU §4 directly from the Matchmaking Modal
    await page.getByTestId('lobby-open-terms-clause-btn').click();
    const termsModal = page.getByTestId('terms-and-pr-policy-modal');
    await expect(termsModal).toBeVisible();
    await expect(termsModal).toContainText(
      'Article 4 — Attribution et Intégrité du Performance Rating (ER / PR) & du Classement Elo'
    );
    await expect(termsModal).toContainText('4.1 Exclusion stricte des sessions Invité');
    await expect(termsModal).toContainText('4.2 Activation sur Compte Personnel');
    await expect(termsModal).toContainText('4.3 Calcul certifié Open Sage 3-Ply');

    // Close Terms Modal & Lobby Modal
    await page.getByTestId('close-terms-modal-btn').click();
    await expect(termsModal).toBeHidden();
    await page.getByTestId('close-lobby-button').click();
    await expect(lobbyModal).toBeHidden();

    // 2. Check Porte 3 (Expert / Pro) in Guest Mode
    await page.getByTestId('tier-gate-btn-expert').first().click();
    await expect(page.getByTestId('expert-er-pr')).toHaveText('Verrouillé');
    await expect(page.getByTestId('expert-rating')).toHaveText('—');
    await expect(page.getByTestId('pr-global-val')).toHaveText('—');
    await expect(page.getByTestId('pr-checker-val')).toHaveText('—');
    await expect(page.getByTestId('pr-cube-val')).toHaveText('—');
    const expertPortalText = await page.getByTestId('expert-home-portal').innerText();
    expect(expertPortalText).not.toContain('6.3');
    expect(expertPortalText).not.toContain('4.2');
    expect(expertPortalText).not.toContain('8.1');
    expect(expertPortalText).not.toContain('1500');

    // 3. Check Sidebar CGU & Règlement PR button in EN
    await page.getByTestId('navbar-locale-toggle-btn').click();
    const sidebarTermsBtn = page.getByTestId('sidebar-terms-pr-policy-btn');
    await expect(sidebarTermsBtn).toContainText('ToS & PR Policy');
    await sidebarTermsBtn.click();
    await expect(termsModal).toBeVisible();
    await expect(termsModal).toContainText(
      'Section 4 — Attribution & Integrity of Performance Rating (ER / PR) & Elo Rating'
    );
    await expect(termsModal).toContainText('4.1 Strict Exclusion of Guest Sessions');
    await page.getByTestId('close-terms-modal-btn').click();

    // Switch back to FR
    await page.getByTestId('navbar-locale-toggle-btn').click();

    // 4. Check /puzzles in Guest Mode: PR Verrouillé & Elo Compte requis
    await page.goto('/puzzles?lang=fr', { waitUntil: 'domcontentloaded' });
    const drillHeader = page.getByTestId('quiz-live-rating-badge');
    await expect(drillHeader).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('quiz-target-metric-badge')).toContainText('PR Verrouillé');
    await expect(page.getByTestId('quiz-elo-rating-badge')).toContainText('Compte requis');

    // 5. Check /analysis and /tournaments in Guest Mode: no "PR 7.25" or "1500 Elo" attributed to Guest
    for (const route of ['/analysis?lang=fr', '/tournaments?lang=fr']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const navbarText = await page.getByTestId('app-navbar').innerText();
      expect(navbarText).not.toContain('7.25');
      expect(navbarText).not.toContain('1500 Elo');
    }
  });

  test('2. Registered Account Mode: PR & Elo tracking activate properly when signed in', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=fr');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
      window.localStorage.setItem(
        'bg_player_passport_v1',
        JSON.stringify({
          pseudo: 'Alexandre M.',
          email: 'alexandre@club-montecarlo.mc',
          countryCode: 'MC',
          countryName: 'Monaco',
          createdAtIso: new Date().toISOString(),
        })
      );
      window.localStorage.setItem(
        'bg_user_code_registry_v1',
        JSON.stringify({
          version: 1,
          activeCode: 'BG-ALEX01',
          profiles: {
            'BG-ALEX01': {
              userCode: 'BG-ALEX01',
              username: 'Alexandre M.',
              email: 'alexandre@club-montecarlo.mc',
              authProvider: 'email_code',
              eloRating: 1620,
              averagePr: 4.8,
              gamesPlayed: 5,
              gamesWon: 4,
              createdAt: Date.now(),
              lastSeenAt: Date.now(),
            },
          },
        })
      );
    });
    await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('lobby-auth-status')).toBeVisible({ timeout: 15000 });

    // Open Matchmaking Modal: since signed in, ranked Elo & PR are active
    await page.getByTestId('sidebar-find-player-btn').click();
    const lobbyModal = page.getByTestId('multiplayer-lobby-modal');
    await expect(lobbyModal).toBeVisible();
    await expect(page.getByTestId('lobby-authenticated-stats-row')).toBeVisible();
    await expect(lobbyModal).toContainText('Classé Elo');
  });
});
