import { test, expect } from '@playwright/test';

test.describe('Zone 3 - Gate 3 Expert Home Portal Isolation & Zero Scroll (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('Zero emojis, single gold CTA, ER/PR, ERA, RATING and zero scroll on 1440x900', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Select Expert / Pro Gate (first button in navbar)
        const expertBtn = page.locator('[data-testid="tier-gate-btn-expert"]').first();
        await expertBtn.click();

        const portal = page.locator('[data-testid="expert-home-portal"]');
        await expect(portal).toBeVisible();

        // 1. Check zero residual emojis in portal text
        const portalText = (await portal.textContent()) || '';
        expect(portalText).not.toContain('♟');
        expect(portalText).not.toContain('⚔');
        expect(portalText).not.toContain('🔗');
        expect(portalText).not.toContain('⚖');
        expect(portalText).not.toContain('🔥');
        expect(portalText).not.toContain('🎯');
        expect(portalText).not.toContain('🏆');

        // 2. Check title contains single line without duplicate badge
        expect(portalText).toContain('COCKPIT EXPERT / PRO • OPEN SAGE 3-PLY (0.55 PR)');

        // 3. Telemetry metrics in cartouche: ER / PR, ERA, RATING
        await expect(page.locator('[data-testid="expert-er-pr"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-era"]')).toBeVisible();
        await expect(page.locator('[data-testid="expert-rating"]')).toBeVisible();

        // 4. Formats should NOT be solid gold
        const format7Btn = page.locator('[data-testid="expert-format-7"]');
        await expect(format7Btn).toBeVisible();
        const format7Classes = await format7Btn.getAttribute('class') || '';
        expect(format7Classes).toContain('text-[#D4AF37]');
        expect(format7Classes).not.toContain('bg-[#D4AF37]');

        // 5. Only play CTA has the full gold gradient
        const playBtn = page.locator('[data-testid="expert-play-btn"]');
        await expect(playBtn).toBeVisible();
        const playClasses = await playBtn.getAttribute('class') || '';
        expect(playClasses).toContain('bg-gradient-to-b from-[#E5C158] via-[#D4AF37] to-[#B5902B]');

        // 6. Check zero scroll on 1440x900 viewport
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
        expect(scrollHeight).toBeLessThanOrEqual(clientHeight);

        expect(pageErrors).toHaveLength(0);
    });
});

