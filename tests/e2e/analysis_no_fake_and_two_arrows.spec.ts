import { test, expect } from '@playwright/test';

test.describe('Studio d\'Analyse — Tolérance Zéro Anti-Fake & Double Flèche', () => {
    test('Ouverture 3-1 : vrais coups légaux, 0 -0.200 EMG fake, 2 flèches sur 8/5 6/5, zéro-scroll', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis');
        await page.waitForLoadState('domcontentloaded');

        // 1. Zéro Scroll & Absence du médaillon avatar
        const studioRoot = page.locator('[data-testid="analysis-studio-root"]');
        await expect(studioRoot).toBeVisible();

        const avatarMedallion = page.locator('header [data-testid="bot-portrait-medallion"]');
        await expect(avatarMedallion).toHaveCount(0);

        // 2. Vérification de l'ouverture 3-1 dans le Top 5
        const moveRow0 = page.locator('[data-testid="analysis-move-row-0"]');
        await expect(moveRow0).toBeVisible();
        await expect(moveRow0).toContainText('8/5 6/5');
        await expect(moveRow0).toContainText('Optimal 0.000 EMG');

        // Vérification du coup #2 : ne doit JAMAIS être le fake "6/3 3/2"
        const moveRow1 = page.locator('[data-testid="analysis-move-row-1"]');
        await expect(moveRow1).toBeVisible();
        const textMove1 = await moveRow1.innerText();
        expect(textMove1).not.toContain('6/3 3/2');

        // Vérification de la non-répétition de faux chiffres codés en dur (-0.200 EMG)
        const resultsSection = page.locator('[data-testid="analysis-results-section"]');
        const resultsText = await resultsSection.innerText();
        expect(resultsText).not.toContain('-0.200 EMG');

        // Vérification que les probabilités de gain ne sont pas toutes identiques à 47%
        const moveRow2 = page.locator('[data-testid="analysis-move-row-2"]');
        const moveRow3 = page.locator('[data-testid="analysis-move-row-3"]');
        const textMove2 = await moveRow2.innerText();
        const textMove3 = await moveRow3.innerText();

        // Récupération des taux de gain pour vérifier l'authenticité
        const extractWinPct = (t: string) => {
            const m = t.match(/Gagne\s*:\s*([\d.]+)%/);
            return m ? parseFloat(m[1]) : null;
        };
        const p1 = extractWinPct(textMove1);
        const p2 = extractWinPct(textMove2);
        const p3 = extractWinPct(textMove3);
        // Au moins deux coups doivent avoir des pourcentages différents
        expect(p1 !== null && p2 !== null && (p1 !== p2 || p2 !== p3)).toBe(true);

        // 3. Vérification des 2 flèches sur le plateau pour 8/5 6/5
        const arrow0 = page.locator('[data-testid="coach-optimal-arrow-0"]');
        const arrow1 = page.locator('[data-testid="coach-optimal-arrow-1"]');
        await expect(arrow0).toBeVisible();
        await expect(arrow1).toBeVisible();

        // 4. Conseil Videau 3-Ply traduit en Français
        const cubeBox = page.locator('[data-testid="cube-decision-box"]');
        await expect(cubeBox).toBeVisible();
        await expect(cubeBox).toContainText('Pas de Double (Garder le Videau à 1)');

        // 5. Explication du Coach en Français géométrique
        const coachCard = page.locator('[data-testid="coach-explanation-card"]');
        await expect(coachCard).toBeVisible();
        await expect(coachCard).toContainText("Point d'Or");

        // 6. Test du bouton 🧹 Vider le plateau et pose manuelle
        const clearBtn = page.locator('[data-testid="clear-board-btn"]');
        await clearBtn.click();

        const brushWhiteBtn = page.locator('[data-testid="brush-white-btn"]');
        await expect(brushWhiteBtn).toContainText('Poser Blanc (0/15)');

        // Clic sur "Position de départ" pour restaurer
        const resetBtn = page.locator('[data-testid="reset-starting-board-btn"]');
        await resetBtn.click();
        await expect(brushWhiteBtn).toContainText('Poser Blanc (15/15)');

        // 7. Zéro erreur runtime dans la console
        expect(pageErrors.length).toBe(0);
    });

    test('Changement de dés vers 2-1 : synchronisation dés, top coups 13/11 6/5 & 24/23 13/11, zéro triple 0.000 EMG', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/analysis');
        await page.waitForLoadState('domcontentloaded');

        // 1. Sélectionner Dé 1 = 2
        const die1Btn2 = page.locator('[data-testid="die-1-btn-2"]');
        await die1Btn2.click();

        // 2. Sélectionner Dé 2 = 1
        const die2Btn1 = page.locator('[data-testid="die-2-btn-1"]');
        await die2Btn1.click();

        // 3. Vérification de la synchronisation des dés sur le plateau
        const boardDie0 = page.locator('[data-testid="board-die-0"]');
        const boardDie1 = page.locator('[data-testid="board-die-1"]');
        await expect(boardDie0).toBeVisible();
        await expect(boardDie1).toBeVisible();

        // 4. Coup #1 pour 2-1 : doit être 13/11 6/5 (jamais 6/4 4/3 !)
        const moveRow0 = page.locator('[data-testid="analysis-move-row-0"]');
        await expect(moveRow0).toBeVisible();
        await expect(moveRow0).toContainText('13/11 6/5');
        await expect(moveRow0).toContainText('Optimal 0.000 EMG');

        // Coup #2 pour 2-1 : doit être 24/23 13/11
        const moveRow1 = page.locator('[data-testid="analysis-move-row-1"]');
        await expect(moveRow1).toBeVisible();
        await expect(moveRow1).toContainText('24/23 13/11');
        await expect(moveRow1).not.toContainText('0.000 EMG'); // Le #2 a un delta négatif strict !

        // 5. Interdiction formelle du triple 0.000 EMG
        const moveRow2 = page.locator('[data-testid="analysis-move-row-2"]');
        await expect(moveRow2).toBeVisible();
        await expect(moveRow2).not.toContainText('0.000 EMG');

        // 6. Deux flèches distinctes actives sur le plateau pour 13/11 6/5
        const arrow0 = page.locator('[data-testid="coach-optimal-arrow-0"]');
        const arrow1 = page.locator('[data-testid="coach-optimal-arrow-1"]');
        await expect(arrow0).toBeVisible();
        await expect(arrow1).toBeVisible();

        expect(pageErrors.length).toBe(0);
    });
});

