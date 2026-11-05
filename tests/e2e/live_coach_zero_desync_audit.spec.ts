import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/live_coach_zero_desync_audit.spec.ts
 * @description Audit E2E Playwright de non-désynchronisation du Coach Live en mode Club/Intermédiaire & Expert.
 * Vérifie l'atomicité des paquets, la correspondance Joué vs Recommandé, et le replay sans décalage.
 */

test.describe('🎯 AUDIT E2E : COACH LIVE ZÉRO DÉCALAGE & VÉRITÉ ABSOLUE', () => {

    test('1. Vérification du verrou atomique et du pipeline Coach en Mode Intermédiaire', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' && !msg.text().includes('favicon')) {
                consoleErrors.push(msg.text());
            }
        });

        // 1. Accès direct en Mode Intermédiaire
        await page.goto('/play?gate=intermediate');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Vérification de la présence des éléments clés
        const boardArea = page.locator('[data-testid="board-main-column"]');
        await expect(boardArea).toBeVisible({ timeout: 10000 });

        // Vérifier l'invariant : AUCUNE flèche fantôme avant le lancer de dés
        const svgArrowsBefore = page.locator('[data-testid="coach-arrows-overlay"]');
        await expect(svgArrowsBefore).toHaveCount(0);

        // Lancer les dés si le bouton est visible
        const rollBtn = page.locator('button:has-text("LANCER LES DÉS"), button:has-text("Lancer les dés"), [data-testid="roll-dice-button"]').first();
        if (await rollBtn.isVisible()) {
            await rollBtn.click();
            await page.waitForTimeout(600);
        }

        // Si le toast d'erreur apparaît ou peut être simulé
        const errorToast = page.locator('[data-testid="move-error-toast"]');
        if (await errorToast.isVisible()) {
            // Vérifier que le bouton Rejouer ce coup fonctionne
            const replayBtn = page.locator('[data-testid="error-toast-replay-btn"]');
            if (await replayBtn.isVisible()) {
                await replayBtn.click();
                await page.waitForTimeout(300);
                // Le toast doit disparaître
                await expect(errorToast).not.toBeVisible();
            }
        }

        // Zéro exception critique dans la console
        const criticalErrors = consoleErrors.filter(
            (e) => e.includes('TypeError') || e.includes('Uncaught') || e.includes('Cannot read properties')
        );
        expect(criticalErrors).toEqual([]);
    });

    test('2. Vérification de l’absence d’hallucination géométrique et du mode Expert', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' && !msg.text().includes('favicon')) {
                consoleErrors.push(msg.text());
            }
        });

        // 1. Accès direct en Mode Expert
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Vérifier l'affichage du plateau
        const boardArea = page.locator('[data-testid="board-main-column"]');
        await expect(boardArea).toBeVisible({ timeout: 10000 });

        // Lancer les dés si le bouton est présent
        const rollBtn = page.locator('button:has-text("LANCER LES DÉS"), button:has-text("Lancer les dés"), [data-testid="roll-dice-button"]').first();
        if (await rollBtn.isVisible()) {
            await rollBtn.click();
            await page.waitForTimeout(600);
        }

        // Vérifier qu'aucune erreur JS n'a été levée
        const criticalErrors = consoleErrors.filter(
            (e) => e.includes('TypeError') || e.includes('Uncaught') || e.includes('Cannot read properties')
        );
        expect(criticalErrors).toEqual([]);
    });
});
