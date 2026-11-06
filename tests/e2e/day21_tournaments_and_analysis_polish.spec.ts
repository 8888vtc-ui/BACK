import { test, expect } from '@playwright/test';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

test.describe('Day 21: Tournaments Map & Analysis Studio Polish', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
    });

    test('1. /tournaments : Contrôles sr-only bilingues, anti-chevauchement Europe et dates complètes', async ({ page }) => {
        // En français
        await page.goto('/tournaments?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        const tierMegaFr = page.locator('[data-testid="filter-tier-mega"]');
        await expect(tierMegaFr).toContainText('MEGA (150+ j. / 50k€+)');

        // En anglais
        await page.goto('/tournaments?lang=en');
        await page.waitForLoadState('domcontentloaded');

        const tierMegaEn = page.locator('[data-testid="filter-tier-mega"]');
        await expect(tierMegaEn).toContainText('MEGA (150+ players / 50k€+)');

        // Zoom Europe et anti-chevauchement des labels
        const zoomEurope = page.locator('[data-testid="map-zoom-europe"]');
        await zoomEurope.click();

        // Les labels de villes européennes denses ne sont pas tous affichés en même temps
        const visibleLabels = page.locator('[data-testid^="map-city-label-"]');
        const count = await visibleLabels.count();
        // Vérifier 0 collision entre les étiquettes visibles
        const boxes: Array<{ x: number; y: number; width: number; height: number }> = [];
        for (let i = 0; i < count; i++) {
            const lbl = visibleLabels.nth(i);
            if (await lbl.isVisible()) {
                const b = await lbl.boundingBox();
                if (b) boxes.push(b);
            }
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const b1 = boxes[i];
                const b2 = boxes[j];
                const overlap = !(
                    b1.x + b1.width <= b2.x ||
                    b2.x + b2.width <= b1.x ||
                    b1.y + b1.height <= b2.y ||
                    b2.y + b2.height <= b1.y
                );
                expect(overlap).toBe(false);
            }
        }

        // Vérification des dates en bas : non tronquées
        const firstCard = page.locator('[data-testid^="tournament-card-summary-"]').first();
        await expect(firstCard).toBeVisible();
        const dateSpan = firstCard.locator('span').filter({ hasText: /\d{4}/ });
        await expect(dateSpan).toBeVisible();
        const dateText = await dateSpan.innerText();
        expect(dateText.length).toBeGreaterThanOrEqual(10); // ex: "16 JANV. 2027" ou "2027"
    });

    test('2. /analysis : Parcours 3 étapes, % victoire en grand, flèches dorées et zéro emoji', async ({ page }) => {
        await page.goto('/analysis?lang=fr');
        await page.waitForLoadState('domcontentloaded');

        // 3 étapes numérotées
        const step1Badge = page.locator('text=ÉTAPE 1');
        const step2Badge = page.locator('text=ÉTAPE 2');
        const step3Badge = page.locator('text=ÉTAPE 3');
        await expect(step1Badge).toBeVisible();
        await expect(step2Badge).toBeVisible();
        await expect(step3Badge).toBeVisible();

        // 5 candidats avec % de victoire en grand
        for (let i = 0; i < 5; i++) {
            const row = page.locator(`[data-testid="analysis-move-row-${i}"]`);
            await expect(row).toBeVisible();
            await expect(row).toContainText(/% de victoire/i);
        }

        // Flèches dorées sur coup optimal
        const optimalArrow = page.locator('[data-testid="coach-ghost-checker-optimal-0"]');
        await expect(optimalArrow).toBeVisible();
        await expect(optimalArrow).toHaveAttribute('stroke', '#D4AF37');

        // Zéro emoji
        const bodyText = await page.evaluate(() => document.body.innerText);
        expect(EMOJI_REGEX.test(bodyText)).toBe(false);

        // Zéro scroll 1440x900
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        expect(scrollHeight).toBeLessThanOrEqual(900);
    });
});

