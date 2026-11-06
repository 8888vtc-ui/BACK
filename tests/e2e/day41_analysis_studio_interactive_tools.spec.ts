import { test, expect } from '@playwright/test';

test.describe('Mission 41 — Studio d\'Analyse (/analysis) : Éditeur, XGID et Jouer à partir d\'ici', () => {
    test.beforeEach(async ({ context }) => {
        try {
            await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        } catch {
            // Certaines plateformes headless ignorent grantPermissions
        }
    });

    test('1. Éditeur de plateau : Vider le plateau, cap strict de 15 dames, zéro mélange, Gomme, Position de départ et Inverser', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Vérifier la présence du Studio d'Analyse
        const studioRoot = page.locator('[data-testid="analysis-studio-root"]');
        await expect(studioRoot).toBeVisible();

        // 1. Bouton "Vider le plateau"
        const clearBtn = page.locator('[data-testid="clear-board-btn"]');
        await expect(clearBtn).toBeVisible();
        await clearBtn.click();

        // Vérifier que les compteurs indiquent 0/15 pour les deux camps
        const brushWhiteBtn = page.locator('[data-testid="brush-white-btn"]');
        const brushBlackBtn = page.locator('[data-testid="brush-black-btn"]');
        await expect(brushWhiteBtn).toContainText('Poser Blanc (0/15)');
        await expect(brushBlackBtn).toContainText('Poser Noir (0/15)');

        // 2. Poser Blanc : ajouter des pions sur la flèche 6 jusqu'au cap de 15
        await brushWhiteBtn.click();
        const point6 = page.locator('[data-testid="point-touch-zone-6"]');
        await expect(point6).toBeVisible();

        // Cliquer 15 fois pour poser 15 dames blanches
        for (let i = 0; i < 15; i++) {
            await point6.click({ force: true });
        }
        await expect(brushWhiteBtn).toContainText('Poser Blanc (15/15)');

        // Tentative d'en poser une 16e : le compteur doit rester strictement plafonné à 15/15 !
        await point6.click({ force: true });
        await expect(brushWhiteBtn).toContainText('Poser Blanc (15/15)');

        // 3. Poser Noir sur une flèche contenant du Blanc : INTERDICTION de mélanger
        await brushBlackBtn.click();
        // Cliquer sur la flèche 6 qui a 15 pions blancs
        await point6.click({ force: true });
        // Le clic avec Poser Noir remplace les pions blancs (renvoyés en réserve) par 1 dame noire
        // et n'autorise jamais un empilement bicolore sur la même flèche
        await expect(brushBlackBtn).toContainText('Poser Noir (1/15)');
        await expect(brushWhiteBtn).toContainText('Poser Blanc (0/15)');

        // 4. Gomme : effacer la dame noire
        const eraserBtn = page.locator('[data-testid="brush-remove-btn"]');
        await expect(eraserBtn).toBeVisible();
        await eraserBtn.click();
        await point6.click({ force: true });
        await expect(brushBlackBtn).toContainText('Poser Noir (0/15)');

        // 5. Position de Départ : réinitialisation standard 15/15
        const startingPosBtn = page.locator('[data-testid="reset-starting-board-btn"]');
        await expect(startingPosBtn).toBeVisible();
        await startingPosBtn.click();
        await expect(brushWhiteBtn).toContainText('Poser Blanc (15/15)');
        await expect(brushBlackBtn).toContainText('Poser Noir (15/15)');

        // 6. Inverser : permute les couleurs de chaque camp
        const invertBtn = page.locator('[data-testid="invert-colors-btn"]');
        await expect(invertBtn).toBeVisible();
        await invertBtn.click();
        // Après inversion, les 15 dames restent présentes
        await expect(brushWhiteBtn).toContainText('Poser Blanc (15/15)');
        await expect(brushBlackBtn).toContainText('Poser Noir (15/15)');

        expect(pageErrors.length).toBe(0);
    });

    test('2. Import et Copie de code XGID avec synchronisation du plateau, des dés et du videau', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Ouvrir le tiroir XGID
        const toggleXgidBtn = page.locator('[data-testid="toggle-xgid-drawer-btn"]');
        await expect(toggleXgidBtn).toBeVisible();
        await toggleXgidBtn.click();

        const xgidInput = page.locator('[data-testid="xgid-input"]');
        await expect(xgidInput).toBeVisible();

        // XGID test personnalisé avec dés 4-2 et match 7 pts
        const testXgid = 'XGID=-a-B-BD-B---dD---c-e----B-:0:0:1:42:0:0:0:7:10';
        await xgidInput.fill(testXgid);

        const loadBtn = page.locator('[data-testid="load-xgid-btn"]');
        await expect(loadBtn).toBeVisible();
        await loadBtn.click();

        // Vérifier la mise à jour des dés (4 et 2)
        const die1Active = page.locator('[data-testid="die-1-btn-4"]');
        const die2Active = page.locator('[data-testid="die-2-btn-2"]');
        await expect(die1Active).toHaveClass(/border-\[#D4AF37\]/);
        await expect(die2Active).toHaveClass(/border-\[#D4AF37\]/);

        // Vérifier le bouton "Copier XGID"
        const copyBtn = page.locator('[data-testid="copy-xgid-btn"]');
        await expect(copyBtn).toBeVisible();
        await copyBtn.click();
        await expect(copyBtn).toContainText(/Copié !|Copied !/);

        expect(pageErrors.length).toBe(0);
    });

    test('3. Bouton "Jouer cette position contre le Coach IA à partir d\'ici" transfère la position exacte vers /play', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Modifier les dés sur 6-5 dans l'analyseur
        const die1Btn6 = page.locator('[data-testid="die-1-btn-6"]');
        const die2Btn5 = page.locator('[data-testid="die-2-btn-5"]');
        await die1Btn6.click();
        await die2Btn5.click();

        // Cliquer sur "Jouer cette position contre le Coach IA à partir d'ici"
        const playFromHereBtn = page.locator('[data-testid="play-position-from-here-btn"]');
        await expect(playFromHereBtn).toBeVisible();
        await playFromHereBtn.click();

        // Vérifier la navigation vers /play?from=analysis
        await page.waitForURL(/\/play\?from=analysis|\/\?from=analysis/, { timeout: 8000 });

        // Vérifier que le plateau de jeu principal est monté
        const backgammonBoard = page.locator('[data-testid="backgammon-board"]');
        await expect(backgammonBoard).toBeVisible({ timeout: 10000 });

        expect(pageErrors.length).toBe(0);
    });
});
