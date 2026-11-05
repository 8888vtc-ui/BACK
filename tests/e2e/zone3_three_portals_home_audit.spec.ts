import { test, expect } from '@playwright/test';

test.describe('Zone 3 — Audit & Verrouillage des 3 Portails d\'Accueil (Home Portals)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('1. Isolation stricte des 3 Portes : zéro fuite du vieux lobby sous les portails', async ({ page }) => {
        const pageErrors: string[] = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        for (const gate of ['beginner', 'intermediate', 'expert']) {
            await page.goto(`/?gate=${gate}`);
            await page.waitForSelector(`[data-testid="${gate}-home-portal"]`, { timeout: 15000 });

            // Les anciennes cartes et listes du vieux lobby ne doivent JAMAIS apparaître
            await expect(page.locator('[data-testid="lobby-card-multiplayer"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="lobby-card-ai"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="lobby-card-training"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="open-matches-table"]')).not.toBeVisible();
        }

        expect(pageErrors).toEqual([]);
    });

    test('2. Porte 1 (Débutant) : Académie 3 min, Partie Guidée, Guide Audio & 15 Ouvertures', async ({ page }) => {
        await page.goto('/?gate=beginner&lang=fr');
        await page.waitForSelector('[data-testid="beginner-home-portal"]', { timeout: 15000 });

        // Vérification des éléments majeurs
        const academyBtn = page.locator('[data-testid="beginner-academy-btn"]');
        const playBtn = page.locator('[data-testid="beginner-play-btn"]');
        const guideBtn = page.locator('[data-testid="beginner-open-guide-btn"]');
        const openingsBtn = page.locator('[data-testid="beginner-openings-btn"]');

        await expect(academyBtn).toBeVisible();
        await expect(playBtn).toBeVisible();
        await expect(guideBtn).toBeVisible();
        await expect(openingsBtn).toBeVisible();

        // Clic Guide Audio (6 chapitres)
        await guideBtn.click();
        const guideModal = page.locator('[data-testid="beginner-interactive-guide-modal"]');
        await expect(guideModal).toBeVisible();
        // Fermeture
        const closeGuideBtn = page.locator('[data-testid="guide-close-btn"]');
        if (await closeGuideBtn.isVisible()) {
            await closeGuideBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }

        // Clic 15 Coups d'Ouverture
        await openingsBtn.click();
        const openingsModal = page.locator('[data-testid="beginner-opening-explorer-modal"]');
        await expect(openingsModal).toBeVisible();
        const closeOpeningsBtn = page.locator('[data-testid="opening-close-btn"]');
        if (await closeOpeningsBtn.isVisible()) {
            await closeOpeningsBtn.click();
        } else {
            await page.keyboard.press('Escape');
        }

        // Clic Lancer Partie Guidée -> transition vers le plateau
        await playBtn.click();
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 10000 });
    });

    test('3. Porte 2 (Intermédiaire / Club) : Formats 3/5/7/Money, Inviter un ami, 4 Clés & Entraînement 5s', async ({ page }) => {
        await page.goto('/?gate=intermediate&lang=fr');
        await page.waitForSelector('[data-testid="intermediate-home-portal"]', { timeout: 15000 });

        // Formats de match 1-clic
        const fmt3 = page.locator('[data-testid="match-format-3"]');
        const fmt5 = page.locator('[data-testid="match-format-5"]');
        const fmt7 = page.locator('[data-testid="match-format-7"]');
        const fmtMoney = page.locator('[data-testid="match-format-money"]');

        await expect(fmt3).toBeVisible();
        await expect(fmt5).toBeVisible();
        await expect(fmt7).toBeVisible();
        await expect(fmtMoney).toBeVisible();

        // Sélection d'un format
        await fmt7.click();

        // Boutons Jouer & Inviter
        const playBtn = page.locator('[data-testid="intermediate-play-btn"]');
        const inviteBtn = page.locator('[data-testid="intermediate-invite-btn"]');
        await expect(playBtn).toBeVisible();
        await expect(inviteBtn).toBeVisible();

        // 4 Clés de club & Outils
        await expect(page.locator('[data-testid="intermediate-club-secrets-card"]')).toBeVisible();
        await expect(page.locator('[data-testid="intermediate-quick-drills"]')).toBeVisible();
        await expect(page.locator('[data-testid="mental-race-trainer-box"]')).toBeVisible();
        await expect(page.locator('[data-testid="cube-mistakes-journal"]')).toBeVisible();

        // Clic Jouer maintenant -> lance le match
        await playBtn.click();
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 10000 });
    });

    test('4. Porte 3 (Expert / Pro) : Formats 3..21 pts + Money, PR Décomposé & Loi du Cap 6.0', async ({ page }) => {
        await page.goto('/?gate=expert&lang=fr');
        await page.waitForSelector('[data-testid="expert-home-portal"]', { timeout: 15000 });

        // Formats complets
        for (const len of [3, 5, 7, 9, 11, 21]) {
            await expect(page.locator(`[data-testid="expert-format-${len}"]`)).toBeVisible();
        }
        await expect(page.locator('[data-testid="expert-format-money"]')).toBeVisible();

        // Télémétrie & Bouton Masquer Pips
        await expect(page.locator('[data-testid="expert-hide-pips-btn"]')).toBeVisible();

        // Bilan PR Décomposé
        const decomposedPanel = page.locator('[data-testid="decomposed-pr-panel"]');
        await expect(decomposedPanel).toBeVisible();
        await expect(page.locator('[data-testid="pr-global-val"]')).toBeVisible();
        await expect(page.locator('[data-testid="pr-checker-val"]')).toBeVisible();
        await expect(page.locator('[data-testid="pr-cube-val"]')).toBeVisible();
        await expect(page.locator('[data-testid="pr-era-val"]')).toBeVisible();

        // Légende Cap 6.0
        await expect(page.locator('[data-testid="cap-6-er-era-card"]')).toBeVisible();

        // Clic Lancer Match Expert -> transition plateau
        const playBtn = page.locator('[data-testid="expert-play-btn"]');
        await expect(playBtn).toBeVisible();
        await playBtn.click();
        await expect(page.locator('[data-testid="app-game-view"]')).toBeVisible({ timeout: 10000 });
    });

    test('5. Support bilingue FR <-> EN sur les 3 Portails', async ({ page }) => {
        // Débutant EN
        await page.goto('/?gate=beginner&lang=en');
        await page.waitForSelector('[data-testid="beginner-home-portal"]', { timeout: 15000 });
        await expect(page.locator('[data-testid="beginner-academy-btn"]')).toContainText('DISCOVER RULES');

        // Intermédiaire EN
        await page.goto('/?gate=intermediate&lang=en');
        await page.waitForSelector('[data-testid="intermediate-home-portal"]', { timeout: 15000 });
        await expect(page.locator('[data-testid="intermediate-play-btn"]')).toContainText('PLAY NOW');

        // Expert EN
        await page.goto('/?gate=expert&lang=en');
        await page.waitForSelector('[data-testid="expert-home-portal"]', { timeout: 15000 });
        await expect(page.locator('[data-testid="expert-play-btn"]')).toContainText('LAUNCH');
    });
});
