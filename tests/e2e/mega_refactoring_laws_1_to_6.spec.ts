import { test, expect } from '@playwright/test';

test.describe('Mega-Refactoring Laws 1 to 6 Verification (Desktop 1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('Law 1 (Guest Lock 100%), Law 2 (Member Blunders Context), Law 4 (Global Sidebar Everywhere) & Law 5 (FR | EN Persistence)', async ({ page }) => {
        test.setTimeout(90000);
        // 1. LAW 1 — Guest Player Strict Lock across /, /puzzles, /drills, /progression
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem('bgtour_user_explicit_locale', 'fr');
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'INTERMEDIATE');
        });
        await page.reload({ waitUntil: 'domcontentloaded' });

        // Verify zero PR / Elo leakage in localStorage for Guest
        const guestStorageKeys = await page.evaluate(() => Object.keys(window.localStorage));
        expect(guestStorageKeys).not.toContain('backgammon_drill_er_pr_v1');
        expect(guestStorageKeys).not.toContain('bg_pro_elo_profile_v1');

        // Guest on /puzzles (default mode) -> Blocked by PersonalBlundersGuestLockView
        await page.goto('/puzzles', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible();
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible();
        await expect(page.getByTestId('quiz-qcm-choices')).toHaveCount(0);

        // Guest on /drills -> Blocked by PersonalBlundersGuestLockView
        await page.goto('/drills', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible();

        // Guest on /progression -> Blocked by PersonalBlundersGuestLockView + Global Sidebar present
        await page.goto('/progression', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible();
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible();

        // 2. LAW 4 — Global Layout (AppNavbar + LobbyLeftSidebar) on all secondary routes
        for (const route of ['/tournaments', '/analysis', '/academy', '/daily-puzzle']) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await expect(page.getByTestId('lobby-left-sidebar'), `Sidebar missing on ${route}`).toBeVisible();
        }

        // 3. LAW 5 — Bilingual FR | EN Toggle Persistence across Navigation
        await page.goto('/tournaments', { waitUntil: 'networkidle' });
        const localeToggleBtn = page.getByTestId('navbar-locale-toggle-btn');
        await expect(localeToggleBtn).toBeVisible();
        await localeToggleBtn.click();

        await expect(page.locator('body')).toContainText('WORLD MAP OF CLUBS & TOURNAMENTS');
        const explicitLocale = await page.evaluate(() => window.localStorage.getItem('bgtour_user_explicit_locale'));
        expect(explicitLocale).toBe('en');

        // Navigate to /analysis and verify EN persists without resetting to FR
        await page.goto('/analysis', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toContainText('STEP 1');
        await expect(page.locator('body')).toContainText('STEP 2');

        // Switch back to FR
        await page.getByTestId('navbar-locale-toggle-btn').click();
        await expect(page.locator('body')).toContainText('ÉTAPE 1');

        // 4. LAW 2 — Connected Member Personal Blunders Context & Store Unification
        await page.goto('/puzzles?filter=personal-blunders', { waitUntil: 'domcontentloaded' });
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

        const seedBtn = page.getByTestId('seed-demo-personal-blunders-btn');
        await expect(seedBtn).toBeVisible();
        await seedBtn.click();

        await expect(page.getByTestId('personal-blunder-match-banner')).toBeVisible();
        await expect(page.getByTestId('blunder-match-opponent')).toContainText('Contre Kosta_Ath');
        await expect(page.getByTestId('blunder-match-score-turn')).toContainText('Tour #12');
    });
});

