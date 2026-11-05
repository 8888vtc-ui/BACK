import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/beginner_home_finish_adjustments.spec.ts
 * @description Validation E2E Playwright des 3 finitions pixel-perfect Débutant :
 * 1. Suppression du badge doublon dans AppNavbar (libérant l'espace pour le bouton Profil).
 * 2. Sidebar gauche Débutant : libellé 'Mes Erreurs' (vs 'Mes Blunders' en Club / Expert).
 * 3. Carte Débutant : badge '🎓 Le Professeur' et phrase d'accompagnement bienveillant.
 */

test.describe('🎯 FINITIONS PIXEL-PERFECT ACCUEIL DÉBUTANT', () => {

    test('1. Suppression du badge doublon dans AppNavbar en Mode Débutant', async ({ page }) => {
        await page.goto('/?gate=beginner&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // En mode débutant, le badge de version / sous-titre redondant est masqué dans le header
        const navbar = page.locator('[data-testid="app-navbar"]');
        await expect(navbar).toBeVisible();
        await expect(navbar).not.toContainText('Mode Débutant • Partie Guidée');
        await expect(navbar).not.toContainText('Beginner Mode • Guided Play');

        // Le bouton compte / profil à droite reste parfaitement visible
        const userMenu = page.locator('[data-testid="auth-login-trigger"]');
        await expect(userMenu).toBeVisible();
    });

    test('2. Sidebar gauche Débutant affiche "Mes Erreurs" (et "Mes Blunders" en Club/Expert)', async ({ page }) => {
        // En mode Débutant
        await page.goto('/?gate=beginner&lang=fr');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        const blunderLinkBeginner = page.locator('[data-testid="sidebar-my-blunders-link"]');
        await expect(blunderLinkBeginner).toBeVisible();
        await expect(blunderLinkBeginner).toContainText('Mes Erreurs');
        await expect(blunderLinkBeginner).not.toContainText('Mes Blunders');

        // En mode Club / Intermédiaire
        await page.goto('/?gate=intermediate&lang=fr');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });

        const blunderLinkIntermediate = page.locator('[data-testid="sidebar-my-blunders-link"]');
        await expect(blunderLinkIntermediate).toBeVisible();
        await expect(blunderLinkIntermediate).toContainText('Mes Blunders');

        // Rebasculer en mode Débutant en Anglais
        await page.goto('/?gate=beginner');
        await page.waitForSelector('[data-testid="lobby-left-sidebar"]', { timeout: 15000 });
        await page.locator('[data-testid="navbar-locale-toggle-btn"]').click();
        await expect(page.locator('[data-testid="sidebar-my-blunders-link"]')).toContainText('My Mistakes');
    });

    test('3. Carte "Jouer ma première partie guidée" affiche "🎓 Le Professeur" et le texte bienveillant', async ({ page }) => {
        await page.goto('/?gate=beginner&lang=fr');
        await page.waitForSelector('[data-testid="beginner-home-portal"]', { timeout: 15000 });

        const portal = page.locator('[data-testid="beginner-home-portal"]');
        await expect(portal).toContainText('🎓 Le Professeur');
        await expect(portal).not.toContainText('Bot Doux');
        await expect(portal).toContainText('Jouez pas à pas avec les conseils bienveillants du Professeur en direct.');

        // En Anglais via le toggle navbar
        await page.locator('[data-testid="navbar-locale-toggle-btn"]').click();
        const portalEn = page.locator('[data-testid="beginner-home-portal"]');
        await expect(portalEn).toContainText('🎓 The Professor');
        await expect(portalEn).not.toContainText('Gentle Bot');
        await expect(portalEn).toContainText('Play step by step with caring live guidance from the Professor.');
    });
});
