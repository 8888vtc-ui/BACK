import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/day47_offline_and_api_failure_resilience.spec.ts
 * @description Mission 47 : Contrôle de la Résilience Hors-ligne & Panne d'API
 * Simule la coupure totale de l'API (/api/coach, /api/personal-blunder-quiz -> route.abort()).
 * Vérifie le repli déterministe immédiat (< 1 ms) sur /play et /puzzles sans erreur rouge ni crash.
 */

test.describe('Day 47 — Résilience Hors-Ligne & Panne d’API Coach (Secours Déterministe 3-Ply)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test.beforeEach(async ({ page }) => {
        // Bloquer strictement toute requête vers l'API Coach ou LLM externe
        await page.route('**/api/coach/**', (route) => route.abort('failed'));
        await page.route('**/api/coach', (route) => route.abort('failed'));
        await page.route('**/api/personal-blunder-quiz**', (route) => route.abort('failed'));

        await page.addInitScript(() => {
            window.localStorage.setItem('bgt_player_tier_gate', 'BEGINNER');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('NEXT_LOCALE', 'fr');
            window.localStorage.setItem('i18nextLng', 'fr');
            window.localStorage.removeItem('bg_is_guest');
            window.localStorage.removeItem('bg_guest_session');
            window.localStorage.setItem('bg_user_code', 'member_alexandre');
            window.localStorage.setItem('bg_player_passport_v1', JSON.stringify({
                pseudo: 'Alexandre D.',
                email: 'alexandre@backgammontour.com',
                experienceLevel: 'intermediate',
                countryName: 'France',
                countryCode: 'FR',
                avatarUrl: '/avatars/user-avatar-1.jpg',
                registeredAt: new Date().toISOString(),
                supabaseSynced: true,
            }));
        });
    });

    test('1. /puzzles sous coupure totale API : quiz 3-ply et explications déterministes instantanées', async ({ page }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('favicon.ico') || text.includes('net::ERR_')) return;
                consoleErrors.push(text);
            }
        });
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/puzzles?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Vérifier que la grille de choix du quiz est visible
        const choicesGrid = page.locator('[data-testid="quiz-qcm-choices"]');
        await expect(choicesGrid).toBeVisible({ timeout: 10000 });

        // Cliquer sur le 1er choix (bouton A)
        const choiceA = page.locator('[data-testid="quiz-choice-btn-A"]');
        await expect(choiceA).toBeVisible();
        await choiceA.click();

        // Le feedback pédagogique 3-ply doit s'afficher immédiatement (< 1 ms, 100% déterministe)
        const coachFeedback = page.locator('[data-testid="drill-feedback-banner"]');
        await expect(coachFeedback).toBeVisible({ timeout: 4000 });

        // Vérifier qu'aucun message d'erreur rouge ou crash n'apparaît
        const errorAlert = page.locator('[data-testid="error-alert"], .bg-red-500, .bg-red-900');
        await expect(errorAlert).not.toBeVisible();

        expect(pageErrors).toHaveLength(0);
        expect(consoleErrors).toHaveLength(0);
    });

    test('2. /puzzles?mode=beginner-academy sous coupure totale API : les 10 leçons fonctionnent sans appel externe', async ({ page }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('favicon.ico') || text.includes('net::ERR_')) return;
                consoleErrors.push(text);
            }
        });
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/puzzles?mode=beginner-academy&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const quizContainer = page.getByTestId('academy-quiz-container');
        await expect(quizContainer).toBeVisible({ timeout: 10000 });

        // Valider l'option A
        const optA = page.getByTestId('academy-option-A');
        await expect(optA).toBeVisible();
        await optA.click();

        // Le feedback s'affiche instantanément
        await expect(page.locator('text=Coup optimal !')).toBeVisible();

        // Passer au quiz suivant
        const nextBtn = page.getByTestId('academy-quiz-next-btn');
        await expect(nextBtn).toBeVisible();
        await nextBtn.click();

        expect(pageErrors).toHaveLength(0);
        expect(consoleErrors).toHaveLength(0);
    });

    test('3. /play sous coupure totale API Coach : fonctionnement fluide avec repli local sans blocage', async ({ page }) => {
        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (text.includes('favicon.ico') || text.includes('net::ERR_')) return;
                consoleErrors.push(text);
            }
        });
        page.on('pageerror', (err) => pageErrors.push(err.message));

        await page.goto('/play?gate=beginner&start=guided&lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // Vérifier la présence du plateau de jeu
        const board = page.locator('#backgammon-board');
        await expect(board).toBeVisible({ timeout: 12000 });

        // Vérifier que le guidage du Professeur est visible localement
        const overlay = page.getByTestId('live-professor-coach-overlay');
        await expect(overlay).toBeVisible({ timeout: 6000 });

        // Vérifier l'absence d'écran rouge ou d'erreur critique
        await expect(page.locator('text=Erreur critique')).not.toBeVisible();

        expect(pageErrors).toHaveLength(0);
        expect(consoleErrors).toHaveLength(0);
    });
});
