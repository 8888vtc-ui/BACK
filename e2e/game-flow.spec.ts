import { test, expect } from '@playwright/test';

test.describe('Parcours Complet du Jeu Backgammon (E2E)', () => {
    test('Charge le plateau, lance les dés, sélectionne et déplace un pion', async ({ page }) => {
        await page.goto('/');

        // 1. Démarrer le match depuis le Lobby
        const lobbyStartBtn = page.getByTestId('lobby-start-btn');
        await expect(lobbyStartBtn).toBeVisible();
        await lobbyStartBtn.click();

        // 2. Vérifier que le plateau et le HUD sont visibles
        const board = page.getByTestId('backgammon-board');
        await expect(board).toBeVisible();

        // 3. Vérifier la présence du bouton Lancer les dés au centre du plateau
        const rollButton = page.getByTestId('center-roll-button');
        await expect(rollButton).toBeVisible();
        await rollButton.click();

        // 4. Attendre que les dés apparaissent sur le plateau
        const die0 = page.getByTestId('board-die-0');
        const die1 = page.getByTestId('board-die-1');
        await expect(die0).toBeVisible({ timeout: 5000 });
        await expect(die1).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(460);

        // 5. Au départ, X a des pions sur 24 (2), 13 (5), 8 (3), 6 (5).
        // En cliquant sur l'une de ces flèches, le coup avec le dé le plus élevé est joué directement.
        const initialPoints = [24, 13, 8, 6];
        for (const pt of initialPoints) {
            const pointEl = page.getByTestId(`point-triangle-${pt}`);
            await pointEl.click();
            await page.waitForTimeout(100);
        }

        await expect(board).toBeVisible();
    });

    test('Ouvre le menu Paramètres, change le thème et ouvre le modal Export SGF', async ({ page }) => {
        await page.goto('/');

        await page.getByTestId('lobby-start-btn').click();
        await expect(page.getByTestId('backgammon-board')).toBeVisible();

        // 1. Ouvrir le menu Paramètres (⚙️) dans le HUD
        const settingsBtn = page.getByTestId('hud-settings-toggle-btn');
        await expect(settingsBtn).toBeVisible();
        await settingsBtn.click();

        const settingsMenu = page.getByTestId('hud-settings-menu');
        await expect(settingsMenu).toBeVisible();

        // 2. Basculer le thème du plateau via l'item du menu
        const themeToggle = page.getByTestId('menu-theme-toggle-btn');
        await expect(themeToggle).toBeVisible();
        await themeToggle.click();

        // 3. Rouvrir le menu Paramètres et ouvrir le modal Export / Import SGF
        await settingsBtn.click();
        const exportBtn = page.getByTestId('menu-export-import-btn');
        await expect(exportBtn).toBeVisible();
        await exportBtn.click();

        const exportModal = page.getByTestId('export-import-modal');
        await expect(exportModal).toBeVisible();

        // 4. Fermer le modal Export / Import
        const closeBtn = page.getByTestId('close-export-modal-btn');
        await closeBtn.click();
        await expect(exportModal).toBeHidden();
    });

    test('Teste le bouton Doubler (Videau) avant de lancer les dés', async ({ page }) => {
        await page.goto('/');

        await page.getByTestId('lobby-start-btn').click();
        await expect(page.getByTestId('backgammon-board')).toBeVisible();

        const doubleBtn = page.getByTestId('center-double-button');
        await expect(doubleBtn).toBeVisible();
        await doubleBtn.click();

        // Après proposition du double par X, l'IA évalue et prend/passe, puis le bouton Lancer réapparaît
        const rollButton = page.getByTestId('center-roll-button');
        await expect(rollButton).toBeVisible({ timeout: 5000 });
    });
});
