import { test, expect } from '@playwright/test';

test.describe('Day 08 E2E: Personal Blunders Guest Lock & Connected Memory Resolution', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('1. Mode Invité sur /puzzles?filter=personal-blunders : Verrouillage total par GuestFeatureLockView, 0 faux quiz et 0 Rating 1500', async ({ page }) => {
    await page.goto('/puzzles?filter=personal-blunders');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.localStorage.setItem('bgtour_locale', 'fr');
      window.localStorage.setItem('bg_locale', 'fr');
    });
    await page.goto('/puzzles?filter=personal-blunders');
    await page.waitForLoadState('domcontentloaded');

    // 1. Écran de verrouillage officiel GuestFeatureLockView
    const lockView = page.getByTestId('guest-feature-lock-view');
    await expect(lockView).toBeVisible({ timeout: 15000 });

    // 2. Bouton CTA plein or pour s'inscrire / se connecter
    const unlockCta = page.getByTestId('unlock-personal-blunders-cta');
    await expect(unlockCta).toBeVisible();
    await expect(unlockCta).toContainText('SE CONNECTER / CRÉER MON COMPTE GRATUIT →');

    // 3. Zéro quiz cliquable ou choix de coup pour un invité
    await expect(page.getByTestId('personal-blunder-choices-grid')).toHaveCount(0);
    await expect(page.getByTestId('quiz-choice-btn-A')).toHaveCount(0);

    // 4. Zéro mention d'un faux Rating 1500 ou de faux blunders
    const pageText = await page.locator('body').innerText();
    expect(pageText).not.toContain('Rating : 1500');
    expect(pageText).not.toContain('Issu de ton match');
  });

  test('2. Mode Connecté sur /puzzles?filter=personal-blunders : Carte Souvenir du Match, Résolution du coup optimal et transition vers Résolus', async ({ page }) => {
    await page.goto('/puzzles?filter=personal-blunders');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
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
    });
    await page.goto('/puzzles?filter=personal-blunders');
    await page.waitForLoadState('domcontentloaded');

    // 1. Vérification de l'état initial : bouton pour charger les 3 blunders de match de démo
    const seedBtn = page.getByTestId('seed-demo-personal-blunders-btn');
    await expect(seedBtn).toBeVisible({ timeout: 15000 });
    await expect(seedBtn).toContainText('Charger 3 Blunders de Matchs (Exemples Compte Connecté)');
    await seedBtn.click();

    // 2. Carte Souvenir du Match (Date, Adversaire, Format, Score, Tour, Perte de chances)
    const matchBanner = page.getByTestId('personal-blunder-match-banner');
    await expect(matchBanner).toBeVisible({ timeout: 10000 });

    const dateSpan = page.getByTestId('blunder-match-date');
    await expect(dateSpan).toBeVisible();
    await expect(dateSpan).toContainText('2026');

    const opponentSpan = page.getByTestId('blunder-match-opponent');
    await expect(opponentSpan).toBeVisible();
    await expect(opponentSpan).toContainText('Contre Kosta_Ath (1584 Elo)');

    const scoreTurnSpan = page.getByTestId('blunder-match-score-turn');
    await expect(scoreTurnSpan).toBeVisible();
    await expect(scoreTurnSpan).toContainText('Match en 5 pts (Score : 2 - 3) • Tour #12');

    const lossPctSpan = page.getByTestId('blunder-match-loss-pct');
    await expect(lossPctSpan).toBeVisible();
    await expect(lossPctSpan).toContainText('Perte :');

    // 3. Vérification des onglets de statut : À corriger (3) et Résolus (0)
    const pendingTab = page.getByTestId('personal-blunders-tab-pending');
    const resolvedTab = page.getByTestId('personal-blunders-tab-resolved');
    await expect(pendingTab).toContainText('À corriger (3)');
    await expect(resolvedTab).toContainText('Résolus (0)');

    const statusBadge = page.getByTestId('blunder-status-badge');
    await expect(statusBadge).toContainText('À corriger');

    // 4. Avant le clic : la solution et le comparatif ne sont PAS affichés
    await expect(page.getByTestId('personal-blunder-comparative-panel')).toHaveCount(0);

    // 5. Clic sur le coup optimal (#1 : "24/20 13/8" sur le choix A)
    const choiceA = page.getByTestId('quiz-choice-btn-A');
    await expect(choiceA).toBeVisible();
    await choiceA.click();

    // 6. Affichage côte à côte : Erreur jouée en match vs Solution 3-Ply
    const compPanel = page.getByTestId('personal-blunder-comparative-panel');
    await expect(compPanel).toBeVisible({ timeout: 10000 });

    const playedCard = page.getByTestId('comparative-played-move-card');
    await expect(playedCard).toBeVisible();
    await expect(playedCard).toContainText('Ton Coup en Match : 24/15');
    await expect(playedCard).toContainText('Pourquoi c’était une erreur :');

    const optimalCard = page.getByTestId('comparative-optimal-move-card');
    await expect(optimalCard).toBeVisible();
    await expect(optimalCard).toContainText('La Solution 3-Ply : 24/20 13/8');
    await expect(optimalCard).toContainText('Pourquoi ce coup gagne :');

    // 7. Transition de statut : le blunder passe à "✓ Résolu"
    await expect(statusBadge).toContainText('✓ Résolu');
    await expect(pendingTab).toContainText('À corriger (2)');
    await expect(resolvedTab).toContainText('Résolus (1)');

    // 8. Clic sur l'onglet Résolus (1) : le blunder résolu reste accessible
    await resolvedTab.click();
    await expect(page.getByTestId('personal-blunder-select-0')).toBeVisible();
    await expect(statusBadge).toContainText('✓ Résolu');
  });
});

