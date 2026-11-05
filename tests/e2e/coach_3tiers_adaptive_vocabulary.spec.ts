import { test, expect } from '@playwright/test';

test.describe('Coach IA — Matrice Adaptative & Vocabulaire en 3 Niveaux (?gate=beginner, intermediate, expert)', () => {
    test('1. Vérifie l’injection de gate=beginner et l’absence totale de jargon', async ({ page }) => {
        await page.goto('/play?gate=beginner');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        // Vérification de la persistance du niveau BEGINNER
        const gateInStorage = await page.waitForFunction(() => localStorage.getItem('bgtour_player_gate'), { timeout: 10000 });
        expect(await gateInStorage.jsonValue()).toBe('BEGINNER');

        // Vérification que le jargon EMG / MWC / PR est banni de l'affichage
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toContain('0.040 EMG');
        expect(bodyText).not.toContain('% MWC');
        expect(bodyText).not.toContain('PR Match :');
    });

    test('2. Vérifie la bascule sur gate=intermediate', async ({ page }) => {
        await page.goto('/play?gate=intermediate');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        const gateInStorage = await page.waitForFunction(() => localStorage.getItem('bgtour_player_gate'), { timeout: 10000 });
        expect(await gateInStorage.jsonValue()).toBe('INTERMEDIATE');
    });

    test('3. Vérifie la bascule sur gate=expert', async ({ page }) => {
        await page.goto('/play?gate=expert');
        await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });

        const gateInStorage = await page.waitForFunction(() => localStorage.getItem('bgtour_player_gate'), { timeout: 10000 });
        expect(await gateInStorage.jsonValue()).toBe('EXPERT');
    });

    test('4. Vérifie que la route API /api/coach reçoit et applique playerTier selon le niveau', async ({ page }) => {
        // Enregistre et simule un appel direct à /api/coach avec playerTier BEGINNER
        const beginnerResponse = await page.request.post('/api/coach', {
            data: {
                playedMove: '24/23 13/8',
                optimalMove: '24/18 13/8',
                equityLoss: -0.082,
                verdict: 'blunder',
                playerTier: 'BEGINNER',
                playerLevel: 'beginner',
                language: 'fr',
            },
        });

        expect(beginnerResponse.status()).toBe(200);
        const beginnerText = await beginnerResponse.text();

        // Le texte retourné en streaming ne doit comporter aucun terme interdit
        expect(beginnerText).not.toContain('0.082 EMG');
        expect(beginnerText).not.toContain('MWC');
        expect(beginnerText).not.toContain('cubeful');

        // Enregistre et simule un appel direct à /api/coach avec playerTier EXPERT
        const expertResponse = await page.request.post('/api/coach', {
            data: {
                playedMove: '24/23 13/8',
                optimalMove: '24/18 13/8',
                equityLoss: -0.082,
                verdict: 'blunder',
                playerTier: 'EXPERT',
                playerLevel: 'expert',
                language: 'fr',
            },
        });

        expect(expertResponse.status()).toBe(200);
        const expertText = await expertResponse.text();

        // Le texte expert doit contenir l'équité ou le cadre théorique
        expect(expertText).toContain('EMG');
    });
});
