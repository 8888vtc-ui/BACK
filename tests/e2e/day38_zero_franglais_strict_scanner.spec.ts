import { test, expect, type Page } from '@playwright/test';

/**
 * MISSION 38/50: Scanner Automatique Anti-Franglais sur 100 % des Pages & des Modales.
 * 
 * Règle d'or :
 * - Mode FR : Zéro mot anglais interdit non traduit.
 * - Mode EN : Zéro mot français interdit non traduit.
 * - 0 mot Franglais toléré.
 */

const FORBIDDEN_EN_IN_FR: ReadonlyArray<string> = [
    'Beginner',
    'Intermediate',
    'Guest Player',
    'Sign In',
    'Install App',
    'Find a Player',
    'Game Room',
    'My Quizzes',
    'My Blunders',
    'The Professor',
    'TEACHING MENTOR',
    'Professor Tip',
    'Hide arrows',
    'Undo / Retry',
    'Invite a Friend',
];

const FORBIDDEN_FR_IN_EN: ReadonlyArray<string> = [
    'Débutant',
    'Intermédiaire',
    'Joueur Invité',
    'Connexion',
    "Installer l'App",
    'Trouver un joueur',
    'Salon de Jeu',
    'Mes Quiz',
    'Mes Blunders',
    'Le Professeur',
    'MENTOR PÉDAGOGIQUE',
    'Lancer les dés',
    'Adversaire du Cercle',
    'À votre rythme',
];

