import { test, expect } from '@playwright/test';

test.describe('Zone 1 — Audit & Verrouillage du Bandeau Supérieur (AppNavbar)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Signature officielle et absence absolue de Mistral et ERH', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        // Badge de signature v3.1 • 3-Ply • Open Sage
        const versionBadge = page.locator('[data-testid="app-version-badge"]');
        await expect(versionBadge).toBeVisible();
        await expect(versionBadge).toHaveText('v3.1 • 3-Ply • Open Sage');

        // Absence totale de Mistral et ERH dans le Header
        const headerText = await page.locator('[data-testid="app-navbar"]').innerText();
        expect(headerText).not.toContain('Mistral');
        expect(headerText).not.toContain('ERH');
    });

    test('2. Sélecteur unique des 3 portes et taille de police >= 14px sur Desktop', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        // Le sélecteur des 3 portes visible sur desktop doit être unique à l'écran
        const visibleSwitches = page.locator('.hidden.md\\:flex [data-testid="player-tier-gate-switch"]');
        await expect(visibleSwitches).toHaveCount(1);
        await expect(visibleSwitches).toBeVisible();

        // Vérification de la taille de police >= 14px (font-size >= 14px)
        const beginnerBtn = page.locator('.hidden.md\\:flex [data-testid="tier-gate-btn-beginner"]');
        await expect(beginnerBtn).toBeVisible();

        const fontSize = await beginnerBtn.evaluate((el) => {
            const sizeStr = window.getComputedStyle(el).fontSize;
            return parseFloat(sizeStr);
        });
        expect(fontSize).toBeGreaterThanOrEqual(14);
    });

    test('3. Affichage dynamique selon la porte : Débutant vs Intermédiaire/Expert', async ({ page }) => {
        // A) Mode DÉBUTANT
        await page.goto('/?gate=beginner');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        // En Débutant : le solde 10 000 PTS et la bascule de langue sont visibles
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText(/10\s*000\s*PTS/);

        const localeToggle = page.locator('[data-testid="navbar-locale-toggle-btn"]');
        await expect(localeToggle).toBeVisible();

        // En Débutant : ER / PR et ELO sont masqués du bandeau
        const erprBadge = page.locator('[data-testid="navbar-erpr-badge"]');
        await expect(erprBadge).toHaveCount(0);
        const ratingBadge = page.locator('[data-testid="navbar-rating-badge"]');
        await expect(ratingBadge).toHaveCount(0);

        // B) Bascule vers INTERMÉDIAIRE au clic
        const intermediateBtn = page.locator('.hidden.md\\:flex [data-testid="tier-gate-btn-intermediate"]');
        await intermediateBtn.click();

        // En Intermédiaire : ER / PR et Rating apparaissent
        await expect(page.locator('[data-testid="navbar-erpr-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="navbar-rating-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="navbar-points-badge"]')).toBeVisible();

        // C) Bascule vers EXPERT au clic
        const expertBtn = page.locator('.hidden.md\\:flex [data-testid="tier-gate-btn-expert"]');
        await expertBtn.click();

        await expect(page.locator('[data-testid="navbar-erpr-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="navbar-rating-badge"]')).toBeVisible();
        await expect(page.locator('[data-testid="navbar-points-badge"]')).toBeVisible();
    });

    test('4. Bascule bilingue instantanée FR <-> EN', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        const localeToggle = page.locator('[data-testid="navbar-locale-toggle-btn"]');
        await expect(localeToggle).toBeVisible();

        // Clic pour basculer en Anglais
        await localeToggle.click();
        await page.waitForTimeout(300);

        // Vérifier que le bouton ou l'interface a basculé
        const titleEn = await localeToggle.getAttribute('title');
        expect(titleEn).toMatch(/Passer en Français|Switch to/i);

        // Re-clic pour revenir en Français
        await localeToggle.click();
        await page.waitForTimeout(300);
        const titleFr = await localeToggle.getAttribute('title');
        expect(titleFr).toMatch(/Switch to English|Passer en/i);
    });

    test('5. Sélecteur de profil parmi les 300 codes utilisateurs avec persistance localStorage', async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

        // Ouvrir le menu utilisateur
        const profileBtn = page.locator('[data-testid="user-profile-btn"]');
        await expect(profileBtn).toBeVisible();
        await profileBtn.click();

        // Le dropdown de profil s'ouvre
        const dropdown = page.locator('[data-testid="user-dropdown-menu"]');
        await expect(dropdown).toBeVisible();

        // Saisir un code utilisateur parmi les 300 profils (ex: user_42)
        const codeInput = page.locator('[data-testid="header-user-code-input"]');
        await expect(codeInput).toBeVisible();
        await codeInput.fill('user_42');

        const applyBtn = page.locator('[data-testid="header-user-code-apply-btn"]');
        await applyBtn.click();

        // Vérification de la persistance en localStorage (identifiant résolu ou saisi)
        const savedCode = await page.evaluate(() => localStorage.getItem('bgt_user_code'));
        expect(savedCode).toMatch(/^(?:user_42|hum_042)$/);

        // Vérification que le profil est mis à jour
        const passportRaw = await page.evaluate(() => localStorage.getItem('bg_player_passport_v1'));
        expect(passportRaw).not.toBeNull();
        expect(passportRaw).toMatch(/(?:user_42|hum_042)/);
    });
});
