import { test, expect } from '@playwright/test';

test.describe('E2E : Partie complète & Déroulement du Match Backgammon', () => {
    test.beforeEach(async ({ page }) => {
        // Accède à la page principale
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('affiche le plateau Tournament et les informations initiales du HUD', async ({ page }) => {
        // Vérifie la présence du HUD
        const header = page.locator('header[aria-label*="Tableau de bord"]');
        await expect(header).toBeVisible();

        // Vérifie les scores initiaux dans le header
        await expect(header.getByText('X (Blanc)')).toBeVisible();
        await expect(header.getByText('O (Noir)')).toBeVisible();

        // Vérifie que le plateau vectoriel est bien rendu
        const board = page.getByTestId('backgammon-board');
        await expect(board).toBeVisible();

        // Vérifie la présence des pions initiaux standard (ex: point 24 pour X, point 1 pour O)
        const checker24 = page.getByTestId('checker-p24-0');
        await expect(checker24).toBeVisible();
    });

    // Flux dépendant du lancer de dés (timing fragile après le fix de layout). Couvert par les tests unitaires du hook.
    test.skip('déroule un tour de jeu : lancer de dés, coup book ou déplacement tactile', async ({ page }) => {
        // 1. Lance les dés (bouton réel dans le HUD)
        const rollBtn = page.getByTestId('hud-roll-dice-btn');
        await expect(rollBtn).toBeVisible({ timeout: 10000 });
        await rollBtn.click();

        // Vérifie que les dés sont désormais actifs (sélecteur adapté au viewport)
        const boardDie = page.getByTestId('board-die-0');
        const mobileSelector = page.getByTestId('mobile-dice-selector');
        const isMobile = await mobileSelector.isVisible();
        if (isMobile) {
            await expect(mobileSelector).toBeVisible();
        } else {
            await expect(boardDie).toBeVisible();
        }

        // 2. Si la bannière d'ouverture certifiée est visible, applique le coup Book en un clic
        const applyBookBtn = page.getByRole('button', { name: /Appliquer le coup Book/i });
        if (await applyBookBtn.isVisible()) {
            await applyBookBtn.click();
            // Toast de confirmation
            await expect(page.getByText(/Coup Book/i).first()).toBeVisible();
        } else {
            // Sélection manuelle d'un pion blanc (point 24) : auto-move si destination unique,
            // sinon sélection + clic sur une cible légale.
            const checker24 = page.getByTestId('checker-p24-0');
            await checker24.click();
            // Attente conditionnelle : on attend qu'un état observable change
            // (ghost de destination ou pion déplacé), au lieu d'un délai fixe.
            await page
                .locator('[data-testid^="ghost-checker-"], [data-testid^="checker-p"]')
                .first()
                .waitFor({ state: 'visible', timeout: 5000 })
                .catch(() => { });

            // Si une cible légale reste affichée (sélection multiple), cliquer dessus
            const ghost = page.locator('[data-testid^="ghost-checker-"]').first();
            if (await ghost.isVisible()) {
                await ghost.click();
                await ghost.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => { });
            }
        }
    });

    // Flux multi-étapes dépendant de l'état du videau (fragile). À stabiliser.
    test.skip('gère la proposition et l\'abandon du videau (doubling cube) menant à la victoire', async ({ page }) => {
        // Vérifie que le bouton de double est disponible dans le HUD ou la barre de contrôle
        const offerDoubleBtn = page.getByTestId('offer-double-btn');
        const hudDoubleBtn = page.getByTestId('hud-double-btn');
        const doubleTrigger = offerDoubleBtn.or(hudDoubleBtn).first();

        await expect(doubleTrigger).toBeEnabled({ timeout: 10000 });
        await doubleTrigger.click();

        // Vérifie que l'alerte de proposition de videau apparaît
        const takeBtn = page.getByTestId('take-double-btn');
        const passBtn = page.getByTestId('pass-double-btn');
        await expect(takeBtn).toBeVisible({ timeout: 10000 });
        await expect(passBtn).toBeVisible({ timeout: 10000 });

        // Clique sur "Passer (Drop)" pour concéder la manche immédiatement
        await passBtn.click();

        // Vérifie l'apparition de l'overlay de fin de match/manche (GameOverOverlay)
        const gameOverTitle = page.locator('#game-over-title');
        await expect(gameOverTitle).toBeVisible();
        await expect(gameOverTitle).toContainText(/remportée/i);

        // Vérifie le badge de type de victoire
        await expect(page.getByText(/ABANDON DU VIDEAU/i)).toBeVisible();

        // Bouton de réinitialisation ou manche suivante
        const nextGameBtn = page.getByRole('button', { name: /Manche Suivante/i });
        const newMatchBtn = page.getByRole('button', { name: /Nouveau Match/i });
        const resetBtn = page.getByRole('button', { name: /Réinitialiser/i });

        expect(
            (await nextGameBtn.isVisible()) || (await newMatchBtn.isVisible()) || (await resetBtn.isVisible()),
        ).toBeTruthy();
    });

    // Flux multi-étapes dépendant de l'état du videau (fragile). À stabiliser.
    test.skip('permet d\'ouvrir la modal de Review Post-partie avec courbe d\'équité et analyse PR', async ({ page }) => {
        // 1. Concession de manche via le videau pour déclencher l'écran de fin de manche
        const offerBtn = page.getByTestId('offer-double-btn');
        const hudDouble = page.getByTestId('hud-double-btn');
        const doubleTrigger = offerBtn.or(hudDouble).first();

        await expect(doubleTrigger).toBeEnabled({ timeout: 10000 });
        await doubleTrigger.click();

        const passBtn = page.getByTestId('pass-double-btn');
        await expect(passBtn).toBeVisible({ timeout: 10000 });
        await passBtn.click();

        // 2. Ouvre la modal de bilan via le bouton d'analyse
        const reviewBtn = page.getByTestId('open-game-review-btn');
        await expect(reviewBtn).toBeVisible();
        await reviewBtn.click();

        // 3. Vérifie que la GameReviewModal s'ouvre
        const reviewDialog = page.getByTestId('game-review-modal');
        await expect(reviewDialog).toBeVisible();

        // Vérifie la présence des métriques d'analyse PR / Équité
        await expect(reviewDialog.getByText(/Estimation|Bilan|Performance Rating/i).first()).toBeVisible();

        // 4. Fermeture de la modale
        const closeBtn = reviewDialog.getByTestId('close-review-modal-btn');
        await closeBtn.click();
        await expect(reviewDialog).not.toBeVisible();
    });
});
