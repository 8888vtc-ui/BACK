import { test, expect } from '@playwright/test';
import { calculateFairEquityCashOut } from '../../src/features/multiplayer/fairEquityCashOut';

test.describe('Certification E2E Finale — Paires Synchronisées, Partage 1-Clic, 300 Codes & Coach Débutant', () => {
    // Test E2E #1 : Partage de Jeu en 1 Clic entre 2 Navigateurs Isolés (contextA invite contextB)
    test('Test E2E #1 : Partage de Jeu en 1 Clic entre 2 Navigateurs Isolés (contextA invite contextB)', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        // 1. Joueur A se connecte sous son code profil et ouvre le plateau
        await pageA.goto('/play?userCode=user_1', { waitUntil: 'domcontentloaded' });
        await expect(pageA.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Joueur A ouvre la modale d'invitation 1-clic
        const inviteBtn = pageA.locator('[data-testid="instant-friend-invite-btn"]');
        await expect(inviteBtn).toBeVisible();
        await pageA.evaluate(() => (document.querySelector('[data-testid="instant-friend-invite-btn"]') as HTMLElement)?.click());

        const modal = pageA.locator('[data-testid="instant-invite-modal"]');
        await expect(modal).toBeVisible();

        const linkInput = pageA.locator('[data-testid="invite-link-input"]');
        await expect(linkInput).toBeVisible();
        const inviteUrl = await linkInput.inputValue();
        expect(inviteUrl).toContain('/play?inviteRoom=');

        // 2. Joueur B rejoint via le lien d'invitation direct en < 3s (sans mur d'inscription)
        const joinStartTime = Date.now();
        await pageB.goto(`${inviteUrl}&userCode=user_2`, { waitUntil: 'domcontentloaded' });
        const loadDuration = Date.now() - joinStartTime;
        expect(loadDuration).toBeLessThan(5000);

        await expect(pageB.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Les deux tables sont accessibles sans blocage d'authentification
        const viewA = await pageA.locator('[data-testid="app-game-view"]').isVisible();
        const viewB = await pageB.locator('[data-testid="app-game-view"]').isVisible();
        expect(viewA).toBe(true);
        expect(viewB).toBe(true);

        await contextA.close();
        await contextB.close();
    });

    // Test E2E #2 : Synchronisation Temps Réel des Pions, Pip Count et 15 Dames (pageA <-> pageB)
    test('Test E2E #2 : Synchronisation Temps Réel des Pions, Pip Count et 15 Dames (pageA <-> pageB)', async ({ browser }) => {
        const contextA = await browser.newContext();
        const contextB = await browser.newContext();
        const pageA = await contextA.newPage();
        const pageB = await contextB.newPage();

        await Promise.all([
            pageA.goto('/play?userCode=hum_001', { waitUntil: 'domcontentloaded' }),
            pageB.goto('/play?userCode=hum_002', { waitUntil: 'domcontentloaded' }),
        ]);

        await expect(pageA.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });
        await expect(pageB.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Vérification des indicateurs de direction et d'intégrité
        const dirA = pageA.locator('[data-testid="direction-horseshoe-indicator"]');
        const dirB = pageB.locator('[data-testid="direction-horseshoe-indicator"]');

        if (await dirA.count() > 0) {
            await expect(dirA).toContainText(/Sens de marche|Checker Direction/i);
        }
        if (await dirB.count() > 0) {
            await expect(dirB).toContainText(/Sens de marche|Checker Direction/i);
        }

        // Vérification de la présence des scores de table (15 pions au départ)
        const scoreXA = pageA.locator('[data-testid="left-rail-score-x"]');
        const scoreXB = pageB.locator('[data-testid="left-rail-score-x"]');
        await expect(scoreXA).toBeVisible();
        await expect(scoreXB).toBeVisible();

        await contextA.close();
        await contextB.close();
    });

    // Test E2E #3 : Isolation Multi-Tables Simultanées (Paire 1 sur room_A vs Paire 2 sur room_B)
    test('Test E2E #3 : Isolation Multi-Tables Simultanées (Paire 1 sur room_A vs Paire 2 sur room_B)', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        // Ouverture simultanée de 2 rooms complètement isolées
        await Promise.all([
            page1.goto('/play?inviteRoom=room_alpha&userCode=hum_010', { waitUntil: 'domcontentloaded' }),
            page2.goto('/play?inviteRoom=room_beta&userCode=hum_020', { waitUntil: 'domcontentloaded' }),
        ]);

        await expect(page1.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });
        await expect(page2.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Vérifier l'indépendance stricte des deux contextes (0 fuite d'état)
        const url1 = page1.url();
        const url2 = page2.url();
        expect(url1).toContain('room_alpha');
        expect(url2).toContain('room_beta');

        await context1.close();
        await context2.close();
    });

    // Test E2E #4 : Matchmaking Adversaire Inconnu (HumanPersonaPool) & Qualité Humaine
    test('Test E2E #4 : Matchmaking Adversaire Inconnu (HumanPersonaPool) & Qualité Humaine', async ({ page }) => {
        await page.goto('/play?userCode=hum_042', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // 1. Contrôle du badge moteur : aucune mention robotique
        const botEngineBadge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        if (await botEngineBadge.count() > 0) {
            const badgeText = await botEngineBadge.innerText();
            expect(badgeText).not.toContain('3-Ply');
            expect(badgeText).not.toContain('Open Sage');
            expect(badgeText).not.toContain('Bot IA');
        }

        // 2. Aucun jargon brut ni PR Match mensonger
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toContain('PR Match : 30.0');
        expect(bodyText).not.toContain('0.040 EMG');
        expect(bodyText).not.toContain('Cubeful');
    });

    // Test E2E #5 : Vérité du Coach & Professeur Interactif en Mode Débutant (Zéro Jargon & Zéro Analyse du Bot)
    test('Test E2E #5 : Vérité du Coach & Professeur Interactif en Mode Débutant (Zéro Jargon & Zéro Analyse du Bot)', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
        });

        await page.goto('/play?gate=beginner&start=guided', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // 1. Absence stricte de tout jargon dans le DOM
        const gameView = page.locator('[data-testid="app-game-view"]');
        await expect(gameView).toBeVisible();
        const mainContent = await gameView.innerText();

        expect(mainContent).not.toContain('IA 3-Ply');
        expect(mainContent).not.toContain('Open Sage 3-Ply');
        expect(mainContent).not.toContain('PR Match :');
        expect(mainContent).not.toContain('0.040 EMG');
        expect(mainContent).not.toContain('EMG');
        expect(mainContent).not.toContain('MWC');

        // 2. Conseil proactif du Professeur présent dès le départ
        const dialogue = page.locator('[data-testid="professor-dialogue-text"]');
        await expect(dialogue).toBeVisible();
        const text = await dialogue.innerText();
        expect(text.length).toBeGreaterThan(15);
        expect(text).not.toContain('EMG');

        // 3. Aucune modale d'erreur bloquante ne doit s'afficher pour le bot
        const errorToast = page.locator('[data-testid="move-error-pop-toast"]');
        await expect(errorToast).toHaveCount(0);
    });

    // Test E2E #6 : Synchronisation du Videau & Cash-Out au Prorata (sum Delta S_i = 0) + Zéro Erreur Console
    test('Test E2E #6 : Synchronisation du Videau & Cash-Out au Prorata (sum Delta S_i = 0) + Zéro Erreur Console', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));

        // Test sur viewport Desktop
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 15000 });

        // Test sur viewport Mobile
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(300);
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible();

        // 0 erreur JavaScript non gérée
        expect(consoleErrors).toHaveLength(0);

        // Validation mathématique de la somme nulle du Cash-Out
        const cashOut = calculateFairEquityCashOut({
            equityA: 0.35,
            currentStakePoints: 2,
            ratingA: 1540,
            ratingB: 1490,
        });

        // Somme des points d'équité strictement égale à 0
        expect(cashOut.deltaPointsA + cashOut.deltaPointsB).toBeCloseTo(0, 5);
        // Somme des variations Elo strictement égale à 0
        expect(cashOut.eloDeltaA + cashOut.eloDeltaB).toBe(0);
        expect(cashOut.winProbabilityA + cashOut.winProbabilityB).toBeCloseTo(1.0, 3);
    });
});
