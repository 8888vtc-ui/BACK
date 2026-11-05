/**
 * @file tests/e2e/academy_3gates_distinct_and_clean.spec.ts
 * @description Test E2E de la différenciation stricte des 3 Portes sur /academy :
 * Débutant (2 studios sur plateau), Intermédiaire (3 ateliers Club) et Expert (Cap 6.0 / ERA / Kazaross).
 * Strictement <= 120 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Académie — Différenciation Totale des 3 Niveaux & Zéro Doublon', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
      window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
      window.localStorage.setItem('NEXT_LOCALE', 'fr');
      window.localStorage.setItem('i18nextLng', 'fr');
    });
  });

  test('Vérification des 3 Vues Distinctes Débutant, Intermédiaire, Expert sur /academy', async ({ page }) => {
    await page.goto('/academy');
    await page.waitForLoadState('domcontentloaded');

    // ================= 1. VUE DÉBUTANT =================
    const beginnerBtn = page.getByTestId('tier-gate-btn-beginner').first();
    await expect(beginnerBtn).toBeVisible({ timeout: 10000 });
    await beginnerBtn.click();
    await page.waitForTimeout(250);

    // Vérifier la présence des 2 studios sur plateau
    await expect(page.getByTestId('academy-beginner-view')).toBeVisible();
    await expect(page.getByTestId('beginner-rules-studio')).toBeVisible();
    await expect(page.getByTestId('beginner-openings-studio')).toBeVisible();

    // Vérifier 0 occurrence des termes experts / robots
    const textBeginner = await page.locator('body').innerText();
    expect(textBeginner).not.toMatch(/Kazaross|Keith Count|BT-Core|Goliath/i);

    // ================= 2. VUE INTERMÉDIAIRE =================
    const intermediateBtn = page.getByTestId('tier-gate-btn-intermediate').first();
    await expect(intermediateBtn).toBeVisible();
    await intermediateBtn.click();
    await page.waitForTimeout(250);

    // Vérifier les 3 ateliers de club
    await expect(page.getByTestId('academy-intermediate-view')).toBeVisible();
    await expect(page.getByTestId('intermediate-cube-workshop')).toBeVisible();
    await expect(page.getByTestId('intermediate-race-workshop')).toBeVisible();
    await expect(page.getByTestId('intermediate-shots-workshop')).toBeVisible();

    // Tester l'interaction du défi de course sans pips
    const raceRunBtn = page.getByTestId('race-run-btn');
    await expect(raceRunBtn).toBeVisible();
    await raceRunBtn.click();
    await expect(page.locator('text=Blancs 108 · Noirs 122')).toBeVisible();

    // 0 occurrence du calculateur Kazaross
    const textIntermediate = await page.locator('body').innerText();
    expect(textIntermediate).not.toMatch(/Kazaross|BT-Core|Goliath/i);

    // ================= 3. VUE EXPERT / PRO =================
    const expertBtn = page.getByTestId('tier-gate-btn-expert').first();
    await expect(expertBtn).toBeVisible();
    await expertBtn.click();
    await page.waitForTimeout(250);

    // Vérifier Cap 6.0, Kazaross et concepts
    await expect(page.getByTestId('academy-expert-view')).toBeVisible();
    await expect(page.getByTestId('expert-cap6-era-card')).toBeVisible();
    await expect(page.getByTestId('expert-kazaross-section')).toBeVisible();
    await expect(page.getByTestId('expert-concepts-section')).toBeVisible();

    // 0 occurrence des anciens robots bannis ou rouleaux
    const textExpert = await page.locator('body').innerText();
    expect(textExpert).not.toMatch(/BT-Core|Goliath|rouleaux d'ouverture/i);

    // ================= 4. HEADER PTS VISIBLE =================
    const ptsBadge = page.getByTestId('navbar-points-badge');
    await expect(ptsBadge).toBeVisible();
    await expect(ptsBadge).toContainText(/10\s*000\s*PTS/i);
  });
});

