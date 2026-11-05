import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/fix_8_photo_bugs_guided_play.spec.ts
 * @description Validation E2E Playwright des 8 correctifs chirurgicaux de la Partie Guidée (/play).
 */

test.describe('🎯 AUDIT & CERTIFICATION E2E : 8 CORRECTIFS PHOTO PARTIE GUIDÉE (/play)', () => {

    test('1. Vérification complète des 8 points en Mode Débutant / Partie Guidée', async ({ page }) => {
        // Accès direct avec la porte Débutant active
        await page.goto('/play?gate=beginner');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // -------------------------------------------------------------------------
        // BUG 8 : Badge Navbar Débutant (Zéro jargon technique Open Sage)
        // -------------------------------------------------------------------------
        const versionBadge = page.locator('[data-testid="app-version-badge"]').first();
        await expect(versionBadge).toBeVisible();
        await expect(versionBadge).toHaveText(/(?:Mode Débutant • Partie Guidée|Beginner Mode • Guided Play)/);
        await expect(versionBadge).not.toContainText('v3.1 • 3-Ply • Open Sage');

        // -------------------------------------------------------------------------
        // BUG 2 : Carte Adversaire = "Le Professeur" / "MENTOR PÉDAGOGIQUE" / "• Partie Guidée"
        // -------------------------------------------------------------------------
        const leftRail = page.locator('[data-testid="board-left-player-rail"]');
        await expect(leftRail).toBeVisible();

        const oppName = leftRail.locator('span.font-display').first();
        await expect(oppName).toHaveText(/(?:Le Professeur|The Professor)/);
        await expect(oppName).not.toContainText('Le Mauvais Joueur');

        // Badge mentor pédagogique
        await expect(leftRail).toHaveText(/(?:MENTOR PÉDAGOGIQUE|TEACHING MENTOR)/);
        await expect(leftRail).not.toContainText('BLITZ AGRESSIF');

        // Sous-badge Partie Guidée
        const botEngineBadge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        await expect(botEngineBadge).toContainText('• Partie Guidée');

        // -------------------------------------------------------------------------
        // BUG 5 : Plaque Videau & Match — Zéro troncature "Match .pts"
        // -------------------------------------------------------------------------
        await expect(leftRail).toContainText('Match 3 pts');
        await expect(leftRail).not.toContainText('Match .pts');

        // -------------------------------------------------------------------------
        // BUG 6 : Zéro bouton "Invitation 1-Clic" parasite dans le rail gauche
        // -------------------------------------------------------------------------
        const leftRailInvite = leftRail.locator('button:has-text("Invitation 1-Clic"), button:has-text("Invitation")');
        await expect(leftRailInvite).toHaveCount(0);

        // En revanche, le bouton officiel de partage est bien présent dans la top bar
        const topBarInvite = page.locator('[data-testid="instant-friend-invite-btn"]');
        await expect(topBarInvite).toBeVisible();

        // -------------------------------------------------------------------------
        // BUG 7 : Carte Joueur en bas à gauche = "JOUEUR • PARTIE GUIDÉE" et "Vous (Élève)"
        // -------------------------------------------------------------------------
        const playerBadge = page.locator('[data-testid="left-rail-guided-player-badge"]');
        await expect(playerBadge).toBeVisible();
        await expect(playerBadge).toHaveText(/(?:JOUEUR • PARTIE GUIDÉE|PLAYER • GUIDED PLAY)/);

        const playerName = leftRail.locator('span.font-display').last();
        await expect(playerName).toHaveText(/(?:Vous \(Élève\)|You \(Student\))/);

        // Zéro bouton parasite au-dessus de SORTIE
        const orientationBtnAboveTray = page.locator('[data-testid="orientation-toggle"]');
        await expect(orientationBtnAboveTray).toHaveCount(0);

        // -------------------------------------------------------------------------
        // BUG 4 : Message du Professeur avec bouton "LANCER LES DÉS" actif
        // -------------------------------------------------------------------------
        const rollBtn = page.locator('[data-testid="board-roll-dice-btn"]');
        if (await rollBtn.isVisible()) {
            const dialogueText = page.locator('[data-testid="professor-dialogue-text"]');
            await expect(dialogueText).toBeVisible();
            await expect(dialogueText).toHaveText(/(?:Le Professeur :|The Professor:)/);
            await expect(dialogueText).toHaveText(/(?:Lancer les dés|Roll Dice)/);
            // Zéro injection de "Blitz Agressif" dans le dialogue du Professeur
            await expect(dialogueText).not.toContainText('Blitz Agressif');
        }

        // -------------------------------------------------------------------------
        // BUG 1 : Zéro flèche fantôme quand les dés ne sont pas lancés
        // -------------------------------------------------------------------------
        if (await rollBtn.isVisible()) {
            const coachArrows = page.locator('[data-testid="coach-arrows"]');
            const arrowCount = await coachArrows.count();
            if (arrowCount > 0) {
                const optimalArrows = coachArrows.locator('[data-testid^="coach-optimal-arrow"]');
                await expect(optimalArrows).toHaveCount(0);
            }
        }

        // -------------------------------------------------------------------------
        // BUG 3 : Compas de course dynamique et non-inversé
        // -------------------------------------------------------------------------
        const raceCompass = page.locator('[data-testid="beginner-race-compass"]');
        await expect(raceCompass).toBeVisible();
        const compassText = await raceCompass.innerText();
        expect(compassText).toMatch(/Course|embuscade|serrée|Race|Ambush|Tight/i);
    });

    test('2. Mode Expert : badge v3.1 • 3-Ply • Open Sage préservé', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        const versionBadge = page.locator('[data-testid="app-version-badge"]');
        await expect(versionBadge).toBeVisible();
        await expect(versionBadge).toContainText('v3.1 • 3-Ply • Open Sage');
    });
});
