import { test, expect } from '@playwright/test';

test.describe('Partie Guidée Débutant — Sublimation UX & Flèches Dorées Automatiques', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
        });
    });

    test('Vérifie le tracé auto des flèches dorées, le langage naturel du Professeur, le bandeau 2 lignes et le mode À votre rythme', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/play?gate=beginner&start=guided');
        await page.waitForLoadState('domcontentloaded');

        // 1. Vérification initiale : Bandeau du Professeur visible
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // 2. Vérification que la ligne redondante "Sens de marche : Case 24" a bien été supprimée du bandeau
        const overlayText = await overlay.innerText();
        expect(overlayText).not.toContain('Sens de marche : Case 24 (Adverse)');
        expect(overlayText).not.toContain('Direction: Point 24 (Opponent)');

        // 3. Vérification de la présence du badge permanent "🏠 Votre Maison (Sortie)" en bas à droite
        const bearOffBadge = page.locator('[data-testid="home-board-bearoff-badge"]');
        await expect(bearOffBadge).toBeVisible();
        await expect(bearOffBadge).toContainText('Votre Maison (Sortie)');

        // 4. Vérification de la pendule : "À votre rythme" affiché à la place du chrono de tournoi
        const paceBadge = page.locator('[data-testid="left-rail-guided-pace-badge"]');
        await expect(paceBadge).toBeVisible();
        await expect(paceBadge).toContainText('À votre rythme');

        // 5. Si les dés ne sont pas encore lancés, lancer les dés
        const rollBtn = page.locator('[data-testid="center-roll-button"]');
        if (await rollBtn.count() > 0 && await rollBtn.isVisible()) {
            await rollBtn.click();
        }

        // 6. Vérification des flèches dorées automatiques sur le plateau
        const optimalArrow = page.locator('[data-testid="coach-optimal-arrow-0"]');
        await expect(optimalArrow).toBeVisible({ timeout: 10000 });

        // Vérification de la présence du halo doré cible
        const targetHalo = page.locator('[data-testid="coach-optimal-target-halo-0"]');
        await expect(targetHalo).toBeVisible();

        // 7. Vérification du langage naturel du Professeur : aucun code brut "13/7 8/7"
        const dialogueTextEl = page.locator('[data-testid="professor-dialogue-text"]');
        await expect(dialogueTextEl).toBeVisible();
        const dialogueText = await dialogueTextEl.innerText();
        expect(dialogueText).not.toContain('13/7 8/7');
        expect(dialogueText).not.toContain('ancrer tes pions');
        // Doit faire référence aux flèches dorées ou au bouclier (FR ou EN)
        expect(dialogueText).toMatch(/flèche|flèches|Bouclier|Porte|arrow|arrows|Shield|Gate/i);

        // 8. Vérification du bouton toggle "👁️ Masquer les flèches"
        const showArrowBtn = page.locator('[data-testid="professor-show-arrow-btn"]');
        await expect(showArrowBtn).toBeVisible();
        await expect(showArrowBtn).toContainText(/Masquer les flèches|Hide arrows/i);

        // Clic pour masquer les flèches
        await showArrowBtn.click();
        await expect(showArrowBtn).toContainText(/Afficher les flèches|Show arrows/i);
        await expect(optimalArrow).not.toBeVisible();

        // Clic pour ré-afficher les flèches
        await showArrowBtn.click();
        await expect(showArrowBtn).toContainText(/Masquer les flèches|Hide arrows/i);
        await expect(optimalArrow).toBeVisible();

        // 9. Vérification du bouton Doubler : aucun attribut title natif générant de tooltip blanc
        const doubleBtn = page.locator('[data-testid="center-double-button"]');
        if (await doubleBtn.count() > 0) {
            const titleAttr = await doubleBtn.getAttribute('title');
            expect(titleAttr).toBeNull();

            // Clic sur Doubler prématuré -> le Professeur avertit gentiment
            await doubleBtn.click();
            const warningText = await dialogueTextEl.innerText();
            expect(warningText).toMatch(/Pas encore|Not yet/i);
        }

        // Aucune erreur de rendu
        expect(pageErrors.length).toBe(0);
    });
});
