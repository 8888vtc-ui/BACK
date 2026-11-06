import { test, expect } from '@playwright/test';

test.describe('Personal Blunders Notebook & Guest /play Integrity (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('Scenarios 1 to 5: Guest Lock Screen, Connected Match Memory Banner, Comparative Resolution, Zero Emoji & Guest /play Zero PR Match', async ({ page }) => {
        // SCENARIO 1: Guest Player on /puzzles?filter=personal-blunders
        await page.goto('/puzzles?filter=personal-blunders', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'INTERMEDIATE');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        // Global layout present (AppNavbar + Left Sidebar)
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible();
        await expect(page.getByTestId('sidebar-blunder-guest-lock')).toBeVisible();
        await expect(page.getByTestId('sidebar-blunder-count-badge')).toHaveCount(0);

        // Guest lock view shown, zero playable quiz, zero fake Rating 1500 or "Issu de ton match"
        const guestLockView = page.getByTestId('personal-blunders-guest-lock-view');
        await expect(guestLockView).toBeVisible();
        await expect(page.getByTestId('quiz-qcm-choices')).toHaveCount(0);
        const bodyTextGuest = await page.locator('body').innerText();
        expect(bodyTextGuest).not.toContain('Rating : 1500');
        expect(bodyTextGuest).not.toContain('Issu de ton match');

        // Single Full-Gold CTA present
        const unlockCta = page.getByTestId('unlock-personal-blunders-cta');
        await expect(unlockCta).toBeVisible();
        await expect(unlockCta).toContainText('SE CONNECTER / CRÉER MON COMPTE GRATUIT');

        // SCENARIO 2: Guest Player on /play — Zero "PR Match :" badge, no "v3.1 • 3-Ply • Open Sage", full "Joueur Invité"
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible();
        await expect(page.getByTestId('left-rail-player-pr')).toHaveCount(0);
        await expect(page.locator('text=PR Match :')).toHaveCount(0);
        await expect(page.locator('text=v3.1 • 3-Ply • Open Sage')).toHaveCount(0);
        await expect(page.getByTestId('left-rail-player-name')).toHaveText('Joueur Invité');

        // SCENARIO 3: Connected Account with Full Match Memory (Date, Opponent, Score, Turn)
        await page.goto('/puzzles?filter=personal-blunders', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
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

        // Empty state for connected account before seeding
        const seedBtn = page.getByTestId('seed-demo-personal-blunders-btn');
        await expect(seedBtn).toBeVisible();
        await seedBtn.click();

        // Match Memory Banner visible with Date, Opponent, Score, Turn
        const matchBanner = page.getByTestId('personal-blunder-match-banner');
        await expect(matchBanner).toBeVisible();
        await expect(page.getByTestId('blunder-match-date')).toContainText('2026');
        await expect(page.getByTestId('blunder-match-opponent')).toContainText('Contre Kosta_Ath (1584 Elo)');
        await expect(page.getByTestId('blunder-match-score-turn')).toContainText('Match en 5 pts (Score : 2 - 3)');
        await expect(page.getByTestId('blunder-match-score-turn')).toContainText('Tour #12');
        await expect(page.getByTestId('blunder-status-badge')).toContainText('À corriger');

        // Tabs show Pending (3) and Resolved (0), and Left Sidebar shows badge 3
        await expect(page.getByTestId('personal-blunders-tab-pending')).toContainText('À corriger (3)');
        await expect(page.getByTestId('personal-blunders-tab-resolved')).toContainText('Résolus (0)');
        await expect(page.getByTestId('sidebar-blunder-count-badge')).toHaveText('3');

        // Recall prompt shows opponent and turn
        await expect(page.getByTestId('personal-blunder-recall-prompt')).toContainText('Souvenir de ton match contre Kosta_Ath (Tour #12)');

        // SCENARIO 4: 2-Phase Interactive Resolution & Comparative Explanation
        await page.getByTestId('quiz-choice-btn-A').click();

        const compPanel = page.getByTestId('personal-blunder-comparative-panel');
        await expect(compPanel).toBeVisible();
        await expect(page.getByTestId('comparative-played-move-card')).toContainText('Ton Coup en Match : 24/15');
        await expect(page.getByTestId('comparative-played-move-card')).toContainText('Pourquoi c’était une erreur :');
        await expect(page.getByTestId('comparative-optimal-move-card')).toContainText('La Solution 3-Ply : 24/20 13/8');
        await expect(page.getByTestId('comparative-optimal-move-card')).toContainText('Pourquoi ce coup gagne :');

        // Status transitions to Resolved, Pending decrements to 2, Resolved increments to 1, Sidebar badge decrements to 2
        await expect(page.getByTestId('blunder-status-badge')).toContainText('✓ Résolu');
        await expect(page.getByTestId('personal-blunders-tab-pending')).toContainText('À corriger (2)');
        await expect(page.getByTestId('personal-blunders-tab-resolved')).toContainText('Résolus (1)');
        await expect(page.getByTestId('sidebar-blunder-count-badge')).toHaveText('2');

        // SCENARIO 5: Viewport height <= 900px & Zero System Emojis
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);

        const fullPageText = await page.locator('body').innerText();
        for (const bannedEmoji of ['🔥', '❤️', '🖤', '♟️', '💡', '🏠', '🌱', '🎲', '🏆', '⚠️', '🧭', '🗂️', '👁️', '🔄', '➡️', '🔈', '🔇']) {
            expect(fullPageText).not.toContain(bannedEmoji);
        }
    });
});
