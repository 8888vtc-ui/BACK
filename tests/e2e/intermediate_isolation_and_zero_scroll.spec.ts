import { test, expect } from '@playwright/test';

test.describe('Zone 3B - Intermediate Gate Isolation & Zero Scroll (1440x900)', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('Zero emojis, single gold CTA, zero scroll on 1440x900 and clean FR/EN', async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (err) => pageErrors.push(err));

        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Select Intermediate Gate (first button in navbar)
        const intermediateBtn = page.locator('[data-testid="tier-gate-btn-intermediate"]').first();
        await intermediateBtn.click();

        const portal = page.locator('[data-testid="intermediate-home-portal"]');
        await expect(portal).toBeVisible();

        // 1. Check zero residual emojis in portal text
        const portalText = (await portal.textContent()) || '';
        expect(portalText).not.toContain('♟');
        expect(portalText).not.toContain('⚡');
        expect(portalText).not.toContain('✨');
        expect(portalText).not.toContain('🎲');

        // 2. Check header gate switch active style: should NOT be solid gold
        const gateBtnClasses = await intermediateBtn.getAttribute('class') || '';
        expect(gateBtnClasses).toContain('text-[#D4AF37]');
        expect(gateBtnClasses).toContain('border-[#D4AF37]/50');
        expect(gateBtnClasses).not.toContain('bg-gradient-to-r from-[#D4AF37]');

        // 3. Format selector active button should NOT be solid gold
        const format5Btn = page.locator('[data-testid="match-format-5"]');
        await expect(format5Btn).toBeVisible();
        const format5Classes = await format5Btn.getAttribute('class') || '';
        expect(format5Classes).toContain('text-[#D4AF37]');
        expect(format5Classes).not.toContain('bg-[#D4AF37]');

        // 4. Tab 1 of club secrets should NOT be solid gold
        const tab1Btn = page.locator('[data-testid="club-key-tab-1"]');
        await expect(tab1Btn).toBeVisible();
        const tab1Classes = await tab1Btn.getAttribute('class') || '';
        expect(tab1Classes).toContain('text-[#D4AF37]');
        expect(tab1Classes).not.toContain('bg-gradient-to-r from-[#D4AF37]');

        // 5. Check practice button is secondary style
        const practiceBtn = page.locator('[data-testid="club-secrets-practice-btn"]');
        await expect(practiceBtn).toBeVisible();
        const practiceClasses = await practiceBtn.getAttribute('class') || '';
        expect(practiceClasses).toContain('bg-white/10');
        expect(practiceClasses).not.toContain('bg-gradient-to-r');

        // 6. Only play CTA has the full gold gradient
        const playBtn = page.locator('[data-testid="intermediate-play-btn"]');
        await expect(playBtn).toBeVisible();
        const playClasses = await playBtn.getAttribute('class') || '';
        expect(playClasses).toContain('bg-gradient-to-r from-[#E5C158] via-[#D4AF37] to-[#B5902B]');

        // 7. Check zero scroll on 1440x900 viewport
        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
        expect(scrollHeight).toBeLessThanOrEqual(clientHeight);

        // 8. Test FR | EN toggle without page error
        const langToggle = page.locator('button:has-text("EN"), button:has-text("FR")').first();
        if (await langToggle.isVisible()) {
            await langToggle.click();
            await page.waitForTimeout(300);
            await expect(portal).toBeVisible();
        }

        expect(pageErrors).toHaveLength(0);
    });
});

