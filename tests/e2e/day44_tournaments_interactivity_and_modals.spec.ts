import { test, expect } from '@playwright/test';

test.describe('Day 44 — Contrôle de l’Interactivité de /tournaments (Filtres, Recherche, Fiches & Modales)', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('1. Filtres régionaux, cases Clubs / Tournois et barre de recherche (Paris, Monte-Carlo, Las Vegas)', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/tournaments');
        await page.waitForLoadState('domcontentloaded');

        const viewport = page.locator('[data-testid="interactive-world-map-viewport"]');
        await expect(viewport).toBeVisible({ timeout: 10000 });

        // A. Clics sur chaque filtre régional et vérification du zoom / centrage
        const zoomWorld = page.locator('[data-testid="map-zoom-world"]');
        const zoomFrance = page.locator('[data-testid="map-zoom-france"]');
        const zoomEurope = page.locator('[data-testid="map-zoom-europe"]');
        const zoomAmericas = page.locator('[data-testid="map-zoom-americas"]');
        const zoomAsia = page.locator('[data-testid="map-zoom-asia"]');

        await zoomFrance.click();
        await expect(viewport).toHaveAttribute('data-center-lat', '46.5');
        await expect(viewport).toHaveAttribute('data-zoom', '4.8');

        await zoomEurope.click();
        await expect(viewport).toHaveAttribute('data-center-lat', '48');
        await expect(viewport).toHaveAttribute('data-zoom', '3.2');

        await zoomAmericas.click();
        await expect(viewport).toHaveAttribute('data-center-lat', '27');
        await expect(viewport).toHaveAttribute('data-zoom', '2.2');

        await zoomAsia.click();
        await expect(viewport).toHaveAttribute('data-center-lat', '31');
        await expect(viewport).toHaveAttribute('data-zoom', '2.4');

        await zoomWorld.click();
        await expect(viewport).toHaveAttribute('data-center-lat', '0');
        await expect(viewport).toHaveAttribute('data-zoom', '1.05');

        // B. Cases à cocher Clubs & Tournois
        const toggleClubs = page.locator('[data-testid="map-toggle-clubs"]');
        const toggleTournaments = page.locator('[data-testid="map-toggle-tournaments"]');
        const tournamentsSection = page.locator('[data-testid="map-tournaments-section"]');

        await expect(tournamentsSection).toBeVisible();

        // Décocher Tournois -> la section inférieure de tournois disparaît
        await toggleTournaments.uncheck();
        await expect(tournamentsSection).toBeHidden();

        // Recocher Tournois -> la section réapparaît
        await toggleTournaments.check();
        await expect(tournamentsSection).toBeVisible();

        // Décocher et recocher Clubs
        await toggleClubs.uncheck();
        await toggleClubs.check();

        // C. Barre de recherche ("Paris", "Monte-Carlo", "Las Vegas")
        const searchInput = page.locator('[data-testid="tournament-search-input"]');
        await expect(searchInput).toBeVisible();

        // 1. Recherche "Paris"
        await searchInput.fill('Paris');
        const parisCard = page.locator('[data-testid^="tournament-card-summary-"]').first();
        await expect(parisCard).toBeVisible();
        await expect(parisCard).toContainText(/Paris/i);

        // 2. Recherche "Monte-Carlo"
        await searchInput.fill('Monte-Carlo');
        const mcCard = page.locator('[data-testid^="tournament-card-summary-"]').first();
        await expect(mcCard).toBeVisible();
        await expect(mcCard).toContainText(/Monte-Carlo/i);

        // 3. Recherche "Las Vegas"
        await searchInput.fill('Las Vegas');
        const lvCard = page.locator('[data-testid^="tournament-card-summary-"]').first();
        await expect(lvCard).toBeVisible();
        await expect(lvCard).toContainText(/Las Vegas/i);

        // Réinitialisation de la recherche
        await searchInput.fill('');
        expect(pageErrors).toHaveLength(0);
    });

    test('2. Clic sur une carte de tournoi : met à jour la fiche détail et illumine le point sur la carte', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/tournaments');
        await page.waitForLoadState('domcontentloaded');

        // Au départ, la fiche de détail affiche un Club par défaut
        const clubDetail = page.locator('[data-testid="club-detail-panel"]');
        await expect(clubDetail).toBeVisible({ timeout: 10000 });

        // Clic sur la première carte de tournoi
        const firstTournamentCard = page.locator('[data-testid^="tournament-card-summary-"]').first();
        await expect(firstTournamentCard).toBeVisible();
        await firstTournamentCard.click();

        // Le panneau de droite bascule sur la fiche détaillée du Tournoi
        const tournamentDetail = page.locator('[data-testid="tournament-detail-panel"]');
        await expect(tournamentDetail).toBeVisible();
        await expect(clubDetail).toBeHidden();

        // Vérification de la présence des boutons officiels du tournoi
        const officialBtn = page.locator('[data-testid="tournament-details-btn"]');
        const trainBtn = page.locator('[data-testid="tournament-train-btn"]');
        await expect(officialBtn).toBeVisible();
        await expect(trainBtn).toBeVisible();

        // La carte cliquée possède la classe de sélection dorée
        await expect(firstTournamentCard).toHaveClass(/border-\[#d4af37\]/);

        // Le point correspondant sur la carte possède le contour blanc (#ffffff)
        const selectedPinCircle = page.locator('g[data-testid^="map-pin-tournament-"] circle[stroke="#ffffff"]');
        await expect(selectedPinCircle.first()).toBeVisible();

        expect(pageErrors).toHaveLength(0);
    });

    test('3. Modales d’enregistrement de Club et de Tournoi (bilingue FR/EN, 0 emoji, fonctionnelles)', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        // ================== A. TEST EN FRANÇAIS ==================
        await page.goto('/tournaments?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const openClubBtn = page.locator('[data-testid="open-submit-club-btn"]');
        const openTournBtn = page.locator('[data-testid="open-submit-tournament-btn"]');

        await expect(openClubBtn).toBeVisible({ timeout: 10000 });
        await expect(openTournBtn).toBeVisible();

        // 1. Ouvrir la modale Club en FR
        await openClubBtn.click();
        const clubModal = page.locator('[data-testid="submit-club-modal"]');
        await expect(clubModal).toBeVisible();
        await expect(clubModal).toContainText('Référencer un Club ou Salon');

        // Vérifier 0 emoji système dans la modale
        const clubModalTextFr = await clubModal.innerText();
        expect(clubModalTextFr).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);

        // Fermer la modale Club
        const closeClubBtn = clubModal.locator('button', { hasText: /Fermer|Annuler/i }).first();
        await closeClubBtn.click();
        await expect(clubModal).toBeHidden();

        // 2. Ouvrir la modale Tournoi en FR
        await openTournBtn.click();
        const tournModal = page.locator('[data-testid="submit-tournament-modal"]');
        await expect(tournModal).toBeVisible();
        await expect(tournModal).toContainText('Proposer un Tournoi Officiel');

        // Vérifier 0 emoji système dans la modale
        const tournModalTextFr = await tournModal.innerText();
        expect(tournModalTextFr).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);

        // Fermer la modale Tournoi
        const closeTournBtn = tournModal.locator('button[aria-label="Fermer"]');
        await closeTournBtn.click();
        await expect(tournModal).toBeHidden();

        // ================== B. TEST EN ANGLAIS ==================
        await page.goto('/tournaments?lang=en');
        await page.waitForLoadState('domcontentloaded');

        const openClubBtnEn = page.locator('[data-testid="open-submit-club-btn"]');
        const openTournBtnEn = page.locator('[data-testid="open-submit-tournament-btn"]');

        // 1. Ouvrir la modale Club en EN
        await openClubBtnEn.click();
        const clubModalEn = page.locator('[data-testid="submit-club-modal"]');
        await expect(clubModalEn).toBeVisible();
        await expect(clubModalEn).toContainText('Register a Backgammon Club');

        const clubModalTextEn = await clubModalEn.innerText();
        expect(clubModalTextEn).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);

        const closeClubBtnEn = clubModalEn.locator('button', { hasText: /Close|Cancel/i }).first();
        await closeClubBtnEn.click();
        await expect(clubModalEn).toBeHidden();

        // 2. Ouvrir la modale Tournoi en EN
        await openTournBtnEn.click();
        const tournModalEn = page.locator('[data-testid="submit-tournament-modal"]');
        await expect(tournModalEn).toBeVisible();
        await expect(tournModalEn).toContainText('Submit an Official Tournament');

        const tournModalTextEn = await tournModalEn.innerText();
        expect(tournModalTextEn).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);

        const closeTournBtnEn = tournModalEn.locator('button[aria-label="Close"]');
        await closeTournBtnEn.click();
        await expect(tournModalEn).toBeHidden();

        expect(pageErrors).toHaveLength(0);
    });
});

