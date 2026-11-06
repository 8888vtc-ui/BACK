import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/play', '/puzzles', '/analysis', '/tournaments', '/academy'];
const FORBIDDEN_TRUNCATION_CHECKS: Array<{ name: string; test: (text: string) => boolean }> = [
    { name: 'Jou...', test: (text) => text.includes('Jou...') },
    { name: 'Joueu (sans r final)', test: (text) => /\bJoueu(?![rsxRSX])/u.test(text) },
    { name: 'Mode Débuta (sans nt final)', test: (text) => /\bMode\s+Débuta(?![nN])/u.test(text) },
    { name: ',000 PTS (sans chiffre initial)', test: (text) => /(?:^|\s),000\s*PTS/i.test(text) },
    { name: '16 JANV. 2 (date tronquée)', test: (text) => /\b16\s+JANV\.\s+2(?!\d{3})/i.test(text) },
];

test.describe('Mission 36/50: Scan Playwright Anti-Troncature & Bounding-Box sur tout le site', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const route of ROUTES) {
        for (const lang of ['fr', 'en'] as const) {
            test(`Audit DOM Bounding-Box & Troncatures sur ${route} [${lang.toUpperCase()}]`, async ({ page }) => {
                const url = `${route}${route.includes('?') ? '&' : '?'}lang=${lang}`;
                await page.goto(url);

                if (route === '/play') {
                    await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

                    // 1. Audit Bounding-Box de l'écran de jeu immersif (/play)
                    const gameButtons = page.locator('[data-testid="app-game-view"] button:visible');
                    const gameCount = await gameButtons.count();
                    for (let i = 0; i < gameCount; i++) {
                        const btn = gameButtons.nth(i);
                        const box = await btn.boundingBox();
                        if (box && box.width > 10 && box.height > 10) {
                            expect(box.x, `Game button #${i} overflows left: x=${box.x}`).toBeGreaterThanOrEqual(0);
                            expect(box.x + box.width, `Game button #${i} overflows right: right=${box.x + box.width} > 1440`).toBeLessThanOrEqual(1440);
                        }
                    }
                } else {
                    await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

                    // 1. Audit Bounding-Box des éléments visibles réels du Header (AppNavbar, hors sr-only)
                    const headerButtons = page.locator('[data-testid="app-navbar"] button:visible, [data-testid="app-navbar"] a:visible');
                    const headerCount = await headerButtons.count();

                    for (let i = 0; i < headerCount; i++) {
                        const btn = headerButtons.nth(i);
                        const isSrOnly = await btn.evaluate((el) => Boolean(el.closest('.sr-only')));
                        if (isSrOnly) continue;

                        const box = await btn.boundingBox();
                        if (box && box.width > 5 && box.height > 5) {
                            expect(box.x, `Header element #${i} overflows left: x=${box.x}`).toBeGreaterThanOrEqual(0);
                            expect(box.x + box.width, `Header element #${i} overflows right: right=${box.x + box.width} > 1440`).toBeLessThanOrEqual(1440);
                        }
                    }

                    // 2. Audit Bounding-Box de la Sidebar (LobbyLeftSidebar, hors sr-only)
                    const sidebar = page.locator('[data-testid="lobby-left-sidebar"]');
                    const sidebarVisible = await sidebar.isVisible();

                    if (sidebarVisible) {
                        const sidebarButtons = page.locator(
                            '[data-testid="lobby-left-sidebar"] button:visible, [data-testid="lobby-left-sidebar"] a:visible'
                        );
                        const sidebarCount = await sidebarButtons.count();

                        for (let i = 0; i < sidebarCount; i++) {
                            const btn = sidebarButtons.nth(i);
                            const isSrOnly = await btn.evaluate((el) => Boolean(el.closest('.sr-only')));
                            if (isSrOnly) continue;

                            const box = await btn.boundingBox();
                            if (box && box.width > 5 && box.height > 5) {
                                expect(box.x, `Sidebar element #${i} overflows left: x=${box.x}`).toBeGreaterThanOrEqual(0);
                                expect(box.x + box.width, `Sidebar element #${i} overflows right: right=${box.x + box.width} > 1440`).toBeLessThanOrEqual(1440);

                                // Aucun bouton ne dépasse 42px de hauteur (1 seule ligne stricte)
                                expect(box.height, `Sidebar button #${i} exceeds 42px height: height=${box.height}`).toBeLessThanOrEqual(42);
                            }
                        }

                        // Contrôle spécifique du bouton "Trouver un joueur" / "Find a Player"
                        const findPlayerBtn = page.locator('[data-testid="sidebar-find-player-btn"]');
                        if (await findPlayerBtn.isVisible()) {
                            const box = await findPlayerBtn.boundingBox();
                            expect(box).not.toBeNull();
                            if (box) {
                                expect(box.height, 'sidebar-find-player-btn height must be <= 42px').toBeLessThanOrEqual(42);
                            }
                        }
                    }
                }

                // 3. Scan Anti-Troncatures textuelles sur le contenu visible de la page
                const fullText = await page.locator('body').innerText();

                for (const check of FORBIDDEN_TRUNCATION_CHECKS) {
                    expect(
                        check.test(fullText),
                        `Troncature interdite détectée sur ${route} [${lang}]: "${check.name}"`,
                    ).toBe(false);
                }

                // 4. Contrôle du badge PTS dans le Header
                const pointsBadge = page.locator('[data-testid="navbar-points-badge"]');
                if (await pointsBadge.isVisible()) {
                    const pointsText = await pointsBadge.innerText();
                    expect(pointsText).toMatch(/\d{1,3}[\s,.]?\d{3}\s*PTS/);
                    expect(pointsText).not.toBe(',000 PTS');
                }
            });
        }
    }
});
