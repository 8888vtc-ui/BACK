import { test, expect } from '@playwright/test';

test.describe('MISSION 5/10 — Pipeline des Blunders Personnels 3-Ply & Revanche', () => {
    test.beforeEach(async ({ page }) => {
        // Enregistre un blunder personnel dans localStorage avant de charger l'application
        await page.addInitScript(() => {
            const mockPersonalBlunder = {
                id: 'blunder_match_12345_revenge',
                createdAt: new Date().toISOString(),
                board: [
                    0, 2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5,
                    -5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2, 0, 0, 0,
                ],
                dice: [3, 1],
                player: 'X',
                playedMove: '13/10 13/12',
                optimalMove: '8/5 6/5',
                acceptableMoves: [],
                quizChoices: ['8/5 6/5', '13/10 13/12', '24/20', '13/9'],
                equityLoss: 0.145,
                verdict: 'blunder',
                conceptId: 'prime_building',
                conceptName: 'Construction de Prime (Mur)',
                whyFailed: 'Laisse 2 blots vulnérables au lieu de faire le point 5 en or.',
                explanation: 'Faire le point 5 (8/5 6/5) est le coup d\'or par excellence.',
                proverb: 'Le point 5 est la clé de voûte de votre jeu.',
                hint: 'Regarde le point 5 de ton jan intérieur.',
                tier: 2,
                quizTargetER: 7.0,
                quizType: 'CHECKER_PLAY',
                plyCount: 8,
                timesReviewed: 0,
                timesSolved: 0,
                isMastered: false,
                gameId: 'live_match_bot_spinoza',
                matchContext: {
                    matchLength: 5,
                    cubeValue: 1,
                    cubeOwner: null,
                    scoreX: 1,
                    scoreO: 2,
                    crawford: false,
                },
            };

            window.localStorage.setItem('bg_blunder_bank', JSON.stringify([mockPersonalBlunder]));
        });
    });

    test('filtre personal-blunders affiche le quiz de match personnel avec ❤️❤️ et applique la revanche au 1er essai', async ({ page }) => {
        // 1. Navigation directe vers /puzzles?filter=personal-blunders
        await page.goto('/puzzles?filter=personal-blunders');
        await page.waitForLoadState('domcontentloaded');

        // 2. Vérification du titre "Mes Erreurs"
        const drillTitle = page.locator('[data-testid="drill-mode-title"]');
        await expect(drillTitle).toBeVisible({ timeout: 10000 });
        await expect(drillTitle).toContainText('Mes Erreurs');

        // 3. Vérification du badge spécifique aux blunders de match personnel
        const nplus1Badge = page.locator('[data-testid="quiz-nplus1-target-badge"]');
        await expect(nplus1Badge).toBeVisible();
        await expect(nplus1Badge).toContainText('Issu de ton match');

        // 4. Vérification des 2 essais (❤️❤️)
        const attemptsCounter = page.locator('[data-testid="quiz-attempts-counter"]');
        await expect(attemptsCounter).toBeVisible();
        await expect(attemptsCounter).toContainText('2/2');
        await expect(attemptsCounter).toContainText('❤️❤️');

        // 5. Clic sur le coup optimal A (ou le bouton contenant la notation du coup)
        const choiceBtnA = page.locator('[data-testid="quiz-choice-btn-A"]');
        await expect(choiceBtnA).toBeVisible({ timeout: 5000 });
        await choiceBtnA.click();

        // 6. Vérification du feedback de succès et de la récompense Revanche -0.2
        const deltaIndicator = page.locator('[data-testid="quiz-live-rating-delta"]');
        await expect(deltaIndicator).toBeVisible({ timeout: 5000 });
        await expect(deltaIndicator).toContainText('▼');
    });
});
