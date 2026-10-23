import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour la suite E2E du jeu de Backgammon :
 * - Partie complète & règles de match
 * - Déclenchement et streaming du coach grand-maître
 * - Authentification Supabase
 * - Viewports mobile (iPhone, Android / Pixel)
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    timeout: 45000,
    expect: {
        timeout: 10000,
    },
    use: {
        baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 800 },
            },
        },
        {
            name: 'Mobile Safari (iPhone 13)',
            use: {
                ...devices['iPhone 13'],
                defaultBrowserType: 'chromium',
                hasTouch: true,
                // L'app force le paysage sur mobile (bloqueur de rotation) :
                // les tests s'exécutent donc en orientation paysage.
                viewport: { width: 844, height: 390 },
            },
        },
        {
            name: 'Mobile Chrome (Pixel 5)',
            use: {
                ...devices['Pixel 5'],
                hasTouch: true,
                // L'app force le paysage sur mobile (bloqueur de rotation) :
                // les tests s'exécutent donc en orientation paysage.
                viewport: { width: 851, height: 393 },
            },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
