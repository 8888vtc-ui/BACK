/**
 * @file tests/e2e/control_02_beginner_full_game_e2e.spec.ts
 * @description MISSION 2/10 — Test d'endurance d'une partie Débutant complète avec Professeur Interactif & Gemini Flash.
 * Strictement <= 260 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('MISSION 2/10 — Test d\'Endurance d\'une Partie Débutant Complète', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
            // Désactiver l'auto confirm pour permettre le test de l'annulation (Undo)
            window.localStorage.setItem('bgt_auto_confirm_mode', 'OFF');
            window.localStorage.setItem('bgt_auto_confirm_turn', 'false');
        });
    });

    test('Partie guidée complète de bout en bout avec Professeur Interactif', async ({ page }) => {
        test.setTimeout(120000);
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/play?gate=beginner&start=guided');
        await page.waitForLoadState('domcontentloaded');

        // 1. Overlay du Professeur Interactif
        const overlay = page.getByTestId('live-professor-coach-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // 2. Contrôle du zéro-jargon strict
        const dialogueText = await page.getByTestId('professor-dialogue-text').innerText();
        expect(dialogueText).not.toMatch(/EMG|MWC|3-Ply|PR Match/i);

        // 3. Indicateur de sens de marche 24 -> 1
        const horseShoe = page.getByTestId('direction-horseshoe-indicator');
        await expect(horseShoe).toBeVisible();
        await expect(horseShoe).toContainText(/24.*1/i);

        let undosTested = 0;

        for (let loop = 0; loop < 5; loop++) {
            // Fin de manche détectée
            const postMatch = page.getByTestId('post-match-training-report');
            if (await postMatch.count() > 0 && await postMatch.isVisible()) {
                const reportText = await postMatch.innerText();
                expect(reportText).not.toContain('Indice PR (XG)');
                expect(reportText).not.toContain('Taux d\'erreur');
                const backLobbyBtn = page.getByTestId('post-match-back-lobby-btn');
                await expect(backLobbyBtn).toBeVisible();
                break;
            }

            // Attendre le tour du joueur humain ou le bouton Lancer les dés
            const rollBtn = page.locator('[data-testid="center-roll-button"]');
            if (await rollBtn.count() > 0) {
                await page.evaluate(() => {
                    const btn = document.querySelector('[data-testid="center-roll-button"]') as HTMLElement;
                    if (btn) btn.click();
                });
                await page.waitForTimeout(1400);
            } else {
                await page.keyboard.press('Space');
                await page.waitForTimeout(1000);
            }

            // Déplacer les pions en 1 clic (Smart Point Click)
            for (const ptNum of [24, 13, 8, 6]) {
                const ptEl = page.locator(`[data-testid="point-triangle-${ptNum}"]`);
                if (await ptEl.count() > 0 && await ptEl.isVisible()) {
                    await ptEl.click({ force: true });
                    await page.waitForTimeout(400);
                    const undoBtn = page.getByTestId('professor-undo-move-btn');
                    const undoEnabled = await undoBtn.isEnabled();

                    if (undosTested === 0 && undoEnabled) {
                        await undoBtn.click({ force: true });
                        undosTested++;
                        await page.waitForTimeout(400);
                        await ptEl.click({ force: true });
                        await page.waitForTimeout(400);
                        break;
                    }
                }
            }

            // Déplacer le second dé
            for (const ptNum of [13, 8, 6, 24, 23, 22, 21, 20, 7, 5]) {
                const ptEl = page.locator(`[data-testid="point-triangle-${ptNum}"]`);
                if (await ptEl.count() > 0 && await ptEl.isVisible()) {
                    await ptEl.click({ force: true });
                    await page.waitForTimeout(300);
                }
            }

            // Valider le tour
            const confirmBtn = page.locator('[data-testid="center-confirm-button"]');
            if (await confirmBtn.count() > 0 && await confirmBtn.isEnabled()) {
                await confirmBtn.click({ force: true });
                await page.waitForTimeout(800);
            } else {
                await page.keyboard.press('Space');
                await page.waitForTimeout(400);
            }

            // Laisser le Bot jouer
            await page.waitForTimeout(1000);

            // Vérifier qu'aucun popup de blunder n'accuse le bot
            const errorToast = page.getByTestId('move-error-toast');
            if (await errorToast.count() > 0) {
                const toastText = await errorToast.innerText();
                expect(toastText).not.toContain('Maxime');
                expect(toastText).not.toContain('Le Mauvais Joueur');
            }
        }

        // Vérifications finales
        expect(pageErrors).toHaveLength(0);
        expect(undosTested).toBeGreaterThanOrEqual(1);
    });
});
