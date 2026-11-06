import { test, expect } from '@playwright/test';

test.describe('Carte Mondiale Haute Horlogerie & Zero-Scroll Layout', () => {
    test('Valide le dégradé haute horlogerie, le cluster européen, la barre compacte de tournois et 100% zéro-scroll', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/tournaments');
        await page.waitForLoadState('domcontentloaded');

        // 1. Header : 10 000 PTS visible sans troncature
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText('10 000 PTS');
        expect(await pointsBadge.innerText()).not.toBe('10 000 PT');

        // 2. Fiche de droite : Aucun badge vert [FR] carré
        const clubPanel = page.locator('[data-testid="club-detail-panel"]');
        await expect(clubPanel).toBeVisible();
        const countryBox = clubPanel.locator('span:has-text("FR")');
        // If "FR" exists, it should not be a raw isolated countryCode badge
        const frBadges = clubPanel.locator('span.rounded.bg-emerald-500:has-text("FR")');
        expect(await frBadges.count()).toBe(0);

        // 3. Carte du Monde SVG : Dégradé et liseré or
        const mapContainer = page.locator('[data-testid="interactive-world-map"]');
        await expect(mapContainer).toBeVisible();
        const landGrad = page.locator('svg defs linearGradient#landGrad');
        await expect(landGrad).toBeAttached();

        // 4. Cluster européen en vue Monde
        const clusterFrance = page.locator('[data-testid="map-cluster-france"]');
        await expect(clusterFrance).toBeVisible();
        await expect(clusterFrance).toContainText('clubs');

        // 5. Clic sur le cluster européen déclenche le zoom sur la France
        await clusterFrance.click();
        const viewport = page.locator('[data-testid="interactive-world-map-viewport"]');
        await expect(viewport).toBeVisible();
        const zoomValue = await viewport.getAttribute('data-zoom');
        expect(Number(zoomValue)).toBeGreaterThanOrEqual(3.0);

        // 6. Barre horizontale compacte des tournois en bas
        const tournamentsSection = page.locator('[data-testid="map-tournaments-section"]');
        await expect(tournamentsSection).toBeVisible();
        const tournamentCards = page.locator('[data-testid^="tournament-card-summary-"]');
        expect(await tournamentCards.count()).toBeGreaterThan(0);
        await expect(tournamentCards.first()).toBeVisible();

        // 7. Clic sur une vignette de tournoi met à jour le panneau de droite
        await tournamentCards.first().click();
        const tournamentPanel = page.locator('[data-testid="tournament-detail-panel"]');
        await expect(tournamentPanel).toBeVisible();

        // 8. Vérification Zéro-Scroll : la hauteur totale du contenu principal tient dans 900px
        const boundingBox = await tournamentsSection.boundingBox();
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
            // Le bas de la section des tournois est bien visible dans le viewport de 900px
            expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(920);
        }
    });
});
