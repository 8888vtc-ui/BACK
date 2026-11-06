import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * MISSION 25/25 : GÉNÉRATION DE L'ALBUM DE 12 CAPTURES HD POUR LA REVUE DU SOIR
 * Résolution Desktop standard 1440x900
 * Dossier de destination : screenshots/evening_review/
 */

const OUT_DIR = path.resolve('screenshots/evening_review');

test.describe('Day 25: 12 HD Screenshots Album for Evening Review (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(180000);

    test('Generate all 12 HD screenshots', async ({ page }) => {
        // --- 01. Accueil Débutant (FR) ---
        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('beginner-home-portal')).toBeVisible({ timeout: 15000 });
        await page.screenshot({ path: path.join(OUT_DIR, '01_home_beginner_fr.png'), fullPage: false });

        // --- 02. Accueil Intermédiaire (FR) ---
        await page.getByTestId('tier-gate-btn-intermediate').first().click();
        await expect(page.getByTestId('intermediate-home-portal')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '02_home_intermediate_fr.png'), fullPage: false });

        // --- 03. Accueil Expert / Pro (FR) ---
        await page.getByTestId('tier-gate-btn-expert').first().click();
        await expect(page.getByTestId('expert-home-portal')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '03_home_expert_fr.png'), fullPage: false });

        // --- 04. Accueil Intermédiaire (EN) - Sans franglais ---
        await page.getByTestId('navbar-locale-toggle-btn').click();
        await page.getByTestId('tier-gate-btn-intermediate').first().click();
        await expect(page.getByTestId('intermediate-home-portal')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '04_home_intermediate_en_no_franglais.png'), fullPage: false });

        // Switch back to FR
        await page.getByTestId('navbar-locale-toggle-btn').click();
        await page.waitForTimeout(200);

        // --- 08. Modale Matchmaking Invité (Zero PR / Zero Elo) ---
        const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
        await expect(findPlayerBtn).toBeVisible({ timeout: 10000 });
        await findPlayerBtn.click();
        const lobbyModal = page.getByTestId('multiplayer-lobby-modal');
        await expect(lobbyModal).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('lobby-guest-pr-locked-badge')).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT_DIR, '08_matchmaking_modal_guest_no_pr.png'), fullPage: false });
        await page.getByTestId('close-lobby-button').click();
        await expect(lobbyModal).toBeHidden();

        // --- 05. Écran Quiz Invité Verrouillé ---
        await page.goto('/puzzles', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '05_guest_quiz_locked_screen.png'), fullPage: false });

        // --- 06. Écran Carnet de Blunders Invité Verrouillé ---
        await page.goto('/puzzles?filter=personal-blunders', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('sidebar-blunder-guest-lock')).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '06_guest_blunders_locked_screen.png'), fullPage: false });

        // --- 07. Compte Connecté : Mémoire de match & Résolution comparative ---
        await page.evaluate(() => {
            window.localStorage.setItem(
                'bg_player_passport_v1',
                JSON.stringify({
                    pseudo: 'Alexandre D.',
                    email: 'alexandre@backgammontour.com',
                    experienceLevel: 'intermediate',
                    countryName: 'France',
                    countryCode: 'FR',
                    avatarUrl: '/avatars/user-avatar-1.jpg',
                    registeredAt: new Date().toISOString(),
                }),
            );
        });
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible({ timeout: 15000 });

        const seedBtn = page.getByTestId('seed-demo-personal-blunders-btn');
        const matchBanner = page.getByTestId('personal-blunder-match-banner');
        await expect(seedBtn.or(matchBanner)).toBeVisible({ timeout: 15000 });

        if (await seedBtn.isVisible()) {
            await seedBtn.click();
        }

        await expect(matchBanner).toBeVisible({ timeout: 15000 });
        const choiceBtnA = page.getByTestId('quiz-choice-btn-A');
        if (await choiceBtnA.isVisible()) {
            await choiceBtnA.click();
            await expect(page.getByTestId('personal-blunder-comparative-panel')).toBeVisible({ timeout: 10000 });
        }
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '07_connected_blunder_match_memory_and_solution.png'), fullPage: false });

        // Reset to guest session for remaining screenshots
        await page.evaluate(() => {
            window.localStorage.removeItem('bg_player_passport_v1');
        });

        // --- 09. Plateau Matchmaking en Ligne sans Professeur ---
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT_DIR, '09_play_online_matchmaking_no_professor.png'), fullPage: false });

        // --- 10. Plateau Mode Guidé avec le Professeur ---
        await page.goto('/?start=guided', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUT_DIR, '10_play_guided_professor_mode.png'), fullPage: false });

        // --- 11. Studio d'Analyse en 3 étapes ---
        await page.goto('/analysis', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('analysis-control-panel')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT_DIR, '11_analysis_studio_3steps.png'), fullPage: false });

        // --- 12. Hub des Tournois & Carte du Monde avec Sidebar ---
        await page.goto('/tournaments', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('tournament-world-hub-view')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT_DIR, '12_tournaments_world_map_with_sidebar.png'), fullPage: false });
    });
});
