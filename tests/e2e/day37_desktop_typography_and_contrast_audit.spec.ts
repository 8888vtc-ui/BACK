import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/play', '/puzzles', '/analysis', '/tournaments', '/academy'];

test.describe('Mission 37/50: Scanner Playwright de Lisibilité Typographique (fontSize >= 12px) & Zéro-Scroll', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const route of ROUTES) {
        for (const lang of ['fr', 'en'] as const) {
            test(`Audit Lisibilité & Zero-Scroll sur ${route} [${lang.toUpperCase()}]`, async ({ page, isMobile }) => {
                test.skip(isMobile, 'Audit réservé au Desktop 1440x900');
                const url = `${route}${route.includes('?') ? '&' : '?'}lang=${lang}`;
                await page.goto(url);

                if (route === '/play') {
                    await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });
                } else {
                    await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });
                }

                // 1. Contrôle strict Zéro-Scroll sur 1440x900
                const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
                expect(
                    scrollHeight,
                    `Zero-Scroll violation on ${route} [${lang}]: scrollHeight=${scrollHeight} > 900`,
                ).toBeLessThanOrEqual(900);

                // 2. Scan Typographique : Aucun texte visible < 12px (text-xs minimum)
                const sub12pxElements = await page.evaluate(() => {
                    const infractions: Array<{ text: string; fontSize: number; tag: string }> = [];
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
                    let node: Node | null = walker.currentNode;

                    while (node) {
                        const el = node as HTMLElement;
                        node = walker.nextNode();

                        if (!el || !el.getBoundingClientRect) continue;
                        if (el.closest('.sr-only') || el.closest('svg')) continue;
                        if (['SCRIPT', 'STYLE', 'SVG', 'PATH', 'NOSCRIPT', 'IFRAME'].includes(el.tagName)) continue;

                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) continue;

                        const style = window.getComputedStyle(el);
                        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

                        // Vérifier si l'élément possède un nœud texte direct non vide
                        let hasDirectText = false;
                        for (let i = 0; i < el.childNodes.length; i++) {
                            const child = el.childNodes[i];
                            if (child && child.nodeType === Node.TEXT_NODE && child.textContent && child.textContent.trim().length > 0) {
                                hasDirectText = true;
                                break;
                            }
                        }

                        if (hasDirectText) {
                            const fontSize = parseFloat(style.fontSize);
                            if (fontSize < 11.5) { // Tolérance micro de rendu sub-pixel
                                infractions.push({
                                    text: (el.textContent || '').trim().slice(0, 35),
                                    fontSize,
                                    tag: el.tagName.toLowerCase(),
                                });
                            }
                        }
                    }
                    return infractions;
                });

                expect(
                    sub12pxElements,
                    `Text elements below 12px found on ${route} [${lang}]: ${JSON.stringify(sub12pxElements.slice(0, 5))}`,
                ).toHaveLength(0);
            });
        }
    }
});

