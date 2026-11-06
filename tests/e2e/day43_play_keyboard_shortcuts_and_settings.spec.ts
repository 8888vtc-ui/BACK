import { test, expect } from '@playwright/test';

test.describe('Day 43 — Contrôle des Raccourcis Clavier & Tiroir de Réglages sur /play', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
        });
    });

    test('1. Touche F, Escape et bouton "Mode Échiquier Pur" basculent le Full Focus avec protection des inputs', async ({ page }) => {
        await page.goto('/play?gate=beginner&start=guided');
        await page.waitForLoadState('domcontentloaded');

        const coachColumn = page.locator('[data-testid="board-coach-column"]');
        const focusBtn = page.locator('[data-testid="full-focus-board-btn"]');

        // Vue normale par défaut : la colonne latérale du coach est présente
        await expect(coachColumn).toBeVisible({ timeout: 10000 });
        await expect(focusBtn).toBeVisible();
        await expect(focusBtn).toContainText('Mode Échiquier Pur');

        // 1. Appui sur la touche "f" -> Full Focus activé, colonne coach masquée
        await page.keyboard.press('KeyF');
        await expect(coachColumn).toBeHidden();
        await expect(focusBtn).toContainText('Quitter Mode Échiquier');

        // 2. Deuxième appui sur la touche "f" -> Restauration de la vue normale
        await page.keyboard.press('KeyF');
        await expect(coachColumn).toBeVisible();
        await expect(focusBtn).toContainText('Mode Échiquier Pur');

        // 3. Activation du Full Focus par le bouton cliquable
        await focusBtn.click();
        await expect(coachColumn).toBeHidden();
        await expect(focusBtn).toContainText('Quitter Mode Échiquier');

        // 4. Touche "Escape" -> Sortie immédiate du Full Focus
        await page.keyboard.press('Escape');
        await expect(coachColumn).toBeVisible();
        await expect(focusBtn).toContainText('Mode Échiquier Pur');

        // 5. Protection anti-déclenchement quand le joueur saisit du texte dans un input
        await page.evaluate(() => {
            const input = document.createElement('input');
            input.id = 'test-dummy-input';
            input.type = 'text';
            document.body.appendChild(input);
            input.focus();
        });

        // Taper "f" dans l'input ne doit PAS activer le mode Full Focus
        await page.keyboard.press('KeyF');
        await expect(coachColumn).toBeVisible();

        // Nettoyage de l'input de test
        await page.evaluate(() => {
            const el = document.getElementById('test-dummy-input');
            el?.remove();
        });
    });

    test('2. Masquage du Pip Count (Conditions Tournoi) sur le plateau et persistance localStorage', async ({ page }) => {
        await page.goto('/play?gate=beginner&start=guided');
        await page.evaluate(() => {
            localStorage.setItem('backgammon_show_pipcount', 'true');
            window.dispatchEvent(new CustomEvent('bg:pip-visibility-change', { detail: true }));
        });
        await page.waitForLoadState('domcontentloaded');

        const centralPipX = page.locator('[data-testid="central-bar-pip-x"]');
        const centralPipO = page.locator('[data-testid="central-bar-pip-o"]');
        await expect(centralPipX).toBeVisible({ timeout: 10000 });
        await expect(centralPipO).toBeVisible();

        // 1. Initialement visible : affiche les compteurs de pips réels (ex: 167)
        const initialText = await centralPipX.innerText();
        expect(initialText).toBe('167');

        // 2. Clic sur le compteur de Pip Count -> passage en mode masqué "•••"
        await centralPipX.click();
        await expect(centralPipX).toHaveText('•••');
        await expect(centralPipO).toHaveText('•••');

        // Vérification de la persistance dans localStorage
        const storedVal = await page.evaluate(() => localStorage.getItem('backgammon_show_pipcount'));
        expect(storedVal).toBe('false');

        // 3. Rechargement de la page -> le masquage persiste (Conditions Tournoi)
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('[data-testid="central-bar-pip-x"]')).toHaveText('•••');
        await expect(page.locator('[data-testid="central-bar-pip-o"]')).toHaveText('•••');

        // 4. Ouvrir le tiroir de réglages du rail droit et basculer l'option Conditions Tournoi
        const railSettingsBtn = page.locator('[data-testid="right-rail-settings-btn"]');
        await expect(railSettingsBtn).toBeVisible();
        await railSettingsBtn.click();

        const pipToggleBtn = page.locator('[data-testid="right-rail-pip-visibility-toggle"]');
        await expect(pipToggleBtn).toBeVisible();
        await pipToggleBtn.click();

        // Les compteurs de pips redeviennent chiffrés sur le plateau
        await expect(page.locator('[data-testid="central-bar-pip-x"]')).toHaveText('167');
        await expect(page.locator('[data-testid="central-bar-pip-o"]')).toHaveText('167');

        const restoredStoredVal = await page.evaluate(() => localStorage.getItem('backgammon_show_pipcount'));
        expect(restoredStoredVal).toBe('true');
    });

    test('3. Les boutons Undo et les raccourcis de dés (Swap / Undo) sont actifs et non bloquants', async ({ page }) => {
        await page.goto('/play?gate=beginner&start=guided');
        await page.waitForLoadState('domcontentloaded');

        // Bouton Undo dans le rail droit
        const undoBtn = page.locator('[data-testid="right-rail-undo-btn"]');
        if (await undoBtn.count() > 0) {
            await expect(undoBtn).toBeVisible();
        }

        // Si le bouton de lancer de dés est présent, on clique dessus
        const rollBtn = page.locator('[data-testid="center-roll-button"]');
        if (await rollBtn.count() > 0 && await rollBtn.isVisible()) {
            await rollBtn.click();
        }

        // Lancer les touches S (Swap) et U (Undo) au clavier sans aucune erreur console
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.keyboard.press('KeyS');
        await page.keyboard.press('KeyU');
        await page.keyboard.press('Tab');

        expect(errors).toHaveLength(0);
    });
});
