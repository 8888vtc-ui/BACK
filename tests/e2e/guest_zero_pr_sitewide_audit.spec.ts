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
      'Mode Invité • Match Amical en Ligne (Compte requis pour activer PR & Classement Elo)'
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

    // 4. Check /puzzles in Guest Mode: Écran de verrouillage officiel GuestFeatureLockView
    await page.goto('/puzzles?lang=fr', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('guest-feature-lock-view')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('unlock-personal-blunders-cta')).toContainText('SE CONNECTER / CRÉER MON COMPTE GRATUIT →');
    await expect(page.getByTestId('guest-return-play-btn')).toContainText('Retourner jouer une partie');

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

  test('3. Guest Mode on /play: Zero PR Match on table, no "Jou..." truncation, clean "Joueur Invité"', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=fr');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });
    await page.goto('/play?lang=fr', { waitUntil: 'domcontentloaded' });

    // Wait for the board & side rail to be visible
    const leftRail = page.getByTestId('board-left-player-rail');
    await expect(leftRail).toBeVisible({ timeout: 15000 });

    // 1. Verify Player Name: Clean "Joueur Invité" (no "Jou..." truncation)
    const playerName = page.getByTestId('left-rail-player-name');
    await expect(playerName).toBeVisible();
    await expect(playerName).toHaveText('Joueur Invité');
    const nameText = await playerName.innerText();
    expect(nameText).not.toBe('Jou...');

    // 2. Verify Zero "PR Match" badge for Guest in left rail
    const playerPrBadge = page.getByTestId('left-rail-player-pr');
    await expect(playerPrBadge).toBeHidden();

    // 3. Verify Zero "hud-player-x-pr" for Guest in HUD
    const hudPlayerXPr = page.getByTestId('hud-player-x-pr');
    await expect(hudPlayerXPr).toBeHidden();

    // 4. Verify no "PR Match" or "Match PR" anywhere on the board
    const railText = await leftRail.innerText();
    expect(railText).not.toContain('PR Match :');
    expect(railText).not.toContain('Match PR:');
    expect(railText).not.toContain('PR Moy.');

    // 5. Test EN translation: "Guest Player"
    await page.goto('/play?lang=en', { waitUntil: 'domcontentloaded' });
    await expect(leftRail).toBeVisible({ timeout: 15000 });
    await expect(playerName).toHaveText('Guest Player');
    await expect(playerPrBadge).toBeHidden();
  });

  test('4. Clause CGU §4 Modal: Accessible in 1-click from Réglages in left sidebar & GuestFeatureLockView with FR | EN toggle', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=fr');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });
    await page.goto('/?lang=fr');
    await page.waitForLoadState('domcontentloaded');

    // 1. Open from "Réglages" in left sidebar
    const sidebarSettingsBtn = page.getByTestId('sidebar-settings-btn');
    await expect(sidebarSettingsBtn).toBeVisible({ timeout: 15000 });
    const termsModal = page.getByTestId('terms-and-pr-policy-modal');
    await expect(async () => {
      await sidebarSettingsBtn.click();
      await expect(termsModal).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Verify Article 4 in French
    await expect(termsModal).toContainText('Article 4 — Attribution et Intégrité du Performance Rating');
    await expect(termsModal).toContainText('4.1 Exclusion stricte des sessions Invité');
    await expect(termsModal).toContainText('Un Joueur Invité peut uniquement jouer des parties');
    await expect(termsModal).toContainText("L'attribution d'un PR, d'un Elo, l'accès aux Quiz et l'historique des Blunders exigent un compte connecté");

    // 2. Toggle FR | EN
    const localeToggleBtn = page.getByTestId('terms-modal-locale-toggle');
    await expect(localeToggleBtn).toBeVisible();
    await localeToggleBtn.click();

    // Verify Section 4 in English
    await expect(termsModal).toContainText('Section 4 — Attribution & Integrity of Performance Rating');
    await expect(termsModal).toContainText('4.1 Strict Exclusion of Guest Sessions');
    await expect(termsModal).toContainText('A Guest Player can only play games');
    await expect(termsModal).toContainText('Holding a PR, an Elo rating, Quiz access, and Blunder history strictly require a connected account');

    // Close modal
    await page.getByTestId('close-terms-modal-btn').click();
    await expect(termsModal).toBeHidden();

    // 3. Open from GuestFeatureLockView on /puzzles
    await page.goto('/puzzles?lang=fr');
    const lockView = page.getByTestId('guest-feature-lock-view');
    await expect(lockView).toBeVisible({ timeout: 15000 });

    const openTermsBtn = page.getByTestId('guest-lock-open-terms-btn');
    await expect(openTermsBtn).toBeVisible();
    await expect(async () => {
      await openTermsBtn.click();
      await expect(termsModal).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    // Modal opens directly in 1 click from GuestFeatureLockView
    await expect(termsModal).toContainText('Article 4 — Attribution et Intégrité du Performance Rating');
    await page.getByTestId('terms-modal-understood-btn').click();
    await expect(termsModal).toBeHidden();
  });
});
