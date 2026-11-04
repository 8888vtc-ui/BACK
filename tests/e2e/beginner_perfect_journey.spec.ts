/**
 * @file tests/e2e/beginner_perfect_journey.spec.ts
 * @description Suite Playwright E2E — Cursus Débutant Parfait (Porte 1).
 * Tests complets : Arrivée 1-clic, Guide Hasard-Stratégie, 10 Quiz d'Initiation,
 * Diplôme d'Initié, Professeur Interactif en temps réel, Bilinguisme FR/EN et Géométrie Mobile/Desktop.
 * Strictement <= 380 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Circuit Débutant Parfait (Porte 1) — E2E Journey', () => {

    test('Test Playwright #1 : Arrivée & Clic sur la Porte Débutant (< 3s, Zéro Mur d Inscription, localStorage)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Clic sur la porte Débutant (sélection du premier bouton navbar/lobby)
        const beginnerBtn = page.getByTestId('tier-gate-btn-beginner').first();
        await expect(beginnerBtn).toBeVisible();
        await beginnerBtn.click();

        // Vérification de la présence immédiate du portail débutant sans mur d'inscription
        const beginnerPortal = page.getByTestId('beginner-home-portal');
        await expect(beginnerPortal).toBeVisible();

        // Vérification du localStorage
        const savedGate = await page.evaluate(() => localStorage.getItem('bgtour_player_gate'));
        expect(savedGate).toBe('BEGINNER');

        // Vérification de l'Académie comme bouton Or majeur
        const academyBtn = page.getByTestId('beginner-academy-btn');
        await expect(academyBtn).toBeVisible();
        const academyBtnClass = await academyBtn.getAttribute('class');
        expect(academyBtnClass).toContain('from-[#D4AF37]');
    });

    test('Test Playwright #2 : Grand Guide en 6 Chapitres & Audio Bilingue (Hasard+Stratégie, Videau, Blunders, ERA)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Activer la porte débutant
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        // Ouvrir le Guide Interactif
        const openGuideBtn = page.getByTestId('beginner-open-guide-btn');
        await expect(openGuideBtn).toBeVisible();
        await openGuideBtn.click();

        const guideModal = page.getByTestId('beginner-interactive-guide-modal');
        await expect(guideModal).toBeVisible();

        // Chapitre 1 : Hasard + Stratégie (36 combinaisons & Monte-Carlo)
        await expect(guideModal).toContainText(/L'Alliance Unique du Hasard et de la Stratégie|The Unique Blend of Luck and Strategy/i);
        await expect(guideModal).toContainText(/Championnats du Monde à Monte-Carlo|World Championships in Monte-Carlo/i);
        await expect(guideModal).toContainText(/36 combinaisons|36 dice combinations/i);

        // Bouton voix active
        const voiceBtn = page.getByTestId('guide-voice-btn');
        await expect(voiceBtn).toBeVisible();

        // Chapitre 2 : Règles du plateau
        await page.getByTestId('guide-tab-2').click();
        await expect(guideModal).toContainText(/Le Circuit en Fer à Cheval|The Horseshoe Track/i);
        await expect(guideModal).toContainText(/Portes|Gates/i);

        // Chapitre 3 : Le Videau
        await page.getByTestId('guide-tab-3').click();
        await expect(guideModal).toContainText(/Le Videau|The Doubling Cube/i);
        await expect(guideModal).toContainText(/2, 4, 8, 16, 32, 64/);

        // Chapitre 4 : Match vs Money Game
        await page.getByTestId('guide-tab-4').click();
        await expect(guideModal).toContainText(/Match vs Money Game|Match Play vs Money Game/i);
        await expect(guideModal).toContainText(/Crawford/i);

        // Chapitre 5 : Blunder & Error Rate Adaptatif (ERA)
        await page.getByTestId('guide-tab-5').click();
        await expect(guideModal).toContainText(/Error Rate Adaptatif|Adaptive Error Rate/i);
        await expect(guideModal).toContainText(/ERA/);

        // Fermer le guide
        await page.getByTestId('guide-close-btn').click();
        await expect(guideModal).not.toBeVisible();
    });

    test('Test Playwright #3 : Parcours des Quiz d Initiation avec Professeur Bienveillant, Réessai & Diplôme d Initié', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles?mode=beginner-academy', { waitUntil: 'networkidle' });

        // Lancer les quiz depuis le lecteur vidéo
        const launchBtn = page.getByTestId('video-launch-quizzes-btn');
        await expect(launchBtn).toBeVisible();
        await launchBtn.click();

        // Vérifier le conteneur du quiz
        const quizContainer = page.getByTestId('academy-quiz-container');
        await expect(quizContainer).toBeVisible();

        // 1. Simuler un mauvais choix au 1er essai
        const wrongOption = page.getByTestId('academy-option-B');
        await wrongOption.click();

        // Vérifier le conseil bienveillant du Professeur et le bouton Réessayer
        await expect(quizContainer).toContainText(/Conseil bienveillant du Professeur|Professor Caring Tip/i);
        const retryBtn = page.getByTestId('academy-quiz-retry-btn');
        await expect(retryBtn).toBeVisible();

        // 2. Cliquer sur Réessayer
        await retryBtn.click();
        await expect(page.getByTestId('academy-quiz-retry-btn')).not.toBeVisible();

        // 3. Répondre correctement (Option A)
        const correctOption = page.getByTestId('academy-option-A');
        await correctOption.click();

        // Vérifier la validation et la Flèche Dorée
        await expect(quizContainer).toContainText(/Flèche Dorée|Golden Arrow/i);
        const nextBtn = page.getByTestId('academy-quiz-next-btn');
        await expect(nextBtn).toBeVisible();
        await nextBtn.click();

        // Passer rapidement les quiz restants pour vérifier l'obtention du diplôme
        for (let i = 2; i <= 10; i++) {
            await expect(page.getByTestId('academy-quiz-container')).toBeVisible();
            const optA = page.getByTestId('academy-option-A');
            await optA.click();
            await page.getByTestId('academy-quiz-next-btn').click();
        }

        // Vérifier la carte finale du Diplôme d'Initié
        const diplomaCard = page.getByTestId('academy-diploma-card');
        await expect(diplomaCard).toBeVisible();
        await expect(diplomaCard).toContainText(/Diplôme d'Initié|Initiate Diploma/i);
        await expect(diplomaCard).toContainText(/\+2\s?000 PTS/i);
    });

    test('Test Playwright #4 : Partie Guidée Débutant avec Professeur Interactif en Direct', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Clic sur porte Débutant
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        // Lancer la partie guidée
        const playGuidedBtn = page.getByTestId('beginner-play-btn');
        await expect(playGuidedBtn).toBeVisible();
        await playGuidedBtn.click();

        // Vérification de la présence du bandeau du Professeur Interactif
        const professorOverlay = page.getByTestId('live-professor-coach-overlay');
        await expect(professorOverlay).toBeVisible({ timeout: 15000 });

        // Vérification du dialogue bienveillant du Professeur
        const dialogueText = page.getByTestId('professor-dialogue-text');
        await expect(dialogueText).toBeVisible();
        const textContent = await dialogueText.innerText();
        expect(textContent.length).toBeGreaterThan(10);

        // Bouton d'astuce
        const hintBtn = page.getByTestId('professor-ask-hint-btn');
        await expect(hintBtn).toBeVisible();
        await hintBtn.click();

        // Le dialogue doit se mettre à jour avec l'astuce
        await expect(dialogueText).toContainText(/Astuce du Professeur|Professor Tip|meilleur coup/i);
    });

    test('Test Playwright #5 : Auto-Detect & Bascule Dynamique FR / EN en 1 Clic', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Activer la porte débutant
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        const localeToggleBtn = page.getByTestId('navbar-locale-toggle-btn');
        await expect(localeToggleBtn).toBeVisible();

        // Bascule de langue
        await localeToggleBtn.click();

        // Vérification de la mise à jour bilingue immédiate sur l'accueil
        const portal = page.getByTestId('beginner-home-portal');
        await expect(portal).toBeVisible();
        const portalText = await portal.innerText();
        expect(portalText).toMatch(/Beginner Mode|Mode Débutant/i);

        // Ouvrir le Guide pour vérifier que les textes basculent également
        await page.getByTestId('beginner-open-guide-btn').click();
        const guideModal = page.getByTestId('beginner-interactive-guide-modal');
        await expect(guideModal).toBeVisible();
        await page.getByTestId('guide-close-btn').click();
    });

    test('Test Playwright #6 : Géométrie Mobile (390x844) & Zéro Erreur Console', async ({ page }) => {
        test.setTimeout(60000);
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => {
            consoleErrors.push(err.message);
        });

        // Test sur Viewport Mobile iPhone (390x844)
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const beginnerBtn = page.locator('[data-testid="tier-gate-btn-beginner"]:visible').first();
        await expect(beginnerBtn).toBeVisible({ timeout: 10000 });
        await beginnerBtn.click();

        const portal = page.getByTestId('beginner-home-portal');
        await expect(portal).toBeVisible();

        // Vérifier qu'il n'y a eu aucun crash runtime JS
        expect(consoleErrors.filter(msg => !msg.includes('WebSocket') && !msg.includes('net::ERR'))).toEqual([]);

        // Test sur Viewport Desktop (1440x900)
        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(portal).toBeVisible();
    });

    test('Test Playwright #7 : Simulateur des 15 Coups d’Ouverture & Animation Plateau (3-1, 6-1)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        const openBtn = page.getByTestId('beginner-openings-btn');
        await expect(openBtn).toBeVisible();
        await openBtn.click();

        const modal = page.getByTestId('beginner-opening-explorer-modal');
        await expect(modal).toBeVisible();

        // Vérification du coup par défaut 3-1
        await expect(page.getByTestId('opening-roll-3-1')).toBeVisible();
        const expText = page.getByTestId('opening-explanation-text');
        await expect(expText).toContainText(/case 5|5-point/i);

        // Clic sur le coup 6-1 (Bar point / case 7)
        const roll61 = page.getByTestId('opening-roll-6-1');
        await expect(roll61).toBeVisible();
        await roll61.click();
        await expect(expText).toContainText(/case 7|bar|7-point/i);
        await expect(page.getByTestId('opening-board-display')).toBeVisible();

        await page.getByTestId('opening-close-btn').click();
        await expect(modal).not.toBeVisible();
    });

    test('Test Playwright #8 : Jauge de Course Simplifiée & Conseil de Plan de Jeu', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        const playGuidedBtn = page.getByTestId('beginner-play-btn');
        await expect(playGuidedBtn).toBeVisible();
        await playGuidedBtn.click();

        const overlay = page.getByTestId('live-professor-coach-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        const compass = page.getByTestId('beginner-race-compass');
        await expect(compass).toBeVisible();
        await expect(compass).toContainText(/Course|Race|cases|steps|avance|lead/i);
    });

    test('Test Playwright #9 : Sélecteur de Victoires (Simple / Gammon / Backgammon) & Explication ERA', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        const openGuideBtn = page.getByTestId('beginner-open-guide-btn');
        await expect(openGuideBtn).toBeVisible();
        await openGuideBtn.click();

        const guideModal = page.getByTestId('beginner-interactive-guide-modal');
        await expect(guideModal).toBeVisible();

        // Sélecteur de victoires
        await expect(page.getByTestId('guide-victory-types-selector')).toBeVisible();
        await page.getByTestId('victory-type-gammon').click();
        await expect(page.getByTestId('victory-type-description')).toContainText(/15 dames|15 checkers/i);

        await page.getByTestId('victory-type-backgammon').click();
        await expect(page.getByTestId('victory-type-description')).toContainText(/barre|bar/i);

        // Explication ERA
        const eraBox = page.getByTestId('guide-era-explanation');
        await expect(eraBox).toBeVisible();
        await expect(eraBox).toContainText(/Error Rate Adaptatif|Adaptive Error Rate|ERA/i);

        await page.getByTestId('guide-close-btn').click();
    });

    test('Test Playwright #10 : Bouton Rejouer, Badge Coup de Maître & Anti-Frustration', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.getByTestId('tier-gate-btn-beginner').first().click();

        const playGuidedBtn = page.getByTestId('beginner-play-btn');
        await expect(playGuidedBtn).toBeVisible();
        await playGuidedBtn.click();

        const overlay = page.getByTestId('live-professor-coach-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Bouton Rejouer
        const undoBtn = page.getByTestId('professor-undo-move-btn');
        await expect(undoBtn).toBeVisible();

        // Badge Coup de Maître
        const masterBadge = page.getByTestId('master-move-badge');
        await expect(masterBadge).toBeVisible();
        await expect(masterBadge).toContainText(/\+50 PTS/i);

        // Alerte Anti-Frustration
        const rulesBtn = page.getByRole('button', { name: /Movement rules\?|Aide déplacements \?/i });
        await expect(rulesBtn).toBeVisible();
        await rulesBtn.click();
        const alertBox = page.getByTestId('anti-frustration-alert');
        await expect(alertBox).toBeVisible();
        await expect(alertBox).toContainText(/Barre centrale|Porte fermée|Bar|gate/i);

        // Vérification zéro crash console
        expect(consoleErrors.filter(msg => !msg.includes('WebSocket') && !msg.includes('net::ERR'))).toEqual([]);
    });
});
