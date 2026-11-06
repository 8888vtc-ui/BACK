/**
 * @file tests/e2e/day17_sidebar_single_line_and_all_routes.spec.ts
 * @description Certification Playwright E2E de la Mission 17/25 :
 * - Suppression définitive de tout faux compteur de joueurs en ligne (54 online / 74 en ligne).
 * - "Trouver un joueur" aligné sur 1 seule ligne (whitespace-nowrap, hauteur <= 40px) avec point vert neutre ●.
 * - Absence de doublon "Inviter des amis" en bas de la Sidebar.
 * - Présence de l'accès direct "Partie Guidée (Prof.)" sous TABLES en mode Débutant.
 * - Intégration systématique de AppNavbar + LobbyLeftSidebar sur les 7 routes d'audit :
 *   /academy, /academy/concepts/[slug], /academy/openings/[roll], /daily-puzzle, /progression, /tournaments, /tournaments/[slug].
 * 
 * Conforme aux règles du projet : <= 250 lignes, 0 any, 0 sub-agent.
 */

import { test, expect } from '@playwright/test';

test.describe('Day 17: Sidebar Single-Line, Zero Fake Online & All Routes Presence', () => {
    test.setTimeout(90000);

    test('1. Sidebar : "Trouver un joueur" sur 1 ligne (<= 40px), zéro faux compteur, zéro doublon & Partie Guidée', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'BEGINNER');
            window.localStorage.setItem('bgtour_locale', 'fr');
        });
        await page.reload({ waitUntil: 'networkidle' });

        const sidebar = page.getByTestId('lobby-left-sidebar');
        await expect(sidebar).toBeVisible();

        // 1. Bouton "Trouver un joueur" sur 1 seule ligne, hauteur <= 40px
        const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
        await expect(findPlayerBtn).toBeVisible();
        await expect(findPlayerBtn).toContainText(/Trouver un joueur|Find a Player/);

        const box = await findPlayerBtn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeLessThanOrEqual(40);

        // Petit point vert neutre ● présent
        const statusDot = page.getByTestId('sidebar-find-player-status-dot');
        await expect(statusDot).toBeVisible();

        // ZÉRO faux compteur de joueurs en ligne (54 online, 74 en ligne, etc.)
        const sidebarText = await sidebar.innerText();
        expect(sidebarText).not.toMatch(/\d+\s*(?:online|en ligne|joueurs en ligne)/i);

        // 2. Aucun doublon "Inviter des amis" en bas de la Sidebar
        await expect(page.locator('[data-testid="sidebar-submenu-friends"]')).toHaveCount(0);
        expect(sidebarText).not.toContain('Inviter des amis');

        // 3. En mode Débutant : accès direct "Partie Guidée (Prof.)" sous TABLES
        const guidedBtn = page.getByTestId('sidebar-guided-play-btn');
        await expect(guidedBtn).toBeVisible();
        await expect(guidedBtn).toContainText(/Partie Guidée \(Prof\.\)|Guided Match \(Prof\.\)/);
    });

    test('2. Présence de AppNavbar et LobbyLeftSidebar sur les 7 routes universelles', async ({ page }) => {
        const auditedRoutes = [
            '/academy',
            '/academy/concepts/golden-point',
            '/academy/openings/3-1',
            '/daily-puzzle',
            '/progression',
            '/tournaments',
            '/tournaments/monte-carlo-world-championship-2027',
        ];

        for (const route of auditedRoutes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });

            const navbar = page.getByTestId('app-navbar');
            await expect(navbar).toBeVisible({ timeout: 10000 });

            const sidebar = page.getByTestId('lobby-left-sidebar');
            await expect(sidebar).toBeVisible({ timeout: 10000 });
        }
    });
});
