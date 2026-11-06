import { test, expect } from '@playwright/test';

test.describe('Mission 40 — Bascule Invité <-> Authentifié sans rechargement de page', () => {
    test.beforeEach(async ({ page }) => {
        // Nettoyage complet du stockage pour simuler un nouveau visiteur Invité pur
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.removeItem('bg_player_passport_v1');
            localStorage.removeItem('bgtour_player_passport');
            localStorage.removeItem('bg_user_code');
            localStorage.removeItem('bgt_user_code');
            localStorage.removeItem('bgtour_local_auth_profile_v1');
            localStorage.setItem('bg_is_guest', 'true');
            localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            localStorage.setItem('bgtour_locale', 'fr');
        });
    });

    test('1. Un visiteur Invité sur /puzzles voit le verrouillage, les 10 000 PTS et le cadenas', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/puzzles?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Header : Joueur Invité & 10 000 PTS
        const authTrigger = page.locator('[data-testid="auth-login-trigger"]');
        await expect(authTrigger).toBeVisible();
        await expect(page.locator('[data-testid="lobby-auth-status"]')).toContainText(/Joueur Invit[eé]/i);

        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText('10 000 PTS');

        // Sidebar : Cadenas visible sur Mes Blunders
        const sidebarLock = page.locator('[data-testid="sidebar-blunder-guest-lock"]');
        await expect(sidebarLock).toBeVisible();

        // Vue verrouillée sur la page avec CTA doré
        const lockView = page.locator('[data-testid="guest-feature-lock-view"]');
        await expect(lockView).toBeVisible();

        const unlockCta = page.locator('[data-testid="unlock-personal-blunders-cta"]');
        await expect(unlockCta).toBeVisible();
        await expect(unlockCta).toContainText(/SE CONNECTER|CR[EÉ]ER MON COMPTE/i);

        expect(pageErrors.length).toBe(0);
    });

    test('2. Connexion 1-Clic depuis CTA déverrouille instantanément sans recharger la page', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/puzzles?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Clic sur le CTA de l'écran verrouillé
        const unlockCta = page.locator('[data-testid="unlock-personal-blunders-cta"]');
        await expect(unlockCta).toBeVisible();
        await unlockCta.click();

        // Modale d'authentification 1-Clic
        const authModal = page.locator('[data-testid="player-passport-auth-modal"]');
        await expect(authModal).toBeVisible();

        const pseudoInput = page.locator('[data-testid="passport-pseudo-input"]');
        await expect(pseudoInput).toBeVisible();
        await pseudoInput.fill('Alexandre Grand');

        // Soumission 1-Clic
        const submitBtn = page.locator('[data-testid="email-submit-btn"]');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // La modale doit se fermer
        await expect(authModal).toBeHidden({ timeout: 5000 });

        // SANS AUCUN RECHARGEMENT :
        // 1) L'écran verrouillé disparaît
        const lockView = page.locator('[data-testid="guest-feature-lock-view"]');
        await expect(lockView).toBeHidden({ timeout: 5000 });

        // 2) Le profil connecté apparaît dans le header avec le bon pseudo
        const profileBtn = page.locator('[data-testid="user-profile-btn"]');
        await expect(profileBtn).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="lobby-auth-status"]')).toContainText('Alexandre Grand');

        // 3) Le cadenas de la sidebar disparaît
        const sidebarLock = page.locator('[data-testid="sidebar-blunder-guest-lock"]');
        await expect(sidebarLock).toBeHidden();

        // 4) Le solde de 10 000 PTS est préservé
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText('10 000 PTS');

        expect(pageErrors.length).toBe(0);
    });

    test('3. Cycle complet : Invité -> Connexion -> Déverrouillage -> Déconnexion -> Reverrouillage', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/puzzles?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Étape A : Connexion via le bouton Header "Joueur Invité • Connexion"
        const authTrigger = page.locator('[data-testid="auth-login-trigger"]');
        await expect(authTrigger).toBeVisible();
        await authTrigger.click();

        const authModal = page.locator('[data-testid="player-passport-auth-modal"]');
        await expect(authModal).toBeVisible();

        const submitBtn = page.locator('[data-testid="email-submit-btn"]');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        await expect(authModal).toBeHidden({ timeout: 5000 });

        // Vérification de l'état connecté instantané
        const profileBtn = page.locator('[data-testid="user-profile-btn"]');
        await expect(profileBtn).toBeVisible({ timeout: 5000 });
        const lockView = page.locator('[data-testid="guest-feature-lock-view"]');
        await expect(lockView).toBeHidden({ timeout: 5000 });
        await expect(page.locator('[data-testid="sidebar-blunder-guest-lock"]')).toBeHidden();

        // Étape B : Déconnexion via le menu utilisateur
        await profileBtn.click();
        const logoutBtn = page.locator('[data-testid="auth-logout-btn"]');
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
        await logoutBtn.click();

        // SANS AUCUN RECHARGEMENT :
        // 1) Le bouton Header redevient "Joueur Invité"
        const guestTriggerAfterLogout = page.locator('[data-testid="auth-login-trigger"]');
        await expect(guestTriggerAfterLogout).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="lobby-auth-status"]')).toContainText(/Joueur Invit[eé]/i);

        // 2) L'écran verrouillé réapparaît immédiatement sur /puzzles
        await expect(lockView).toBeVisible({ timeout: 5000 });

        // 3) Le cadenas de la sidebar réapparaît
        const sidebarLockAfterLogout = page.locator('[data-testid="sidebar-blunder-guest-lock"]');
        await expect(sidebarLockAfterLogout).toBeVisible({ timeout: 5000 });

        // 4) Le solde de 10 000 PTS est toujours intact
        const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
        await expect(pointsBadge).toBeVisible();
        await expect(pointsBadge).toContainText('10 000 PTS');

        expect(pageErrors.length).toBe(0);
    });

    test('4. En anglais (?lang=en) : cycle complet Guest Player -> Sign In -> Sign Out', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/puzzles?lang=en');
        await page.waitForLoadState('domcontentloaded');

        // Vérification initiale Guest Player
        const authTrigger = page.locator('[data-testid="auth-login-trigger"]');
        await expect(authTrigger).toBeVisible();
        await expect(page.locator('[data-testid="lobby-auth-status"]')).toContainText('Guest Player');

        // Connexion
        await authTrigger.click();
        const authModal = page.locator('[data-testid="player-passport-auth-modal"]');
        await expect(authModal).toBeVisible();

        const submitBtn = page.locator('[data-testid="email-submit-btn"]');
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        await expect(authModal).toBeHidden({ timeout: 5000 });

        // Vérification connecté
        const profileBtn = page.locator('[data-testid="user-profile-btn"]');
        await expect(profileBtn).toBeVisible({ timeout: 5000 });

        // Déconnexion en anglais
        await profileBtn.click();
        const logoutBtn = page.locator('[data-testid="auth-logout-btn"]');
        await expect(logoutBtn).toBeVisible({ timeout: 5000 });
        await logoutBtn.click();

        // Retour immédiat à Guest Player
        await expect(authTrigger).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="lobby-auth-status"]')).toContainText('Guest Player');

        expect(pageErrors.length).toBe(0);
    });
});
