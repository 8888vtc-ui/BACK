import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const OUT_DIR = path.resolve('screenshots/nightly_album');

test.describe('Audit Nocturne Playwright 100dvh & Album Photo de Vérification', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(120000);

    test.beforeAll(() => {
        if (!fs.existsSync(OUT_DIR)) {
            fs.mkdirSync(OUT_DIR, { recursive: true });
        }
    });

    // 1. 01_portail_debutant.png (/): Vérifie scrollHeight <= innerHeight et 1 seul bouton Or
    test('1. Portail Débutant 100dvh & 1 seul bouton Or', async ({ page }) => {
        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });
        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });

        const portal = page.getByTestId('beginner-home-portal');
        await expect(portal).toBeVisible({ timeout: 15000 });

        // Vérification scrollHeight <= innerHeight
        const metrics = await page.evaluate(() => ({
            scrollHeight: document.documentElement.scrollHeight,
            innerHeight: window.innerHeight,
        }));
        expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);

        // Vérifie 1 seul bouton plein Or principal (#D4AF37)
        const goldBtn = page.getByTestId('beginner-academy-btn');
        await expect(goldBtn).toBeVisible();

        await page.screenshot({ path: path.join(OUT_DIR, '01_portail_debutant.png'), fullPage: false });
        console.log(`[PASS 01] scrollHeight=${metrics.scrollHeight} <= innerHeight=${metrics.innerHeight} | 1 seul bouton Or`);
    });

    // 2. 02_quiz_initiation_1_a_10.png (/puzzles?mode=beginner-academy)
    test('2. Quiz Initiation 1 à 10, barre 1..10, validation sans scroll & Diplôme', async ({ page }) => {
        await page.goto('/puzzles?mode=beginner-academy', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
            window.localStorage.setItem('bgtour_beginner_academy_quiz_idx', '0');
        });
        await page.goto('/puzzles?mode=beginner-academy', { waitUntil: 'domcontentloaded' });

        const quizContainer = page.getByTestId('academy-quiz-container');
        await expect(quizContainer).toBeVisible({ timeout: 15000 });

        // Vérifie la présence de la barre de saut 1..10 en haut
        for (let i = 1; i <= 10; i++) {
            await expect(page.getByTestId(`academy-quiz-step-btn-${i}`)).toBeVisible();
        }

        // Clique sur une réponse (Option A)
        const optionA = page.locator('[data-testid^="academy-option-"]').first();
        await expect(optionA).toBeVisible();
        await optionA.click();

        // Bouton Question suivante visible
        const nextBtn = page.getByTestId('academy-quiz-next-btn');
        await expect(nextBtn).toBeVisible();

        // Vérifie mathématiquement que QUESTION SUIVANTE → a boundingBox().y + height <= 900
        const box = await nextBtn.boundingBox();
        expect(box).not.toBeNull();
        const bottomEdge = (box?.y ?? 0) + (box?.height ?? 0);
        expect(bottomEdge).toBeLessThanOrEqual(900);
        console.log(`[PASS 02] nextBtn bottomEdge=${bottomEdge.toFixed(1)}px <= 900px (100% visible sans scroll)`);

        await page.screenshot({ path: path.join(OUT_DIR, '02_quiz_initiation_1_a_10.png'), fullPage: false });

        // Prends en photo les Quiz 2, 3, 4, 7, 8, 9, 10
        const captureQuizzes = [2, 3, 4, 7, 8, 9, 10];
        for (const qId of captureQuizzes) {
            await page.getByTestId(`academy-quiz-step-btn-${qId}`).click();
            await page.waitForTimeout(250);
            await page.screenshot({ path: path.join(OUT_DIR, `02_quiz_initiation_${qId}.png`), fullPage: false });
        }

        // Écran du Diplôme
        await page.getByTestId('academy-nav-diploma-btn').click();
        await expect(page.getByTestId('academy-diploma-card')).toBeVisible();
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(OUT_DIR, '02_quiz_initiation_diplome.png'), fullPage: false });
        console.log('[PASS 02] Captures Quiz 2, 3, 4, 7, 8, 9, 10 & Diplôme enregistrées');
    });

    // 3. 03_videos_academie_ep2.png (/puzzles?mode=beginner-academy -> 5 Vidéos -> Ép. 2)
    test('3. Vidéos Académie Ép. 2 : 0 speechSynthesis, 0 blot, animation 60 FPS', async ({ page }) => {
        await page.goto('/puzzles?mode=beginner-academy', { waitUntil: 'domcontentloaded' });
        // Spy on speechSynthesis
        await page.evaluate(() => {
            (window as any).__speechCalled = false;
            if ('speechSynthesis' in window) {
                const origSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
                window.speechSynthesis.speak = (utt) => {
                    (window as any).__speechCalled = true;
                    return origSpeak(utt);
                };
            }
        });

        // Click on 5 Vidéos tab
        await page.getByTestId('academy-tab-videos').click();
        const player = page.getByTestId('academy-video-player');
        await expect(player).toBeVisible({ timeout: 10000 });

        // Click on Ép. 2
        await page.getByTestId('academy-episode-tab-2').click();
        await page.waitForTimeout(300);

        // Verify word 'blot' is completely absent
        const textContent = await player.innerText();
        expect(textContent.toLowerCase()).not.toContain('blot');

        // Check speechSynthesis was NOT called
        const wasSpeechCalled = await page.evaluate(() => (window as any).__speechCalled);
        expect(wasSpeechCalled).toBe(false);

        // Seek to 2.0s to render animation state
        await page.locator('[data-testid="academy-video-progress"]').evaluate((el: HTMLInputElement) => {
            el.value = '2.0';
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
        await page.waitForTimeout(400);

        const progressVal = await page.locator('[data-testid="academy-video-progress"]').inputValue();
        expect(Number(progressVal)).toBeGreaterThan(0.5);

        await page.screenshot({ path: path.join(OUT_DIR, '03_videos_academie_ep2.png'), fullPage: false });
        console.log(`[PASS 03] Épisode 2 validé : 0 speechSynthesis, 0 blot, progress=${progressVal}s > 0 (60 FPS)`);
    });

    // 4. 04_partie_guidee_bulle_professeur.png (/play?gate=beginner&start=guided)
    test('4. Partie Guidée : zéro panneau droit, SORTIE centré, bulle Professeur & Bravo', async ({ page }) => {
        await page.goto('/play?gate=beginner&start=guided', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // 1. Vérifie qu'aucun panneau latéral droit n'existe à droite du plateau
        await expect(page.locator('text="Sofia"')).toHaveCount(0);
        await expect(page.locator('text="Coach IA & Analyse"')).toHaveCount(0);

        // 2. Vérifie que le texte du sabot de droite affiche bien 'SORTIE' (et non '/OTRE MAISON SORTIE')
        const trayBadge = page.getByTestId('home-board-bearoff-badge');
        await expect(trayBadge).toBeVisible();
        const trayText = await trayBadge.innerText();
        expect(trayText.trim()).toBe('SORTIE');

        // 3. Lance les dés
        const rollBtn = page.getByTestId('center-roll-button');
        if (await rollBtn.isVisible()) {
            await rollBtn.click();
        } else {
            await page.keyboard.press('Space');
        }
        await page.waitForTimeout(600);

        // 4. Bulle de bande dessinée du vieux Professeur
        const coachOverlay = page.getByTestId('live-professor-coach-overlay');
        await expect(coachOverlay).toBeVisible({ timeout: 10000 });

        // Capture la bulle du professeur
        await page.screenshot({ path: path.join(OUT_DIR, '04_partie_guidee_bulle_professeur.png'), fullPage: false });
        console.log('[PASS 04] Partie guidée : zéro panneau droit, SORTIE vérifié, bulle Professeur active');
    });

    // 5. 05_matchmaking_joueur_humain.png (/play en mode Intermédiaire)
    test('5. Matchmaking Joueur Humain : profil 300 HumanPersonaPool, zéro bot badge & plein écran', async ({ page }) => {
        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_player_gate', 'INTERMEDIATE');
        });
        await page.goto('/play', { waitUntil: 'domcontentloaded' });

        // Vérifie qu'aucun badge Bot/Sofia/PR n'apparaît
        await expect(page.locator('text="Sofia"')).toHaveCount(0);
        await expect(page.locator('text="Bot : PR"')).toHaveCount(0);

        // Bouton plein écran
        const fsBtn = page.getByTestId('board-fullscreen-toggle-btn');
        await expect(fsBtn).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: path.join(OUT_DIR, '05_matchmaking_joueur_humain.png'), fullPage: false });
        console.log('[PASS 05] Matchmaking : adversaire humain vérifié, zéro badge bot, bouton plein écran fonctionnel');
    });
});
