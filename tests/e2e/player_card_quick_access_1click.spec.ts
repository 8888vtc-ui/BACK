import { test, expect } from '@playwright/test';

test.describe('Carte de Joueur — Accès Rapide 1-Clic & Synchronisation des Portes', () => {
    test('Accès immédiat sans blocage HTML5, 6e bouton photo et synchronisation des portes', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr');
        await page.evaluate(() => {
            localStorage.removeItem('bg_player_passport_v1');
            localStorage.removeItem('bgtour_player_passport');
            localStorage.removeItem('bgtour_player_gate');
            localStorage.setItem('bgtour_locale', 'fr');
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');

        // 1. Ouvrir la modale Carte de Joueur depuis la navbar
        const authTrigger = page.locator('[data-testid="auth-login-trigger"]');
        await expect(authTrigger).toBeVisible();
        await authTrigger.click();

        const modal = page.locator('[data-testid="player-passport-auth-modal"]');
        await expect(modal).toBeVisible();

        // 2. Vérifier que l'onglet "Accès Rapide (5s)" est actif
        const tabPassport = page.locator('[data-testid="auth-tab-passport"]');
        await expect(tabPassport).toBeVisible();
        await expect(tabPassport).toHaveText(/(Accès Rapide|Express) \(5s\)/);

        // 3. Vérifier les 5 avatars standard + le 6e bouton "Ma Photo"
        const avatarButtons = page.locator('[data-testid^="passport-avatar-"]');
        await expect(avatarButtons).toHaveCount(6);
        const customPhotoBtn = page.locator('[data-testid="passport-avatar-custom"]');
        await expect(customPhotoBtn).toBeVisible();
        await expect(customPhotoBtn).toHaveText(/(Ma Photo|My Photo)/);
        await expect(page.locator('[data-testid="passport-custom-photo-input"]')).toBeAttached();

        // 4. Vérifier la synchronisation des Divisions (Débutant, Club, Compétiteur)
        const levelBeginner = page.locator('[data-testid="passport-level-beginner"]');
        const levelClub = page.locator('[data-testid="passport-level-intermediate"]');
        const levelExpert = page.locator('[data-testid="passport-level-expert"]');
        const previewDivision = page.locator('[data-testid="passport-preview-division"]');
        const livePreview = page.locator('[data-testid="passport-card-live-preview"]');

        // Test Division Club
        await levelClub.click();
        await expect(previewDivision).toContainText('Division Club • Objectif Videau & Tactique');

        // Test Division Compétiteur
        await levelExpert.click();
        await expect(previewDivision).toContainText('Division Expert / Pro • Analyse 3-Ply & ERA');

        // Test Division Débutant (Zéro jargon ER/PR ni 3-Ply)
        await levelBeginner.click();
        await expect(previewDivision).toContainText('Niveau : Débutant (Accompagnement Pas-à-Pas)');
        const previewText = await livePreview.innerText();
        expect(previewText).not.toContain('3-Ply');
        expect(previewText).not.toContain('Indice ER / PR');
        expect(previewText).toContain('Mode Guidé');

        // 5. Validation en 1 seul clic sans toucher au clavier (zéro blocage "Veuillez remplir ce champ")
        const submitBtn = page.locator('[data-testid="email-submit-btn"]');
        await expect(submitBtn).toBeVisible();
        await expect(submitBtn).toContainText('VALIDER ET ENTRER DANS LE SALON');
        await submitBtn.click();

        // La modale doit se fermer immédiatement et débloquer l'accès
        await expect(modal).not.toBeVisible({ timeout: 5000 });

        // Vérifier que le passeport local a été persisté et que la porte Débutant est active
        const savedPassport = await page.evaluate(() => localStorage.getItem('bg_player_passport_v1'));
        const savedGate = await page.evaluate(() => localStorage.getItem('bgtour_player_gate'));
        expect(savedPassport).not.toBeNull();
        expect(savedPassport).toContain('Alexandre D.');
        expect(savedGate).toBe('BEGINNER');

        // 0 erreur page
        expect(pageErrors.length).toBe(0);
    });
});
