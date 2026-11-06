import { test, expect } from '@playwright/test';

test.describe('Day 12: 100% Bilingual FR/EN Live Professor and Board on /play', () => {
    test('FR Mode: verifies all Guided Play & Board texts are strictly in French', async ({ page }) => {
        await page.goto('/play?start=guided&lang=fr');
        await page.waitForLoadState('networkidle');

        // Check Left Rail / Professor card
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible({ timeout: 10000 });
        const leftRail = page.getByTestId('board-left-player-rail');
        await expect(leftRail).toContainText('Le Professeur');
        await expect(leftRail).toContainText('MENTOR PÉDAGOGIQUE');
        await expect(leftRail).toContainText('JOUEUR • PARTIE GUIDÉE');
        await expect(leftRail).toContainText('Joueur Invité');

        // Check Top Bar
        const inviteBtn = page.getByTestId('instant-friend-invite-btn');
        await expect(inviteBtn).toBeVisible();
        await expect(inviteBtn).toContainText('Inviter un ami');

        const pureBoardBtn = page.getByTestId('full-focus-board-btn');
        await expect(pureBoardBtn).toContainText('Mode Échiquier Pur');

        // Check Live Professor Coach Overlay
        const professorOverlay = page.getByTestId('live-professor-coach-overlay');
        await expect(professorOverlay).toBeVisible();
        await expect(professorOverlay).toContainText('PROFESSEUR INTERACTIF');
        await expect(page.getByTestId('professor-open-guide-btn')).toContainText('Guide 6 Chapitres');
        await expect(page.getByTestId('professor-undo-move-btn')).toContainText('Rejouer le coup');

        const arrowBtn = page.getByTestId('professor-show-arrow-btn');
        if (await arrowBtn.isVisible()) {
            await expect(arrowBtn).toContainText('Masquer les flèches');
        }

        // Strict French check: 0 English leakage
        const overlayText = await professorOverlay.textContent();
        expect(overlayText).not.toContain('The Professor');
        expect(overlayText).not.toContain('TEACHING MENTOR');
        expect(overlayText).not.toContain('INTERACTIVE PROFESSOR');
        expect(overlayText).not.toContain('Hide arrows');
        expect(overlayText).not.toContain('6-Chapter Guide');
        expect(overlayText).not.toContain('Undo / Retry move');

        const leftRailText = await leftRail.textContent();
        expect(leftRailText).not.toContain('The Professor');
        expect(leftRailText).not.toContain('TEACHING MENTOR');
        expect(leftRailText).not.toContain('PLAYER • GUIDED PLAY');
        expect(leftRailText).not.toContain('Guest Player');
    });

    test('EN Mode: verifies all Guided Play & Board texts are strictly in English', async ({ page }) => {
        await page.goto('/play?start=guided&lang=en');
        await page.waitForLoadState('networkidle');

        // Check Left Rail / Professor card
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible({ timeout: 10000 });
        const leftRail = page.getByTestId('board-left-player-rail');
        await expect(leftRail).toContainText('The Professor');
        await expect(leftRail).toContainText('TEACHING MENTOR');
        await expect(leftRail).toContainText('PLAYER • GUIDED PLAY');
        await expect(leftRail).toContainText('Guest Player');

        // Check Top Bar
        const inviteBtn = page.getByTestId('instant-friend-invite-btn');
        await expect(inviteBtn).toBeVisible();
        await expect(inviteBtn).toContainText('Invite a Friend');

        const pureBoardBtn = page.getByTestId('full-focus-board-btn');
        await expect(pureBoardBtn).toContainText('Pure Board Mode');

        // Check Live Professor Coach Overlay
        const professorOverlay = page.getByTestId('live-professor-coach-overlay');
        await expect(professorOverlay).toBeVisible();
        await expect(professorOverlay).toContainText('INTERACTIVE PROFESSOR');
        await expect(page.getByTestId('professor-open-guide-btn')).toContainText('6-Chapter Guide');
        await expect(page.getByTestId('professor-undo-move-btn')).toContainText('Undo / Retry move');

        const arrowBtn = page.getByTestId('professor-show-arrow-btn');
        if (await arrowBtn.isVisible()) {
            await expect(arrowBtn).toContainText('Hide arrows');
        }

        // Strict English check: 0 French leakage
        const overlayText = await professorOverlay.textContent();
        expect(overlayText).not.toContain('Le Professeur');
        expect(overlayText).not.toContain('MENTOR PÉDAGOGIQUE');
        expect(overlayText).not.toContain('PROFESSEUR INTERACTIF');
        expect(overlayText).not.toContain('Masquer les flèches');
        expect(overlayText).not.toContain('Guide 6 Chapitres');
        expect(overlayText).not.toContain('Rejouer le coup');

        const leftRailText = await leftRail.textContent();
        expect(leftRailText).not.toContain('Le Professeur');
        expect(leftRailText).not.toContain('MENTOR PÉDAGOGIQUE');
        expect(leftRailText).not.toContain('JOUEUR • PARTIE GUIDÉE');
        expect(leftRailText).not.toContain('Joueur Invité');
    });
});
