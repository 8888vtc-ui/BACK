import { test, expect } from '@playwright/test';

test.describe('Studio d\'Analyse — Laboratoire Interactif & Scanner Photo Vision IA', () => {
    test('Parcours complet : plateau vide, réserves de 15 dames, sélection de dés 5-2, analyse 3-ply et scanner photo', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis');
        await page.waitForLoadState('domcontentloaded');

        // 1. Vérification initiale : Flèches actives pour 3-1 (8/5 6/5)
        const studioRoot = page.locator('[data-testid="analysis-studio-root"]');
        await expect(studioRoot).toBeVisible();

        const moveRow0 = page.locator('[data-testid="analysis-move-row-0"]');
        await expect(moveRow0).toBeVisible();
        await expect(moveRow0).toContainText('8/5 6/5');

        // 2. Vider le plateau : les réserves affichent 15 / 15 disponibles
        const clearBtn = page.locator('[data-testid="clear-board-btn"]');
        await expect(clearBtn).toBeVisible();
        await clearBtn.click();

        const whiteTray = page.locator('[data-testid="white-checker-tray"]');
        const blackTray = page.locator('[data-testid="black-checker-tray"]');
        await expect(whiteTray).toContainText('15 / 15 disponibles');
        await expect(blackTray).toContainText('15 / 15 disponibles');

        // 3. Pose manuelle de pions avec le pinceau Blanc et Noir
        const brushWhiteBtn = page.locator('[data-testid="brush-white-btn"]');
        await brushWhiteBtn.click();

        // Clic sur des flèches du tablier (points 6 et 8)
        const point6 = page.locator('[data-point="6"]');
        const point8 = page.locator('[data-point="8"]');
        if (await point6.count() > 0) {
            await point6.first().click();
        }
        if (await point8.count() > 0) {
            await point8.first().click();
        }

        // Clic sur "Ranger le reste en Sortie" pour compléter à 15 vs 15
        const completeOffBtn = page.locator('[data-testid="complete-to-off-btn"]');
        await expect(completeOffBtn).toBeVisible();
        await completeOffBtn.click();

        // 4. Sélecteur visuel de dés : choisir 5-2
        const die1Btn5 = page.locator('[data-testid="die-1-btn-5"]');
        const die2Btn2 = page.locator('[data-testid="die-2-btn-2"]');
        await expect(die1Btn5).toBeVisible();
        await expect(die2Btn2).toBeVisible();
        await die1Btn5.click();
        await die2Btn2.click();

        // 5. Clic sur "Analyser cette position en 3-ply"
        const runAnalysisBtn = page.locator('[data-testid="run-analysis-btn"]');
        await expect(runAnalysisBtn).toBeVisible();
        await runAnalysisBtn.click();

        // Le Top 5 des coups légaux et l'explication du Coach doivent être visibles
        const resultsSection = page.locator('[data-testid="analysis-results-section"]');
        await expect(resultsSection).toBeVisible();

        const coachCard = page.locator('[data-testid="coach-explanation-card"]');
        await expect(coachCard).toBeVisible();
        await expect(coachCard).toContainText('Explication du Coach');

        // 6. Test de la modale Scanner Photo Vision IA
        const openScannerBtn = page.locator('[data-testid="open-photo-scanner-btn"]');
        await expect(openScannerBtn).toBeVisible();
        await openScannerBtn.click();

        const scannerModal = page.locator('[data-testid="photo-scanner-modal"]');
        await expect(scannerModal).toBeVisible();

        // Fermeture de la modale
        const closeModalBtn = page.locator('[data-testid="close-scanner-modal-btn"]');
        await expect(closeModalBtn).toBeVisible();
        await closeModalBtn.click();
        await expect(scannerModal).not.toBeVisible();

        // Aucune erreur uncaught levée sur la page
        expect(pageErrors.length).toBe(0);
    });
});

