/**
 * @file tests/e2e/guest_quiz_and_progression_lock_audit.spec.ts
 * @description Banc d'essai Playwright E2E — Mission 2/25 :
 * Vérifie le verrouillage total des 50 000 Quiz (/puzzles, /drills, /daily-puzzle)
 * et de la page /progression pour un Joueur Invité.
 * Strictement <= 200 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Mission 2/25 : Verrouillage Total des Quiz & Progression aux Invités', () => {
    test.setTimeout(90000);

    const routesToTest = [
        { path: '/puzzles?lang=fr', name: '/puzzles' },
        { path: '/drills?lang=fr', name: '/drills' },
        { path: '/daily-puzzle?lang=fr', name: '/daily-puzzle' },
        { path: '/progression?lang=fr', name: '/progression' },
    ];

    for (const route of routesToTest) {
        test(`Un Invité sur ${route.name} voit strictement l'écran de verrouillage officiel GuestFeatureLockView`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });

            // Nettoyage complet pour garantir l'état Invité strict
            await page.goto('/?lang=fr');
            await page.evaluate(() => {
                window.localStorage.clear();
                window.localStorage.setItem('bg_is_guest', 'true');
                window.localStorage.setItem('bgtour_locale', 'fr');
                window.localStorage.setItem('bg_locale', 'fr');
            });

            // Navigation vers la route protégée
            await page.goto(route.path, { waitUntil: 'domcontentloaded' });

            // Vérification de la présence de l'écran verrouillé GuestFeatureLockView
            const lockView = page.getByTestId('guest-feature-lock-view');
            await expect(lockView).toBeVisible({ timeout: 15000 });

            // Vérification du bouton principal Or #D4AF37
            const unlockBtn = page.getByTestId('unlock-personal-blunders-cta');
            await expect(unlockBtn).toBeVisible();
            await expect(unlockBtn).toContainText('SE CONNECTER / CRÉER MON COMPTE GRATUIT →');

            // Vérification du bouton secondaire retour au jeu
            const returnPlayBtn = page.getByTestId('guest-return-play-btn');
            await expect(returnPlayBtn).toBeVisible();
            await expect(returnPlayBtn).toContainText('Retourner jouer une partie');

            // Vérification qu'aucun dé ni bouton de quiz n'est affiché
            const diceRollBtn = page.locator('button:has-text("LANCER LES DÉS")');
            await expect(diceRollBtn).toHaveCount(0);

            // Clic sur "Retourner jouer une partie"
            await returnPlayBtn.click();
            await expect(page).toHaveURL(/\/(?:|\?.*)$/);
        });
    }

    test('Bilinguisme EN : Un Invité sur /puzzles?lang=en voit l\'écran verrouillé en anglais', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        await page.goto('/?lang=en');
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bg_is_guest', 'true');
            window.localStorage.setItem('bgtour_locale', 'en');
            window.localStorage.setItem('bg_locale', 'en');
        });

        await page.goto('/puzzles?lang=en', { waitUntil: 'domcontentloaded' });

        const lockView = page.getByTestId('guest-feature-lock-view');
        await expect(lockView).toBeVisible({ timeout: 15000 });

        const unlockBtn = page.getByTestId('unlock-personal-blunders-cta');
        await expect(unlockBtn).toContainText('SIGN IN / CREATE MY FREE ACCOUNT →');

        const returnPlayBtn = page.getByTestId('guest-return-play-btn');
        await expect(returnPlayBtn).toContainText('Back to Game Lobby');
    });
});
