import { test, expect } from '@playwright/test';

test.describe('E2E : Jouabilité Snowie/TMG, Auto-move, Drag-and-drop, Animations & Zéro superposition', () => {
    test.beforeEach(async ({ page }) => {
        // Accède au jeu
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

});
