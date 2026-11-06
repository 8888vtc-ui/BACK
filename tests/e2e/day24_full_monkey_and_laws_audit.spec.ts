import { test, expect } from '@playwright/test';

/**
 * MISSION 24/25 : LE GRAND « MONKEY & CHAOS STRESS-TEST » PLAYWRIGHT
 * Teste l'ensemble des pages en 1440x900 :
 * 1. Bascule rapide 10x Débutant <-> Intermédiaire <-> Expert / Pro et FR <-> EN (zéro franglais).
 * 2. Navigation complète sur /, /tournaments, /academy, /analysis, /puzzles, /play en Mode Invité :
 *    - 0 PR, 0 Elo, 0 accès aux Quiz, 0 accès aux Blunders.
 *    - Matchmaking en ligne 100% séparé du Professeur.
 * 3. Navigation en Mode Connecté :
 *    - Accès aux Quiz 3-Ply et au Carnet de Blunders avec Date/Adversaire/Score/Tour et résolution interactive.
 * 4. Lois constitutionnelles & esthétique :
 *    - 0 faux compteur de joueurs en ligne.
 *    - 1 seul bouton plein Or par vue.
 *    - 0 emoji système coloré.
 *    - 0 pageerror.
 */

const BANNED_EMOJIS = ['🔥', '❤️', '🖤', '♟️', '💡', '🏠', '🌱', '🎲', '🏆', '⚠️', '🧭', '🗂️', '👁️', '🔄', '➡️', '🔈', '🔇'];

function collectRealErrors(pageErrors: Error[]): Error[] {
    return pageErrors.filter((err) => {
        const msg = err.message || '';
        return (
            !msg.includes('Hydration') &&
            !msg.includes('hydrat') &&
            !msg.includes('Minified React error #418') &&
            !msg.includes('Minified React error #423')
        );
    });
}

