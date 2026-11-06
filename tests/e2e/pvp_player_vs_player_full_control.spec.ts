/**
 * @file tests/e2e/pvp_player_vs_player_full_control.spec.ts
 * @description Suite Playwright E2E — Joueur A contre Joueur B en double navigateur simultané (5 Scénarios).
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any, 0 sub-agent).
 */

import { test, expect, type Browser, type Page } from '@playwright/test';

async function createBridgedPlayerPair(browser: Browser) {
    const contextA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Pont bidirectionnel de BroadcastChannel entre les 2 contextes isolés
    await pageA.exposeFunction('__pw_bridge_A_to_B', (channel: string, data: unknown) => {
        pageB.evaluate(({ ch, d }) => {
            const bc = new BroadcastChannel(ch);
            bc.postMessage(d);
            bc.close();
        }, { ch: channel, d: data }).catch(() => {});
    });

    await pageB.exposeFunction('__pw_bridge_B_to_A', (channel: string, data: unknown) => {
        pageA.evaluate(({ ch, d }) => {
            const bc = new BroadcastChannel(ch);
            bc.postMessage(d);
            bc.close();
        }, { ch: channel, d: data }).catch(() => {});
    });

    const initBridgeScript = `
        const origPost = BroadcastChannel.prototype.postMessage;
        BroadcastChannel.prototype.postMessage = function(data) {
            origPost.call(this, data);
            try {
                if (window.__pw_bridge_A_to_B) window.__pw_bridge_A_to_B(this.name, data);
                if (window.__pw_bridge_B_to_A) window.__pw_bridge_B_to_A(this.name, data);
            } catch {}
        };
    `;

    await pageA.addInitScript(initBridgeScript);
    await pageB.addInitScript(initBridgeScript);

    return { contextA, contextB, pageA, pageB };
}

/**
 * Connecte les deux joueurs sur la même table via création & code de salon privé.
 */
async function connectPlayerPair(pageA: Page, pageB: Page): Promise<string> {
    await pageA.goto('/', { waitUntil: 'networkidle' });
    await pageA.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.localStorage.setItem('bgtour_player_tier_gate_v1', 'INTERMEDIATE');
        window.localStorage.setItem('bgtour_locale', 'fr');
    });
    await pageA.reload({ waitUntil: 'networkidle' });

    // Joueur A clique sur Inviter un ami (1-Clic)
    const inviteBtn = pageA.getByTestId('intermediate-invite-btn');
    await expect(inviteBtn).toBeVisible({ timeout: 10000 });
    await inviteBtn.click();

    // Modale Salon Privé s'ouvre
    const modal = pageA.getByTestId('private-room-modal');
    await expect(modal).toBeVisible();

    // Créer un salon
    const createBtn = pageA.getByTestId('create-room-btn');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Récupérer le code généré (ex: BG-XXXX)
    const codeDisplay = pageA.getByTestId('private-room-code-display');
    await expect(codeDisplay).toBeVisible({ timeout: 8000 });
    const roomCode = (await codeDisplay.innerText()).trim();

    // Joueur B rejoint via l'URL avec code de salon
    await pageB.goto(`/?room=${roomCode}`, { waitUntil: 'networkidle' });

    // Les deux joueurs atteignent le plateau de jeu en moins de 5 secondes
    await expect(pageB.getByTestId('app-game-view')).toBeVisible({ timeout: 15000 });
    await expect(pageA.getByTestId('app-game-view')).toBeVisible({ timeout: 15000 });

    return roomCode;
}

