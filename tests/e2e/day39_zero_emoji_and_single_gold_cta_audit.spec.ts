import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * MISSION 39/50 : SCANNER AUTOMATIQUE « ZÉRO EMOJI SYSTÈME » & « UN SEUL BOUTON PLEIN OR (#D4AF37) PAR ÉCRAN »
 *
 * Invariants vérifiés :
 * 1. Zéro emoji système interdit (🔥, 🎯, ⚡, ♟️, 🏛️, 🔍, 💡, 🏠, 📸, 🗑️, ✨, 🔑, ❤️, 🟢, 👍)
 *    dans tous les fichiers .tsx de src/ (code pur et icons vectorielles Lucide strokeWidth={1.5}).
 * 2. Zéro emoji système rendu dans le DOM sur 100 % des pages principales (FR & EN),
 *    hors drapeaux pays ISO des joueurs ([\u{1F1E6}-\u{1F1FF}]{2}).
 * 3. Au maximum 1 seul bouton d'action principal plein or (#D4AF37 / from-[#E5C158]) visible par écran.
 */

const FORBIDDEN_EMOJIS_REGEX = /(?:🔥|🎯|⚡|♟️?|🏛️?|🔍|💡|🏠|📸|🗑️?|✨|🔑|❤️?|🟢|👍)/u;
const DOM_SYSTEM_EMOJI_REGEX = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const ISO_FLAG_REGEX = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;

function getAllTsxFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllTsxFiles(fullPath));
        } else if (file.endsWith('.tsx')) {
            results.push(fullPath);
        }
    }
    return results;
}

test.describe('MISSION 39 — Scanner Zéro Emoji Système & Unicité du Bouton Plein Or', () => {
    test('1. Scanne 100 % des fichiers .tsx de src/ : zéro emoji système résiduel', async () => {
        const srcDir = path.resolve(process.cwd(), 'src');
        const tsxFiles = getAllTsxFiles(srcDir);
        expect(tsxFiles.length).toBeGreaterThan(50);

        const violations: Array<{ file: string; match: string }> = [];

        for (const file of tsxFiles) {
            const content = fs.readFileSync(file, 'utf8');
            const match = content.match(FORBIDDEN_EMOJIS_REGEX);
            if (match) {
                const relativePath = path.relative(process.cwd(), file);
                violations.push({ file: relativePath, match: match[0] });
            }
        }

        expect(
            violations,
            `Des emojis systèmes interdits subsistent dans ${violations.length} fichiers .tsx :\n` +
            violations.map((v) => ` - ${v.file}: ${v.match}`).join('\n')
        ).toEqual([]);
    });

    const PAGES_TO_SCAN = [
        { name: 'Accueil Porte 1 Débutant (FR)', url: '/?gate=beginner&lang=fr' },
        { name: 'Accueil Porte 2 Intermédiaire (FR)', url: '/?gate=intermediate&lang=fr' },
        { name: 'Accueil Porte 3 Expert (FR)', url: '/?gate=expert&lang=fr' },
        { name: 'Accueil (EN)', url: '/?lang=en' },
        { name: 'Plateau Libre /play (FR)', url: '/play?lang=fr' },
        { name: 'Plateau Guidé /play (FR)', url: '/play?gate=beginner&start=guided&lang=fr' },
        { name: 'Puzzles Quotidiens /puzzles (FR)', url: '/puzzles?lang=fr' },
        { name: 'Studio Analyse /analysis (FR)', url: '/analysis?lang=fr' },
        { name: 'Tournois & Clubs /tournaments (FR)', url: '/tournaments?lang=fr' },
        { name: 'Gammon Academy /academy (FR)', url: '/academy?lang=fr' },
    ];

    for (const route of PAGES_TO_SCAN) {
        test(`2. Zéro emoji système rendu dans le DOM sur : ${route.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto(route.url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(600);

            const emojisFound = await page.evaluate((flagsPatternStr) => {
                const text = document.body.innerText || '';
                // Retire d'abord les drapeaux pays ISO autorisés (ex: 🇫🇷, 🇬🇧)
                const flagsRegex = new RegExp(flagsPatternStr, 'gu');
                const cleanText = text.replace(flagsRegex, '');

                const systemEmojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
                const matches = cleanText.match(systemEmojiRegex) || [];
                return Array.from(new Set(matches));
            }, ISO_FLAG_REGEX.source);

            expect(
                emojisFound,
                `Emojis systèmes non autorisés trouvés sur ${route.name} : ${emojisFound.join(' ')}`
            ).toEqual([]);
        });
    }

    const SCREENS_FOR_GOLD_CTA = [
        { name: 'Accueil Débutant', url: '/?gate=beginner&lang=fr' },
        { name: 'Accueil Intermédiaire', url: '/?gate=intermediate&lang=fr' },
        { name: 'Accueil Expert', url: '/?gate=expert&lang=fr' },
        { name: 'Plateau Guidé', url: '/play?gate=beginner&start=guided&lang=fr' },
        { name: 'Puzzles', url: '/puzzles?lang=fr' },
        { name: 'Studio Analyse', url: '/analysis?lang=fr' },
        { name: 'Gammon Academy', url: '/academy?lang=fr' },
        { name: 'Tournois & Clubs', url: '/tournaments?lang=fr' },
    ];

    for (const screen of SCREENS_FOR_GOLD_CTA) {
        test(`3. Un seul bouton principal plein or (#D4AF37) visible sur : ${screen.name}`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto(screen.url, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(800);

            const goldButtons = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('button, a[role="button"]'));
                const visibleGoldButtons: Array<{ text: string; testId: string | null; bg: string }> = [];

                elements.forEach((el) => {
                    const rect = el.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && rect.top < 900 && rect.bottom > 0;
                    if (!isVisible) return;

                    const style = window.getComputedStyle(el);
                    const bg = style.backgroundColor;
                    const bgImg = style.backgroundImage;
                    const cls = el.className || '';

                    // Bouton plein or : fond solide #D4AF37 ou gradient plein or (#E5C158 / #D4AF37)
                    // Exclut les fonds translucides (bg-[#D4AF37]/10, bg-white/5, etc.)
                    const isSolidGoldBg = (
                        bg === 'rgb(212, 175, 55)' ||
                        bg === 'rgb(229, 193, 88)' ||
                        cls.includes('bg-[#D4AF37]') ||
                        cls.includes('bg-[#d4af37]')
                    ) && !cls.includes('/10') && !cls.includes('/15') && !cls.includes('/20') && !cls.includes('/25') && !cls.includes('/30') && !cls.includes('/40');

                    const isSolidGoldGradient = (
                        (cls.includes('from-[#E5C158]') || cls.includes('from-[#e5c158]') || bgImg.includes('229, 193, 88')) &&
                        !cls.includes('/10') && !cls.includes('/15')
                    );

                    if (isSolidGoldBg || isSolidGoldGradient) {
                        visibleGoldButtons.push({
                            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
                            testId: el.getAttribute('data-testid'),
                            bg: isSolidGoldBg ? 'solid-gold' : 'gold-gradient',
                        });
                    }
                });

                return visibleGoldButtons;
            });

            // Au maximum 1 seul bouton plein or visible sur l'écran (hiérarchie visuelle stricte)
            expect(
                goldButtons.length,
                `Plus de 1 bouton plein or visible sur ${screen.name} (${goldButtons.length} trouvés) :\n` +
                goldButtons.map((b) => ` - [${b.testId ?? 'sans-testid'}]: "${b.text}" (${b.bg})`).join('\n')
            ).toBeLessThanOrEqual(1);
        });
    }
});