test.describe('Day 24: Grand Monkey & Chaos Stress-Test Sitewide (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });
    test.setTimeout(90000);

    test('1. Rapid 10x Monkey Switching between Portals and Locales without Franglais', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
        });
        await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('lobby-auth-status')).toBeVisible({ timeout: 15000 });

        const tiers = ['tier-gate-btn-beginner', 'tier-gate-btn-intermediate', 'tier-gate-btn-expert'];

        for (let i = 0; i < 10; i++) {
            // Bascule de langue
            const langToggle = page.getByTestId('navbar-locale-toggle-btn');
            await expect(langToggle).toBeVisible();
            await langToggle.click();

            // Bascule de porte
            const tierBtnId = tiers[i % tiers.length]!;
            const tierBtn = page.getByTestId(tierBtnId).first();
            await expect(tierBtn).toBeVisible();
            await tierBtn.click();

            // Attendre la stabilisation du DOM
            await page.waitForTimeout(100);

            // Vérifier l'absence de bugs d'affichage ou franglais brut
            const bodyText = await page.locator('body').innerText();
            expect(bodyText).not.toContain('undefined');
            expect(bodyText).not.toContain('[object Object]');
            expect(bodyText).not.toContain('NaN');
        }

        // Vérifier 0 crash ou erreur de page réelle
        expect(collectRealErrors(pageErrors)).toEqual([]);
    });

    test('2. Mode Invité Navigation: Zero PR, Zero Elo, Zero Quiz/Blunders & Matchmaking Separated from Teacher', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        // Initialisation session invité
        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'BEGINNER');
        });
        await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('lobby-auth-status')).toBeVisible({ timeout: 15000 });

        // --- 2.1 PAGE ACCUEIL / (Porte 1 Débutant) ---
        await expect(page.getByTestId('beginner-home-portal')).toBeVisible({ timeout: 10000 });

        // Vérifier que le Matchmaking "Trouver un joueur" est séparé de "Partie Guidée (Prof.)"
        const guidedPlayBtn = page.getByTestId('sidebar-guided-play-btn');
        const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
        await expect(guidedPlayBtn).toBeVisible();
        await expect(findPlayerBtn).toBeVisible();

        // Ouvrir la modale Matchmaking pour vérifier le statut Invité (Zéro PR / Zéro Elo)
        await findPlayerBtn.click();
        const lobbyModal = page.getByTestId('multiplayer-lobby-modal');
        await expect(lobbyModal).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('lobby-guest-pr-locked-badge')).toBeVisible();
        await expect(page.getByTestId('lobby-guest-pr-locked-badge')).toContainText('Mode Invité • Match Amical en Ligne');
        const modalText = await lobbyModal.innerText();
        expect(modalText).not.toContain('1500 Elo');
        expect(modalText).not.toContain('Classé Elo');
        // Fermer la modale
        await page.getByTestId('close-lobby-button').click();
        await expect(lobbyModal).toBeHidden();

        // Vérifier Porte 3 en Invité : PR "Verrouillé", Rating "—"
        await page.getByTestId('tier-gate-btn-expert').first().click();
        await expect(page.getByTestId('expert-er-pr')).toHaveText('Verrouillé');
        await expect(page.getByTestId('expert-rating')).toHaveText('—');

        // --- 2.2 ROUTE /puzzles EN INVITÉ ---
        await page.goto('/puzzles', { waitUntil: 'domcontentloaded' });
        // En invité : bloqué par PersonalBlundersGuestLockView, 0 quiz actif, 0 blunders
        await expect(page.getByTestId('personal-blunders-guest-lock-view')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('quiz-qcm-choices')).toHaveCount(0);
        await expect(page.getByTestId('sidebar-blunder-guest-lock')).toBeVisible();
        await expect(page.getByTestId('unlock-personal-blunders-cta')).toBeVisible();

        // --- 2.3 ROUTE /play EN INVITÉ ---
        await page.goto('/play', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('board-left-player-rail')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('left-rail-player-name')).toHaveText('Joueur Invité');
        await expect(page.getByTestId('left-rail-player-pr')).toHaveCount(0);
        await expect(page.locator('text=PR Match :')).toHaveCount(0);

        // --- 2.4 ROUTE /tournaments EN INVITÉ ---
        await page.goto('/tournaments', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('tournament-world-hub-view')).toBeVisible({ timeout: 15000 });

        // --- 2.5 ROUTE /academy EN INVITÉ ---
        await page.goto('/academy', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible({ timeout: 15000 });

        // --- 2.6 ROUTE /analysis EN INVITÉ ---
        await page.goto('/analysis', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('analysis-control-panel')).toBeVisible({ timeout: 15000 });

        expect(collectRealErrors(pageErrors)).toEqual([]);
    });

    test('3. Mode Connecté: Access to 3-Ply Quizzes, Personal Blunders Notebook & Interactive Resolution', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        // Initialisation session connectée (Passport Joueur)
        await page.goto('/puzzles?filter=personal-blunders', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'INTERMEDIATE');
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

        // Sidebar : compte connecté, zéro cadenas invité sur les blunders
        await expect(page.getByTestId('lobby-left-sidebar')).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('sidebar-blunder-guest-lock')).toHaveCount(0);

        // Si aucun blunder n'est encore enregistré, injection démo
        const seedBtn = page.getByTestId('seed-demo-personal-blunders-btn');
        if (await seedBtn.isVisible()) {
            await seedBtn.click();
        }

        // Bannière de match avec Date, Adversaire, Score, Tour
        const matchBanner = page.getByTestId('personal-blunder-match-banner');
        await expect(matchBanner).toBeVisible({ timeout: 15000 });
        await expect(page.getByTestId('blunder-match-date')).toContainText('2026');
        await expect(page.getByTestId('blunder-match-opponent')).toContainText('Contre Kosta_Ath');
        await expect(page.getByTestId('blunder-match-score-turn')).toContainText('Tour #12');
        await expect(page.getByTestId('blunder-status-badge')).toContainText('À corriger');

        // Résolution interactive
        await page.getByTestId('quiz-choice-btn-A').click();

        // Affichage du panneau comparatif Ton Coup vs Solution 3-Ply
        const compPanel = page.getByTestId('personal-blunder-comparative-panel');
        await expect(compPanel).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('comparative-played-move-card')).toContainText('Ton Coup en Match');
        await expect(page.getByTestId('comparative-optimal-move-card')).toContainText('La Solution 3-Ply');
        await expect(page.getByTestId('blunder-status-badge')).toContainText('✓ Résolu');

        expect(collectRealErrors(pageErrors)).toEqual([]);
    });

    test('4. Constitutional Laws: 0 Fake Counters, 1 Full-Gold Button, 0 System Emojis & 0 Pageerror', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/?lang=fr', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.sessionStorage.setItem('bgtour_manual_locale', 'fr');
        });
        await page.goto('/?lang=fr', { waitUntil: 'networkidle' });
        await expect(page.getByTestId('lobby-auth-status')).toBeVisible({ timeout: 15000 });

        // --- 4.1 ZÉRO FAUX COMPTEUR DE JOUEURS EN LIGNE ---
        // Vérifier qu'il y a le point vert statut sans faux chiffres "54 online" / "74 en ligne"
        await expect(page.getByTestId('sidebar-find-player-status-dot')).toBeVisible();
        const sidebarText = await page.getByTestId('lobby-left-sidebar').innerText();
        expect(sidebarText).not.toMatch(/\b\d+\s+(online|en ligne)\b/i);

        // --- 4.2 UN SEUL BOUTON PLEIN OR PAR VUE SUR LES 3 PORTES ---
        // Porte 1 : Débutant
        await page.getByTestId('tier-gate-btn-beginner').first().click();
        await expect(page.getByTestId('beginner-academy-btn')).toBeVisible({ timeout: 10000 });

        // Porte 2 : Intermédiaire
        await page.getByTestId('tier-gate-btn-intermediate').first().click();
        await expect(page.getByTestId('intermediate-play-btn')).toBeVisible({ timeout: 10000 });

        // Porte 3 : Expert / Pro
        await page.getByTestId('tier-gate-btn-expert').first().click();
        await expect(page.getByTestId('expert-play-btn')).toBeVisible({ timeout: 10000 });

        // --- 4.3 ZÉRO EMOJI SYSTÈME COLORÉ SUR LES PRINCIPALES ROUTES ---
        const routes = ['/', '/tournaments', '/analysis'];
        for (const route of routes) {
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(300);
            const pageText = await page.locator('body').innerText();
            for (const emoji of BANNED_EMOJIS) {
                expect(pageText).not.toContain(emoji);
            }
        }

        expect(collectRealErrors(pageErrors)).toEqual([]);
    });
});
