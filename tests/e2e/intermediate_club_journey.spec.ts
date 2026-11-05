/**
 * @file tests/e2e/intermediate_club_journey.spec.ts
 * @description Suite Playwright E2E — Mode Intermédiaire / Club (Porte 2).
 * Tests complets : Bascule Porte 2, Formats 3/5/7 pts & Money, 4 Clés de Club (Videau, Pips, /36, Plans),
 * 3 Quiz Flash, Option Masquer les Pips, Bilinguisme FR/EN et Mobile/Desktop sans erreur console.
 * Strictement <= 300 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Circuit Intermédiaire / Club (Porte 2) — E2E Journey', () => {

    test('Test Playwright #1 : Bascule Porte 2 Intermédiaire & Priorité au Jeu', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // Clic sur la porte Intermédiaire (premier bouton visible)
        const intermediateBtn = page.locator('[data-testid="tier-gate-btn-intermediate"]:visible').first();
        await expect(intermediateBtn).toBeVisible();
        await intermediateBtn.click();

        // Vérification de la présence immédiate du portail intermédiaire
        const portal = page.getByTestId('intermediate-home-portal');
        await expect(portal).toBeVisible();

        // Vérification du localStorage
        const savedGate = await page.evaluate(() => localStorage.getItem('bgtour_player_gate'));
        expect(savedGate).toBe('INTERMEDIATE');

        // Formats de match 3, 5, 7 pts et Money Game
        await expect(page.getByTestId('match-format-3')).toBeVisible();
        await expect(page.getByTestId('match-format-5')).toBeVisible();
        await expect(page.getByTestId('match-format-7')).toBeVisible();
        await expect(page.getByTestId('match-format-money')).toBeVisible();

        // Bouton Or Jouer Maintenant & Bouton Inviter un ami
        const playBtn = page.getByTestId('intermediate-play-btn');
        await expect(playBtn).toBeVisible();
        await expect(page.getByTestId('intermediate-invite-btn')).toBeVisible();
    });

    test('Test Playwright #2 : Les 4 Clés Intermédiaires (Videau, Compter sans Pips, Pions Isolés /36, Plans)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/?gate=intermediate', { waitUntil: 'networkidle' });

        const secretsCard = page.getByTestId('intermediate-club-secrets-card');
        await expect(secretsCard).toBeVisible();

        // Clé 1 : Le Videau
        const tab1 = page.getByTestId('club-key-tab-1');
        await expect(tab1).toBeVisible();
        await tab1.click();
        await expect(secretsCard).toContainText(/Videau|Doubling Cube|22|25/i);

        // Clé 2 : Compter sans Pips en Tournoi
        const tab2 = page.getByTestId('club-key-tab-2');
        await expect(tab2).toBeVisible();
        await tab2.click();
        await expect(secretsCard).toContainText(/167|Symétrie|Symmetry|Paquets|Cluster/i);

        // Clé 3 : Pions Isolés & Calcul sur 36
        const tab3 = page.getByTestId('club-key-tab-3');
        await expect(tab3).toBeVisible();
        await tab3.click();
        await expect(secretsCard).toContainText(/11.*36|20.*36|55%/i);

        // Clé 4 : Plans de Jeu & Adaptation
        const tab4 = page.getByTestId('club-key-tab-4');
        await expect(tab4).toBeVisible();
        await tab4.click();
        await expect(secretsCard).toContainText(/Course|Race|Prime|Blitz|Backgame/i);
    });

    test('Test Playwright #3 : Les 3 Quiz Flash Intermédiaires & Option Masquer les Pips', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/?gate=intermediate', { waitUntil: 'networkidle' });

        const drillsCard = page.getByTestId('intermediate-quick-drills');
        await expect(drillsCard).toBeVisible();

        // Option Masquer les Pips
        const hidePipsBtn = page.getByTestId('hide-pips-toggle-btn');
        await expect(hidePipsBtn).toBeVisible();
        await hidePipsBtn.click();
        await expect(hidePipsBtn).toContainText(/ON|masqués|hidden/i);

        // Quiz 1 : Timing du Videau
        const quiz1Tab = page.getByTestId('intermediate-quiz-1');
        await expect(quiz1Tab).toBeVisible();
        await quiz1Tab.click();
        const q1Option = page.getByTestId('drill-option-1-1'); // Option correcte: Doubler maintenant
        await expect(q1Option).toBeVisible();
        await q1Option.click();
        await expect(page.getByTestId('drill-feedback-box')).toContainText(/Optimal|Doubler/i);

        // Quiz 2 : Pions isolés sur 36
        const quiz2Tab = page.getByTestId('intermediate-quiz-2');
        await expect(quiz2Tab).toBeVisible();
        await quiz2Tab.click();
        const q2Option = page.getByTestId('drill-option-2-0'); // Option correcte: Fermer la porte
        await expect(q2Option).toBeVisible();
        await q2Option.click();
        await expect(page.getByTestId('drill-feedback-box')).toContainText(/3\/36|Optimal/i);

        // Quiz 3 : Compter sans pips & Plan
        const quiz3Tab = page.getByTestId('intermediate-quiz-3');
        await expect(quiz3Tab).toBeVisible();
        await quiz3Tab.click();
        const q3Option = page.getByTestId('drill-option-3-0'); // Option correcte: Rompre contact & Course
        await expect(q3Option).toBeVisible();
        await q3Option.click();
        await expect(page.getByTestId('drill-feedback-box')).toContainText(/Course|Race|contact/i);
    });

    test('Test Playwright #4 : Bilinguisme FR/EN, Géométrie Mobile & Zéro Erreur Console', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('pageerror', (err) => consoleErrors.push(err.message));

        // Test Desktop
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const intermediateBtn = page.locator('[data-testid="tier-gate-btn-intermediate"]:visible').first();
        await expect(intermediateBtn).toBeVisible();
        await intermediateBtn.click();

        // Bascule de langue FR <-> EN
        const localeToggleBtn = page.getByTestId('navbar-locale-toggle-btn');
        await expect(localeToggleBtn).toBeVisible();
        await localeToggleBtn.click();

        const portal = page.getByTestId('intermediate-home-portal');
        await expect(portal).toBeVisible();

        // Test Mobile (390x844)
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(portal).toBeVisible();

        // 0 crash runtime console
        expect(consoleErrors.filter(msg => !msg.includes('WebSocket') && !msg.includes('net::ERR'))).toEqual([]);
    });
});

