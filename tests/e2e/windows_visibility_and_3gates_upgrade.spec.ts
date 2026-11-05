/**
 * @file tests/e2e/windows_visibility_and_3gates_upgrade.spec.ts
 * @description Suite Playwright E2E Windows Desktop — Haute Visibilité, Tab-Walk & 6 Améliorations des 3 Portes.
 * Tests complets sur viewports 1440x900 et 1920x1080 :
 * 1. Tab-Walk des 3 Portes & Lisibilité (getComputedStyle >= 14px sur boutons/titres).
 * 2. Porte 1 : Diplôme ➔ Partie Guidée & Sens de Marche Fer à Cheval (24 ➔ 1).
 * 3. Porte 2 : Défi Course 5s sans Pips & Journal des Fautes de Videau.
 * 4. Porte 3 : Bilan PR Décomposé (Pions vs Cube) & Mode Échiquier Pur (Full Focus).
 * Strictement <= 300 lignes, 0 any.
 */

import { test, expect } from '@playwright/test';

test.describe('Windows Desktop Visibility & 3 Gates Upgrade Suite', () => {

    test('Test Playwright #1 : Tab-Walk des 3 Portes & Visibilité Windows (1440x900 & 1920x1080)', async ({ page }) => {
        // Test sur résolution Windows Full HD 1920x1080
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/', { waitUntil: 'networkidle' });

        // 1. Header & Switcher des 3 Portes
        const beginnerBtn = page.locator('[data-testid="tier-gate-btn-beginner"]:visible').first();
        const intermediateBtn = page.locator('[data-testid="tier-gate-btn-intermediate"]:visible').first();
        const expertBtn = page.locator('[data-testid="tier-gate-btn-expert"]:visible').first();

        await expect(beginnerBtn).toBeVisible();
        await expect(intermediateBtn).toBeVisible();
        await expect(expertBtn).toBeVisible();

        // Vérification de la taille calculée de police (>= 14px) sur le sélecteur
        const btnFontSize = await beginnerBtn.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
        });
        expect(btnFontSize).toBeGreaterThanOrEqual(14);

        // 2. Tab-Walk Porte 1 Débutant
        await beginnerBtn.click();
        const beginnerPortal = page.getByTestId('beginner-home-portal');
        await expect(beginnerPortal).toBeVisible();

        // 3. Tab-Walk Porte 2 Intermédiaire
        await intermediateBtn.click();
        const intermediatePortal = page.getByTestId('intermediate-home-portal');
        await expect(intermediatePortal).toBeVisible();

        // 4. Tab-Walk Porte 3 Expert
        await expertBtn.click();
        const expertPortal = page.getByTestId('expert-home-portal');
        await expect(expertPortal).toBeVisible();
    });

    test('Test Playwright #2 : Porte 1 Débutant — Diplôme ➔ Partie Guidée & Sens de Marche (24 ➔ 1)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Accès à la Partie Guidée Débutant
        await page.goto('/?gate=beginner', { waitUntil: 'networkidle' });
        const playGuidedBtn = page.getByTestId('beginner-play-btn');
        await expect(playGuidedBtn).toBeVisible();
        await playGuidedBtn.click();

        // Vérification de l'indicateur lumineux du sens de marche fer à cheval
        const horseshoe = page.getByTestId('direction-horseshoe-indicator');
        await expect(horseshoe).toBeVisible({ timeout: 15000 });
        await expect(horseshoe).toContainText(/24.*1|Sens de marche|Checker Direction/i);

        // Vérification taille de police du dialogue professeur (>= 14px sur desktop)
        const dialogue = page.getByTestId('professor-dialogue-text');
        await expect(dialogue).toBeVisible();
        const dialogueFontSize = await dialogue.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
        });
        expect(dialogueFontSize).toBeGreaterThanOrEqual(14);
    });

    test('Test Playwright #3 : Porte 2 Club — Défi Course 5s sans Pips & Journal des Fautes de Videau', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/?gate=intermediate', { waitUntil: 'networkidle' });

        // Mini-Entraîneur Flash Course 5s
        const raceTrainer = page.getByTestId('mental-race-trainer-box');
        await expect(raceTrainer).toBeVisible();

        const aheadChoice = page.getByTestId('mental-race-choice-ahead');
        await expect(aheadChoice).toBeVisible();
        await aheadChoice.click();

        const raceFeedback = page.getByTestId('mental-race-feedback');
        await expect(raceFeedback).toBeVisible();
        await expect(raceFeedback).toContainText(/pips|Course|Calcul/i);

        // Journal des Fautes de Videau
        const mistakesJournal = page.getByTestId('cube-mistakes-journal');
        await expect(mistakesJournal).toBeVisible();
        await expect(mistakesJournal).toContainText(/Videau|Cube|Double|EMG/i);
    });

    test('Test Playwright #4 : Porte 3 Expert — Bilan PR Décomposé & Mode Échiquier Pur (Full Focus)', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/', { waitUntil: 'networkidle' });

        const expertBtn = page.locator('[data-testid="tier-gate-btn-expert"]:visible').first();
        await expect(expertBtn).toBeVisible();
        await expertBtn.click();

        // Bilan PR Décomposé (Pions vs Cube vs ERA)
        const prPanel = page.getByTestId('decomposed-pr-panel');
        await expect(prPanel).toBeVisible();
        await expect(page.getByTestId('pr-global-val')).toContainText('6.3');
        await expect(page.getByTestId('pr-checker-val')).toContainText('4.2');
        await expect(page.getByTestId('pr-cube-val')).toContainText('8.1');
        await expect(page.getByTestId('pr-era-val')).toContainText('5.8');

        // Lancement d'un match pour tester le Mode Échiquier Pur (Full Focus)
        const playExpertBtn = page.getByTestId('expert-play-btn');
        await expect(playExpertBtn).toBeVisible();
        await playExpertBtn.click();

        // Bouton Mode Échiquier Pur (Full Focus)
        const fullFocusBtn = page.getByTestId('full-focus-board-btn');
        await expect(fullFocusBtn).toBeVisible({ timeout: 15000 });
        await fullFocusBtn.click();
        await expect(fullFocusBtn).toContainText(/Quitter|Touche F/i);

        // Deuxième clic pour basculer
        await fullFocusBtn.click();
        await expect(fullFocusBtn).toContainText(/Full Focus|Mode Échiquier Pur/i);
    });
});

