import { test, expect } from '@playwright/test';

test.describe('Day 19: 3 Home Portals Polish, Single Gold CTA & Zero Scroll (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    test('1. Portail Débutant : 1 seul bouton or, 0 emoji et scrollHeight <= 900', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_gate', 'BEGINNER');
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const portal = page.getByTestId('beginner-home-portal');
        await expect(portal).toBeVisible({ timeout: 10000 });

        // Vérification 0 emoji
        const text = await portal.innerText();
        expect(text).not.toMatch(EMOJI_REGEX);

        // Vérification 1 seul bouton Or majeur
        const goldBtn = page.getByTestId('beginner-academy-btn');
        await expect(goldBtn).toBeVisible();
        await expect(goldBtn).toHaveClass(/bg-gradient-to-r.*#D4AF37/);

        // Bouton secondaire sobre (non plein or)
        const playBtn = page.getByTestId('beginner-play-btn');
        await expect(playBtn).toBeVisible();
        await expect(playBtn).toHaveClass(/bg-white/);

        // Vérification scrollHeight <= 900 sur 1440x900
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);
    });

    test('2. Portail Intermédiaire : Award, Matchmaking badge, bouton Clé #1 et scrollHeight <= 900', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_gate', 'INTERMEDIATE');
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const portal = page.getByTestId('intermediate-home-portal');
        await expect(portal).toBeVisible({ timeout: 10000 });

        // Vérification 0 emoji
        const text = await portal.innerText();
        expect(text).not.toMatch(EMOJI_REGEX);

        // Badge Matchmaking Direct présent et aligné
        const badge = page.getByTestId('intermediate-matchmaking-badge');
        await expect(badge).toBeVisible();
        await expect(badge).toContainText('Matchmaking Direct');

        // Bouton S'entraîner sur le Plateau présent dans Clé #1
        const practiceBtn = page.getByTestId('club-secrets-practice-btn');
        await expect(practiceBtn).toBeVisible();
        await expect(practiceBtn).toContainText("S'entraîner sur le Plateau");

        // 1 seul bouton plein or (Lancer le match)
        const playBtn = page.getByTestId('intermediate-play-btn');
        await expect(playBtn).toBeVisible();
        await expect(playBtn).toHaveClass(/bg-gradient-to-r/);

        // Onglets formats et clés en style sobre
        const fmt5 = page.getByTestId('match-format-5');
        await expect(fmt5).toHaveClass(/bg-white\/10.*border-\[#D4AF37\]\/50/);

        // Vérification scrollHeight <= 900 sur 1440x900
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);
    });

    test('3. Portail Expert : 0 emoji, PR masqués en Invité et scrollHeight <= 900', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_gate', 'EXPERT');
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const portal = page.getByTestId('expert-home-portal');
        await expect(portal).toBeVisible({ timeout: 10000 });

        // Vérification 0 emoji
        const text = await portal.innerText();
        expect(text).not.toMatch(EMOJI_REGEX);

        // En statut Invité, zéro faux PR affiché (pas de 6.3, 4.2 ou 8.1 inventé)
        const erPr = page.getByTestId('expert-er-pr');
        await expect(erPr).toBeVisible();
        await expect(erPr).toContainText(/Verrouillé|Locked/);

        const rating = page.getByTestId('expert-rating');
        await expect(rating).toBeVisible();
        await expect(rating).toHaveText('—');

        const prGlobal = page.getByTestId('pr-global-val');
        await expect(prGlobal).toHaveText('—');

        const prChecker = page.getByTestId('pr-checker-val');
        await expect(prChecker).toHaveText('—');

        const prCube = page.getByTestId('pr-cube-val');
        await expect(prCube).toHaveText('—');

        // 1 seul bouton plein or (Lancer le match)
        const playBtn = page.getByTestId('expert-play-btn');
        await expect(playBtn).toBeVisible();
        await expect(playBtn).toHaveClass(/bg-gradient-to-b.*#D4AF37/);

        // Vérification scrollHeight <= 900 sur 1440x900
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);
    });

    test('4. Portes en mode EN : Vérification bilingue et scrollHeight <= 900', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('bgtour_locale', 'en');
            window.localStorage.setItem('bgtour_player_gate', 'INTERMEDIATE');
        });

        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const portal = page.getByTestId('intermediate-home-portal');
        await expect(portal).toBeVisible({ timeout: 10000 });

        const badge = page.getByTestId('intermediate-matchmaking-badge');
        await expect(badge).toContainText('Live Matchmaking');

        const playBtn = page.getByTestId('intermediate-play-btn');
        await expect(playBtn).toContainText('FIND A PLAYER ONLINE');

        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);
    });
});
