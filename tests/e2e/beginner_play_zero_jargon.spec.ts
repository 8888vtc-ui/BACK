import { test, expect } from '@playwright/test';

test.describe('Beginner Guided Play — Zéro Jargon & Zéro Badges Mensongers', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
        });
    });

    test('1. Vérifie la purge totale des badges 3-Ply, Open Sage et PR Match sur la page de jeu /play', async ({ page }) => {
        await page.goto('/play');
        await page.waitForLoadState('domcontentloaded');

        // Attendre que le plateau ou l'overlay du professeur soit chargé
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // 1. Contrôle des étiquettes adversaire
        const botEngineBadge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        if (await botEngineBadge.count() > 0) {
            const badgeText = await botEngineBadge.innerText();
            expect(badgeText).not.toContain('3-Ply');
            expect(badgeText).not.toContain('Open Sage');
            expect(badgeText).toContain('Partie Guidée');
        }

        // 2. Contrôle d'absence stricte de 'PR Match' en mode Débutant
        const playerPr = page.locator('[data-testid="left-rail-player-pr"]');
        await expect(playerPr).toHaveCount(0);

        // 3. Contrôle du contenu visible du plateau : aucun "IA 3-Ply" ni "Open Sage 3-Ply"
        const gameView = page.locator('[data-testid="app-game-view"]');
        await expect(gameView).toBeVisible();
        const mainContent = await gameView.innerText();
        expect(mainContent).not.toContain('IA 3-Ply');
        expect(mainContent).not.toContain('Open Sage 3-Ply');
        expect(mainContent).not.toContain('PR Match :');

        // 4. Contrôle de l'absence de jargon moteur brut (EMG, MWC)
        expect(mainContent).not.toContain('0.040 EMG');
        expect(mainContent).not.toContain('% MWC');

        // 5. Présence de l'indicateur de direction
        const directionIndicator = page.locator('[data-testid="direction-horseshoe-indicator"]');
        await expect(directionIndicator).toBeVisible();
        await expect(directionIndicator).toContainText(/Sens de marche|Checker Direction/i);
    });
});
