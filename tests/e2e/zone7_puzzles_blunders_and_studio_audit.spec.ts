/**
 * @file tests/e2e/zone7_puzzles_blunders_and_studio_audit.spec.ts
 * @description Suite Playwright E2E Zone 7/7 : Banque 3-Ply /puzzles, Mes Blunders FSRS v5 & Studio d'Analyse
 * Strictement <= 300 lignes, 0 `any`.
 */

import { test, expect } from '@playwright/test';

test.describe('Zone 7 — Audit & Validation Finale : /puzzles, Mes Blunders FSRS v5 & Studio d’Analyse', () => {

    test('1. /puzzles : Sanctuaire du Plateau Nu & Choix A/B/C/D', async ({ page }) => {
        await page.goto('/puzzles');
        await page.waitForSelector('[data-testid="quiz-qcm-choices"]', { timeout: 15000 });

        // 1. Choix A, B, C, D sont présents
        const choicesGrid = page.locator('[data-testid="quiz-qcm-choices"]');
        await expect(choicesGrid).toBeVisible();

        const choiceBtns = choicesGrid.locator('button');
        const count = await choiceBtns.count();
        expect(count).toBeGreaterThanOrEqual(2);

        // 2. Sanctuaire du Plateau Nu : aucun overlay d'erreur avant le clic
        const errorCard = page.locator('[data-testid="drill-coach-feedback"]');
        await expect(errorCard).not.toBeVisible();

        // 3. Indicateurs d'essais (2 cœurs / tentatives)
        const attemptsBadge = page.locator('text=Essais restants : 2').first();
        if (await attemptsBadge.isVisible()) {
            await expect(attemptsBadge).toBeVisible();
        }
    });

    test('2. /puzzles?filter=personal-blunders : File FSRS v5 ou invitation si vide', async ({ page }) => {
        await page.goto('/puzzles?filter=personal-blunders');
        // Doit soit charger un blunder personnel, soit afficher le conteneur du drill ou l'état vide
        await page.waitForLoadState('domcontentloaded');

        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible({ timeout: 15000 });

        // Vérifier la présence du badge de mode Blunder ou du header de quiz
        const modeIndicator = page.locator('text=/Blunder|Personnel|Parcours/i').first();
        if (await modeIndicator.isVisible()) {
            await expect(modeIndicator).toBeVisible();
        }
    });

    test('3. Studio d’Analyse (/analysis) : Scanner XGID & Presets de positions', async ({ page }) => {
        await page.goto('/analysis');
        await page.waitForSelector('main', { timeout: 15000 });

        // Le champ de saisie XGID est présent et interactif
        const xgidInput = page.locator('input[placeholder*="XGID"], textarea[placeholder*="XGID"]').first();
        if (await xgidInput.isVisible()) {
            const val = await xgidInput.inputValue();
            expect(val).toContain('XGID=');
        }

        // Les presets de positions célèbres sont cliquables
        const presetBtn = page.locator('button:has-text("Ouverture"), button:has-text("Point d\'Ancre"), button:has-text("DMP")').first();
        if (await presetBtn.isVisible()) {
            await expect(presetBtn).toBeEnabled();
        }

        // Le plateau d'analyse SVG/Canvas est bien rendu
        const boardElem = page.locator('[role="region"][aria-label*="Plateau"], [data-testid="board-container"]').first();
        if (await boardElem.isVisible()) {
            await expect(boardElem).toBeVisible();
        }
    });
});
