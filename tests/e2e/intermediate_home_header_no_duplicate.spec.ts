import { test, expect } from '@playwright/test';

test.describe('Portes Intermédiaire & Expert — Header Propre, Zéro Doublon & Zéro ERA', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Intermédiaire : AppNavbar affiche 1500 Elo une seule fois, 10 000 PTS & FR|EN visibles sans coupure', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=intermediate');
        await page.waitForSelector('[data-testid="intermediate-home-portal"]', { timeout: 15000 });

        // Vérification Navbar : 1500 Elo présent exactement UNE SEULE FOIS dans AppNavbar
        const navbar = page.locator('[data-testid="app-navbar"]');
        await expect(navbar).toBeVisible();

        const navbarText = await navbar.innerText();
        const matches1500 = navbarText.match(/1500\s*Elo/g) || [];
        expect(matches1500.length).toBe(1);

        // Zéro doublon de PR différent (7.4 vs 6.3)
        expect(navbarText).not.toContain('PR 7.4');
        expect(navbarText).toContain('PR 6.3');

        // Vérification visibilité 10 000 PTS et FR | EN sans coupure
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        const localeToggle = page.locator('[data-testid="navbar-locale-toggle-btn"]');

        await expect(pointsBadge).toBeVisible();
        await expect(localeToggle).toBeVisible();

        const pointsBox = await pointsBadge.boundingBox();
        const localeBox = await localeToggle.boundingBox();

        expect(pointsBox).not.toBeNull();
        expect(localeBox).not.toBeNull();

        if (pointsBox && localeBox) {
            expect(pointsBox.x + pointsBox.width).toBeLessThanOrEqual(1440);
            expect(localeBox.x + localeBox.width).toBeLessThanOrEqual(1440);
        }

        // Vérification de la Porte Intermédiaire : 2 cartes et switch pips
        const portal = page.locator('[data-testid="intermediate-home-portal"]');
        await expect(portal).toBeVisible();

        // Clé 1 et bouton d'entraînement sur plateau présents
        await expect(page.locator('[data-testid="club-secrets-practice-btn"]')).toBeVisible();

        expect(pageErrors).toEqual([]);
    });

    test('2. Expert / Pro : 2 cartes uniques en Zéro-Scroll, zéro mention de ERA / XG ROLLER++', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/?gate=expert');
        await page.waitForSelector('[data-testid="expert-home-portal"]', { timeout: 15000 });

        const expertPortal = page.locator('[data-testid="expert-home-portal"]');
        await expect(expertPortal).toBeVisible();

        // 1. Zéro mention de ERA ou XG ROLLER++
        const portalText = await expertPortal.innerText();
        expect(portalText).not.toContain('ERA');
        expect(portalText).not.toContain('Error Rate Adaptatif');
        expect(portalText).not.toContain('Adaptive Error Rate');
        expect(portalText).not.toContain('XG ROLLER++');

        // 2. Télémétrie supérieure : uniquement ER / PR 6.3 et RATING 1500
        await expect(page.locator('[data-testid="expert-er-pr"]')).toHaveText('6.3');
        await expect(page.locator('[data-testid="expert-rating"]')).toHaveText('1500');

        // 3. Carte 1 : Cockpit de Match Tournoi Officiel
        await expect(page.locator('[data-testid="expert-play-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-invite-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-hide-pips-btn"]')).toBeVisible();

        // 4. Carte 2 : Bilan Décomposé Pions vs Videau (3 indicateurs officiels)
        await expect(page.locator('[data-testid="pr-global-val"]')).toHaveText('6.3');
        await expect(page.locator('[data-testid="pr-checker-val"]')).toHaveText('4.2');
        await expect(page.locator('[data-testid="pr-cube-val"]')).toHaveText('8.1');

        // Boutons Pro
        await expect(page.locator('[data-testid="expert-open-studio-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-fix-blunders-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-competition-quizzes-btn"]')).toBeVisible();

        // 5. Zéro 3e carte du bas (Cap6 legend card supprimée)
        await expect(page.locator('[data-testid="cap-6-er-era-card"]')).not.toBeVisible();

        expect(pageErrors).toEqual([]);
    });
});

