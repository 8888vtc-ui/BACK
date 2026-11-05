import { test, expect } from '@playwright/test';

test.describe('Zone 2 — Audit & Verrouillage de la Sidebar Gauche (LobbySidebarAndWidgets)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Hiérarchie épurée, icônes Lucide et zéro sous-accordéon en mode Débutant', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=beginner');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        // En Débutant, le bouton Salon de Jeu est sur une seule ligne directe
        await expect(page.locator('[data-testid="sidebar-quick-play-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-play-group-toggle"]')).not.toBeVisible();

        // Liens obligatoires en Débutant
        await expect(page.locator('[data-testid="sidebar-my-quizzes-link"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-my-blunders-link"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-pillar-academy"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-pillar-tournaments"]')).toBeVisible();

        // Le Studio d'Analyse DOIT être masqué en Débutant
        await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).not.toBeVisible();

        // Absence d'erreur runtime
        expect(pageErrors).toEqual([]);
    });

    test('2. Déverrouillage du Studio d\'Analyse et du sous-menu Tables en modes Intermédiaire et Expert', async ({ page }) => {
        // Mode Intermédiaire
        await page.goto('/?gate=intermediate');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        await expect(page.locator('[data-testid="sidebar-play-group-toggle"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-submenu-find-opponent"]')).toBeVisible();
        await expect(page.locator('[data-testid="sidebar-submenu-ai"]')).toBeVisible();

        // Mode Expert
        await page.goto('/?gate=expert');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });
        await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toBeVisible();
    });

    test('3. Badge compteur dynamique sur "Mes Blunders" en présence d\'erreurs', async ({ page }) => {
        await page.goto('/?gate=intermediate');
        await page.evaluate(() => {
            // Injection d'un blunder personnel non maîtrisé sous la clé 'bg_blunder_bank'
            const sampleBlunder = [{
                id: 'user_blunder_audit_1',
                gameId: 'game_test_1',
                board: new Array(28).fill(0),
                dice: [3, 1],
                playerColor: 1,
                playedMove: '24/20',
                bestMove: '24/23 13/10',
                equityLoss: 0.125,
                isMastered: false,
                timesReviewed: 0,
                timesSolved: 0,
                createdAt: Date.now(),
            }];
            localStorage.setItem('bg_blunder_bank', JSON.stringify(sampleBlunder));
        });

        await page.reload();
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        const badge = page.locator('[data-testid="sidebar-blunder-count-badge"]');
        await expect(badge).toBeVisible();
        const text = await badge.textContent();
        expect(Number(text?.trim())).toBeGreaterThanOrEqual(1);
    });

    test('4. Crawl 100 % des liens de la Sidebar : zéro 404, zéro pageerror, retour salon', async ({ page }) => {
        const routesToTest = [
            { testId: 'sidebar-my-quizzes-link', expectedUrlPattern: /\/puzzles/ },
            { testId: 'sidebar-my-blunders-link', expectedUrlPattern: /\/puzzles\?filter=personal-blunders/ },
            { testId: 'sidebar-pillar-studio', expectedUrlPattern: /\/analysis/ },
            { testId: 'sidebar-pillar-academy', expectedUrlPattern: /\/academy/ },
            { testId: 'sidebar-pillar-tournaments', expectedUrlPattern: /\/tournaments/ },
        ];

        for (const item of routesToTest) {
            const pageErrors: string[] = [];
            page.on('pageerror', (err) => pageErrors.push(err.message));

            await page.goto('/?gate=expert');
            await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

            const link = page.locator(`[data-testid="${item.testId}"]`);
            await expect(link).toBeVisible();

            const startTime = Date.now();
            await link.click();

            // Attendre le changement d'URL en navigation SPA
            await expect(page).toHaveURL(item.expectedUrlPattern, { timeout: 10000 });
            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(12000); // Seuil de réactivité

            // Vérifier l'absence de crash 404 ou erreur de page
            expect(pageErrors).toEqual([]);
            const notFoundHeading = page.locator('text=404');
            await expect(notFoundHeading).not.toBeVisible();

            // Retour salon
            await page.goto('/?gate=expert');
        }
    });

    test('5. Support bilingue FR <-> EN de tous les libellés de la Sidebar', async ({ page }) => {
        await page.goto('/?gate=expert');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        const toggleBtn = page.locator('[data-testid="navbar-locale-toggle-btn"]');
        await expect(toggleBtn).toBeVisible();

        // Si pas en FR, cliquer pour passer en FR
        const frSpan = toggleBtn.locator('span', { hasText: 'FR' });
        const frClass = await frSpan.getAttribute('class');
        if (!frClass?.includes('text-[#D4AF37]')) {
            await toggleBtn.click();
        }

        await expect(page.locator('[data-testid="sidebar-my-quizzes-link"]')).toContainText('Mes Quiz');
        await expect(page.locator('[data-testid="sidebar-my-blunders-link"]')).toContainText('Mes Blunders');
        await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toContainText('Studio d’Analyse');

        // Bascule en EN
        await toggleBtn.click();
        await expect(page.locator('[data-testid="sidebar-my-quizzes-link"]')).toContainText('My Quizzes');
        await expect(page.locator('[data-testid="sidebar-my-blunders-link"]')).toContainText('My Blunders');
        await expect(page.locator('[data-testid="sidebar-pillar-studio"]')).toContainText('Analysis Studio');
    });
});
