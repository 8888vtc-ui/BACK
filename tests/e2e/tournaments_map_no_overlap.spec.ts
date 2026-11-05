import { test, expect } from '@playwright/test';

test.describe('Carte Mondiale des Tournois & Clubs — Anti-Chevauchement & Layout Côte-à-Côte', () => {
    test('Vérifie le cadrage mondial, l’absence de collision de labels, le layout côte-à-côte et les boutons d’action', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/tournaments');
        await page.waitForLoadState('domcontentloaded');

        // 1. Vérification du Header : 10 000 PTS complet sans coupure en "10 000 PT"
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText('10 000 PTS');
        expect(await pointsBadge.innerText()).not.toBe('10 000 PT');

        // 2. Vérification des pilules de zoom sans emojis drapeaux cassés (FR, EU, US)
        const zoomWorld = page.locator('[data-testid="map-zoom-world"]');
        const zoomFrance = page.locator('[data-testid="map-zoom-france"]');
        const zoomEurope = page.locator('[data-testid="map-zoom-europe"]');
        const zoomAmericas = page.locator('[data-testid="map-zoom-americas"]');
        const zoomAsia = page.locator('[data-testid="map-zoom-asia"]');

        await expect(zoomWorld).toContainText('🌐 Monde');
        await expect(zoomFrance).toContainText('📍 France & Riviera');
        await expect(zoomEurope).toContainText('🏛️ Europe');
        await expect(zoomAmericas).toContainText('🧭 Amériques');
        await expect(zoomAsia).toContainText('✨ Asie & Dubaï');

        // 3. Carte Interactive et Layout Côte-à-Côte
        const mapContainer = page.locator('[data-testid="interactive-world-map"]');
        const detailPanel = page.locator('[data-testid="club-detail-panel"]');
        await expect(mapContainer).toBeVisible();
        await expect(detailPanel).toBeVisible();

        const mapBox = await mapContainer.boundingBox();
        const panelBox = await detailPanel.boundingBox();
        expect(mapBox).not.toBeNull();
        expect(panelBox).not.toBeNull();

        if (mapBox && panelBox) {
            // En layout desktop, la carte est à gauche (col-span-8) et le panneau à droite (col-span-4) sans chevauchement
            expect(mapBox.x + mapBox.width).toBeLessThanOrEqual(panelBox.x + 8);
        }

        // 4. Cadrage Amérique : New York n'est pas coupé à gauche
        const nyLabel = page.locator('[data-testid="map-city-label-usbgf-new-york-masters"]');
        if (await nyLabel.count() > 0) {
            const nyBox = await nyLabel.boundingBox();
            expect(nyBox).not.toBeNull();
            if (nyBox && mapBox) {
                // New York est bien à l'intérieur de la carte avec une marge de sécurité
                expect(nyBox.x).toBeGreaterThan(mapBox.x + 20);
            }
        }

        // 5. Anti-chevauchement des labels en vue Monde : 0 intersection entre les étiquettes visibles
        const visibleLabels = page.locator('[data-testid^="map-city-label-"]');
        const count = await visibleLabels.count();
        const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];

        for (let i = 0; i < count; i++) {
            const label = visibleLabels.nth(i);
            if (await label.isVisible()) {
                const box = await label.boundingBox();
                if (box) boxes.push(box);
            }
        }

        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const b1 = boxes[i];
                const b2 = boxes[j];
                const overlap = !(
                    b1.x + b1.width <= b2.x ||
                    b2.x + b2.width <= b1.x ||
                    b1.y + b1.height <= b2.y ||
                    b2.y + b2.height <= b1.y
                );
                expect(overlap).toBe(false);
            }
        }

        // 6. Fiche Club : Boutons d'action concrets
        const officialSiteBtn = page.locator('[data-testid="club-official-site-btn"]');
        const playOnlineBtn = page.locator('[data-testid="club-play-online-btn"]');
        await expect(officialSiteBtn).toBeVisible();
        await expect(officialSiteBtn).toContainText('Site Officiel / S’inscrire au Club');
        await expect(playOnlineBtn).toBeVisible();
        await expect(playOnlineBtn).toContainText('Jouer au Salon en ligne du Club');

        // 7. Tournois en bas : Formatage de date en français (ex: "nov. 2026")
        const tournamentCards = page.locator('[data-testid^="tournament-card-summary-"]');
        await expect(tournamentCards.first()).toBeVisible();
        const cardText = await tournamentCards.first().innerText();
        expect(cardText).toMatch(/\d{1,2}\s+(janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)\s+\d{4}/i);

        // 8. Clic sur le zoom "France & Riviera" : zoom >= 2.8
        await zoomFrance.click();
        const viewport = page.locator('[data-testid="interactive-world-map-viewport"]');
        const zoomValue = await viewport.getAttribute('data-zoom');
        expect(parseFloat(zoomValue || '0')).toBeGreaterThanOrEqual(2.8);

        // Aucune erreur uncaught
        expect(pageErrors.length).toBe(0);
    });
});

