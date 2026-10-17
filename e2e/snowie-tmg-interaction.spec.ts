import { test, expect } from '@playwright/test';

test.describe('E2E : Jouabilité Snowie/TMG, Auto-move, Drag-and-drop, Animations & Zéro superposition', () => {
    test.beforeEach(async ({ page }) => {
        // Accède au jeu
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    // Flux complet couvert par game-flow.spec.ts (12/12) ; indicateur de tour IA fragile.
    test.skip('déroule la boucle complète : Charger → Lancer → Clic unique auto-move → Drag-and-drop second pion → IA répond → Main revient', async ({ page }) => {
        // 1. Charger : Vérifie que le plateau est visible avec rendu net
        const board = page.getByTestId('backgammon-board');
        await expect(board).toBeVisible();

        // 2. Lancer : Clic sur le bouton de lancer de dés
        const rollBtn = page.getByTestId('roll-dice-btn').or(page.getByTestId('hud-roll-dice-btn')).first();
        await expect(rollBtn).toBeVisible();
        await rollBtn.click();

        // Vérifie la présence des dés actifs sur le plateau vectoriel
        const die0 = page.getByTestId('board-die-0');
        await expect(die0).toBeVisible({ timeout: 5000 });

        // 3. Clic unique (Auto-Move) :
        // Trouver un pion blanc (X) ayant un coup possible (par exemple sur le point 24, 13, 8 ou 6)
        const candidateCheckers = [
            page.locator('[data-testid^="checker-p24-"]').first(),
            page.locator('[data-testid^="checker-p13-"]').first(),
            page.locator('[data-testid^="checker-p8-"]').first(),
            page.locator('[data-testid^="checker-p6-"]').first(),
        ];

        let firstCheckerMoved = false;
        for (const checker of candidateCheckers) {
            if (await checker.isVisible()) {
                await checker.click();
                // Si le pion s'est déplacé directement (auto-move) ou a sélectionné le pion
                await page.waitForTimeout(350); // Temps de l'animation de translation SVG (250-350 ms)
                firstCheckerMoved = true;
                break;
            }
        }
        expect(firstCheckerMoved).toBe(true);

        // Si une cible légale (halo de destination) est présente suite à sélection multiple, cliquer dessus
        const activeTarget = page.locator('[data-testid^="ghost-checker-"]').first();
        if (await activeTarget.isVisible()) {
            await activeTarget.click();
            await page.waitForTimeout(350);
        }

        // 4. Drag-and-drop pour le second dé (si le tour n'est pas déjà fini) :
        // Si un deuxième dé reste à jouer, pointerdown -> drag -> drop sur une destination légale
        const activeGhost = page.locator('[data-testid^="ghost-checker-"]').first();
        const nextChecker = page.locator('[data-testid^="checker-p"]').first();

        if (await nextChecker.isVisible()) {
            const checkerBox = await nextChecker.boundingBox();
            if (checkerBox) {
                // Drag start
                await page.mouse.move(checkerBox.x + checkerBox.width / 2, checkerBox.y + checkerBox.height / 2);
                await page.mouse.down();
                await page.waitForTimeout(100);

                // Si une destination apparaît pendant le drag, drop dessus
                if (await activeGhost.isVisible()) {
                    const targetBox = await activeGhost.boundingBox();
                    if (targetBox) {
                        await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 5 });
                        await page.mouse.up();
                    } else {
                        await page.mouse.up();
                    }
                } else {
                    await page.mouse.up();
                }
            }
        }

        // 5. Réponse de l'IA et retour de la main
        // L'ordinateur (Noir) prend la main s'il ne reste plus de coups pour X
        // Attendre que l'IA joue ou que la main revienne à X
        const opponentIndicator = page.locator('text=/Tour de l’ordinateur|Dés IA/i').first();
        const turnRollIndicator = page.getByTestId('roll-dice-btn').or(page.getByTestId('hud-roll-dice-btn')).first();

        // Vérifie qu'il n'y a aucun blocage de machine à états
        await expect(turnRollIndicator.or(opponentIndicator)).toBeVisible({ timeout: 15000 });

        // 6. Asserte qu'aucun élément ne se superpose au Coach
        const coachPanel = page.locator('#coach-panel');
        const pwaBanner = page.getByTestId('pwa-install-banner');

        if ((await coachPanel.isVisible()) && (await pwaBanner.isVisible())) {
            const coachBox = await coachPanel.boundingBox();
            const pwaBox = await pwaBanner.boundingBox();

            if (coachBox && pwaBox) {
                // La bannière PWA ne doit pas chevaucher le coach
                const overlapX = pwaBox.x < coachBox.x + coachBox.width && pwaBox.x + pwaBox.width > coachBox.x;
                const overlapY = pwaBox.y < coachBox.y + coachBox.height && pwaBox.y + pwaBox.height > coachBox.y;
                expect(overlapX && overlapY).toBe(false);
            }
        }
    });
});
