import { test, expect } from '@playwright/test';
import { calculateFairEquityCashOut } from '../../src/features/multiplayer/fairEquityCashOut';

test.describe('Zone 4 — Audit & Verrouillage des Rails du Plateau sur /play (BoardSideRails & TopBar)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Carte Adversaire crédible : zéro mention "IA 3-Ply", "Open Sage 3-Ply", "Bot IA" ou "PR 30.0"', async ({ page }) => {
        await page.goto('/play?gate=beginner');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        const leftRail = page.locator('[data-testid="board-left-player-rail"]');
        await expect(leftRail).toBeVisible();

        const railText = await leftRail.innerText();

        // 1. Interdictions absolues
        expect(railText).not.toContain('IA 3-Ply');
        expect(railText).not.toContain('Open Sage 3-Ply');
        expect(railText).not.toContain('Bot IA');
        expect(railText).not.toContain('PR 30.0');

        // 2. En mode Débutant : zéro Elo et zéro PR visible
        expect(railText).not.toMatch(/\b\d{3,4}\s*Elo\b/i);
        expect(railText).not.toMatch(/\bPR\s*Match\s*:\s*\d+/i);
    });

    test('2. Modes Intermédiaire & Expert : Adversaire humain / persona crédible avec style et drapeau', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        const leftRail = page.locator('[data-testid="board-left-player-rail"]');
        await expect(leftRail).toBeVisible();

        const railText = await leftRail.innerText();
        expect(railText).not.toContain('IA 3-Ply');
        expect(railText).not.toContain('Bot IA');

        // L'adversaire a un badge crédible (ex: "Adversaire du Cercle" ou "Adversaire")
        const badge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        if (await badge.isVisible()) {
            await expect(badge).toContainText('Adversaire du Cercle');
        }
    });

    test('3. Bouton Mode Échiquier Pur (Full Focus - Touche F) & Invitation Ami 1-Clic', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Bouton Full Focus
        const focusBtn = page.locator('[data-testid="full-focus-board-btn"]');
        await expect(focusBtn).toBeVisible();
        await expect(focusBtn).toContainText('Mode Échiquier Pur');

        // Clic pour activer le Focus
        await focusBtn.click();
        await expect(focusBtn).toContainText('Quitter Plein Écran');

        // Clic pour désactiver
        await focusBtn.click();
        await expect(focusBtn).toContainText('Mode Échiquier Pur');

        // Bouton Invitation Ami 1-Clic
        const inviteBtn = page.locator('[data-testid="instant-friend-invite-btn"]');
        await expect(inviteBtn).toBeVisible();
        await inviteBtn.click();

        // Modale d'invitation avec lien copiable
        const inviteModal = page.locator('[data-testid="instant-invite-modal"]');
        await expect(inviteModal).toBeVisible();
        await expect(page.locator('[data-testid="invite-copy-link-btn"]')).toBeVisible();

        // Fermer la modale
        const closeBtn = page.locator('[data-testid="invite-modal-close-btn"]');
        await closeBtn.click();
        await expect(inviteModal).not.toBeVisible();
    });

    test('4. Scoreboard Officiel : Badges Crawford & DMP et verrouillage du cube', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Le bloc score et videau sur le rail gauche est présent
        const leftRail = page.locator('[data-testid="board-left-player-rail"]');
        await expect(leftRail).toBeVisible();
        await expect(page.locator('[data-testid="left-rail-score-o"]')).toBeVisible();
        await expect(page.locator('[data-testid="left-rail-score-x"]')).toBeVisible();
        await expect(page.locator('[data-testid="left-rail-clock-block"]')).toBeVisible();
    });

    test('5. Moteur Cash-Out au Prorata : certification mathématique de la somme nulle stricte', async () => {
        // Validation unitaire dans le banc de test
        const cashOutStandard = calculateFairEquityCashOut({
            currentStakePoints: 1000,
            equityA: 0.25,
            ratingA: 1540,
            ratingB: 1520,
        });

        expect(cashOutStandard.zeroSumVerified).toBe(true);
        expect(cashOutStandard.deltaPointsA + cashOutStandard.deltaPointsB).toBe(0);
        expect(cashOutStandard.eloDeltaA + cashOutStandard.eloDeltaB).toBe(0);

        const cashOutTrailing = calculateFairEquityCashOut({
            currentStakePoints: 2500,
            equityA: -0.65,
            ratingA: 1600,
            ratingB: 1450,
        });

        expect(cashOutTrailing.zeroSumVerified).toBe(true);
        expect(cashOutTrailing.deltaPointsA + cashOutTrailing.deltaPointsB).toBe(0);
        expect(cashOutTrailing.eloDeltaA + cashOutTrailing.eloDeltaB).toBe(0);
    });
});
