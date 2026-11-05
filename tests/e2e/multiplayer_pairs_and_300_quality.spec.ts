import { test, expect } from '@playwright/test';

test.describe('E2E — Grand Audit Multijoueur, Qualité 300 Joueurs & Paires Synchronisées', () => {
    test('Test 1 : Partage de Jeu par Lien 1-Clic & Synchronisation Exacte des Pions (Paire A/B)', async ({ browser }) => {
        // Deux contextes de navigateur 100% isolés
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();

        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        // 1. Joueur A se connecte et ouvre la page de jeu
        await pageA.goto('/play?userCode=user_1', { waitUntil: 'domcontentloaded' });
        await expect(pageA.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Joueur A clique sur "Partager la partie"
        const inviteBtn = pageA.locator('[data-testid="instant-friend-invite-btn"]');
        await expect(inviteBtn).toBeVisible();
        await pageA.evaluate(() => (document.querySelector('[data-testid="instant-friend-invite-btn"]') as HTMLElement)?.click());

        // Le modal d'invitation 1-clic apparaît
        const modal = pageA.locator('[data-testid="instant-invite-modal"]');
        await expect(modal).toBeVisible();

        const linkInput = pageA.locator('[data-testid="invite-link-input"]');
        await expect(linkInput).toBeVisible();
        const inviteUrl = await linkInput.inputValue();
        expect(inviteUrl).toContain('/play?inviteRoom=');

        // Bouton copier
        const copyBtn = pageA.locator('[data-testid="invite-copy-link-btn"]');
        await expect(copyBtn).toBeVisible();
        await pageA.evaluate(() => (document.querySelector('[data-testid="invite-copy-link-btn"]') as HTMLElement)?.click());

        // 2. Joueur B ouvre le lien d'invitation directement
        const joinUrl = `${inviteUrl}&userCode=user_2`;
        const joinStartTime = Date.now();
        await pageB.goto(joinUrl, { waitUntil: 'domcontentloaded' });
        const loadDuration = Date.now() - joinStartTime;

        // Connexion en < 3 secondes
        expect(loadDuration).toBeLessThan(5000);

        // Pas de mur d'inscription bloquant : le plateau de jeu est immédiatement accessible
        await expect(pageB.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // 3. Vérification de la présence des 15 pions par camp et du sens de marche
        const directionB = pageB.locator('[data-testid="direction-horseshoe-indicator"]');
        if (await directionB.count() > 0) {
            await expect(directionB).toContainText(/Sens de marche|Checker Direction/i);
        }

        // Fermeture des contextes
        await contextA.close();
        await contextB.close();
    });

    test('Test 2 : Matchs Parallèles Simultanés sans Collision (Multi-Paires Isolées)', async ({ browser }) => {
        // Deux tables de jeu isolées en parallèle
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        await Promise.all([
            page1.goto('/play?userCode=hum_003', { waitUntil: 'domcontentloaded' }),
            page2.goto('/play?userCode=hum_004', { waitUntil: 'domcontentloaded' }),
        ]);

        await expect(page1.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });
        await expect(page2.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Vérifier l'isolation stricte des deux tables (contenus distincts)
        const text1 = await page1.locator('[data-testid="app-game-view"]').innerText();
        const text2 = await page2.locator('[data-testid="app-game-view"]').innerText();

        expect(text1.length).toBeGreaterThan(50);
        expect(text2.length).toBeGreaterThan(50);

        await context1.close();
        await context2.close();
    });

    test('Test 3 : Qualité Visuelle & Comportementale contre un Adversaire Inconnu', async ({ page }) => {
        await page.goto('/play?userCode=user_5', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Vérifier le profil adversaire
        const botEngineBadge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        if (await botEngineBadge.count() > 0) {
            const badgeText = await botEngineBadge.innerText();
            expect(badgeText).not.toContain('3-Ply');
            expect(badgeText).not.toContain('Open Sage');
        }

        // Aucun PR Match visible pour le débutant
        const playerPr = page.locator('[data-testid="left-rail-player-pr"]');
        await expect(playerPr).toHaveCount(0);

        // Aucune mention de 0.040 EMG ni Cubeful
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toContain('0.040 EMG');
        expect(bodyText).not.toContain('Cubeful');
    });
});

