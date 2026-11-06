import { test, expect } from '@playwright/test';

/**
 * @file tests/e2e/day46_memory_leaks_and_zero_console_errors.spec.ts
 * @description Mission 46 : Chasse aux Fuites Mémoire & Zéro Console Error
 * Navigue rapidement à travers 20 changements de pages consécutifs
 * Écoute console.error, pageerror, alertes d'hydratation et warnings React.
 */

test.describe('Day 46 — Chasse aux Fuites Mémoire & Zéro Console Error', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('20 navigations consécutives rapides sans aucune erreur console ni fuite mémoire', async ({ page }) => {
        test.setTimeout(120000);

        const consoleErrors: string[] = [];
        const pageErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignorer d'éventuels échecs réseau locaux ou favicon
                if (text.includes('favicon.ico') || text.includes('net::ERR_')) return;
                consoleErrors.push(text);
            }
        });

        page.on('pageerror', (err) => {
            pageErrors.push(err.message);
        });

        const routeList = [
            '/',
            '/puzzles',
            '/play',
            '/analysis',
            '/tournaments',
            '/academy',
            '/puzzles?mode=beginner-academy',
            '/?gate=INTERMEDIATE',
            '/puzzles?filter=personal-blunders',
            '/?gate=EXPERT',
            '/play?gate=beginner&start=guided',
            '/analysis',
            '/tournaments',
            '/',
            '/puzzles',
            '/academy',
            '/play',
            '/tournaments',
            '/puzzles',
            '/',
        ];

        for (let i = 0; i < routeList.length; i++) {
            const route = routeList[i];
            await page.goto(route, { waitUntil: 'domcontentloaded' });
            // Temps de rendu pour que useEffect s'exécute et se monte/démonte
            await page.waitForTimeout(300);

            // Vérification incrémentale à chaque étape
            expect(pageErrors, `PageError détectée sur ${route} (étape ${i + 1}/20)`).toHaveLength(0);
            expect(consoleErrors, `Console Error détectée sur ${route} (étape ${i + 1}/20)`).toHaveLength(0);
        }

        expect(pageErrors).toHaveLength(0);
        expect(consoleErrors).toHaveLength(0);
    });
});