function scanTextForForbiddenPhrases(
    text: string,
    forbiddenList: ReadonlyArray<string>,
    mode: 'FR' | 'EN',
): Array<{ phrase: string; excerpt: string }> {
    const violations: Array<{ phrase: string; excerpt: string }> = [];

    for (const phrase of forbiddenList) {
        let isHit = false;
        let hitIdx = -1;

        if (phrase === 'Beginner') {
            const match = /(?<![\p{L}\p{N}])Beginner[s]?(?![\p{L}\p{N}])/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Intermediate') {
            const match = /(?<![\p{L}\p{N}])Intermediate(?![\p{L}\p{N}])/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Débutant') {
            const match = /(?<![\p{L}\p{N}])D[ée]butant[es]?(?![\p{L}\p{N}])/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Intermédiaire') {
            const match = /(?<![\p{L}\p{N}])Interm[ée]diaire[s]?(?![\p{L}\p{N}])/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Connexion') {
            const match = /(?<![\p{L}\p{N}])Connexion[s]?(?![\p{L}\p{N}])/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Undo / Retry') {
            const match = /undo\s*\/\s*retry/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'À votre rythme') {
            const match = /[àa]\s+votre\s+rythme/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Lancer les dés') {
            const match = /lancer\s+les\s+d[ée]s/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'MENTOR PÉDAGOGIQUE') {
            const match = /mentor\s+p[ée]dagogique/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else if (phrase === 'Joueur Invité') {
            const match = /joueur\s+invit[ée]/iu.exec(text);
            if (match && match.index !== undefined) {
                isHit = true;
                hitIdx = match.index;
            }
        } else {
            const normText = text.toLowerCase();
            const normPhrase = phrase.toLowerCase();
            hitIdx = normText.indexOf(normPhrase);
            if (hitIdx !== -1) {
                isHit = true;
            }
        }

        if (isHit && hitIdx !== -1) {
            const start = Math.max(0, hitIdx - 35);
            const end = Math.min(text.length, hitIdx + phrase.length + 35);
            const excerpt = text.substring(start, end).replace(/\s+/g, ' ').trim();
            violations.push({ phrase, excerpt });
        }
    }

    return violations;
}

async function verifyZeroFranglais(page: Page, contextName: string, lang: 'fr' | 'en') {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(300);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const isEn = lang === 'en';
    const forbidden = isEn ? FORBIDDEN_FR_IN_EN : FORBIDDEN_EN_IN_FR;
    const mode = isEn ? 'EN' : 'FR';

    const violations = scanTextForForbiddenPhrases(bodyText, forbidden, mode);

    if (violations.length > 0) {
        const details = violations
            .map((v) => `  - [${v.phrase}]: "...${v.excerpt}..."`)
            .join('\n');
        expect(
            violations.length,
            `[${mode}] FR/EN Franglais violation detected on ${contextName}:\n${details}`,
        ).toBe(0);
    }
}

test.describe('Mission 38/50: Scanner Automatique Anti-Franglais sur 100 % des Pages & Modales', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    for (const lang of ['fr', 'en'] as const) {
        const langParam = `lang=${lang}`;

        test(`1. Scanner Hub Accueil & Portes 1/2/3 [${lang.toUpperCase()}]`, async ({ page }) => {
            // Porte par défaut (Intermediate)
            await page.goto(`/?${langParam}`);
            await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `Accueil (Défaut) [${lang}]`, lang);

            // Porte 1 : Débutant
            const btnBeginner = page.locator('[data-testid="tier-gate-btn-beginner"]').first();
            if (await btnBeginner.isVisible()) {
                await btnBeginner.click();
                await page.waitForTimeout(400);
                await verifyZeroFranglais(page, `Accueil (Porte Débutant) [${lang}]`, lang);
            }

            // Porte 2 : Intermédiaire
            const btnInter = page.locator('[data-testid="tier-gate-btn-intermediate"]').first();
            if (await btnInter.isVisible()) {
                await btnInter.click();
                await page.waitForTimeout(400);
                await verifyZeroFranglais(page, `Accueil (Porte Intermédiaire) [${lang}]`, lang);
            }

            // Porte 3 : Expert
            const btnExpert = page.locator('[data-testid="tier-gate-btn-expert"]').first();
            if (await btnExpert.isVisible()) {
                await btnExpert.click();
                await page.waitForTimeout(400);
                await verifyZeroFranglais(page, `Accueil (Porte Expert) [${lang}]`, lang);
            }
        });

        test(`2. Scanner Modales Matchmaking, Auth & CGU [${lang.toUpperCase()}]`, async ({ page }) => {
            await page.goto(`/?${langParam}`);
            await page.waitForSelector('[data-testid="app-navbar"]', { timeout: 15000 });

            // A. Modale Matchmaking
            const findBtn = page.locator('[data-testid="sidebar-find-player-btn"]');
            if (await findBtn.isVisible()) {
                await findBtn.click();
                await page.waitForSelector('[data-testid="multiplayer-lobby-modal"]', { timeout: 8000 });
                await verifyZeroFranglais(page, `Modale Matchmaking [${lang}]`, lang);
                // Close modal
                const closeMp = page.locator('[data-testid="close-lobby-button"]');
                if (await closeMp.isVisible()) await closeMp.click();
                else await page.keyboard.press('Escape');
                await page.waitForTimeout(400);
            }

            // B. Modale Auth
            const authTrigger = page.locator('[data-testid="auth-login-trigger"]').first();
            if (await authTrigger.isVisible()) {
                await authTrigger.click();
                await page.waitForSelector('[data-testid="player-passport-auth-modal"]', { timeout: 8000 });
                await verifyZeroFranglais(page, `Modale Auth [${lang}]`, lang);
                // Close modal
                const closeAuth = page.locator('[data-testid="auth-modal-close-btn"]');
                if (await closeAuth.isVisible()) await closeAuth.click();
                else await page.keyboard.press('Escape');
                await page.waitForTimeout(400);
            }

            // C. Modale CGU / Terms
            const termsBtn = page.locator('[data-testid="sidebar-terms-pr-policy-btn"]');
            if (await termsBtn.isVisible()) {
                await termsBtn.click();
                await page.waitForSelector('[data-testid="terms-and-pr-policy-modal"]', { timeout: 8000 });
                await verifyZeroFranglais(page, `Modale CGU / Terms [${lang}]`, lang);
                const closeTerms = page.locator('[data-testid="close-terms-modal-btn"]');
                if (await closeTerms.isVisible()) await closeTerms.click();
                else await page.keyboard.press('Escape');
                await page.waitForTimeout(400);
            }
        });

        test(`3. Scanner /play (Match Normal & Match Guidé) [${lang.toUpperCase()}]`, async ({ page }) => {
            // Match Normal
            await page.goto(`/play?${langParam}`);
            await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/play (Normal) [${lang}]`, lang);

            // Match Guidé (Beginner Gate)
            await page.goto(`/play?gate=beginner&start=guided&${langParam}`);
            await page.waitForSelector('[data-testid="app-game-view"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/play (Guidé) [${lang}]`, lang);
        });

        test(`4. Scanner /puzzles [${lang.toUpperCase()}]`, async ({ page }) => {
            await page.goto(`/puzzles?${langParam}`);
            await page.waitForSelector('[data-testid="guest-feature-lock-view"], [data-testid="drill-header"], [data-testid="app-navbar"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/puzzles [${lang}]`, lang);
        });

        test(`5. Scanner /analysis [${lang.toUpperCase()}]`, async ({ page }) => {
            await page.goto(`/analysis?${langParam}`);
            await page.waitForSelector('[data-testid="analysis-studio-root"], [data-testid="app-navbar"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/analysis [${lang}]`, lang);
        });

        test(`6. Scanner /tournaments [${lang.toUpperCase()}]`, async ({ page }) => {
            await page.goto(`/tournaments?${langParam}`);
            await page.waitForSelector('[data-testid="tournament-world-hub-view"], [data-testid="app-navbar"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/tournaments [${lang}]`, lang);
        });

        test(`7. Scanner /academy [${lang.toUpperCase()}]`, async ({ page }) => {
            await page.goto(`/academy?${langParam}`);
            await page.waitForSelector('[data-testid="gammon-academy-view"]', { timeout: 15000 });
            await verifyZeroFranglais(page, `/academy [${lang}]`, lang);
        });
    }
});
