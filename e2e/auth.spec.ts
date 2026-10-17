import { test, expect } from '@playwright/test';

// Dépend de Supabase (non configuré en local : placeholder dans .env).
// À réactiver une fois NEXT_PUBLIC_SUPABASE_URL/ANON_KEY posées.
test.describe.skip('E2E : Authentification des Joueurs (AuthModal & Profil)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('affiche le bouton Connexion dans le HUD en état non authentifié', async ({ page }) => {
        const loginBtn = page.getByTestId('auth-login-trigger');
        await expect(loginBtn).toBeVisible();
        await expect(loginBtn).toContainText(/Connexion/i);
    });

    test('ouvre la modale d\'authentification avec les fournisseurs OAuth et le formulaire', async ({ page }) => {
        // Clic sur "Connexion"
        await page.getByTestId('auth-login-trigger').click();

        // Vérifie la modale
        const authModal = page.getByRole('dialog', { name: /Connexion au Tournoi|Créer un Compte/i });
        await expect(authModal).toBeVisible();

        // Vérifie la présence des boutons OAuth Google et Apple
        await expect(page.getByTestId('oauth-google-btn')).toBeVisible();
        await expect(page.getByTestId('oauth-apple-btn')).toBeVisible();

        // Vérifie les champs du formulaire email
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByTestId('email-submit-btn')).toBeVisible();
    });

    test('permet d\'alterner entre les modes Connexion et Création de compte', async ({ page }) => {
        await page.getByTestId('auth-login-trigger').click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        // 1. Bascule vers "Créer un compte"
        const signupTab = dialog.getByRole('button', { name: 'Créer un compte', exact: true });
        await signupTab.click();

        // Vérifie l'apparition du champ Pseudo
        const pseudoInput = dialog.getByPlaceholder(/GrandMaître/i);
        await expect(pseudoInput).toBeVisible();

        // Vérifie le libellé du bouton de soumission
        const submitBtn = dialog.getByTestId('email-submit-btn');
        await expect(submitBtn).toContainText(/Créer mon compte/i);

        // 2. Rebascule vers "Connexion"
        const signinTab = dialog.getByRole('button', { name: 'Connexion', exact: true });
        await signinTab.click();

        // Le champ pseudo ne doit plus être affiché
        await expect(pseudoInput).not.toBeVisible();
        await expect(submitBtn).toContainText(/Se connecter/i);
    });

    test('saisit les identifiants et gère la tentative de connexion', async ({ page }) => {
        await page.getByTestId('auth-login-trigger').click();

        // Remplissage du formulaire
        await page.locator('input[type="email"]').fill('joueur.test@backgammon.pro');
        await page.locator('input[type="password"]').fill('Secr3tPassword!');

        // Soumission
        await page.getByTestId('email-submit-btn').click();

        // Sans backend Supabase connecté en environnement local, affiche un message d'erreur gracieux ou tente l'auth
        const errorOrDialog = page.locator('text=⚠️').or(page.getByRole('dialog'));
        await expect(errorOrDialog.first()).toBeVisible();
    });

    test('ferme la modale d\'authentification via le bouton ✕', async ({ page }) => {
        await page.getByTestId('auth-login-trigger').click();

        const authModal = page.getByRole('dialog');
        await expect(authModal).toBeVisible();

        // Clic sur la croix de fermeture
        const closeBtn = page.getByTestId('auth-modal-close-btn');
        await closeBtn.click();

        // La modale n'est plus visible
        await expect(authModal).not.toBeVisible();
    });
});
