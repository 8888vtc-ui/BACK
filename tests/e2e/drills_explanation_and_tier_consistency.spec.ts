import { test, expect } from '@playwright/test';

test.describe('Cohérence des explications physiques et des paliers sur /drills et /puzzles', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_player_gate', 'EXPERT');
        });
    });

    test('Vérifie sur /drills (Mode Expert) : v3.1, Rating non coupé, cohérence Palier vs ER/PR et précision 100 %', async ({ page }) => {
        await page.goto('/drills?gate=EXPERT');
        await page.waitForLoadState('domcontentloaded');

        // 1. Version v3.1 • 3-Ply
        const versionBadge = page.locator('[data-testid="app-version-badge"]');
        await expect(versionBadge).toBeVisible();
        await expect(versionBadge).toHaveText('v3.1 • 3-Ply');

        // 2. Rating : 1500 visible et non coupé
        const ratingBadge = page.locator('[data-testid="quiz-elo-rating-badge"]');
        await expect(ratingBadge).toBeVisible();
        await expect(ratingBadge).toContainText('Rating : 1500');

        // 3. Pas de "Palier 1 · Débutant" si ER / PR <= 12.0
        const targetBadge = page.locator('[data-testid="quiz-nplus1-target-badge"]');
        await expect(targetBadge).toBeVisible();
        const targetText = await targetBadge.innerText();
        const erMatch = targetText.match(/ER \/ PR ([\d.]+)/);
        const erValue = erMatch ? parseFloat(erMatch[1]) : 5.5;

        const tierBadge = page.locator('[data-testid="drill-position-card"]').locator('span:has-text("Palier")');
        await expect(tierBadge).toBeVisible();
        const tierText = await tierBadge.innerText();

        if (erValue <= 12.0) {
            expect(tierText).not.toContain('Palier 1 · Débutant');
        }
        if (erValue <= 8.0 && erValue > 5.0) {
            expect(tierText).toContain('Palier 3 · Intermédiaire / Compétition');
        }

        // 4. Clic sur le coup optimal A
        const choiceBtnA = page.locator('[data-testid="quiz-choice-btn-A"]');
        await expect(choiceBtnA).toBeVisible();
        await choiceBtnA.click();

        // 5. Vérification du feedback : Précision 100 %, zéro doublon Équité 100%
        const feedbackBanner = page.locator('[data-testid="drill-feedback-banner"]');
        await expect(feedbackBanner).toBeVisible();

        const verdictHeader = page.locator('[data-testid="coach-verdict-header"]');
        const headerText = await verdictHeader.innerText();
        expect(headerText).toContain('Précision 100 %');
        expect(headerText).not.toContain('Équité 100%');

        // Le 2e badge doublon coach-win-drop-badge ne doit pas être rendu sur coup optimal
        const dropBadge = page.locator('[data-testid="coach-win-drop-badge"]');
        await expect(dropBadge).toHaveCount(0);

        // 6. Vérification de l'explication optimale
        const optimalExplanation = page.locator('[data-testid="coach-block-2-optimal"]');
        await expect(optimalExplanation).toBeVisible();
        const explanationText = await optimalExplanation.innerText();

        if (explanationText.includes('14/11 13/8')) {
            expect(explanationText).not.toContain('verrouille tes portes clés');
            expect(explanationText).toContain('champ extérieur');
        }
    });

    test('Vérifie sur /puzzles (Mode Débutant) : masquage du jargon et français simple', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.goto('/puzzles?gate=BEGINNER');
        await page.waitForLoadState('domcontentloaded');

        // Badge débutant affiché au lieu du badge v3.1 technique
        const beginnerBadge = page.locator('[data-testid="beginner-friendly-badge"]');
        await expect(beginnerBadge).toBeVisible();

        // Rating intact
        const ratingBadge = page.locator('[data-testid="quiz-elo-rating-badge"]');
        await expect(ratingBadge).toBeVisible();
        await expect(ratingBadge).toContainText('Rating : 1500');

        // Contexte sans "away / away"
        const contextGrid = page.locator('[data-testid="drill-match-context-grid"]');
        await expect(contextGrid).toBeVisible();
        const contextText = await contextGrid.innerText();
        expect(contextText).not.toContain('6-away');
    });
});
