import { test, expect } from '@playwright/test';

test.describe('Verrou Zéro Fake PR / ER — Vérité Métier Invité vs Calibrage vs Réel', () => {
    test('État 1 : Visiteur Invité par défaut sur l’Accueil Expert / Pro — Zéro Fake PR, boîtes verrouillées « — »', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('bgtour_player_gate', 'EXPERT');
            localStorage.setItem('bgtour_locale', 'fr');
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // 1. Vérification du Header pour un Invité : affiche "● Mode Invité" sans faux PR 6.3 ni faux 1500 Elo
        const authStatus = page.locator('[data-testid="lobby-auth-status"]');
        await expect(authStatus).toBeVisible();
        await expect(authStatus).toContainText(/Mode Invité|Invité/i);
        await expect(authStatus).not.toContainText('PR 6.3');
        await expect(authStatus).not.toContainText('1500 Elo');

        // 2. Vérification de la bannière Cockpit Expert : affiche statut Invité et aucun faux PR 6.3
        const banner = page.locator('[data-testid="expert-home-portal"]');
        await expect(banner).toBeVisible();
        await expect(banner).toContainText(/STATUT : Invité/i);
        const bannerErPr = page.locator('[data-testid="expert-er-pr"]');
        await expect(bannerErPr).toHaveCount(0);

        // 3. Vérification de la Carte 2 (Bilan de Performance) : les 3 boîtes affichent "—"
        const globalVal = page.locator('[data-testid="pr-global-val"]');
        const checkerVal = page.locator('[data-testid="pr-checker-val"]');
        const cubeVal = page.locator('[data-testid="pr-cube-val"]');

        await expect(globalVal).toHaveText('—');
        await expect(checkerVal).toHaveText('—');
        await expect(cubeVal).toHaveText('—');

        // 4. Bouton CTA d'inscription présent
        const createCardCta = page.locator('[data-testid="expert-create-card-cta"]');
        await expect(createCardCta).toBeVisible();
        await expect(createCardCta).toContainText(/Créer ma Carte de Joueur/i);

        expect(pageErrors.length).toBe(0);
    });

    test('État 2 : Joueur Inscrit avec 0 partie jouée — Statut « En calibrage » sans faux 6.3', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('bgtour_player_gate', 'EXPERT');
            localStorage.setItem('bgtour_locale', 'fr');
            localStorage.setItem('bg_player_passport_v1', JSON.stringify({
                pseudo: 'Marcus V.',
                email: 'marcus@backgammon.club',
                experienceLevel: 'expert',
                avatarUrl: '/avatars/user-avatar-1.jpg',
                countryName: 'France',
                countryCode: 'FR',
                registeredAt: new Date().toISOString(),
            }));
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // 1. Header affiche le pseudo, 1500 Elo et PR : En calibrage
        const authStatus = page.locator('[data-testid="lobby-auth-status"]');
        await expect(authStatus).toBeVisible();
        await expect(authStatus).toContainText('Marcus V.');
        await expect(authStatus).toContainText('1500 Elo');
        await expect(authStatus).toContainText(/PR : En calibrage/i);

        // 2. Bannière Cockpit affiche Calibrage (0/1 partie) et 1500 Rating
        const bannerErPr = page.locator('[data-testid="expert-er-pr"]');
        const bannerRating = page.locator('[data-testid="expert-rating"]');
        await expect(bannerErPr).toBeVisible();
        await expect(bannerErPr).toHaveText(/Calibrage \(0\/1 partie\)/i);
        await expect(bannerRating).toHaveText('1500');

        // 3. Carte 2 : les 3 boîtes affichent "En calibrage"
        await expect(page.locator('[data-testid="pr-global-val"]')).toHaveText('En calibrage');
        await expect(page.locator('[data-testid="pr-checker-val"]')).toHaveText('En calibrage');
        await expect(page.locator('[data-testid="pr-cube-val"]')).toHaveText('En calibrage');

        // 4. Bouton CTA de 1re partie présent
        const startCalibCta = page.locator('[data-testid="expert-start-calibration-cta"]');
        await expect(startCalibCta).toBeVisible();
        await expect(startCalibCta).toContainText(/Lancer ma 1re partie de calibrage/i);

        expect(pageErrors.length).toBe(0);
    });

    test('État 3 : Joueur Inscrit avec 1re partie terminée — Vrais PR calculés affichés partout', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr');
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('bgtour_player_gate', 'EXPERT');
            localStorage.setItem('bgtour_locale', 'fr');
            localStorage.setItem('bg_player_passport_v1', JSON.stringify({
                pseudo: 'Marcus V.',
                email: 'marcus@backgammon.club',
                experienceLevel: 'expert',
                avatarUrl: '/avatars/user-avatar-1.jpg',
                countryName: 'France',
                countryCode: 'FR',
                registeredAt: new Date().toISOString(),
            }));
            // 1re partie terminée avec de vraies décisions EMG
            localStorage.setItem('bgtour_real_match_stats_v1', JSON.stringify({
                gamesPlayed: 1,
                totalCheckerLoss: 0.084,
                totalCheckerDecisions: 10,
                totalCubeLoss: 0.032,
                totalCubeDecisions: 2,
                rating: 1540,
                updatedAt: new Date().toISOString(),
            }));
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // checkerPR = (0.084 / 10) * 500 = 4.2
        // cubePR = (0.032 / 2) * 500 = 8.0
        // globalPR = ((0.084 + 0.032) / 12) * 500 = 4.833... -> 4.8

        // 1. Header affiche les vrais chiffres calculés
        const erPrBadge = page.locator('[data-testid="navbar-erpr-badge"]');
        const ratingBadge = page.locator('[data-testid="navbar-rating-badge"]');
        await expect(erPrBadge).toBeVisible();
        await expect(erPrBadge).toHaveText('PR 4.8');
        await expect(ratingBadge).toHaveText('1540 Elo');

        // 2. Bannière Cockpit affiche le vrai PR 4.8 et 1540 Rating
        await expect(page.locator('[data-testid="expert-er-pr"]')).toHaveText('4.8');
        await expect(page.locator('[data-testid="expert-rating"]')).toHaveText('1540');

        // 3. Carte 2 : les 3 boîtes affichent les vraies métriques décomposées
        await expect(page.locator('[data-testid="pr-global-val"]')).toHaveText('4.8');
        await expect(page.locator('[data-testid="pr-checker-val"]')).toHaveText('4.2');
        await expect(page.locator('[data-testid="pr-cube-val"]')).toHaveText('8.0');

        // 4. Les 3 boutons d'accès Pro sont présents
        await expect(page.locator('[data-testid="expert-open-studio-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-fix-blunders-btn"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-competition-quizzes-btn"]')).toBeVisible();

        expect(pageErrors.length).toBe(0);
    });
});
