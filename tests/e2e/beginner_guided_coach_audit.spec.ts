import { test, expect } from '@playwright/test';

test.describe('E2E Audit — Professeur Interactif Pas-à-Pas (Débutant / Zero-Jargon)', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgt_active_difficulty', 'beginner');
        });
    });

    test('Preuve 1 : Zéro jargon expert ni faux badges (3-Ply, Open Sage, PR Match, EMG, MWC)', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Vérifier l'absence totale de jargon et fausses étiquettes dans le jeu
        const gameView = page.locator('[data-testid="app-game-view"]');
        await expect(gameView).toBeVisible();
        const bodyText = await gameView.innerText();

        expect(bodyText).not.toContain('IA 3-Ply');
        expect(bodyText).not.toContain('Open Sage 3-Ply');
        expect(bodyText).not.toContain('PR Match :');
        expect(bodyText).not.toContain('0.040 EMG');
        expect(bodyText).not.toContain('EMG');
        expect(bodyText).not.toContain('MWC');
        expect(bodyText).not.toContain('Cubeful');

        // Badge adversaire montre Partie Guidée ou Bot IA, jamais Open Sage 3-Ply
        const botEngineBadge = page.locator('[data-testid="left-rail-bot-engine-badge"]');
        if (await botEngineBadge.count() > 0) {
            const badgeText = await botEngineBadge.innerText();
            expect(badgeText).not.toContain('3-Ply');
            expect(badgeText).toContain('Partie Guidée');
        }
    });

    test('Preuve 2 : Conseil proactif avant coup (Temps A) dans le bandeau du Professeur', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Le texte du dialogue du professeur doit afficher un conseil clair d'au moins 15 caractères
        const dialogueText = page.locator('[data-testid="professor-dialogue-text"]');
        await expect(dialogueText).toBeVisible();
        const initialText = await dialogueText.innerText();
        expect(initialText.length).toBeGreaterThan(15);
        expect(initialText).not.toContain('EMG');
        expect(initialText).not.toContain('MWC');

        // Lancer les dés (via bouton ou barre d'espace)
        const rollBtn = page.locator('[data-testid="center-roll-button"]').first();
        if (await rollBtn.count() > 0) {
            await page.evaluate(() => (document.querySelector('[data-testid="center-roll-button"]') as HTMLElement)?.click());
        } else {
            await page.keyboard.press('Space');
        }
        await page.waitForTimeout(600);

        const currentText = await dialogueText.innerText();
        expect(currentText.length).toBeGreaterThan(15);
        expect(currentText).not.toContain('EMG');
        expect(currentText).not.toContain('MWC');
    });

    test('Preuve 3 : Bouton [Voir le coup conseillé] ou Idée du Professeur', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Bouton "Idée du Professeur"
        const hintBtn = page.locator('[data-testid="professor-ask-hint-btn"]');
        await expect(hintBtn).toBeVisible();
        await page.evaluate(() => (document.querySelector('[data-testid="professor-ask-hint-btn"]') as HTMLElement)?.click());

        const dialogueText = page.locator('[data-testid="professor-dialogue-text"]');
        await expect(dialogueText).toContainText(/Conseil du Professeur|Professor Tip/i);

        // Si le bouton d'aide visuelle est visible
        const showArrowBtn = page.locator('[data-testid="professor-show-arrow-btn"]');
        if (await showArrowBtn.count() > 0) {
            await showArrowBtn.click({ force: true });
            await expect(showArrowBtn).toContainText(/Masquer|Hide/i);
        }
    });

    test('Preuve 4 : Guidage visuel du sens de marche et boussole de course sans popup punitif', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Boussole de course
        const compass = page.locator('[data-testid="beginner-race-compass"]');
        await expect(compass).toBeVisible();
        await expect(compass).toContainText(/Course|Race/i);

        // Indicateur du sens de marche
        const direction = page.locator('[data-testid="direction-horseshoe-indicator"]');
        await expect(direction).toBeVisible();
        await expect(direction).toContainText(/Sens de marche|Checker Direction/i);

        // Aucun toast d'erreur bloquant n'est présent initialement
        const errorToast = page.locator('[data-testid="move-error-pop-toast"]');
        await expect(errorToast).toHaveCount(0);
    });

    test('Preuve 5 : Outils pédagogiques Débutant (synthèse vocale et Guide 6 Chapitres)', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        const overlay = page.locator('[data-testid="live-professor-coach-overlay"]');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Bouton de synthèse vocale fonctionnel
        const voiceBtn = page.locator('[data-testid="professor-voice-btn"]');
        await expect(voiceBtn).toBeVisible();

        // Guide 6 Chapitres accessible
        const guideBtn = page.locator('[data-testid="professor-open-guide-btn"]');
        await expect(guideBtn).toBeVisible();
        await page.evaluate(() => (document.querySelector('[data-testid="professor-open-guide-btn"]') as HTMLElement)?.click());

        // Le modal du guide interactif s'ouvre
        const guideModal = page.locator('[data-testid="beginner-interactive-guide-modal"]');
        await expect(guideModal).toBeVisible();

        // Fermer le guide
        const closeBtn = page.locator('button:has-text("✕")').first();
        if (await closeBtn.isVisible()) {
            await closeBtn.click({ force: true });
        }
    });

    test('Preuve 6 : Bouton Rejouer / Annuler disponible pour le débutant', async ({ page }) => {
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');

        const undoBtn = page.locator('[data-testid="professor-undo-move-btn"]');
        await expect(undoBtn).toBeVisible();
        await expect(undoBtn).toContainText(/Rejouer|Undo/i);
    });
});
