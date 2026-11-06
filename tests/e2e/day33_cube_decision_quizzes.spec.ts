/**
 * @file tests/e2e/day33_cube_decision_quizzes.spec.ts
 * @description MISSION 33/50 : TEST PLAYWRIGHT E2E DES QUIZ DE VIDEAU (CUBE_DECISION).
 *
 * Invariants audités :
 *   1. Joueur connecté en mode Expert ou Intermédiaire.
 *   2. Boutons d'action explicites en FR (Pas de Double, Doubler ×2 / Accepter, Doubler ×2 / Refuser).
 *   3. Boutons d'action explicites en EN (No Double, Double ×2 / Take, Double ×2 / Pass).
 *   4. ZÉRO option BEAVER en match play.
 *   5. Validation de la réponse et affichage complet : % de victoire, % de Gammon, Seuil de prise (Take Point).
 *
 * Strictement <= 250 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

const MOCK_CUBE_QUIZ = {
    id: 'bgsage3p_v4_cube_m7_4a2a_3_5_3',
    quizType: 'CUBE_DECISION',
    conceptId: 'cube_decision',
    conceptName: 'Décision de Videau 3-Ply Cubeful (Double / Take / Pass)',
    dice: [0, 0],
    player: 'X',
    board: [
        0, 2, 0, 0, 0, 0, -5,
        0, -3, 0, 0, 0, 5,
        -5, 0, 0, 0, 3, 0,
        5, 0, 0, 0, 0, -2,
        0, 0, 0,
    ],
    optimalMove: 'Double / Pass',
    playedMove: 'No Double / Take',
    acceptableMoves: [],
    quizChoices: ['Double / Pass', 'No Double / Take', 'Double / Take'],
    equityLoss: 0.019,
    verdict: 'doubtful',
    whyFailed: 'No Double / Take concède 0.019 EMG en 3-ply.',
    explanation: 'Double / Pass devance No Double / Take de 0.019 EMG.',
    proverb: 'Vérifiez toujours le compte de course et les 36 réponses adverses.',
    hint: 'Observez le compte avant de décider du videau.',
    tier: 4,
    quizTargetER: 3.5,
    plyCount: 15,
    matchContext: {
        matchLength: 7,
        scoreX: 3,
        scoreO: 5,
        crawford: false,
        cubeValue: 1,
        cubeOwner: null,
    },
    candidateMoves3Ply: [
        { rank: 1, notation: 'Double / Pass', equityLoss: 0, win: 0.794, winGammon: 0.114 },
        { rank: 2, notation: 'No Double / Take', equityLoss: 0.019, win: 0.794, winGammon: 0.114 },
        { rank: 3, notation: 'Double / Take', equityLoss: 0.495, win: 0.794, winGammon: 0.114 },
    ],
};

test.describe('Mission 33/50 : Quiz de Videau (CUBE_DECISION) sur /puzzles', () => {
    test.beforeEach(async ({ page }) => {
        // Mock de l'API factory pour renvoyer le quiz de videau certifié
        await page.route('**/api/quizzes/factory*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    total: 1,
                    quizzes: [MOCK_CUBE_QUIZ],
                }),
            });
        });
    });

    test('1. En FR : Boutons explicites (Pas de Double, Doubler ×2 / Accepter, Refuser), 0 Beaver, et Télémétrie Take Point', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Authentifier le joueur (Mode Connecté) et définir la langue FR
        await page.goto('/?lang=fr');
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_player_gate', 'EXPERT');
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bg_locale', 'fr');
            window.localStorage.setItem(
                'bg_player_passport_v1',
                JSON.stringify({
                    pseudo: 'Expert GrandMaître',
                    email: 'expert@bgtour.com',
                    countryCode: 'FR',
                    countryName: 'France',
                    createdAtIso: new Date().toISOString(),
                }),
            );
        });

        await page.goto('/puzzles?concept=cube_decision&lang=fr');
        await page.waitForSelector('[data-testid="quiz-qcm-choices"]', { timeout: 15000 });

        // 1. Vérification du badge spécifique au Videau
        const diceBadge = page.locator('[data-testid="drill-dice-direction-badge"]');
        await expect(diceBadge).toBeVisible();
        await expect(diceBadge).toContainText('Décision de Videau');
        await expect(diceBadge).toContainText('Action avant de lancer');

        // 2. Boutons d'actions explicites en Français
        const choicesGrid = page.locator('[data-testid="quiz-qcm-choices"]');
        await expect(choicesGrid).toBeVisible();

        const noDoubleBtn = choicesGrid.locator('button:has-text("Pas de Double")');
        const doubleTakeBtn = choicesGrid.locator('button:has-text("Doubler ×2 / Accepter (Take)")');
        const doublePassBtn = choicesGrid.locator('button:has-text("Doubler ×2 / Refuser (Pass)")');

        await expect(noDoubleBtn).toBeVisible();
        await expect(doubleTakeBtn).toBeVisible();
        await expect(doublePassBtn).toBeVisible();

        // 3. Invariant Absolu : Zéro option Beaver
        const beaverBtn = choicesGrid.locator('button:has-text("Beaver")');
        await expect(beaverBtn).not.toBeVisible();

        // 4. Clic sur la bonne décision (Double / Pass)
        await doublePassBtn.click();

        // 5. Validation et affichage de la télémétrie complète du Videau
        const feedbackBanner = page.locator('[data-testid="drill-feedback-banner"]');
        await expect(feedbackBanner).toBeVisible({ timeout: 10000 });

        const telemetryBadge = page.locator('[data-testid="drill-cube-telemetry-badge"]');
        await expect(telemetryBadge).toBeVisible();

        // Vérifier les 3 grandeurs requises
        const winElem = page.locator('[data-testid="cube-win-pct"]');
        const gammonElem = page.locator('[data-testid="cube-gammon-pct"]');
        const takePointElem = page.locator('[data-testid="cube-take-point-pct"]');

        await expect(winElem).toContainText('% de victoire : 79.4%');
        await expect(gammonElem).toContainText('% de Gammon : 11.4%');
        await expect(takePointElem).toContainText('Take Point');

        // Explication pédagogique présente
        const optimalBlock = page.locator('[data-testid="coach-block-2-optimal"]');
        await expect(optimalBlock).toBeVisible();
        await expect(optimalBlock).toContainText('Double / Pass');
    });

    test('2. En EN : Boutons explicites (No Double, Double ×2 / Take, Double ×2 / Pass), 0 Beaver, et Télémétrie Take Point', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Authentifier le joueur en langue EN
        await page.goto('/?lang=en');
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_player_gate', 'EXPERT');
            window.localStorage.setItem('bgtour_locale', 'en');
            window.localStorage.setItem('bg_locale', 'en');
            window.localStorage.setItem(
                'bg_player_passport_v1',
                JSON.stringify({
                    pseudo: 'Expert GrandMaster',
                    email: 'expert@bgtour.com',
                    countryCode: 'US',
                    countryName: 'United States',
                    createdAtIso: new Date().toISOString(),
                }),
            );
        });

        await page.goto('/puzzles?concept=cube_decision&lang=en');
        await page.waitForSelector('[data-testid="quiz-qcm-choices"]', { timeout: 15000 });

        // 1. Vérification du badge en anglais
        const diceBadge = page.locator('[data-testid="drill-dice-direction-badge"]');
        await expect(diceBadge).toBeVisible();
        await expect(diceBadge).toContainText('Doubling Cube Decision');

        // 2. Boutons d'action en Anglais
        const choicesGrid = page.locator('[data-testid="quiz-qcm-choices"]');
        const noDoubleBtn = choicesGrid.locator('button:has-text("No Double")');
        const doubleTakeBtn = choicesGrid.locator('button:has-text("Double ×2 / Take")');
        const doublePassBtn = choicesGrid.locator('button:has-text("Double ×2 / Pass")');

        await expect(noDoubleBtn).toBeVisible();
        await expect(doubleTakeBtn).toBeVisible();
        await expect(doublePassBtn).toBeVisible();

        // 3. Invariant Absolu : Zéro Beaver
        const beaverBtn = choicesGrid.locator('button:has-text("Beaver")');
        await expect(beaverBtn).not.toBeVisible();

        // 4. Clic sur la bonne décision
        await doublePassBtn.click();

        // 5. Télémétrie en Anglais
        const telemetryBadge = page.locator('[data-testid="drill-cube-telemetry-badge"]');
        await expect(telemetryBadge).toBeVisible();

        await expect(page.locator('[data-testid="cube-win-pct"]')).toContainText('Win: 79.4%');
        await expect(page.locator('[data-testid="cube-gammon-pct"]')).toContainText('Gammon: 11.4%');
        await expect(page.locator('[data-testid="cube-take-point-pct"]')).toContainText('Take Point:');
    });
});
