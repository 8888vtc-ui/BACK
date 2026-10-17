/**
 * Script automatisé Playwright de capture des captures d'écran (Screenshots)
 * aux dimensions officielles de l'Apple App Store et du Google Play Store.
 *
 * Utilisation :
 *   node scripts/capture-store-screenshots.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE_URL = process.env.SCREENSHOT_URL || 'http://localhost:3000';

const DEVICES = [
    // --- iOS App Store ---
    {
        name: 'ios_6.7_iphone_pro_max',
        folder: 'store-assets/screenshots/ios/6.7-inch',
        width: 1290,
        height: 2796,
        scale: 1,
        isMobile: true,
    },
    {
        name: 'ios_6.5_iphone_xs_max',
        folder: 'store-assets/screenshots/ios/6.5-inch',
        width: 1242,
        height: 2688,
        scale: 1,
        isMobile: true,
    },
    {
        name: 'ios_12.9_ipad_pro',
        folder: 'store-assets/screenshots/ios/12.9-inch-ipad',
        width: 2048,
        height: 2732,
        scale: 1,
        isMobile: false,
    },
    // --- Google Play Store ---
    {
        name: 'android_phone',
        folder: 'store-assets/screenshots/android/phone',
        width: 1080,
        height: 2400,
        scale: 1,
        isMobile: true,
    },
    {
        name: 'android_tablet_7',
        folder: 'store-assets/screenshots/android/tablet-7',
        width: 1200,
        height: 1920,
        scale: 1,
        isMobile: false,
    },
    {
        name: 'android_tablet_10',
        folder: 'store-assets/screenshots/android/tablet-10',
        width: 1600,
        height: 2560,
        scale: 1,
        isMobile: false,
    },
];

const SCENARIOS = [
    {
        id: '01_tournament_board',
        path: '/',
        title: 'Plateau de Tournoi & Déplacements Fluides',
        action: async (page) => {
            await page.waitForSelector('[data-testid="backgammon-board"]', { timeout: 10000 });
            await page.waitForTimeout(500);
        },
    },
    {
        id: '02_grandmaster_coach',
        path: '/',
        title: 'Coach Grand-Maître IA & Détection de Blunders',
        action: async (page) => {
            const coachBtn = page.locator('button:has-text("Coach"), [aria-label*="coach" i]').first();
            if (await coachBtn.isVisible()) {
                await coachBtn.click();
                await page.waitForTimeout(800);
            }
        },
    },
    {
        id: '03_blunder_drills',
        path: '/drills',
        title: 'Drills de Blunders & Entraînement Tactique',
        action: async (page) => {
            await page.waitForTimeout(1000);
        },
    },
    {
        id: '04_daily_puzzles',
        path: '/puzzles',
        title: 'Puzzles Quotidiens & Défis Maîtres',
        action: async (page) => {
            await page.waitForTimeout(1000);
        },
    },
    {
        id: '05_progression_dashboard',
        path: '/progression',
        title: 'Statistiques & Courbe d’Évolution PR',
        action: async (page) => {
            await page.waitForTimeout(1000);
        },
    },
];

async function main() {
    console.log(`[Store Screenshots] Démarrage des captures sur ${BASE_URL}...`);
    const browser = await chromium.launch({ headless: true });

    for (const device of DEVICES) {
        console.log(`\n📱 Génération pour ${device.name} (${device.width}x${device.height})...`);
        const targetDir = path.resolve(device.folder);
        fs.mkdirSync(targetDir, { recursive: true });

        const context = await browser.newContext({
            viewport: { width: device.width, height: device.height },
            deviceScaleFactor: device.scale,
            isMobile: device.isMobile,
            hasTouch: device.isMobile,
        });

        const page = await context.newPage();

        for (const scenario of SCENARIOS) {
            const outPath = path.join(targetDir, `${scenario.id}.png`);
            console.log(`  📸 Capture : ${scenario.id} (${scenario.title})`);
            try {
                await page.goto(`${BASE_URL}${scenario.path}`, { waitUntil: 'networkidle', timeout: 30000 });
                if (scenario.action) {
                    await scenario.action(page);
                }
                await page.screenshot({ path: outPath, fullPage: false });
            } catch (err) {
                console.warn(`    ⚠️ Avertissement lors de la capture ${scenario.id}: ${err.message}`);
            }
        }

        await context.close();
    }

    await browser.close();
    console.log('\n✅ Toutes les captures d’écran des stores ont été générées dans store-assets/screenshots/ !');
}

main().catch((err) => {
    console.error('[Store Screenshots] Erreur:', err);
    process.exit(1);
});