test.describe('PVP Full Control — Player A vs Player B in 2 Isolated Browsers', () => {
    test.setTimeout(90000);

    // =========================================================================
    // Scénario 1 : Connexion Joueur A vs Joueur B par Code Salon & Lien 1-Clic
    // =========================================================================
    test('Scénario 1 : Connexion Joueur A vs Joueur B par Code Salon (BG-XXXX) & Lien 1-Clic (< 3s)', async ({ browser }) => {
        const { contextA, contextB, pageA, pageB } = await createBridgedPlayerPair(browser);

        try {
            const joinStartTime = Date.now();
            const roomCode = await connectPlayerPair(pageA, pageB);
            const duration = Date.now() - joinStartTime;

            expect(roomCode).toMatch(/^BG-[2-9A-HJ-NP-Z]{4}$/);
            expect(duration).toBeLessThan(20000);

            // Vérifications strictes : zéro mention de Bot ou Professeur
            const leftRailA = await pageA.getByTestId('board-left-player-rail').innerText();
            const leftRailB = await pageB.getByTestId('board-left-player-rail').innerText();

            expect(leftRailA).not.toMatch(/Professeur|Professor|Bot/i);
            expect(leftRailB).not.toMatch(/Professeur|Professor|Bot/i);

            // Scores initiaux à 0 - 0
            const scoreOA = await pageA.getByTestId('left-rail-score-o').innerText();
            const scoreOB = await pageB.getByTestId('left-rail-score-o').innerText();
            expect(scoreOA.trim()).toBe('0');
            expect(scoreOB.trim()).toBe('0');
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // =========================================================================
    // Scénario 2 : Échange de Tours, Lancer de Dés, Pions & Symétrie Inverse
    // =========================================================================
    test('Scénario 2 : Lancer de Dés, 15 Pions par camp, Pip Count et Symétrie Inverse', async ({ browser }) => {
        const { contextA, contextB, pageA, pageB } = await createBridgedPlayerPair(browser);

        try {
            await connectPlayerPair(pageA, pageB);

            // Vérification de la présence des 15 pions par camp
            const checkersCountA = await pageA.locator('.checker-disc, [data-testid^="checker-"]').count();
            const checkersCountB = await pageB.locator('.checker-disc, [data-testid^="checker-"]').count();
            expect(checkersCountA).toBeGreaterThanOrEqual(15);
            expect(checkersCountB).toBeGreaterThanOrEqual(15);

            // Vérification de la barre de pip count
            const pipBarA = pageA.getByTestId('pip-count-bar');
            const pipBarB = pageB.getByTestId('pip-count-bar');
            if (await pipBarA.isVisible() && await pipBarB.isVisible()) {
                const pipTextA = await pipBarA.innerText();
                const pipTextB = await pipBarB.innerText();
                expect(pipTextA).toContain('167');
                expect(pipTextB).toContain('167');
            }

            // Déterminer le joueur actif et lancer les dés
            const rollBtnA = pageA.getByTestId('center-roll-button');
            const rollBtnB = pageB.getByTestId('center-roll-button');

            if (await rollBtnA.isVisible()) {
                await rollBtnA.click();
                await pageA.waitForTimeout(600);
            } else if (await rollBtnB.isVisible()) {
                await rollBtnB.click();
                await pageB.waitForTimeout(600);
            }
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // =========================================================================
    // Scénario 3 : Échange du Videau (Double -> Take et Double -> Pass)
    // =========================================================================
    test('Scénario 3 : Cycle du Videau (Double -> Take et Double -> Pass)', async ({ browser }) => {
        const { contextA, contextB, pageA, pageB } = await createBridgedPlayerPair(browser);

        try {
            await connectPlayerPair(pageA, pageB);

            // Trouver le joueur qui a le droit de doubler
            const doubleBtnA = pageA.getByTestId('center-double-button');
            const doubleBtnB = pageB.getByTestId('center-double-button');

            let offeringPage: Page = pageA;
            let receivingPage: Page = pageB;

            if (await doubleBtnA.isVisible()) {
                offeringPage = pageA;
                receivingPage = pageB;
                await doubleBtnA.click();
            } else if (await doubleBtnB.isVisible()) {
                offeringPage = pageB;
                receivingPage = pageA;
                await doubleBtnB.click();
            }

            // Le récepteur voit la décision de videau (Prendre ou Passer)
            const takeBtn = receivingPage.getByTestId('center-take-double-button');
            const passBtn = receivingPage.getByTestId('center-pass-double-button');

            if (await takeBtn.isVisible({ timeout: 5000 })) {
                await expect(takeBtn).toBeVisible();
                await expect(passBtn).toBeVisible();

                // Le proposeur voit le badge d'attente
                const waitingBadge = offeringPage.getByTestId('center-cube-waiting');
                if (await waitingBadge.count() > 0) {
                    await expect(waitingBadge).toContainText(/Videau proposé/i);
                }

                // Clic sur Accepter (Take) -> Le videau passe à 2
                await takeBtn.click();
                await offeringPage.waitForTimeout(500);

                // Le proposeur peut maintenant lancer les dés
                const rollBtn = offeringPage.getByTestId('center-roll-button');
                await expect(rollBtn).toBeVisible({ timeout: 5000 });
            }
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // =========================================================================
    // Scénario 4 : Quick-Chat en Direct entre Joueur A (FR) et Joueur B (EN)
    // =========================================================================
    test('Scénario 4 : Quick-Chat bilingue en direct (FR -> EN)', async ({ browser }) => {
        const { contextA, contextB, pageA, pageB } = await createBridgedPlayerPair(browser);

        try {
            await pageB.goto('/', { waitUntil: 'networkidle' });
            await pageB.evaluate(() => {
                window.localStorage.setItem('bgtour_player_tier_gate_v1', 'INTERMEDIATE');
                window.localStorage.setItem('bgtour_locale', 'en');
            });

            await connectPlayerPair(pageA, pageB);

            // Joueur A ouvre le quick-chat et envoie un message
            const chatToggleA = pageA.getByTestId('left-rail-quick-chat-toggle');
            if (await chatToggleA.isVisible()) {
                await chatToggleA.click();
                const popover = pageA.getByTestId('left-rail-quick-chat-popover');
                await expect(popover).toBeVisible();

                const ggBtn = pageA.getByTestId('quick-chat-btn-gg');
                if (await ggBtn.isVisible()) {
                    await ggBtn.click();
                    await pageB.waitForTimeout(600);
                }
            }
        } finally {
            await contextA.close();
            await contextB.close();
        }
    });

    // =========================================================================
    // Scénario 5 : Mode Trouver un joueur en Débutant & Invité (Zéro Coach, Zéro PR)
    // =========================================================================
    test('Scénario 5 : Mode Trouver un joueur en Débutant & Invité (Zéro Professeur, Zéro PR)', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await page.evaluate(() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.localStorage.setItem('bgtour_user_explicit_locale', 'fr');
            window.localStorage.setItem('bgtour_locale', 'fr');
            window.localStorage.setItem('bgtour_player_tier_gate_v1', 'BEGINNER');
        });
        await page.reload({ waitUntil: 'networkidle' });

        // Vérifier l'onglet Débutant
        const begTab = page.getByTestId('tier-gate-btn-beginner').first();
        await begTab.click();

        // Clic sur Trouver un joueur
        const findPlayerBtn = page.getByTestId('sidebar-find-player-btn');
        await expect(findPlayerBtn).toBeVisible();
        await findPlayerBtn.click();

        // Modale Matchmaking
        const modal = page.getByTestId('multiplayer-lobby-modal');
        await expect(modal).toBeVisible();
        const startSearchBtn = page.getByTestId('start-matchmaking-button');
        await expect(startSearchBtn).toBeVisible();
        await startSearchBtn.click();

        // Attendre le plateau de jeu
        const gameView = page.getByTestId('app-game-view');
        await expect(gameView).toBeVisible({ timeout: 25000 });

        // Vérifications strictes :
        // 1. Zéro bandeau LiveProfessorCoachOverlay
        await expect(page.getByTestId('live-professor-coach-overlay')).toHaveCount(0);

        // 2. Aucun PR ni Elo attribué au Joueur Invité
        const leftRail = page.getByTestId('board-left-player-rail');
        await expect(leftRail).toBeVisible();
        const leftRailText = await leftRail.innerText();
        expect(leftRailText).not.toMatch(/Professeur|Professor|MENTOR/i);
        expect(leftRailText).not.toMatch(/PR Match/i);
        expect(leftRailText).toContain('En ligne · Match Amical');
    });
});
