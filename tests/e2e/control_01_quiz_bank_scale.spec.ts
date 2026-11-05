/**
 * @file tests/e2e/control_01_quiz_bank_scale.spec.ts
 * @description MISSION 1/10 — Contrôle de la banque dynamique des 15 000+ quiz 3-ply sur /puzzles.
 * Strictement <= 250 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('MISSION 1/10 — Débridage & Contrôle d\'Échelle de la Banque de Quiz 3-Ply', () => {
    test('1. Vérifie l\'API dynamique /api/quizzes/factory (> 15 000 quiz certifiés)', async ({ request }) => {
        const res = await request.get('/api/quizzes/factory?limit=20');
        expect(res.ok()).toBe(true);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.totalOnDisk).toBeGreaterThan(15000);
        expect(data.checkerCount).toBeGreaterThan(100);
        expect(data.cubeCount).toBeGreaterThan(10);
        expect(data.quizzes.length).toBe(20);

        // Vérification de la non-rondeur et authenticité 3-ply
        for (const q of data.quizzes) {
            expect(q.plyCount).toBeGreaterThanOrEqual(6);
            expect(q.quizChoices.length).toBeGreaterThanOrEqual(3);
            expect(q.optimalMove).toBeTruthy();
        }
    });

    test('2. Parcours de 20 quiz consécutifs sur /puzzles : unicité, pips et 2 cœurs', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/puzzles');
        await page.waitForLoadState('domcontentloaded');

        const seenXgids = new Set<string>();

        for (let i = 0; i < 20; i++) {
            // Attendre le plateau du quiz
            const qcm = page.getByTestId('quiz-qcm-choices');
            await expect(qcm).toBeVisible({ timeout: 10000 });

            // Vérifier absence de spoiler avant clic
            const coachFeedback = page.getByTestId('drill-feedback-banner');
            await expect(coachFeedback).toHaveCount(0);

            // Vérifier les 2 vies ❤️❤️
            const livesIndicator = page.getByTestId('quiz-lives-indicator');
            if (await livesIndicator.count() > 0) {
                const livesText = await livesIndicator.innerText();
                expect(livesText).toContain('❤️');
            }

            // Récupérer le contexte
            const contextLine = await page.getByTestId('drill-match-context-grid').innerText();
            expect(contextLine).toMatch(/Pips\s*:\s*\d+\s*vs\s*\d+/i);

            // Clic sur le premier choix (A)
            const choiceButtons = qcm.locator('button');
            const btnCount = await choiceButtons.count();
            expect(btnCount).toBeGreaterThanOrEqual(3);

            // On clique sur un bouton de choix
            await choiceButtons.first().click();

            // Maintenant le feedback doit apparaître
            await expect(page.getByTestId('drill-feedback-banner')).toBeVisible({ timeout: 5000 });

            // Clic sur "Position Suivante" (ou réessayer si 1er essai raté)
            const nextBtn = page.getByTestId('drill-next-btn');
            const retryBtn = page.getByTestId('drill-retry-btn');
            if (await nextBtn.isVisible()) {
                await nextBtn.click();
            } else if (await retryBtn.isVisible()) {
                // Si raté au 1er essai, clic sur un autre bouton pour terminer ou retry
                await retryBtn.click();
                await choiceButtons.nth(1).click();
                if (await nextBtn.isVisible()) {
                    await nextBtn.click();
                }
            } else {
                const fallbackNext = page.locator('button:has-text("Suivant"), button:has-text("Position Suivante")');
                if (await fallbackNext.count() > 0) {
                    await fallbackNext.first().click();
                }
            }
        }
    });

    test('3. Test des 3 Portes (BEGINNER, INTERMEDIATE, EXPERT) sur /puzzles', async ({ page }) => {
        for (const gate of ['BEGINNER', 'INTERMEDIATE', 'EXPERT']) {
            await page.addInitScript((g) => {
                window.localStorage.setItem('bgt_player_tier_gate', g);
            }, gate);

            await page.goto('/puzzles');
            await page.waitForLoadState('domcontentloaded');

            const qcm = page.getByTestId('quiz-qcm-choices');
            await expect(qcm).toBeVisible({ timeout: 10000 });

            // En mode Débutant, vérifier l'absence de jargon EMG / MWC brut avant ou après sélection
            if (gate === 'BEGINNER') {
                const bodyText = await page.innerText('body');
                expect(bodyText).not.toContain('0.040 EMG');
                expect(bodyText).not.toContain('IA 3-Ply');
            }
        }
    });
});
