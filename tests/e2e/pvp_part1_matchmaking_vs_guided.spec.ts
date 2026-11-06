import { test, expect } from '@playwright/test';

test.describe('PVP Part 1 — Strict Separation Online Matchmaking vs Guided Professor Mode (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('In Beginner Mode + Guest Player, clicking Find a Player launches real online opponent with 0 Professor mention and 0 Ranked/Elo/PR leak', async ({ page }) => {
        test.setTimeout(90000);

        await page.goto('/', { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem('bgtour_user_explicit_locale', 'fr');
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'BEGINNER');
        });
        await page.reload({ waitUntil: 'networkidle' });

        // Ensure Beginner tab is active
        const begTab = page.getByTestId('tier-gate-btn-beginner').first();
        await begTab.click();

        // Click "Trouver un joueur" in Left Sidebar
        const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
        await expect(findPlayerBtn).toBeVisible();
        await findPlayerBtn.click();

        // Modal opens -> Start matchmaking search
        const modal = page.getByTestId('multiplayer-lobby-modal');
        await expect(modal).toBeVisible();
        const startSearchBtn = page.getByTestId('start-matchmaking-button');
        await expect(startSearchBtn).toBeVisible();
        await startSearchBtn.click();

        // Wait for game board view to mount after opponent is found
        const gameView = page.getByTestId('app-game-view');
        await expect(gameView).toBeVisible({ timeout: 25000 });

        // 1. LiveProfessorCoachOverlay must be 100% hidden (return null)
        await expect(page.getByTestId('live-professor-coach-overlay')).toHaveCount(0);

        // 2. Left Player Rail must show the real online opponent, NEVER "Le Professeur" / "The Professor" / "MENTOR PÉDAGOGIQUE" / "TEACHING MENTOR"
        const leftRail = page.getByTestId('board-left-player-rail');
        await expect(leftRail).toBeVisible();
        const leftRailText = await leftRail.innerText();
        expect(leftRailText).not.toMatch(/Professeur|Professor|MENTOR/i);
        expect(leftRailText).not.toMatch(/PARTIE GUIDÉE|GUIDED PLAY/i);
        expect(leftRailText).toMatch(/Adversaire en ligne/i);

        // 3. Guest status must show "En ligne · Match Amical" and NEVER "Match classé" or "Elo" or "PR Match"
        expect(leftRailText).toContain('En ligne · Match Amical');
        expect(leftRailText).not.toMatch(/Match classé|Ranked Match/i);
        expect(leftRailText).not.toMatch(/\bElo\b/i);
        expect(leftRailText).not.toMatch(/PR Match/i);

        // 4. Top bar badge must show "Mode Débutant" without "Partie Guidée"
        const topBadge = page.getByTestId('app-version-badge');
        await expect(topBadge).toBeVisible();
        await expect(topBadge).toHaveText('Mode Débutant');
    });
});

