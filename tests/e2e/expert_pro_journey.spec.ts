/**
 * @file tests/e2e/expert_pro_journey.spec.ts
 * @description Suite Playwright E2E — Porte 3 (Expert / Pro — Compétition).
 * Tests complets : Cockpit 3 à 21 pts + Money Game, Télémétrie ER/PR/ERA/Rating,
 * Cap historique 6.0 ER (Snowie/XG) & ERA, Filtres 3-ply & Quiz Expert, Zéro erreur console.
 * Strictement <= 300 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Circuit Expert / Pro (Porte 3) — E2E Journey', () => {

    test('Test Playwright #1 : Bascule Porte 3 Expert & Formats 3 à 21 pts + Money Game', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Clic sur la porte Expert (premier bouton visible)
        const expertBtn = page.locator('[data-testid="tier-gate-btn-expert"]:visible').first();
        await expect(expertBtn).toBeVisible();
        await expertBtn.click();

        // Vérification de la présence immédiate du portail expert
        const portal = page.getByTestId('expert-home-portal');
        await expect(portal).toBeVisible();

        // Vérification du localStorage
        const savedGate = await page.evaluate(() => localStorage.getItem('bgtour_player_gate'));
        expect(savedGate).toBe('EXPERT');

        // Formats de tournoi 3, 5, 7, 9, 11, 21 pts et Money Game
        await expect(page.getByTestId('expert-format-3')).toBeVisible();
        await expect(page.getByTestId('expert-format-5')).toBeVisible();
        await expect(page.getByTestId('expert-format-7')).toBeVisible();
        await expect(page.getByTestId('expert-format-9')).toBeVisible();
        await expect(page.getByTestId('expert-format-11')).toBeVisible();
        await expect(page.getByTestId('expert-format-21')).toBeVisible();
        await expect(page.getByTestId('expert-format-money')).toBeVisible();

        // Télémétrie permanente : ER/PR, ERA, Rating
        await expect(page.getByTestId('expert-er-pr')).toContainText('6.3');
        await expect(page.getByTestId('expert-era')).toContainText('5.8');
        await expect(page.getByTestId('expert-rating')).toContainText('1500');

        // Bouton de lancement
        await expect(page.getByTestId('expert-play-btn')).toBeVisible();
    });

    test('Test Playwright #2 : Explication de la Norme < 6.0 ER Snowie/XG & ERA', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/?gate=expert', { waitUntil: 'networkidle' });

        const capCard = page.getByTestId('cap-6-er-era-card');
        await expect(capCard).toBeVisible();

        // Vérification du contenu historique Snowie / XG et ERA
        await expect(capCard).toContainText(/Snowie|XG/i);
        await expect(capCard).toContainText(/6\.0|6 ou 7/i);
        await expect(capCard).toContainText(/Error Rate Adaptatif|Adaptive Error Rate|ERA/i);
        await expect(capCard).toContainText(/hasard|luck|Champion/i);

        // Bouton de lecture audio
        const voiceBtn = page.getByTestId('cap-6-er-voice-btn');
        await expect(voiceBtn).toBeVisible();
    });

    test('Test Playwright #3 : Quiz Expert < 6.0, Filtre Videau Pro & Télémétrie 3-ply', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/?gate=expert', { waitUntil: 'networkidle' });

        const drillsCard = page.getByTestId('expert-telemetry-drills-card');
        await expect(drillsCard).toBeVisible();

        // Clic sur filtre Cube
        const cubeFilter = page.getByTestId('expert-filter-cube');
        await expect(cubeFilter).toBeVisible();
        await cubeFilter.click();

        // Clic sur filtre Tous
        const allFilter = page.getByTestId('expert-filter-all');
        await expect(allFilter).toBeVisible();
        await allFilter.click();

        // Validation du Quiz 1 (Checker Play)
        const quiz1Tab = page.getByTestId('expert-drill-1');
        await expect(quiz1Tab).toBeVisible();
        await quiz1Tab.click();

        const choice1 = page.getByTestId('expert-choice-1-0');
        await expect(choice1).toBeVisible();
        await choice1.click();

        // Vérification de la télémétrie post-validation (Perte ΔEMG et matrice de probabilités)
        await expect(page.getByTestId('expert-telemetry-loss')).toBeVisible();
        await expect(page.getByTestId('expert-telemetry-loss')).toContainText(/EMG/i);
        await expect(page.getByTestId('expert-telemetry-probs')).toBeVisible();
        await expect(page.getByTestId('expert-telemetry-probs')).toContainText(/W:|WG:/i);

        // Validation du Quiz 3 (Cube Decision & Fenêtre de Videau)
        const quiz3Tab = page.getByTestId('expert-drill-3');
        await expect(quiz3Tab).toBeVisible();
        await quiz3Tab.click();

        const choice3 = page.getByTestId('expert-choice-3-0');
        await expect(choice3).toBeVisible();
        await choice3.click();

        // Fenêtre de videau visible
        const cubeWindow = page.getByTestId('expert-telemetry-cube-window');
        await expect(cubeWindow).toBeVisible();
        await expect(cubeWindow).toContainText(/No Double|Double\/Take|Take Point/i);
    });

    test('Test Playwright #4 : Géométrie Mobile (390x844), Conditions Tournoi & Zéro Erreur Console', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));

        // Test Mobile
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/?gate=expert', { waitUntil: 'networkidle' });

        const portal = page.getByTestId('expert-home-portal');
        await expect(portal).toBeVisible();

        // Bouton Masquer Pips (Conditions Tournoi)
        const hidePipsBtn = page.getByTestId('expert-hide-pips-btn');
        await expect(hidePipsBtn).toBeVisible();
        await hidePipsBtn.click();
        await expect(hidePipsBtn).toContainText(/Masqué|Hidden/i);

        // Zéro crash console
        expect(consoleErrors.filter(msg => !msg.includes('WebSocket') && !msg.includes('net::ERR'))).toEqual([]);
    });
});

