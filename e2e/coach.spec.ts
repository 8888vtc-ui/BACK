import { test, expect } from '@playwright/test';

// La clé LLM (GEMINI_API_KEY) est désormais configurée.
test.describe('E2E : Déclenchement et Analyse du Coach Grand-Maître', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
    });

    test('déclenche le coach depuis le HUD et affiche le diagnostic de coup', async ({ page }) => {
        // Déclencheur manuel dans le HUD
        const coachTrigger = page.getByTestId('coach-hud-trigger');
        await expect(coachTrigger).toBeVisible();
        await coachTrigger.click();

        // Vérifie que le panneau du coach s'ouvre
        const coachPanel = page.locator('aside[aria-live="polite"]');
        await expect(coachPanel).toBeVisible();
        await expect(coachPanel).toContainText(/Coach en Temps Réel/i);

        // Vérifie le verdict et la perte d'équité
        await expect(coachPanel).toContainText(/BLUNDER|DOUTEUX/i);
        await expect(coachPanel).toContainText(/perte d'équité/i);

        // Vérifie le comparatif Coup Joué vs Coup Optimal
        await expect(coachPanel.getByText('Coup joué')).toBeVisible();
        await expect(coachPanel.getByText('Coup optimal')).toBeVisible();
    });

    test('affiche le contexte de match avancé MET (Kazaross)', async ({ page }) => {
        await page.getByTestId('coach-hud-trigger').click();

        const matchContext = page.getByTestId('coach-match-context');
        await expect(matchContext).toBeVisible();

        // Vérifie la présence des métriques de match
        await expect(matchContext).toContainText(/Score :/i);
        await expect(matchContext).toContainText(/Prix du gammon/i);
        await expect(matchContext).toContainText(/Take point/i);
    });

    test('permet de configurer les modes de déclenchement (Auto vs Manuel) et le mode dégradé Offline', async ({ page }) => {
        await page.getByTestId('coach-hud-trigger').click();

        // 1. Bascule vers mode Automatique
        const autoBtn = page.getByTestId('coach-mode-auto-btn');
        const manualBtn = page.getByTestId('coach-mode-manual-btn');
        await expect(autoBtn).toBeVisible();
        await expect(manualBtn).toBeVisible();

        await autoBtn.click();
        const thresholdSelect = page.getByTestId('coach-auto-threshold-select');
        await expect(thresholdSelect).toBeVisible();

        // Sélectionne le seuil
        await thresholdSelect.selectOption('doubtful');
        expect(await thresholdSelect.inputValue()).toBe('doubtful');

        // 2. Bascule en mode dégradé hors-ligne
        const offlineToggle = page.getByTestId('coach-offline-toggle');
        await expect(offlineToggle).toBeVisible();
        await offlineToggle.click();
        await expect(offlineToggle).toContainText(/Mode dégradé/i);
    });

    test('génère et affiche une explication pédagogique complète avec concept clé et conseil', async ({ page }) => {
        await page.getByTestId('coach-hud-trigger').click();

        // Clique sur "Explique mon erreur"
        const explainBtn = page.getByTestId('coach-explain-btn');
        await expect(explainBtn).toBeVisible();
        await explainBtn.click();

        // Vérifie que l'explication apparaît (via LLM streaming ou fallback rule-based)
        const coachPanel = page.locator('aside[aria-live="polite"]');
        await expect(coachPanel.locator('text=Concept clé :').first()).toBeVisible({ timeout: 15000 });
        await expect(coachPanel.locator('text=Conseil :').first()).toBeVisible();

        // Vérifie qu'un indicateur de source valide est présent
        const sourceIndicator = coachPanel.locator('[data-testid^="coach-source-"]').first();
        await expect(sourceIndicator).toBeVisible();
    });

    test('permet de fermer le panneau du coach via le bouton ✕', async ({ page }) => {
        await page.getByTestId('coach-hud-trigger').click();

        const coachPanel = page.locator('aside[aria-live="polite"]');
        await expect(coachPanel).toBeVisible();

        // Clique sur le bouton de fermeture
        const closeBtn = coachPanel.getByLabel('Fermer');
        await closeBtn.click();

        // Le panneau du coach est désormais masqué
        await expect(coachPanel).not.toBeVisible();
    });

    test('lance un rollout profond GNUBG avec progression remontée en direct et verdict statistique', async ({ page }) => {
        await page.getByTestId('coach-hud-trigger').click();

        const rolloutSection = page.getByTestId('deep-rollout-section');
        await expect(rolloutSection).toBeVisible();

        // Vérifie les stats du pool de workers
        await expect(rolloutSection.getByTestId('worker-pool-stats')).toBeVisible();

        // Sélectionne le mode rapide 324 parties
        const btn324 = rolloutSection.getByTestId('trial-opt-324');
        await btn324.click();

        // Lance le rollout
        const startBtn = rolloutSection.getByTestId('start-rollout-btn');
        await expect(startBtn).toContainText(/324 parties/i);
        await startBtn.click();

        // Vérifie l'apparition du conteneur de progression temps réel
        const progressContainer = rolloutSection.getByTestId('rollout-progress-container');
        await expect(progressContainer).toBeVisible({ timeout: 5000 });

        // Vérifie la présence de la barre de progression
        const progressBar = rolloutSection.getByTestId('rollout-progress-bar');
        await expect(progressBar).toBeVisible();

        // Attend la complétion du rollout et l'affichage du verdict statistique
        const verdict = rolloutSection.getByTestId('rollout-verdict');
        await expect(verdict).toBeVisible({ timeout: 15000 });
        await expect(verdict).toContainText(/Confirmé|Renversement/i);

        // Vérifie le tableau de résultats
        const resultsTable = rolloutSection.getByTestId('rollout-results');
        await expect(resultsTable).toBeVisible();
    });
});
