/**
 * @file tests/e2e/beginner_academy_real_animated_video.spec.ts
 * @description Test E2E du vrai lecteur vidéo animé cinématique de l'Académie Débutant
 * sur /puzzles?mode=beginner-academy (0 fake textuel, plateau SVG animé 16:9, 5 épisodes).
 * Strictement <= 150 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Académie Débutant — Vrai Lecteur Vidéo Animé & Zéro Fake Textuel', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
      window.localStorage.setItem('bgt_active_difficulty', 'beginner');
      window.localStorage.setItem('NEXT_LOCALE', 'fr');
      window.localStorage.setItem('i18nextLng', 'fr');
    });
  });

  test('Vérification du plateau SVG animé, des 5 épisodes et éradication de "Flèches ciblées"', async ({ page }) => {
    await page.goto('/puzzles?mode=beginner-academy');
    await page.waitForLoadState('domcontentloaded');

    // 1. Vérifier la présence du lecteur vidéo
    const player = page.getByTestId('academy-video-player');
    await expect(player).toBeVisible({ timeout: 10000 });

    // 2. Éradication absolue de "Flèches ciblées"
    const fakeTextLocator = page.locator('text=Flèches ciblées');
    await expect(fakeTextLocator).toHaveCount(0);
    const fakeEnTextLocator = page.locator('text=Target points:');
    await expect(fakeEnTextLocator).toHaveCount(0);

    // 3. Présence et dimensions du plateau SVG animé
    const svgBoard = page.getByTestId('academy-animated-board-svg');
    await expect(svgBoard).toBeVisible();
    const box = await svgBoard.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(300);
      expect(box.height).toBeGreaterThanOrEqual(160);
    }

    // 4. Test des 5 épisodes
    for (let epId = 1; epId <= 5; epId++) {
      const tab = page.getByTestId(`academy-episode-tab-${epId}`);
      await expect(tab).toBeVisible();
      await tab.click();
      await page.waitForTimeout(150);

      // Le plateau SVG doit toujours être présent et actif
      await expect(svgBoard).toBeVisible();
    }

    // 5. Test de la barre de progression interactive
    const progressBar = page.getByTestId('academy-video-progress');
    await expect(progressBar).toBeVisible();

    // 6. Test du toggle Play / Pause
    const playBtn = page.getByTestId('video-play-toggle-btn');
    await expect(playBtn).toBeVisible();
    await playBtn.click(); // Pause
    await page.waitForTimeout(200);
    await playBtn.click(); // Play

    // 7. Navigation vers les quiz d'initiation
    const quizBtn = page.getByTestId('video-launch-quizzes-btn');
    await expect(quizBtn).toBeVisible();
    await quizBtn.click();

    // Vérifier l'arrivée sur l'écran des quiz d'initiation avec VRAI plateau visuel
    const quizContainer = page.getByTestId('academy-quiz-container');
    await expect(quizContainer).toBeVisible({ timeout: 10000 });
    const visualLessonBoard = page.getByTestId('academy-visual-board-lesson');
    await expect(visualLessonBoard).toBeVisible();
    const optionA = page.getByTestId('academy-option-A');
    await expect(optionA).toBeVisible();
  });
});
